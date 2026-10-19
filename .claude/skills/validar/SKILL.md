---
name: validar
description: Valida los datos del observatorio (proyectos, normativa, noticias) y corre las pruebas. Usar antes de publicar o cuando el usuario pida revisar los datos.
---

1. Corre `python scripts/validar_datos.py` y `python -m unittest discover pruebas`.
2. Resume en español: número de errores y avisos, agrupados por archivo.
3. Para cada error propone la corrección, pero **no** cambia cifras, coordenadas ni
   fechas sin confirmación del usuario: los datos vienen de la `Base de datos SAEB`
   y la corrección debe hacerse también allá.
4. Si todo pasa, dilo en una línea.
