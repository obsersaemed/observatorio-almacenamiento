---
name: ficha-normativa
description: Agrega una norma (CREG, MME, CNO, UPME, XM) a datos/normativa.csv con su versión condensada y explicada. Usar cuando el usuario comparta una resolución, decreto, acuerdo o enlace normativo.
---

Entrada: número de la norma, enlace o PDF.

1. Lee el documento oficial (el PDF o la página del emisor). Si no puedes leerlo, para
   y pide el documento: nunca redactes una ficha de memoria.
2. Llena una fila de `datos/normativa.csv` según `datos/esquemas.json`:
   - `id`: `EMISOR-TIPO-NUMERO-AÑO`, p. ej. `CREG-RES-098-2019`.
   - `fecha`: fecha de expedición, AAAA-MM-DD.
   - `resumen` (condensar): 2–3 frases. Qué es, a quién aplica, qué cambia.
   - `explicacion` (explicar): máximo 120 palabras, lenguaje claro para empresas,
     ingenieros y academia; impacto práctico para el almacenamiento.
   - `relacionada_con`: ids de normas que modifica o deroga, separados por `;`.
     Si modifica o deroga una norma existente, actualiza el `estado` de esa norma.
3. Cita el artículo del que sale cada afirmación clave en la conversación (no en el CSV).
4. El hook valida el CSV al guardar; corrige lo que reporte.
5. Muestra la ficha al usuario para que la apruebe y anótala en `BITACORA.md`.
