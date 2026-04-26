import uuid
from enum import Enum

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class GuideCategory(str, Enum):
    setup = "setup"
    nutrition = "nutrition"
    business = "business"
    safety = "safety"
    operations = "operations"
    other = "other"


class LibraryGuideBase(SQLModel):
    title: str = Field(min_length=1, max_length=160)
    summary: str = Field(max_length=400)
    category: GuideCategory
    body_md: str
    image_key: str | None = Field(default=None, max_length=200)
    image_url: str | None = Field(default=None, max_length=500)
    read_time_min: int | None = None
    tags: list[str] | None = Field(
        default=None,
        sa_column=Column("tags", JSONB, nullable=True),
    )
    source: str | None = Field(default=None, max_length=200)


class LibraryGuidePublic(LibraryGuideBase):
    id: uuid.UUID


class LibraryGuidesPublic(SQLModel):
    data: list[LibraryGuidePublic]
    count: int
