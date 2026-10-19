---
name: buscar-noticias
description: Busca noticias recientes de almacenamiento de energía (SAEB/BESS) en Colombia y las agrega como 'Pendiente' a datos/noticias.csv para curaduría. Usar cuando el usuario pida actualizar noticias.
---

1. Lee `datos/noticias.csv` para saber la fecha de la última noticia y no repetir enlaces.
2. Busca en la web desde esa fecha. Términos sugeridos: "almacenamiento de energía
   Colombia", "SAEB", "BESS Colombia", "baterías subasta UPME", "CREG almacenamiento",
   y los nombres de proyectos de `datos/proyectos.csv`.
3. Prioriza fuentes primarias (CREG, MME, UPME, XM, CNO, empresas) y medios
   especializados. Descarta notas sin fecha o que solo repiten un comunicado ya incluido.
4. Agrega cada noticia con `publicacion` = `Pendiente`, un `resumen` propio de 1–2 frases
   (sin copiar el texto del medio), `etiquetas` separadas por `;` y, si aplica,
   `proyecto_relacionado` o `norma_relacionada` con los valores exactos de los otros CSV.
5. Presenta al usuario la lista para que marque `Aprobado` o `Rechazado`. Solo las que tienen
   `publicacion = Aprobado` se publican.
