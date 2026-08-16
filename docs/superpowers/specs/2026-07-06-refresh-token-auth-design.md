# Refresh-token auth + expired-token fix — Design

**Date:** 2026-07-06
**Status:** Approved decisions; pending spec review

## Problem

After ~8 days of not opening the app, users appear logged in but no data (and no
weather) loads; only logout + login fixes it.

**Root cause (verified):**
1. Access token is the *only* credential and expires after 8 days
   (`ACCESS_TOKEN_EXPIRE_MINUTES = 60*24*8`). There is no refresh mechanism.
2. When it expires, the backend's `get_current_user` catches `ExpiredSignatureError`
   (a subclass of `InvalidTokenError`) and returns **403**, not 401
   (`app/modules/iam/deps.py:28-32`).
3. The frontend axios interceptor only logs out on **401**
   (`mobile/src/lib/auth.ts`). A 403 is ignored.
4. `isAuthenticated` is persisted (zustand/MMKV) and is the only gate for the
   `(app)` group, so the app stays "logged in" while every authenticated request
   — including weather, which proxies through the backend — fails with 403.

## Goals

- Expired/invalid credentials no longer silently break the app.
- Sessions stay alive without re-login for 30 days via a refresh token.
- Refresh tokens are revocable server-side (DB-backed), supporting real logout.

## Decisions (locked)

- **DB-backed refresh tokens** (not stateless JWT). Matches the need for
  server-side revocation.
- **Lifetimes:** access token **60 min**, refresh token **30 days**.
- **Rotation:** refresh rotates — each successful refresh deletes the old row and
  issues a new refresh token.

## Design

### Part 1 — the status-code fix

`app/modules/iam/deps.py`: change the credential-validation failure from
`HTTP_403_FORBIDDEN` to `HTTP_401_UNAUTHORIZED`. Legitimate 403s (quota,
"not enough privileges") are untouched — only the token-validation path changes.

This alone makes an expired token trigger the existing 401 handling. Part 2 makes
that handling *refresh* instead of *log out*.

### Part 2 — DB-backed refresh tokens

**Token shapes**
- Access token: JWT, 60 min (unchanged shape). No new claims needed.
- Refresh token: opaque high-entropy string (`secrets.token_urlsafe(32)`), 30 day
  expiry. Stored **hashed** (SHA-256) in the DB. Opaque-vs-JWT separation means an
  access token and a refresh token can never be swapped — no `type` claim needed.

  SHA-256 (not argon2/bcrypt) is correct here: the token is 256-bit random, so
  there is no low-entropy password to slow-hash against.

**New table `refreshtoken`** (`app/modules/iam/auth/models.py`)
| column      | type                    | notes                                  |
|-------------|-------------------------|----------------------------------------|
| id          | uuid pk                 | `default_factory=uuid.uuid4`           |
| user_id     | uuid FK user.id CASCADE | indexed                                |
| token_hash  | str                     | unique index; SHA-256 hex of the token |
| expires_at  | datetime(tz)            |                                        |
| created_at  | datetime(tz)            | `_utcnow` default, matches User model  |

Re-export the model in `app/db/models.py` so alembic autogenerate sees it.
Hand-written migration chained onto the current alembic head (resolve via
`alembic heads` at implementation — there may be multiple; pick the true tip).

**Config** (`app/core/config.py`)
- `ACCESS_TOKEN_EXPIRE_MINUTES = 60` (was `60*24*8`)
- `REFRESH_TOKEN_EXPIRE_MINUTES = 60*24*30`

**security.py** — add `generate_refresh_token() -> str` (opaque) and
`hash_token(token: str) -> str` (SHA-256 hex).

**repo** (`app/modules/iam/auth/repo.py`) — `create`, `get_by_hash`,
`delete`/`delete_by_hash`. Keyword-only `session=` args, matching users/repo.py.

**services.py**
- `login()`: authenticate → mint access token (60 min) + refresh token; store its
  hash with a 30-day `expires_at`; return `Token(access_token, refresh_token)`.
- `refresh(session, refresh_token) -> Token`: hash → look up row. Missing or
  past `expires_at` → raise `HTTPException(401)`. Else **rotate**: delete old row,
  create new refresh token + row, mint new access token, return both.
- `logout(session, refresh_token) -> None`: `delete_by_hash` (idempotent).

**routes.py**
- `POST /login/access-token` — same signature, now returns both tokens.
- `POST /login/refresh-token` — body `RefreshRequest{refresh_token}` → `Token`.
  **No auth dependency** (it's how you obtain a fresh access token).
- `POST /logout` — body `RefreshRequest{refresh_token}`, **no auth dependency**
  (so it revokes even when the access token is already expired). Returns `Message`.

**schema.py** — `Token` gains `refresh_token: str`; add
`RefreshRequest(SQLModel){refresh_token: str}`.

### Part 3 — frontend (`mobile/src/lib/auth.ts`, `hooks/useAuth.ts`)

- Add `REFRESH_TOKEN_KEY` with `get/set/clearRefreshToken` (SecureStore native /
  localStorage web), mirroring the access-token helpers. `handleUnauthorized` and
  `logout` clear **both** tokens.
- **Refresh-on-401 interceptor**: on a 401 that is not an auth endpoint
  (`/login/access-token`, `/users/signup`, `/login/refresh-token`) and not already
  retried (`config._retry`):
  1. Set `_retry` on the request.
  2. Refresh via a **single shared in-flight promise** (`refreshPromise`) so
     concurrent 401s trigger exactly one refresh call. The refresh call uses a bare
     `axios` (not the `api` instance) to avoid interceptor recursion.
  3. On success: store new access + refresh tokens, replay the original request
     with the new bearer.
  4. On failure (no refresh token, or refresh 401): `handleUnauthorized()`.
- `login` onSuccess stores the refresh token too.
- `logout` posts `{refresh_token}` to `/logout`, then clears both tokens locally
  (already wrapped in try/catch for offline).

## Error handling

- Expired **access** token → 401 → interceptor refreshes → transparent retry.
- Expired/invalid/rotated **refresh** token → refresh endpoint 401 →
  `handleUnauthorized` → clear tokens → redirect to `/login`.
- Refresh network failure → treated as failure → redirect to login (no infinite
  retry; `_retry` guards it).

## Testing (backend, against local `app_test_ci` on port 5433 — never default env)

- Expired/invalid access token → **401** (regression test for the root cause).
- `login` returns both tokens; refresh row exists.
- `refresh` happy path: returns new access + new refresh; the old refresh token is
  rejected afterward (rotation).
- `refresh` with unknown/expired token → 401.
- `logout` deletes the row; subsequent refresh with that token → 401.

## Deliberate simplifications (ponytail ceilings)

- **No reuse-detection breach response.** A replayed rotated token just 401s; we
  don't revoke the whole family. Upgrade path: add `revoked_at` + detect replay.
- **No expired-row cleanup job.** Expired rows linger harmlessly (guarded by
  `expires_at`). Upgrade path: periodic `DELETE WHERE expires_at < now()`.
- **No "logout everywhere."** The model supports it (delete all rows for a user);
  not wired to an endpoint yet.

## Out of scope

- Changing storage from MMKV/SecureStore/localStorage.
- Any UI change beyond transparent session continuation.
