# Observatorio de Vehiculos - Extractor

Pipeline trimestral: pagina HTML -> snapshot -> parseo -> normalizacion -> CSV / Google Sheets.

## Instalacion

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Uso

```powershell
# Explorar que tablas trae la pagina
python src/main.py --url "https://..." --tabla 0

# Vehiculos electricos (RUNT 2.0, dataset ntxy-q9ix)
# Alcance por defecto: combustible ELECTRICO, registrados desde 2024.
# Escribe CSV y XLSX en data/processed/
python src/vehiculos_electricos.py
python src/vehiculos_electricos.py --formato excel
python src/vehiculos_electricos.py --where "departamento='Antioquia'"
python src/vehiculos_electricos.py --agregado departamento,anio_registro

# ANDEMOS: marca + linea, solo hibridos y electricos
python src/andemos.py
python src/andemos.py --ver --espera 45000          # ver el navegador
python src/andemos.py --carpeta data/raw/<fecha>/andemos_hibridos_electricos

# Cambiar el alcance
python src/vehiculos_electricos.py --desde 2020
python src/vehiculos_electricos.py --combustible "GASO ELEC"   # hibridos
python src/vehiculos_electricos.py --todo                      # sin filtros

# Cargar tambien a Google Sheets (una vez configuradas las credenciales)
python src/main.py --url "https://..." --tabla 0 --sheets --sheet-id "<ID>" --hoja datos
```

## Estructura

| Ruta | Rol |
|---|---|
| `src/fetch.py` | Descarga con reintentos y guarda snapshot en `data/raw/<fecha>/` |
| `src/parse.py` | HTML -> filas (por tabla o por selectores CSS) |
| `src/normalizar.py` | snake_case, tipos, numeros en formato colombiano, periodo e `id_fila` |
| `src/sinks.py` | Salida a CSV y a Google Sheets (upsert por periodo) |
| `src/main.py` | Orquesta el pipeline |
| `src/runt.py` | Descarga generica de datasets de datos.gov.co (API Socrata) |
| `src/vehiculos_electricos.py` | Dataset `ntxy-q9ix`: filtro por combustible y ano, tipado y agregados |
| `src/andemos.py` | ANDEMOS (Looker Studio): marca + linea de hibridos y electricos |

## Alcance de los datos

Por defecto se extrae solo `combustible='ELECTRICO'` (electricos puros) desde el
ano de registro 2024. Quedan fuera los hibridos `GASO ELEC` y `DIES ELEC`, que
son el 73% del dataset. No se filtra por clase: entran camionetas, automoviles,
motos, buses y camiones.

Valores de `combustible`: ELECTRICO, GASO ELEC, DIES ELEC, HIDROGENO.

## Pendientes

1. Definir la URL y los selectores concretos en `parse.py`.
2. Opcional: automatizar la corrida trimestral (Programador de tareas o GitHub Actions).

## Google Sheets -> Looker Studio (opcional, sin usar por ahora)

El flujo actual termina en el archivo: la carga al Sheet y el dashboard se hacen
a mano. El codigo de carga queda listo y solo se activa con `--sheets`.

Autenticacion por **cuenta de servicio** (no OAuth de usuario): el pipeline corre
desatendido y el refresh token de OAuth caduca si la app sigue en modo prueba.

Puesta a punto, una sola vez:

1. En Google Cloud Console, crear un proyecto y habilitar **Google Sheets API**.
2. Crear una **cuenta de servicio** y descargar su clave JSON.
3. Guardar la clave como `config/credentials.json` (ya esta en `.gitignore`).
4. Abrir el Google Sheet destino y **compartirlo como Editor** con el correo
   `client_email` que aparece dentro del JSON.
5. El `--sheet-id` es el tramo de la URL entre `/d/` y `/edit`.

Cada corrida reemplaza la pestana completa (el RUNT republica toda la serie, asi
que un upsert dejaria historicos corregidos sin actualizar) y refresca la pestana
`_actualizacion` con la fecha de la fuente y los totales.

En Looker Studio: conectar el Sheet con el conector de Google Sheets, marcar
"Usar la primera fila como encabezado", y en el panel de datos pulsar **Actualizar
campos** si cambian las columnas. El conector cachea; con **Actualizar datos** se
fuerza la recarga.
