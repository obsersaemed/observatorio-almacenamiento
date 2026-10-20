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

### Entorno local
- Se instalaron con winget **Node.js 24.20.0 LTS** (npm 11.19.0) y **GitHub CLI 2.102.0**.
- Ya estaban instaladas las dependencias de Python de `Vehiculos/` y Chromium de Playwright.
- Sin Docker y con 3,4 GB de RAM: Supabase local descartado; se usará un proyecto
  "pruebas" en el plan gratuito.

### Supabase (T05)
- Proyecto `observatorio-pruebas` en la organización "Observatorio TEJ" (plan Free).
  Llaves nuevas (`sb_publishable_`/`sb_secret_`) en `web/.env.local`, que no se sube.
- La secret key se rotó el mismo día porque quedó expuesta en una salida de comandos.
- `supabase db push` falló al conectar por el pooler (usuario temporal `cli_login_postgres`)
  aunque los puertos 5432 y 6543 están abiertos. La migración `0001_base.sql` se aplicó en el
  SQL Editor. **Pendiente:** `npx supabase migration repair --status applied 0001` cuando la
  CLI conecte, para que Supabase registre la migración.
- La rama por defecto de Supabase se llama "main · PRODUCTION" aunque el proyecto sea de pruebas.

### Pendiente
- Respuestas a las preguntas 5–20 de la sesión anterior.
- Foto de la pizarra 3.

## 2026-10-20 — Coordenadas corregidas

- El usuario corrigió las coordenadas de los 7 proyectos en `datos/proyectos.csv` (por ejemplo
  `49,653` → `4.9653`). Validador: 0 errores. El archivo venía de Excel en cp1252 y entró sin
  revisión en los commits 4b851aa y 2eeb7ee (con `git add -A`); se pasó a UTF-8 sin cambiar datos.
- `validar_datos.leer_csv` ahora acepta UTF-8 y cp1252 (exportaciones de Excel).
- Lección: revisar `git status` antes de cada commit en lugar de `git add -A` a ciegas.
