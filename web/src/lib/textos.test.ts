// Títulos y textos de las páginas (pedido del usuario, 2026-10-23): una sola fuente para la
// página, sus metadatos y las tarjetas del inicio.
import { describe, expect, test } from "vitest";
import { TEXTOS } from "./textos";

describe("TEXTOS", () => {
  test("inicio", () => {
    expect(TEXTOS.inicio.titulo).toBe("Observatorio de Sistemas de Almacenamiento de Energía en Colombia");
    expect(TEXTOS.inicio.intro).toBe(
      "Explora los proyectos de almacenamiento de energía en Colombia, consulta datos actualizados y sigue la evolución de los SAEB, su integración al SIN y su contribución a la transición energética.",
    );
  });

  test("implementación (mapa)", () => {
    expect(TEXTOS.mapa.titulo).toBe("Implementación de SAEB en Colombia");
    expect(TEXTOS.mapa.intro).toBe(
      "Consulta el inventario de proyectos de almacenamiento de energía con baterías en Colombia, explora su distribución geográfica mediante un mapa interactivo y analiza las estadísticas sobre sus características, estado de desarrollo y evolución en el país.",
    );
  });

  test("vehículos", () => {
    expect(TEXTOS.vehiculos.titulo).toBe("Almacenamiento de energía en vehículos eléctricos");
    expect(TEXTOS.vehiculos.intro).toBe(
      "Conoce la evolución de los vehículos eléctricos en el país y el potencial de almacenamiento energético de sus baterías. Explora estadísticas sobre vehículos registrados, tecnologías de batería y energía almacenada en circulación.",
    );
  });

  test("normativa", () => {
    expect(TEXTOS.normativa.titulo).toBe("Evolución normativa de los SAEB");
    expect(TEXTOS.normativa.intro).toBe(
      "Explora la evolución del marco regulatorio aplicable a los sistemas de almacenamiento de energía con baterías (SAEB) en Colombia, desde sus primeros antecedentes hasta la normativa vigente. Conoce cómo un marco normativo claro puede establecer condiciones para su implementación, conexión y operación, y facilitar su integración al SIN.",
    );
  });

  test("noticias: el título no cambia", () => {
    expect(TEXTOS.noticias.titulo).toBe("Noticias");
    expect(TEXTOS.noticias.intro).toBe(
      "Mantente al día con las últimas noticias, avances y tendencias del sector del almacenamiento de energía. Descubre nuevos proyectos, desarrollos tecnológicos, cambios regulatorios y acontecimientos relevantes que impulsan la implementación de los SAEB.",
    );
  });

  test("aportar: el título no cambia", () => {
    expect(TEXTOS.aportar.titulo).toBe("Aportar al observatorio");
    expect(TEXTOS.aportar.intro).toBe(
      "¿Conoces un proyecto de almacenamiento con baterías, una norma o una noticia que falte, o un dato que deba corregirse? Tu aporte nos ayuda a mantener la información actualizada y a construir una visión más completa del almacenamiento de energía en Colombia.",
    );
  });
});
