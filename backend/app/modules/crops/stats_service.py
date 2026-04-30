"""Helpers for computing crop dataset aggregates."""

from collections.abc import Iterable


def parse_range_string(value: str | None) -> tuple[float, float] | None:
    """Parse a string like "5-7" or "22.5 - 28" into a (min, max) tuple.

    Returns None when the input is null, malformed, or has min > max.
    """
    if not value:
        return None
    parts = value.split("-")
    if len(parts) != 2:
        return None
    try:
        lo = float(parts[0].strip())
        hi = float(parts[1].strip())
    except ValueError:
        return None
    if lo > hi:
        return None
    return lo, hi


def aggregate_range(
    pairs: Iterable[tuple[float, float]],
) -> tuple[float, float, float] | None:
    """Aggregate a sequence of (min, max) tuples into (overall_min, overall_max, avg_of_midpoints).

    Returns None when pairs is empty.
    """
    pairs_list = list(pairs)
    if not pairs_list:
        return None
    overall_min = min(p[0] for p in pairs_list)
    overall_max = max(p[1] for p in pairs_list)
    midpoints = [(p[0] + p[1]) / 2 for p in pairs_list]
    avg = sum(midpoints) / len(midpoints)
    return overall_min, overall_max, avg


def aggregate_scalar(values: Iterable[float]) -> tuple[float, float, float] | None:
    """Aggregate a sequence of scalar values into (min, max, avg). Returns None when empty."""
    values_list = [v for v in values if v is not None]
    if not values_list:
        return None
    return min(values_list), max(values_list), sum(values_list) / len(values_list)
