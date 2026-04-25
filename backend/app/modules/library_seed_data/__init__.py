"""JSON-backed dummy data for the Library tab.

Each module's repo loads its corresponding JSON file via
``load_seed_json("crops.json")``. Swap the loader in
``app/modules/library_seed_data/loader.py`` when migrating to a real
content source — schemas, routes, and mobile contract stay identical.
"""

from app.modules.library_seed_data.loader import load_seed_json

__all__ = ["load_seed_json"]
