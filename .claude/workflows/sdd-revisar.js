export const meta = {
  name: 'sdd-revisar',
  description: 'Revisión adversarial de una spec o un plan SDD desde varios ángulos en paralelo, con verificación cruzada de hallazgos',
  phases: ['Revisar', 'Verificar', 'Consolidar'],
}

// Uso: /sdd-revisar {"documento": "specs/002-mapa/plan.md"}
const entrada = typeof args === 'string' ? { documento: args } : (args || {})
const doc = entrada.documento
if (!doc) throw new Error('Falta args.documento, por ejemplo {"documento": "specs/002-mapa/spec.md"}')
const esPlan = doc.endsWith('plan.md')

const angulos = esPlan
  ? [
      'Tamaño: ¿alguna tarea excede su talla (XS ≤15 min/1 archivo, S ≤45 min/≤3, M ≤90 min/≤5) o debería ser L y dividirse?',
      'TDD: ¿cada tarea tiene una prueba RED concreta que hoy fallaría por la razón correcta, y un GREEN verificable?',
      'Trazabilidad: ¿cada RF, RNF y CA-xx.n de la spec tiene tarea y escenario E2E? ¿Hay tareas que no responden a ningún requisito?',
      'Dependencias y riesgos: ¿el orden respeta dependencias, hay tareas que tocan los mismos archivos marcadas como independientes, y riesgos sin mitigar?',
      'Reglas del proyecto: ¿el plan respeta el stack, las reglas de datos y la moderación de CLAUDE.md?',
    ]
  : [
      'Verificabilidad: ¿cada CA-xx.n se puede comprobar desde fuera, como usuario, sin leer el código?',
      'Completitud: ¿faltan RF para las historias de usuario, casos de error o estados vacíos?',
      'Ambigüedad: ¿hay términos vagos, cifras sin unidad o decisiones implícitas que deberían ser [ACLARAR]?',
      'Fuga de implementación: ¿la spec dice cómo construir (librerías, archivos, funciones) en lugar de qué hacer?',
      'Reglas del proyecto: ¿respeta CLAUDE.md (MW/MWh separados, fuentes trazables, moderación, privacidad)?',
    ]

const esquemaHallazgos = {
  type: 'object',
  required: ['hallazgos'],
  properties: {
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        required: ['ubicacion', 'problema', 'propuesta', 'gravedad'],
        properties: {
          ubicacion: { type: 'string' },
          problema: { type: 'string' },
          propuesta: { type: 'string' },
          gravedad: { type: 'string', enum: ['alta', 'media', 'baja'] },
        },
      },
    },
  },
}

phase('Revisar')
const revisiones = await pipeline(angulos, angulo =>
  agent(
    `Revisa ${doc} (lee también CLAUDE.md y, si existe, la spec o el plan hermano en la misma carpeta). ` +
    `Ángulo único de esta revisión: ${angulo} ` +
    `Reporta solo problemas concretos con su ubicación (ID de RF, CA o tarea). No edites ningún archivo.`,
    { label: angulo.split(':')[0], schema: esquemaHallazgos },
  ),
)
const hallazgos = revisiones.filter(Boolean).flatMap(r => r.hallazgos)
log(`${hallazgos.length} hallazgos por verificar`)

phase('Verificar')
const verificados = await pipeline(hallazgos, h =>
  agent(
    `Actúa como verificador escéptico. Lee ${doc} y CLAUDE.md. Este hallazgo fue reportado por otro revisor:\n` +
    `Ubicación: ${h.ubicacion}\nProblema: ${h.problema}\nPropuesta: ${h.propuesta}\n` +
    `Decide si el problema es real según el texto del documento. No edites ningún archivo.`,
    {
      label: `verificar ${h.ubicacion}`,
      schema: {
        type: 'object',
        required: ['real', 'razon'],
        properties: { real: { type: 'boolean' }, razon: { type: 'string' } },
      },
    },
  ).then(v => (v && v.real ? h : null)),
)

phase('Consolidar')
const confirmados = verificados.filter(Boolean)
const informe = await agent(
  `Consolida estos hallazgos confirmados sobre ${doc}: elimina duplicados, ordénalos por gravedad y redacta una lista en español con ubicación, problema y propuesta. No edites ningún archivo.\n\n` +
  JSON.stringify(confirmados),
  { label: 'consolidar' },
)

return { documento: doc, confirmados: confirmados.length, descartados: hallazgos.length - confirmados.length, informe }
