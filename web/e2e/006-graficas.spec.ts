// E2E de la spec 006 · Gráficas de implementación en el país (/mapa).
// Escrito por el probador independiente a partir de spec.md y de la sección
// "Escenarios E2E" de plan.md, sin leer el código de producción.
// Corre contra `npm run dev` conectado al proyecto Supabase "pruebas":
//   npx playwright test -c e2e/006.config.ts --project=escritorio
//   npx playwright test -c e2e/006.config.ts --project=movil-375
// Siembra proyectos de prueba (prefijo «e2e-006-») en un departamento propio (Vaupés, que
// no tiene proyectos reales) y los borra en la última prueba de datos y en afterAll.
import { test, expect, type Page, type Locator } from "@playwright/test";
import path from "node:path";
import { admin, proyectoPrueba, vigilarConsola } from "./utilidades";

const P = "e2e-006-";
const DEPTO = "Vaupés";
const ESTADOS = ["En operación", "En construcción", "Anunciado", "Inactivo"];
const UBIC = { departamento: DEPTO, municipio: "Mitú", latitud: 1.25, longitud: -70.23, operador: `${P}operador` };
const SIEMBRA = [
  proyectoPrueba({ ...UBIC, nombre: `${P}op-2021`, estado: "En operación", potencia_nominal_mw: 10, capacidad_maxima_mwh: 20, fpo: "2021" }),
  proyectoPrueba({ ...UBIC, nombre: `${P}op-2024`, estado: "En operación", potencia_nominal_mw: 5, capacidad_maxima_mwh: 10, fpo: "2024" }),
  proyectoPrueba({ ...UBIC, nombre: `${P}anun-2030`, estado: "Anunciado", potencia_nominal_mw: 8, capacidad_maxima_mwh: 16, fpo: "2030" }),
  proyectoPrueba({ ...UBIC, nombre: `${P}inac-2026`, estado: "Inactivo", potencia_nominal_mw: 3, capacidad_maxima_mwh: 6, fpo: "2026" }),
  // Sin FPO (RF-06) y sin energía: «En construcción» no tiene proyectos con ambos datos (RF-04).
  proyectoPrueba({ ...UBIC, nombre: `${P}constr-sin-fpo`, estado: "En construcción", potencia_nominal_mw: 4, capacidad_maxima_mwh: null, fpo: null }),
];
const NOMBRES = SIEMBRA.map((s) => s.nombre as string);

const fmt1 = (n: number) => n.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** «1.234,5» → 1234.5; «—» o vacío → 0. */
const num = (s: string) => {
  const t = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return t === "" || t === "-" ? 0 : Number(t);
};
const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

type Proy = { nombre: string; estado: string; departamento: string; tecnologia: string; potencia_nominal_mw: number | null; capacidad_maxima_mwh: number | null; fpo: string | null };

async function aprobados(): Promise<Proy[]> {
  const { data, error } = await admin()
    .from("proyectos")
    .select("nombre,estado,departamento,tecnologia,potencia_nominal_mw,capacidad_maxima_mwh,fpo")
    .eq("publicacion", "Aprobado");
  if (error) throw error;
  return data as Proy[];
}

async function limpiar() {
  await admin().from("proyectos").delete().like("nombre", `${P}%`);
}

/** Siembra (si no está ya) y espera a que /mapa muestre lo sembrado (puede tardar minutos). */
async function asegurarSiembra(page: Page) {
  const { data } = await admin().from("proyectos").select("nombre").like("nombre", `${P}%`);
  const existentes = new Set((data ?? []).map((d) => d.nombre));
  if (existentes.size !== NOMBRES.length || !NOMBRES.every((n) => existentes.has(n))) {
    await limpiar();
    const { error } = await admin().from("proyectos").insert(SIEMBRA);
    if (error) throw new Error("No se pudo sembrar: " + error.message);
  }
  const inicio = Date.now();
  for (;;) {
    const html = await (await page.request.get("/mapa")).text();
    if (NOMBRES.every((n) => html.includes(n))) return Date.now() - inicio;
    if (Date.now() - inicio > 7 * 60_000) throw new Error("Lo sembrado no apareció en /mapa en 7 min");
    await page.waitForTimeout(10_000);
  }
}

// ---------- Localizadores accesibles ----------
const graficas = (page: Page) => page.getByRole("region", { name: "Gráficas" });
const tarjeta = (page: Page, titulo: string) => graficas(page).getByRole("region", { name: titulo, exact: true });
const ESTADO = "Capacidad por estado";
const EVOL = "Evolución por año de FPO";
const TEC = "Tecnología";
const pestana = (page: Page, t: string, nombre: string) => tarjeta(page, t).getByRole("tab", { name: nombre, exact: true });
// La dona de tecnología no tiene pestañas (ajuste del 2026-10-24): su panel no es «tabpanel».
const panel = (page: Page, t: string) => tarjeta(page, t).locator('[id$="-panel"]');
const tablaDe = (page: Page, t: string) => panel(page, t).getByRole("table");
const dibujo = (page: Page, t: string) => panel(page, t).locator("svg").first();

async function abrirMapa(page: Page, query = "") {
  await page.goto(`/mapa${query}`);
  await expect(page.getByRole("table", { name: /Proyectos/ })).toBeVisible({ timeout: 60_000 });
  await expect(graficas(page)).toBeVisible({ timeout: 30_000 });
  // Las gráficas pueden cargar después del contenido principal (RNF-02): se espera cada tarjeta.
  for (const t of [ESTADO, EVOL, TEC]) {
    await expect(tarjeta(page, t)).toBeVisible({ timeout: 60_000 });
    await expect(panel(page, t).locator("svg").or(panel(page, t).getByText("Sin datos para estos filtros")).first()).toBeVisible({ timeout: 60_000 });
  }
}
const qDepto = `?departamento=${encodeURIComponent(DEPTO)}`;

async function verTabla(page: Page, t: string) {
  const b = tarjeta(page, t).getByRole("button", { name: "Ver como tabla" });
  const otra = tarjeta(page, t).getByRole("button", { name: "Ver como gráfica" });
  await expect(b.or(otra).first()).toBeVisible({ timeout: 30_000 });
  if (await b.isVisible()) await b.click();
  await expect(tablaDe(page, t)).toBeVisible();
}
async function verGrafica(page: Page, t: string) {
  const b = tarjeta(page, t).getByRole("button", { name: "Ver como gráfica" });
  if (await b.isVisible()) await b.click();
  await expect(tablaDe(page, t)).toHaveCount(0);
  await expect(dibujo(page, t)).toBeVisible();
}

/** Lee la tabla equivalente: encabezados y filas (celdas en texto). */
async function leerTabla(page: Page, t: string) {
  const tabla = tablaDe(page, t);
  const encabezados = (await tabla.getByRole("columnheader").allInnerTexts()).map((s) => s.trim());
  const filas = await tabla.getByRole("rowgroup").nth(1).getByRole("row").evaluateAll((rs) =>
    rs.map((r) => [...r.querySelectorAll("th,td")].map((c) => (c as HTMLElement).innerText.trim())),
  );
  return { encabezados, filas };
}

/** Textos del dibujo SVG una vez terminado (espera a que dejen de cambiar). */
async function textosDibujo(page: Page, t: string) {
  // Las etiquetas de valor aparecen al terminar la animación: se exige 2 s sin cambios.
  await expect(dibujo(page, t)).toBeVisible({ timeout: 30_000 });
  let antes = "";
  let iguales = 0;
  for (let i = 0; i < 60; i++) {
    const ahora = (await dibujo(page, t).locator("text").allTextContents()).join("|");
    iguales = ahora === antes && ahora !== "" ? iguales + 1 : 0;
    if (iguales >= 8) break;
    antes = ahora;
    await page.waitForTimeout(250);
  }
  return antes.split("|");
}

async function kpi(page: Page, nombre: string) {
  return (await page.getByRole("group", { name: nombre, exact: true }).innerText()).replace(/\s+/g, " ").trim();
}
async function kpis(page: Page) {
  const k = await kpi(page, "Proyectos identificados");
  const mw = await kpi(page, "Potencia total proyectada");
  const mwh = await kpi(page, "Capacidad energética total proyectada");
  const ult = (s: string, re: RegExp) => num((s.match(re) ?? ["0"]).pop()!);
  return {
    proyectos: ult(k, /\d[\d.]*/g),
    mw: ult(mw, /[\d.,]+(?= MW\b)/g),
    mwh: ult(mwh, /[\d.,]+(?= MWh\b)/g),
  };
}

function porEstado(ps: Proy[], campo: "potencia_nominal_mw" | "capacidad_maxima_mwh") {
  return ESTADOS.map((e) => suma(ps.filter((p) => p.estado === e).map((p) => p[campo] ?? 0)));
}

/** Evidencia: capturas en web/test-results/006/evidencia/ (carpeta ignorada por git). */
async function evidencia(page: Page, t: string, nombre: string) {
  const ruta = path.join(test.info().project.outputDir, "evidencia", `${nombre}.png`);
  await test.info().attach(nombre, { body: await tarjeta(page, t).screenshot({ path: ruta }), contentType: "image/png" });
}

/** Marcas numéricas del eje de Duración: las que no son etiquetas de valor («2,0 h», «—») ni el título. */
function marcasEje(textos: string[]) {
  return textos.filter((s) => /^[\d.,]+$/.test(s));
}
function comprobarEjeDuracion(textos: string[]) {
  const marcas = marcasEje(textos);
  test.info().annotations.push({ type: "eje-duracion", description: marcas.join(" ") });
  expect(marcas.length, "el eje de Duración tiene marcas").toBeGreaterThan(1);
  for (const m of marcas) expect(m, "marca del eje con un decimal (RNF-04)").toMatch(/^\d{1,3}(\.\d{3})*,\d$/);
  expect(new Set(marcas).size, `marcas del eje sin repetir: ${marcas.join(" ")}`).toBe(marcas.length);
}

function soloEscritorio() {
  test.skip(test.info().project.name !== "escritorio", "Escenario de datos: solo escritorio");
}
function soloMovil() {
  test.skip(test.info().project.name !== "movil-375", "Escenario de 375 px");
}

// El indicador de `next dev` (esquina inferior izquierda) no es parte de la app: se oculta.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const poner = () => {
      const st = document.createElement("style");
      st.textContent = "nextjs-portal{display:none!important}";
      document.head.appendChild(st);
    };
    if (document.head) poner();
    else document.addEventListener("DOMContentLoaded", poner);
  });
});

test.afterAll(async () => {
  // Red de seguridad: que no quede nada sembrado.
  await limpiar();
});

test.describe("006 · Gráficas (datos)", () => {
  test.beforeEach(async ({ page }) => {
    if (test.info().project.name !== "escritorio") return;
    if (test.info().title.startsWith("limpieza")) return;
    test.setTimeout(10 * 60_000);
    const espera = await asegurarSiembra(page);
    test.info().annotations.push({ type: "espera-siembra-ms", description: String(espera) });
    test.setTimeout(espera + 4 * 60_000);
  });

  test("E2E-01 · CA-01.1: tres tarjetas con sus títulos después de los filtros y antes del mapa", async ({ page }) => {
    soloEscritorio();
    const errores = vigilarConsola(page);
    await abrirMapa(page);
    const titulos = await graficas(page).getByRole("heading", { level: 2 }).allInnerTexts();
    expect(titulos.map((s) => s.trim())).toEqual([ESTADO, EVOL, TEC]);
    for (const t of [ESTADO, EVOL, TEC]) await expect(tarjeta(page, t)).toBeVisible();
    const filtros = page.getByRole("group", { name: "Departamento", exact: true });
    const mapa = page.getByRole("region", { name: /^Mapa/ });
    const orden = await page.evaluate(
      ([f, g, m]) => {
        const a = f as Element, b = g as Element, c = m as Element;
        return {
          filtrosAntes: !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING),
          mapaDespues: !!(b.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING),
          yFiltros: a.getBoundingClientRect().bottom,
          yGraficas: b.getBoundingClientRect().top,
          yGraficasFin: b.getBoundingClientRect().bottom,
          yMapa: c.getBoundingClientRect().top,
        };
      },
      [await filtros.elementHandle(), await graficas(page).elementHandle(), await mapa.elementHandle()],
    );
    test.info().annotations.push({ type: "orden", description: JSON.stringify(orden) });
    expect(orden.filtrosAntes, "gráficas después de los filtros").toBe(true);
    expect(orden.mapaDespues, "mapa después de las gráficas").toBe(true);
    expect(orden.yGraficas).toBeGreaterThanOrEqual(orden.yFiltros);
    expect(orden.yMapa).toBeGreaterThanOrEqual(orden.yGraficasFin);
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("E2E-02 · CA-02.1: con un departamento, barras y dona suman lo mismo que los KPI y las tres gráficas cambian", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    const sinFiltro: Record<string, string> = {};
    for (const t of [ESTADO, EVOL, TEC]) {
      await verTabla(page, t);
      sinFiltro[t] = JSON.stringify(await leerTabla(page, t));
    }
    // Filtro por el desplegable, como un usuario.
    const grupo = page.getByRole("group", { name: "Departamento", exact: true });
    await grupo.getByRole("button", { name: /^Departamento / }).click();
    await grupo.getByRole("searchbox", { name: "Buscar en Departamento" }).fill("Vaup");
    await grupo.getByRole("checkbox", { name: new RegExp(`^${DEPTO} \\(\\d+\\)$`) }).check();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/departamento=/);
    await expect.poll(async () => (await kpis(page)).proyectos, { timeout: 15_000 }).toBe(5);
    const k = await kpis(page);
    test.info().annotations.push({ type: "kpi", description: JSON.stringify(k) });

    const sumaCol = async (t: string, pest: string) => {
      if (t !== TEC) await pestana(page, t, pest).click(); // la dona no tiene pestañas
      await verTabla(page, t);
      await expect(tablaDe(page, t).getByRole("columnheader", { name: pest })).toBeVisible();
      const { filas } = await leerTabla(page, t);
      return suma(filas.map((f) => num(f[1])));
    };
    expect(await sumaCol(ESTADO, "Potencia [MW]"), "barras MW = KPI").toBeCloseTo(k.mw, 1);
    expect(await sumaCol(ESTADO, "Energía [MWh]"), "barras MWh = KPI").toBeCloseTo(k.mwh, 1);
    expect(await sumaCol(TEC, "Potencia [MW]"), "dona MW = KPI").toBeCloseTo(k.mw, 1);
    expect(k.mw).toBeCloseTo(30, 1);
    expect(k.mwh).toBeCloseTo(52, 1);

    for (const t of [ESTADO, EVOL, TEC]) {
      if (t !== TEC) await pestana(page, t, "Potencia [MW]").click();
      await verTabla(page, t);
      const ahora = JSON.stringify(await leerTabla(page, t));
      expect(ahora, `«${t}» cambió con el filtro`).not.toBe(sinFiltro[t]);
    }
  });

  test("E2E-03 · CA-03.1: Potencia [MW] muestra los cuatro estados en orden fijo, cifras es-CO y eje en [MW]", async ({ page }) => {
    soloEscritorio();
    const ps = await aprobados();
    const esperado = porEstado(ps, "potencia_nominal_mw").map(fmt1);
    await abrirMapa(page);
    await expect(pestana(page, ESTADO, "Potencia [MW]")).toHaveAttribute("aria-selected", "true");
    const textos = await textosDibujo(page, ESTADO);
    test.info().annotations.push({ type: "svg", description: textos.join(" | ") });
    const etiquetas = textos.filter((s) => ESTADOS.map((e) => e.replace(/\s/g, "")).includes(s.replace(/\s/g, "")));
    expect(etiquetas.map((s) => s.replace(/\s/g, "")), "cuatro estados en orden fijo").toEqual(ESTADOS.map((e) => e.replace(/\s/g, "")));
    expect(textos, "eje en [MW]").toContain("Potencia [MW]");
    expect(textos.join(" "), "sin MWh en la gráfica de MW").not.toMatch(/MWh/);
    // Valor al final de cada barra, en orden de estados.
    const valores = textos.filter((s) => /^\d{1,3}(\.\d{3})*,\d$/.test(s));
    expect(valores, "valor de cada estado con un decimal y coma").toEqual(esperado);
  });

  test("E2E-04 · CA-03.2 / RNF-07: Energía [MWh] cambia la misma gráfica (con clic y con flechas) y nunca muestra MW y MWh juntos", async ({ page }) => {
    soloEscritorio();
    const ps = await aprobados();
    await abrirMapa(page);
    const g = tarjeta(page, ESTADO);
    const svgs = () => g.locator("svg").count();
    const nSvg = await svgs();
    await pestana(page, ESTADO, "Energía [MWh]").click();
    await expect(pestana(page, ESTADO, "Energía [MWh]")).toHaveAttribute("aria-selected", "true");
    let textos = await textosDibujo(page, ESTADO);
    test.info().annotations.push({ type: "svg-mwh", description: textos.join(" | ") });
    expect(textos).toContain("Energía [MWh]");
    expect(textos.join(" "), "sin eje en MW").not.toMatch(/\[MW\]/);
    expect(textos.filter((s) => /^\d{1,3}(\.\d{3})*,\d$/.test(s))).toEqual(porEstado(ps, "capacidad_maxima_mwh").map(fmt1));
    expect(await svgs(), "la misma gráfica, no otra al lado").toBe(nSvg);
    // Teclado: foco en la pestaña activa, flecha izquierda vuelve a Potencia.
    await pestana(page, ESTADO, "Energía [MWh]").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(pestana(page, ESTADO, "Potencia [MW]")).toHaveAttribute("aria-selected", "true");
    await expect(pestana(page, ESTADO, "Potencia [MW]")).toBeFocused();
    textos = await textosDibujo(page, ESTADO);
    expect(textos).toContain("Potencia [MW]");
    expect(textos.join(" ")).not.toMatch(/MWh/);
    await page.keyboard.press("ArrowRight");
    await expect(pestana(page, ESTADO, "Energía [MWh]")).toHaveAttribute("aria-selected", "true");
    textos = await textosDibujo(page, ESTADO);
    expect(textos).toContain("Energía [MWh]");
    expect(textos.join(" ")).not.toMatch(/\[MW\]/);
  });

  test("E2E-05 · CA-04.1: Duración [h] = energía total ÷ potencia total («2,0 h», no 4,0) y «—» en estados sin datos", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page, `${qDepto}&estado=${encodeURIComponent("En operación")}`);
    await pestana(page, ESTADO, "Duración [h]").click();
    await expect(pestana(page, ESTADO, "Duración [h]")).toHaveAttribute("aria-selected", "true");
    const textos = await textosDibujo(page, ESTADO);
    test.info().annotations.push({ type: "svg-duracion", description: textos.join(" | ") });
    await evidencia(page, ESTADO, "E2E-05-duracion-solo-en-operacion");
    expect(textos, "eje en [h]").toContain("Duración [h]");
    expect(textos.join(" ")).not.toMatch(/4,0/);
    // «En operación» muestra «2,0 h» en la gráfica (CA-04.1).
    await expect(panel(page, ESTADO).getByText("2,0 h", { exact: true }), "«2,0 h» en la gráfica").toHaveCount(1);
    // Los otros tres estados no tienen proyectos con ambos datos: «—» en la gráfica.
    await expect(panel(page, ESTADO).getByText("—", { exact: true }), "«—» en los tres estados sin datos").toHaveCount(3);
    // Eje de Duración: un decimal y sin marcas repetidas (RNF-04).
    comprobarEjeDuracion(textos);
    // Tabla equivalente.
    await verTabla(page, ESTADO);
    const { filas } = await leerTabla(page, ESTADO);
    test.info().annotations.push({ type: "tabla-duracion", description: JSON.stringify(filas) });
    expect(filas).toEqual([["En operación", "2,0"], ["En construcción", "—"], ["Anunciado", "—"], ["Inactivo", "—"]]);
  });

  test("E2E-05b · CA-04.1: en el departamento sembrado, un estado con potencia pero sin energía muestra «—» en Duración", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page, qDepto);
    await pestana(page, ESTADO, "Duración [h]").click();
    const textos = await textosDibujo(page, ESTADO);
    test.info().annotations.push({ type: "svg-duracion", description: textos.join(" | ") });
    await evidencia(page, ESTADO, "E2E-05b-duracion-vaupes");
    await expect(panel(page, ESTADO).getByText("2,0 h", { exact: true }), "«2,0 h» en En operación, Anunciado e Inactivo").toHaveCount(3);
    await expect(panel(page, ESTADO).getByText("—", { exact: true }), "«—» para En construcción en la gráfica").toHaveCount(1);
    comprobarEjeDuracion(textos);
    await verTabla(page, ESTADO);
    expect((await leerTabla(page, ESTADO)).filas).toEqual([["En operación", "2,0"], ["En construcción", "—"], ["Anunciado", "2,0"], ["Inactivo", "2,0"]]);
  });

  test("E2E-06 · CA-05.1: evolución 2021 → 2030; la serie de operación y construcción crece en 2021 y 2024; Anunciado en 2030", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page, qDepto);
    await expect(pestana(page, EVOL, "Potencia [MW]")).toHaveAttribute("aria-selected", "true");
    const textos = await textosDibujo(page, EVOL);
    test.info().annotations.push({ type: "svg-evolucion", description: textos.join(" | ") });
    const anos = textos.filter((s) => /^\d{4}$/.test(s));
    expect(anos, "eje solo con años, en orden").toEqual(["2021", "2024", "2030"]);
    expect(textos).toContain("Potencia [MW]");
    await expect(tarjeta(page, EVOL).getByRole("list", { name: "Series" })).toContainText("En operación y en construcción");
    await expect(tarjeta(page, EVOL).getByRole("list", { name: "Series" })).toContainText("Anunciado (proyectado)");
    await verTabla(page, EVOL);
    const { encabezados, filas } = await leerTabla(page, EVOL);
    test.info().annotations.push({ type: "tabla-evolucion", description: JSON.stringify({ encabezados, filas }) });
    expect(encabezados).toEqual(["Año de FPO", "En operación y en construcción [MW]", "Anunciado (proyectado) [MW]"]);
    expect(filas).toEqual([
      ["2021", "10,0", "0,0"],
      ["2024", "15,0", "0,0"],
      ["2030", "15,0", "8,0"],
    ]);
    // Energía [MWh]
    await pestana(page, EVOL, "Energía [MWh]").click();
    const mwh = await leerTabla(page, EVOL);
    expect(mwh.encabezados).toEqual(["Año de FPO", "En operación y en construcción [MWh]", "Anunciado (proyectado) [MWh]"]);
    expect(mwh.filas).toEqual([
      ["2021", "20,0", "0,0"],
      ["2024", "30,0", "0,0"],
      ["2030", "30,0", "16,0"],
    ]);
  });

  test("E2E-07 · CA-05.2: un Inactivo con FPO (2026, 3 MW) no suma en ninguna serie", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page, qDepto);
    const textos = await textosDibujo(page, EVOL);
    expect(textos, "2026 (solo Inactivo) no aparece en el eje").not.toContain("2026");
    await verTabla(page, EVOL);
    const { filas } = await leerTabla(page, EVOL);
    expect(filas.map((f) => f[0])).not.toContain("2026");
    const ultimo = filas[filas.length - 1];
    expect(num(ultimo[1]) + num(ultimo[2]), "total acumulado sin el Inactivo: 10 + 5 + 8").toBeCloseTo(23, 1);
    // Solo el Inactivo: la evolución no tiene nada que sumar.
    await abrirMapa(page, `${qDepto}&estado=Inactivo`);
    const p = panel(page, EVOL);
    const texto = (await p.innerText()).replace(/\s+/g, " ");
    test.info().annotations.push({ type: "evolucion-solo-inactivo", description: texto });
    expect(texto).not.toMatch(/2026/);
    expect(texto).not.toMatch(/3,0/);
  });

  test("E2E-08 · CA-06.1: «1 proyecto sin año de FPO no aparece en esta gráfica»", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page, qDepto);
    await expect(tarjeta(page, EVOL).getByText("1 proyecto sin año de FPO no aparece en esta gráfica", { exact: true })).toBeVisible();
    // Sin ese proyecto, el aviso desaparece.
    await abrirMapa(page, `${qDepto}&estado=${encodeURIComponent("En operación")}`);
    await expect(tarjeta(page, EVOL).getByText(/sin año de FPO/)).toHaveCount(0);
  });

  test("E2E-09 · CA-07.1: dona sin pestañas, con Li-ion 100 %; el centro coincide con el KPI de potencia", async ({ page }) => {
    soloEscritorio();
    const ps = await aprobados();
    expect(new Set(ps.map((p) => p.tecnologia))).toEqual(new Set(["Li-ion"]));
    for (const q of ["", qDepto]) {
      await abrirMapa(page, q);
      const k = await kpis(page);
      await expect(tarjeta(page, TEC).getByRole("tab")).toHaveCount(0);
      const leyenda = tarjeta(page, TEC).getByRole("list", { name: "Tecnologías" });
      await expect(leyenda.getByRole("listitem")).toHaveText([/^Li-ion\s*100(,0)? %$/]);
      // El número y la unidad van en líneas distintas: se normalizan los espacios.
      const centro = (await panel(page, TEC).getByRole("paragraph").allInnerTexts()).map((s) => s.replace(/\s+/g, " ").trim());
      test.info().annotations.push({ type: `centro${q ? "-depto" : ""}`, description: JSON.stringify(centro) });
      const esperado = new RegExp(`^${fmt1(k.mw).replace(".", "\\.")} MW$`);
      expect(centro.some((c) => esperado.test(c)), `centro: ${JSON.stringify(centro)}`).toBe(true);
    }
  });

  test("E2E-10 · CA-08.1: «Ver como tabla» en cada gráfica da las mismas categorías y cifras, en es-CO y con unidad en el encabezado", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page, qDepto);
    // Capacidad por estado: etiquetas del dibujo = filas de la tabla, en cada pestaña.
    for (const [pest, unidad] of [["Potencia [MW]", "[MW]"], ["Energía [MWh]", "[MWh]"], ["Duración [h]", "[h]"]] as const) {
      await pestana(page, ESTADO, pest).click();
      await verGrafica(page, ESTADO);
      const textos = await textosDibujo(page, ESTADO);
      // En Duración el eje lleva decimales: las etiquetas de valor son las que terminan en « h».
      const valores = pest === "Duración [h]" ? textos.filter((s) => /\d,\d h$/.test(s)) : textos.filter((s) => /\d,\d/.test(s));
      await verTabla(page, ESTADO);
      const { encabezados, filas } = await leerTabla(page, ESTADO);
      expect(encabezados[1], `unidad ${unidad}`).toContain(unidad);
      expect(filas.map((f) => f[0])).toEqual(ESTADOS);
      expect(filas.map((f) => f[1]).filter((v) => v !== "—"), `cifras de ${pest}`).toEqual(valores.map((v) => v.replace(/ h$/, "")));
      for (const f of filas) expect(f[1]).toMatch(/^(\d{1,3}(\.\d{3})*,\d|—)$/);
    }
    // Evolución: mismos años que el eje y mismas series que la leyenda; unidad en cada columna.
    for (const [pest, unidad] of [["Potencia [MW]", "[MW]"], ["Energía [MWh]", "[MWh]"]] as const) {
      await pestana(page, EVOL, pest).click();
      await verGrafica(page, EVOL);
      const anos = (await textosDibujo(page, EVOL)).filter((s) => /^\d{4}$/.test(s));
      const series = (await tarjeta(page, EVOL).getByRole("list", { name: "Series" }).getByRole("listitem").allInnerTexts()).map((s) => s.trim());
      await verTabla(page, EVOL);
      const { encabezados, filas } = await leerTabla(page, EVOL);
      expect(filas.map((f) => f[0])).toEqual(anos);
      expect(encabezados.slice(1)).toEqual(series.map((s) => `${s} ${unidad}`));
      for (const f of filas) for (const v of f.slice(1)) expect(v).toMatch(/^\d{1,3}(\.\d{3})*,\d$/);
    }
    // Tecnología: mismo total que el centro y mismo % que la leyenda.
    for (const [pest, unidad] of [["Potencia [MW]", "[MW]"]] as const) {
      await verGrafica(page, TEC);
      const centro = (await panel(page, TEC).getByRole("paragraph").allInnerTexts()).join(" ");
      const leyenda = await tarjeta(page, TEC).getByRole("list", { name: "Tecnologías" }).getByRole("listitem").allInnerTexts();
      await verTabla(page, TEC);
      const { encabezados, filas } = await leerTabla(page, TEC);
      test.info().annotations.push({ type: `tabla-tec-${pest}`, description: JSON.stringify({ centro, leyenda, encabezados, filas }) });
      expect(encabezados[1]).toContain(unidad);
      expect(filas.map((f) => f[0])).toEqual(leyenda.map((l) => l.replace(/\s+[\d,]+\s*%$/, "").trim()));
      expect(num(centro), "total del centro = suma de la tabla").toBeCloseTo(suma(filas.map((f) => num(f[1]))), 1);
      expect(filas.map((f) => num(f[2]))).toEqual(leyenda.map((l) => num(l.match(/[\d,]+\s*%$/)![0])));
    }
  });

  test("E2E-11 · CA-09.1: con filtros sin resultados las tres gráficas dicen «Sin datos para estos filtros»", async ({ page }) => {
    soloEscritorio();
    // Meta solo tiene un proyecto Anunciado: Meta + Inactivo no tiene resultados (se aplica por URL).
    await abrirMapa(page, `?departamento=Meta&estado=Inactivo`);
    await expect.poll(() => kpi(page, "Proyectos identificados"), { timeout: 15_000 }).toMatch(/(^|\s)0$/);
    for (const t of [ESTADO, EVOL, TEC]) {
      await expect(tarjeta(page, t).getByText("Sin datos para estos filtros", { exact: true }), t).toBeVisible();
      await expect(panel(page, t).locator("svg"), `${t} sin dibujo`).toHaveCount(0);
    }
  });

  test("RNF-05 · colores de las barras = colores de estado de la leyenda del mapa", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page, qDepto);
    await textosDibujo(page, ESTADO);
    const leyenda = await page.getByRole("list", { name: "Estados" }).getByRole("listitem").evaluateAll((lis) =>
      lis.map((li) => {
        const m = [...li.querySelectorAll("*")].find((e) => getComputedStyle(e).backgroundColor !== "rgba(0, 0, 0, 0)");
        return { estado: (li as HTMLElement).innerText.trim(), color: m ? getComputedStyle(m).backgroundColor : "", var: m?.getAttribute("style") ?? "" };
      }),
    );
    const barras = await dibujo(page, ESTADO).locator(".recharts-rectangle, path[fill], rect[fill]").evaluateAll((es) =>
      es
        .map((e) => ({ fill: e.getAttribute("fill") ?? "", calc: getComputedStyle(e).fill, y: e.getBoundingClientRect().top }))
        .filter((b) => b.fill && b.fill !== "none" && !/^#?fff|white|transparent/i.test(b.fill))
        .sort((a, b) => a.y - b.y),
    );
    test.info().annotations.push({ type: "colores", description: JSON.stringify({ leyenda, barras }) });
    expect(barras.map((b) => b.calc), "mismo color que la leyenda, en orden de estados").toEqual(leyenda.map((l) => l.color));
    for (const b of barras) expect(b.fill, "color tomado de un token (var(--…))").toMatch(/^var\(--/);
  });

  test("limpieza · borra los datos sembrados y deja 7 proyectos aprobados", async () => {
    soloEscritorio();
    await limpiar();
    const { count } = await admin().from("proyectos").select("id", { count: "exact", head: true }).like("nombre", `${P}%`);
    expect(count).toBe(0);
    const { count: aprob } = await admin().from("proyectos").select("id", { count: "exact", head: true }).eq("publicacion", "Aprobado");
    expect(aprob).toBe(7);
  });
});

test.describe("006 · Gráficas (375 px y RNF)", () => {
  test("E2E-12 · RNF-01, RNF-03, RNF-06: 375 px con movimiento reducido: tarjetas apiladas, sin desborde, pestañas con teclado, sin animación, consola limpia", async ({ page }) => {
    soloMovil();
    test.setTimeout(4 * 60_000);
    const errores = vigilarConsola(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Registra, cuadro a cuadro, la geometría de las gráficas desde que aparecen.
    await page.addInitScript(() => {
      const w = window as unknown as { __geo: Record<string, string[]>; __reg: (k: string) => void };
      w.__geo = {};
      const t0 = performance.now();
      const paso = () => {
        const reg = document.querySelectorAll("section, [role=region]");
        reg.forEach((r) => {
          const h = r.querySelector("h2")?.textContent ?? "";
          if (!/Capacidad por estado|Evolución|Tecnología/.test(h)) return;
          const svg = r.querySelector("[role=tabpanel] svg");
          if (!svg) return;
          const v = [...svg.querySelectorAll("path,rect")].map((e) => e.getAttribute("d") ?? `${e.getAttribute("width")}x${e.getAttribute("height")}`).join(";");
          const lista = (w.__geo[h] ??= []);
          if (lista[lista.length - 1] !== v) lista.push(v);
        });
        if (performance.now() - t0 < 15000) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
    await abrirMapa(page);
    await page.waitForTimeout(3000);
    const geo = await page.evaluate(() => (window as unknown as { __geo: Record<string, string[]> }).__geo);
    test.info().annotations.push({ type: "cuadros-distintos-por-grafica", description: JSON.stringify(Object.fromEntries(Object.entries(geo).map(([k, v]) => [k, v.length]))) });

    // RNF-01: una debajo de otra, sin desborde.
    const cajas = [];
    for (const t of [ESTADO, EVOL, TEC]) {
      await tarjeta(page, t).scrollIntoViewIfNeeded();
      cajas.push((await tarjeta(page, t).evaluate((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height };
      })));
    }
    test.info().annotations.push({ type: "cajas", description: JSON.stringify(cajas) });
    expect(cajas[1].y).toBeGreaterThanOrEqual(cajas[0].y + cajas[0].h - 1);
    expect(cajas[2].y).toBeGreaterThanOrEqual(cajas[1].y + cajas[1].h - 1);
    for (const c of cajas) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w).toBeLessThanOrEqual(375);
    }
    const desborde = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await desborde(), "sin desplazamiento horizontal").toBeLessThanOrEqual(0);

    // RNF-03: pestañas con Tab y flechas, con aria-selected.
    await tarjeta(page, ESTADO).getByRole("heading").click();
    let llego = false;
    for (let i = 0; i < 6 && !llego; i++) {
      await page.keyboard.press("Tab");
      llego = await pestana(page, ESTADO, "Potencia [MW]").evaluate((e) => e === document.activeElement);
    }
    expect(llego, "Tab llega a la pestaña activa").toBe(true);
    await page.keyboard.press("ArrowRight");
    await expect(pestana(page, ESTADO, "Energía [MWh]")).toBeFocused();
    await expect(pestana(page, ESTADO, "Energía [MWh]")).toHaveAttribute("aria-selected", "true");
    await expect(pestana(page, ESTADO, "Potencia [MW]")).toHaveAttribute("aria-selected", "false");
    await page.keyboard.press("ArrowRight");
    await expect(pestana(page, ESTADO, "Duración [h]")).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Tab");
    expect(await pestana(page, ESTADO, "Potencia [MW]").evaluate((e) => e === document.activeElement), "Tab sale de la lista de pestañas").toBe(false);
    // Tabla equivalente y texto (no solo color).
    await expect(page.getByRole("list", { name: "Estados" })).toContainText("En operación");
    await expect(tarjeta(page, TEC).getByRole("list", { name: "Tecnologías" })).toContainText("Li-ion");
    for (const t of [ESTADO, EVOL, TEC]) await expect(tarjeta(page, t).getByRole("button", { name: "Ver como tabla" })).toBeVisible();

    // RNF-06: sin animación al cambiar de pestaña.
    await page.evaluate(() => {
      const w = window as unknown as { __cambio: string[] };
      w.__cambio = [];
      const t0 = performance.now();
      const paso = () => {
        const svg = [...document.querySelectorAll("[role=tabpanel]")].find((p) => p.getAttribute("aria-label")?.startsWith("Capacidad") || p.closest("section,[role=region]")?.querySelector("h2")?.textContent === "Capacidad por estado")?.querySelector("svg");
        const v = svg ? [...svg.querySelectorAll("path")].map((e) => e.getAttribute("d")).join(";") : "";
        if (w.__cambio[w.__cambio.length - 1] !== v) w.__cambio.push(v);
        if (performance.now() - t0 < 2500) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
    await pestana(page, ESTADO, "Potencia [MW]").click();
    await page.waitForTimeout(2700);
    const cambio = await page.evaluate(() => (window as unknown as { __cambio: string[] }).__cambio.length);
    test.info().annotations.push({ type: "cuadros-al-cambiar-pestana", description: String(cambio) });
    expect(cambio, "la gráfica salta a su forma final (a lo sumo antes/después y un cuadro intermedio)").toBeLessThanOrEqual(3);
    for (const [k, v] of Object.entries(geo)) expect(v.length, `«${k}» aparece sin animación`).toBeLessThanOrEqual(3);
    expect(await desborde()).toBeLessThanOrEqual(0);
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("RNF-06 (control) · sin movimiento reducido la gráfica sí se anima (valida la medición de E2E-12)", async ({ page }) => {
    soloMovil();
    await page.addInitScript(() => {
      const w = window as unknown as { __n: number };
      w.__n = 0;
      let ant = "";
      const t0 = performance.now();
      const paso = () => {
        const h = [...document.querySelectorAll("h2")].find((x) => x.textContent === "Capacidad por estado");
        const svg = h?.closest("section,[role=region]")?.querySelector("[role=tabpanel] svg");
        const v = svg ? [...svg.querySelectorAll("path,rect")].map((e) => e.getAttribute("d") ?? e.getAttribute("width")).join(";") : "";
        if (v !== ant) { w.__n++; ant = v; }
        if (performance.now() - t0 < 15000) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
    await abrirMapa(page);
    await page.waitForTimeout(3000);
    const n = await page.evaluate(() => (window as unknown as { __n: number }).__n);
    test.info().annotations.push({ type: "cuadros-sin-reduccion", description: String(n) });
    expect(n, "con animación hay varios cuadros intermedios").toBeGreaterThan(3);
  });
});
