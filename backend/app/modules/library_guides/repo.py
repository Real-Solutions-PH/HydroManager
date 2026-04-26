import uuid

from sqlmodel import Session, col, delete, func, or_, select

from app.core.config import settings
from app.modules.library_guides.models import LibraryGuide
from app.modules.library_seed_data import load_seed_json


def get_by_id(*, session: Session, guide_id: uuid.UUID) -> LibraryGuide | None:
    return session.get(LibraryGuide, guide_id)


def get_multi(
    *,
    session: Session,
    query: str | None = None,
    category: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[LibraryGuide], int]:
    count_q = select(func.count()).select_from(LibraryGuide)
    list_q = (
        select(LibraryGuide)
        .order_by(col(LibraryGuide.title).asc())
        .offset(skip)
        .limit(limit)
    )
    if query:
        like = f"%{query.lower()}%"
        cond = or_(
            func.lower(LibraryGuide.title).like(like),
            func.lower(LibraryGuide.summary).like(like),
        )
        count_q = count_q.where(cond)
        list_q = list_q.where(cond)
    if category:
        count_q = count_q.where(LibraryGuide.category == category)
        list_q = list_q.where(LibraryGuide.category == category)
    count = session.exec(count_q).one()
    rows = session.exec(list_q).all()
    return list(rows), count


def seed_if_empty(*, session: Session) -> int:
    existing = session.exec(select(func.count()).select_from(LibraryGuide)).one()
    if existing > 0 and not settings.LIBRARY_SEED_FORCE_REFRESH:
        return 0
    if existing > 0:
        session.exec(delete(LibraryGuide))
        session.commit()
    rows = load_seed_json("guides.json")
    for row in rows:
        session.add(LibraryGuide(**row))
    session.commit()
    return len(rows)
