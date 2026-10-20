---
name: buscar-noticias
description: Busca noticias recientes de almacenamiento de energía (SAEB/BESS) en Colombia y las propone a la cola de revisión del observatorio (aportes Pendiente, origen agente) con scripts/proponer_aporte.py. Usar cuando el usuario pida actualizar o buscar noticias.
---

Las noticias no se escriben en `datos/noticias.csv`: se **proponen** a la cola de aportes y
un editor las aprueba en `/admin`. Nada se publica sin esa aprobación.

1. Consulta qué hay para no repetir: descarga `http://localhost:3000/datos/noticias.csv`
   (o el sitio publicado) y revisa en `/admin` los aportes pendientes de tipo Noticia.
2. Busca en la web. Términos sugeridos: "almacenamiento de energía Colombia", "SAEB",
   "BESS Colombia", "baterías subasta UPME", "CREG almacenamiento" y los nombres de los
   proyectos publicados (`/datos/proyectos.csv`).
3. Prioriza fuentes primarias (CREG, MME, UPME, XM, CNO, empresas) y medios especializados.
   Descarta notas sin fecha o que solo repiten un comunicado ya incluido. No inventes
   fechas, cifras ni titulares: todo sale de la nota.
4. Por cada noticia, escribe un JSON temporal (en el scratchpad, no en el repositorio) y
   propónlo:

   ```json
   {
     "tipo": "Noticia",
     "agente": "buscar-noticias",
     "descripcion": "Por qué es relevante para el observatorio (1 frase)",
     "fuente": "https://enlace-de-la-nota",
     "datos": {
       "fecha": "AAAA-MM-DD",
       "titulo": "Titular tal como aparece",
       "medio": "Nombre del medio",
       "enlace": "https://enlace-de-la-nota",
       "resumen": "Resumen propio de 1–2 frases, sin copiar el texto del medio",
       "etiquetas": "subasta;CREG",
       "proyecto_relacionado": "Nombre exacto del proyecto, si aplica",
       "norma_relacionada": "id exacto de la norma, si aplica"
     }
   }
   ```

   ```bash
   python scripts/proponer_aporte.py --entorno pruebas --archivo <ruta-al-json>
   ```

   El script valida con las mismas reglas que el formulario y responde con el número de
   seguimiento. Si rechaza algo, corrígelo; no lo fuerces.
5. Presenta al usuario la lista de números de seguimiento con titular y medio, y recuérdale
   que debe revisarlas y aprobarlas o rechazarlas en `/admin`.
