"""Restore data deleted by the test teardown on 2026-05-19.

Re-creates 6 setups, 9 batches, and 77 inventory items based on screenshots
and the Shopee purchase list provided by the owner.

Usage:
    cd backend
    # 1) dry-run (default): prints plan, rolls back, writes nothing
    uv run python scripts/restore_deleted_data.py

    # 2) commit for real
    DRY_RUN=0 uv run python scripts/restore_deleted_data.py

    # 3) override owner email (defaults to FIRST_SUPERUSER from .env)
    OWNER_EMAIL=your@email.com uv run python scripts/restore_deleted_data.py

The script is idempotent on name: re-running won't double-insert items,
setups, or batches that already exist with the same name for the owner.
"""
from __future__ import annotations

import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Make `app` importable when run as a script from backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlmodel import Session, create_engine, select  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.modules.batches.models import Batch, BatchStateCount, BatchTransition  # noqa: E402
from app.modules.batches.schema import Milestone  # noqa: E402
from app.modules.iam.users.models import User  # noqa: E402
from app.modules.inventory.models import InventoryItem, InventoryMovement  # noqa: E402
from app.modules.inventory.schema import (  # noqa: E402
    InventoryCategory,
    InventoryUnit,
    MovementType,
)
from app.modules.setups.models import Setup, SetupSlot  # noqa: E402
from app.modules.setups.schema import SetupType, SlotStatus  # noqa: E402

DRY_RUN = os.environ.get("DRY_RUN", "1") != "0"
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", settings.FIRST_SUPERUSER)

# ----------------------------- DATA -----------------------------------------

SETUPS: list[dict] = [
    {"name": "DFT-A", "type": SetupType.DFT, "slot_count": 20, "location_label": None},
    {"name": "Kratky (pending)", "type": SetupType.Kratky, "slot_count": 100, "location_label": "Greenhouse"},
    {"name": "Dutch Buket (Pending)", "type": SetupType.DutchBucket, "slot_count": 50, "location_label": "SSE Corridor / Greenhouse"},
    {"name": "Dutch Bucket Main", "type": SetupType.DutchBucket, "slot_count": 22, "location_label": "SSE Corridor"},
    {"name": "Kratky 1", "type": SetupType.Kratky, "slot_count": 8, "location_label": "SSE Corridor / Greenhouse"},
    {"name": "DFT 1", "type": SetupType.DFT, "slot_count": 109, "location_label": "SSE Corridor / Greenhouse 1"},
]

SLOT_PREFIX = {
    "DFT": "DFT",
    "NFT": "NFT",
    "DutchBucket": "DB",
    "Kratky": "KRT",
    "SNAP": "SNP",
}


def _date(y: int, m: int, d: int) -> datetime:
    return datetime(y, m, d, tzinfo=timezone.utc)


# Batches reconstructed from screenshots in
# /Users/kairusnoahtecson/Documents/Existing Data Deleted/
# Each entry: setup name, variety, started_at, slots_used, seeds_per_slot,
# initial_count, and the current state-count map.
BATCHES: list[dict] = [
    {
        "code_hint": "A-001",
        "setup_name": "DFT 1",
        "variety_name": "Thai Basil",
        "started_at": _date(2026, 4, 10),
        "slots_used": 10,
        "seeds_per_slot": 1,
        "initial_count": 10,
        "state": {Milestone.Flowering: 10},
    },
    {
        "code_hint": "A-002",
        "setup_name": "DFT 1",
        "variety_name": "Lettuce (Olmetie)",
        "started_at": _date(2026, 4, 10),
        "slots_used": 6,
        "seeds_per_slot": 1,
        "initial_count": 6,
        "state": {Milestone.HarvestReady: 6},
    },
    {
        "code_hint": "B-001",
        "setup_name": "Kratky 1",
        "variety_name": "Tomato (Normal)",
        "started_at": _date(2026, 4, 10),
        "slots_used": 8,
        "seeds_per_slot": 1,
        "initial_count": 8,
        "state": {Milestone.Flowering: 8},
    },
    {
        "code_hint": "A-003",
        "setup_name": "DFT 1",
        "variety_name": "Kangkong",
        "started_at": _date(2026, 4, 23),
        "slots_used": 9,
        "seeds_per_slot": 1,
        "initial_count": 9,
        "state": {Milestone.Transplanted: 9},
    },
    {
        "code_hint": "A-004",
        "setup_name": "DFT 1",
        "variety_name": "Lettuce (Olmetie)",
        "started_at": _date(2026, 4, 23),
        "slots_used": 20,
        "seeds_per_slot": 1,
        "initial_count": 20,
        "state": {Milestone.Vegetative: 20},
    },
    {
        "code_hint": "C-001",
        "setup_name": "Dutch Bucket Main",
        "variety_name": "Cucumber",
        "started_at": _date(2026, 4, 23),
        "slots_used": 20,
        "seeds_per_slot": 1,
        "initial_count": 20,
        "state": {Milestone.TrueLeaves: 20},
    },
    {
        # Bell Pepper: 10 alive (TrueLeaves) + 10 Failed. Setup shows 18/50
        # slots used across both Pending Dutch Bucket batches, so the
        # failed-half here likely freed its slots. We allocate only the
        # currently-occupied slots (10).
        "code_hint": "D-001",
        "setup_name": "Dutch Buket (Pending)",
        "variety_name": "Bell Pepper",
        "started_at": _date(2026, 4, 23),
        "slots_used": 10,
        "seeds_per_slot": 2,
        "initial_count": 20,
        "state": {Milestone.TrueLeaves: 10, Milestone.Failed: 10},
    },
    {
        "code_hint": "D-002",
        "setup_name": "Dutch Buket (Pending)",
        "variety_name": "Tomato (Cherry)",
        "started_at": _date(2026, 4, 23),
        "slots_used": 8,
        "seeds_per_slot": 1,
        "initial_count": 10,
        "state": {Milestone.TrueLeaves: 10},
    },
    {
        "code_hint": "A-005",
        "setup_name": "DFT 1",
        "variety_name": "Kangkong",
        "started_at": _date(2026, 5, 2),
        "slots_used": 11,
        "seeds_per_slot": 1,
        "initial_count": 11,
        "state": {Milestone.Transplanted: 11},
    },
]

# Inventory items from Shopee completed orders. Tuple shape:
#   (name, category, unit, qty, unit_cost, notes)
# unit_cost is per-unit (in pieces/grams/ml/liters). qty * unit_cost is
# recorded as the restock movement cost_total.
INVENTORY: list[tuple[str, InventoryCategory, InventoryUnit, float, float | None, str]] = [
    # ---- SEEDS (29) ----
    ("Fujisawa Melon (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 10, 28.00, "Katanim Fruit Bearing"),
    ("Bok Choi (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 1, 120.00, "Packet count unknown - adjust manually"),
    ("Chinese Kale (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 1, 150.00, "Packet count unknown - adjust"),
    ("Spinach (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 1, 150.00, "Packet count unknown - adjust"),
    ("Sharapova RZ (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 10, 17.00, ""),
    ("Red Jet RZ (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 10, 21.00, ""),
    ("Taranto RZ (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 10, 21.00, ""),
    ("Bachata RZ (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 10, 22.00, ""),
    ("Aruru RZ (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 10, 30.00, ""),
    ("Eggplant Long Purple (Condor)", InventoryCategory.seeds, InventoryUnit.grams, 3, 22.67, "3g packet @ ₱68"),
    ("Patola Smooth (Condor)", InventoryCategory.seeds, InventoryUnit.grams, 7, 9.71, "7g packet @ ₱68"),
    ("Ampalaya Poseidon F1 (Condor)", InventoryCategory.seeds, InventoryUnit.grams, 3, 26.00, "3g @ ₱78"),
    # Okra is ordered twice (rows 13 and 16) - we set qty to combined 400.
    ("Okra Smooth Green (East-West)", InventoryCategory.seeds, InventoryUnit.pieces, 400, 0.495, "200 + 200 (re-ordered)"),
    ("Ampalaya Galaxy Max F1 (East-West)", InventoryCategory.seeds, InventoryUnit.pieces, 10, 9.90, ""),
    # Calixto is ordered twice (rows 15 and 17) - combined 600.
    ("Eggplant Calixto F1 (East-West)", InventoryCategory.seeds, InventoryUnit.pieces, 600, 0.33, "300 + 300 (re-ordered)"),
    ("Massilia RZ (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 10, 22.00, ""),
    ("Aikido RZ (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 10, 24.00, ""),
    ("Cengel RZ (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 10, 28.50, ""),
    ("Solarino RZ (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 10, 31.00, ""),
    ("Karillo RZ (Katanim)", InventoryCategory.seeds, InventoryUnit.pieces, 200, 1.75, ""),
    ("Olmetie", InventoryCategory.seeds, InventoryUnit.pieces, 100, 3.45, "Lettuce - 100 pcs @ ₱345"),
    ("Thai Basil (Premium)", InventoryCategory.seeds, InventoryUnit.pieces, 1000, 0.135, "1000 ct @ ₱135"),
    ("Lettuce (Organic, Generic)", InventoryCategory.seeds, InventoryUnit.pieces, 1500, 0.023, ""),
    ("Pechay (Organic, Generic)", InventoryCategory.seeds, InventoryUnit.pieces, 2000, 0.0345, ""),
    ("Tomato Super Rope (JRJ)", InventoryCategory.seeds, InventoryUnit.pieces, 60, 0.25, ""),
    ("Bell Pepper F1 (JRJ)", InventoryCategory.seeds, InventoryUnit.pieces, 40, 0.375, ""),
    ("Green Chili / Siling Panigang (JRJ)", InventoryCategory.seeds, InventoryUnit.pieces, 20, 1.00, ""),
    # ---- CONTAINERS / GROW SYSTEMS (16) ----
    ("8oz Styro Cups with Holes (25pcs)", InventoryCategory.equipment, InventoryUnit.pieces, 25, 3.56, "₱89 / 25"),
    ("Net Pots 1.5\" White (Heavy Duty)", InventoryCategory.equipment, InventoryUnit.pieces, 50, 4.20, "₱210 / 50"),
    ("Net Pots Clear (NutriHydro)", InventoryCategory.equipment, InventoryUnit.pieces, 3, 85.00, "qty=3 packets"),
    ("Tuna Box with Styro Cups (21 holes)", InventoryCategory.equipment, InventoryUnit.pieces, 2, 599.00, ""),
    ("Tuna Box with Styro Cups (8 holes)", InventoryCategory.equipment, InventoryUnit.pieces, 1, 539.00, ""),
    ("Dutch Bucket 11L (10 sets)", InventoryCategory.equipment, InventoryUnit.pieces, 10, 320.00, "₱3200 / 10"),
    ("LECA Expanded Clay 8-12mm", InventoryCategory.media, InventoryUnit.grams, 1000, 0.12, "1 kilo @ ₱120"),
    ("Measuring Cylinder 50ml (Plastic)", InventoryCategory.equipment, InventoryUnit.pieces, 3, 55.00, ""),
    ("Dutch Bucket Bato (4 sets)", InventoryCategory.equipment, InventoryUnit.pieces, 4, 349.75, "₱1399 / 4"),
    ("Rockwool Cubes 1x1\"", InventoryCategory.media, InventoryUnit.pieces, 200, 2.68, "2 packets x 100"),
    ("Styro Box (Size 105)", InventoryCategory.equipment, InventoryUnit.pieces, 1, 348.00, ""),
    ("Styro Box (Biggest)", InventoryCategory.equipment, InventoryUnit.pieces, 2, 471.00, ""),
    ("Seedling Dome Tray Large 35x50x8", InventoryCategory.equipment, InventoryUnit.pieces, 1, 500.00, "Plants by Flipay"),
    ("PVC Seedling Tray with Holes (6pcs)", InventoryCategory.equipment, InventoryUnit.pieces, 6, 44.83, "₱269 / 6"),
    ("PVC Seedling Tray No Holes (6pcs)", InventoryCategory.equipment, InventoryUnit.pieces, 6, 44.83, ""),
    ("Hydroponics NFT System (108 holes)", InventoryCategory.equipment, InventoryUnit.pieces, 1, 3884.00, ""),
    # ---- NUTRIENTS / PLANT CARE (6) ----
    ("Hydrogreen Solution A & B (1L)", InventoryCategory.nutrients, InventoryUnit.liters, 1, 375.00, ""),
    ("Cocopeat (Sterilized, 1 kilo)", InventoryCategory.media, InventoryUnit.grams, 1000, 0.03, "₱30 / 1kg"),
    ("KISS PLUS 10L + Chelated Iron Set", InventoryCategory.nutrients, InventoryUnit.liters, 10, 295.00, "₱2950 / 10L"),
    ("NutriHydro pH Adjuster Combo (Up + Down 250mL)", InventoryCategory.nutrients, InventoryUnit.milliliters, 500, 0.46, "₱230 / 500ml"),
    ("BIO-FLORAL Katanim Plant Wash", InventoryCategory.nutrients, InventoryUnit.pieces, 1, 480.00, "1 bottle"),
    ("Seed Spreader + Dibber & Widger Set (13pcs)", InventoryCategory.equipment, InventoryUnit.pieces, 13, 15.23, "₱198 / 13"),
    # ---- TOOLS / METERS (7) ----
    ("REEOPEE 5-in-1 Meter (PH/EC/TDS/Salinity/Temp)", InventoryCategory.equipment, InventoryUnit.pieces, 1, 388.00, ""),
    ("PH/TDS/Salinity/Thermometer Digital", InventoryCategory.equipment, InventoryUnit.pieces, 1, 338.00, ""),
    ("60ml Irrigation Syringe Pump (3pcs)", InventoryCategory.equipment, InventoryUnit.pieces, 3, 76.00, "₱228 / 3"),
    ("2L Watering Spray Pump", InventoryCategory.equipment, InventoryUnit.pieces, 1, 130.00, ""),
    ("Drip Irrigation Kit 10M (34pcs)", InventoryCategory.equipment, InventoryUnit.pieces, 1, 516.00, ""),
    ("Aquarium Water Pump 15W (Happy Aquarium)", InventoryCategory.equipment, InventoryUnit.pieces, 1, 676.00, ""),
    ("Aquarium Mini USB Air Pump", InventoryCategory.equipment, InventoryUnit.pieces, 2, 110.50, "₱221 / 2"),
    # ---- GREENHOUSE (9) ----
    ("UV Plastic Sheet 200μm 4mx10m", InventoryCategory.equipment, InventoryUnit.pieces, 3, 638.00, ""),
    ("Sunshade Net 50% Black 2x50m", InventoryCategory.equipment, InventoryUnit.pieces, 1, 819.00, ""),
    ("60Mesh Anti-Insect Bird Net 3x10m", InventoryCategory.equipment, InventoryUnit.pieces, 1, 488.00, ""),
    ("Magnetic Mesh Door Curtain 80x206", InventoryCategory.equipment, InventoryUnit.pieces, 2, 308.00, ""),
    ("Geotextile Landscape Fabric 2x10m", InventoryCategory.equipment, InventoryUnit.pieces, 1, 1000.00, "PioneerWorks"),
    ("Sun Shade Net Clip (50pcs)", InventoryCategory.equipment, InventoryUnit.pieces, 50, 3.78, "₱189 / 50"),
    ("Greenhouse Pipe Clip 32mm", InventoryCategory.equipment, InventoryUnit.pieces, 3, 89.00, ""),
    ("Stainless Steel Wire Rope 3mm (10m)", InventoryCategory.equipment, InventoryUnit.pieces, 3, 160.00, ""),
    ("Stainless Hose Clamp 2.5\" (10pcs/pack)", InventoryCategory.equipment, InventoryUnit.pieces, 30, 18.00, "3 packs x 10"),
    # ---- ELECTRICAL (5) ----
    ("Wifi Smart Plug 20A TUYA (batch 1)", InventoryCategory.equipment, InventoryUnit.pieces, 2, 329.00, ""),
    ("Wifi Smart Plug 20A TUYA (batch 2)", InventoryCategory.equipment, InventoryUnit.pieces, 3, 329.00, ""),
    ("OMNI Extension Cord 6M 2-Gang", InventoryCategory.equipment, InventoryUnit.pieces, 1, 680.00, ""),
    ("Zeus Extension Wire 10M", InventoryCategory.equipment, InventoryUnit.pieces, 1, 379.00, ""),
    ("BAVIN PC522 Multi-Port USB Charger", InventoryCategory.equipment, InventoryUnit.pieces, 2, 835.00, ""),
    # ---- HOSING / PIPING (3) ----
    ("IMUTO PVC Garden Hose 1/2\" 10M", InventoryCategory.equipment, InventoryUnit.pieces, 1, 288.00, ""),
    ("Hose Barb Brass DN8 4mm", InventoryCategory.equipment, InventoryUnit.pieces, 1, 79.00, ""),
    ("Hose Barb Brass DN6 4mm", InventoryCategory.equipment, InventoryUnit.pieces, 1, 69.00, ""),
    # ---- RACKS (2) ----
    ("Quick Rack Boltless 150kg 120x40x205", InventoryCategory.equipment, InventoryUnit.pieces, 1, 3199.00, ""),
    ("OKK Boltless Steel Rack 6 Layers", InventoryCategory.equipment, InventoryUnit.pieces, 1, 2008.00, ""),
]

# Match batch variety_name (lower) → inventory item name (lower) for seed
# inventory linking. Loose substring match.
SEED_LINK_HINTS: dict[str, str] = {
    "thai basil": "thai basil (premium)",
    "lettuce (olmetie)": "olmetie",
    "tomato (normal)": "tomato super rope (jrj)",
    "kangkong": "kangkong",  # no seed item exists - falls through to None
    "cucumber": "cucumber",  # no seed item exists - falls through
    "bell pepper": "bell pepper f1 (jrj)",
    "tomato (cherry)": "tomato super rope (jrj)",
}


# --------------------------- RESTORE LOGIC ----------------------------------


def get_user(session: Session) -> User:
    user = session.exec(select(User).where(User.email == OWNER_EMAIL)).first()
    if not user:
        raise SystemExit(
            f"User '{OWNER_EMAIL}' not found. Boot the backend once "
            f"(`make backend-prestart`) so init_db creates FIRST_SUPERUSER, "
            f"or pass OWNER_EMAIL=... pointing at an existing account."
        )
    return user


def get_or_create_setup(
    session: Session, user: User, data: dict
) -> tuple[Setup, bool]:
    existing = session.exec(
        select(Setup).where(
            Setup.owner_id == user.id, Setup.name == data["name"]
        )
    ).first()
    if existing:
        return existing, False
    setup = Setup(
        owner_id=user.id,
        name=data["name"],
        type=data["type"],
        slot_count=data["slot_count"],
        location_label=data["location_label"],
    )
    session.add(setup)
    session.flush()
    prefix = SLOT_PREFIX.get(data["type"].value, "SLT")
    for i in range(data["slot_count"]):
        session.add(
            SetupSlot(
                setup_id=setup.id,
                slot_code=f"{prefix}-{i + 1:03d}",
                position_index=i,
                status=SlotStatus.EMPTY,
            )
        )
    session.flush()
    return setup, True


def get_or_create_inventory(
    session: Session,
    user: User,
    name: str,
    category: InventoryCategory,
    unit: InventoryUnit,
    qty: float,
    unit_cost: float | None,
    notes: str,
) -> tuple[InventoryItem, bool]:
    existing = session.exec(
        select(InventoryItem).where(
            InventoryItem.owner_id == user.id, InventoryItem.name == name
        )
    ).first()
    if existing:
        return existing, False
    item = InventoryItem(
        owner_id=user.id,
        name=name,
        category=category,
        unit=unit,
        current_stock=qty,
        low_stock_threshold=0,
        unit_cost=unit_cost,
        notes=notes or None,
    )
    session.add(item)
    session.flush()
    cost_total = round(qty * unit_cost, 4) if unit_cost is not None else None
    session.add(
        InventoryMovement(
            item_id=item.id,
            movement_type=MovementType.restock,
            quantity=qty,
            cost_total=cost_total,
            notes="Initial restock from Shopee purchase history",
        )
    )
    return item, True


def get_or_create_batch(
    session: Session,
    user: User,
    setup: Setup,
    data: dict,
    seed_item_id: uuid.UUID | None,
) -> tuple[Batch, bool]:
    existing = session.exec(
        select(Batch).where(
            Batch.owner_id == user.id,
            Batch.setup_id == setup.id,
            Batch.variety_name == data["variety_name"],
            Batch.started_at == data["started_at"],
        )
    ).first()
    if existing:
        return existing, False
    batch = Batch(
        owner_id=user.id,
        setup_id=setup.id,
        variety_name=data["variety_name"],
        initial_count=data["initial_count"],
        slots_used=data["slots_used"],
        seeds_per_slot=data["seeds_per_slot"],
        started_at=data["started_at"],
        seed_inventory_item_id=seed_item_id,
    )
    session.add(batch)
    session.flush()

    # Record a synthetic Sowed → current-state transition so the state_counts
    # rows have provenance. (Real per-stage history is lost.)
    for milestone, count in data["state"].items():
        session.add(
            BatchStateCount(
                batch_id=batch.id,
                milestone_code=milestone,
                count=count,
            )
        )
        if milestone != Milestone.Sowed:
            session.add(
                BatchTransition(
                    batch_id=batch.id,
                    from_milestone=Milestone.Sowed,
                    to_milestone=milestone,
                    count=count,
                    occurred_at=data["started_at"],
                    notes="Reconstructed from screenshot on restore",
                    user_id=user.id,
                )
            )

    # Mark slots as PLANTED up to slots_used.
    free_slots = session.exec(
        select(SetupSlot)
        .where(
            SetupSlot.setup_id == setup.id,
            SetupSlot.batch_id.is_(None),  # type: ignore
            SetupSlot.status == SlotStatus.EMPTY,
        )
        .order_by(SetupSlot.position_index.asc())
        .limit(data["slots_used"])
    ).all()
    if len(free_slots) < data["slots_used"]:
        raise RuntimeError(
            f"Setup '{setup.name}' lacks empty slots for batch "
            f"'{data['variety_name']}' (need {data['slots_used']}, "
            f"have {len(free_slots)})"
        )
    for slot in free_slots:
        slot.batch_id = batch.id
        slot.status = SlotStatus.PLANTED
        session.add(slot)
    return batch, True


def main() -> None:
    mode = "DRY-RUN (rolls back)" if DRY_RUN else "COMMIT"
    print(f"=== Restore deleted data ===")
    print(f"Owner email : {OWNER_EMAIL}")
    print(f"Mode        : {mode}")
    print()

    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    with Session(engine) as session:
        user = get_user(session)
        print(f"Found user  : {user.email} ({user.id})")
        print()

        # ---- Setups ----
        setup_by_name: dict[str, Setup] = {}
        created_setups = 0
        for data in SETUPS:
            setup, created = get_or_create_setup(session, user, data)
            setup_by_name[data["name"]] = setup
            tag = "NEW" if created else "exists"
            print(f"  setup [{tag:6}] {setup.name} ({setup.type.value}, {setup.slot_count} slots)")
            if created:
                created_setups += 1
        print(f"  -> {created_setups} new setups")
        print()

        # ---- Inventory ----
        inventory_by_name: dict[str, InventoryItem] = {}
        created_items = 0
        total_cost = 0.0
        for (name, cat, unit, qty, cost, notes) in INVENTORY:
            item, created = get_or_create_inventory(
                session, user, name, cat, unit, qty, cost, notes
            )
            inventory_by_name[name.lower()] = item
            tag = "NEW" if created else "exists"
            cost_str = f"₱{(qty * cost):,.2f}" if cost is not None else "(no cost)"
            print(f"  item  [{tag:6}] {name:55} {qty:>7g} {unit.value:11} {cost_str}")
            if created and cost is not None:
                created_items += 1
                total_cost += qty * cost
        print(f"  -> {created_items} new items, ₱{total_cost:,.2f} total restock cost")
        print()

        # ---- Batches ----
        created_batches = 0
        for bdata in BATCHES:
            setup = setup_by_name[bdata["setup_name"]]
            seed_hint = SEED_LINK_HINTS.get(bdata["variety_name"].lower())
            seed_item = inventory_by_name.get(seed_hint) if seed_hint else None
            seed_id = seed_item.id if seed_item else None
            batch, created = get_or_create_batch(session, user, setup, bdata, seed_id)
            tag = "NEW" if created else "exists"
            link = f"seed→{seed_item.name}" if seed_item else "no seed link"
            print(
                f"  batch [{tag:6}] {bdata['code_hint']} {bdata['variety_name']:25}"
                f" @ {setup.name:25} {bdata['started_at'].date()} ({link})"
            )
            if created:
                created_batches += 1
        print(f"  -> {created_batches} new batches")
        print()

        if DRY_RUN:
            session.rollback()
            print("DRY-RUN complete. Rolled back. Set DRY_RUN=0 to commit.")
        else:
            session.commit()
            print("Committed. Data restored.")


if __name__ == "__main__":
    main()
