from sqlmodel import Field, SQLModel


class ChatRequest(SQLModel):
    message: str = Field(min_length=1, max_length=2000)


class Citation(SQLModel):
    type: str
    id: str
    label: str


class ChatResponse(SQLModel):
    answer: str
    language: str
    citations: list[dict]
    messages_used: int


class VisionOnboardRequest(SQLModel):
    image_url: str = Field(min_length=1, max_length=1000)


class VisionOnboardResponse(SQLModel):
    setup_type: str
    estimated_slot_count: int
    layout_hint: str
    confidence: float
