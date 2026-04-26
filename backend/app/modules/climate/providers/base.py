from abc import ABC, abstractmethod

from app.modules.climate.schema import ClimateNormals


class ClimateProvider(ABC):
    name: str

    @abstractmethod
    async def get_monthly_normals(
        self, *, lat: float, lon: float, month: int
    ) -> ClimateNormals: ...
