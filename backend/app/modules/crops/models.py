import uuid

from sqlmodel import Field

from app.modules.crops.schema import CropGuideBase


class CropGuide(CropGuideBase, table=True):
    __tablename__ = "crop_guide"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
