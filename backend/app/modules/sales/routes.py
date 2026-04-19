import uuid
from typing import Any

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.modules.iam.deps import CurrentUser
from app.modules.sales import services as sales_service
from app.modules.sales.schema import (
    Dashboard,
    OverheadCreate,
    OverheadPublic,
    SaleCreate,
    SaleDetail,
    SaleItemPublic,
    SalePublic,
    SalesPublic,
)
from app.shared.deps import SessionDep
from app.shared.schema import Message

router = APIRouter(prefix="/sales", tags=["sales"])


def _to_detail(s) -> SaleDetail:
    base = SalePublic.model_validate(s, from_attributes=True)
    items = [
        SaleItemPublic.model_validate(i, from_attributes=True) for i in s.items
    ]
    return SaleDetail(**base.model_dump(), items=items)


@router.get("/", response_model=SalesPublic)
def list_sales(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    rows, count = sales_service.list_sales(
        session=session, current_user=current_user, skip=skip, limit=limit
    )
    return SalesPublic(data=[_to_detail(s) for s in rows], count=count)


@router.post("/", response_model=SaleDetail)
def create_sale(
    *, session: SessionDep, current_user: CurrentUser, data: SaleCreate
) -> Any:
    s = sales_service.create_sale(
        session=session, current_user=current_user, data=data
    )
    return _to_detail(s)


@router.delete("/{id}")
def delete_sale(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    sales_service.delete_sale(
        session=session, current_user=current_user, sale_id=id
    )
    return Message(message="Sale deleted successfully")


@router.get("/overheads", response_model=list[OverheadPublic])
def list_overheads(session: SessionDep, current_user: CurrentUser) -> Any:
    rows = sales_service.list_overheads(
        session=session, current_user=current_user
    )
    return [OverheadPublic.model_validate(r, from_attributes=True) for r in rows]


@router.post("/overheads", response_model=OverheadPublic)
def add_overhead(
    *, session: SessionDep, current_user: CurrentUser, data: OverheadCreate
) -> Any:
    return sales_service.add_overhead(
        session=session, current_user=current_user, data=data
    )


@router.get("/dashboard", response_model=Dashboard)
def dashboard(session: SessionDep, current_user: CurrentUser) -> Any:
    return sales_service.dashboard(
        session=session, current_user=current_user
    )


@router.get("/export.csv", response_class=PlainTextResponse)
def export_csv(session: SessionDep, current_user: CurrentUser) -> str:
    return sales_service.export_csv(
        session=session, current_user=current_user
    )
