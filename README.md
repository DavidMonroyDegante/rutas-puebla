# Rutas Puebla — Sprint 1

Aplicación web para consultar, registrar, editar, buscar y eliminar paradas de transporte público de la ciudad de Puebla. El proyecto utiliza FastAPI para la API y Redis Cloud como base de datos en la nube, donde cada parada se guarda como un documento JSON. La interfaz muestra las paradas en un mapa interactivo con Leaflet.

## Tecnologías utilizadas

- Python 3.11+
- FastAPI
- Redis Cloud (plan Free de 30 MB, sin TLS)
- redis-py
- Pydantic
- HTML5
- CSS3
- JavaScript (Fetch API)
- Leaflet y OpenStreetMap
- Pytest y fakeredis

## Requisitos previos

- Python 3.11 o superior instalado.
- Git instalado.
- Una cuenta de Redis Cloud con una base de datos creada (plan Free de 30 MB, no requiere tarjeta de crédito).
- Conexión a internet: Redis Cloud, las fuentes, Leaflet y los mosaicos del mapa se cargan desde la red.
- Visual Studio Code (recomendado).

## Estructura del proyecto

```text
rutas-puebla/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   └── routes.py
├── static/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── tests/
│   ├── __init__.py
│   └── test_api.py
├── .env.example
├── .gitignore
├── requirements.txt
├── requirements-dev.txt
├── seed.py
└── README.md
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/DavidMonroyDegante/rutas-puebla.git
cd rutas-puebla
```

### 2. Crear un entorno virtual

En Windows PowerShell, ejecuta:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

Si PowerShell bloquea la activación, ejecuta:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
venv\Scripts\Activate.ps1
```

En Linux o macOS:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar las dependencias

Con el entorno virtual activo, ejecuta:

```powershell
python -m pip install -r requirements.txt
```

> Si moviste la carpeta del proyecto después de crear el entorno virtual, bórralo (`Remove-Item -Recurse -Force venv`) y vuelve a crearlo: sus ejecutables guardan la ruta original.

## Configuración y ejecución

### 1. Configurar la conexión a Redis Cloud

1. Entra a Redis Cloud y abre tu base de datos (en este proyecto se llama `CRUD`).
2. En los datos de conexión copia el **endpoint** (`host:puerto`) y la **contraseña** del usuario `default`.
3. Crea el archivo `.env` a partir de la plantilla:

```powershell
Copy-Item .env.example .env
```

4. Edita `.env` con tus datos:

```env
REDIS_URL=redis://default:TU_PASSWORD@TU_HOST:PUERTO
```

El plan Free de Redis Cloud no incluye TLS, por lo que la cadena de conexión debe usar `redis://` (con una sola "s"). Si se usa `rediss://`, la conexión falla.

El archivo `.env` está en `.gitignore` y nunca debe subirse al repositorio.

### 2. Cargar las paradas de ejemplo

Con el entorno virtual activo, ejecuta:

```powershell
python seed.py
```

El script `seed.py` guarda ocho paradas de ejemplo con las claves `parada:pue-001` a `parada:pue-008`. Si se ejecuta nuevamente, sobrescribe esas mismas claves con los datos originales y no crea duplicados. Las paradas que registres tú con otro ID no se modifican.

### 3. Iniciar FastAPI

```powershell
python -m uvicorn app.main:app --reload
```

Mantén esta terminal abierta mientras utilizas la aplicación.

### 4. Abrir la aplicación

- **Aplicación web:** http://127.0.0.1:8000/
- **Documentación de la API (Swagger):** http://127.0.0.1:8000/docs
- **Estado de la conexión con Redis:** http://127.0.0.1:8000/estado

Si `/estado` responde `"redis_conectado": true`, la API está conectada correctamente a Redis Cloud.

## Funcionalidades

- Listado de paradas con sus rutas, colonia y estado.
- Búsqueda por ID (`pue-…`), nombre, colonia o ruta.
- Filtro por estado: todas, activas o inactivas.
- Estadísticas en el encabezado: paradas registradas, activas y rutas distintas.
- Mapa interactivo de Puebla con un marcador por parada y ventana emergente con sus datos.
- Botón "Ver en mapa" para centrar una parada específica.
- Registro de paradas con selección de la ubicación directamente en el mapa.
- Edición de paradas.
- Eliminación de paradas con confirmación.
- Mensajes de éxito y error.
- Diseño adaptable a pantallas de escritorio y móvil.
- API REST para operaciones CRUD con documentación automática.
- Validación de los datos de entrada.

## Modelo de datos

Cada parada se guarda en Redis con una clave única `parada:{id}`, por ejemplo `parada:pue-001`, y su valor es un documento JSON:

```json
{
  "id": "pue-001",
  "nombre": "Parada Zócalo",
  "colonia": "Centro",
  "municipio": "Puebla",
  "latitud": 19.0431,
  "longitud": -98.1937,
  "rutas": ["Ruta 1", "Ruta 15", "Ruta 72"],
  "activa": true,
  "creado_en": "2026-11-08T23:00:00Z"
}
```

El ID (`pue-` más ocho caracteres) y la fecha `creado_en` los genera el servidor.

## Endpoints principales

| Método | Endpoint | Función |
|---|---|---|
| GET | `/estado` | Verificar la conexión con Redis mediante PING. |
| POST | `/paradas` | Registrar una parada; devuelve `201` y el ID generado. |
| GET | `/paradas` | Listar todas las paradas almacenadas. |
| GET | `/paradas/{id}` | Consultar los datos de una parada. |
| PUT | `/paradas/{id}` | Actualizar una parada existente. |
| DELETE | `/paradas/{id}` | Eliminar una parada. |

### Validaciones y errores

Todos los campos son obligatorios al crear o actualizar una parada:

- `nombre` y `colonia`: no pueden estar vacíos (se eliminan los espacios sobrantes).
- `latitud`: entre -90 y 90.
- `longitud`: entre -180 y 180.
- `rutas`: debe incluir al menos una ruta.

| Código | Cuándo ocurre |
|---|---|
| `201` | Parada creada. |
| `404` | La parada no existe (consultar, actualizar o eliminar). |
| `409` | Ya existe una parada con ese ID. |
| `422` | Datos inválidos o campos faltantes. |

Ejemplo de solicitud para registrar una parada:

```json
{
  "nombre": "Parada BUAP",
  "colonia": "Los Volcanes",
  "municipio": "Puebla",
  "latitud": 19.0467,
  "longitud": -98.2065,
  "rutas": ["Ruta 4", "Ruta 61"],
  "activa": true
}
```

## Pruebas automáticas

Las pruebas utilizan un Redis simulado (`fakeredis`), por lo que no modifican los datos de tu base en Redis Cloud. Con el entorno virtual activo, ejecuta:

```powershell
python -m pip install -r requirements-dev.txt
python -m pytest -v
```

La suite contiene **4 pruebas aprobadas en la última ejecución local**. Estas pruebas verifican, entre otros comportamientos:

- Ciclo completo de crear, consultar, listar, actualizar y eliminar una parada.
- Errores `404` al consultar, actualizar o eliminar paradas inexistentes.
- Validación de datos incorrectos con `422`.
- Generación de IDs únicos.
- Respuesta correcta del PING en `/estado`.
- Obligatoriedad de todos los campos, incluidas las rutas.

Para comprobar el resultado más reciente, ejecuta nuevamente `python -m pytest -v`.

## Solución de problemas

| Problema | Causa o solución |
|---|---|
| `Falta la variable REDIS_URL` | No existe el archivo `.env`; créalo desde `.env.example`. |
| Error de conexión o `redis_conectado: false` | Revisa host, puerto y contraseña; usa `redis://` (sin TLS). |
| El mapa aparece vacío | Sin internet, o aún no hay paradas: ejecuta `python seed.py`. |
| `/estado` o la interfaz muestran respuestas antiguas | Hay otro servidor ocupando el puerto 8000; ciérralo y vuelve a iniciar `uvicorn`. |
| `Fatal error in launcher` al usar `pip` | El entorno virtual se creó en otra ruta; bórralo y créalo de nuevo. |

## Estado del proyecto

El proyecto cuenta con una interfaz web para listar, buscar, filtrar, registrar, editar y eliminar paradas, y para ubicarlas en un mapa. La API REST está conectada con Redis Cloud y dispone de operaciones CRUD, validación de datos y errores claros.

También se incluye un script para cargar ocho paradas de ejemplo y una suite de pruebas automáticas que no depende de la base de datos en la nube.

## Decisiones de desarrollo

- **Separación por módulos:** la conexión, los modelos, las rutas y el servidor principal están en archivos distintos para facilitar el mantenimiento.
- **Validación de datos:** se utilizan modelos de Pydantic para validar la información recibida por la API; un modelo de entrada (sin ID) se separa del documento completo que se guarda.
- **Persistencia:** Redis Cloud almacena cada parada como JSON bajo la clave `parada:{id}`, en memoria y con baja latencia.
- **Operaciones seguras:** la creación usa `SET` con la opción `NX` para no sobrescribir paradas existentes, y el listado combina `SCAN` con `MGET`.
- **Actualizaciones:** al actualizar una parada se conservan su ID y su fecha de creación originales.
- **Configuración:** la cadena de conexión se lee de la variable de entorno `REDIS_URL`, y el archivo `.env` se excluye del repositorio.
- **Pruebas automatizadas:** Pytest con fakeredis permite comprobar las respuestas y validaciones sin tocar la base en la nube.