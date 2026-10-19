# Guía de construcción - Dashboard de vehículos eléctricos en Looker Studio

Paso a paso para armar el reporte "Almacenamiento de energía en vehículos eléctricos" sobre la hoja **VEHICULOS_ELECTRICOS**. Sigue el orden: datos → campos calculados → tema → página → verificación → publicación.

Base visual: diseño `observatorio-ve` del Observatorio TEJ Design System (`Obs vehiculos/Observatorio vehiculos.pdf`), con las correcciones de la sección 0.

## 0. Qué cambia frente al panel original y al diseño

| Antes | En el reporte | Por qué |
|---|---|---|
| "Tecnología de batería": LFP 85,2 % | **LFP 67,5 %**, calculado sobre el total 2024–2026 | El 85,2 % era solo de las ventas de 2025, aunque se presentaba como total |
| "Potencia acumulada" (LFP 1.261 kWh) | **Energía almacenada por tecnología** (LFP 1,5 M kWh) | Sumaba la capacidad de ficha de cada modelo; no mide nada del parque. Además, kWh es energía, no potencia |
| "Total vehículos circulando" | **Vehículos eléctricos registrados 2024–2026** | La hoja cubre 49 líneas vendidas en 2024–2026, no todo el parque del país |
| Barras por marca con serie "Total" al lado de los años | Barras **apiladas por año**, sin serie "Total" | El total ya es el largo de la barra; repetirlo duplica la información |
| 2026 sin aclaración | **2026 (parcial)** | El año está en curso; compararlo con años completos engaña |
| Colores turquesa, morado, amarillo y verde | Paleta del design system: grises con acento durazno | Coherencia con el sitio del Observatorio TEJ |

## 1. Conectar la hoja

1. Entra a https://lookerstudio.google.com → **Crear** → **Informe**.
2. Conector **Hojas de cálculo de Google** → `VEHICULOS_ELECTRICOS` → hoja `Sheet1`.
3. Deja marcado **Usar la primera fila como encabezados**. Pulsa **Añadir**.

> La hoja es de fevelezf@unal.edu.co y está compartida contigo. Para que el reporte siga funcionando, esa persona no debe quitarte el acceso ni cambiar los nombres de las columnas.

### 1.1 Configurar los campos

Menú **Recurso → Administrar fuentes de datos añadidas → Editar**. Renombra cada campo (lápiz al lado del nombre) y ajusta el tipo:

| Campo en la hoja | Nombre en Looker | Tipo | Agregación |
|---|---|---|---|
| LINEA | Línea | Texto | - |
| MARCA | Marca | Texto | - |
| 2024 | Ventas 2024 | Número | **Suma** |
| 2025 | Ventas 2025 | Número | **Suma** |
| 2026 | Ventas 2026 (parcial) | Número | **Suma** |
| Total | Vehículos | Número | **Suma** |
| Tipo de Bateria | Tipo de batería | Texto | - |
| Capacidad de Bateria Minima (kWh) | Capacidad mínima kWh | Número | Promedio |
| Capacidad de Bateria Maxima(kWh) | Capacidad máxima kWh | Número | Promedio |
| Potencia(kW) | Potencia kW | Número | Promedio |
| Promedio Capacidad | Capacidad promedio kWh | Número | Promedio |
| Total kWh Circulando | Energía kWh | Número | **Suma** |

> Las columnas de capacidad y potencia describen la ficha técnica de cada modelo. **Nunca se suman**: por eso su agregación es Promedio. Sumarlas fue el error del gráfico "Potencia acumulada".

### 1.2 Credenciales

En la misma pantalla de la fuente: **Credenciales de datos → Propietario**. Así los visitantes del sitio ven los datos sin necesitar acceso a la hoja.

## 2. Campos calculados

En la fuente de datos: **Añadir un campo** (arriba a la derecha). Copia el nombre y la fórmula tal cual; elige los campos desde el autocompletado.

**Marca limpia** (evita que un espacio al final parta un filtro en dos opciones)

```
TRIM(Marca)
```

**Línea limpia**

```
TRIM(Línea)
```

**Capacidad promedio ponderada kWh** (energía promedio por vehículo; correcta también al agrupar varias líneas)

```
SUM(Energía kWh) / SUM(Vehículos)
```

**Propulsión** (opcional, ver sección 6: separa híbridos enchufables de eléctricos puros)

```
CASE
  WHEN Línea IN ("Byd song plus dm-i", "Song plus dmi", "Qin plus dmi", "330e", "X5 xdrive50e", "X3 xdrive30e", "Xc60", "Xc90") THEN "Híbrido enchufable"
  ELSE "Eléctrico puro"
END
```

En los gráficos y filtros usa **Marca limpia** y **Línea limpia** en lugar de los campos originales.

## 3. Tema y lienzo

**Tema y diseño → Tema → Personalizar** (valores del Observatorio TEJ Design System):

| Elemento | Valor |
|---|---|
| Fuente | **Raleway** (títulos y cuerpo). Si no aparece en la lista, usar Open Sans |
| Color de títulos | #2B2F31 |
| Color de texto | #595F63 |
| Color de texto secundario | #7F868A |
| Fondo del informe | #F5F8F9 |
| Fondo de componentes | #FFFFFF |
| Borde de componentes | #E6EAEC, 1 px, radio 16 |
| Sombra de componentes | Activada, suave |

**Tema y diseño → Diseño**:

- Tamaño del lienzo: **Personalizado**, ancho **1200**, alto **1450**.
- Modo de visualización: **Ajustar al ancho**.
- Cuadrícula: 20 px, con **Ajustar a la cuadrícula**.

**Archivo → Configuración del informe → Configuración regional: Español (Colombia)**, para que los números salgan con punto de miles y coma decimal.

### 3.1 Colores fijos

Años (series de las barras por marca):

| Serie | Color |
|---|---|
| Ventas 2024 | #A6ADB1 |
| Ventas 2025 | #565D61 |
| Ventas 2026 (parcial) | #F4B183 |

Tipo de batería (en cada gráfico que use la dimensión: **Estilo → Color por → Valores de dimensión**):

| Tipo de batería | Color |
|---|---|
| LFP | #4A5155 |
| Lithium-ion | #A6ADB1 |
| NMC Lithium-ion | #F4B183 |
| ULTIUM | #CDD2D4 |

Marcas (participación en el mercado), de mayor a menor: #33383B, #4A5155, #5C6367, #6B7276, #7F868A, #8B9296, #A6ADB1, #BCC2C5, #CDD2D4 y "Otros" #E4E7E8.

Los colores siguen a la categoría y no a su posición: LFP es siempre #4A5155 aunque un filtro cambie el orden. Como varios grises se parecen entre sí, **cada sector lleva su nombre y su porcentaje** en la leyenda; el color nunca va solo.

## 4. Página - Almacenamiento en vehículos eléctricos

Posiciones en píxeles (x, y, ancho × alto) sobre el lienzo de 1200. Margen lateral de 40.

### 4.1 Encabezado (y = 30)

| Elemento | Componente | Posición | Contenido / estilo |
|---|---|---|---|
| Antetítulo | Texto | 40, 30, 600×24 | `OBSERVATORIO · MOVILIDAD ELÉCTRICA`, 13 px, negrita, espaciado de letras amplio, #595F63 |
| Título | Texto | 40, 58, 760×90 | `Almacenamiento de energía en vehículos eléctricos`, 34 px, negrita, #2B2F31 |
| Descripción | Texto | 40, 150, 700×60 | `Vehículos eléctricos registrados en Colombia entre 2024 y 2026: ventas por marca, tecnologías de batería y energía almacenada en circulación.` 15 px, #595F63 |

### 4.2 Filtros (y = 230)

Un **rectángulo** blanco de fondo (40, 220, 1120×80, radio 16, borde #E6EAEC) y encima tres **controles de lista desplegable** de 340×40:

| Control | Dimensión | Posición |
|---|---|---|
| Marca | Marca limpia | 60, 240 |
| Tipo de batería | Tipo de batería | 430, 240 |
| Línea | Línea limpia | 800, 240 |

En cada control: **Estilo → Etiqueta** en mayúsculas pequeñas (`MARCA`, `TIPO DE BATERÍA`, `LÍNEA`) y la opción **Mostrar "Seleccionar todo"** activada. Los controles se filtran entre sí: al elegir una marca, la lista de líneas solo muestra las de esa marca.

### 4.3 Indicadores (y = 320)

Tres componentes de 360×110, separados 20 px (x = 40, 420, 800):

| Título | Componente | Configuración | Fondo |
|---|---|---|---|
| Vehículos eléctricos registrados · 2024–2026 | Cuadro de resultados | Métrica: Vehículos (Suma). **Números compactos** activado → "45,3 mil" | #6B7276, texto blanco |
| Energía almacenada en circulación [kWh] | Cuadro de resultados | Métrica: Energía kWh (Suma). **Números compactos** → "2,4 M" | #6B7276, texto blanco |
| Tecnología predominante | **Tabla** (ver nota) | Dimensión: Tipo de batería. Métrica: Vehículos con **Cálculo de comparación → Porcentaje del total**. Orden: Vehículos desc. Filas por página: **1**. Sin encabezado ni numeración | #FFFFFF, borde #E6EAEC |

> Un cuadro de resultados no puede mostrar el nombre de la categoría más grande. La tabla de una sola fila ordenada de mayor a menor lo resuelve: muestra "LFP · 67,5 %" y se actualiza con los filtros. Usa texto de 40 px en negrita para el valor.

Estilo de los cuadros: etiqueta de 12 px arriba, valor de 40 px en negrita (ExtraBold), radio 16. **Sin** comparaciones con periodos anteriores.

### 4.4 Ventas por marca y participación (y = 450)

| Elemento | Componente | Posición | Configuración |
|---|---|---|---|
| Vehículos eléctricos vendidos | **Barras horizontales apiladas** | 40, 450, 550×420 | Dimensión: Marca limpia. Métricas, en este orden: Ventas 2024, Ventas 2025, Ventas 2026 (parcial). Orden: **Vehículos desc** (orden por un campo que no se grafica). Barras: **10**. Estilo: **Barras apiladas** activado; colores de la tabla 3.1; etiquetas de datos solo en la última serie, o desactivadas. Subtítulo: `Por marca y año de registro · 10 marcas con más ventas` |
| Participación en el mercado | **Gráfico circular** (anillo) | 610, 450, 550×420 | Dimensión: Marca limpia. Métrica: Vehículos. Número de sectores: **10** (el resto se agrupa como "Otros"). Grosor del anillo: 40 %. Leyenda a la derecha con **etiqueta + porcentaje**. Colores de marcas de la sección 3.1. Subtítulo: `% de vehículos registrados por marca` |

> Las barras no llevan la serie "Total" del panel original: el total es el largo de la barra.

### 4.5 Tecnologías (y = 890)

| Elemento | Componente | Posición | Configuración |
|---|---|---|---|
| Tecnología de batería | **Gráfico circular** (anillo) | 40, 890, 550×340 | Dimensión: Tipo de batería. Métrica: **Vehículos** (no Ventas 2025). Grosor del anillo: 40 %. Leyenda con etiqueta + porcentaje. Colores por valor de dimensión (3.1). Subtítulo: `% de vehículos registrados por química` |
| Energía almacenada por tecnología | **Barras horizontales** | 610, 890, 550×340 | Dimensión: Tipo de batería. Métrica: Energía kWh (Suma), números compactos. Orden: Energía kWh desc. Colores por valor de dimensión (3.1). Etiquetas de datos activadas. Subtítulo: `kWh en circulación (vehículos × capacidad promedio de batería)` |

> Si se quiere conservar un gráfico de capacidad por tecnología, debe usar **Capacidad promedio ponderada kWh** (sección 2), nunca la suma de capacidades.

### 4.6 Filtro cruzado

En los cuatro gráficos: pestaña **Configuración → Interacciones de gráficos → Filtrado cruzado** activado. Un clic en una marca o en una química filtra el resto de la página.

### 4.7 Metodología (y = 1250)

Rectángulo blanco (40, 1250, 1120×160, radio 16) con un texto de 13 px, #595F63:

- Fuente: hoja VEHICULOS_ELECTRICOS (Observatorio TEJ), a partir de registros de ventas por línea. 49 líneas de 19 marcas. Corte: <fecha de corte>.
- 2026 es un año parcial: incluye los registros hasta la fecha de corte.
- Energía almacenada = vehículos registrados × capacidad promedio de la batería de cada línea (promedio entre la versión de menor y de mayor capacidad).
- Las cifras corresponden a las líneas incluidas en la base, no al parque automotor eléctrico total del país.

## 5. Verificación

Con los datos actuales (49 líneas), sin filtros:

| Indicador | Valor esperado |
|---|---|
| Vehículos eléctricos registrados | 45,3 mil (45.346) |
| Energía almacenada en circulación | 2,4 M kWh (2.426.467) |
| Tecnología predominante | LFP · 67,5 % |
| Byd | 19.793 vehículos (4.165 / 10.548 / 5.080) · 43,6 % |
| Tesla | 7.760 vehículos (0 / 21 / 7.739) · 17,1 % |
| LFP / Lithium-ion / NMC / ULTIUM (vehículos) | 67,5 % / 29,7 % / 2,2 % / 0,6 % |
| Energía LFP / Lithium-ion / NMC / ULTIUM | 1,5 M / 791,1 mil / 69,6 mil / 21,3 mil kWh |

Con el filtro **Marca = Tesla**: 7,8 mil vehículos, 538,6 mil kWh, tecnología predominante Lithium-ion · 100 %, y la lista de líneas muestra solo Model 3 y Model Y.

> Si la tecnología predominante sale **85,2 %**, el gráfico está usando Ventas 2025 en lugar de Vehículos.

## 6. Pendientes de validar en la hoja

1. **Híbridos enchufables.** La hoja incluye Byd song plus dm-i, Song plus dmi, Qin plus dmi, BMW 330e, X5 xdrive50e, X3 xdrive30e, Volvo Xc60 y Xc90. Si el observatorio es solo de eléctricos puros, hay dos opciones: sacarlos de la hoja, o agregar el campo **Propulsión** (sección 2) como filtro de la fuente de datos (**Recurso → Administrar filtros → Propulsión = Eléctrico puro**).
2. **Línea duplicada.** "Byd song plus dm-i" y "Song plus dmi" parecen la misma línea escrita de dos formas. Si lo son, unirlas en una sola fila.
3. **Origen de las ventas por línea.** Si vienen de ANDEMOS, revisar la restricción de publicación antes de hacer público el reporte.
4. **Fecha de corte.** Confirmar la fecha real del dato y escribirla en el texto de metodología.

## 7. Publicar e insertar en el sitio TEJ

1. **Compartir → Gestionar acceso**: "Cualquier persona con el enlace puede ver".
2. **Archivo → Insertar informe** → activar **Habilitar la inserción** → copiar el código `<iframe>`.
3. Quien administre el sitio TEJ pega el `<iframe>` en la página del observatorio. Ancho 100%, alto aproximado de 1450 px.
4. La hoja se refresca sola; Looker guarda en caché unos 15 minutos. Para forzar la recarga: en el informe, menú **⋮ → Actualizar datos**.

## 8. Lista de revisión

- [ ] Los valores sin filtros coinciden con la tabla de la sección 5.
- [ ] La tecnología predominante dice 67,5 %, no 85,2 %.
- [ ] Ningún gráfico suma capacidades ni potencias de ficha técnica.
- [ ] El año 2026 aparece como "(parcial)" en la leyenda.
- [ ] Cada química tiene el mismo color en el anillo y en las barras de energía.
- [ ] Con Marca = Tesla, la lista de líneas muestra solo Model 3 y Model Y.
- [ ] Un clic en una marca del anillo filtra los demás gráficos.
- [ ] Vista en móvil: el iframe se ve completo en el sitio.
