import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlmodel import Session, col, func, select

from app.modules.hydro_common.quota import require_tier
from app.modules.iam.users.models import User
from app.modules.iam.users.schema import UserTier
from app.modules.inventory.models import InventoryMovement
from app.modules.sales.models import OverheadCost, Sale, SaleItem
from app.modules.sales.schema import (
    Dashboard,
    OverheadCreate,
    SaleCreate,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def list_sales(
    *,
    session: Session,
    current_user: User,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Sale], int]:
    if not current_user.is_superuser:
        require_tier(current_user.tier, at_least=UserTier.pro)
    count_q = select(func.count()).select_from(Sale).where(
        Sale.owner_id == current_user.id
    )
    list_q = (
        select(Sale)
        .where(Sale.owner_id == current_user.id)
        .order_by(col(Sale.sold_at).desc())
        .offset(skip)
        .limit(limit)
    )
    count = session.exec(count_q).one()
    rows = session.exec(list_q).all()
    return list(rows), count


def create_sale(
    *, session: Session, current_user: User, data: SaleCreate
) -> Sale:
    if not current_user.is_superuser:
        require_tier(current_user.tier, at_least=UserTier.pro)
    if not data.items:
        raise HTTPException(
            status_code=400, detail="Sale must have at least one item."
        )
    sale = Sale(
        owner_id=current_user.id,
        buyer_label=data.buyer_label,
        channel=data.channel,
        sold_at=data.sold_at or _now(),
        payment_status=data.payment_status,
        notes=data.notes,
    )
    session.add(sale)
    session.flush()
    for it in data.items:
        session.add(
            SaleItem(
                sale_id=sale.id,
                crop_name=it.crop_name,
                quantity=it.quantity,
                unit=it.unit,
                unit_price=it.unit_price,
                linked_batch_id=it.linked_batch_id,
            )
        )
    session.commit()
    session.refresh(sale)
    return sale


def delete_sale(
    *, session: Session, current_user: User, sale_id: uuid.UUID
) -> None:
    if not current_user.is_superuser:
        require_tier(current_user.tier, at_least=UserTier.pro)
    sale = session.get(Sale, sale_id)
    if not sale or sale.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Sale not found")
    session.delete(sale)
    session.commit()


def list_overheads(
    *, session: Session, current_user: User
) -> list[OverheadCost]:
    if not current_user.is_superuser:
        require_tier(current_user.tier, at_least=UserTier.pro)
    q = select(OverheadCost).where(OverheadCost.owner_id == current_user.id)
    return list(session.exec(q).all())


def add_overhead(
    *, session: Session, current_user: User, data: OverheadCreate
) -> OverheadCost:
    if not current_user.is_superuser:
        require_tier(current_user.tier, at_least=UserTier.pro)
    o = OverheadCost(
        owner_id=current_user.id,
        category=data.category,
        monthly_cost=data.monthly_cost,
        effective_from=data.effective_from or _now(),
    )
    session.add(o)
    session.commit()
    session.refresh(o)
    return o


def _sum_sales(
    *, session: Session, user_id: uuid.UUID, start: datetime
) -> float:
    q = (
        select(func.coalesce(func.sum(SaleItem.quantity * SaleItem.unit_price), 0))
        .select_from(SaleItem)
        .join(Sale, SaleItem.sale_id == Sale.id)
        .where(Sale.owner_id == user_id, Sale.sold_at >= start)
    )
    result = session.exec(q).one()
    return float(result) if result is not None else 0.0


def _sum_cogs(
    *, session: Session, user_id: uuid.UUID, start: datetime
) -> float:
    q = (
        select(func.coalesce(func.sum(InventoryMovement.cost_total), 0))
        .where(
            InventoryMovement.occurred_at >= start,
            InventoryMovement.movement_type == "restock",
        )
    )
    result = session.exec(q).one()
    base = float(result) if result is not None else 0.0
    monthly_overhead = session.exec(
        select(func.coalesce(func.sum(OverheadCost.monthly_cost), 0)).where(
            OverheadCost.owner_id == user_id
        )
    ).one()
    days = max((_now() - start).days, 1)
    prorated = float(monthly_overhead or 0) * (days / 30.0)
    return base + prorated


def dashboard(*, session: Session, current_user: User) -> Dashboard:
    if not current_user.is_superuser:
        require_tier(current_user.tier, at_least=UserTier.pro)
    now = _now()
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    year_start = datetime(now.year, 1, 1, tzinfo=timezone.utc)
    d90 = now - timedelta(days=90)

    gm = _sum_sales(session=session, user_id=current_user.id, start=month_start)
    g90 = _sum_sales(session=session, user_id=current_user.id, start=d90)
    gy = _sum_sales(session=session, user_id=current_user.id, start=year_start)
    cm = _sum_cogs(session=session, user_id=current_user.id, start=month_start)
    c90 = _sum_cogs(session=session, user_id=current_user.id, start=d90)
    cy = _sum_cogs(session=session, user_id=current_user.id, start=year_start)
    net_margin = ((gy - cy) / gy * 100) if gy > 0 else 0.0

    by_crop: dict[str, float] = defaultdict(float)
    by_channel: dict[str, float] = defaultdict(float)
    items_q = (
        select(SaleItem, Sale)
        .join(Sale, SaleItem.sale_id == Sale.id)
        .where(Sale.owner_id == current_user.id, Sale.sold_at >= d90)
    )
    for si, s in session.exec(items_q).all():
        rev = (si.quantity or 0) * (si.unit_price or 0)
        by_crop[si.crop_name] += rev
        by_channel[s.channel.value] += rev

    top_crops = [
        {"crop": k, "revenue": round(v, 2)}
        for k, v in sorted(by_crop.items(), key=lambda x: -x[1])[:5]
    ]
    channel_revenue = [
        {"channel": k, "revenue": round(v, 2)} for k, v in by_channel.items()
    ]

    return Dashboard(
        gross_current_month=round(gm, 2),
        gross_last_90_days=round(g90, 2),
        gross_ytd=round(gy, 2),
        cogs_current_month=round(cm, 2),
        cogs_last_90_days=round(c90, 2),
        cogs_ytd=round(cy, 2),
        net_margin_pct=round(net_margin, 2),
        top_crops=top_crops,
        channel_revenue=channel_revenue,
    )


def export_csv(*, session: Session, current_user: User) -> str:
    if not current_user.is_superuser:
        require_tier(current_user.tier, at_least=UserTier.pro)
    q = (
        select(Sale, SaleItem)
        .join(SaleItem, SaleItem.sale_id == Sale.id)
        .where(Sale.owner_id == current_user.id)
        .order_by(col(Sale.sold_at).desc())
    )
    lines = [
        "sold_at,buyer,channel,payment_status,crop_name,quantity,unit,unit_price,total,batch_id"
    ]
    for s, si in session.exec(q).all():
        total = (si.quantity or 0) * (si.unit_price or 0)
        lines.append(
            ",".join(
                [
                    s.sold_at.isoformat(),
                    (s.buyer_label or "").replace(",", " "),
                    s.channel.value,
                    s.payment_status.value,
                    si.crop_name.replace(",", " "),
                    f"{si.quantity}",
                    si.unit,
                    f"{si.unit_price:.2f}",
                    f"{total:.2f}",
                    str(si.linked_batch_id or ""),
                ]
            )
        )
    return "\n".join(lines)
