import uuid

from sqlmodel import Field

from app.modules.library_guides.schema import LibraryGuideBase


class LibraryGuide(LibraryGuideBase, table=True):
    __tablename__ = "library_guide"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
