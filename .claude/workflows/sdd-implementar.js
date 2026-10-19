export const meta = {
  name: 'sdd-implementar',
  description: 'Fase 4 SDD: implementa las tareas de un plan aprobado con TDD (agentes RED, GREEN y REFACTOR separados) y cierra con un agente E2E limpio',
  phases: ['Preparar', 'TDD por tarea', 'E2E limpio', 'Verificar alcance'],
}

// Uso: /sdd-implementar {"spec": "specs/002-mapa", "commit": false}
const entrada = typeof args === 'string' ? { spec: args } : (args || {})
const carpeta = entrada.spec
const commit = entrada.commit === true
const maxIntentos = entrada.intentos || 2
if (!carpeta) throw new Error('Falta args.spec, por ejemplo {"spec": "specs/002-mapa"}')

const reglas = `Reglas obligatorias: lee CLAUDE.md antes de empezar y cúmplelo (stack aprobado, tokens del design system, formato es-CO, MW y MWh nunca sumados, no inventar datos, llaves fuera del navegador, prefers-reduced-motion). Usa los comandos de prueba de la sección "Comandos" de CLAUDE.md. Trabaja solo dentro del repositorio.`

// ---------------------------------------------------------------- Preparar
phase('Preparar')
const prep = await agent(
  `Lee ${carpeta}/plan.md y ${carpeta}/spec.md. Comprueba que el plan tenga "Estado: Aprobado" o "Estado: En curso", que ninguna tarea sea de talla L y que exista la sección "Escenarios E2E". ` +
  `Si todo está bien, cambia el estado del plan a "En curso". Devuelve las tareas pendientes ("- [ ]") en orden de dependencias, con sus campos tal como aparecen en el plan. ` +
  `No escribas código.`,
  {
    label: 'leer plan',
    schema: {
      type: 'object',
      required: ['listo', 'motivo', 'tareas'],
      properties: {
        listo: { type: 'boolean' },
        motivo: { type: 'string' },
        tareas: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'talla', 'descripcion', 'cubre', 'red', 'green'],
            properties: {
              id: { type: 'string' },
              talla: { type: 'string' },
              descripcion: { type: 'string' },
              cubre: { type: 'string' },
              red: { type: 'string' },
              green: { type: 'string' },
              archivos: { type: 'string' },
            },
          },
        },
      },
    },
  },
)
if (!prep || !prep.listo) {
  return { estado: 'no iniciado', motivo: prep ? prep.motivo : 'el agente de preparación falló' }
}
log(`${prep.tareas.length} tareas pendientes en ${carpeta}`)

// ---------------------------------------------------------- TDD por tarea
// En serie: las tareas comparten archivos y cada una parte del verde de la anterior.
phase('TDD por tarea')
const resultados = []
let bloqueada = null

for (const t of prep.tareas) {
  const ficha = `Tarea ${t.id} (${t.talla}) de ${carpeta}/plan.md: ${t.descripcion}\nCubre: ${t.cubre}\nPrueba primero (RED): ${t.red}\nHecho cuando (GREEN): ${t.green}\nArchivos: ${t.archivos || 'ver plan'}`

  // RED: solo la prueba, debe fallar por la razón esperada
  const red = await agent(
    `${reglas}\n\nFase RED de TDD.\n${ficha}\n\n` +
    `Escribe SOLO la prueba descrita en "Prueba primero". No escribas ni modifiques código de producción. ` +
    `Corre la prueba y confirma que falla por la razón esperada (no por un error de sintaxis o de configuración). ` +
    `Si pasa sin cambios en el código, la prueba no sirve: reescríbela para que exprese el comportamiento nuevo.`,
    {
      label: `${t.id} RED`,
      schema: {
        type: 'object',
        required: ['fallaComoSeEspera', 'archivosPrueba', 'salida'],
        properties: {
          fallaComoSeEspera: { type: 'boolean' },
          archivosPrueba: { type: 'array', items: { type: 'string' } },
          salida: { type: 'string' },
        },
      },
    },
  )
  if (!red || !red.fallaComoSeEspera) {
    bloqueada = { tarea: t.id, fase: 'RED', detalle: red ? red.salida : 'el agente falló' }
    break
  }

  // GREEN: código mínimo sin tocar la prueba; hasta maxIntentos
  let green = null
  for (let intento = 1; intento <= maxIntentos; intento++) {
    green = await agent(
      `${reglas}\n\nFase GREEN de TDD (intento ${intento} de ${maxIntentos}).\n${ficha}\n\n` +
      `Las pruebas de esta tarea ya existen: ${red.archivosPrueba.join(', ')}. NO las modifiques. ` +
      (intento > 1 && green ? `El intento anterior terminó así: ${green.salida}\n` : '') +
      `Escribe el código de producción mínimo para que pasen. Luego corre la suite completa (no solo estas pruebas) e informa el resultado.`,
      {
        label: `${t.id} GREEN ${intento}`,
        schema: {
          type: 'object',
          required: ['suiteEnVerde', 'pruebasModificadas', 'salida'],
          properties: {
            suiteEnVerde: { type: 'boolean' },
            pruebasModificadas: { type: 'boolean' },
            salida: { type: 'string' },
          },
        },
      },
    )
    if (green && green.suiteEnVerde && !green.pruebasModificadas) break
  }
  if (!green || !green.suiteEnVerde || green.pruebasModificadas) {
    bloqueada = { tarea: t.id, fase: 'GREEN', detalle: green ? green.salida : 'el agente falló' }
    break
  }

  // REFACTOR + registro
  const ref = await agent(
    `${reglas}\n\nFase REFACTOR de TDD y registro.\n${ficha}\n\n` +
    `Revisa el código que se acaba de escribir para esta tarea (usa git diff). Mejora nombres, duplicación y claridad SIN cambiar el comportamiento ni las pruebas. ` +
    `Comprueba las reglas de CLAUDE.md. Corre la suite completa: debe seguir en verde. ` +
    `Después marca la tarea como "- [x]" en ${carpeta}/plan.md y agrega su fila al "Registro de implementación" (RED, GREEN, refactor o desviación). ` +
    (commit ? `Finalmente haz un commit con el mensaje "${t.id}: <resumen>" y la línea "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>".` : `No hagas commit.`),
    {
      label: `${t.id} REFACTOR`,
      schema: {
        type: 'object',
        required: ['suiteEnVerde', 'resumen'],
        properties: { suiteEnVerde: { type: 'boolean' }, resumen: { type: 'string' } },
      },
    },
  )
  if (!ref || !ref.suiteEnVerde) {
    bloqueada = { tarea: t.id, fase: 'REFACTOR', detalle: ref ? ref.resumen : 'el agente falló' }
    break
  }
  resultados.push({ tarea: t.id, resumen: ref.resumen })
}

if (bloqueada) {
  await agent(
    `En ${carpeta}/plan.md agrega al "Registro de implementación" una fila que marque la tarea ${bloqueada.tarea} como BLOQUEADA en la fase ${bloqueada.fase}, con este detalle resumido: ${bloqueada.detalle}. No cambies nada más.`,
    { label: 'registrar bloqueo' },
  )
  return { estado: 'bloqueado', completadas: resultados, bloqueada }
}

// Huella de los archivos modificados o nuevos (git status + git hash-object),
// para saber exactamente qué tocó el agente E2E aunque no haya commits.
const esquemaHuella = {
  type: 'object',
  required: ['archivos'],
  properties: {
    archivos: {
      type: 'array',
      items: {
        type: 'object',
        required: ['ruta', 'hash'],
        properties: { ruta: { type: 'string' }, hash: { type: 'string' } },
      },
    },
  },
}
const huella = etiqueta => agent(
  `Ejecuta "git status --porcelain --untracked-files=all" y, para cada archivo modificado o nuevo que exista, "git hash-object <ruta>". ` +
  `Devuelve la lista de rutas (relativas a la raíz del repositorio, con "/") con su hash. No modifiques nada.`,
  { label: etiqueta, schema: esquemaHuella },
)

// ------------------------------------------------------------- E2E limpio
phase('E2E limpio')
const antes = await huella('huella antes de E2E')
const e2e = await agent(
  `Eres el agente E2E limpio. Lee y sigue al pie de la letra .claude/agents/e2e-limpio.md. ` +
  `Carpeta de la spec: ${carpeta}. No leas código de producción y no modifiques nada fuera de web/e2e/ y de ${carpeta}/e2e-informe.md.`,
  {
    label: 'e2e limpio',
    stallMs: 1800000,
    schema: {
      type: 'object',
      required: ['total', 'pasan', 'fallan', 'noComprobables', 'informe'],
      properties: {
        total: { type: 'number' },
        pasan: { type: 'number' },
        fallan: { type: 'number' },
        noComprobables: { type: 'number' },
        informe: { type: 'string' },
      },
    },
  },
)

// ------------------------------------------------------ Verificar alcance
phase('Verificar alcance')
const despues = await huella('huella después de E2E')
const previo = new Map(((antes && antes.archivos) || []).map(a => [a.ruta, a.hash]))
const tocados = ((despues && despues.archivos) || [])
  .filter(a => previo.get(a.ruta) !== a.hash)
  .map(a => a.ruta)
const permitido = ruta => ruta.startsWith('web/e2e/') || ruta === `${carpeta}/e2e-informe.md`
const fueraDeAlcance = tocados.filter(r => !permitido(r))
if (!antes || !despues) log('No se pudo tomar la huella de archivos: revisa el alcance del E2E a mano')

const enVerde = e2e && e2e.fallan === 0 && e2e.noComprobables === 0 && fueraDeAlcance.length === 0
await agent(
  `En ${carpeta}/plan.md cambia la línea de estado a "Estado: En E2E" y agrega al "Registro de implementación" una fila con el resultado del E2E: ` +
  (e2e ? `${e2e.pasan}/${e2e.total} pasan, ${e2e.fallan} fallan, ${e2e.noComprobables} no comprobables, informe en ${e2e.informe}. ` : 'el agente E2E falló. ') +
  (fueraDeAlcance.length ? `ALERTA: el agente E2E modificó archivos fuera de su alcance: ${fueraDeAlcance.join(', ')}. ` : '') +
  `En la sección "Informe E2E" enlaza ${carpeta}/e2e-informe.md. No cambies nada más.`,
  { label: 'registrar E2E' },
)

return {
  estado: enVerde ? 'listo para aprobación del usuario' : 'revisar E2E',
  tareasCompletadas: resultados,
  e2e,
  archivosTocadosPorE2E: tocados,
  fueraDeAlcance,
}
