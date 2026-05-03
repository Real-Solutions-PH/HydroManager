import uuid

from sqlmodel import Session, col, func, select

from app.modules.library_pests.models import LibraryPest
from app.modules.library_seed_data import load_seed_json


def get_by_id(*, session: Session, pest_id: uuid.UUID) -> LibraryPest | None:
    return session.get(LibraryPest, pest_id)


def get_multi(
    *,
    session: Session,
    query: str | None = None,
    kind: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[LibraryPest], int]:
    count_q = select(func.count()).select_from(LibraryPest)
    list_q = (
        select(LibraryPest)
        .order_by(col(LibraryPest.name).asc())
        .offset(skip)
        .limit(limit)
    )
    if query:
        like = f"%{query.lower()}%"
        cond = func.lower(LibraryPest.name).like(like)
        count_q = count_q.where(cond)
        list_q = list_q.where(cond)
    if kind:
        count_q = count_q.where(LibraryPest.kind == kind)
        list_q = list_q.where(LibraryPest.kind == kind)
    count = session.exec(count_q).one()
    rows = session.exec(list_q).all()
    return list(rows), count


def seed_if_empty(*, session: Session) -> int:
    rows = load_seed_json("pests.json")
    if not rows:
        return 0
    existing = {
        p.name: p for p in session.exec(select(LibraryPest)).all()
    }
    changed = 0
    try:
        for row in rows:
            key = row.get("name")
            current = existing.get(key) if key else None
            if current is None:
                session.add(LibraryPest(**row))
                changed += 1
            else:
                dirty = False
                for field, value in row.items():
                    if getattr(current, field, None) != value:
                        setattr(current, field, value)
                        dirty = True
                if dirty:
                    session.add(current)
                    changed += 1
        session.commit()
    except Exception:
        session.rollback()
        raise
    return changed
