// E2E de la spec 008 · Almacenamiento detrás del medidor (escenarios E2E-01 a E2E-19 de plan.md).
// Corre contra `npm run dev` conectado al proyecto Supabase «pruebas».
//   npx playwright test -c e2e/008.config.ts --project=escritorio --workers=1
// Siembra sus propios proyectos ficticios del segmento (prefijo PREFIJO + «008-») y los borra al
// final («limpieza» y afterAll).
//
// Dependencias externas:
// - Migración 0007 (la aplica el usuario). Sin ella el disparador de `proyectos` rechaza el servicio
//   «Maximización de autoconsumo PV y respaldo» y la fuente textual. Un sondeo (insert de una fila
//   `Pendiente` que se borra enseguida) lo detecta; los escenarios que necesitan sembrar el segmento
//   o aprobarlo se saltan con el motivo «BLOQUEADO (0007)». No cuentan como verdes.
// - «Los 3 iniciales» (T09): E2E-07, 08 y 09 necesitan los 3 proyectos aprobados; E2E-15 y 16 los
//   3 aportes pendientes. Si no existen en la base, se saltan con su motivo.
//
// Orden del archivo (workers = 1): primero lo que no siembra (incluido E2E-11, que necesita el
// segmento vacío), después lo sembrado y al final la limpieza.
import { test, expect, type Page, type Locator } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  admin,
  anonimo,
  iniciarSesionEditor,
  limpiarTodo,
  PREFIJO,
  proyectoPrueba,
  sembrarAporte,
  sembrarProyectos,
  vigilarConsola,
} from "./utilidades";

test.use({ viewport: { width: 1280, height: 900 } });
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "escritorio", "Los escenarios de la 008 fijan su propio ancho");
});

// El indicador de `next dev` no es parte de la app: se oculta para que no tape puntos.
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

const RAIZ = path.resolve(__dirname, "..", "..");
const MEDIDOR = "Maximización de autoconsumo PV y respaldo";
const TEXTO = "Información de Azimut Energía (2026-10)";
const ID_MEDIDOR = "detras-del-medidor";
const Q_MEDIDOR = `?segmento=${ID_MEDIDOR}`;
const ESTADOS = ["En operación", "En construcción", "Anunciado", "Inactivo"];
const INICIALES = ["Casa Alto de las Palmas", "Centro Comercial Ipiales", "Planta Guarne"];
const ESPERA_CACHE = 7 * 60_000; // /mapa se revalida cada 5 min

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** «1.234,5 MW» → 1234.5; vacío → 0. */
const num = (s: string) => {
  const t = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return t === "" || t === "-" ? 0 : Number(t);
};

// ---------- Datos sembrados (nombres fijos: la siembra es idempotente) ----------
const N = (k: string) => `${PREFIJO}008-${k}`;
const OPERADOR = N("operador-medidor");
const S = { op: N("medidor-op"), constr: N("medidor-constr"), anun: N("medidor-anun") };
const comunes = { operador: OPERADOR, tecnologia: "LFP", tipo_uso_conexion: MEDIDOR, fuente: TEXTO };
const SIEMBRA = [
  proyectoPrueba({ ...comunes, nombre: S.op, estado: "En operación", departamento: "Antioquia", municipio: "Medellín", latitud: 6.25, longitud: -75.58, potencia_nominal_mw: 0.015, capacidad_maxima_mwh: 0.04, fpo: "2025" }),
  proyectoPrueba({ ...comunes, nombre: S.constr, estado: "En construcción", departamento: "Nariño", municipio: "Ipiales", latitud: 0.83, longitud: -77.65, potencia_nominal_mw: 0.107, capacidad_maxima_mwh: 0.241, fpo: "2026" }),
  proyectoPrueba({ ...comunes, nombre: S.anun, estado: "Anunciado", departamento: "Antioquia", municipio: "Guarne", latitud: 6.28, longitud: -75.44, potencia_nominal_mw: 0.107, capacidad_maxima_mwh: 0.241, fpo: "2026" }),
];

type Proy = {
  nombre: string;
  operador: string | null;
  estado: string;
  departamento: string | null;
  latitud: number | null;
  longitud: number | null;
  potencia_nominal_mw: number | null;
  capacidad_maxima_mwh: number | null;
  tipo_uso_conexion: string | null;
};
const esMedidor = (p: Proy) => (p.tipo_uso_conexion ?? "").includes(MEDIDOR);

async function aprobados(): Promise<Proy[]> {
  const { data, error } = await admin()
    .from("proyectos")
    .select("nombre,operador,estado,departamento,latitud,longitud,potencia_nominal_mw,capacidad_maxima_mwh,tipo_uso_conexion")
    .eq("publicacion", "Aprobado");
  if (error) throw error;
  return data as Proy[];
}

// ---------- Migración 0007 ----------
const MOTIVO_0007 =
  "BLOQUEADO (0007): la migración 0007_segmento.sql no está aplicada en «pruebas»; el disparador rechaza " +
  "«Maximización de autoconsumo PV y respaldo» o la fuente textual, así que no se puede sembrar ni aprobar el segmento.";
let estado0007: { aplicada: boolean; mensaje: string } | undefined;

/** Siembra una fila `Pendiente` del segmento con fuente textual y la borra: si el disparador la rechaza, falta la 0007. */
async function migracion0007() {
  if (estado0007) return estado0007;
  const nombre = N("sondeo-0007");
  const sb = admin();
  const { error } = await sb.from("proyectos").insert(proyectoPrueba({ ...comunes, nombre, publicacion: "Pendiente" }));
  await sb.from("proyectos").delete().eq("nombre", nombre);
  if (!error) estado0007 = { aplicada: true, mensaje: "" };
  else if (/no está entre los valores permitidos|no es un enlace/.test(error.message)) estado0007 = { aplicada: false, mensaje: error.message };
  else throw new Error("El sondeo de la 0007 falló por otra causa: " + error.message);
  return estado0007;
}

async function exigir0007() {
  const m = await migracion0007();
  if (!m.aplicada) test.info().annotations.push({ type: "disparador", description: m.mensaje });
  test.skip(!m.aplicada, MOTIVO_0007);
}

/** Lee el HTML de una ruta (incluye la carga útil RSC con los nombres de los proyectos). */
const html = async (page: Page, ruta: string) => (await page.request.get(ruta)).text();

/** Siembra el segmento (si no está) y espera a que /mapa lo muestre (la página se revalida en minutos). */
async function asegurarSiembra(page: Page) {
  test.setTimeout(ESPERA_CACHE + 5 * 60_000);
  await exigir0007();
  const { data } = await admin().from("proyectos").select("nombre").in("nombre", Object.values(S));
  if ((data ?? []).length !== SIEMBRA.length) {
    await admin().from("proyectos").delete().in("nombre", Object.values(S));
    try {
      await sembrarProyectos(SIEMBRA);
    } catch (e) {
      const m = (e as Error).message;
      if (/no está entre los valores permitidos|no es un enlace/.test(m)) {
        test.info().annotations.push({ type: "disparador", description: m });
        test.skip(true, MOTIVO_0007);
      }
      throw e;
    }
  }
  const inicio = Date.now();
  for (;;) {
    const h = await html(page, `/mapa${Q_MEDIDOR}`);
    if (Object.values(S).every((n) => h.includes(n))) return;
    if (Date.now() - inicio > ESPERA_CACHE) throw new Error("Lo sembrado no apareció en /mapa en 7 min");
    await page.waitForTimeout(10_000);
  }
}

async function inicialesAprobados() {
  const nombres = new Set((await aprobados()).map((p) => p.nombre));
  const faltan = INICIALES.filter((n) => !nombres.has(n));
  test.skip(
    faltan.length > 0,
    `Los 3 proyectos iniciales (T09) no están aprobados en «pruebas» (faltan: ${faltan.join(", ")}). ` +
      "Se envían como aportes tras aplicar la 0007 y los aprueba el editor.",
  );
}

async function aportesInicialesPendientes() {
  const { data, error } = await admin()
    .from("aportes")
    .select("id,tipo,publicacion,fuente,datos")
    .like("descripcion", "Carga inicial 008%")
    .eq("publicacion", "Pendiente");
  if (error) throw error;
  test.skip(
    (data ?? []).length < 3,
    `Los 3 aportes iniciales (T09) no están pendientes en «pruebas» (hay ${(data ?? []).length}). ` +
      "Se envían con proponer_aporte.py tras aplicar la 0007.",
  );
  return data as { id: number; tipo: string; fuente: string; datos: Record<string, unknown> }[];
}

// ---------- Localizadores ----------
const grupoSegmento = (page: Page) => page.getByRole("group", { name: "Tipo de almacenamiento" });
const boton = (page: Page, nombre: "Gran escala" | "Detrás del medidor") =>
  grupoSegmento(page).getByRole("button", { name: nombre, exact: true });
const tabla = (page: Page) => page.getByRole("table", { name: /Proyectos de almacenamiento/ });
const filas = (page: Page) => tabla(page).getByRole("rowgroup").nth(1).getByRole("row");
const puntos = (page: Page) => page.getByRole("button", { name: new RegExp(` · (${ESTADOS.join("|")})$`) });
const punto = (page: Page, nombre: string) => page.getByRole("button", { name: new RegExp(`^${esc(nombre)} · `) });
const tarjeta = (page: Page, nombre: string) => page.getByRole("dialog", { name: nombre });
const construccion = (page: Page) => page.getByRole("region", { name: "Sección en construcción" });
const kpi = (page: Page, nombre: string) => page.getByRole("group", { name: nombre, exact: true });
const botonFiltros = (page: Page) => page.getByRole("button", { name: /^(Filtros|Ocultar filtros)/ });
const conteo = (page: Page) => page.getByRole("status").filter({ hasText: /^\d[\d.]* proyectos?$/ }).first();
const grupoFiltro = (page: Page, nombre: string) => page.getByRole("group", { name: nombre, exact: true });
const nota = (page: Page) => page.getByText("Ubicación aproximada: cabecera del municipio");

/** Espera a que /mapa muestre la tabla o el aviso de «Sección en construcción». */
async function esperarVista(page: Page) {
  await expect(tabla(page).or(construccion(page))).toBeVisible({ timeout: 60_000 });
}

async function abrirMapa(page: Page, query = "") {
  await page.goto(`/mapa${query}`);
  await esperarVista(page);
}

async function esperarPuntos(page: Page) {
  await expect(page.locator(".maplibregl-map")).toBeVisible({ timeout: 60_000 });
  await expect(puntos(page).first()).toBeAttached({ timeout: 60_000 });
}

const nombresTabla = (page: Page) =>
  filas(page).evaluateAll((trs) => trs.map((tr) => (tr.querySelector("td")?.textContent ?? "").replace(/\s*\(sin ubicación en el mapa\)\s*$/, "").trim()));

/** Recarga /mapa hasta que la tabla tenga exactamente esos nombres (la caché tarda hasta 5 min). */
async function esperarTabla(page: Page, query: string, esperados: string[]) {
  const objetivo = [...esperados].sort();
  const inicio = Date.now();
  let ultimo: string[] = [];
  for (;;) {
    await abrirMapa(page, query);
    if (await tabla(page).isVisible()) {
      ultimo = (await nombresTabla(page)).sort();
      if (JSON.stringify(ultimo.map((n) => objetivo.find((o) => n.startsWith(o)) ?? n)) === JSON.stringify(objetivo)) return;
    }
    if (Date.now() - inicio > ESPERA_CACHE) {
      expect(ultimo, `tabla de /mapa${query} (se esperó la caché 7 min)`).toEqual(objetivo);
    }
    await page.waitForTimeout(10_000);
  }
}

async function desplegarPanel(page: Page) {
  const b = botonFiltros(page);
  if ((await b.getAttribute("aria-expanded")) !== "true") await b.click();
  await expect(b).toHaveAttribute("aria-expanded", "true");
}

/** Opciones («Valor (n)») de un filtro, sin «Todas». */
async function opcionesFiltro(page: Page, grupo: string) {
  await desplegarPanel(page);
  const b = grupoFiltro(page, grupo).getByRole("button", { name: new RegExp(`^${esc(grupo)} `) });
  if ((await b.getAttribute("aria-expanded")) !== "true") await b.click();
  const textos = await grupoFiltro(page, grupo)
    .getByRole("group", { name: `Opciones de ${grupo}` })
    .getByRole("checkbox")
    .evaluateAll((es) => es.map((e) => (e as HTMLInputElement).labels?.[0]?.textContent?.trim() ?? e.getAttribute("aria-label") ?? ""));
  await page.keyboard.press("Escape");
  return textos.map((t) => t.replace(/\s*\(\d+\)$/, "")).sort();
}

async function marcarFiltro(page: Page, grupo: string, valor: string) {
  await desplegarPanel(page);
  const b = grupoFiltro(page, grupo).getByRole("button", { name: new RegExp(`^${esc(grupo)} `) });
  if ((await b.getAttribute("aria-expanded")) !== "true") await b.click();
  await grupoFiltro(page, grupo).getByRole("checkbox", { name: new RegExp(`^${esc(valor)} \\(\\d+\\)$`) }).check();
  await page.keyboard.press("Escape");
}

/** Texto de la cifra de una tarjeta KPI (la copia visible). */
const cifra = async (page: Page, nombre: string) => ((await kpi(page, nombre).getByTestId("kpi-valor").textContent()) ?? "").trim();

/** Primer punto que recibe el puntero (no tapado por otro). */
async function puntoLibre(page: Page, excluir: string[] = []) {
  const labels = await puntos(page).evaluateAll((es) => es.map((e) => e.getAttribute("aria-label") ?? ""));
  for (const l of labels) {
    const nombre = l.replace(/ · [^·]+$/, "");
    if (excluir.includes(nombre)) continue;
    const p = page.getByRole("button", { name: l, exact: true });
    const libre = await p.evaluate((e) => {
      e.scrollIntoView({ block: "center" });
      const r = e.getBoundingClientRect();
      return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === e;
    });
    if (libre) return { p, nombre };
  }
  return null;
}

// ---------- CSV ----------
function parsearCsv(texto: string): string[][] {
  const filasCsv: string[][] = [];
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
      fila.push(campo); filasCsv.push(fila); fila = []; campo = "";
    } else campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filasCsv.push(fila); }
  return filasCsv;
}

function registrosCsv(texto: string) {
  const f = parsearCsv(texto.replace(/^﻿/, ""));
  const i = f.findIndex((r) => r[0] === "Nombre");
  const cab = f[i];
  const datos = f.slice(i + 1).filter((r) => r.length === cab.length && r[0].trim());
  return { cab, datos };
}

/** Encabezado de hoy: el de datos/proyectos.csv del repositorio (la 008 no cambia columnas). */
const cabeceraDeHoy = () => registrosCsv(fs.readFileSync(path.join(RAIZ, "datos", "proyectos.csv"), "utf8")).cab;
const normalizar = (c: string[]) => c.map((x) => x.replace(/\s+/g, " ").trim());

async function descargarCsvVista(page: Page) {
  const [descarga] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /^Descargar CSV/ }).click()]);
  return fs.readFileSync((await descarga.path())!, "utf8");
}

// ---------- axe ----------
async function correrAxe(page: Page) {
  const axe = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
  await page.addScriptTag({ content: axe });
  return page.evaluate(async () => {
    // @ts-expect-error axe inyectado
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return (r.violations as { id: string; impact: string; nodes: { target: string[] }[] }[])
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .flatMap((v) => v.nodes.map((n) => `${v.id} (${v.impact}) en ${n.target.join(" ")}`));
  });
}

async function sinDesplazamientoHorizontal(page: Page) {
  return page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    ancho: document.documentElement.clientWidth,
  }));
}

/** ¿Hay proyectos aprobados del segmento en la base? */
const haySegmentoEnBase = async () => (await aprobados()).some(esMedidor);

test.afterAll(async () => {
  await limpiarTodo();
});

// ======================================================================
// Sin sembrar
// ======================================================================
test.describe("008 · Sin sembrar", () => {
  test("preparación · borra restos de corridas anteriores y sondea la 0007", async () => {
    await limpiarTodo();
    const m = await migracion0007();
    test.info().annotations.push({ type: "0007", description: m.aplicada ? "aplicada" : `NO aplicada · ${m.mensaje}` });
  });

  test("E2E-03 · CA-03.1: los botones van debajo del título y antes de los KPI, con «Gran escala» resaltado", async ({ page }) => {
    await abrirMapa(page);
    const hijos = page.locator("main > *");
    await expect(hijos.first()).toHaveJSProperty("tagName", "H1");
    await expect(hijos.nth(1)).toHaveAttribute("aria-label", "Tipo de almacenamiento");
    await expect(boton(page, "Gran escala")).toHaveAttribute("aria-pressed", "true");
    await expect(boton(page, "Detrás del medidor")).toHaveAttribute("aria-pressed", "false");
    const y = async (l: Locator) => (await l.boundingBox())!.y;
    const titulo = await y(page.getByRole("heading", { level: 1 }));
    const botones = await y(grupoSegmento(page));
    const kpis = await y(page.getByRole("region", { name: "Instalado (en operación)" }));
    expect(titulo).toBeLessThan(botones);
    expect(botones).toBeLessThan(kpis);
  });

  test("E2E-04 · CA-03.2: el enlace con «Detrás del medidor» abre ese segmento; los botones se usan con Tab y Enter", async ({ page, context }) => {
    await abrirMapa(page);
    await boton(page, "Detrás del medidor").click();
    await expect(page).toHaveURL(new RegExp(`\\?segmento=${ID_MEDIDOR}$`));
    await expect(boton(page, "Detrás del medidor")).toHaveAttribute("aria-pressed", "true");
    const otra = await context.newPage();
    await otra.goto(page.url());
    await esperarVista(otra);
    await expect(boton(otra, "Detrás del medidor")).toHaveAttribute("aria-pressed", "true");
    await expect(boton(otra, "Gran escala")).toHaveAttribute("aria-pressed", "false");
    await otra.close();

    // Teclado: desde «Gran escala», Tab llega a «Detrás del medidor» y Enter lo elige; Shift+Tab y Enter vuelven.
    await abrirMapa(page);
    await boton(page, "Gran escala").focus();
    await page.keyboard.press("Tab");
    await expect(boton(page, "Detrás del medidor")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(boton(page, "Detrás del medidor")).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(new RegExp(`\\?segmento=${ID_MEDIDOR}$`));
    await page.keyboard.press("Shift+Tab");
    await expect(boton(page, "Gran escala")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(boton(page, "Gran escala")).toHaveAttribute("aria-pressed", "true");
    await expect(page).not.toHaveURL(/segmento=/);
    await expect(tabla(page)).toBeVisible();
  });

  test("E2E-11 · CA-08.1: sin proyectos del segmento, «Detrás del medidor» muestra «Sección en construcción» sin mapa ni KPI", async ({ page }) => {
    test.setTimeout(ESPERA_CACHE + 60_000);
    test.skip(await haySegmentoEnBase(), "La base ya tiene proyectos aprobados del segmento: el caso vacío no se puede observar");
    const inicio = Date.now();
    for (;;) {
      await abrirMapa(page, Q_MEDIDOR);
      if (await construccion(page).isVisible()) break;
      if (Date.now() - inicio > ESPERA_CACHE) throw new Error("/mapa sigue mostrando proyectos del segmento tras 7 min");
      await page.waitForTimeout(10_000);
    }
    await expect(construccion(page).getByRole("heading", { name: "Sección en construcción" })).toBeVisible();
    await expect(construccion(page)).toContainText(/detrás del medidor/i);
    await expect(page.locator(".maplibregl-map")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Instalado (en operación)" })).toHaveCount(0);
    await expect(tabla(page)).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Gráficas" })).toHaveCount(0);
    await expect(boton(page, "Detrás del medidor")).toHaveAttribute("aria-pressed", "true");
  });

  test("E2E-07 · CA-05.1: con los 3 iniciales, KPI «15,0 kW» y «40,0 kWh» en tarjetas separadas; tabla en [kW] y [kWh]", async ({ page }) => {
    await inicialesAprobados();
    await abrirMapa(page, Q_MEDIDOR);
    await expect(tabla(page)).toBeVisible();
    const kw = kpi(page, "Potencia instalada [kW]");
    const kwh = kpi(page, "Energía instalada [kWh]");
    await expect(kw.getByTestId("kpi-valor")).toHaveText("15,0 kW");
    await expect(kwh.getByTestId("kpi-valor")).toHaveText("40,0 kWh");
    expect(await kw.evaluate((a, b) => a.contains(b as Node), await kwh.elementHandle())).toBeFalsy();
    const cab = await tabla(page).getByRole("columnheader").allTextContents();
    expect(cab).toContain("Potencia [kW]");
    expect(cab).toContain("Energía [kWh]");
    expect(cab).not.toContain("Servicios"); // CA-12.1
  });

  test("E2E-08 · CA-05.2: tarjeta de «Centro Comercial Ipiales» en kW/kWh y sin enlaces de fuente", async ({ page }) => {
    await inicialesAprobados();
    await abrirMapa(page, Q_MEDIDOR);
    await esperarPuntos(page);
    await punto(page, "Centro Comercial Ipiales").focus();
    await page.keyboard.press("Enter");
    const t = tarjeta(page, "Centro Comercial Ipiales");
    await expect(t).toBeVisible();
    for (const s of ["107,0 kW", "241,0 kWh", "En construcción", "Azimut Energía", "LFP", MEDIDOR, "2026", "Ipiales, Nariño"]) {
      await expect(t, s).toContainText(s);
    }
    await expect(t.getByRole("link")).toHaveCount(0);
    await expect(t).not.toContainText(/\bkV\b/);
    await expect(t).not.toContainText(/\bMWh?\b/);
  });

  test("E2E-09 · CA-06.1, CA-06.2: nota de ubicación aproximada; «Casa Alto de las Palmas» en Medellín, Antioquia, sin dirección", async ({ page }) => {
    await inicialesAprobados();
    await abrirMapa(page, Q_MEDIDOR);
    await expect(nota(page)).toBeVisible();
    await esperarPuntos(page);
    await punto(page, "Casa Alto de las Palmas").focus();
    await page.keyboard.press("Enter");
    const t = tarjeta(page, "Casa Alto de las Palmas");
    await expect(t.getByRole("heading")).toHaveText("Casa Alto de las Palmas");
    await expect(t).toContainText("Ubicación: Medellín, Antioquia");
    await expect(t).not.toContainText(/Dirección/i);
    const { cab, datos } = registrosCsv(await descargarCsvVista(page));
    const fila = datos.find((r) => r[0] === "Casa Alto de las Palmas");
    expect(fila, "fila en el CSV").toBeTruthy();
    const c = normalizar(cab);
    expect(fila![c.indexOf("Municipio")]).toBe("Medellín");
    expect(fila![c.indexOf("Departamento")]).toBe("Antioquia");
  });

  test("E2E-15 · CA-11.1: /admin muestra los 3 aportes «Proyecto nuevo» pendientes con el servicio nuevo y la fuente de Azimut", async ({ page, context }) => {
    const aps = await aportesInicialesPendientes();
    await iniciarSesionEditor(context);
    await page.goto("/admin");
    for (const a of aps) {
      expect(a.tipo).toBe("Proyecto nuevo");
      await expect(page.locator(`a[href="/admin/${a.id}"]`).first()).toBeVisible({ timeout: 60_000 });
    }
    for (const a of aps) {
      await page.goto(`/admin/${a.id}`);
      const form = page.getByRole("form", { name: "Aprobar aporte" });
      await expect(form.getByRole("checkbox", { name: MEDIDOR })).toBeChecked({ timeout: 60_000 });
      await expect(form.locator('[name="campo:fuente"]')).toHaveValue(TEXTO);
    }
  });

  test("E2E-16 · CA-11.3: los aportes pendientes no aparecen en «Detrás del medidor»", async ({ page }) => {
    const aps = await aportesInicialesPendientes();
    const nombres = aps.map((a) => String(a.datos.nombre));
    const publicos = new Set(((await anonimo().from("proyectos").select("nombre").in("nombre", nombres)).data ?? []).map((p) => p.nombre));
    test.skip(publicos.size > 0, `Ya hay proyectos públicos con esos nombres: ${[...publicos].join(", ")}`);
    await abrirMapa(page, Q_MEDIDOR);
    const h = await page.content();
    for (const n of nombres) expect(h, n).not.toContain(n);
  });

  test("E2E-12a · CA-09.3: el CSV completo tiene las mismas columnas de hoy y todas las filas con fuente", async ({ page }) => {
    const r = await page.request.get("/datos/proyectos.csv");
    expect(r.ok()).toBeTruthy();
    const { cab, datos } = registrosCsv(await r.text());
    expect(normalizar(cab)).toEqual(normalizar(cabeceraDeHoy()));
    const iFuente = normalizar(cab).indexOf("Fuente");
    expect(iFuente).toBeGreaterThanOrEqual(0);
    expect(datos.length).toBeGreaterThan(0);
    const sinFuente = datos.filter((d) => !d[iFuente].trim()).map((d) => d[0]);
    expect(sinFuente, "filas sin fuente").toEqual([]);
  });

  test("E2E-17a · RNF-01: /mapa a 375 px sin desplazamiento horizontal en los dos segmentos (base tal como está)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const q of ["", Q_MEDIDOR]) {
      await abrirMapa(page, q);
      await page.waitForTimeout(1500);
      const { scroll, ancho } = await sinDesplazamientoHorizontal(page);
      test.info().annotations.push({ type: `375 px ${q || "gran escala"}`, description: `${scroll} / ${ancho} · ${(await construccion(page).isVisible()) ? "segmento vacío" : "con proyectos"}` });
      expect(scroll, `/mapa${q}`).toBeLessThanOrEqual(ancho);
    }
  });

  test("E2E-18a · RNF-03: axe sin violaciones serias ni críticas en los dos segmentos (base tal como está)", async ({ page }) => {
    test.setTimeout(180_000);
    const problemas: string[] = [];
    for (const q of ["", Q_MEDIDOR]) {
      await abrirMapa(page, q);
      await page.waitForTimeout(1500);
      for (const p of await correrAxe(page)) problemas.push(`/mapa${q}: ${p}`);
    }
    expect(problemas).toEqual([]);
  });

  test("E2E-19 · RNF-04: consola sin errores en /mapa (los dos segmentos) y en /", async ({ page }) => {
    const errores = vigilarConsola(page);
    await abrirMapa(page);
    await page.waitForTimeout(1500);
    await boton(page, "Detrás del medidor").click();
    await esperarVista(page);
    await page.waitForTimeout(1500);
    await page.goto("/");
    await expect(page.getByTestId("barra-crecimiento").first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1500);
    expect(errores).toEqual([]);
  });

  test("E2E-13b · CA-02.1, CA-02.2: /admin rechaza un servicio inventado y la mezcla de segmentos", async ({ page, context }) => {
    test.setTimeout(5 * 60_000);
    const a = await sembrarAporte({
      tipo: "Proyecto nuevo",
      descripcion: N("aporte-rechazos"),
      datos: { ...proyectoPrueba({ nombre: N("aporte-rechazos"), tipo_uso_conexion: MEDIDOR }), publicacion: undefined },
      fuente: "https://ejemplo.co/008-rechazos",
      origen: "usuario",
    });
    await iniciarSesionEditor(context);
    const form = page.getByRole("form", { name: "Aprobar aporte" });
    const servicios = () => form.getByRole("group", { name: /Servicios|Tipo uso\/conexión/ });

    // Mezcla: el servicio nuevo más uno de gran escala.
    await page.goto(`/admin/${a.id}`);
    await expect(servicios().getByRole("checkbox", { name: MEDIDOR })).toBeChecked({ timeout: 60_000 });
    await expect(servicios().getByRole("checkbox")).toHaveCount(4);
    await page.waitForLoadState("networkidle");
    await servicios().getByRole("checkbox", { name: "Regulación primaria de frecuencia" }).check();
    await page.getByRole("button", { name: "Aprobar y publicar" }).click();
    await expect(form.getByRole("alert")).toContainText("mezcla servicios de dos segmentos", { timeout: 90_000 });
    await expect(form.getByRole("alert")).toContainText("Tipo uso/conexión");

    // Servicio inventado: el envío lleva «Servicio X» en lugar del servicio nuevo.
    await page.goto(`/admin/${a.id}`);
    await expect(servicios().getByRole("checkbox", { name: MEDIDOR })).toBeChecked({ timeout: 60_000 });
    await page.waitForLoadState("networkidle");
    let manipulada = false;
    await page.route("**/admin/**", async (route) => {
      const req = route.request();
      const cuerpo = req.postDataBuffer();
      if (req.method() === "POST" && cuerpo && cuerpo.toString("utf8").includes(MEDIDOR)) {
        manipulada = true;
        await route.continue({ postData: Buffer.from(cuerpo.toString("utf8").replace(MEDIDOR, "Servicio X"), "utf8") });
      } else await route.continue();
    });
    await page.getByRole("button", { name: "Aprobar y publicar" }).click();
    await expect.poll(() => manipulada).toBe(true);
    await expect(form.getByRole("alert")).toContainText("Servicio X", { timeout: 90_000 });
    await page.unroute("**/admin/**");

    const { data } = await admin().from("aportes").select("publicacion").eq("id", a.id).single();
    expect(data!.publicacion).toBe("Pendiente");
    const { count } = await admin().from("proyectos").select("id", { count: "exact", head: true }).eq("nombre", N("aporte-rechazos"));
    expect(count).toBe(0);
  });

  test("E2E-14b · CA-09.2: /admin rechaza una fuente textual en un proyecto de gran escala", async ({ page, context }) => {
    test.setTimeout(5 * 60_000);
    const a = await sembrarAporte({
      tipo: "Proyecto nuevo",
      descripcion: N("aporte-gran-texto"),
      datos: { ...proyectoPrueba({ nombre: N("aporte-gran-texto"), tipo_uso_conexion: "Regulación primaria de frecuencia" }), publicacion: undefined },
      fuente: "https://ejemplo.co/008-gran",
      origen: "usuario",
    });
    await iniciarSesionEditor(context);
    await page.goto(`/admin/${a.id}`);
    const form = page.getByRole("form", { name: "Aprobar aporte" });
    const fuente = form.locator('[name="campo:fuente"]');
    await expect(fuente).toBeVisible({ timeout: 60_000 });
    await page.waitForLoadState("networkidle");
    await fuente.fill(TEXTO);
    await page.getByRole("button", { name: "Aprobar y publicar" }).click();
    await expect(form.getByRole("alert")).toContainText(/no es un enlace/, { timeout: 90_000 });
    const { data } = await admin().from("aportes").select("publicacion").eq("id", a.id).single();
    expect(data!.publicacion).toBe("Pendiente");
  });
});

// ======================================================================
// Con proyectos sembrados del segmento (necesitan la 0007)
// ======================================================================
test.describe("008 · Con sembrados", () => {
  test("E2E-01 · CA-01.1, CA-05.3: «Gran escala» resaltado; los mismos proyectos y cifras de hoy, en MW/MWh", async ({ page }) => {
    await asegurarSiembra(page);
    const gran = (await aprobados()).filter((p) => !esMedidor(p));
    await esperarTabla(page, "", gran.map((p) => p.nombre));
    await expect(boton(page, "Gran escala")).toHaveAttribute("aria-pressed", "true");
    await expect(boton(page, "Detrás del medidor")).toHaveAttribute("aria-pressed", "false");
    const op = gran.filter((p) => p.estado === "En operación");
    const mw = op.reduce((a, p) => a + (p.potencia_nominal_mw ?? 0), 0);
    const mwh = op.reduce((a, p) => a + (p.capacidad_maxima_mwh ?? 0), 0);
    const vMw = await cifra(page, "Potencia instalada [MW]");
    const vMwh = await cifra(page, "Energía instalada [MWh]");
    expect(vMw).toMatch(/ MW$/);
    expect(vMwh).toMatch(/ MWh$/);
    expect(Math.abs(num(vMw) - mw)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(num(vMwh) - mwh)).toBeLessThanOrEqual(0.05);
    const cab = await tabla(page).getByRole("columnheader").allTextContents();
    expect(cab).toContain("Potencia [MW]");
    expect(cab).toContain("Energía [MWh]");
    await expect(nota(page)).toHaveCount(0);
    for (const n of Object.values(S)) await expect(filas(page).filter({ hasText: n })).toHaveCount(0);
  });

  test("E2E-02 · CA-01.2, CA-04.1: en «Detrás del medidor» KPI, conteo, gráficas, puntos, tabla y filtros son solo del segmento", async ({ page }) => {
    await asegurarSiembra(page);
    const seg = (await aprobados()).filter(esMedidor);
    await abrirMapa(page);
    await boton(page, "Detrás del medidor").click();
    await expect(page).toHaveURL(new RegExp(`\\?segmento=${ID_MEDIDOR}$`));
    await expect(tabla(page)).toBeVisible({ timeout: 60_000 });
    expect((await nombresTabla(page)).sort()).toEqual(seg.map((p) => p.nombre).sort());
    await expect(conteo(page)).toHaveText(`${seg.length} ${seg.length === 1 ? "proyecto" : "proyectos"}`);
    const op = seg.filter((p) => p.estado === "En operación");
    const kw = op.reduce((a, p) => a + (p.potencia_nominal_mw ?? 0), 0) * 1000;
    const kwh = op.reduce((a, p) => a + (p.capacidad_maxima_mwh ?? 0), 0) * 1000;
    const vKw = await cifra(page, "Potencia instalada [kW]");
    const vKwh = await cifra(page, "Energía instalada [kWh]");
    expect(vKw).toMatch(/ kW$/);
    expect(vKwh).toMatch(/ kWh$/);
    expect(Math.abs(num(vKw) - kw)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(num(vKwh) - kwh)).toBeLessThanOrEqual(0.05);
    expect(num(await cifra(page, "Proyectos identificados"))).toBe(seg.length);
    const graficas = page.getByRole("region", { name: "Gráficas" });
    await expect(graficas).toBeVisible({ timeout: 60_000 });
    await expect(graficas).toContainText(/\bkWh?\b/);
    await expect(graficas).not.toContainText(/\bMWh?\b/);
    await esperarPuntos(page);
    const ubicados = seg.filter((p) => p.latitud !== null && p.longitud !== null);
    await expect(puntos(page)).toHaveCount(ubicados.length);
    expect(await opcionesFiltro(page, "Departamento")).toEqual([...new Set(seg.map((p) => p.departamento!))].sort());
    expect(await opcionesFiltro(page, "Operador")).toEqual([...new Set(seg.map((p) => p.operador!))].sort());
    await expect(nota(page)).toBeVisible();
  });

  test("E2E-05 · CA-04.2: un filtro de «Gran escala» no queda activo al cambiar de segmento", async ({ page }) => {
    await asegurarSiembra(page);
    const gran = (await aprobados()).filter((p) => !esMedidor(p));
    const depto = [...new Set(gran.map((p) => p.departamento).filter(Boolean))].sort()[0]!;
    await abrirMapa(page);
    await marcarFiltro(page, "Departamento", depto);
    await expect(botonFiltros(page)).toHaveText(/^(Filtros|Ocultar filtros) \(1\)$/);
    await expect(page).toHaveURL(/departamento=/);
    await boton(page, "Detrás del medidor").click();
    await expect(page).toHaveURL(new RegExp(`/mapa\\?segmento=${ID_MEDIDOR}$`));
    await expect(tabla(page)).toBeVisible();
    await expect(botonFiltros(page)).toHaveText(/^(Filtros|Ocultar filtros)$/);
    await expect(page.getByRole("button", { name: /^Quitar filtro / })).toHaveCount(0);
    await boton(page, "Gran escala").click();
    await expect(page).toHaveURL(/\/mapa$/);
    await expect(botonFiltros(page)).toHaveText(/^(Filtros|Ocultar filtros)$/);
    await expect(filas(page)).toHaveCount(gran.length);
  });

  test("E2E-06 · CA-04.3: en «Detrás del medidor», clic en un punto o Tab y Enter en otro abren su tarjeta", async ({ page }) => {
    await asegurarSiembra(page);
    await abrirMapa(page, Q_MEDIDOR);
    await esperarPuntos(page);
    await page.waitForTimeout(1000);
    const libre = await puntoLibre(page);
    expect(libre, "un punto libre para el puntero").not.toBeNull();
    await libre!.p.click();
    await expect(tarjeta(page, libre!.nombre)).toBeVisible();
    await expect(tarjeta(page, libre!.nombre)).toContainText(/\bkW\b/);
    await page.keyboard.press("Escape");
    const otro = (await puntos(page).evaluateAll((es) => es.map((e) => e.getAttribute("aria-label") ?? "")))
      .map((l) => l.replace(/ · [^·]+$/, ""))
      .find((n) => n !== libre!.nombre)!;
    await punto(page, otro).focus();
    await page.keyboard.press("Enter");
    await expect(tarjeta(page, otro)).toBeVisible();
  });

  test("E2E-10 · CA-07.1: el inicio (crecimiento, cifras y mini mapa) no cuenta el segmento", async ({ page }) => {
    await asegurarSiembra(page);
    const gran = (await aprobados()).filter((p) => !esMedidor(p));
    await page.goto("/");
    await expect(page.getByTestId("barra-crecimiento").first()).toBeVisible({ timeout: 60_000 });
    const h = await page.content();
    for (const n of Object.values(S)) expect(h, n).not.toContain(n);
    // Mini mapa: un punto por proyecto de gran escala con ubicación.
    const tarjetaImpl = page.getByRole("region", { name: "Secciones principales" }).locator("article").first();
    await expect(tarjetaImpl.getByTestId("punto-proyecto")).toHaveCount(gran.filter((p) => p.latitud !== null && p.longitud !== null).length);
    // Cifras: MW y MWh en operación de gran escala.
    const op = gran.filter((p) => p.estado === "En operación");
    const vMw = ((await page.getByRole("group", { name: "Potencia en operación [MW]" }).getByTestId("kpi-valor").textContent()) ?? "").trim();
    const vMwh = ((await page.getByRole("group", { name: "Energía en operación [MWh]" }).getByTestId("kpi-valor").textContent()) ?? "").trim();
    expect(Math.abs(num(vMw) - op.reduce((a, p) => a + (p.potencia_nominal_mw ?? 0), 0))).toBeLessThanOrEqual(0.05);
    expect(Math.abs(num(vMwh) - op.reduce((a, p) => a + (p.capacidad_maxima_mwh ?? 0), 0))).toBeLessThanOrEqual(0.05);
    // Crecimiento: los años de las barras no incluyen los de los sembrados que solo existen en el segmento.
    const anios = await page
      .getByRole("table", { name: "Crecimiento del almacenamiento [MW acumulados]" })
      .locator("tbody tr")
      .evaluateAll((trs) => trs.map((tr) => tr.children[0]?.textContent?.trim() ?? ""));
    const { data } = await admin().from("proyectos").select("fpo,estado").eq("publicacion", "Aprobado").not("tipo_uso_conexion", "ilike", `%${MEDIDOR}%`);
    const { data: sinServicio } = await admin().from("proyectos").select("fpo,estado").eq("publicacion", "Aprobado").is("tipo_uso_conexion", null);
    const aniosGran = [...new Set([...(data ?? []), ...(sinServicio ?? [])].filter((p) => p.estado !== "Inactivo" && /^\d{4}$/.test(String(p.fpo ?? "").slice(0, 4))).map((p) => String(p.fpo).slice(0, 4)))].sort();
    expect(anios).toEqual(aniosGran);
  });

  test("E2E-12b · CA-09.3: la descarga de «Detrás del medidor» trae las columnas de hoy, solo el segmento y su fuente", async ({ page }) => {
    await asegurarSiembra(page);
    const seg = (await aprobados()).filter(esMedidor);
    await abrirMapa(page, Q_MEDIDOR);
    await expect(tabla(page)).toBeVisible();
    const { cab, datos } = registrosCsv(await descargarCsvVista(page));
    expect(normalizar(cab)).toEqual(normalizar(cabeceraDeHoy()));
    expect(datos.map((d) => d[0]).sort()).toEqual(seg.map((p) => p.nombre).sort());
    const iFuente = normalizar(cab).indexOf("Fuente");
    for (const d of datos) expect(d[iFuente].trim(), `${d[0]} con fuente`).not.toBe("");
    for (const n of Object.values(S)) expect(datos.find((d) => d[0] === n)![iFuente]).toBe(TEXTO);
  });

  test("E2E-13a · CA-02.1: /admin aprueba un aporte con el servicio nuevo", async ({ page, context }) => {
    test.setTimeout(5 * 60_000);
    await exigir0007();
    const nombre = N("aporte-medidor");
    const a = await sembrarAporte({
      tipo: "Proyecto nuevo",
      descripcion: nombre,
      datos: { ...proyectoPrueba({ nombre, tipo_uso_conexion: MEDIDOR, potencia_nominal_mw: 0.02, capacidad_maxima_mwh: 0.05 }), publicacion: undefined },
      fuente: "https://ejemplo.co/008-medidor",
      origen: "usuario",
    });
    await iniciarSesionEditor(context);
    await page.goto(`/admin/${a.id}`);
    const form = page.getByRole("form", { name: "Aprobar aporte" });
    await expect(form.getByRole("checkbox", { name: MEDIDOR })).toBeChecked({ timeout: 60_000 });
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Aprobar y publicar" }).click();
    await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 90_000 });
    const { data } = await admin().from("proyectos").select("publicacion,tipo_uso_conexion").eq("nombre", nombre).single();
    expect(data).toEqual({ publicacion: "Aprobado", tipo_uso_conexion: MEDIDOR });
  });

  test("E2E-14a · CA-09.1: /admin aprueba un aporte del segmento con fuente textual", async ({ page, context }) => {
    test.setTimeout(5 * 60_000);
    await exigir0007();
    const nombre = N("aporte-medidor-texto");
    const a = await sembrarAporte({
      tipo: "Proyecto nuevo",
      descripcion: nombre,
      datos: { ...proyectoPrueba({ nombre, tipo_uso_conexion: MEDIDOR, fuente: TEXTO, potencia_nominal_mw: 0.02, capacidad_maxima_mwh: 0.05 }), publicacion: undefined },
      fuente: TEXTO,
      origen: "usuario",
    });
    await iniciarSesionEditor(context);
    await page.goto(`/admin/${a.id}`);
    const form = page.getByRole("form", { name: "Aprobar aporte" });
    await expect(form.locator('[name="campo:fuente"]')).toHaveValue(TEXTO, { timeout: 60_000 });
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Aprobar y publicar" }).click();
    await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 90_000 });
    const { data } = await admin().from("proyectos").select("publicacion,fuente").eq("nombre", nombre).single();
    expect(data).toEqual({ publicacion: "Aprobado", fuente: TEXTO });
  });

  test("E2E-17b · RNF-01: /mapa a 375 px sin desplazamiento horizontal en «Detrás del medidor» con proyectos", async ({ page }) => {
    await asegurarSiembra(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await abrirMapa(page, Q_MEDIDOR);
    await expect(tabla(page)).toBeVisible();
    await esperarPuntos(page);
    await page.waitForTimeout(1500);
    const { scroll, ancho } = await sinDesplazamientoHorizontal(page);
    expect(scroll).toBeLessThanOrEqual(ancho);
  });

  test("E2E-18b · RNF-03: axe y teclado en «Detrás del medidor» con proyectos", async ({ page }) => {
    test.setTimeout(180_000);
    await asegurarSiembra(page);
    await abrirMapa(page, Q_MEDIDOR);
    await expect(tabla(page)).toBeVisible();
    await esperarPuntos(page);
    await page.waitForTimeout(1500);
    expect(await correrAxe(page)).toEqual([]);
    // Recorrido con Tab desde los botones de segmento hasta un punto del mapa; Enter abre la tarjeta.
    await boton(page, "Detrás del medidor").focus();
    let nombre = "";
    for (let i = 0; i < 60 && !nombre; i++) {
      await page.keyboard.press("Tab");
      const l = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
      const m = l.match(new RegExp(`^(.+) · (${["En operación", "En construcción", "Anunciado", "Inactivo"].join("|")})$`));
      if (m) nombre = m[1];
    }
    expect(nombre, "se llega a un punto con Tab").not.toBe("");
    await page.keyboard.press("Enter");
    await expect(tarjeta(page, nombre)).toBeVisible();
  });

  test("limpieza · borra lo sembrado", async () => {
    await limpiarTodo();
    const { count } = await admin().from("proyectos").select("id", { count: "exact", head: true }).like("nombre", `${PREFIJO}%`);
    expect(count).toBe(0);
  });
});
