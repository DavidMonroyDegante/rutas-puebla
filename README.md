# 🚌 Rutas Puebla — Sprint 1

API REST + interfaz web para administrar **paradas de transporte público de la ciudad de Puebla** (CRUD), guardando cada parada como documento JSON en **Redis Cloud** y mostrándolas en un mapa interactivo (Leaflet / OpenStreetMap).

| Elemento | Tecnología |
|---|---|
| Lenguaje | Python 3.11+ |
| Framework | FastAPI |
| Base de datos | Redis Cloud (plan Free 30 MB, **sin TLS**) |
| Cliente Redis | redis-py |
| Frontend | HTML + CSS + JavaScript (fetch) + Leaflet |

## Estructura

```
rutas-puebla/
├── app/
│   ├── main.py        # servidor FastAPI, CORS, archivos estáticos, /estado
│   ├── database.py    # conexión a Redis y PING
│   ├── models.py      # modelos Pydantic (Parada)
│   └── routes.py      # endpoints CRUD
├── static/            # index.html, styles.css, app.js
├── tests/test_api.py  # pruebas automáticas (Redis simulado)
├── seed.py            # carga 8 paradas de ejemplo
├── .env.example       # plantilla de variables de entorno
├── requirements.txt
└── README.md
```

## Modelo de datos

Clave: `parada:{id}` (ej. `parada:pue-001`). Valor: JSON

```json
{
  "id": "pue-001", "nombre": "Parada Zócalo", "colonia": "Centro",
  "municipio": "Puebla", "latitud": 19.0431, "longitud": -98.1937,
  "rutas": ["Ruta 1", "Ruta 15", "Ruta 72"], "activa": true,
  "creado_en": "2026-11-08T23:00:00Z"
}
```

## Endpoints

| Método | Ruta | Acción |
|---|---|---|
| POST | `/paradas` | Crear parada (devuelve ID único) |
| GET | `/paradas` | Listar paradas |
| GET | `/paradas/{id}` | Obtener una parada |
| PUT | `/paradas/{id}` | Actualizar parada |
| DELETE | `/paradas/{id}` | Eliminar parada |
| GET | `/estado` | Verifica Redis con PING |

Errores claros: `404` parada no encontrada, `409` ya existe, `422` datos inválidos.

## Instalación (en cualquier equipo)

### 1. Requisitos
Python 3.11+ y Git.

### 2. Clonar e instalar
```bash
git clone <URL_DE_TU_REPOSITORIO>
cd rutas-puebla
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Obtener los datos de Redis Cloud
1. Entra a Redis Cloud y abre tu base de datos **CRUD** (plan **Free 30 MB**, no pide tarjeta).
2. En *Configuration / Connect* copia el **endpoint** (host:puerto) y la **contraseña** del usuario `default`.

### 4. Crear el archivo `.env`
Copia la plantilla y edítala:
```bash
cp .env.example .env              # Windows: copy .env.example .env
```
```env
REDIS_URL=redis://default:TU_PASSWORD@TU_HOST:PUERTO
```
> ⚠️ Usa `redis://` (una sola "s"). El plan Free **no incluye TLS**; con `rediss://` la conexión falla.
> El archivo `.env` está en `.gitignore`: **nunca lo subas a GitHub**.

### 5. (Opcional) Cargar datos de prueba
```bash
python seed.py
```

### 6. Ejecutar
```bash
uvicorn app.main:app --reload
```
- App web: http://127.0.0.1:8000/
- Swagger: http://127.0.0.1:8000/docs
- Estado de Redis: http://127.0.0.1:8000/estado → `{"redis_conectado": true}`

## Pruebas

**Manuales (Swagger `/docs`)**: crear → consultar → listar → actualizar → eliminar → consultar otra vez (debe dar 404).

Ejemplo POST `/paradas`:
```json
{
  "nombre": "Parada BUAP", "colonia": "Los Volcanes", "municipio": "Puebla",
  "latitud": 19.0467, "longitud": -98.2065,
  "rutas": ["Ruta 4", "Ruta 61"], "activa": true
}
```

**Automáticas** (no tocan tu Redis Cloud):
```bash
pip install -r requirements-dev.txt
pytest -v
```

## Criterios de aceptación cubiertos

- ✅ Crear parada con ID único · ✅ Consultar por ID · ✅ Listar · ✅ Actualizar · ✅ Eliminar
- ✅ Errores claros (404/409/422)
- ✅ Conexión vía variable `REDIS_URL` a Redis Cloud (sin guardar datos en local)
- ✅ PING a Redis en `/estado`
- ✅ Swagger en `/docs` · ✅ Frontend responsive con mapa Leaflet

## Solución de problemas

| Problema | Causa / solución |
|---|---|
| `Falta la variable REDIS_URL` | No existe `.env`; créalo desde `.env.example` |
| `redis_conectado: false` o error de conexión | Revisa host, puerto y contraseña; usa `redis://` (sin TLS) |
| Mapa vacío | Falta internet (Leaflet y tiles vienen de CDN) o no hay paradas: ejecuta `python seed.py` |
