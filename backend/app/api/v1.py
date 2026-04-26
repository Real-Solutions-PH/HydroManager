from fastapi import APIRouter

from app.core.config import settings
from app.modules.batches.main import router as batches_router
from app.modules.checklist.main import router as checklist_router
from app.modules.climate.main import router as climate_router
from app.modules.crops.main import router as crops_router
from app.modules.hydro_ai.main import router as hydro_ai_router
from app.modules.hydro_common.main import router as hydro_common_router
from app.modules.iam.main import router as iam_router
from app.modules.inventory.main import router as inventory_router
from app.modules.items.main import router as items_router
from app.modules.library_guides.main import router as library_guides_router
from app.modules.library_pests.main import router as library_pests_router
from app.modules.paymongo.main import router as paymongo_router
from app.modules.produce.main import router as produce_router
from app.modules.sales.main import router as sales_router
from app.modules.setups.main import router as setups_router
from app.modules.system.main import router as system_router

v1_router = APIRouter()
v1_router.include_router(iam_router)
v1_router.include_router(items_router)
v1_router.include_router(system_router)
v1_router.include_router(setups_router)
v1_router.include_router(batches_router)
v1_router.include_router(inventory_router)
v1_router.include_router(crops_router)
v1_router.include_router(climate_router)
v1_router.include_router(library_guides_router)
v1_router.include_router(library_pests_router)
v1_router.include_router(checklist_router)
v1_router.include_router(produce_router)
v1_router.include_router(sales_router)
v1_router.include_router(hydro_ai_router)
v1_router.include_router(hydro_common_router)
v1_router.include_router(paymongo_router)

if settings.AI_ENABLED:
    from app.modules.ai.main import router as ai_router

    v1_router.include_router(ai_router)
if settings.OCR_ENABLED:
    from app.modules.ocr.main import router as ocr_router

    v1_router.include_router(ocr_router)
