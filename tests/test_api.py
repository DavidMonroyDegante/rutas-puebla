"""Pruebas automáticas con Redis simulado (fakeredis): no tocan tu Redis Cloud."""
import os

os.environ["REDIS_URL"] = "redis://localhost:6379"

import fakeredis
import pytest
from fastapi.testclient import TestClient

import app.database as database
import app.routes as routes

fake = fakeredis.FakeRedis(decode_responses=True)
database.redis_client = fake
routes.redis_client = fake

from app.main import app  # noqa: E402

client = TestClient(app)
DATOS = {"nombre": "Parada BUAP", "colonia": "Los Volcanes", "latitud": 19.0467,
         "longitud": -98.2065, "rutas": ["Ruta 4", "Ruta 61"], "activa": True}


@pytest.fixture(autouse=True)
def limpiar():
    fake.flushall()


def test_crud_completo():
    r = client.post("/paradas", json=DATOS)
    assert r.status_code == 201
    pid = r.json()["id"]
    assert client.get(f"/paradas/{pid}").json()["nombre"] == "Parada BUAP"
    assert client.get("/paradas").json()["total"] == 1
    r = client.put(f"/paradas/{pid}", json={**DATOS, "activa": False})
    assert r.status_code == 200 and r.json()["parada"]["activa"] is False
    assert client.delete(f"/paradas/{pid}").status_code == 200
    assert client.get(f"/paradas/{pid}").status_code == 404


def test_errores_claros():
    assert client.get("/paradas/no-existe").status_code == 404
    assert client.put("/paradas/no-existe", json=DATOS).status_code == 404
    assert client.delete("/paradas/no-existe").status_code == 404
    assert client.post("/paradas", json={"nombre": "x"}).status_code == 422


def test_ids_unicos_y_ping():
    a = client.post("/paradas", json=DATOS).json()["id"]
    b = client.post("/paradas", json=DATOS).json()["id"]
    assert a != b
    assert client.get("/estado").json()["redis_conectado"] is True


def test_todos_los_campos_obligatorios():
    for campo in ["nombre", "colonia", "latitud", "longitud", "rutas"]:
        datos = {k: v for k, v in DATOS.items() if k != campo}
        assert client.post("/paradas", json=datos).status_code == 422
    assert client.post("/paradas", json={**DATOS, "rutas": []}).status_code == 422
    assert client.post("/paradas", json={**DATOS, "rutas": ["  ", ""]}).status_code == 422
    assert client.post("/paradas", json={**DATOS, "nombre": "   "}).status_code == 422
    assert client.put("/paradas/x", json={**DATOS, "rutas": []}).status_code == 422