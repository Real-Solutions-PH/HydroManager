from typing import Any

from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from app.core.config import settings


def get_chat_model(provider: str | None = None, **kwargs: Any) -> ChatOpenAI:
    """Return a LangChain ChatModel for the specified provider.

    Both Nebius AI and OpenRouter expose OpenAI-compatible APIs,
    so ChatOpenAI works for both with different base_url/api_key.
    """
    provider = provider or settings.DEFAULT_LLM_PROVIDER

    if provider == "nebius":
        model = settings.NEBIUS_MODEL
        api_key = settings.NEBIUS_API_KEY
        base_url = settings.NEBIUS_BASE_URL
    elif provider == "openrouter":
        model = settings.OPENROUTER_MODEL
        api_key = settings.OPENROUTER_API_KEY
        base_url = settings.OPENROUTER_BASE_URL
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")

    # ChatOpenAI declares these as openai_api_key/openai_api_base/model_name
    # with api_key/base_url/model as pydantic aliases, and mypy and ty disagree
    # over which set the generated __init__ accepts. Both are valid at runtime;
    # collecting them into a dict[str, Any] keeps either checker from picking a
    # side. Revisit if the two ever agree.
    params: dict[str, Any] = {
        "model": model,
        "api_key": SecretStr(api_key) if api_key else None,
        "base_url": base_url,
        **kwargs,
    }
    return ChatOpenAI(**params)
