"""Vision-assisted setup onboarding."""

import json
import re

from app.core.config import settings
from app.modules.hydro_ai.schema import VisionOnboardRequest, VisionOnboardResponse

VISION_SYSTEM = """You are a hydroponic setup type classifier.
Given an image of a hydroponic system, identify:
- setup_type: one of [DFT, NFT, DutchBucket, Kratky, SNAP]
- estimated_slot_count: integer (count visible net-pots/plant sites)
- layout_hint: one-line shape description (e.g. "3 rows of 10 pvc pipes")
- confidence: float 0.0-1.0

Respond ONLY with a JSON object. No prose."""


def analyze(data: VisionOnboardRequest) -> VisionOnboardResponse:
    if not (settings.NEBIUS_API_KEY or settings.OPENROUTER_API_KEY):
        return VisionOnboardResponse(
            setup_type="DFT",
            estimated_slot_count=20,
            layout_hint="AI vision not configured — defaults applied.",
            confidence=0.0,
        )
    try:
        from app.modules.ai.llm import get_chat_model
        llm = get_chat_model()
        msg = [
            ("system", VISION_SYSTEM),
            (
                "user",
                [
                    {"type": "text", "text": "Classify this setup."},
                    {
                        "type": "image_url",
                        "image_url": {"url": data.image_url},
                    },
                ],
            ),
        ]
        result = llm.invoke(msg)
        raw = getattr(result, "content", str(result))
        parsed = _extract_json(raw)
        return VisionOnboardResponse(
            setup_type=str(parsed.get("setup_type", "DFT")),
            estimated_slot_count=int(parsed.get("estimated_slot_count", 20)),
            layout_hint=str(parsed.get("layout_hint", "")),
            confidence=float(parsed.get("confidence", 0.5)),
        )
    except Exception as e:
        return VisionOnboardResponse(
            setup_type="DFT",
            estimated_slot_count=20,
            layout_hint=f"Vision failed: {e}",
            confidence=0.0,
        )


def _extract_json(text: str) -> dict:
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {}
