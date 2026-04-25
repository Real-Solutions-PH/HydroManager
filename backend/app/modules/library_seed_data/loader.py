import json
from pathlib import Path
from typing import Any

_DATA_DIR = Path(__file__).parent


def load_seed_json(filename: str) -> list[dict[str, Any]]:
    path = _DATA_DIR / filename
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"{filename} must contain a JSON array")
    return data
