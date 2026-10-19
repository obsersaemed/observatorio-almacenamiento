# Guía de construcción - Dashboard BESS en Looker Studio

Paso a paso para armar el reporte del Observatorio BESS sobre la hoja **Base de datos SAEB**. Sigue el orden: datos → campos calculados → tema → páginas → publicación.

Base visual: `Propuesta.pdf`, con las correcciones de la sección 0.

## 0. Qué cambia frente a la propuesta

| En la propuesta | En el reporte | Por qué |
|---|---|---|
| "Potencia total instalada 67 MW" | **Potencia en operación** (solo proyectos en operación) | La suma incluía proyectos suspendidos y por construir |
| Barras MW y MWh en el mismo eje | Dos gráficos: **potencia (MW)** y **duración (h)** por proyecto | MW y MWh son unidades distintas; en un solo eje la comparación engaña |
| Línea "Potencia vs FPO" | **Columnas por año**, apiladas por estado | Una línea sugiere una tendencia continua entre años sueltos |
| Dona de tecnología (100% Li-ion) | **Barras por tipo de uso** | Una dona con una sola categoría no informa nada |
| Estados: operación / construcción / suspendido | Los 4 estados reales de la hoja | "Asignado por subasta" y "En ejecución" no tenían color |
| Encabezado, menú, ES/EN | No van en Looker | Son del sitio TEJ; el reporte se inserta debajo |

## 1. Conectar la hoja

1. Entra a https://lookerstudio.google.com → **Crear** → **Informe**.
2. Conector **Hojas de cálculo de Google** → `Base de datos SAEB` → hoja `Hoja 1`.
3. Deja marcado **Usar la primera fila como encabezados**. Pulsa **Añadir**.

### 1.1 Configurar los campos

Menú **Recurso → Administrar fuentes de datos añadidas → Editar**. Renombra cada campo (lápiz al lado del nombre) y ajusta el tipo:

| Campo en la hoja | Nombre en Looker | Tipo | Agregación |
|---|---|---|---|
| Nombre | Proyecto | Texto | - |
| Operador | Operador | Texto | - |
| Estado | Estado original | Texto | - |
| Tecnologia | Tecnología | Texto | - |
| FPO | Año FPO | Fecha y hora → **Año (AAAA)** | - |
| Tipo uso/conexión | Tipo de uso | Texto | - |
| Punto de conexión kV | Conexión kV | Número | Ninguna |
| Departamento | Departamento | Texto | - |
| Municipio | Municipio | Texto | - |
| Latitud | Latitud | Número | Ninguna |
| Longitud | Longitud | Número | Ninguna |
| Potencia nominal [MW] | Potencia MW | Número | **Suma** |
| Capacidad máxima [MWh] | Capacidad MWh | Número | **Suma** |

Las demás columnas (eficiencias, SOC, Booleano, enlaces) se dejan sin usar por ahora.

> Varios valores de la hoja tienen espacios al final ("La Martina ", "Enel-Emgesa "). No se ven, pero pueden partir un filtro en dos opciones. Los campos calculados de abajo usan `TRIM` para evitarlo.

### 1.2 Credenciales

En la misma pantalla de la fuente: **Credenciales de datos → Propietario**. Así los visitantes del sitio ven los datos sin necesitar acceso a la hoja.

## 2. Campos calculados

En la fuente de datos: **Añadir un campo** (arriba a la derecha). Copia el nombre y la fórmula tal cual. Al escribir la fórmula, elige los campos desde el autocompletado: Looker acepta nombres con espacios.

**Estado** (reemplaza a "Estado original" en todos los gráficos)

```
TRIM(Estado original)
```

**Fase** (agrupa los estados para los indicadores)

```
CASE
  WHEN Estado = "En operación" THEN "Operación"
  WHEN Estado IN ("En ejecución", "Asignado por subasta") THEN "En desarrollo"
  WHEN Estado = "Suspendido" THEN "Suspendido"
  ELSE "Otro"
END
```

**MW en operación**

```
CASE WHEN Estado = "En operación" THEN Potencia MW ELSE 0 END
```

**MWh en operación**

```
CASE WHEN Estado = "En operación" THEN Capacidad MWh ELSE 0 END
```

**MW en desarrollo**

```
CASE WHEN Estado IN ("En ejecución", "Asignado por subasta") THEN Potencia MW ELSE 0 END
```

**Proyectos en operación**

```
CASE WHEN Estado = "En operación" THEN 1 ELSE 0 END
```

**Duración h** (horas de descarga a potencia nominal; se calcula sobre las sumas para que sea correcta también al agrupar varios proyectos)

```
SUM(Capacidad MWh) / SUM(Potencia MW)
```

**Ubicación**

```
CONCAT(TRIM(Municipio), ", ", TRIM(Departamento))
```

Valores esperados con los 7 proyectos actuales, para verificar:

| Indicador | Valor |
|---|---|
| MW en operación | 17 |
| MWh en operación | 12,8 |
| Proyectos en operación | 3 (de 7 registrados) |
| MW en desarrollo | 118 |
| MW suspendidos | 50 |

## 3. Tema y lienzo

**Tema y diseño → Tema → Personalizar**:

| Elemento | Valor |
|---|---|
| Fuente | **Raleway** (títulos y cuerpo). Si no aparece en la lista, usar Open Sans |
| Color de texto principal | #3C4043 |
| Color de texto secundario | #6B7075 |
| Fondo del informe | #F4F5F6 |
| Fondo de componentes | #FFFFFF |
| Borde de componentes | #D9DCDF, 1 px, radio 10 |
| Paleta de series (en orden) | #5F6B73, #AAB2B8, #2F63A8, #E0A030 |

**Tema y diseño → Diseño**:

- Tamaño del lienzo: **Personalizado**, ancho **1200**, alto **1900**.
- Modo de visualización: **Ajustar al ancho**.
- Cuadrícula: 20 px, con **Ajustar a la cuadrícula**.

### 3.1 Colores fijos por estado

Para que cada estado tenga siempre el mismo color en todos los gráficos y en el mapa: en cualquier gráfico que use la dimensión **Estado** → pestaña **Estilo** → **Color por → Valores de dimensión**, y asigna:

| Estado | Color |
|---|---|
| En operación | #2F9E5A |
| En ejecución | #E0A030 |
| Asignado por subasta | #2F63A8 |
| Suspendido | #A8323E |

Looker recuerda la asignación para todo el informe. Esta paleta se validó para daltonismo (protanopia, deuteranopia y tritanopia): todos los pares se distinguen. El amarillo tiene poco contraste sobre blanco; por eso **el estado siempre va acompañado de su nombre** (leyenda o etiqueta), nunca solo del color.

## 4. Página 1 - Inventario

Posiciones en píxeles (x, y, ancho × alto) sobre el lienzo de 1200. Margen lateral de 40.

### 4.1 Encabezado (y = 30)

| Elemento | Componente | Posición | Contenido / estilo |
|---|---|---|---|
| Antetítulo | Texto | 40, 30, 600×24 | `OBSERVATORIO · ALMACENAMIENTO`, 13 px, negrita, espaciado de letras amplio, #6B7075 |
| Título | Texto | 40, 58, 760×90 | `Sistemas de almacenamiento de energía en Colombia`, 34 px, negrita |
| Descripción | Texto | 40, 150, 700×60 | `Inventario de sistemas BESS (baterías): operadores, potencias y capacidades, con seguimiento del estado de cada proyecto.` 15 px, #6B7075 |

### 4.2 Filtros (y = 230)

Tres **controles de lista desplegable**, de 260×40 cada uno, en una sola fila:

| Control | Dimensión | Posición |
|---|---|---|
| Estado | Estado | 40, 230 |
| Departamento | Departamento | 320, 230 |
| Tipo de uso | Tipo de uso | 600, 230 |

### 4.3 Indicadores (y = 290)

Cuatro **cuadros de resultados**, de 265×110, separados 20 px (x = 40, 325, 610, 895):

| Título | Métrica | Decimales | Fondo |
|---|---|---|---|
| Potencia en operación (MW) | MW en operación (Suma) | 1 | #5F6B73, texto blanco |
| Capacidad en operación (MWh) | MWh en operación (Suma) | 1 | #5F6B73, texto blanco |
| Proyectos en operación | Proyectos en operación (Suma) | 0 | #5F6B73, texto blanco |
| Potencia en desarrollo (MW) | MW en desarrollo (Suma) | 1 | #FFFFFF, texto #3C4043 |

Estilo: etiqueta de 13 px arriba, valor de 40 px en negrita. **Sin** comparaciones ni porcentajes. Para el formato numérico (punto para miles, coma para decimales): **Archivo → Configuración del informe → Configuración regional: Español (Colombia)**.

### 4.4 Mapa y estado (y = 420)

| Elemento | Componente | Posición | Configuración |
|---|---|---|---|
| Mapa | **Insertar URL** | 40, 420, 740×480 | URL del mapa (GitHub Pages). Borde 1 px #D9DCDF, radio 10 |
| Estado de proyectos | **Barras horizontales** | 800, 420, 360×230 | Dimensión: Estado. Métrica: Recuento de Proyecto. Orden: métrica desc. Etiquetas de datos activadas. Colores por valor de dimensión (3.1). Sin ejes ni cuadrícula |
| Tipo de uso | **Barras horizontales** | 800, 670, 360×230 | Dimensión: Tipo de uso. Métrica: Potencia MW. Color único #5F6B73. Etiquetas de datos activadas |

> El mapa insertado por URL **no responde a los filtros** de Looker: siempre muestra todos los proyectos. Añade debajo una nota de 11 px: "El mapa muestra todos los proyectos registrados."

### 4.5 Potencia y duración por proyecto (y = 920)

Dos gráficos lado a lado, con el **mismo orden** de proyectos para leerlos como una sola fila.

| Elemento | Componente | Posición | Configuración |
|---|---|---|---|
| Potencia nominal (MW) por proyecto | Barras horizontales | 40, 920, 550×330 | Dimensión: Proyecto. Métrica: Potencia MW. **Desglose: Estado** (barras apiladas) para heredar el color. Orden: Potencia MW desc |
| Duración (h) por proyecto | Barras horizontales | 610, 920, 550×330 | Dimensión: Proyecto. Métrica: Duración h, 1 decimal. Color #AAB2B8. Orden: **Potencia MW desc** (orden secundario: Proyecto asc) |

> Duración = MWh / MW. Un sistema de 2 h entrega su potencia nominal durante 2 horas.

### 4.6 Potencia por año de puesta en operación (y = 1270)

| Componente | Posición | Configuración |
|---|---|---|
| **Columnas apiladas** | 40, 1270, 1120×300 | Dimensión: Año FPO. Desglose: Estado. Métrica: Potencia MW. Orden: Año FPO **asc**. Colores por estado. Leyenda arriba. Título: "Potencia nominal (MW) por año de puesta en operación" |

Los años futuros (2027, 2030) son fechas previstas de los proyectos en desarrollo; el color del estado lo deja claro.

### 4.7 Inventario (y = 1590)

| Componente | Posición | Configuración |
|---|---|---|
| **Tabla** | 40, 1590, 1120×260 | Dimensiones: Proyecto, Operador, Estado, Año FPO, Ubicación, Tipo de uso. Métricas: Potencia MW, Capacidad MWh, Duración h. Orden: Estado asc, Potencia MW desc. Filas por página: 10 |

Estilo de la tabla: encabezado #F4F5F6 en negrita, filas alternas, sin numeración de filas. **Formato condicional**: una regla por estado (Estado = "En operación" → color de texto #2F9E5A, y así con los demás) para colorear el texto de la columna Estado.

**Filtro cruzado**: en la tabla y en los gráficos de barras, pestaña **Configuración → Interacciones de gráficos → Filtrado cruzado** activado. Un clic en una fila o barra filtra el resto de la página.

### 4.8 Pie de página (y = 1860)

Texto de 11 px, #6B7075: "Fuente: Observatorio TEJ, registro propio a partir de fuentes públicas. Ubicaciones aproximadas (cabecera municipal). Última actualización: <fecha>."

## 5. Página 2 - Regulación y subastas

Pendiente de datos. Para construirla se necesita una hoja nueva `Regulacion` en el mismo archivo, con estas columnas (una fila por norma o evento):

| Columna | Ejemplo |
|---|---|
| Fecha | 2023-09-15 |
| Entidad | CREG / UPME / MinEnergía / XM |
| Tipo | Resolución, Decreto, Circular, Subasta, Convocatoria |
| Número | Número oficial de la norma |
| Título | Texto corto |
| Tema | Remuneración, Conexión, Servicios complementarios, Subasta |
| Estado | Vigente, En consulta, Derogada |
| Resumen | 1 a 2 líneas |
| Enlace | URL oficial |

Diseño propuesto: filtros (Entidad, Tema, Estado), línea de tiempo como tabla ordenada por fecha descendente y barras de normas por tema. Se arma con la misma lógica de la página 1 cuando la hoja tenga datos.

## 6. Publicar e insertar en el sitio TEJ

1. **Compartir → Gestionar acceso**: "Cualquier persona con el enlace puede ver".
2. **Archivo → Insertar informe** → activar **Habilitar la inserción** → copiar el código `<iframe>`.
3. Quien administre el sitio TEJ pega el `<iframe>` en la página de la sección (en la maqueta, el recuadro de la derecha). Ancho 100%, alto aproximado de 1900 px.
4. La hoja se refresca sola; Looker guarda en caché unos 15 minutos. Para forzar la recarga: en el informe, menú **⋮ → Actualizar datos**.

## 7. Lista de revisión

- [ ] Los 4 indicadores coinciden con la tabla de la sección 2.
- [ ] Cada estado tiene el mismo color en barras, columnas, tabla y mapa.
- [ ] Ningún gráfico mezcla MW y MWh en el mismo eje.
- [ ] Los filtros no muestran valores duplicados (espacios al final).
- [ ] Un clic en una fila de la tabla filtra los gráficos.
- [ ] Vista en móvil: el iframe se ve completo en el sitio.
