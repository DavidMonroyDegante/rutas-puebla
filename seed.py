"""Carga paradas de ejemplo en Redis. Uso:  python seed.py"""
from app.database import redis_client
from app.models import Parada

PARADAS = [
    ("pue-001", "Parada Zócalo", "Centro", 19.0431, -98.1937, ["Ruta 1", "Ruta 15", "Ruta 72"]),
    ("pue-002", "Parada BUAP", "Los Volcanes", 19.0467, -98.2065, ["Ruta 4", "Ruta 61"]),
    ("pue-003", "Parada CAPU", "Santa Anita", 19.0654, -98.2100, ["Ruta 10", "Ruta 22"]),
    ("pue-004", "Parada Angelópolis", "Lomas de Angelópolis", 19.0195, -98.2433, ["Ruta 7", "Ruta 36"]),
    ("pue-005", "Parada Paseo Bravo", "Centro", 19.0366, -98.2012, ["Ruta 1", "Ruta 9"]),
    ("pue-006", "Parada Estrella de Puebla", "San José Mayorazgo", 19.0160, -98.2300, ["Ruta 5", "Ruta 18"]),
    ("pue-007", "Parada Los Fuertes", "Zona de los Fuertes", 19.0688, -98.1860, ["Ruta 15", "Ruta 40"]),
    ("pue-008", "Parada Plaza Dorada", "Bella Vista", 19.0550, -98.2280, ["Ruta 2", "Ruta 72"]),
]

for id_, nombre, colonia, lat, lon, rutas in PARADAS:
    p = Parada(id=id_, nombre=nombre, colonia=colonia, latitud=lat, longitud=lon, rutas=rutas)
    redis_client.set(f"parada:{id_}", p.model_dump_json())
    print("OK", id_, nombre)
print(f"{len(PARADAS)} paradas cargadas.")
