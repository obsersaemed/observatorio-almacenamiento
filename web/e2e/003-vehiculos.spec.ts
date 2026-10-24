// E2E de la spec 003 · Vehículos eléctricos (/vehiculos).
// Escrito por el probador independiente a partir de spec.md y de la sección
// "Escenarios E2E" de plan.md, sin leer el código de producción.
// Corre contra `npm run dev` conectado al proyecto Supabase "pruebas":
//   E2E_MATCH=003-vehiculos.spec.ts npx playwright test -c e2e/006.config.ts --project=escritorio
//   E2E_MATCH=003-vehiculos.spec.ts npx playwright test -c e2e/006.config.ts --project=movil-375
// Las cifras esperadas se calculan de datos/vehiculos_*.csv (lo importado en "pruebas").
// Los escenarios que importan (E2E-05, E2E-15, E2E-16) usan CSV de prueba en una carpeta
// temporal y, al final, reimportan los datos reales desde datos/ (49 líneas, corte 2026-09-17).
import { test, expect, type Page, type Locator } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { admin, vigilarConsola } from "./utilidades";

const RAIZ = path.join(__dirname, "..", "..");
const DATOS = path.join(RAIZ, "datos");
const CORTE = "2026-09-17";
const MARCA_E2E = "E2E";
const LINEA_E2E = "e2e-003-linea-40-60";

// ---------- Datos esperados (desde los CSV importados) ----------
function leerCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ",") { fila.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo); filas.push(fila); fila = []; campo = "";
    } else campo += c;
  }
  if (campo !== "" || fila.length) { fila.push(campo); filas.push(fila); }
  return filas.filter((f) => f.some((x) => x.trim() !== ""));
}
const sinBom = (s: string) => s.replace(/^﻿/, "");
type Linea = { marca: string; linea: string; tipo: string; min: number; max: number };
const lineasCsv = leerCsv(sinBom(fs.readFileSync(path.join(DATOS, "vehiculos_lineas.csv"), "utf8")));
const ventasCsv = leerCsv(sinBom(fs.readFileSync(path.join(DATOS, "vehiculos_ventas.csv"), "utf8")));
const LINEAS: Linea[] = lineasCsv.slice(1).map((f) => ({ marca: f[0], linea: f[1], tipo: f[2], min: Number(f[3]), max: Number(f[4]) }));
const VENTAS = ventasCsv.slice(1).map((f) => ({ linea: f[0], ano: Number(f[1]), u: Number(f[2]) }));
const porLinea = new Map(LINEAS.map((l) => [l.linea, l]));
const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const unidadesLinea = (l: string) => suma(VENTAS.filter((v) => v.linea === l).map((v) => v.u));
const unidadesMarca = (m: string) => suma(LINEAS.filter((l) => l.marca === m).map((l) => unidadesLinea(l.linea)));
const energiaLineas = (ls: Linea[]) => suma(ls.map((l) => (unidadesLinea(l.linea) * (l.min + l.max)) / 2 / 1000));
const MARCAS = [...new Set(LINEAS.map((l) => l.marca))].sort((a, b) => unidadesMarca(b) - unidadesMarca(a));
const TOP9 = MARCAS.slice(0, 9);

const fmt = (n: number, d = 1) => n.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });
/** «1.234,5 MWh» → 1234.5 */
const num = (s: string) => {
  const t = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return t === "" || t === "-" ? 0 : Number(t);
};
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hoy = () => new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Bogota" });

// ---------- Localizadores accesibles ----------
const R_BARRAS = "Vehículos eléctricos vendidos por marca y año de registro";
const R_MARCAS = "Participación de marcas en el mercado %";
const R_TEC = "Tecnología de batería";
const R_ENERGIA = "Energía en circulación por tipo de batería [MWh]";
const GRAFICAS = [R_BARRAS, R_MARCAS, R_TEC, R_ENERGIA];
const region = (page: Page, nombre: string) => page.getByRole("region", { name: nombre, exact: true });
const kpiVeh = (page: Page) => page.getByRole("group", { name: /^Vehículos eléctricos registrados/ });
const kpiEnergia = (page: Page) => page.getByRole("group", { name: "Energía almacenada en circulación [MWh]", exact: true });
const tablaTec = (page: Page) => page.getByRole("table", { name: "Participación por tipo de batería" });
const grupoFiltro = (page: Page, nombre: string) => page.getByRole("group", { name: nombre, exact: true });
const botonFiltro = (page: Page, grupo: string) => grupoFiltro(page, grupo).getByRole("button", { name: new RegExp(`^${esc(grupo)} `) });
const opcion = (page: Page, grupo: string, valor: string) =>
  grupoFiltro(page, grupo).getByRole("checkbox", { name: new RegExp(`^${esc(valor)} \\([\\d.]+\\)$`) });
const creditos = (page: Page) => page.getByText(/^Fuentes: ANDEMOS/);

async function abrirFiltro(page: Page, grupo: string) {
  const b = botonFiltro(page, grupo);
  if ((await b.getAttribute("aria-expanded")) !== "true") await b.click();
  await expect(b).toHaveAttribute("aria-expanded", "true");
  await expect(grupoFiltro(page, grupo).getByRole("searchbox", { name: `Buscar en ${grupo}` })).toBeVisible();
}
async function cerrarFiltro(page: Page, grupo: string) {
  const b = botonFiltro(page, grupo);
  if ((await b.getAttribute("aria-expanded")) === "true") await page.keyboard.press("Escape");
  await expect(b).not.toHaveAttribute("aria-expanded", "true");
}
async function elegir(page: Page, grupo: string, valor: string) {
  await abrirFiltro(page, grupo);
  await grupoFiltro(page, grupo).getByRole("searchbox", { name: `Buscar en ${grupo}` }).fill(valor);
  await opcion(page, grupo, valor).check();
  await cerrarFiltro(page, grupo);
}
/** Opciones visibles del desplegable (sin «Todas»): «valor (n)». */
async function opciones(page: Page, grupo: string) {
  await abrirFiltro(page, grupo);
  const nombres = await grupoFiltro(page, grupo).getByRole("checkbox").evaluateAll((cs) =>
    cs.map((c) => c.getAttribute("aria-label") ?? (c as HTMLInputElement).labels?.[0]?.innerText ?? (c.closest("label") as HTMLElement | null)?.innerText ?? ""),
  );
  await cerrarFiltro(page, grupo);
  return nombres.map((s) => s.replace(/\s+/g, " ").trim()).filter((s) => !/^Todas\b/.test(s));
}

async function abrir(page: Page, query = "") {
  await page.goto(`/vehiculos${query}`, { timeout: 120_000 });
  await expect(kpiVeh(page)).toBeVisible({ timeout: 60_000 });
  for (const g of GRAFICAS) {
    await expect(region(page, g)).toBeVisible({ timeout: 60_000 });
    await expect(region(page, g).locator("svg").or(region(page, g).getByText("Sin datos para estos filtros")).first()).toBeVisible({ timeout: 60_000 });
  }
}
async function kpis(page: Page) {
  const v = (await kpiVeh(page).innerText()).replace(/\s+/g, " ").trim();
  const e = (await kpiEnergia(page).innerText()).replace(/\s+/g, " ").trim();
  const vValor = (v.match(/[\d.,]+(?!.*[\d])/) ?? [""])[0];
  const eValor = (e.match(/([\d.,]+) MWh$/) ?? ["", ""])[1];
  return { vTexto: v, eTexto: e, vehiculos: num(vValor), energia: num(eValor), vValor, eValor };
}
async function filasTablaTec(page: Page) {
  return tablaTec(page).getByRole("rowgroup").nth(1).getByRole("row").evaluateAll((rs) =>
    rs.map((r) => [...r.querySelectorAll("th,td")].map((c) => (c as HTMLElement).innerText.trim())),
  );
}
async function verTabla(page: Page, g: string) {
  const b = region(page, g).getByRole("button", { name: "Ver como tabla" });
  if (await b.isVisible()) await b.click();
  await expect(region(page, g).getByRole("table")).toBeVisible();
}
async function leerTabla(page: Page, g: string) {
  await verTabla(page, g);
  const t = region(page, g).getByRole("table");
  const encabezados = (await t.getByRole("columnheader").allInnerTexts()).map((s) => s.replace(/\s+/g, " ").trim());
  const filas = await t.locator("tbody tr").evaluateAll((rs) =>
    rs.map((r) => [...r.querySelectorAll("th,td")].map((c) => (c as HTMLElement).innerText.trim())),
  );
  return { encabezados, filas };
}
async function leyenda(page: Page, g: string, lista: string) {
  return (await region(page, g).getByRole("list", { name: lista }).getByRole("listitem").allInnerTexts()).map((s) => s.replace(/\s+/g, " ").trim());
}
const pct = (s: string) => num((s.match(/([\d.,]+)\s*%/) ?? ["", ""])[1]);
/** CA-05.1 y CA-07.1 (versión vigente): la suma de porcentajes redondeados a un decimal es 100 % ± 0,1. */
const desvio100 = (xs: number[]) => Math.round(Math.abs(suma(xs) - 100) * 1000) / 1000;
/** Región con nombre que contiene la tabla de «Ver como tabla» («Tabla de <título>»). */
const regionTabla = (page: Page, g: string) => region(page, g).getByRole("region", { name: /^Tabla de / });

function soloEscritorio() {
  // E2E_DATOS_375=1 corre también a 375 px los escenarios de lectura (no los de importación).
  const tambien375 = process.env.E2E_DATOS_375 === "1" && test.info().titlePath.some((t) => /datos reales/.test(t));
  test.skip(test.info().project.name !== "escritorio" && !tambien375, "Escenario de datos: solo escritorio");
}
function soloMovil() {
  test.skip(test.info().project.name !== "movil-375", "Escenario de 375 px");
}
function nota(tipo: string, d: unknown) {
  test.info().annotations.push({ type: tipo, description: typeof d === "string" ? d : JSON.stringify(d) });
}

// ---------- Importación (comandos del plan) ----------
function python(args: string[]) {
  const r = spawnSync("python", args, { cwd: RAIZ, encoding: "utf8", timeout: 5 * 60_000, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  return { codigo: r.status, salida: `${r.stdout ?? ""}\n${r.stderr ?? ""}`.trim() };
}
function carpetaTemporal(nombre: string) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), `e2e-003-${nombre}-`));
  for (const f of ["vehiculos_lineas.csv", "vehiculos_ventas.csv"]) fs.copyFileSync(path.join(DATOS, f), path.join(d, f));
  return d;
}
function anexar(archivo: string, linea: string) {
  const t = fs.readFileSync(archivo, "utf8");
  fs.writeFileSync(archivo, t + (t.endsWith("\n") ? "" : "\n") + linea + "\n", "utf8");
}
async function htmlVehiculos(page: Page) {
  return (await page.request.get("/vehiculos", { timeout: 120_000 })).text();
}
/** Espera hasta `limite` ms a que el HTML de /vehiculos cumpla la condición. */
async function esperarPagina(page: Page, cond: (html: string) => boolean, limite: number) {
  const inicio = Date.now();
  for (;;) {
    if (cond(await htmlVehiculos(page))) return Date.now() - inicio;
    if (Date.now() - inicio > limite) return -1;
    await page.waitForTimeout(15_000);
  }
}
const reimportarReales = () => python(["scripts/importar_vehiculos.py", "--entorno", "pruebas", "--corte", CORTE]);

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

test.describe("003 · Vehículos (datos reales)", () => {
  test.beforeEach(() => {
    test.setTimeout(4 * 60_000);
  });

  test("E2E-01 · CA-01.1: sin «en construcción»; dos KPI, tabla de tecnología y cuatro gráficas", async ({ page }) => {
    soloEscritorio();
    const errores = vigilarConsola(page);
    await abrir(page);
    await expect(page.getByText(/en construcción/i)).toHaveCount(0);
    await expect(kpiVeh(page)).toBeVisible();
    await expect(kpiEnergia(page)).toBeVisible();
    await expect(tablaTec(page)).toBeVisible();
    for (const g of GRAFICAS) {
      await expect(region(page, g).getByRole("heading", { name: g })).toBeVisible();
      await expect(region(page, g).locator("svg").first()).toBeVisible();
    }
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("E2E-04 · CA-03.1 / RNF-04: sin filtros, KPI «45.346» (sin «mil») y «2.426,5 MWh»", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const k = await kpis(page);
    nota("kpi", k);
    expect(k.vValor).toBe("45.346");
    expect(k.vTexto).not.toMatch(/\bmil\b/i);
    expect(k.vTexto).toMatch(/· 2024–2026/);
    expect(k.eValor).toBe("2.426,5");
    expect(fmt(energiaLineas(LINEAS)), "cálculo independiente desde el CSV").toBe("2.426,5");
  });

  test("E2E-06 · CA-05.1: LFP 67,5 % y los porcentajes suman 100 % ±0,1", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const filas = await filasTablaTec(page);
    nota("tabla-tecnologia", filas);
    expect(filas.find((f) => f[0] === "LFP")?.[1]).toBe("67,5 %");
    for (const f of filas) expect(f[1], "un decimal y %").toMatch(/^\d{1,3},\d %$/);
    nota("suma-tecnologia", fmt(suma(filas.map((f) => pct(f[1])))));
    expect(desvio100(filas.map((f) => pct(f[1]))), "suma 100 % ±0,1").toBeLessThanOrEqual(0.1);
  });

  test("E2E-07 · CA-06.1: 10 barras (9 marcas ordenadas + «Otros» al final); leyenda 2024, 2025, «2026 (parcial)»", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const textos = (await region(page, R_BARRAS).locator("svg").first().locator("text").allTextContents()).map((s) => s.trim());
    nota("svg-barras", textos.join(" | "));
    const cats = textos.filter((s) => [...TOP9, "Otros"].includes(s));
    expect(cats, "categorías del eje en orden: 9 marcas de mayor a menor y «Otros»").toEqual([...TOP9, "Otros"]);
    expect(await leyenda(page, R_BARRAS, "Años")).toEqual(["2024", "2025", "2026 (parcial)"]);
    const { encabezados, filas } = await leerTabla(page, R_BARRAS);
    nota("tabla-barras", { encabezados, filas });
    expect(filas.map((f) => f[0])).toEqual([...TOP9, "Otros"]);
    // Totales por marca (suma de los años) de mayor a menor en las 9 marcas.
    const totales = filas.map((f) => suma(f.slice(1).filter((c) => !/%/.test(c)).map(num)));
    nota("totales-barras", totales);
    for (let i = 1; i < 9; i++) expect(totales[i - 1]).toBeGreaterThanOrEqual(totales[i]);
    TOP9.forEach((m, i) => expect([unidadesMarca(m), 2 * unidadesMarca(m)], m).toContain(totales[i]));
    nota("otros-esperado", suma(MARCAS.slice(9).map(unidadesMarca)));
    // «Otros» siempre al final, aunque sume más que algunas marcas.
    expect(filas[filas.length - 1][0], "«Otros» al final").toBe("Otros");
    // (La tabla trae la columna «Total», así que la suma de la fila puede ser el doble.)
    const otros = suma(MARCAS.slice(9).map(unidadesMarca));
    expect([otros, 2 * otros], "«Otros» = suma de las demás marcas").toContain(totales[9]);
    nota("otros-supera-a", TOP9.filter((m) => unidadesMarca(m) < otros));
  });

  test("E2E-08 · CA-07.1: dona de marcas con las mismas 10 categorías, «Otros» al final, porcentajes que suman 100 % ±0,1", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const ley = await leyenda(page, R_MARCAS, "Marcas");
    nota("leyenda-marcas", ley);
    const { encabezados, filas } = await leerTabla(page, R_MARCAS);
    nota("tabla-marcas", { encabezados, filas });
    expect(filas.map((f) => f[0]), "mismas categorías que las barras").toEqual([...TOP9, "Otros"]);
    const colPct = encabezados.findIndex((h) => /%/.test(h));
    const pctTabla = filas.map((f) => pct(f[colPct] + (/%/.test(f[colPct]) ? "" : " %")));
    nota("sumas", { tabla: fmt(suma(pctTabla)), leyenda: fmt(suma(ley.map(pct))) });
    expect(filas[filas.length - 1][0], "tabla: «Otros» al final").toBe("Otros");
    expect.soft(desvio100(pctTabla), "tabla: suma 100 % ±0,1").toBeLessThanOrEqual(0.1);
    expect(ley.map((s) => s.replace(/\s*[\d.,]+\s*%$/, "")), "leyenda: mismas categorías").toEqual([...TOP9, "Otros"]);
    expect.soft(ley.every((s) => /\d,\d %$/.test(s)), "leyenda con un decimal (RNF-04)").toBe(true);
    expect(ley[ley.length - 1], "leyenda: «Otros» al final").toMatch(/^Otros /);
    expect(desvio100(ley.map(pct)), "leyenda visible: los porcentajes suman 100 % ±0,1").toBeLessThanOrEqual(0.1);
  });

  test("E2E-09 · CA-08.1: los porcentajes de la dona de tecnología coinciden con la tabla", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const tabla = await filasTablaTec(page);
    const ley = await leyenda(page, R_TEC, "Tipos de batería");
    const { encabezados, filas } = await leerTabla(page, R_TEC);
    nota("comparacion", { tablaRF05: tabla, leyendaDona: ley, tablaDona: { encabezados, filas } });
    const colPct = encabezados.findIndex((h) => /%/.test(h));
    const deTabla = tabla.map((f) => `${f[0]} ${f[1]}`);
    expect(filas.map((f) => `${f[0]} ${f[colPct].replace(/\s*%?$/, " %")}`), "«Ver como tabla» de la dona = tabla RF-05").toEqual(deTabla);
    expect(ley, "porcentajes visibles en la dona = tabla RF-05").toEqual(deTabla);
  });

  test("E2E-10 · CA-09.1 / RNF-07: la suma de la energía por tipo coincide con el KPI (2.426,5 MWh)", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const textos = (await region(page, R_ENERGIA).locator("svg").first().locator("text").allTextContents()).join(" ");
    expect(textos, "eje en MWh, sin unidades de vehículos").toMatch(/Energía \[MWh\]/);
    expect(textos).not.toMatch(/vehículos|unidades/i);
    const { encabezados, filas } = await leerTabla(page, R_ENERGIA);
    nota("tabla-energia", { encabezados, filas });
    const total = suma(filas.map((f) => num(f[1])));
    expect(fmt(total)).toBe("2.426,5");
    expect(fmt(total)).toBe((await kpis(page)).eValor);
  });

  test("E2E-11 · CA-10.1 / RNF-03: «Ver como tabla» en cada gráfica: mismas categorías, cifras es-CO, unidad en el encabezado", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const categorias: Record<string, string[]> = {
      [R_BARRAS]: [...TOP9, "Otros"],
      [R_MARCAS]: [...TOP9, "Otros"],
      [R_TEC]: ["LFP", "Lithium-ion", "NMC Lithium-ion", "ULTIUM"],
      [R_ENERGIA]: ["LFP", "Lithium-ion", "NMC Lithium-ion", "ULTIUM"],
    };
    for (const g of GRAFICAS) {
      // Con teclado: foco en el botón y Enter.
      await region(page, g).getByRole("button", { name: "Ver como tabla" }).focus();
      await page.keyboard.press("Enter");
      const { encabezados, filas } = await leerTabla(page, g);
      nota(`tabla ${g}`, { encabezados, filas });
      await expect.soft(regionTabla(page, g), `${g}: tabla dentro de la región «Tabla de ${g}»`).toHaveAccessibleName(`Tabla de ${g}`);
      await expect.soft(regionTabla(page, g).getByRole("table"), `${g}: la región contiene la tabla`).toBeVisible();
      expect(filas.map((f) => f[0]), `${g}: categorías`).toEqual(categorias[g]);
      expect.soft(encabezados.slice(1).every((h) => /\[[^\]]+\]/.test(h)), `${g}: unidad entre corchetes en cada columna de cifras: ${encabezados.join(" | ")}`).toBe(true);
      for (const f of filas) for (const c of f.slice(1)) expect.soft(c, `${g}: cifra es-CO`).toMatch(/^\d{1,3}(\.\d{3})*(,\d)?( %)?$/);
    }
    // Cifras iguales a la gráfica de energía (etiquetas del dibujo).
    await region(page, R_ENERGIA).getByRole("button", { name: /Ver como gráfica/ }).click();
    const esperadas = ["1.544,5", "791,1", "69,6", "21,3"];
    // Las etiquetas de valor pueden aparecer después del dibujo: se espera hasta 15 s.
    await expect
      .poll(async () => (await region(page, R_ENERGIA).locator("svg").first().locator("text").allTextContents()).map((s) => s.trim()), { timeout: 15_000 })
      .toEqual(expect.arrayContaining(esperadas));
    const { filas } = await leerTabla(page, R_ENERGIA);
    expect(filas.map((f) => f[1]), "tabla = etiquetas de la gráfica").toEqual(esperadas);
  });

  test("E2E-13 · CA-11.1: línea de créditos con la fecha de importación y «Ventas hasta el 17/09/2026»", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const t = (await creditos(page).first().innerText()).replace(/\s+/g, " ").trim();
    nota("creditos", t);
    expect(t).toBe(`Fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio · Última actualización: ${hoy()} · Ventas hasta el 17/09/2026`);
  });
});

test.describe("003 · Vehículos (filtros)", () => {
  test.beforeEach(() => {
    test.setTimeout(4 * 60_000);
  });

  test("E2E-02 · CA-02.1: con Tesla, KPI, tabla y gráficas solo de Tesla; Línea ofrece solo sus líneas con conteo", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    await elegir(page, "Marca", "Tesla");
    await expect(page).toHaveURL(/Tesla/);
    await expect(botonFiltro(page, "Marca")).toHaveAccessibleName(/^Marca Tesla$/);
    const tesla = LINEAS.filter((l) => l.marca === "Tesla");
    await expect.poll(async () => (await kpis(page)).vehiculos).toBe(unidadesMarca("Tesla"));
    const k = await kpis(page);
    nota("kpi-tesla", k);
    expect(k.eValor).toBe(fmt(energiaLineas(tesla)));
    expect(await filasTablaTec(page)).toEqual([["Lithium-ion", "100,0 %"]]);
    expect((await leerTabla(page, R_BARRAS)).filas.map((f) => f[0])).toEqual(["Tesla"]);
    expect((await leerTabla(page, R_MARCAS)).filas.map((f) => f[0])).toEqual(["Tesla"]);
    expect((await leerTabla(page, R_TEC)).filas.map((f) => f[0])).toEqual(["Lithium-ion"]);
    const en = await leerTabla(page, R_ENERGIA);
    expect(en.filas.map((f) => f[0])).toEqual(["Lithium-ion"]);
    expect(en.filas[0][1]).toBe(k.eValor);
    const ops = await opciones(page, "Línea");
    nota("opciones-linea", ops);
    const esperadas = tesla.map((l) => `${l.linea} (${unidadesLinea(l.linea).toLocaleString("es-CO")})`).sort();
    expect([...ops].sort(), "solo las líneas de Tesla, con su conteo de vehículos").toEqual(esperadas);
  });

  test("E2E-03 · CA-02.2: la URL filtrada reproduce filtros y resultado en otra pestaña", async ({ page, context }) => {
    soloEscritorio();
    await abrir(page);
    await elegir(page, "Marca", "Tesla");
    await elegir(page, "Línea", "Model Y");
    await expect.poll(async () => (await kpis(page)).vehiculos).toBe(unidadesLinea("Model Y"));
    const url = page.url();
    nota("url", url);
    const foto = async (p: Page) => ({
      botones: await Promise.all(["Marca", "Tipo de batería", "Línea"].map(async (g) => (await botonFiltro(p, g).innerText()).trim())),
      kpis: await kpis(p),
      tabla: await filasTablaTec(p),
      barras: (await leerTabla(p, R_BARRAS)).filas,
      energia: (await leerTabla(p, R_ENERGIA)).filas,
      csv: (await p.getByRole("button", { name: /^Descargar CSV/ }).innerText()).trim(),
    });
    const a = await foto(page);
    const otra = await context.newPage();
    await abrir(otra, url.slice(url.indexOf("/vehiculos") + "/vehiculos".length));
    const b = await foto(otra);
    nota("foto", { a, b });
    expect(b).toEqual(a);
    await otra.close();
  });

  test("E2E-12 · CA-10.2: filtros sin resultados → «Sin datos para estos filtros» y KPI en 0", async ({ page }) => {
    soloEscritorio();
    // Los nombres de los parámetros se toman de la URL que deja la interfaz.
    await abrir(page);
    await elegir(page, "Marca", "Tesla");
    await expect(page).toHaveURL(/Tesla/);
    const qMarca = new URL(page.url()).search;
    await page.getByRole("button", { name: "Limpiar filtros" }).click();
    await elegir(page, "Tipo de batería", "LFP");
    await expect(page).toHaveURL(/LFP/);
    const qTipo = new URL(page.url()).search.slice(1);
    const query = `${qMarca}&${qTipo}`;
    nota("query", query);
    await abrir(page, query);
    for (const g of GRAFICAS) await expect(region(page, g).getByText("Sin datos para estos filtros"), g).toBeVisible();
    await page.screenshot({ path: path.join(test.info().outputDir, "E2E-12-sin-resultados.png"), fullPage: true });
    nota("grupos", await page.getByRole("group").evaluateAll((gs) => gs.map((g) => g.getAttribute("aria-label") ?? g.getAttribute("aria-labelledby") ?? "")));
    const k = await kpis(page);
    nota("kpi-vacio", k);
    expect(k.vehiculos).toBe(0);
    expect(k.energia).toBe(0);
    expect(k.vValor, "KPI muestra 0").toMatch(/^0$/);
    expect(k.eValor, "KPI muestra 0").toMatch(/^0(,0)?$/);
    // ¿La página queda ocupada con el estado vacío? (la primera corrida se colgó al cerrar)
    const t0 = Date.now();
    const carga = await page.evaluate(
      () =>
        new Promise<{ largas: number; ms: number; nodos: number }>((ok) => {
          let largas = 0;
          let ms = 0;
          const obs = new PerformanceObserver((l) => {
            for (const e of l.getEntries()) { largas++; ms += e.duration; }
          });
          try { obs.observe({ type: "longtask" }); } catch { /* sin soporte */ }
          setTimeout(() => { obs.disconnect(); ok({ largas, ms: Math.round(ms), nodos: document.querySelectorAll("*").length }); }, 3000);
        }),
    );
    nota("carga-estado-vacio", { ...carga, respuestaMs: Date.now() - t0 });
    expect(carga.ms, "sin tareas largas continuas en el estado vacío").toBeLessThan(1500);
  });

  test("E2E-14 · CA-13.1: CSV filtrado por marca: solo sus líneas, columnas del esquema, créditos, fechas y licencia", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    await elegir(page, "Marca", "Byd");
    const byd = LINEAS.filter((l) => l.marca === "Byd");
    await expect(page.getByRole("button", { name: /^Descargar CSV/ })).toHaveAccessibleName("Descargar CSV");
    const [descarga] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /^Descargar CSV/ }).click()]);
    const ruta = path.join(test.info().outputDir, descarga.suggestedFilename());
    await descarga.saveAs(ruta);
    const texto = sinBom(fs.readFileSync(ruta, "utf8"));
    await test.info().attach("vehiculos.csv", { path: ruta, contentType: "text/csv" });
    const filas = leerCsv(texto);
    const iEnc = filas.findIndex((f) => f.includes("Marca") && f.includes("Línea"));
    expect(iEnc, "fila de encabezados").toBeGreaterThanOrEqual(0);
    const enc = filas[iEnc];
    nota("encabezados", enc);
    for (const c of ["Marca", "Línea", "Tipo de batería", "Capacidad mínima [kWh]", "Capacidad máxima [kWh]", "Potencia [kW]"]) expect(enc, c).toContain(c);
    for (const a of ["2024", "2025", "2026"]) expect(enc.some((h) => h.includes(a)), `ventas ${a}`).toBe(true);
    expect(enc.some((h) => /Energ[ií]a/.test(h) && /MWh|kWh/.test(h)), "columna de energía con unidad").toBe(true);
    const datos = filas.slice(iEnc + 1).filter((f) => f.length >= enc.length - 1 && LINEAS.some((l) => l.linea === f[enc.indexOf("Línea")]));
    expect(datos.length).toBe(byd.length);
    expect(datos.every((f) => f[enc.indexOf("Marca")] === "Byd"), "solo Byd").toBe(true);
    expect(texto).toContain("Fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio");
    expect(texto).toMatch(/Última actualización: \d{2}\/\d{2}\/\d{4}/);
    expect(texto).toContain("Ventas hasta el 17/09/2026");
    expect(texto).toContain("CC BY 4.0");
  });
});

test.describe("003 · Vehículos (375 px y movimiento reducido)", () => {
  test("E2E-18 · RNF-01, RNF-03, RNF-06: 375 px, reducido, con teclado: sin desborde, filtros plegados, sin animación, consola limpia", async ({ page }) => {
    soloMovil();
    test.setTimeout(4 * 60_000);
    const errores = vigilarConsola(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Registra cada valor que muestran los KPI y la geometría de las barras mientras carga.
    await page.addInitScript(() => {
      const w = window as unknown as { __kpi: string[]; __geo: string[] };
      w.__kpi = [];
      w.__geo = [];
      const t0 = performance.now();
      const paso = () => {
        const m = (document.querySelector("main")?.innerText ?? "").match(/(\d[\d.,]*) MWh/);
        if (m && w.__kpi[w.__kpi.length - 1] !== m[1]) w.__kpi.push(m[1]);
        const g = [...document.querySelectorAll("main svg path, main svg rect")].slice(0, 40).map((e) => e.getAttribute("d") ?? `${e.getAttribute("width")}x${e.getAttribute("height")}`).join(";");
        if (g && w.__geo[w.__geo.length - 1] !== g) w.__geo.push(g);
        if (performance.now() - t0 < 15_000) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
    await abrir(page);
    await page.waitForTimeout(3000);
    const desborde = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await desborde(), "sin desplazamiento horizontal").toBeLessThanOrEqual(0);
    const { kpi, geo } = await page.evaluate(() => {
      const w = window as unknown as { __kpi: string[]; __geo: string[] };
      return { kpi: w.__kpi, geo: w.__geo.length };
    });
    nota("reducido", { kpi, cambiosGeometria: geo });
    expect(kpi, "KPI de energía sin conteo animado").toEqual(["2.426,5"]);
    expect(geo, "gráficas sin animación (la geometría no cambia cuadro a cuadro)").toBeLessThanOrEqual(3);

    // Tarjetas apiladas: los dos KPI uno debajo del otro.
    const a = (await kpiVeh(page).boundingBox())!;
    const b = (await kpiEnergia(page).boundingBox())!;
    expect(b.y, "KPI apilados").toBeGreaterThanOrEqual(a.y + a.height - 1);

    // Filtros plegados en un panel.
    await expect(botonFiltro(page, "Marca"), "panel de filtros plegado").toBeHidden();
    const panel = page.getByText("Filtros", { exact: true }).first();
    await panel.focus().catch(() => {});
    await panel.click();
    await expect(botonFiltro(page, "Marca")).toBeVisible();

    // Con teclado: abrir Marca, buscar, marcar Tesla, cerrar con Escape.
    await botonFiltro(page, "Marca").focus();
    await page.keyboard.press("Enter");
    await expect(botonFiltro(page, "Marca")).toHaveAttribute("aria-expanded", "true");
    const buscador = grupoFiltro(page, "Marca").getByRole("searchbox", { name: "Buscar en Marca" });
    await buscador.focus();
    await page.keyboard.type("Tesla");
    await page.keyboard.press("Tab");
    let foco = "";
    for (let i = 0; i < 6; i++) {
      foco = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? (document.activeElement as HTMLInputElement | null)?.labels?.[0]?.innerText ?? "");
      if (/^Tesla/.test(foco)) break;
      await page.keyboard.press("Tab");
    }
    nota("foco", foco);
    await page.keyboard.press("Space");
    await expect(page).toHaveURL(/Tesla/);
    const caja = (await grupoFiltro(page, "Marca").getByRole("checkbox").first().boundingBox())!;
    expect(await desborde(), "sin desborde con el desplegable abierto").toBeLessThanOrEqual(0);
    expect(caja.x + caja.width).toBeLessThanOrEqual(375);
    await page.keyboard.press("Escape");
    await expect(botonFiltro(page, "Marca")).not.toHaveAttribute("aria-expanded", "true");
    await expect.poll(async () => (await kpis(page)).vehiculos).toBe(unidadesMarca("Tesla"));

    // «Ver como tabla» con teclado en cada gráfica, sin desborde.
    for (const g of GRAFICAS) {
      await region(page, g).getByRole("button", { name: "Ver como tabla" }).focus();
      await page.keyboard.press("Enter");
      await expect(region(page, g).getByRole("table")).toBeVisible();
      const ancho = await region(page, g).getByRole("table").evaluate((t) => {
        const r = t.getBoundingClientRect();
        return { izq: Math.round(r.left), der: Math.round(r.right), ancho: Math.round(r.width) };
      });
      nota(`tabla-375 ${g}`, { ...ancho, desborde: await desborde() });
      // Si la tabla no cabe, ¿su contenedor se desplaza por sí solo y se alcanza con teclado?
      const cont = await region(page, g).getByRole("table").evaluate((t) => {
        let e: HTMLElement | null = t as HTMLElement;
        while (e && e.scrollWidth <= e.clientWidth + 1) e = e.parentElement;
        if (!e || e === document.documentElement || e === document.body) return null;
        return { overflowX: getComputedStyle(e).overflowX, tabindex: e.getAttribute("tabindex"), role: e.getAttribute("role"), nombre: e.getAttribute("aria-label") ?? e.getAttribute("aria-labelledby"), exceso: e.scrollWidth - e.clientWidth };
      });
      if (cont) {
        nota(`contenedor-375 ${g}`, cont);
        // RNF-03: la región desplazable entra en el orden de Tab desde «Ver como tabla» / «Ver como gráfica».
        const reg = regionTabla(page, g);
        await expect(reg, `${g}: región con nombre`).toHaveAccessibleName(`Tabla de ${g}`);
        const desplaza = await reg.evaluate((e) => e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(e).overflowX));
        expect.soft(desplaza, `${g}: la región es el contenedor que se desplaza`).toBe(true);
        const boton = region(page, g).getByRole("button", { name: /Ver como (gráfica|tabla)/ });
        // ¿La región va antes o después del botón en el documento? Se recorre con Tab desde el
        // elemento enfocable anterior a la región (sentido normal de lectura).
        const orden = await reg.evaluate((e, b) => (e.compareDocumentPosition(b as Node) & Node.DOCUMENT_POSITION_FOLLOWING ? "region-antes-del-boton" : "region-despues-del-boton"), await boton.elementHandle());
        nota(`orden-375 ${g}`, orden);
        if (orden === "region-despues-del-boton") await boton.focus();
        else await region(page, g).getByRole("heading").first().evaluate((h) => { (h as HTMLElement).tabIndex = -1; (h as HTMLElement).focus(); });
        let llego = false;
        const recorrido: string[] = [];
        for (let i = 0; i < 6 && !llego; i++) {
          await page.keyboard.press("Tab");
          llego = await reg.evaluate((e) => document.activeElement === e);
          recorrido.push(await page.evaluate(() => { const a = document.activeElement as HTMLElement | null; return a ? `${a.tagName.toLowerCase()}[${a.getAttribute("role") ?? ""}] ${a.getAttribute("aria-label") ?? (a.textContent ?? "").trim().slice(0, 30)}` : ""; }));
        }
        nota(`tab-375 ${g}`, recorrido);
        expect(llego, `${g}: con Tab se llega a la región de la tabla desplazable`).toBe(true);
        // Con foco en la región, la flecha derecha desplaza la tabla.
        const antes = await reg.evaluate((e) => e.scrollLeft);
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(300);
        const despues = await reg.evaluate((e) => e.scrollLeft);
        nota(`flecha-375 ${g}`, { antes, despues });
        expect.soft(despues, `${g}: la flecha derecha desplaza la tabla`).toBeGreaterThan(antes);
        expect(await desborde(), "sin desborde al desplazar la tabla").toBeLessThanOrEqual(0);
      }
    }
    await page.screenshot({ path: path.join(test.info().outputDir, "E2E-18-375.png"), fullPage: true });
    await test.info().attach("E2E-18-375", { path: path.join(test.info().outputDir, "E2E-18-375.png"), contentType: "image/png" });
    expect.soft(await desborde(), "sin desborde con las tablas abiertas").toBeLessThanOrEqual(0);
    expect(errores, "consola sin errores").toEqual([]);
  });
});

let pendienteRestaurar = false;
test.describe.serial("003 · Vehículos (importación y respaldo)", () => {
  test.beforeEach(() => {
    soloEscritorio();
  });
  // Red de seguridad: si algo falla después de sembrar, se reimportan los datos reales.
  test.afterAll(() => {
    if (pendienteRestaurar) {
      const r = reimportarReales();
      if (r.codigo !== 0) throw new Error("No se pudieron reimportar los datos reales: " + r.salida);
      pendienteRestaurar = false;
    }
  });

  test("E2E-05 · CA-03.2: una línea de 100 u con 40/60 kWh da «5,0 MWh»", async ({ page }) => {
    test.setTimeout(12 * 60_000);
    const d = carpetaTemporal("e2e05");
    anexar(path.join(d, "vehiculos_lineas.csv"), `${MARCA_E2E},${LINEA_E2E},LFP,40,60,`);
    anexar(path.join(d, "vehiculos_ventas.csv"), `${LINEA_E2E},2026,100`);
    pendienteRestaurar = true;
    const r = python(["scripts/importar_vehiculos.py", "--entorno", "pruebas", "--corte", CORTE, "--carpeta", d]);
    nota("importacion", r);
    expect(r.codigo, r.salida).toBe(0);
    const espera = await esperarPagina(page, (h) => h.includes(LINEA_E2E), 7 * 60_000);
    nota("espera-ms", espera);
    expect(espera, "la línea sembrada aparece en /vehiculos").toBeGreaterThanOrEqual(0);
    await abrir(page);
    await elegir(page, "Marca", MARCA_E2E);
    await expect.poll(async () => (await kpis(page)).vehiculos).toBe(100);
    expect((await kpis(page)).eValor).toBe("5,0");
  });

  test("E2E-15 · CA-14.1: CSV con unidades negativas y tipo fuera de lista: se rechaza todo, cada error con su fila; la base rechaza con el mismo mensaje", async ({ page }) => {
    test.setTimeout(8 * 60_000);
    const antes = await htmlVehiculos(page);
    const d = carpetaTemporal("e2e15");
    const ventas = path.join(d, "vehiculos_ventas.csv");
    const lineas = path.join(d, "vehiculos_lineas.csv");
    // Fila 2 de ventas con unidades negativas; fila 3 de líneas con un tipo fuera de la lista.
    const v = fs.readFileSync(ventas, "utf8").split(/\r?\n/);
    v[1] = v[1].replace(/,\d+$/, ",-5");
    fs.writeFileSync(ventas, v.join("\n"), "utf8");
    const l = fs.readFileSync(lineas, "utf8").split(/\r?\n/);
    const cl = l[2].split(",");
    cl[2] = "Plomo-ácido";
    l[2] = cl.join(",");
    fs.writeFileSync(lineas, l.join("\n"), "utf8");
    anexar(lineas, `${MARCA_E2E},e2e-003-rechazo,LFP,40,60,`);
    anexar(ventas, `e2e-003-rechazo,2026,7`);

    const sim = python(["scripts/importar_vehiculos.py", "--entorno", "pruebas", "--corte", CORTE, "--carpeta", d, "--simular"]);
    nota("simular", sim);
    pendienteRestaurar = true;
    const real = python(["scripts/importar_vehiculos.py", "--entorno", "pruebas", "--corte", CORTE, "--carpeta", d]);
    nota("real", real);
    for (const r of [sim, real]) {
      expect(r.codigo, "rechazo: código de salida distinto de 0").not.toBe(0);
      expect(r.salida, "error de unidades negativas").toMatch(/Unidades/);
      expect(r.salida, "error del tipo de batería").toMatch(/Tipo de batería/);
      expect(r.salida, "fila de cada error").toMatch(/fila\s*\d+/i);
    }
    // La página sigue con los datos anteriores (no aparece la línea del archivo rechazado).
    await page.waitForTimeout(5_000);
    const despues = await htmlVehiculos(page);
    expect(despues.includes("e2e-003-rechazo"), "no entra nada del archivo rechazado").toBe(false);
    expect(despues.includes(LINEA_E2E), "siguen los datos anteriores").toBe(antes.includes(LINEA_E2E));

    // El mismo dato directo en la base: una venta con unidades negativas.
    const sb = admin();
    const { data: muestra, error: e0 } = await sb.from("vehiculos_ventas").select("*").limit(1);
    expect(e0, e0?.message).toBeNull();
    const fila = { ...(muestra![0] as Record<string, unknown>) };
    nota("columnas-ventas", Object.keys(fila));
    for (const k of Object.keys(fila)) if (/^(id|creado|created|actualizado|updated)/i.test(k)) delete fila[k];
    const kUnid = Object.keys(fila).find((k) => /unidad/i.test(k))!;
    const kAno = Object.keys(fila).find((k) => /^a(n|ñ)o/i.test(k))!;
    fila[kUnid] = -5;
    fila[kAno] = 2099;
    const { error } = await sb.from("vehiculos_ventas").insert(fila);
    nota("base", error ? { code: error.code, message: error.message, details: error.details } : "sin error");
    if (!error) await sb.from("vehiculos_ventas").delete().eq(kAno, 2099);
    expect(error, "la base rechaza la venta negativa").not.toBeNull();
    const msgImport = (real.salida.split(/\r?\n/).find((s) => /Unidades/.test(s)) ?? "").trim();
    nota("mensajes", { importacion: msgImport, base: error!.message });
    const nucleo = (s: string) => (s.match(/Unidades[^.;]*/) ?? [s])[0].replace(/\s+/g, " ").trim().toLowerCase();
    expect(nucleo(error!.message), "mismo mensaje en la base y en la importación").toBe(nucleo(msgImport));
  });

  test("E2E-16 · CA-14.2: al reimportar el CSV válido, en ≤ 5 min se ven los datos nuevos y la «Última actualización» de hoy", async ({ page }) => {
    test.setTimeout(10 * 60_000);
    const r = reimportarReales();
    nota("reimportacion", r);
    expect(r.codigo, r.salida).toBe(0);
    pendienteRestaurar = false;
    const espera = await esperarPagina(page, (h) => !h.includes(LINEA_E2E), 5 * 60_000);
    nota("espera-ms", espera);
    expect(espera, "los datos nuevos (sin la línea E2E) aparecen en ≤ 5 min").toBeGreaterThanOrEqual(0);
    await abrir(page);
    const k = await kpis(page);
    expect(k.vValor).toBe("45.346");
    expect(k.eValor).toBe("2.426,5");
    await expect(creditos(page).first()).toContainText(`Última actualización: ${hoy()} · Ventas hasta el 17/09/2026`);
  });

  test("E2E-17 · CA-15.1: el respaldo escribe los CSV de vehículos junto a los de proyectos, normativa y noticias", async () => {
    test.setTimeout(5 * 60_000);
    const d = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-003-respaldo-"));
    const r = python(["scripts/respaldo.py", "--entorno", "pruebas", "--carpeta", d]);
    const archivos = fs.readdirSync(d, { recursive: true }).map(String);
    nota("respaldo", { codigo: r.codigo, salida: r.salida.slice(0, 1500), archivos });
    expect(r.codigo, r.salida).toBe(0);
    for (const n of ["proyectos", "normativa", "noticias"]) expect(archivos.some((a) => a.includes(n) && a.endsWith(".csv")), n).toBe(true);
    const veh = archivos.filter((a) => /vehiculo/.test(a) && a.endsWith(".csv"));
    expect(veh.length, "CSV de vehículos").toBeGreaterThan(0);
    const lin = veh.find((a) => /linea/.test(a));
    expect(lin, "CSV de líneas de vehículos").toBeTruthy();
    const filas = leerCsv(sinBom(fs.readFileSync(path.join(d, lin!), "utf8")));
    expect(filas.length - 1, "49 líneas").toBe(49);
  });
});

