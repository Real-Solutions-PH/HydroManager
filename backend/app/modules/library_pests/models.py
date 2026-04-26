import uuid

from sqlmodel import Field

from app.modules.library_pests.schema import LibraryPestBase


class LibraryPest(LibraryPestBase, table=True):
    __tablename__ = "library_pest"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
