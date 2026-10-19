# 001 · Arquitectura y plataforma base — Especificación

Estado: Borrador
Fecha: 2026-10-19
Brainstorm: [brainstorm.md](brainstorm.md)

## Resumen
La plataforma base del observatorio: el armazón común sobre el que se construyen las
cuatro secciones. Muestra al público solo datos aprobados, recibe aportes de usuarios y
de agentes en una cola de moderación, permite que un editor los apruebe y conserva el
historial y un respaldo de todo. Las vistas propias de cada sección (mapa, vehículos,
normativa, noticias) se especifican aparte (002 a 005).

## Historias de usuario
- **HU-01** Como *ingeniero*, quiero entrar al observatorio y ver de inmediato las cifras
  clave de los SAEB en Colombia, para ubicarme antes de explorar.
- **HU-02** Como *empresa*, quiero proponer un proyecto nuevo o una corrección con su
  fuente, para que el inventario refleje mi proyecto.
- **HU-03** Como *investigador*, quiero descargar los datos publicados con su fuente,
  para usarlos en mis análisis.
- **HU-04** Como *editor*, quiero revisar, aprobar o rechazar los aportes pendientes,
  para que solo se publique información verificada.
- **HU-05** Como *editor*, quiero que los agentes me propongan noticias, normas y cambios
  en el mismo lugar que los aportes de usuarios, para revisarlo todo en un solo flujo.
- **HU-06** Como *responsable del observatorio*, quiero un historial y un respaldo diario
  de los datos, para poder auditar y recuperar cualquier cambio.

## Requisitos funcionales
| ID | Requisito | HU |
|---|---|---|
| RF-01 | El sitio público debe mostrar únicamente registros en estado aprobado. | HU-01, HU-04 |
| RF-02 | El inicio debe mostrar los KPI generales (número de proyectos por estado, potencia [MW] y energía [MWh] en operación, por separado) y dar acceso a las cuatro secciones. | HU-01 |
| RF-03 | Cualquier visitante debe poder enviar un aporte de tipo *proyecto nuevo*, *corrección*, *noticia* o *norma*, con al menos un enlace de fuente obligatorio. | HU-02 |
| RF-04 | Todo aporte, de usuario o de agente, debe quedar en estado `Pendiente` y no ser visible al público hasta su aprobación. | HU-02, HU-05 |
| RF-05 | El formulario de aporte debe rechazar envíos automatizados (verificación humana) y limitar los envíos repetidos de un mismo origen. | HU-02 |
| RF-06 | Al enviar un aporte, el visitante debe ver una confirmación con un número de seguimiento. | HU-02 |
| RF-07 | Solo las personas de la lista de editores deben poder entrar al área de administración, con un enlace de acceso enviado a su correo. | HU-04 |
| RF-08 | El editor debe ver la lista de aportes pendientes con su tipo, origen (usuario o agente), fecha y fuente, y, en las correcciones, el valor actual frente al propuesto. | HU-04, HU-05 |
| RF-09 | El editor debe poder aprobar (con o sin ajustes) o rechazar un aporte con un motivo. | HU-04 |
| RF-10 | Un aporte aprobado debe reflejarse en el sitio público en un tiempo máximo acordado [ACLARAR 1]. | HU-04 |
| RF-11 | Cada cambio aprobado debe quedar en un historial con fecha, editor, aporte de origen, valores anteriores y nuevos, y fuente. | HU-06 |
| RF-12 | Los agentes deben enviar sus propuestas por el mismo canal que los usuarios, identificadas con origen `agente` y nombre del agente. | HU-05 |
| RF-13 | Debe existir una exportación diaria de todas las tablas publicadas a CSV versionado en el repositorio. | HU-06 |
| RF-14 | El visitante debe poder descargar en CSV los datos publicados de cada sección, con la columna de fuente y la licencia de uso [ACLARAR 4]. | HU-03 |
| RF-15 | Debe existir una importación inicial desde `Base de datos SAEB` que rechace los registros inválidos y reporte cada rechazo. | HU-06 |
| RF-16 | Las mismas reglas de datos (obligatorios, valores permitidos, rangos y coordenadas dentro de Colombia) deben aplicarse en el formulario, en la aprobación, en la base de datos y en la importación. | HU-02, HU-04 |
| RF-17 | Las transiciones y los KPI deben animarse; con la preferencia de movimiento reducido del sistema, las animaciones deben desactivarse. | HU-01 |

## Criterios de aceptación
**RF-01**
- Dado un proyecto en estado `Pendiente`, cuando un visitante abre cualquier página o
  descarga datos, entonces el proyecto no aparece.

**RF-02**
- Dado el conjunto de proyectos aprobados, cuando se abre el inicio, entonces los KPI de
  MW y MWh "en operación" suman solo proyectos `En operación` y se muestran en tarjetas
  separadas, con coma decimal.

**RF-03**
- Dado el formulario de aporte, cuando se intenta enviar sin enlace de fuente, entonces
  el envío se bloquea con un mensaje que indica el campo faltante.

**RF-04**
- Dado un aporte recién enviado, cuando se consulta el sitio público, entonces no hay
  cambio visible, y el aporte aparece en la lista de pendientes del editor.

**RF-05**
- Dado un envío sin verificación humana válida, cuando llega, entonces se rechaza y no
  se guarda.
- Dado un mismo origen que supera el límite de envíos por hora [ACLARAR 2], cuando envía
  otro, entonces recibe un mensaje de espera.

**RF-06**
- Dado un envío válido, cuando se completa, entonces se muestra un número de seguimiento.

**RF-07**
- Dado un correo que no está en la lista de editores, cuando pide acceso, entonces no
  recibe enlace y no puede ver `/admin`.

**RF-08**
- Dada una corrección de potencia de un proyecto, cuando el editor la abre, entonces ve
  el valor actual y el propuesto lado a lado, con su fuente.

**RF-09**
- Dado un aporte pendiente, cuando el editor lo rechaza sin motivo, entonces el sistema
  exige el motivo.
- Dado un aporte que el editor ajusta antes de aprobar, cuando lo aprueba, entonces se
  publica la versión ajustada y el historial guarda ambas.

**RF-10**
- Dado un aporte aprobado, cuando pasa el tiempo máximo acordado, entonces el cambio es
  visible en el sitio público sin intervención manual.

**RF-11**
- Dado un cambio aprobado, cuando se consulta el historial del registro, entonces se ven
  la fecha, el editor, el aporte de origen, los valores anteriores y nuevos, y la fuente.

**RF-12**
- Dada una noticia propuesta por el agente de noticias, cuando el editor la ve, entonces
  aparece con origen `agente` y el nombre del agente.

**RF-13**
- Dado un día cualquiera, cuando termina la exportación, entonces el repositorio tiene un
  commit con los CSV actualizados, o un aviso de error si falló.

**RF-14**
- Dada una sección con datos publicados, cuando el visitante pulsa descargar, entonces
  obtiene un CSV con solo registros aprobados, con columna de fuente y con la licencia
  indicada.

**RF-15**
- Dado el CSV actual (coordenadas `49,653`), cuando se importa, entonces los 7 proyectos
  se rechazan por coordenadas fuera de Colombia y se lista cada rechazo; tras corregir la
  Sheet, la importación los acepta.

**RF-16**
- Dado un valor de `Estado` fuera de la lista permitida, cuando se intenta guardar por
  cualquiera de las cuatro vías, entonces se rechaza con el mismo mensaje.

**RF-17**
- Dado un sistema con movimiento reducido activado, cuando se abre el inicio, entonces
  los KPI aparecen sin animación de conteo ni transiciones.

## Requisitos no funcionales
| ID | Requisito |
|---|---|
| RNF-01 | Se usa sin desplazamiento horizontal a 375 px de ancho. |
| RNF-02 | El contenido principal de cada página pública carga en menos de 2,5 s en un móvil con 4G (Lighthouse, LCP). |
| RNF-03 | Contraste y navegación por teclado según WCAG 2.1 AA; cada gráfica tiene un equivalente en tabla o texto. |
| RNF-04 | Interfaz en español (Colombia): coma decimal, fechas `dd/mm/aaaa`, unidades entre corchetes. |
| RNF-05 | Usa los tokens del design system TEJ; ningún color escrito a mano. |
| RNF-06 | Costo de operación de cero pesos dentro de los planes gratuitos aprobados. |
| RNF-07 | Ninguna llave de servicio llega al navegador ni al repositorio. |
| RNF-08 | La base de datos recibe actividad al menos cada 3 días, para que el plan gratuito no la pause. |
| RNF-09 | Cada página pública tiene URL estable, título y descripción propios (compartible e indexable). |
| RNF-10 | Los datos personales de los aportantes (correo) no son visibles para el público ni se exportan. |

## Datos
| Entidad | Contenido | Público |
|---|---|---|
| `proyectos` | Columnas de `datos/esquemas.json` + estado de publicación | Lee los aprobados |
| `normas` | Columnas de `normativa` + estado de publicación | Lee las aprobadas |
| `noticias` | Columnas de `noticias` (la columna `revision` pasa a ser el estado de publicación) | Lee las aprobadas |
| `vehiculos` | Agregados del pipeline `Vehiculos/` | Lee todo |
| `aportes` | Tipo, datos propuestos, registro afectado, fuente, origen (`usuario`, `agente`, `editor`), nombre del agente, estado (`Pendiente`, `Aprobado`, `Rechazado`), motivo, fechas | Solo inserta |
| `aportantes` | Correo de contacto del aportante | Sin acceso |
| `historial` | Registro, editor, aporte, valores anteriores y nuevos, fuente, fecha | Sin acceso |
| `editores` | Correos autorizados | Sin acceso |

Fuente inicial: `Base de datos SAEB` (después de corregir las coordenadas) y los CSV del
pipeline de vehículos.

## Fuera de alcance
- Las vistas de cada sección: mapa y filtros (002), vehículos (003), línea de tiempo
  normativa (004) y página de noticias (005).
- Agentes programados (en el MVP se corren a mano desde Claude Code).
- Versión en inglés, cuentas de aportantes, API pública y dominio propio.

## Aclaraciones
- [ACLARAR 1: Tiempo máximo entre aprobar un aporte y verlo publicado. Propuesta: **5 minutos**.]
- [ACLARAR 2: Límite de envíos por origen. Propuesta: **5 aportes por hora**.]
- [ACLARAR 3: ¿El correo del aportante es obligatorio? Propuesta: **sí, obligatorio y privado**, para poder pedir aclaraciones; en el sitio solo se muestra "aporte de la comunidad".]
- [ACLARAR 4: Licencia de los datos descargables. Propuesta: **CC BY 4.0** (uso libre citando al Observatorio).]
- [ACLARAR 5: Dirección del MVP. Propuesta: **subdominio gratuito `*.vercel.app`**; el dominio propio queda para la migración a TEJ.]

## Historial de cambios
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-10-19 | Primera versión | Brainstorm 001 aprobado |
