// E2E de la spec 002 · Implementación en el país (/mapa).
// Escrito por el probador independiente a partir de spec.md y de la sección
// "Escenarios E2E" de plan.md, sin leer el código de producción.
// Corre contra `npm run dev` conectado al proyecto Supabase "pruebas".
// Los datos sembrados llevan el prefijo PREFIJO (configurable con E2E_PREFIJO) y se
// borran en la última prueba ("limpieza") y en afterAll si queda algo.
// Segunda corrida (2026-10-21): RF-04 cambió (CA-04.1 ajustado, CA-04.4 nuevo, E2E-23).
// Tercera corrida (2026-10-21): E2E-06 y E2E-23 recorren todos los puntos libres; se oculta
// el indicador de desarrollo de Next.js (<nextjs-portal>), que no es parte de la app.
// Cuarta corrida (2026-10-21): cada filtro es un desplegable. El botón se llama «<Filtro>
// Todas|valor|N seleccionados» y abre la casilla «Todas», un buscador y las casillas «Valor (n)».
import { test, expect, type Page, type Locator } from "@playwright/test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  admin,
  iniciarSesionEditor,
  limpiarTodo,
  PREFIJO,
  proyectoPrueba,
  sembrarAporte,
  sembrarProyectos,
  vigilarConsola,
} from "./utilidades";

const RAIZ = path.resolve(__dirname, "..", "..");
const ESTADOS = ["En operación", "En construcción", "Anunciado", "Inactivo"];
const SERVICIOS = [
  "Regulación primaria de frecuencia",
  "Inyección de energía en la noche",
  "Mercado regulado a través de los contratos de largo plazo",
];
// 008: servicio de «Detrás del medidor» (cuarto valor de la lista cerrada).
const SERVICIO_MEDIDOR = "Maximización de autoconsumo PV y respaldo";

const fmt1 = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- Datos sembrados (nombres fijos para que la siembra sea idempotente) ----------
const N = (k: string) => `${PREFIJO}002-${k}`;
const S = {
  antOp: N("antioquia-op"),
  antAnun: N("antioquia-anun"),
  boyOp: N("boyaca-op"),
  boyInac: N("boyaca-inac"),
  cincuenta: N("cincuenta"),
  sinServ: N("sin-servicios"),
  sinUbic: N("sin-ubicacion"),
  dosServ: N("dos-servicios"),
  pendiente: N("pendiente"),
};
const SIEMBRA = [
  proyectoPrueba({ nombre: S.antOp, estado: "En operación", departamento: "Antioquia", municipio: "Medellín", latitud: 6.25, longitud: -75.56, potencia_nominal_mw: 12, capacidad_maxima_mwh: 24, fpo: "2023", tipo_uso_conexion: SERVICIOS[0], punto_de_conexion_kv: 34.5 }),
  proyectoPrueba({ nombre: S.antAnun, estado: "Anunciado", departamento: "Antioquia", municipio: "Apartadó", latitud: 7.88, longitud: -76.63, potencia_nominal_mw: 20, capacidad_maxima_mwh: 40, fpo: "2028", tipo_uso_conexion: SERVICIOS[2] }),
  proyectoPrueba({ nombre: S.boyOp, estado: "En operación", departamento: "Boyacá", municipio: "Tunja", latitud: 5.53, longitud: -73.36, potencia_nominal_mw: 3, capacidad_maxima_mwh: 6, fpo: "2022", tipo_uso_conexion: SERVICIOS[1] }),
  proyectoPrueba({ nombre: S.boyInac, estado: "Inactivo", departamento: "Boyacá", municipio: "Puerto Boyacá", latitud: 5.98, longitud: -74.59, potencia_nominal_mw: 2, capacidad_maxima_mwh: 2, fpo: "2018", tipo_uso_conexion: SERVICIOS[1] }),
  proyectoPrueba({ nombre: S.cincuenta, estado: "Anunciado", departamento: "Huila", municipio: "Neiva", latitud: 2.93, longitud: -75.28, potencia_nominal_mw: 50, capacidad_maxima_mwh: 195, fpo: "2029", tipo_uso_conexion: SERVICIOS[2], punto_de_conexion_kv: 115 }),
  proyectoPrueba({ nombre: S.sinServ, estado: "En construcción", departamento: "Caldas", municipio: "Manizales", latitud: 5.07, longitud: -75.52, potencia_nominal_mw: 4, capacidad_maxima_mwh: 8, fpo: null, tipo_uso_conexion: null, punto_de_conexion_kv: null }),
  proyectoPrueba({ nombre: S.sinUbic, estado: "Anunciado", departamento: "Santander", municipio: "Bucaramanga", latitud: null, longitud: null, potencia_nominal_mw: 5, capacidad_maxima_mwh: 10, fpo: "2028", tipo_uso_conexion: SERVICIOS[2] }),
  proyectoPrueba({ nombre: S.dosServ, estado: "En operación", departamento: "Córdoba", municipio: "Montería", latitud: 8.75, longitud: -75.88, potencia_nominal_mw: 6, capacidad_maxima_mwh: 12, fpo: "2024", tipo_uso_conexion: `${SERVICIOS[0]}, ${SERVICIOS[1]}` }),
  proyectoPrueba({ nombre: S.pendiente, estado: "En operación", departamento: "Tolima", municipio: "Ibagué", latitud: 4.44, longitud: -75.23, publicacion: "Pendiente" }),
];
const APROBADOS_SEMBRADOS = Object.values(S).filter((n) => n !== S.pendiente);

type Proy = { nombre: string; estado: string; departamento: string; latitud: number | null; longitud: number | null; potencia_nominal_mw: number | null; capacidad_maxima_mwh: number | null; publicacion: string; tipo_uso_conexion: string | null };

async function aprobados(): Promise<Proy[]> {
  const { data, error } = await admin()
    .from("proyectos")
    .select("nombre,estado,departamento,latitud,longitud,potencia_nominal_mw,capacidad_maxima_mwh,publicacion,tipo_uso_conexion")
    .eq("publicacion", "Aprobado");
  if (error) throw error;
  return data as Proy[];
}

/** Siembra (si no está ya) y espera a que /mapa muestre lo sembrado (la página se revalida en minutos). */
async function asegurarSiembra(page: Page) {
  const { data } = await admin().from("proyectos").select("nombre").like("nombre", `${PREFIJO}002-%`);
  const existentes = new Set((data ?? []).map((d) => d.nombre));
  if (existentes.size !== SIEMBRA.length || !SIEMBRA.every((s) => existentes.has(s.nombre as string))) {
    await limpiarTodo();
    await sembrarProyectos(SIEMBRA);
  }
  const inicio = Date.now();
  for (;;) {
    const html = await (await page.request.get("/mapa")).text();
    if (APROBADOS_SEMBRADOS.every((n) => html.includes(n))) return Date.now() - inicio;
    if (Date.now() - inicio > 7 * 60_000) throw new Error("Lo sembrado no apareció en /mapa en 7 min");
    await page.waitForTimeout(10_000);
  }
}

// ---------- Localizadores accesibles ----------
const tabla = (page: Page) => page.getByRole("table", { name: /Proyectos/ });
const filas = (page: Page) => tabla(page).getByRole("rowgroup").nth(1).getByRole("row");
const puntos = (page: Page) => page.getByRole("button", { name: new RegExp(` · (${ESTADOS.join("|")})$`) });
const punto = (page: Page, nombre: string) => page.getByRole("button", { name: new RegExp(`^${esc(nombre)} · `) });
const tarjeta = (page: Page, nombre?: string) => (nombre ? page.getByRole("dialog", { name: nombre }) : page.getByRole("dialog"));
const grupoFiltro = (page: Page, nombre: string) => page.getByRole("group", { name: nombre, exact: true });
/** Botón del desplegable de un filtro: su nombre es «<Filtro> <Todas|valor|N seleccionados>». */
const botonFiltro = (page: Page, grupo: string) =>
  grupoFiltro(page, grupo).getByRole("button", { name: new RegExp(`^${esc(grupo)} `) });
const opcion = (page: Page, grupo: string, valor: string) =>
  grupoFiltro(page, grupo).getByRole("checkbox", { name: new RegExp(`^${esc(valor)} \\(\\d+\\)$`) });
/** Casillas de las opciones (sin «Todas»). */
const opcionesFiltro = (page: Page, grupo: string) =>
  grupoFiltro(page, grupo).getByRole("group", { name: `Opciones de ${grupo}` }).getByRole("checkbox");

/** Rediseño 007 (RF-08): los filtros cargan recogidos tras el botón «Filtros»; se despliega el panel. */
async function desplegarPanel(page: Page) {
  const panel = page.getByRole("button", { name: /^(Filtros|Ocultar filtros)/ });
  if ((await panel.getAttribute("aria-expanded")) !== "true") await panel.click();
  await expect(panel).toHaveAttribute("aria-expanded", "true");
}

/** Abre el desplegable del filtro si está cerrado. */
async function abrirFiltro(page: Page, grupo: string) {
  await desplegarPanel(page);
  const b = botonFiltro(page, grupo);
  if ((await b.getAttribute("aria-expanded")) !== "true") await b.click();
  await expect(b).toHaveAttribute("aria-expanded", "true");
  await expect(grupoFiltro(page, grupo).getByRole("searchbox", { name: `Buscar en ${grupo}` })).toBeVisible();
}

/** Cierra el desplegable con Escape. */
async function cerrarFiltro(page: Page, grupo: string) {
  const b = botonFiltro(page, grupo);
  if ((await b.getAttribute("aria-expanded")) === "true") await page.keyboard.press("Escape");
  await expect(b).not.toHaveAttribute("aria-expanded", "true");
}

/** ¿Está marcada la opción? Abre el desplegable para verla y lo vuelve a cerrar. */
async function estaMarcada(page: Page, grupo: string, valor: string) {
  await abrirFiltro(page, grupo);
  const r = await opcion(page, grupo, valor).isChecked();
  await cerrarFiltro(page, grupo);
  return r;
}

async function abrirMapa(page: Page, query = "") {
  await page.goto(`/mapa${query}`);
  await expect(tabla(page)).toBeVisible({ timeout: 60_000 });
}

async function esperarPuntos(page: Page) {
  await expect(puntos(page).first()).toBeAttached({ timeout: 60_000 });
}

async function nombresFilas(page: Page, candidatos: string[]) {
  const textos = await filas(page).allInnerTexts();
  return candidatos.filter((n) => textos.some((t) => t.includes(n))).sort();
}

async function nombresPuntos(page: Page) {
  const labels = await puntos(page).evaluateAll((es) => es.map((e) => e.getAttribute("aria-label") ?? ""));
  return labels.map((l) => l.replace(/ · [^·]+$/, "")).sort();
}

async function textoKpi(page: Page, nombre: string) {
  return (await page.getByRole("group", { name: nombre, exact: true }).ariaSnapshot()).replace(/\s+/g, " ").trim();
}

async function marcar(page: Page, grupo: string, valor: string) {
  await abrirFiltro(page, grupo);
  await opcion(page, grupo, valor).check();
  await expect(page).toHaveURL(/\?/);
  await cerrarFiltro(page, grupo);
}

function centro(b: { x: number; y: number; width: number; height: number }) {
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

/** Un punto que recibe el puntero en su centro (no tapado por otro). */
async function puntoLibre(page: Page, preferidos: string[] = []): Promise<Locator> {
  const labels = await puntos(page).evaluateAll((es) => es.map((e) => e.getAttribute("aria-label") ?? ""));
  const orden = [...labels].sort((a, b) => Number(preferidos.some((p) => b.startsWith(p))) - Number(preferidos.some((p) => a.startsWith(p))));
  for (const l of orden) {
    const loc = page.getByRole("button", { name: l, exact: true });
    await loc.scrollIntoViewIfNeeded();
    const libre = await loc.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      return x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight && document.elementFromPoint(x, y) === e;
    });
    if (libre) return loc;
  }
  throw new Error("Ningún punto libre para el puntero");
}

async function descargarCsv(page: Page) {
  const [descarga] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /^Descargar CSV/ }).click(),
  ]);
  const ruta = await descarga.path();
  return fs.readFileSync(ruta!, "utf8").replace(/^﻿/, "");
}

/** Comprueba que se abrió /aportar con tipo Corrección y el proyecto indicado. Devuelve "ok" o la diferencia. */
async function resultadoAportar(page: Page, nombre: string): Promise<string> {
  try {
    await expect(page).toHaveURL(/\/aportar/, { timeout: 30_000 });
  } catch {
    return `no navega (URL: ${page.url()})`;
  }
  const tipo = page.getByRole("combobox", { name: "Tipo de aporte" });
  await expect(tipo).toBeVisible({ timeout: 20_000 });
  const t = await tipo.evaluate((s: HTMLSelectElement) => s.selectedOptions[0]?.textContent?.trim());
  const reg = await page.getByRole("textbox", { name: /Registro que se corrige/ }).inputValue().catch(() => "(sin campo)");
  if (t !== "Corrección" || reg !== nombre) return `tipo=${t}; registro=${reg}`;
  return "ok";
}

/** Parser CSV mínimo (comillas dobles). */
function parsearCsv(texto: string): string[][] {
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
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

function registrosCsv(texto: string) {
  const f = parsearCsv(texto);
  const i = f.findIndex((r) => r[0] === "Nombre");
  const cab = f[i];
  const datos = f.slice(i + 1).filter((r) => r.length === cab.length && r[0].trim());
  return { cab, datos };
}

function soloEscritorio() {
  test.skip(test.info().project.name !== "escritorio", "Escenario de datos: solo escritorio");
}
function soloMovil() {
  test.skip(test.info().project.name !== "movil-375", "Escenario de 375 px");
}

// El indicador de `next dev` (esquina inferior izquierda) no es parte de la app: se oculta
// para que no tape puntos ni reciba clics. Los errores siguen llegando a la consola.
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

/** Etiqueta → nombre del proyecto. */
const nombreDe = (l: string) => l.replace(/ · [^·]+$/, "");

/** ¿El centro del elemento está en la ventana y recibe el puntero? Si no, qué lo tapa. */
async function quienRecibe(loc: Locator): Promise<string> {
  return loc.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return `fuera de la ventana (${Math.round(x)},${Math.round(y)})`;
    const e = document.elementFromPoint(x, y) as HTMLElement | null;
    if (e && (el === e || el.contains(e))) return "ok";
    return `tapado por ${e?.tagName}.${e?.className?.toString().slice(0, 40)}`;
  });
}

test.afterAll(async () => {
  // Red de seguridad: si la última prueba no corrió, que no quede nada sembrado.
  if (test.info().project.name === "movil-375") await limpiarTodo();
});

test.describe("002 · Implementación en el país (datos)", () => {
  test.beforeEach(async ({ page }) => {
    if (test.info().project.name !== "escritorio") return;
    test.setTimeout(10 * 60_000);
    const espera = await asegurarSiembra(page);
    test.info().annotations.push({ type: "espera-siembra-ms", description: String(espera) });
    test.setTimeout(espera + 4 * 60_000);
  });

  test("E2E-01 · CA-01.1: un punto por proyecto aprobado con coordenadas, color según la leyenda y atribución OSM", async ({ page }) => {
    soloEscritorio();
    const errores = vigilarConsola(page);
    await abrirMapa(page);
    await esperarPuntos(page);
    const ap = await aprobados();
    const conCoord = ap.filter((p) => p.latitud != null && p.longitud != null);
    await expect(puntos(page)).toHaveCount(conCoord.length);
    expect(await nombresPuntos(page)).toEqual(conCoord.map((p) => p.nombre).sort());

    // Leyenda en texto con los cuatro estados.
    const leyenda = page.getByRole("list", { name: "Estados" });
    await expect(leyenda.getByRole("listitem")).toHaveText(ESTADOS);
    const colorLeyenda: Record<string, string> = {};
    for (const e of ESTADOS) {
      colorLeyenda[e] = await leyenda.getByRole("listitem").filter({ hasText: e }).locator("span").first()
        .evaluate((s) => getComputedStyle(s).backgroundColor);
    }
    expect(new Set(Object.values(colorLeyenda)).size, "cada estado con su color").toBe(4);
    for (const p of conCoord) {
      const color = await punto(page, p.nombre).evaluate((b) => getComputedStyle(b).backgroundColor);
      expect(color, `color del punto de ${p.nombre} (${p.estado})`).toBe(colorLeyenda[p.estado]);
    }

    // Ubicación: el orden relativo de los puntos respeta latitud (norte arriba) y longitud (este a la derecha).
    const pos: Record<string, { x: number; y: number }> = {};
    for (const p of conCoord) pos[p.nombre] = centro((await punto(page, p.nombre).boundingBox())!);
    for (const a of conCoord) for (const b of conCoord) {
      if (a.latitud! - b.latitud! > 0.3) expect(pos[a.nombre].y, `${a.nombre} al norte de ${b.nombre}`).toBeLessThan(pos[b.nombre].y);
      if (a.longitud! - b.longitud! > 0.3) expect(pos[a.nombre].x, `${a.nombre} al este de ${b.nombre}`).toBeGreaterThan(pos[b.nombre].x);
    }
    await expect(page.getByText(/OpenStreetMap/).first()).toBeVisible();
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("E2E-02 · CA-01.2: un proyecto Pendiente con coordenadas no aparece ni en el mapa ni en la tabla", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await esperarPuntos(page);
    await expect(filas(page).filter({ hasText: S.cincuenta })).toHaveCount(1); // lo sembrado ya se ve
    await expect(filas(page).filter({ hasText: S.pendiente })).toHaveCount(0);
    await expect(punto(page, S.pendiente)).toHaveCount(0);
    expect(await page.content()).not.toContain(S.pendiente);
  });

  test("E2E-03 · CA-02.1: ordenar por Potencia [MW] de mayor a menor deja primero la mayor; coma decimal", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    const ap = await aprobados();
    const max = Math.max(...ap.map((p) => Number(p.potencia_nominal_mw ?? 0)));
    const cab = tabla(page).getByRole("columnheader", { name: "Potencia [MW]" });
    for (let i = 0; i < 3 && (await cab.getAttribute("aria-sort")) !== "descending"; i++) {
      await cab.getByRole("button").click();
    }
    await expect(cab).toHaveAttribute("aria-sort", "descending");
    const col = (await tabla(page).getByRole("columnheader").allInnerTexts()).findIndex((t) => t.includes("Potencia [MW]"));
    const valores = await filas(page).evaluateAll((rs, c) => rs.map((r) => (r.children[c] as HTMLElement).innerText.trim()), col);
    expect(valores[0]).toBe(fmt1(max));
    for (const v of valores.filter(Boolean)) expect(v, "coma decimal con un decimal").toMatch(/^\d{1,3}(\.\d{3})*,\d$/);
    const numeros = valores.filter(Boolean).map((v) => Number(v.replace(/\./g, "").replace(",", ".")));
    expect(numeros, "orden descendente").toEqual([...numeros].sort((a, b) => b - a));
  });

  test("E2E-04 · CA-03.1: un aprobado sin coordenadas está en la tabla con «sin ubicación en el mapa» y sin punto", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await esperarPuntos(page);
    const fila = filas(page).filter({ hasText: S.sinUbic });
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText(/sin ubicación en el mapa/i);
    await expect(punto(page, S.sinUbic)).toHaveCount(0);
    // Las filas con ubicación no llevan la marca.
    await expect(filas(page).filter({ hasText: S.cincuenta })).not.toContainText(/sin ubicación/i);
  });

  test("E2E-05 · CA-04.1: al pasar el mouse sobre un punto se abre su tarjeta, sigue abierta sobre el punto y se cierra al salir sin pasar a la tarjeta", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await esperarPuntos(page);
    const p = await puntoLibre(page, [S.cincuenta]);
    const nombre = (await p.getAttribute("aria-label"))!.replace(/ · [^·]+$/, "");
    await p.hover();
    await expect(tarjeta(page, nombre)).toBeVisible();
    // Sigue abierta mientras el puntero esté sobre el punto.
    await page.waitForTimeout(1500);
    await expect(tarjeta(page, nombre), "abierta mientras el puntero sigue en el punto").toBeVisible();
    // Salir del punto hasta un lugar fuera del punto y de la tarjeta, por el camino más corto.
    // Si la tarjeta no cubre el punto, se sale hacia el lado contrario a ella (sin pasar por ella).
    const bp = (await p.boundingBox())!;
    const bt = (await tarjeta(page, nombre).boundingBox())!;
    const cp = centro(bp);
    const cubre = cp.x > bt.x && cp.x < bt.x + bt.width && cp.y > bt.y && cp.y < bt.y + bt.height;
    let destino: { x: number; y: number };
    if (cubre) {
      const opciones = [
        { x: bt.x - 30, y: cp.y }, { x: bt.x + bt.width + 30, y: cp.y },
        { x: cp.x, y: bt.y - 30 }, { x: cp.x, y: bt.y + bt.height + 30 },
      ].filter((o) => o.x > 0 && o.y > 0 && o.x < 1280 && o.y < 720);
      opciones.sort((m, n) => Math.hypot(m.x - cp.x, m.y - cp.y) - Math.hypot(n.x - cp.x, n.y - cp.y));
      destino = opciones[0];
    } else {
      const ct = centro(bt);
      const dx = cp.x - ct.x;
      const dy = cp.y - ct.y;
      const n = Math.hypot(dx, dy) || 1;
      destino = { x: cp.x + (dx / n) * 60, y: cp.y + (dy / n) * 60 };
    }
    test.info().annotations.push({ type: "salida", description: `punto ${cp.x.toFixed(0)},${cp.y.toFixed(0)} · tarjeta x ${bt.x.toFixed(0)}–${(bt.x + bt.width).toFixed(0)}, y ${bt.y.toFixed(0)}–${(bt.y + bt.height).toFixed(0)} · la tarjeta cubre el punto: ${cubre} · destino ${destino.x.toFixed(0)},${destino.y.toFixed(0)}` });
    await page.mouse.move(destino.x, destino.y, { steps: 6 });
    await expect(tarjeta(page, nombre)).toBeHidden();
    // Observación (RF-04, sin CA propio): Escape con la tarjeta abierta por el mouse.
    await p.hover();
    await expect(tarjeta(page, nombre)).toBeVisible();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    test.info().annotations.push({ type: "escape-con-mouse", description: (await tarjeta(page, nombre).isVisible()) ? "no cierra" : "cierra" });
  });

  test("E2E-07 · CA-04.3: con Tab se llega a un punto, se abre su tarjeta y Escape la cierra", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await esperarPuntos(page);
    await page.getByRole("button", { name: /^Descargar CSV/ }).focus();
    let nombre = "";
    const recorrido: string[] = [];
    for (let i = 0; i < 25 && !nombre; i++) {
      await page.keyboard.press("Tab");
      const etiqueta = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement;
        return `${a.tagName}|${a.getAttribute("aria-label") ?? a.innerText?.slice(0, 40) ?? ""}`;
      });
      recorrido.push(etiqueta);
      const m = etiqueta.match(/^BUTTON\|(.+) · (En operación|En construcción|Anunciado|Inactivo)$/);
      if (m) nombre = m[1];
    }
    test.info().annotations.push({ type: "recorrido-tab", description: recorrido.join(" → ") });
    expect(nombre, "se llega a un punto con Tab").not.toBe("");
    await expect(tarjeta(page, nombre)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tarjeta(page, nombre)).toBeHidden();
    // O-1: elementos con foco dentro de contenedores aria-hidden y rótulo del botón de atribución.
    const o1 = await page.evaluate(() => {
      const sel = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const ocultos = [...document.querySelectorAll('[aria-hidden="true"]')].flatMap((c) => [...c.querySelectorAll<HTMLElement>(sel)]);
      const atrib = [...document.querySelectorAll<HTMLElement>("button")].filter((b) => /attribution|atribuci/i.test(b.getAttribute("aria-label") ?? b.title ?? ""));
      return {
        enfocablesOcultos: ocultos.map((e) => `${e.tagName}|${e.getAttribute("aria-label") ?? e.textContent?.trim().slice(0, 30)}`),
        botonAtribucion: atrib.map((b) => b.getAttribute("aria-label") ?? b.title),
      };
    });
    test.info().annotations.push({ type: "O-1", description: JSON.stringify(o1) });
    // RF-04: «Cerrar» también cierra (anotación). Se saca el foco del punto antes de volver a él.
    await page.getByRole("button", { name: /^Descargar CSV/ }).focus();
    await punto(page, nombre).focus();
    await expect(tarjeta(page, nombre)).toBeVisible();
    const cerrar = tarjeta(page, nombre).getByRole("button", { name: "Cerrar" });
    let cierra = "sin botón «Cerrar»";
    if (await cerrar.count()) {
      await cerrar.click();
      cierra = (await tarjeta(page, nombre).isVisible()) ? "no cierra" : "cierra";
    }
    test.info().annotations.push({ type: "boton-cerrar", description: cierra });
  });

  test("E2E-08 · CA-05.1: tarjeta de 50 MW y 195 MWh muestra 50,0 MW, 195,0 MWh y 3,9 h, sin enlaces de fuente", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await esperarPuntos(page);
    await punto(page, S.cincuenta).focus();
    const t = tarjeta(page, S.cincuenta);
    await expect(t).toBeVisible();
    await expect(t).toContainText("50,0 MW");
    await expect(t).toContainText("195,0 MWh");
    await expect(t).toContainText("3,9 h");
    // RF-05: campos de la tarjeta.
    for (const campo of ["Operador", "Estado", "Tecnología", "Año de FPO", "Servicios", "Punto de conexión"]) {
      await expect.soft(t, `campo ${campo}`).toContainText(campo);
    }
    await expect.soft(t).toContainText("Neiva");
    await expect.soft(t).toContainText("Huila");
    await expect.soft(t).toContainText(/115(,0)? kV/);
    const enlaces = await t.getByRole("link").evaluateAll((as) => as.map((a) => `${a.textContent?.trim()}|${a.getAttribute("href")}`));
    expect(enlaces.filter((e) => !e.startsWith("Proponer corrección|")), "sin enlaces de fuente").toEqual([]);
    await expect(t).not.toContainText("ejemplo.co");
  });

  test("E2E-09 · CA-05.2: proyecto sin servicios → «Servicios: Sin dato» y sin campos técnicos vacíos", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await esperarPuntos(page);
    await punto(page, S.sinServ).focus();
    const t = tarjeta(page, S.sinServ);
    await expect(t).toBeVisible();
    await expect(t.getByRole("listitem").filter({ hasText: /^Servicios/ })).toHaveText(/^Servicios:\s*Sin dato$/);
    await expect(t).not.toContainText("Punto de conexión");
    await expect(t).not.toContainText("Año de FPO");
    const items = await t.getByRole("listitem").allInnerTexts();
    for (const it of items) expect(it.trim(), "ningún campo vacío").not.toMatch(/:\s*(—|-)?$/);
  });

  test("E2E-10 · CA-06.1: «Proponer corrección» abre /aportar con tipo Corrección y el proyecto indicados", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await esperarPuntos(page);
    // Tarjeta abierta desde la tabla (RF-07), que queda abierta.
    await page.getByRole("button", { name: `Ver ${S.cincuenta} en el mapa` }).click();
    await tarjeta(page, S.cincuenta).getByRole("link", { name: "Proponer corrección" }).click();
    // En `next dev` con poca memoria la navegación a /aportar tarda hasta ~10 s.
    await expect(page).toHaveURL(/\/aportar/, { timeout: 30_000 });
    const tipo = page.getByRole("combobox", { name: "Tipo de aporte" });
    await expect(tipo).toBeVisible();
    expect(await tipo.evaluate((s: HTMLSelectElement) => s.selectedOptions[0]?.textContent?.trim())).toBe("Corrección");
    await expect(page.getByRole("textbox", { name: /Registro que se corrige/ })).toHaveValue(S.cincuenta);
  });

  test("E2E-23 · CA-04.4: «Proponer corrección» se pulsa desde la tarjeta del punto con el mouse y con el teclado", async ({ page }) => {
    soloEscritorio();
    test.setTimeout(10 * 60_000);
    const resultados: Record<string, string> = {};
    // 1) Mouse, en cada punto libre: pasar al punto y mover el puntero en línea recta hasta
    //    el enlace de su tarjeta. Se anota si el enlace sigue visible y recibe el puntero.
    await abrirMapa(page);
    await esperarPuntos(page);
    const etiquetas = await puntos(page).evaluateAll((es) => es.map((e) => e.getAttribute("aria-label") ?? ""));
    const porPunto: string[] = [];
    let candidato = "";
    for (const l of etiquetas) {
      const n = nombreDe(l);
      await page.mouse.move(2, 2);
      // Fuera del punto y de la tarjeta, la anterior debe cerrarse (RF-04).
      try { await expect(tarjeta(page)).toHaveCount(0, { timeout: 3000 }); }
      catch { porPunto.push(`(la tarjeta anterior sigue abierta con el puntero fuera)`); await page.keyboard.press("Escape"); }
      const loc = page.getByRole("button", { name: l, exact: true });
      await loc.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(150);
      const libre = await quienRecibe(loc);
      if (libre !== "ok") { porPunto.push(`${n}: omitido, punto ${libre}`); continue; }
      const cp = centro((await loc.boundingBox())!);
      await page.mouse.move(cp.x, cp.y, { steps: 3 });
      const t = tarjeta(page, n);
      try { await expect(t).toBeVisible({ timeout: 3000 }); } catch { porPunto.push(`${n}: la tarjeta no abre`); continue; }
      const enlace = t.getByRole("link", { name: "Proponer corrección" });
      const caja = (await enlace.boundingBox())!;
      const destino = centro(caja);
      let cerradaEn = 0;
      const pasos = 20;
      for (let i = 1; i <= pasos; i++) {
        await page.mouse.move(cp.x + ((destino.x - cp.x) * i) / pasos, cp.y + ((destino.y - cp.y) * i) / pasos);
        if (!(await t.isVisible())) { cerradaEn = i; break; }
      }
      let r: string;
      if (cerradaEn) r = `la tarjeta se cierra en el paso ${cerradaEn}/${pasos}`;
      else r = await quienRecibe(enlace);
      porPunto.push(`${n}: ${r}`);
      if (r === "ok") {
        if (!candidato) candidato = n;
      } else {
        await page.screenshot({ path: test.info().outputPath(`raton-${porPunto.length}.png`) });
      }
    }
    test.info().annotations.push({ type: "mouse-por-punto", description: porPunto.join("; ") });
    const fallasMouse = porPunto.filter((x) => !/: ok$/.test(x) && !/: omitido/.test(x));
    if (!candidato) resultados.mouse = "en ningún punto se llega al enlace";
    else {
      // Pulsar el enlace con el mouse en el primer punto en que se llega a él.
      await page.mouse.move(2, 2);
      await expect(tarjeta(page)).toHaveCount(0, { timeout: 3000 }).catch(() => page.keyboard.press("Escape"));
      const loc = punto(page, candidato);
      await loc.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(150);
      const cp = centro((await loc.boundingBox())!);
      await page.mouse.move(cp.x, cp.y, { steps: 3 });
      const enlace = tarjeta(page, candidato).getByRole("link", { name: "Proponer corrección" });
      await expect(enlace).toBeVisible();
      const d = centro((await enlace.boundingBox())!);
      await page.mouse.move(d.x, d.y, { steps: 20 });
      await page.mouse.down();
      await page.mouse.up();
      resultados.mouse = await resultadoAportar(page, candidato);
    }
    resultados.mouseTodosLosPuntos = fallasMouse.length ? fallasMouse.join("; ") : "ok";

    // 3) Teclado: Tab hasta un punto, Enter, Tab hasta el enlace, Enter.
    await abrirMapa(page);
    await esperarPuntos(page);
    await page.getByRole("button", { name: /^Descargar CSV/ }).focus();
    let nombreT = "";
    for (let i = 0; i < 25 && !nombreT; i++) {
      await page.keyboard.press("Tab");
      const l = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
      const m = l.match(/^(.+) · (En operación|En construcción|Anunciado|Inactivo)$/);
      if (m) nombreT = m[1];
    }
    if (!nombreT) resultados.teclado = "no se llega a un punto con Tab";
    else {
      await page.keyboard.press("Enter");
      let alcanzado = false;
      const recorrido: string[] = [];
      for (let i = 0; i < 6 && !alcanzado; i++) {
        await page.keyboard.press("Tab");
        const a = await page.evaluate(() => {
          const e = document.activeElement as HTMLElement;
          return `${e.tagName}|${e.getAttribute("aria-label") ?? e.innerText?.trim().slice(0, 40)}`;
        });
        recorrido.push(a);
        alcanzado = a === "A|Proponer corrección";
      }
      test.info().annotations.push({ type: "recorrido-teclado", description: `${nombreT} → ${recorrido.join(" → ")}` });
      if (!alcanzado) resultados.teclado = `no alcanza el enlace (foco en: ${recorrido[recorrido.length - 1]})`;
      else {
        await page.keyboard.press("Enter");
        resultados.teclado = await resultadoAportar(page, nombreT);
      }
    }
    test.info().annotations.push({ type: "resultados", description: JSON.stringify(resultados) });
    expect.soft(resultados.mouse, "mouse (pulsar y navegar)").toBe("ok");
    expect.soft(resultados.mouseTodosLosPuntos, "mouse: el enlace se alcanza en todos los puntos libres").toBe("ok");
    expect.soft(resultados.teclado, "teclado").toBe("ok");
  });

  test("E2E-11 · CA-07.1: elegir una fila centra el mapa en el proyecto y deja su tarjeta abierta", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await esperarPuntos(page);
    await page.getByRole("button", { name: `Ver ${S.cincuenta} en el mapa` }).click();
    await expect(tarjeta(page, S.cincuenta)).toBeVisible();
    await page.waitForTimeout(3000); // fin de la animación
    await expect(tarjeta(page, S.cincuenta)).toBeVisible();
    const mapa = (await page.locator(".maplibregl-map").boundingBox())!;
    const p = (await punto(page, S.cincuenta).boundingBox())!;
    const dx = Math.abs(centro(p).x - centro(mapa).x);
    const dy = Math.abs(centro(p).y - centro(mapa).y);
    test.info().annotations.push({ type: "desfase-centro-px", description: `${dx.toFixed(0)}, ${dy.toFixed(0)}` });
    expect(dx, "centrado en x").toBeLessThan(40);
    expect(dy, "centrado en y").toBeLessThan(40);
    // Un proyecto sin ubicación se informa.
    const filaSin = filas(page).filter({ hasText: S.sinUbic });
    await filaSin.getByRole("button").first().click().catch(() => undefined);
    await expect.soft(page.getByText(/sin ubicación/i).first(), "RF-07: se informa que no tiene ubicación").toBeVisible();
  });

  test("E2E-12 · CA-08.1: dos departamentos + En operación deja solo los en operación de esos departamentos", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await marcar(page, "Departamento", "Antioquia");
    await marcar(page, "Departamento", "Boyacá");
    await marcar(page, "Estado", "En operación");
    const ap = await aprobados();
    const esperados = ap.filter((p) => ["Antioquia", "Boyacá"].includes(p.departamento) && p.estado === "En operación").map((p) => p.nombre).sort();
    expect(esperados).toEqual([S.antOp, S.boyOp].sort());
    await expect(filas(page)).toHaveCount(esperados.length);
    expect(await nombresFilas(page, ap.map((p) => p.nombre))).toEqual(esperados);
    // El botón de cada desplegable resume lo elegido.
    await expect.soft(botonFiltro(page, "Departamento")).toHaveAccessibleName("Departamento 2 seleccionados");
    await expect.soft(botonFiltro(page, "Estado")).toHaveAccessibleName("Estado En operación");
  });

  test("E2E-13 · CA-08.2: con un departamento elegido, el filtro de municipio solo lista los suyos con su conteo", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await marcar(page, "Departamento", "Antioquia");
    await abrirFiltro(page, "Municipio");
    const muni = opcionesFiltro(page, "Municipio");
    await expect(muni).toHaveCount(2);
    await expect(muni.nth(0)).toBeVisible();
    const nombres: string[] = [];
    for (let i = 0; i < (await muni.count()); i++) {
      nombres.push((await muni.nth(i).ariaSnapshot()).replace(/^- checkbox "([^"]*)"[\s\S]*$/, "$1"));
    }
    expect(nombres.sort()).toEqual(["Apartadó (1)", "Medellín (1)"]);
    // Comportamiento del desplegable (no es un CA): buscador, Escape y clic afuera.
    const extra: Record<string, string> = {};
    const buscador = grupoFiltro(page, "Municipio").getByRole("searchbox", { name: "Buscar en Municipio" });
    await buscador.fill("Mede");
    await page.waitForTimeout(300);
    extra.buscar = JSON.stringify(await opcionesFiltro(page, "Municipio").evaluateAll((es) => es.filter((e) => (e as HTMLElement).checkVisibility()).map((e) => e.getAttribute("aria-label") ?? (e as HTMLInputElement).labels?.[0]?.innerText)));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    extra.escape = String(await botonFiltro(page, "Municipio").getAttribute("aria-expanded"));
    await abrirFiltro(page, "Municipio");
    await page.getByRole("heading", { name: "Implementación de SAEB en Colombia", level: 1 }).click(); // título cambiado por el usuario (2026-10-23)
    await page.waitForTimeout(300);
    extra.clicAfuera = String(await botonFiltro(page, "Municipio").getAttribute("aria-expanded"));
    test.info().annotations.push({ type: "desplegable", description: JSON.stringify(extra) });
    expect.soft(extra.escape, "Escape cierra el desplegable").not.toBe("true");
    expect.soft(extra.clicAfuera, "un clic afuera cierra el desplegable").not.toBe("true");
  });

  test("E2E-14 · CA-09.1: mapa, tabla, KPI «proyectos según filtros» y CSV tienen los mismos proyectos", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await esperarPuntos(page);
    await marcar(page, "Departamento", "Antioquia");
    await marcar(page, "Departamento", "Boyacá");
    const ap = await aprobados();
    const esperados = ap.filter((p) => ["Antioquia", "Boyacá"].includes(p.departamento)).map((p) => p.nombre).sort();
    await expect(puntos(page)).toHaveCount(esperados.length);
    const enMapa = await nombresPuntos(page);
    const enTabla = await nombresFilas(page, ap.map((p) => p.nombre));
    await expect(filas(page)).toHaveCount(esperados.length);
    const kpi = await textoKpi(page, "Proyectos identificados");
    const csv = registrosCsv(await descargarCsv(page)).datos.map((r) => r[0]).sort();
    test.info().annotations.push({ type: "comparacion", description: JSON.stringify({ enMapa, enTabla, kpi, csv }) });
    expect(enMapa).toEqual(esperados);
    expect(enTabla).toEqual(esperados);
    expect(kpi).toMatch(new RegExp(`\\b${esperados.length}\\b`));
    expect(csv).toEqual(esperados);
  });

  test("E2E-15 · CA-10.1: la URL de una vista filtrada reproduce los mismos filtros y resultado en otra pestaña", async ({ page, context }) => {
    soloEscritorio();
    await abrirMapa(page);
    await marcar(page, "Departamento", "Antioquia");
    await marcar(page, "Estado", "Anunciado");
    await marcar(page, "Departamento", "Huila");
    const url = page.url();
    const ap = await aprobados();
    const resultado = await nombresFilas(page, ap.map((p) => p.nombre));
    expect(resultado).toEqual([S.antAnun, S.cincuenta].sort());
    const otra = await context.newPage();
    await otra.goto(url);
    await expect(tabla(otra)).toBeVisible();
    await desplegarPanel(otra); // 007: el panel carga recogido
    await expect(botonFiltro(otra, "Departamento")).toHaveAccessibleName("Departamento 2 seleccionados");
    await expect(botonFiltro(otra, "Estado")).toHaveAccessibleName("Estado Anunciado");
    for (const [g, v] of [["Departamento", "Antioquia"], ["Departamento", "Huila"], ["Estado", "Anunciado"]]) {
      expect(await estaMarcada(otra, g, v), `${g}: ${v}`).toBe(true);
    }
    expect(await estaMarcada(otra, "Estado", "En operación")).toBe(false);
    await expect(filas(otra)).toHaveCount(resultado.length);
    expect(await nombresFilas(otra, ap.map((p) => p.nombre))).toEqual(resultado);
    await otra.close();
  });

  test("E2E-16 · CA-10.2: «Limpiar filtros» deja la URL sin filtros y muestra todos los aprobados", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page, "?departamento=Antioquia&estado=Anunciado");
    expect(await estaMarcada(page, "Departamento", "Antioquia")).toBe(true);
    await expect(botonFiltro(page, "Estado")).toHaveAccessibleName("Estado Anunciado");
    await page.getByRole("button", { name: "Limpiar filtros" }).click();
    await expect(page).toHaveURL(/\/mapa$/);
    const ap = await aprobados();
    await expect(filas(page)).toHaveCount(ap.length);
    // Ningún filtro queda activo: cada botón dice «Todas» y, al abrirlo, solo «Todas» está marcada.
    for (const g of ["Estado", "Departamento", "Municipio", "Servicios", "Operador", "Tecnología", "Año de FPO"]) {
      await expect(botonFiltro(page, g)).toHaveAccessibleName(`${g} Todas`);
    }
    for (const g of ["Estado", "Departamento"]) {
      await abrirFiltro(page, g);
      await expect(opcionesFiltro(page, g).and(page.getByRole("checkbox", { checked: true }))).toHaveCount(0);
      await expect(grupoFiltro(page, g).getByRole("checkbox", { name: "Todas", exact: true })).toBeChecked();
      await cerrarFiltro(page, g);
    }
  });

  test("E2E-17 · CA-11.1: con solo Anunciado, «Instalado» no cambia y «según filtros» suma solo anunciados", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    const ap = await aprobados();
    const op = ap.filter((p) => p.estado === "En operación");
    const anun = ap.filter((p) => p.estado === "Anunciado");
    const suma = (l: Proy[], k: "potencia_nominal_mw" | "capacidad_maxima_mwh") => l.reduce((s, p) => s + Number(p[k] ?? 0), 0);
    const mwInst = page.getByRole("group", { name: "Potencia instalada [MW]" });
    const mwhInst = page.getByRole("group", { name: "Energía instalada [MWh]" });
    await expect(mwInst).toContainText(`${fmt1(suma(op, "potencia_nominal_mw"))} MW`);
    await expect(mwhInst).toContainText(`${fmt1(suma(op, "capacidad_maxima_mwh"))} MWh`);
    const antes = [await textoKpi(page, "Potencia instalada [MW]"), await textoKpi(page, "Energía instalada [MWh]")];
    await marcar(page, "Estado", "Anunciado");
    await expect(page.getByRole("group", { name: "Proyectos identificados" })).toContainText(String(anun.length));
    await expect(page.getByRole("group", { name: "Potencia total proyectada" })).toContainText(`${fmt1(suma(anun, "potencia_nominal_mw"))} MW`);
    await expect(page.getByRole("group", { name: "Capacidad energética total proyectada" })).toContainText(`${fmt1(suma(anun, "capacidad_maxima_mwh"))} MWh`);
    await expect(page.getByRole("region", { name: "Según filtros (todos los estados)" })).toBeVisible();
    expect([await textoKpi(page, "Potencia instalada [MW]"), await textoKpi(page, "Energía instalada [MWh]")]).toEqual(antes);
    // MW y MWh en tarjetas distintas.
    for (const g of ["Potencia instalada [MW]", "Potencia total proyectada"]) {
      expect(await textoKpi(page, g)).not.toMatch(/MWh/);
    }
    for (const g of ["Energía instalada [MWh]", "Capacidad energética total proyectada"]) {
      expect(await textoKpi(page, g)).not.toMatch(/MW(?!h)/);
    }
  });

  test("E2E-18 · CA-12.1: filtros sin resultados → mapa sin puntos, mensaje en la tabla y KPI filtrados en 0", async ({ page }) => {
    soloEscritorio();
    // Las opciones se reducen según los demás filtros, así que la combinación vacía se aplica por URL (RF-10).
    await abrirMapa(page);
    await marcar(page, "Departamento", "Antioquia");
    await abrirFiltro(page, "Estado");
    const estados = await opcionesFiltro(page, "Estado").evaluateAll((es) => es.map((e) => e.getAttribute("aria-label") ?? (e as HTMLInputElement).labels?.[0]?.innerText?.replace(/\s+/g, " ").trim()));
    await cerrarFiltro(page, "Estado");
    test.info().annotations.push({ type: "estados-ofrecidos-con-Antioquia", description: JSON.stringify(estados) });
    await abrirMapa(page, "?departamento=Antioquia&estado=Inactivo");
    await expect(page.getByText("Ningún proyecto cumple estos filtros")).toBeVisible();
    await expect(puntos(page)).toHaveCount(0);
    await expect(filas(page).filter({ hasText: PREFIJO })).toHaveCount(0);
    expect(await textoKpi(page, "Proyectos identificados")).toMatch(/text: "?0"?$/);
    expect(await textoKpi(page, "Potencia total proyectada")).toMatch(/\b0(,0)? MW\b/);
    expect(await textoKpi(page, "Capacidad energética total proyectada")).toMatch(/\b0(,0)? MWh\b/);
    // Observación (no bloqueante): ¿se ve el filtro activo «Inactivo»?
    await desplegarPanel(page); // 007: el panel carga recogido
    const boton = await botonFiltro(page, "Estado").innerText();
    await abrirFiltro(page, "Estado");
    const visible = await opcion(page, "Estado", "Inactivo").isVisible().catch(() => false);
    test.info().annotations.push({ type: "filtro-Inactivo-visible-y-marcado", description: `botón «${boton}»; casilla visible y marcada: ${visible && (await opcion(page, "Estado", "Inactivo").isChecked())}` });
    await cerrarFiltro(page, "Estado");
  });

  test("E2E-19 · CA-13.1: el CSV de la vista filtrada trae solo esos proyectos, Fuente, CC BY 4.0 y ningún correo", async ({ page }) => {
    soloEscritorio();
    await abrirMapa(page);
    await marcar(page, "Departamento", "Boyacá");
    const texto = await descargarCsv(page);
    const { cab, datos } = registrosCsv(texto);
    expect(cab).toContain("Fuente");
    expect(datos.map((r) => r[0]).sort()).toEqual([S.boyInac, S.boyOp].sort());
    const iFuente = cab.indexOf("Fuente");
    for (const r of datos) expect(r[iFuente], "cada fila con su fuente").toMatch(/^https?:\/\//);
    expect(texto).toMatch(/CC BY 4\.0/);
    expect(texto).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });

  test("E2E-20 · CA-14.1: un servicio fuera de la lista se rechaza con el mismo mensaje en aprobación, base, importación y validador", async ({ page, context }) => {
    soloEscritorio();
    test.setTimeout(5 * 60_000);
    const mensajes: Record<string, string> = {};
    const nucleo = (m: string) => {
      const i = m.search(/'?Tipo uso\/conexión/);
      return (i >= 0 ? m.slice(i) : m).trim();
    };

    // 1) Aprobación: las casillas solo ofrecen los 3 valores; una petición manipulada se rechaza.
    const a = await sembrarAporte({
      tipo: "Proyecto nuevo",
      descripcion: `${PREFIJO}002-servicio-x`,
      datos: { ...proyectoPrueba({ nombre: N("aporte-servicio-x"), tipo_uso_conexion: "Servicio X" }), publicacion: undefined },
      fuente: "https://ejemplo.co/servicio-x",
      origen: "usuario",
    });
    await iniciarSesionEditor(context);
    await page.goto(`/admin/${a.id}`);
    const form = page.getByRole("form", { name: "Aprobar aporte" });
    const casillas = form.getByRole("group", { name: /Servicios|Tipo uso\/conexión/ }).getByRole("checkbox");
    // 008: la lista cerrada gana «Maximización de autoconsumo PV y respaldo» (servicio de «Detrás del medidor»).
    await expect(casillas).toHaveCount(SERVICIOS.length + 1);
    const rotulos = await casillas.evaluateAll((es) => es.map((e) => (e as HTMLInputElement).labels?.[0]?.textContent?.trim() ?? e.getAttribute("aria-label")));
    expect(rotulos).toEqual([...SERVICIOS, SERVICIO_MEDIDOR]);
    // Sin marcar nada, la aprobación no muestra el valor propuesto (observación).
    const marcadas = await casillas.evaluateAll((es) => es.filter((e) => (e as HTMLInputElement).checked).length);
    test.info().annotations.push({ type: "casillas-marcadas-con-Servicio-X-propuesto", description: String(marcadas) });
    const nombreGrupo = await form.getByRole("group", { name: /Servicios|Tipo uso\/conexión/ }).evaluate((g) => g.getAttribute("aria-label") ?? g.querySelector("legend")?.textContent?.trim() ?? "");
    const avisa = (await form.innerText()).includes("Servicio X");
    test.info().annotations.push({ type: "O-3", description: JSON.stringify({ nombreGrupo, avisaValorPropuesto: avisa }) });
    // Petición manipulada: se marca una casilla y se reemplaza su valor por «Servicio X» en el envío.
    await page.waitForLoadState("networkidle");
    await casillas.first().check();
    let manipulada = false;
    await page.route("**/admin/**", async (route) => {
      const req = route.request();
      const cuerpo = req.postDataBuffer();
      if (req.method() === "POST" && cuerpo && cuerpo.toString("utf8").includes(SERVICIOS[0])) {
        manipulada = true;
        const nuevo = cuerpo.toString("utf8").replace(SERVICIOS[0], "Servicio X");
        await route.continue({ postData: Buffer.from(nuevo, "utf8") });
      } else await route.continue();
    });
    await page.getByRole("button", { name: "Aprobar y publicar" }).click();
    await expect.poll(() => manipulada, { message: "el envío llevó «Servicio X»" }).toBe(true);
    const alerta = form.getByRole("alert");
    await expect(alerta).toContainText("Servicio X", { timeout: 90_000 }); // la acción del servidor tarda en `next dev`
    mensajes.aprobacion = nucleo(await alerta.innerText());
    const { data: ap } = await admin().from("aportes").select("publicacion").eq("id", a.id).single();
    expect(ap!.publicacion).toBe("Pendiente");

    // 2) Base de datos.
    const db = await admin().from("proyectos").insert(proyectoPrueba({ nombre: N("db-servicio-x"), tipo_uso_conexion: "Servicio X" }));
    expect(db.error, "la base rechaza el valor").not.toBeNull();
    mensajes.baseDeDatos = nucleo(db.error!.message);

    // 3) Importación (simulada).
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-002-"));
    const csvImp = path.join(tmp, "servicio-x.csv");
    const prep = spawnSync("python", [path.join(__dirname, "csv_002.py"), path.join(RAIZ, "datos", "proyectos.csv"), csvImp, PREFIJO, "Servicio X"], { encoding: "utf8" });
    expect(prep.status, prep.stderr).toBe(0);
    const r = spawnSync("python", ["scripts/importar.py", "--entorno", "pruebas", "--csv", csvImp, "--simular"], { cwd: RAIZ, encoding: "utf8", timeout: 180_000 });
    expect(r.status, "la importación termina con error").not.toBe(0);
    mensajes.importacion = nucleo((r.stdout + r.stderr).split(/\r?\n/).find((l) => l.includes("Servicio X")) ?? "");

    // 4) Validador de datos/ (sobre una copia).
    const copia = path.join(tmp, "datos");
    fs.cpSync(path.join(RAIZ, "datos"), copia, { recursive: true });
    const prep2 = spawnSync("python", [path.join(__dirname, "csv_002.py"), path.join(RAIZ, "datos", "proyectos.csv"), path.join(copia, "proyectos.csv"), "", "Servicio X", "todas"], { encoding: "utf8" });
    expect(prep2.status, prep2.stderr).toBe(0);
    const v = spawnSync("python", ["scripts/validar_datos.py", "--dir", copia], { cwd: RAIZ, encoding: "utf8", timeout: 60_000 });
    expect(v.status, "el validador sale con 1").toBe(1);
    mensajes.validador = nucleo((v.stdout + v.stderr).split(/\r?\n/).find((l) => l.includes("Servicio X")) ?? "");
    fs.rmSync(tmp, { recursive: true, force: true });

    test.info().annotations.push({ type: "mensajes", description: JSON.stringify(mensajes) });
    // 008: hasta que el usuario aplique la 0007 en «pruebas», el disparador lista solo los 3 servicios
    // de antes; la comparación entre vías queda bloqueada (no se da por buena).
    test.skip(
      !mensajes.baseDeDatos.includes(SERVICIO_MEDIDOR),
      "BLOQUEADO (0007): el disparador de «pruebas» aún no lista «Maximización de autoconsumo PV y respaldo»",
    );
    for (const [via, m] of Object.entries(mensajes)) {
      for (const s of [...SERVICIOS, SERVICIO_MEDIDOR]) expect.soft(m, `${via} lista «${s}»`).toContain(s);
    }
    expect.soft(mensajes.aprobacion, "aprobación = base de datos").toBe(mensajes.baseDeDatos);
    expect.soft(mensajes.importacion, "importación = base de datos").toBe(mensajes.baseDeDatos);
    expect.soft(mensajes.validador, "validador = base de datos").toBe(mensajes.baseDeDatos);
  });

  test("E2E-21 · CA-14.2: un proyecto con dos servicios aparece al filtrar por cualquiera y su tarjeta lista ambos", async ({ page }) => {
    soloEscritorio();
    // La importación acepta dos servicios separados por coma (simulada, sin escribir).
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-002-dos-"));
    const csvImp = path.join(tmp, "dos.csv");
    const prep = spawnSync("python", [path.join(__dirname, "csv_002.py"), path.join(RAIZ, "datos", "proyectos.csv"), csvImp, PREFIJO, `${SERVICIOS[0]},${SERVICIOS[1]}`], { encoding: "utf8" });
    expect(prep.status, prep.stderr).toBe(0);
    const r = spawnSync("python", ["scripts/importar.py", "--entorno", "pruebas", "--csv", csvImp, "--simular"], { cwd: RAIZ, encoding: "utf8", timeout: 180_000 });
    fs.rmSync(tmp, { recursive: true, force: true });
    expect.soft(r.status, `importación con dos servicios: ${r.stdout}${r.stderr}`).toBe(0);

    for (const s of [SERVICIOS[0], SERVICIOS[1]]) {
      await abrirMapa(page);
      await marcar(page, "Servicios", s);
      await expect(filas(page).filter({ hasText: S.dosServ }), `filtrando por «${s}»`).toHaveCount(1);
    }
    await abrirMapa(page);
    await esperarPuntos(page);
    await punto(page, S.dosServ).focus();
    const item = tarjeta(page, S.dosServ).getByRole("listitem").filter({ hasText: /^Servicios/ });
    await expect(item).toContainText(SERVICIOS[0]);
    await expect(item).toContainText(SERVICIOS[1]);
  });

  test("limpieza · borra los datos sembrados y deja la base como estaba", async () => {
    soloEscritorio();
    await limpiarTodo();
    const { count } = await admin().from("proyectos").select("id", { count: "exact", head: true }).like("nombre", `${PREFIJO}%`);
    expect(count).toBe(0);
  });
});

test.describe("002 · Implementación en el país (375 px y RNF)", () => {
  test.use({ hasTouch: true });

  test("E2E-06 · CA-04.2: a 375 px en pantalla táctil, tocar un punto abre la tarjeta completa sin desplazamiento horizontal", async ({ page }) => {
    soloMovil();
    test.setTimeout(8 * 60_000);
    const errores = vigilarConsola(page);
    await abrirMapa(page);
    await esperarPuntos(page);
    // Se toca cada punto libre y se revisa su tarjeta: abierta, dentro de la pantalla, sin
    // desplazamiento horizontal y sin partes tapadas o recortadas (título, renglones y enlace).
    const etiquetas = await puntos(page).evaluateAll((es) => es.map((e) => e.getAttribute("aria-label") ?? ""));
    const porPunto: string[] = [];
    const fallas: string[] = [];
    let revisados = 0;
    for (const l of etiquetas) {
      const n = nombreDe(l);
      if (await tarjeta(page).count()) await page.keyboard.press("Escape");
      if (await tarjeta(page).count()) { await abrirMapa(page); await esperarPuntos(page); }
      const b = page.getByRole("button", { name: l, exact: true });
      await b.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const libre = await quienRecibe(b);
      if (libre !== "ok") { porPunto.push(`${n}: omitido, punto ${libre}`); continue; }
      revisados++;
      await b.tap();
      await page.waitForTimeout(600);
      const t = tarjeta(page, n);
      if (!(await t.isVisible())) { porPunto.push(`${n}: no abre`); fallas.push(`${n}: no abre`); continue; }
      const problemas: string[] = [];
      for (const campo of ["Operador", "Estado", "Potencia", "Energía"]) if (!(await t.innerText()).includes(campo)) problemas.push(`sin «${campo}»`);
      await t.scrollIntoViewIfNeeded().catch(() => undefined);
      const caja = (await t.boundingBox())!;
      if (caja.x < 0 || caja.x + caja.width > 375) problemas.push(`fuera de la pantalla en x (${Math.round(caja.x)}–${Math.round(caja.x + caja.width)})`);
      const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (desborde > 0) problemas.push(`desplazamiento horizontal de ${desborde} px`);
      // Cada parte se revisa tras llevarla a la ventana (como haría quien desplaza la página).
      const partes = t.locator("h1,h2,h3,h4,li,a");
      for (let i = 0; i < (await partes.count()); i++) {
        const parte = partes.nth(i);
        await parte.scrollIntoViewIfNeeded().catch(() => undefined);
        const q = await parte.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const x = r.left + Math.min(20, r.width / 2);
          const y = r.top + r.height / 2;
          const e = document.elementFromPoint(x, y) as HTMLElement | null;
          if (e && (el.contains(e) || e.contains(el))) return "ok";
          return `«${(el as HTMLElement).innerText.trim().slice(0, 30)}» ${e ? `tapado por ${e.tagName}.${e.className?.toString().slice(0, 40)}` : "recortado (fuera de la ventana)"}`;
        });
        if (q !== "ok") problemas.push(q);
      }
      if (!(await t.isVisible())) problemas.push("la tarjeta se cerró al desplazar la página");
      porPunto.push(`${n}: ${problemas.length ? problemas.join(", ") : "ok"}`);
      if (problemas.length) {
        fallas.push(`${n}: ${problemas.join(", ")}`);
        await page.screenshot({ path: test.info().outputPath(`toque-${revisados}.png`) });
      }
    }
    test.info().annotations.push({ type: "toque-por-punto", description: porPunto.join("; ") });
    expect(revisados, "al menos un punto libre para tocar").toBeGreaterThan(0);
    expect.soft(fallas, "cada tarjeta tocada se abre completa, legible y sin desborde").toEqual([]);
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("E2E-23 · CA-04.4 (toque): a 375 px se toca un punto y luego «Proponer corrección»", async ({ page }) => {
    soloMovil();
    test.setTimeout(3 * 60_000);
    const errores = vigilarConsola(page);
    await abrirMapa(page);
    await esperarPuntos(page);
    const p = await puntoLibre(page);
    const nombre = (await p.getAttribute("aria-label"))!.replace(/ · [^·]+$/, "");
    await page.waitForTimeout(500);
    await p.tap();
    const t = tarjeta(page, nombre);
    await expect(t).toBeVisible();
    await page.waitForTimeout(600);
    await expect(t, "sigue abierta tras el toque").toBeVisible();
    const enlace = t.getByRole("link", { name: "Proponer corrección" });
    await enlace.scrollIntoViewIfNeeded();
    // Evidencia: qué elemento recibe el toque en el centro del enlace.
    const encima = await enlace.evaluate((a) => {
      const r = a.getBoundingClientRect();
      const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) as HTMLElement | null;
      return a.contains(e) ? "el enlace" : `${e?.tagName}.${e?.className}`;
    });
    test.info().annotations.push({ type: "encima-del-enlace", description: `${nombre}: ${encima}` });
    await page.screenshot({ path: test.info().outputPath("tarjeta-tocada.png") });
    await enlace.tap({ timeout: 15_000 });
    expect(await resultadoAportar(page, nombre)).toBe("ok");
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("E2E-22 · RNF-01, RNF-06, RNF-07: 375 px con movimiento reducido: sin desborde, filtros plegados, centrado sin vuelo, consola limpia", async ({ page }) => {
    soloMovil();
    const errores = vigilarConsola(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    // KPI sin conteo animado: se registra cada valor que muestran mientras carga.
    await page.addInitScript(() => {
      const w = window as unknown as { __kpi: string[] };
      w.__kpi = [];
      const id = setInterval(() => {
        const m = (document.querySelector("main")?.innerText ?? "").match(/[\d.,]+ MWh?/g);
        if (m) {
          const v = m.join(" | ");
          if (w.__kpi[w.__kpi.length - 1] !== v) w.__kpi.push(v);
        }
      }, 20);
      setTimeout(() => clearInterval(id), 4000);
    });
    await abrirMapa(page);
    await esperarPuntos(page);
    await page.waitForTimeout(4200);
    const kpis = await page.evaluate(() => (window as unknown as { __kpi: string[] }).__kpi);
    test.info().annotations.push({ type: "kpi-reducido", description: JSON.stringify(kpis) });
    expect(kpis.length, "KPI sin conteo animado").toBe(1);

    // RNF-07: título y descripción propios.
    await expect(page).toHaveTitle(/Implementación/);
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc ?? "").not.toBe("");
    const descInicio = await (await page.request.get("/")).text();
    expect(descInicio, "descripción distinta de la de inicio").not.toContain(`content="${desc}"`);

    // RNF-01: filtros plegados en un panel.
    await expect(botonFiltro(page, "Estado"), "el panel de filtros viene plegado").toBeHidden();
    await expect(opcion(page, "Estado", "En operación")).toBeHidden();
    const desborde = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await desborde(), "sin desplazamiento horizontal").toBeLessThanOrEqual(0);

    // RNF-06: al elegir una fila, el mapa se centra sin vuelo (posiciones del punto cuadro a cuadro).
    const nombre = (await puntos(page).first().getAttribute("aria-label"))!.replace(/ · [^·]+$/, "");
    await page.evaluate((n) => {
      const w = window as unknown as { __pos: string[] };
      w.__pos = [];
      const t0 = performance.now();
      const paso = () => {
        const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label")?.startsWith(n + " · "));
        if (b) {
          const r = b.getBoundingClientRect();
          const v = `${Math.round(r.left)},${Math.round(r.top + scrollY)}`;
          if (w.__pos[w.__pos.length - 1] !== v) w.__pos.push(v);
        }
        if (performance.now() - t0 < 2500) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }, nombre);
    await page.getByRole("button", { name: `Ver ${nombre} en el mapa` }).click();
    await page.waitForTimeout(2700);
    const pos = await page.evaluate(() => (window as unknown as { __pos: string[] }).__pos);
    test.info().annotations.push({ type: "posiciones-punto", description: `${pos.length}: ${pos.slice(0, 12).join(" ")}` });
    await expect(tarjeta(page, nombre)).toBeVisible();
    // Sin vuelo: el punto salta a su posición final (a lo sumo el desplazamiento de la página y el salto).
    expect(pos.length, "sin animación de vuelo").toBeLessThanOrEqual(3);
    expect(await desborde(), "sin desplazamiento horizontal con la tarjeta abierta").toBeLessThanOrEqual(0);
    // RNF-01 con los filtros desplegados: se abre el panel y el desplegable de Departamento.
    await page.keyboard.press("Escape");
    await page.getByText("Filtros", { exact: true }).first().click();
    await expect(botonFiltro(page, "Departamento")).toBeVisible();
    await abrirFiltro(page, "Departamento");
    // Se marca el primer departamento ofrecido: tras la limpieza de la siembra los datos reales
    // pueden no tener Antioquia (ajuste del 2026-10-27, T21 de la 007).
    await opcionesFiltro(page, "Departamento").first().check();
    await expect(page).toHaveURL(/departamento=/);
    const caja = (await grupoFiltro(page, "Departamento").getByRole("group", { name: "Opciones de Departamento" }).boundingBox())!;
    test.info().annotations.push({ type: "desplegable-375", description: `x ${Math.round(caja.x)}–${Math.round(caja.x + caja.width)}; desborde ${await desborde()}` });
    expect.soft(caja.x, "desplegable dentro de la pantalla").toBeGreaterThanOrEqual(0);
    expect.soft(caja.x + caja.width, "desplegable dentro de la pantalla").toBeLessThanOrEqual(375);
    expect(await desborde(), "sin desplazamiento horizontal con un desplegable abierto").toBeLessThanOrEqual(0);
    expect(errores, "consola sin errores").toEqual([]);
  });
});
