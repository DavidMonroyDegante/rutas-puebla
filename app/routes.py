import json

from fastapi import APIRouter, HTTPException

from app.database import redis_client
from app.models import Parada, ParadaEntrada

router = APIRouter(prefix="/paradas", tags=["Paradas"])


def _clave(parada_id: str) -> str:
    return f"parada:{parada_id}"


@router.post("", status_code=201, summary="Crear parada")
def crear_parada(datos: ParadaEntrada):
    parada = Parada(**datos.model_dump())
    clave = _clave(parada.id)
    # nx=True: solo guarda si la clave NO existe (evita sobrescribir)
    if not redis_client.set(clave, parada.model_dump_json(), nx=True):
        raise HTTPException(status_code=409, detail="La parada ya existe")
    return {"mensaje": "Parada creada", "id": parada.id}


@router.get("", summary="Listar paradas")
def listar_paradas():
    claves = sorted(redis_client.scan_iter(match="parada:*"))
    paradas = []
    if claves:
        for valor in redis_client.mget(claves):
            if valor:
                paradas.append(json.loads(valor))
    return {"total": len(paradas), "paradas": paradas}


@router.get("/{parada_id}", summary="Obtener una parada")
def obtener_parada(parada_id: str):
    datos = redis_client.get(_clave(parada_id))
    if not datos:
        raise HTTPException(status_code=404, detail="Parada no encontrada")
    return json.loads(datos)


@router.put("/{parada_id}", summary="Actualizar parada")
def actualizar_parada(parada_id: str, datos: ParadaEntrada):
    clave = _clave(parada_id)
    actual = redis_client.get(clave)
    if not actual:
        raise HTTPException(status_code=404, detail="Parada no encontrada")
    # Se conserva el id y la fecha de creación originales
    creado_en = json.loads(actual)["creado_en"]
    parada = Parada(id=parada_id, creado_en=creado_en, **datos.model_dump())
    redis_client.set(clave, parada.model_dump_json())
    return {"mensaje": "Parada actualizada", "parada": json.loads(parada.model_dump_json())}


@router.delete("/{parada_id}", summary="Eliminar parada")
def eliminar_parada(parada_id: str):
    if not redis_client.delete(_clave(parada_id)):
        raise HTTPException(status_code=404, detail="Parada no encontrada")
    return {"mensaje": "Parada eliminada", "id": parada_id}
