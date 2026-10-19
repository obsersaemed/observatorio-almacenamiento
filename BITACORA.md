# Bitácora — Observatorio de Almacenamiento (MVP)

Registro de decisiones, hallazgos y avances del sitio único. Las bitácoras de
`BESS/` y `Vehiculos/` quedan como historial de cada módulo.

---

## 2026-10-19 — Arnés del proyecto

### Decisiones
- Sitio único (`sitio/`), migrable después al sitio TEJ.
- Alcance: solo SAEB (baterías).
- Vehículos eléctricos entra en el MVP.
- Entrega del MVP: 2026-10-27 (ocho días).

### Hecho
- `CLAUDE.md` con alcance, fuentes, estructura y reglas.
- `datos/` como fuente única: `esquemas.json`, `proyectos.csv` (copia de `Mapa/`),
  `normativa.csv` y `noticias.csv` (solo encabezado).
- `scripts/validar_datos.py` + 7 pruebas en `pruebas/` (todas pasan).
- Hook que valida `datos/` cada vez que Claude edita un archivo allí.
- Skills: `validar`, `ficha-normativa`, `buscar-noticias`, `cierre-sesion`.
- `sitio/index.html` (esqueleto con las 4 secciones) y servidor `sitio` en `launch.json`.

### Hallazgos
- **Coordenadas de los 7 proyectos fuera de Colombia**: el CSV trae `49,653` / `-739,128`
  en vez de `4,9653` / `-73,9128`. Al exportar se perdió la posición del separador decimal.
  El mapa actual (`Mapa/`) ubica mal los puntos. Corregir en la `Base de datos SAEB`
  (formato de celda) y volver a exportar.

### Pendiente
- Respuestas a las preguntas 5–20 de la sesión anterior.
- Foto de la pizarra 3.
