# Informe E2E · 006
Fecha: 2026-10-21 (segunda corrida) · Entorno: local (`npm run dev` en `web/`, puerto 3000) contra Supabase **pruebas** · Comando: `npx playwright test -c e2e/006.config.ts --workers=1` (desde `web/`, proyectos `escritorio` y `movil-375` en la misma corrida, 1 reintento)

Pruebas: `web/e2e/006-graficas.spec.ts` · Configuración: `web/e2e/006.config.ts` (hereda de `002.config.ts`: WebGL por software y URL configurable). Las pruebas se escribieron solo con `spec.md` y la sección «Escenarios E2E» de `plan.md`, sin leer el código de producción.

Evidencia: las capturas de esta corrida están en `web/test-results/006/evidencia/`, y las de la corrida anterior en `web/test-results/006/corrida-anterior/`. Las dos carpetas están ignoradas por git. Las trazas y el informe HTML están en `web/test-results/006/` y `web/playwright-report/006/`. Ojo: Playwright vacía `web/test-results/006/` al empezar cada corrida.

Datos de prueba: cinco proyectos aprobados con prefijo `e2e-006-` en **Vaupés** (no tiene proyectos reales), municipio Mitú, todos Li-ion:

| Proyecto | Estado | MW | MWh | FPO |
|---|---|---|---|---|
| e2e-006-op-2021 | En operación | 10 | 20 | 2021 |
| e2e-006-op-2024 | En operación | 5 | 10 | 2024 |
| e2e-006-anun-2030 | Anunciado | 8 | 16 | 2030 |
| e2e-006-inac-2026 | Inactivo | 3 | 6 | 2026 |
| e2e-006-constr-sin-fpo | En construcción | 4 | (vacío) | (vacío) |

La prueba «limpieza» los borra y comprueba que no queda ninguna fila `e2e-006-` y que la base tiene **7 proyectos aprobados**. Pasó en esta corrida, y `afterAll` vuelve a limpiar por seguridad.

## Resultados

| Escenario | Criterio | Resultado | Evidencia |
|---|---|---|---|
| E2E-01 | CA-01.1 | ✅ Pasa | Región «Gráficas» con «Capacidad por estado», «Evolución por año de FPO» y «Tecnología», entre los filtros y el mapa (y filtros 573, gráficas 732–1154, mapa 1179). Consola sin errores. |
| E2E-02 | CA-02.1 | ✅ Pasa | Vaupés. Los KPI dicen 5 proyectos, 30,0 MW y 52,0 MWh, y las tablas de barras y dona suman lo mismo. Las tres gráficas cambiaron frente a la vista sin filtros. |
| E2E-03 | CA-03.1 | ✅ Pasa | Sin filtro, los cuatro estados aparecen en orden fijo con 32,0 / 22,0 / 108,0 / 53,0, iguales a las sumas en la base. El eje dice «Potencia [MW]» y no hay «MWh». |
| E2E-04 | CA-03.2, RNF-07 | ✅ Pasa | La misma gráfica pasa a «Energía [MWh]» (42,8 / 25,0 / 406,0 / 51,0) y nunca muestra «[MW]» junto a MWh. Funciona con clic y con las flechas, y `aria-selected` sigue a la pestaña. |
| E2E-05 | CA-04.1, RNF-04 | ✅ Pasa | Vaupés + En operación, pestaña Duración. La gráfica dice «2,0 h» en En operación (no 4,0) y «—» en los otros tres estados. El eje marca «0,0 0,5 1,0 1,5 2,0», con un decimal y sin repetir. La tabla coincide. Captura: `web/test-results/006/evidencia/E2E-05-duracion-solo-en-operacion.png` |
| E2E-05b | CA-04.1, RNF-04 | ✅ Pasa | Vaupés. Muestra «2,0 h» en En operación, Anunciado e Inactivo, y «—» en En construcción, que tiene potencia pero no energía. El eje está igual que en E2E-05. Captura: `web/test-results/006/evidencia/E2E-05b-duracion-vaupes.png` |
| E2E-06 | CA-05.1 | ✅ Pasa | El eje va 2021, 2024, 2030 (solo años). Tabla MW: 10,0 / 0,0 · 15,0 / 0,0 · 15,0 / 8,0. La leyenda muestra las dos series. |
| E2E-07 | CA-05.2 | ✅ Pasa | El Inactivo de 2026 (3 MW) no suma: 2026 no aparece en el eje ni en la tabla. Si se filtra solo Inactivo, la evolución dice «Sin datos para estos filtros». |
| E2E-08 | CA-06.1 | ✅ Pasa | Se lee «1 proyecto sin año de FPO no aparece en esta gráfica». |
| E2E-09 | CA-07.1 | ✅ Pasa (falló 1 vez por infraestructura) | La leyenda dice «Li-ion 100 %» en las tres pestañas. El centro sin filtro muestra «215,0 MW», «524,8 MWh» y «12 proyectos», y con Vaupés «30,0 MW», «52,0 MWh» y «5 proyectos»; todo coincide con los KPI. Sobre el primer intento, ver «Intermitencias». |
| E2E-10 | CA-08.1 | ✅ Pasa | Barras: en las tres pestañas, las etiquetas del dibujo coinciden con las filas de la tabla, con [MW], [MWh] o [h] en el encabezado. Evolución: los años y las series de la tabla coinciden con el eje y la leyenda. Dona: el total coincide con el centro y la columna «Participación [%]» dice 100,0. |
| E2E-11 | CA-09.1 | ✅ Pasa | Con `?departamento=Meta&estado=Inactivo`, las tres tarjetas dicen «Sin datos para estos filtros» y no muestran dibujo. |
| E2E-12 | RNF-01, RNF-03, RNF-06 | ✅ Pasa | A 375 px las tarjetas van apiladas (x 16, ancho 343, sin solaparse) y no hay desplazamiento horizontal. Las pestañas se recorren con Tab y flechas. Con movimiento reducido cada gráfica sale en 1 cuadro y el cambio de pestaña toma 2; en el control sin reducción toma 12. Consola sin errores. |
| Adicional | RNF-05 | ✅ Pasa | Las barras usan `var(--status-…)`, y su color calculado es igual al de la leyenda «Estados» del mapa, en el mismo orden. |
| Adicional | RNF-02 | ⚠️ No comprobable | Ver abajo. |

**Total:** 12 escenarios E2E del plan, todos pasan. Las comprobaciones adicionales de RNF-05 y E2E-05b también pasan, y RNF-02 sigue sin poder comprobarse. La corrida quedó en 15 pruebas que pasan, 1 intermitente (pasó al reintentar) y 16 omitidas, que son las de datos en `movil-375` y las de 375 px en `escritorio`, como estaba previsto.

## Cambios en las pruebas para esta corrida
- E2E-05 ahora exige el texto literal «2,0 h» en la gráfica y tres «—» en ella. También comprueba que las marcas del eje de Duración tengan un decimal y no se repitan. E2E-05b exige tres «2,0 h», un «—» y el mismo eje.
- E2E-10 separa las marcas del eje de las etiquetas de valor en la pestaña Duración: ahora el eje lleva decimales, y las etiquetas de valor terminan en « h».
- Las capturas se guardan en `web/test-results/006/evidencia/` (antes estaban en `web/e2e/evidencia-006/`, que se borró).

## Fallas
Ninguna.

### Intermitencias
- **E2E-09, primer intento:** `browserContext.close: UNKNOWN: unknown error, open '...\test-results\006\.playwright-artifacts-0\traces\...recording18.network'`. Playwright no pudo escribir su archivo de traza al cerrar el contexto. Ninguna aserción de la prueba falló, y el reintento automático pasó completo. Lo atribuyo al sistema de archivos o al entorno, no a la app.

## Observaciones (no son fallas)
- En «Capacidad por estado», la etiqueta «En construcción» ocupa dos líneas. En E2E-05b, el «—» de esa fila queda pegado a la marca del eje, y en la captura se ve como «_ —». Se lee, pero se ve apretado.
- Los ejes de Potencia y Energía usan enteros (0, 30, 60…; 0, 150, 300…) y sus marcas no se repiten. RNF-04 pide «un decimal en MW, MWh y h». Lo entiendo como una regla para las cifras y lo di por cumplido, como en la corrida anterior. Si también debe aplicar a las marcas de los ejes de MW y MWh, esto no lo cumple.

## No comprobables
- **RNF-02 (LCP < 2,5 s en móvil 4G):** no se puede medir bien contra `next dev`, que compila al vuelo. La prueba de LCP (`001-lcp.spec.ts`) apunta al sitio publicado, que está fuera del entorno permitido. Sí se observó que las gráficas aparecen después del contenido principal.
- **RNF-03, lo que anuncia un lector de pantalla:** se comprobaron `role="tab"` y `aria-selected`, pero Playwright no puede verificar qué anuncia un lector real.
- **RNF-05, «ningún color escrito a mano»:** desde fuera solo se ve que las barras usan tokens y coinciden con la leyenda. Para afirmar que no hay colores fijos en la dona ni en las áreas habría que leer el código.

## Corrida anterior
Primera corrida, 2026-10-21, mismo entorno y mismos datos. Resultado: 10 de 12 escenarios pasaron, 1 falló y RNF-02 no se pudo comprobar. Además hubo una observación visual sobre RNF-04.

- **F-1 · CA-04.1 (E2E-05), falló.** En la pestaña Duración, «En operación» mostraba «2,0», que es el cálculo correcto, pero los estados sin datos dejaban la fila vacía en la gráfica. El «—» solo aparecía en «Ver como tabla». Se reprodujo en todos los intentos. La etiqueta tampoco llevaba la «h».
- **F-2 · RNF-04, observación.** El eje de Duración marcaba «0 1 1 2 2»: marcas repetidas y sin decimal.
- Capturas de esa corrida: `web/test-results/006/corrida-anterior/E2E-05-duracion-solo-en-operacion.png` y `web/test-results/006/corrida-anterior/E2E-05b-duracion-vaupes.png`.

**Estado en esta corrida:** F-1 y F-2 quedaron resueltas. La gráfica muestra «2,0 h» y «—», y el eje marca «0,0 0,5 1,0 1,5 2,0». Ahora hay pruebas automáticas que comprueban las dos cosas.
