"""Aggregator module so SQLModel.metadata sees every table.

Alembic autogenerate imports ``SQLModel`` from here; any new module-level
``table=True`` SQLModel must be re-exported below so its table is registered.
"""

from sqlmodel import SQLModel  # noqa: F401

from app.modules.ai.agents.models import Agent  # noqa: F401
from app.modules.ai.conversations.models import Conversation, Message  # noqa: F401
from app.modules.ai.mcp.models import MCPServer  # noqa: F401
from app.modules.ai.tools.models import AgentTool, Tool  # noqa: F401
from app.modules.batches.models import (  # noqa: F401
    Batch,
    BatchHarvest,
    BatchStateCount,
    BatchTransition,
)
from app.modules.crops.models import CropGuide  # noqa: F401
from app.modules.hydro_common.quota import AIQuotaUsage  # noqa: F401
from app.modules.iam.permissions.models import Permission  # noqa: F401
from app.modules.iam.roles.models import Role  # noqa: F401
from app.modules.iam.tenants.models import Tenant  # noqa: F401
from app.modules.iam.users.models import User  # noqa: F401
from app.modules.inventory.models import InventoryItem, InventoryMovement  # noqa: F401
from app.modules.items.models import Item  # noqa: F401
from app.modules.library_guides.models import LibraryGuide  # noqa: F401
from app.modules.library_pests.models import LibraryPest  # noqa: F401
from app.modules.ocr.models import OcrDocument  # noqa: F401
from app.modules.produce.models import Produce, ProduceMovement  # noqa: F401
from app.modules.sales.models import OverheadCost, Sale, SaleItem  # noqa: F401
from app.modules.setups.models import Setup, SetupPhoto, SetupSlot  # noqa: F401
