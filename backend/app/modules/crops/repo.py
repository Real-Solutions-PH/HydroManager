import uuid

from sqlmodel import Session, col, func, or_, select

from app.modules.crops.models import CropGuide
from app.modules.library_seed_data import load_seed_json


def get_by_id(*, session: Session, crop_id: uuid.UUID) -> CropGuide | None:
    return session.get(CropGuide, crop_id)


def get_multi(
    *,
    session: Session,
    query: str | None = None,
    category: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[CropGuide], int]:
    count_q = select(func.count()).select_from(CropGuide)
    list_q = (
        select(CropGuide).order_by(col(CropGuide.name_en).asc()).offset(skip).limit(limit)
    )
    if query:
        like = f"%{query.lower()}%"
        cond = or_(
            func.lower(CropGuide.name_en).like(like),
            func.lower(CropGuide.name_tl).like(like),
        )
        count_q = count_q.where(cond)
        list_q = list_q.where(cond)
    if category:
        count_q = count_q.where(CropGuide.category == category)
        list_q = list_q.where(CropGuide.category == category)
    count = session.exec(count_q).one()
    rows = session.exec(list_q).all()
    return list(rows), count


def seed_if_empty(*, session: Session) -> int:
    from app.modules.crops.stats_repo import recompute_stats

    rows = load_seed_json("crops.json")
    if not rows:
        return 0
    existing = {
        c.name_en: c for c in session.exec(select(CropGuide)).all()
    }
    changed = 0
    try:
        for row in rows:
            key = row.get("name_en")
            current = existing.get(key) if key else None
            if current is None:
                session.add(CropGuide(**row))
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
    if changed:
        recompute_stats(session=session)
    return changed
