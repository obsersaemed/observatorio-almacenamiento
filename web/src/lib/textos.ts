// Títulos y textos de introducción de cada página (definidos por el usuario, 2026-10-23). Una sola
// fuente: la página, sus metadatos (título y descripción) y las tarjetas del inicio.
export const TEXTOS = {
  inicio: {
    titulo: "Observatorio de Sistemas de Almacenamiento de Energía en Colombia",
    intro:
      "Explora los proyectos de almacenamiento de energía en Colombia, consulta datos actualizados y sigue la evolución de los SAEB, su integración al SIN y su contribución a la transición energética.",
  },
  mapa: {
    titulo: "Implementación de SAEB en Colombia",
    intro:
      "Consulta el inventario de proyectos de almacenamiento de energía con baterías en Colombia, explora su distribución geográfica mediante un mapa interactivo y analiza las estadísticas sobre sus características, estado de desarrollo y evolución en el país.",
  },
  vehiculos: {
    titulo: "Almacenamiento de energía en vehículos eléctricos",
    intro:
      "Conoce la evolución de los vehículos eléctricos en el país y el potencial de almacenamiento energético de sus baterías. Explora estadísticas sobre vehículos registrados, tecnologías de batería y energía almacenada en circulación.",
  },
  normativa: {
    titulo: "Evolución normativa de los SAEB",
    intro:
      "Explora la evolución del marco regulatorio aplicable a los sistemas de almacenamiento de energía con baterías (SAEB) en Colombia, desde sus primeros antecedentes hasta la normativa vigente. Conoce cómo un marco normativo claro puede establecer condiciones para su implementación, conexión y operación, y facilitar su integración al SIN.",
  },
  noticias: {
    titulo: "Noticias",
    intro:
      "Mantente al día con las últimas noticias, avances y tendencias del sector del almacenamiento de energía. Descubre nuevos proyectos, desarrollos tecnológicos, cambios regulatorios y acontecimientos relevantes que impulsan la implementación de los SAEB.",
  },
  aportar: {
    titulo: "Aportar al observatorio",
    intro:
      "¿Conoces un proyecto de almacenamiento con baterías, una norma o una noticia que falte, o un dato que deba corregirse? Tu aporte nos ayuda a mantener la información actualizada y a construir una visión más completa del almacenamiento de energía en Colombia.",
    correo: "obsersae_med@unal.edu.co",
    formulario: "/formularios/Formulario_Recoleccion_SAEB_Colombia.xlsx",
  },
} as const;

// Tarjetas de «Secciones principales» del inicio (spec 007, RF-12): títulos de TEXTOS; textos y
// botones definidos en la spec.
export const SECCIONES_INICIO = [
  { ruta: "/mapa", titulo: TEXTOS.mapa.titulo, texto: "Mapa e inventario de los SAEB en Colombia.", boton: "Ver el mapa" },
  {
    ruta: "/vehiculos",
    titulo: TEXTOS.vehiculos.titulo,
    texto: "Tecnologías y oportunidades de almacenamiento energético en la movilidad eléctrica.",
    boton: "Ver vehículos",
  },
  { ruta: "/normativa", titulo: TEXTOS.normativa.titulo, texto: "Consulta el marco regulatorio de los SAEB en Colombia.", boton: "Ver la normativa" },
] as const;
