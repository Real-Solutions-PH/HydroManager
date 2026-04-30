"""Repo for crop_stat: recompute aggregates and read them back."""

from datetime import datetime, timezone

from sqlmodel import Session, select

from app.modules.crops.models import CropGuide
from app.modules.crops.stats_models import CropStat
from app.modules.crops.stats_service import (
    aggregate_range,
    aggregate_scalar,
    parse_range_string,
)

_NUMERIC_RANGE_FIELDS: list[tuple[str, str, str]] = [
    ("ph", "ph_min", "ph_max"),
    ("ec", "ec_min", "ec_max"),
    ("days_to_harvest", "days_to_harvest_min", "days_to_harvest_max"),
    (
        "local_price_php_per_kg",
        "local_price_php_per_kg_min",
        "local_price_php_per_kg_max",
    ),
]

_STRING_RANGE_FIELDS: list[str] = [
    "sunlight_hours",
    "growlight_hours",
    "temperature_day_c",
    "temperature_night_c",
    "water_temp_c",
    "humidity_pct",
]

_SCALAR_FIELDS: list[str] = [
    "typical_yield_grams",
]


def recompute_stats(*, session: Session) -> int:
    """Wipe and recompute crop_stat. Returns the number of fields written."""
    crops = session.exec(select(CropGuide)).all()
    aggregates: dict[str, tuple[float, float, float]] = {}

    for key, min_attr, max_attr in _NUMERIC_RANGE_FIELDS:
        pairs = [
            (getattr(c, min_attr), getattr(c, max_attr))
            for c in crops
            if getattr(c, min_attr) is not None and getattr(c, max_attr) is not None
        ]
        result = aggregate_range(pairs)
        if result is not None:
            aggregates[key] = result

    for field_name in _STRING_RANGE_FIELDS:
        parsed_pairs = []
        for c in crops:
            parsed = parse_range_string(getattr(c, field_name))
            if parsed is not None:
                parsed_pairs.append(parsed)
        result = aggregate_range(parsed_pairs)
        if result is not None:
            aggregates[field_name] = result

    for field_name in _SCALAR_FIELDS:
        values = [getattr(c, field_name) for c in crops]
        result = aggregate_scalar(v for v in values if v is not None)
        if result is not None:
            aggregates[field_name] = result

    for stat in session.exec(select(CropStat)).all():
        session.delete(stat)
    session.flush()

    now = datetime.now(timezone.utc)
    for key, (min_v, max_v, avg_v) in aggregates.items():
        session.add(
            CropStat(
                field=key,
                min_value=min_v,
                max_value=max_v,
                avg_value=avg_v,
                updated_at=now,
            )
        )
    session.commit()
    return len(aggregates)


def get_all_stats(*, session: Session) -> list[CropStat]:
    return list(session.exec(select(CropStat)).all())
