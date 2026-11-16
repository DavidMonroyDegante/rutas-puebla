"""Conexión a Redis Cloud (plan Free de 30 MB, sin TLS)."""
import os

import redis
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")
if not REDIS_URL:
    raise RuntimeError(
        "Falta la variable REDIS_URL. Crea el archivo .env a partir de .env.example"
    )

redis_client = redis.from_url(REDIS_URL, decode_responses=True)


def probar_conexion() -> bool:
    """Devuelve True si Redis responde al comando PING."""
    try:
        return bool(redis_client.ping())
    except redis.exceptions.RedisError:
        return False
