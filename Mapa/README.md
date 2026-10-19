# Inventario de SAEB en Colombia

Mapa web de los sistemas de almacenamiento de energía con baterías (SAEB) en Colombia,
publicado con GitHub Pages.

## Archivos

| Archivo | Qué es | ¿Se edita? |
|---|---|---|
| `index.html` | El mapa (diseño, colores, etiqueta). | Solo si cambias el diseño. |
| `proyectos.csv` | Los datos de los proyectos (copia de la Hoja 1 de *Base de datos SAEB*). | **Sí, cada vez que actualices datos.** |
| `README.md` | Esta guía. | No. |

`proyectos.csv` debe tener **las mismas columnas y en el mismo orden** que la Hoja 1:

`Nombre, Operador, Estado, Tecnologia, FPO, Tipo uso/conexión, Punto de conexión kV, Departamento,
Municipio, Latitud, Longitud, Potencia nominal [MW], Capacidad máxima [MWh], Potencia máxima de descarga [MW],
Potencia máxima de carga [MW], Estado de carga mínimo técnico [%], Eficiencia mínima [%],
Eficiencia de carga [%], Eficiencia de descarga [%], Eficiencia de almacenamiento [%],
Tiempo para aporte de máxima potencia [%], Tipo de compensación adicional, Fuente`

- **Estado** debe ser uno de: `En operación`, `En construcción`, `Anunciado`, `Inactivo`.
- **Latitud / Longitud** en grados decimales (`4,9653` o `4.9653`). Sin coordenadas el punto no aparece.
- **Fuente**: uno o varios enlaces separados por espacio o salto de línea.
- Las columnas técnicas vacías no se muestran en la etiqueta.

---

## Configuración inicial (una sola vez)

### 1. Instalar lo necesario
1. **Git**: descarga e instala desde <https://git-scm.com/download/win> (opciones por defecto).
2. **VS Code**: <https://code.visualstudio.com>.
3. Abre una terminal en VS Code (*Terminal → New Terminal*) y configura tu nombre y correo
   (los mismos de tu cuenta de GitHub):
   ```bash
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu_correo@ejemplo.com"
   ```

### 2. Crear el repositorio en GitHub
1. Entra a <https://github.com/new>.
2. **Repository name**: por ejemplo `mapa-saeb-colombia`.
3. Márcalo como **Public** (GitHub Pages gratis requiere repositorio público).
4. **No** marques *Add a README* (ya tienes uno). Clic en **Create repository**.

### 3. Subir esta carpeta desde VS Code
1. En VS Code: *File → Open Folder…* y abre la carpeta `Mapa`.
2. Ve al panel **Source Control** (ícono de ramas, o `Ctrl+Shift+G`).
3. Clic en **Initialize Repository**.
4. Escribe un mensaje, por ejemplo `Primera versión del mapa`, y clic en **Commit**
   (si pregunta si quieres incluir todos los cambios, responde **Yes**).
5. Clic en **Publish Branch** → elige **Publish to GitHub public repository**
   → selecciona el nombre `mapa-saeb-colombia`.
   - Si ya creaste el repositorio en el paso 2 y VS Code no lo ofrece, usa la terminal:
     ```bash
     git branch -M main
     git remote add origin https://github.com/TU_USUARIO/mapa-saeb-colombia.git
     git push -u origin main
     ```
6. La primera vez VS Code te pedirá iniciar sesión en GitHub: acepta en el navegador.

### 4. Activar GitHub Pages
1. En GitHub, abre el repositorio → **Settings** → **Pages** (menú izquierdo).
2. En **Build and deployment → Source** elige **Deploy from a branch**.
3. **Branch**: `main` y carpeta `/ (root)` → **Save**.
4. Espera 1–2 minutos y recarga la página: aparecerá el enlace público,
   algo como `https://TU_USUARIO.github.io/mapa-saeb-colombia/`.

---

## Actualizar los datos (cada vez que cambie la base de datos)

1. Edita la hoja **Base de datos SAEB → Hoja 1** en Google Sheets (agrega o corrige proyectos).
2. Con la **Hoja 1** abierta: *Archivo → Descargar → Valores separados por comas (.csv)*.
   (Descarga solo la pestaña que está abierta, por eso debe ser la Hoja 1.)
3. Cambia el nombre del archivo descargado a **`proyectos.csv`** y reemplaza el que está en la carpeta `Mapa`.
4. (Opcional) Revísalo en tu computador antes de subirlo — ver sección siguiente.
5. En VS Code → **Source Control**: verás `proyectos.csv` como modificado.
   Escribe un mensaje (ej. `Actualiza datos: nuevo proyecto X`) → **Commit** → **Sync Changes**.
6. En 1–2 minutos el mapa público mostrará los datos nuevos
   (si no, recarga con `Ctrl+F5`).

## Ver el mapa en tu computador

El mapa **no funciona con doble clic** sobre `index.html` (OpenStreetMap bloquea el mapa base y el
navegador no deja leer `proyectos.csv`). Ábrelo con un servidor local, desde la terminal de VS Code
en la carpeta `Mapa`:

```bash
python -m http.server 8767
```

y entra a <http://localhost:8767>. Para detenerlo: `Ctrl+C` en la terminal.

Alternativa: instala la extensión **Live Server** en VS Code y haz clic en **Go Live** (abajo a la derecha).

## Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| Recuadro rojo "No se pudo leer proyectos.csv" | El archivo no se llama exactamente `proyectos.csv` o no está junto a `index.html`. |
| Un proyecto no aparece | Le faltan Latitud/Longitud o tienen texto que no es número. |
| El punto aparece en gris y debería tener otro color | El Estado está escrito distinto (ej. "Operando"). Usa los cuatro valores de la lista. |
| Mapa base con "Access blocked" | Abriste el archivo con doble clic. Usa GitHub Pages o el servidor local. |
| Subí cambios y no se ven | Espera 1–2 minutos y recarga con `Ctrl+F5`. Revisa la pestaña **Actions** del repositorio por errores. |
