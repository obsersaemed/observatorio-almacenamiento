---
name: ficha-normativa
description: Prepara la ficha condensada y explicada de una norma (CREG, MME, CNO, UPME, XM) y la propone a la cola de revisión del observatorio (aporte Pendiente, origen agente) con scripts/proponer_aporte.py. Usar cuando el usuario comparta una resolución, decreto, acuerdo o enlace normativo.
---

Entrada: número de la norma, enlace o PDF. La ficha no se escribe en `datos/normativa.csv`:
se **propone** a la cola de aportes y un editor la aprueba en `/admin`.

1. Lee el documento oficial (el PDF o la página del emisor). Si no puedes leerlo, para y
   pide el documento: nunca redactes una ficha de memoria.
2. Prepara los campos según `datos/esquemas.json` (esquema `normativa`, nombres SQL):
   - `id`: `EMISOR-TIPO-NUMERO-AÑO`, p. ej. `CREG-RES-098-2019`.
   - `fecha`: fecha de expedición, AAAA-MM-DD.
   - `emisor`, `tipo`, `numero`, `titulo`, `estado`: con los valores permitidos del esquema.
   - `resumen` (condensar): 2–3 frases. Qué es, a quién aplica, qué cambia.
   - `explicacion` (explicar): máximo 120 palabras, lenguaje claro para empresas,
     ingenieros y academia; impacto práctico para el almacenamiento.
   - `aplica_a` y `relacionada_con` (ids de normas que modifica o deroga, separados por `;`).
   - `enlace`: URL oficial del documento.
3. En la conversación (no en la ficha), cita el artículo del que sale cada afirmación clave.
4. Muestra la ficha al usuario. Con su visto bueno, escribe un JSON temporal en el
   scratchpad y propónla:

   ```json
   {
     "tipo": "Norma",
     "agente": "ficha-normativa",
     "descripcion": "Ficha de la <norma> preparada desde el documento oficial",
     "fuente": "https://url-oficial",
     "datos": { "id": "...", "fecha": "...", "emisor": "...", "tipo": "...", "numero": "...",
                "titulo": "...", "estado": "...", "resumen": "...", "explicacion": "...",
                "aplica_a": "...", "relacionada_con": "...", "enlace": "https://url-oficial" }
   }
   ```

   ```bash
   python scripts/proponer_aporte.py --entorno pruebas --archivo <ruta-al-json>
   ```

5. Si la norma modifica o deroga otra ya publicada, propón además una **Corrección** de esa
   norma (`"tipo": "Corrección"`, `"registro_afectado": "<id>"`, `"datos": {"tabla": "normas",
   "estado": "Modificada"}`).
6. Da al usuario el número de seguimiento y anota la ficha en `BITACORA.md`.
