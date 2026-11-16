import uuid
from datetime import datetime, timezone
from typing import List

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _nuevo_id() -> str:
    return f"pue-{uuid.uuid4().hex[:8]}"


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


class ParadaEntrada(BaseModel):
    """Datos que envía el usuario al crear o actualizar (el id lo genera el servidor).

    Todos los campos son obligatorios: nombre, colonia, coordenadas y al menos una ruta.
    """
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: str = Field(min_length=1)
    colonia: str = Field(min_length=1)
    municipio: str = "Puebla"
    latitud: float = Field(ge=-90, le=90)
    longitud: float = Field(ge=-180, le=180)
    rutas: List[str] = Field(min_length=1)
    activa: bool = True

    @field_validator("rutas")
    @classmethod
    def rutas_obligatorias(cls, valor: List[str]) -> List[str]:
        limpias = [r.strip() for r in valor if r and r.strip()]
        if not limpias:
            raise ValueError("Debes indicar al menos una ruta")
        return limpias


class Parada(ParadaEntrada):
    """Documento completo guardado en Redis bajo la clave parada:{id}."""
    id: str = Field(default_factory=_nuevo_id)
    creado_en: datetime = Field(default_factory=_ahora)