import uuid
from enum import Enum

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class PestKind(str, Enum):
    pest = "pest"
    disease = "disease"
    deficiency = "deficiency"


class PestSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class LibraryPestBase(SQLModel):
    name: str = Field(min_length=1, max_length=120)
    kind: PestKind
    severity: PestSeverity
    affected_crops: list[str] | None = Field(
        default=None,
        sa_column=Column("affected_crops", JSONB, nullable=True),
    )
    symptoms: list[str] | None = Field(
        default=None,
        sa_column=Column("symptoms", JSONB, nullable=True),
    )
    causes: list[str] | None = Field(
        default=None,
        sa_column=Column("causes", JSONB, nullable=True),
    )
    prevention: list[str] | None = Field(
        default=None,
        sa_column=Column("prevention", JSONB, nullable=True),
    )
    treatment: list[str] | None = Field(
        default=None,
        sa_column=Column("treatment", JSONB, nullable=True),
    )
    image_key: str | None = Field(default=None, max_length=200)
    image_url: str | None = Field(default=None, max_length=500)
    source: str | None = Field(default=None, max_length=200)


class LibraryPestPublic(LibraryPestBase):
    id: uuid.UUID


class LibraryPestsPublic(SQLModel):
    data: list[LibraryPestPublic]
    count: int
