from app.modules.climate.providers.base import ClimateProvider
from app.modules.climate.providers.nasa_power import NasaPowerProvider
from app.modules.climate.providers.open_meteo import OpenMeteoProvider

_REGISTRY: dict[str, ClimateProvider] = {}


def register_provider(provider: ClimateProvider) -> None:
    _REGISTRY[provider.name] = provider


def get_provider(name: str | None = None) -> ClimateProvider:
    if not _REGISTRY:
        register_provider(OpenMeteoProvider())
        register_provider(NasaPowerProvider())
    key = name or "open_meteo"
    if key not in _REGISTRY:
        raise KeyError(f"Unknown climate provider: {key}")
    return _REGISTRY[key]


def list_providers() -> list[str]:
    if not _REGISTRY:
        get_provider()
    return list(_REGISTRY.keys())
