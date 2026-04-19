"""HydroManager grounded AI assistant."""

import re

from fastapi import HTTPException
from sqlmodel import Session

from app.core.config import settings
from app.modules.hydro_ai.context import build_context
from app.modules.hydro_ai.schema import ChatRequest, ChatResponse
from app.modules.hydro_common.quota import consume_ai_message, ensure_ai_quota
from app.modules.iam.users.models import User

SYSTEM_PROMPT = """You are the HydroManager AI Crop Assistant for Filipino hydroponic growers.

Rules:
- Answer only from the user's provided context (their setups, batches, inventory, crop guides).
- If the context lacks the answer, say so honestly and suggest what data they should log.
- Respond in the language of the user's question (English, Tagalog, or Taglish).
- Keep answers practical and specific to the user's farm state.
- Cite entities you reference by including [setup:NAME], [batch:NAME], [crop:NAME], [inv:NAME] tags inline.
- Never invent numbers — only use numbers present in the context.
"""


def _detect_language(text: str) -> str:
    tl_markers = [
        "ang ",
        "ng ",
        "mga ",
        "hindi ",
        "bakit",
        "paano",
        "kailan",
        "saan",
        "kumusta",
        "pechay",
        "kangkong",
        "talong",
    ]
    low = text.lower()
    hits = sum(1 for m in tl_markers if m in low)
    if hits >= 2:
        return "tl"
    if hits == 1:
        return "taglish"
    return "en"


def chat(
    *, session: Session, current_user: User, data: ChatRequest
) -> ChatResponse:
    usage = ensure_ai_quota(
        session=session, user_id=current_user.id, tier=current_user.tier
    )

    context, citations = build_context(
        session=session, user_id=current_user.id, query=data.message
    )

    try:
        from app.modules.ai.llm import get_chat_model
    except Exception as e:
        raise HTTPException(
            status_code=503, detail=f"AI backend unavailable: {e}"
        )

    if not (
        settings.NEBIUS_API_KEY
        or settings.OPENROUTER_API_KEY
    ):
        answer = _fallback_answer(data.message, context)
    else:
        try:
            llm = get_chat_model()
            prompt = [
                ("system", SYSTEM_PROMPT),
                ("user", f"## User farm state\n{context}\n\n## Question\n{data.message}"),
            ]
            result = llm.invoke(prompt)
            answer = getattr(result, "content", str(result))
        except Exception as e:
            answer = (
                f"(AI offline — {e}). "
                f"Here is your farm state:\n{context}"
            )

    consume_ai_message(session=session, user_id=current_user.id)
    session.commit()

    cite_pattern = re.compile(r"\[(setup|batch|crop|inv):([^\]]+)\]")
    used_cites = []
    for m in cite_pattern.finditer(answer):
        label = m.group(2)
        for c in citations:
            if c["label"].lower() == label.lower():
                used_cites.append(c)
                break

    return ChatResponse(
        answer=answer,
        language=_detect_language(data.message),
        citations=used_cites or citations[:5],
        messages_used=usage.messages_used + 1,
    )


def _fallback_answer(question: str, context: str) -> str:
    if not context.strip():
        return (
            "I don't have enough data about your farm yet. "
            "Add a setup and start a batch, then I can answer with specifics."
        )
    return (
        "AI model is not configured. Based on your current farm state:\n\n"
        f"{context}\n\n"
        f"Your question: {question}"
    )
