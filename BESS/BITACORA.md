# Bitacora del proyecto - Observatorio BESS

Registro de decisiones, hallazgos y avances. Se actualiza en cada sesion de trabajo.

---

## 2026-10-01 - Sesion 1

### Objetivo
Dashboard del Observatorio de sistemas de almacenamiento de energia por baterias (BESS)
en Colombia, integrado al sitio del Observatorio de Transicion Energetica Justa (TEJ).

### Decisiones
- Herramienta: **Looker Studio**, embebido en el sitio TEJ.
- Alcance: BESS + regulacion y subastas.
- El Observatorio de Vehiculos queda en pausa; el foco es solo BESS.
- Fuente: registro manual en Drive. La hoja "Enlaces" se omite.

### Insumos
| Archivo | Rol |
|---|---|
| `../MAQUETACONTENIDOSv1.pdf` | Wireframe del sitio TEJ (navegacion, patron de seccion) |
| `../Propuesta.pdf` | Propuesta visual del dashboard (Claude Design), base a corregir |
| `260219_Base_de_Datos_Colombia.xlsx` (Drive) | Base vigente, 6 proyectos, actualizada 2026-10-01 |

El Google Sheet homonimo `260219_Base_de_Datos_Colombia` (sin .xlsx) es una version
vieja de abril con 4 proyectos. No usar.

### Hallazgos en la base (.xlsx)
1. **Es un .xlsx, no un Google Sheet nativo.** El conector de Google Sheets de Looker
   Studio no lee .xlsx: hay que convertirlo (Archivo > Guardar como Hojas de calculo de Google).
2. **Encabezado en dos filas** (fila de grupo "Informacion basica / Informacion tecnica"
   encima de los nombres de columna). Looker toma solo la primera fila como encabezado.
3. Se elimino la columna **Tecnologia**, que la propuesta usa en la dona.
4. "Capacidad nominal [MW]": MW es potencia, no capacidad. Volver a "Potencia nominal".
5. Errores de registro:
   - *Bosques Solares de los Llanos 8*: el operador es igual al nombre del proyecto.
   - *Bosques Solares 8* y *Parque solar Andromeda*: los enlaces estan cruzados entre si.
   - *Pradera solar*: departamento y municipio invertidos; estado vacio; dos URLs en una celda.
   - Punto de conexion "115" sin unidad (en Termozipa es "13.8 kV").
6. La columna de enlaces no tiene encabezado.
7. Aparece el estado **"Asignado por subasta"**, que la propuesta no contempla.

### Hallazgos en la propuesta visual
- KPI "Potencia total instalada" suma proyectos no instalados (subasta, suspendidos).
- Barras MW y MWh en el mismo eje: unidades distintas, comparacion enganosa.
- Linea "Potencia vs FPO": una linea sugiere tendencia continua entre anos sueltos.
- Dona de tecnologia al 100% Li-ion no aporta informacion.
- Mapa Leaflet: en Looker se usa el mapa de Google, que necesita lat/long o ciudad.
- Encabezado, menu y selector ES/EN pertenecen al sitio TEJ, no al reporte de Looker.

### Base oficial (actualizacion de la sesion)
Nueva base nativa de Google Sheets, propiedad del usuario: **`Base de datos SAEB`**
(id `1-XpWEXUFK8AOappezQaiXFFJldqgq50pkfijhBCdvTA`). 7 proyectos. Reemplaza al .xlsx.

Ya corregido: encabezado en una sola fila, columna Tecnologia restaurada, Pradera
(departamento/municipio y estado "En ejecucion"), Canadian Solar reincorporado,
punto de conexion en kV numerico.

Pendiente en la base:
- Bosques Solares 8: operador = nombre del proyecto.
- Bosques Solares 8 y Andromeda: enlaces cruzados.
- Encabezados con saltos de linea y corchetes; columna de enlaces sin encabezado.
- Pradera: dos URLs en una celda.
- "Booleano": definir significado.
- Faltan columnas de latitud/longitud para el mapa.

### Decision: division del trabajo (aprobada)
Claude prepara datos, campos calculados, tema y guia paso a paso; el usuario arma el
reporte en Looker Studio y Claude revisa. Looker Studio no tiene API para crear graficos.

### Mapa: el usuario prefiere OpenStreetMap
Looker Studio solo trae mapas base de Google. Opciones evaluadas:
1. **Visualizacion de comunidad** (Leaflet + teselas OSM, alojada en Google Cloud
   Storage). Conserva el filtrado cruzado con la tabla y los filtros. Recomendada.
2. Inserto de URL con una pagina Leaflet externa: simple, pero no responde a filtros.
3. Mapa fuera de Looker, en la pagina del sitio TEJ: igual limitacion.

### Correcciones de la base: el usuario decide omitirlas
Bosques/Andromeda (operador, enlaces), URLs de Pradera y columna Booleano quedan como estan.
Se agregaron columnas Latitud/Longitud con la cabecera municipal (aproximadas).

### Mapa: opcion elegida = inserto de URL (pagina en GitHub Pages)
Version del usuario: https://magameza021.github.io/mapa-bess-colombia/ (Leaflet + OSM).
Revision:
- Datos fijos en `proyectos.js` (3 proyectos, ultima edicion 2026-07-26); la hoja tiene 7.
- Termozipa con 8,9 MWh en el mapa vs 3,9 MWh en la hoja.
- Leyenda "En construccion / Planeado" no coincide con los estados reales; En ejecucion,
  Suspendido y Asignado por subasta salen todos en gris.
- Etiqueta "Capacidad nominal (MW)" (es potencia). Estilo Segoe/azul, no el de la propuesta.

Nueva version en `mapa/index.html`:
- Lee la hoja en vivo (endpoint gviz CSV); un proyecto nuevo aparece sin tocar codigo.
- Encabezados por prefijo sin tildes; numeros con coma decimal.
- Colores para los 4 estados reales; leyenda solo con estados presentes.
- Radio proporcional a MW; popup con duracion (MWh/MW) y nota de ubicacion aproximada.
- Reencuadre al cambiar el tamano del inserto (Looker).
- Probado en local con `mapa/prueba.csv` (`index.html?csv=prueba.csv`): 7 puntos OK.

Requisito: la hoja debe compartirse "Cualquier persona con el enlace: Lector"
(hoy responde 401).

### Guia de Looker y paleta
- `GUIA_LOOKER.md`: campos, calculados, tema, posiciones por componente, publicacion.
- Colores de estado validados para daltonismo (OKLab, simulacion Machado; todos los
  pares >= 8 en protan/deutan/tritan, >= 15 en vision normal): operacion `#2F9E5A`,
  ejecucion `#E0A030`, subasta `#2F63A8`, suspendido `#A8323E`. Mapa actualizado igual.
- El repo de GitHub Pages del mapa no es del usuario: publicacion del mapa en pausa.
- La hoja se compartio, pero el endpoint CSV sigue pidiendo inicio de sesion
  (posible restriccion del dominio unal.edu.co a compartir fuera de la organizacion).

### Proximos pasos
- [x] Definir modo de construccion en Looker Studio.
- [x] Definir opcion de mapa.
- [x] Guia de construccion del reporte en Looker Studio.
- [ ] Usuario arma la pagina 1 siguiendo la guia; Claude revisa.
- [ ] Resolver acceso publico a la hoja y alojamiento del mapa.
- [ ] Crear hoja `Regulacion` para la pagina 2.
- [ ] Convertir la base a Google Sheets y normalizar encabezados.
- [ ] Corregir errores de registro (validar con quien lleva la base).
- [ ] Crear hoja de regulacion y subastas.
