// E2E de la spec 004 · Evolución normativa (/normativa).
// Escrito por el probador independiente a partir de spec.md y de la sección
// "Escenarios E2E" de plan.md, sin leer el código de producción.
// Corre contra la app local (`next start`) conectada al proyecto Supabase "pruebas".
// Los datos sembrados son ficticios, llevan el prefijo PREFIJO en el título y se borran al final.
import { test, expect, type Page, type Locator } from "@playwright/test";
import fs from "node:fs";
import { admin, iniciarSesionEditor, limpiarTodo, PREFIJO, sembrarAporte, vigilarConsola } from "./utilidades";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const T = (k: string) => `${PREFIJO}004-${k}`;
const ENLACE = (k: string) => `https://ejemplo.co/norma-${k}`;

type Norma = {
  id: string; fecha: string; precision_fecha?: string | null; emisor: string; tipo: string; numero: string;
  titulo: string; estado: string; resumen: string; explicacion: string; aplica_a: string;
  relacionada_con?: string | null; enlace: string; publicacion: string;
};
const norma = (k: string, n: Partial<Norma>): Norma => ({
  id: "", fecha: "", emisor: "", tipo: "", numero: "", estado: "Vigente",
  titulo: T(k), resumen: `Resumen de ${k}.`, explicacion: `Explicación en lenguaje claro de ${k}.`,
  aplica_a: `Desarrolladores de prueba ${k}`, enlace: ENLACE(k), publicacion: "Aprobado", precision_fecha: null, relacionada_con: null, ...n,
});

// ---------- Siembra (ficticia) ----------
// 6 normas aprobadas de 2019, 2022 y 2026 (CREG, CNO y XM); A cita a B; A y C tienen la
// misma fecha; F cita a P, que está pendiente; un estudio de Academia; D solo con mes y
// F solo con año (CA-04.3).
const N = {
  G: norma("creg-950", { id: "CREG-RES-E2E950-2026", fecha: "2026-08-20", emisor: "CREG", tipo: "Resolución", numero: "E2E 950", estado: "Modificada" }),
  C: norma("cno-1001", { id: "CNO-ACU-E2E1001-2026", fecha: "2026-03-15", emisor: "CNO", tipo: "Acuerdo", numero: "E2E 1001" }),
  A: norma("creg-901", { id: "CREG-RES-E2E901-2026", fecha: "2026-03-15", emisor: "CREG", tipo: "Resolución", numero: "E2E 901", relacionada_con: "CREG-RES-E2E098-2019" }),
  D: norma("xm-77", { id: "XM-DOC-E2E77-2022", fecha: "2022-09-01", precision_fecha: "Mes", emisor: "XM", tipo: "Documento", numero: "E2E 77", estado: "En consulta" }),
  F: norma("cno-1002", { id: "CNO-ACU-E2E1002-2022", fecha: "2022-01-01", precision_fecha: "Año", emisor: "CNO", tipo: "Acuerdo", numero: "E2E 1002", relacionada_con: "CREG-RES-E2E999-2026" }),
  B: norma("creg-098", { id: "CREG-RES-E2E098-2019", fecha: "2019-05-10", emisor: "CREG", tipo: "Resolución", numero: "E2E 098" }),
};
const P = norma("pendiente-999", { id: "CREG-RES-E2E999-2026", fecha: "2026-06-01", emisor: "CREG", tipo: "Resolución", numero: "E2E 999", publicacion: "Pendiente" });
const EST = norma("estudio", { id: "ACADEMIA-EST-E2E-2025", fecha: "2025-01-01", precision_fecha: "Año", emisor: "Academia", tipo: "Estudio", numero: "Documento de trabajo", aplica_a: `Universidad de prueba ${PREFIJO}` });
const SIEMBRA = [...Object.values(N), P, EST];
// Orden esperado (CA-01.1, CA-01.2 y aclaración 5: misma fecha → entidad alfabética y número).
const ORDEN = [N.G, N.C, N.A, N.D, N.F, N.B];
const etiqueta = (n: Norma) => `${n.tipo} ${n.emisor} ${n.numero} de ${n.fecha.slice(0, 4)}`;

/** Siembra (si hace falta) y espera a que /normativa muestre lo sembrado. Devuelve la espera en ms. */
async function asegurarSiembra(page: Page) {
  const { data } = await admin().from("normas").select("id,titulo,publicacion").like("titulo", `${PREFIJO}004-%`);
  const ok = (data ?? []).length === SIEMBRA.length && SIEMBRA.every((s) => (data ?? []).some((d) => d.id === s.id && d.titulo === s.titulo && d.publicacion === s.publicacion));
  if (!ok) {
    await limpiarTodo();
    const { error } = await admin().from("normas").insert(SIEMBRA);
    if (error) throw new Error("No se pudo sembrar normas: " + error.message);
  }
  const inicio = Date.now();
  for (;;) {
    const html = await (await page.request.get("/normativa")).text();
    if ([...ORDEN, EST].every((n) => html.includes(n.titulo))) return Date.now() - inicio;
    if (Date.now() - inicio > 7 * 60_000) throw new Error("Lo sembrado no apareció en /normativa en 7 min");
    await page.waitForTimeout(10_000);
  }
}

/** Normas aprobadas de la línea de tiempo (sin Academia) que no son de esta corrida. */
async function ajenas() {
  const { data } = await admin().from("normas").select("id,titulo,emisor").eq("publicacion", "Aprobado");
  return (data ?? []).filter((d) => !d.titulo.startsWith(PREFIJO) && d.emisor !== "Academia").map((d) => d.id);
}

// ---------- Localizadores ----------
const tarjeta = (page: Page, n: Norma) => page.getByRole("article", { name: etiqueta(n), exact: true });
const tarjetas = (page: Page) => page.getByRole("main").getByRole("region").filter({ has: page.getByRole("heading", { level: 2, name: /^\d{4}$/ }) }).getByRole("article");
const barraAnios = (page: Page) => page.getByRole("navigation", { name: "Ir al año" });
const conteo = (page: Page) => page.getByRole("status").filter({ hasText: /norma/ });
const botonDesplegar = (t: Locator) => t.getByRole("button").first();
const grupoFiltro = (page: Page, g: string) => page.getByRole("group", { name: g, exact: true });
const botonFiltro = (page: Page, g: string) => grupoFiltro(page, g).getByRole("button", { name: new RegExp(`^${esc(g)} `) });
const opcion = (page: Page, g: string, v: string) => grupoFiltro(page, g).getByRole("checkbox", { name: new RegExp(`^${esc(v)} \\(\\d+\\)$`) });

/** Plegador de los filtros. Rediseño 007 (RF-08): ya no es un <details>, sino el botón «Filtros»
 *  de la barra recogida (en todos los anchos); abierto = aria-expanded="true". */
const plegadorFiltros = (page: Page) => page.getByRole("button", { name: /^(Filtros|Ocultar filtros)/ });
const filtrosAbiertos = async (page: Page) => (await plegadorFiltros(page).getAttribute("aria-expanded")) === "true";

async function abrirFiltro(page: Page, g: string) {
  const b = botonFiltro(page, g);
  if (!(await b.isVisible())) {
    // En móvil los filtros van plegados: se abren primero.
    await plegadorFiltros(page).click();
  }
  if ((await b.getAttribute("aria-expanded")) !== "true") await b.click();
  await expect(b).toHaveAttribute("aria-expanded", "true");
}
async function cerrarFiltro(page: Page, g: string) {
  const b = botonFiltro(page, g);
  if ((await b.getAttribute("aria-expanded")) === "true") await page.keyboard.press("Escape");
  await expect(b).not.toHaveAttribute("aria-expanded", "true");
}
async function marcar(page: Page, g: string, v: string) {
  await abrirFiltro(page, g);
  await opcion(page, g, v).check();
  await cerrarFiltro(page, g);
}

async function abrir(page: Page, query = "") {
  await page.goto(`/normativa${query}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 60_000 });
}

/** Títulos sembrados visibles en la línea de tiempo, en orden. */
async function titulosLinea(page: Page) {
  const textos = await tarjetas(page).getByRole("heading", { level: 3 }).allInnerTexts();
  return textos.map((t) => t.trim());
}

function soloEscritorio() { test.skip(test.info().project.name !== "escritorio", "Escenario de datos: solo escritorio"); }
function soloMovil() { test.skip(test.info().project.name !== "movil-375", "Escenario de 375 px"); }

test.beforeEach(async ({ page, context }) => {
  // El enlace oficial de prueba (ejemplo.co) no sale a internet.
  await context.route("https://ejemplo.co/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<title>doc</title>ok" }));
  await page.addInitScript(() => {
    const poner = () => { const st = document.createElement("style"); st.textContent = "nextjs-portal{display:none!important}"; document.head.appendChild(st); };
    if (document.head) poner(); else document.addEventListener("DOMContentLoaded", poner);
  });
});

test.afterAll(async () => {
  if (test.info().project.name === "movil-375") await limpiarTodo();
});

test.describe("004 · Evolución normativa (datos)", () => {
  test.beforeEach(async ({ page }) => {
    if (test.info().project.name !== "escritorio") return;
    test.setTimeout(10 * 60_000);
    const espera = await asegurarSiembra(page);
    test.info().annotations.push({ type: "espera-siembra-ms", description: String(espera) });
    test.setTimeout(espera + 4 * 60_000);
    const otras = await ajenas();
    if (otras.length) test.info().annotations.push({ type: "normas-aprobadas-ajenas", description: otras.join(", ") });
    expect(otras, "el entorno de pruebas no tiene otras normas aprobadas (las cuentas dependen de ello)").toEqual([]);
  });

  test("E2E-01 · CA-01.1, CA-01.2: una sola lista de la más reciente a la más antigua; misma fecha por entidad y número", async ({ page }) => {
    soloEscritorio();
    const errores = vigilarConsola(page);
    await abrir(page);
    expect(await titulosLinea(page)).toEqual(ORDEN.map((n) => n.titulo));
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("E2E-02 · CA-02.1: separadores 2026, 2022 y 2019, cada uno antes de sus normas", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const seps = page.getByRole("main").getByRole("heading", { level: 2, name: /^\d{4}$/ });
    await expect(seps).toHaveText(["2026", "2022", "2019"]);
    for (const [anio, ns] of [["2026", [N.G, N.C, N.A]], ["2022", [N.D, N.F]], ["2019", [N.B]]] as const) {
      const reg = page.getByRole("region", { name: anio, exact: true });
      const tit = (await reg.getByRole("article").getByRole("heading", { level: 3 }).allInnerTexts()).map((t) => t.trim());
      expect(tit, `normas bajo ${anio}`).toEqual(ns.map((n) => n.titulo));
      // El separador va antes de sus normas.
      const ySep = (await reg.getByRole("heading", { level: 2 }).boundingBox())!.y;
      const yPrim = (await reg.getByRole("article").first().boundingBox())!.y;
      expect(ySep, `separador ${anio} antes de sus normas`).toBeLessThan(yPrim);
    }
    // El estudio (2025) no crea separador.
    await expect(page.getByRole("region", { name: "2025", exact: true })).toHaveCount(0);
  });

  test("E2E-03 · CA-03.1: «2019» en la barra de años lleva al separador de 2019 sin cambiar los filtros de la URL", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const antes = new URL(page.url());
    await barraAnios(page).getByRole("link", { name: "2019", exact: true }).click();
    const sep = page.getByRole("heading", { level: 2, name: "2019", exact: true });
    await expect(sep).toBeInViewport({ timeout: 5000 });
    const despues = new URL(page.url());
    expect(despues.pathname).toBe(antes.pathname);
    expect(despues.search, "la URL no cambia los filtros").toBe(antes.search);
    // Sin filtros, la barra lista los tres años.
    await expect(barraAnios(page).getByRole("link")).toHaveText(["2026", "2022", "2019"]);
  });

  test("E2E-04 · CA-03.2: con entidad = CNO, la barra de años solo tiene años con acuerdos del CNO", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    await marcar(page, "Entidad", "CNO");
    await expect(barraAnios(page).getByRole("link")).toHaveText(["2026", "2022"]);
  });

  test("E2E-05 · CA-04.1, CA-04.2: tarjeta plegada completa; cada entidad con color propio y nombre escrito", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const t = tarjeta(page, N.A);
    await expect(t).toBeVisible();
    await expect(t.locator("time")).toHaveText("15/03/2026");
    await expect(t).toContainText("CREG");
    await expect(t).toContainText("Resolución");
    await expect(t).toContainText("E2E 901");
    await expect(t.getByRole("heading", { level: 3 })).toHaveText(N.A.titulo);
    await expect(t).toContainText("Vigente");
    await expect(t).toContainText(N.A.resumen);
    await expect(t.getByText(N.A.explicacion)).toBeHidden();
    // Estado de las demás (Modificada, En consulta).
    await expect(tarjeta(page, N.G)).toContainText("Modificada");
    await expect(tarjeta(page, N.D)).toContainText("En consulta");

    // Color por entidad: colores de fondo o borde propios de la tarjeta (franja, insignia…),
    // sin contar el blanco ni el gris del borde general.
    const estilo = async (n: Norma) => {
      const t = tarjeta(page, n);
      await expect(t.getByText(n.emisor, { exact: true }).first(), `nombre de ${n.emisor} escrito`).toBeVisible();
      return t.evaluate((art) => {
        const vistos = new Set<string>();
        for (const el of [art, ...art.querySelectorAll("*")]) {
          const s = getComputedStyle(el as HTMLElement);
          if ((el as HTMLElement).offsetParent === null && el !== art) continue;
          const f = s.backgroundColor;
          if (f !== "rgba(0, 0, 0, 0)" && f !== "rgb(255, 255, 255)") vistos.add(`fondo ${f}`);
        }
        return [...vistos].sort().join(" + ") || "sin color propio";
      });
    };
    const colores = { CREG: await estilo(N.A), CNO: await estilo(N.C), XM: await estilo(N.D) };
    test.info().annotations.push({ type: "colores-entidad", description: JSON.stringify(colores) });
    expect(new Set(Object.values(colores)).size, "cada entidad con color propio").toBe(3);
    // La misma entidad usa el mismo color en otra tarjeta.
    expect(await estilo(N.B)).toBe(colores.CREG);
  });

  test("E2E-05b · CA-04.3: mes y año o solo año, sin día inventado, en la tarjeta; ordena como el día 1", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    await expect(tarjeta(page, N.D).locator("time")).toHaveText("septiembre de 2022");
    await expect(tarjeta(page, N.F).locator("time")).toHaveText("2022");
    // Orden: D (1/09/2022) antes de F (1/01/2022), ya comprobado en E2E-01; aquí, solo 2022.
    const reg = page.getByRole("region", { name: "2022", exact: true });
    expect((await reg.getByRole("heading", { level: 3 }).allInnerTexts()).map((s) => s.trim())).toEqual([N.D.titulo, N.F.titulo]);
  });

  test("E2E-06 · CA-05.1, CA-05.2: al desplegar se ven explicación, «Aplica a», relacionadas y el enlace oficial abre en pestaña nueva", async ({ page, context }) => {
    soloEscritorio();
    await abrir(page);
    const t = tarjeta(page, N.A);
    await botonDesplegar(t).click();
    await expect(t.getByText(N.A.explicacion)).toBeVisible();
    await expect(t.getByText("Aplica a", { exact: true })).toBeVisible();
    await expect(t.getByText(N.A.aplica_a)).toBeVisible();
    await expect(t.getByText(/Normas relacionadas/)).toBeVisible();
    await expect(t.getByRole("link", { name: etiqueta(N.B) })).toBeVisible();
    const oficial = t.getByRole("link", { name: /Ver documento oficial/ });
    await expect(oficial).toHaveAttribute("target", "_blank");
    const [nueva] = await Promise.all([context.waitForEvent("page"), oficial.click()]);
    await nueva.waitForLoadState();
    expect(nueva.url()).toBe(N.A.enlace);
    expect(page.url(), "la página original sigue en /normativa").toMatch(/\/normativa/);
    await nueva.close();
  });

  test("E2E-07 · CA-05.3: con el teclado se despliega y se pliega; el control anuncia su estado", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const t = tarjeta(page, N.G);
    const b = botonDesplegar(t);
    // Llegar con Tab desde el control anterior de la página.
    await page.getByRole("navigation", { name: "Ir al año" }).getByRole("link").last().focus();
    let llego = false;
    for (let i = 0; i < 30 && !llego; i++) {
      await page.keyboard.press("Tab");
      llego = await b.evaluate((el) => el === document.activeElement);
    }
    expect(llego, "se llega con Tab al control de la primera norma").toBe(true);
    await expect(b).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(b).toHaveAttribute("aria-expanded", "true");
    await expect(t.getByText(N.G.explicacion)).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(b).toHaveAttribute("aria-expanded", "false");
    await expect(t.getByText(N.G.explicacion)).toBeHidden();
    await page.keyboard.press("Space");
    await expect(b).toHaveAttribute("aria-expanded", "true");
    await expect(t.getByText(N.G.explicacion)).toBeVisible();
    await page.keyboard.press("Space");
    await expect(b).toHaveAttribute("aria-expanded", "false");
  });

  test("E2E-08 · CA-06.1: el enlace a la relacionada lleva a su tarjeta y la muestra desplegada", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const a = tarjeta(page, N.A);
    await botonDesplegar(a).click();
    await a.getByRole("link", { name: etiqueta(N.B) }).click();
    const b = tarjeta(page, N.B);
    await expect(b).toBeInViewport({ timeout: 5000 });
    await expect(botonDesplegar(b)).toHaveAttribute("aria-expanded", "true");
    await expect(b.getByText(N.B.explicacion)).toBeVisible();
  });

  test("E2E-09 · CA-06.2: una relacionada no publicada se ve como texto (tipo, número y año), sin enlace", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const f = tarjeta(page, N.F);
    await botonDesplegar(f).click();
    await expect(f.getByText(/Normas relacionadas/)).toBeVisible();
    const item = f.getByRole("listitem").filter({ hasText: /999/ });
    await expect(item, "la relacionada no publicada aparece en la lista").toHaveCount(1);
    const texto = (await item.innerText()).trim();
    test.info().annotations.push({ type: "relacionada-no-publicada", description: texto });
    expect(texto).toMatch(/Resoluci[oó]n/);
    expect(texto).toMatch(/CREG/);
    expect(texto).toMatch(/E2E ?999/);
    expect(texto).toMatch(/2026/);
    await expect(item.getByRole("link")).toHaveCount(0);
    // Y no deja ver datos de la norma pendiente.
    expect(await page.content()).not.toContain(P.titulo);
  });

  test("E2E-10 · CA-07.1: cada opción del filtro de entidad muestra su conteo", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    await abrirFiltro(page, "Entidad");
    const opciones = grupoFiltro(page, "Entidad").getByRole("group", { name: "Opciones de Entidad" }).getByRole("checkbox");
    const nombres = (await opciones.evaluateAll((es) => es.map((e) => e.getAttribute("aria-label") ?? (e as HTMLInputElement).labels?.[0]?.textContent ?? ""))).map((s) => s.trim());
    const snap = await grupoFiltro(page, "Entidad").ariaSnapshot();
    test.info().annotations.push({ type: "filtro-entidad", description: snap });
    await expect(opcion(page, "Entidad", "CREG")).toHaveAccessibleName("CREG (3)");
    await expect(opcion(page, "Entidad", "CNO")).toHaveAccessibleName("CNO (2)");
    await expect(opcion(page, "Entidad", "XM")).toHaveAccessibleName("XM (1)");
    expect(nombres.length).toBeGreaterThanOrEqual(3);
    // Observación (sin CA): el desplegable menciona «Proyectos», texto propio de /mapa.
    test.info().annotations.push({ type: "observacion-proyectos", description: /Proyectos/.test(snap) ? "el desplegable muestra «Todas Proyectos»" : "no" });
  });

  test("E2E-11 · CA-07.2, CA-07.3: CREG + Vigente deja solo CREG vigentes; «Limpiar filtros» devuelve todas", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    await marcar(page, "Entidad", "CREG");
    await marcar(page, "Estado", "Vigente");
    await expect.poll(() => titulosLinea(page)).toEqual([N.A.titulo, N.B.titulo]);
    await page.getByRole("button", { name: "Limpiar filtros" }).click();
    await expect.poll(() => titulosLinea(page)).toEqual(ORDEN.map((n) => n.titulo));
    if (!(await filtrosAbiertos(page))) await plegadorFiltros(page).click(); // 007: panel recogido
    await expect(botonFiltro(page, "Entidad")).toHaveAccessibleName(/Todas/);
    await expect(botonFiltro(page, "Estado")).toHaveAccessibleName(/Todas/);
  });

  test("E2E-12 · CA-08.1: la URL con filtros reproduce filtros y resultado en otra pestaña", async ({ page, context }) => {
    soloEscritorio();
    await abrir(page);
    await marcar(page, "Entidad", "CNO");
    await marcar(page, "Año", "2022");
    await expect.poll(() => titulosLinea(page)).toEqual([N.F.titulo]);
    const url = page.url();
    test.info().annotations.push({ type: "url", description: url });
    const otra = await context.newPage();
    await otra.goto(url);
    await expect(otra.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(botonFiltro(otra, "Entidad")).toHaveAccessibleName(/CNO/);
    await expect(botonFiltro(otra, "Año")).toHaveAccessibleName(/2022/);
    await expect.poll(() => titulosLinea(otra)).toEqual([N.F.titulo]);
    await abrirFiltro(otra, "Entidad");
    await expect(opcion(otra, "Entidad", "CNO")).toBeChecked();
    await otra.close();
  });

  test("E2E-13 · CA-09.1: sin resultados se lee «Ninguna norma cumple estos filtros» y la barra de años queda vacía", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    // XM solo tiene un documento «En consulta»: XM + Vigente no deja nada.
    await marcar(page, "Entidad", "XM");
    await abrirFiltro(page, "Estado");
    const vig = opcion(page, "Estado", "Vigente");
    if (await vig.count()) {
      await vig.check();
      await cerrarFiltro(page, "Estado");
    } else {
      test.info().annotations.push({ type: "via", description: "la opción Vigente desaparece con XM; se usa la URL" });
      await abrir(page, "?entidad=XM&estado=Vigente");
    }
    await expect(page.getByText("Ninguna norma cumple estos filtros")).toBeVisible();
    await expect(tarjetas(page)).toHaveCount(0);
    await expect(barraAnios(page).getByRole("link")).toHaveCount(0);
  });

  test("E2E-14 · CA-10.1: «3 normas» con tres resultados y «1 norma» con uno", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    await expect(conteo(page)).toHaveText("6 normas");
    await marcar(page, "Entidad", "CREG");
    await expect(conteo(page)).toHaveText("3 normas");
    await page.getByRole("button", { name: "Limpiar filtros" }).click();
    await marcar(page, "Entidad", "XM");
    await expect(conteo(page)).toHaveText("1 norma");
  });

  test("E2E-15 · CA-11.1: /normativa no ofrece descargas CSV, con o sin filtros (cambio del 2026-10-25)", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    await expect(page.getByRole("button", { name: /Descargar CSV/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Descargar datos completos/ })).toHaveCount(0);
    await marcar(page, "Entidad", "CNO");
    await expect(conteo(page)).toHaveText("2 normas");
    await expect(page.getByRole("button", { name: /Descargar/ })).toHaveCount(0);
  });

  test("E2E-16 · CA-12.1: el estudio está en «Documentos de referencia», fuera de la línea, con o sin filtro", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const ref = page.getByRole("region", { name: "Documentos de referencia" });
    const revisar = async () => {
      await expect(ref).toBeVisible();
      await expect(ref).toContainText(EST.titulo);
      await expect(ref).toContainText(EST.aplica_a);
      await expect(ref).toContainText("2025");
      await expect(ref).toContainText(EST.resumen);
      const enlace = ref.getByRole("link").filter({ hasText: /./ });
      const hrefs = await enlace.evaluateAll((es) => es.map((e) => e.getAttribute("href")));
      expect(hrefs).toContain(EST.enlace);
      expect(await titulosLinea(page), "el estudio no está en la línea de tiempo").not.toContain(EST.titulo);
      // Debajo de la línea de tiempo.
      const yRef = (await ref.boundingBox())!.y;
      const ultima = tarjetas(page).last();
      if (await ultima.count()) expect(yRef).toBeGreaterThan((await ultima.boundingBox())!.y);
    };
    await revisar();
    await marcar(page, "Entidad", "XM");
    await expect(conteo(page)).toHaveText("1 norma");
    await revisar();
    // Con un filtro sin resultados también sigue ahí.
    await abrir(page, "?entidad=XM&estado=Vigente");
    await revisar();
    // Academia no es una opción de entidad de la línea de tiempo (observación).
    await abrir(page);
    await abrirFiltro(page, "Entidad");
    test.info().annotations.push({ type: "academia-en-filtro", description: String(await opcion(page, "Entidad", "Academia").count()) });
  });

  test("E2E-17 · CA-13.1: la norma pendiente no aparece en la página", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const html = await page.content();
    expect(html).not.toContain(P.titulo);
    expect(html).not.toContain(`Resumen de pendiente-999`);
    expect(await titulosLinea(page), "solo las seis aprobadas").toEqual(ORDEN.map((n) => n.titulo));
  });

  test("E2E-18 · CA-14.1: en /admin se ven las normas de la carga inicial como aportes Norma pendientes de origen agente, con enlace oficial, y no están en /normativa", async ({ page, context }) => {
    soloEscritorio();
    const { data: pend } = await admin().from("aportes").select("id,datos,fuente,origen").eq("tipo", "Norma").eq("publicacion", "Pendiente").not("descripcion", "like", `${PREFIJO}%`);
    test.info().annotations.push({ type: "aportes-norma-pendientes", description: String((pend ?? []).length) });
    expect((pend ?? []).length, "hay aportes de la carga inicial").toBeGreaterThan(0);
    await iniciarSesionEditor(context);
    await page.goto("/admin");
    const tabla = page.getByRole("table");
    await expect(tabla).toBeVisible({ timeout: 60_000 });
    const problemas: string[] = [];
    for (const a of pend ?? []) {
      const fila = tabla.getByRole("row").filter({ has: page.getByRole("cell", { name: String(a.id), exact: true }) });
      if ((await fila.count()) !== 1) { problemas.push(`${a.id}: no está en la lista`); continue; }
      const txt = await fila.innerText();
      if (!/Norma/.test(txt)) problemas.push(`${a.id}: tipo no es Norma`);
      if (!/Agente/i.test(txt)) problemas.push(`${a.id}: origen no es agente`);
      const enlace = (a.datos as { enlace?: string })?.enlace ?? a.fuente;
      const hrefs = await fila.getByRole("link").evaluateAll((es) => es.map((e) => e.getAttribute("href")));
      if (!hrefs.some((h) => h && enlace && enlace.split(" ")[0].startsWith(h.replace(/\/$/, "")))) problemas.push(`${a.id}: sin el enlace oficial (${enlace})`);
    }
    // Detalle de un aporte: muestra el enlace oficial.
    const primero = (pend ?? [])[0];
    await page.goto(`/admin/${primero.id}`);
    await expect(page.getByText("Cargando aporte…")).toBeHidden({ timeout: 60_000 });
    const det = await page.getByRole("main").innerText();
    const enl = (primero.datos as { enlace?: string }).enlace!;
    if (!det.includes(enl) && !(await page.locator(`a[href="${enl}"], input[value="${enl}"], textarea`).count())) problemas.push(`detalle ${primero.id}: no muestra el enlace oficial`);
    await page.screenshot({ path: test.info().outputPath("admin-detalle-norma.png"), fullPage: true });
    // Ninguna está en /normativa.
    const html = await (await page.request.get("/normativa")).text();
    for (const a of pend ?? []) {
      const d = a.datos as { titulo?: string };
      if (d.titulo && html.includes(d.titulo)) problemas.push(`${a.id}: ya aparece en /normativa`);
    }
    test.info().annotations.push({ type: "problemas", description: problemas.join("; ") || "ninguno" });
    expect(problemas).toEqual([]);
  });

  test("E2E-19 · CA-15.1: «Proponer corrección» abre /aportar con tipo Corrección y la norma indicada", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const t = tarjeta(page, N.C);
    await botonDesplegar(t).click();
    await t.getByRole("link", { name: "Proponer corrección" }).click();
    await expect(page).toHaveURL(/\/aportar/, { timeout: 30_000 });
    const tipo = page.getByRole("combobox", { name: "Tipo de aporte" });
    await expect(tipo).toBeVisible({ timeout: 20_000 });
    expect(await tipo.evaluate((s: HTMLSelectElement) => s.selectedOptions[0]?.textContent?.trim())).toBe("Corrección");
    const reg = page.getByRole("textbox", { name: /Registro que se corrige/ });
    const valor = await reg.inputValue();
    test.info().annotations.push({ type: "registro", description: valor });
    expect(valor === N.C.id || valor.includes(N.C.id) || valor.includes("E2E 1001"), `registro afectado indica la norma (${valor})`).toBe(true);
  });

  test("E2E-21 · CA-17.1: la tarjeta «Evolución normativa de los SAEB» del inicio y el menú llevan a la línea de tiempo", async ({ page }) => {
    soloEscritorio();
    await page.goto("/");
    await page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: /Evolución normativa de los SAEB/ }).click();
    await expect(page).toHaveURL(/\/normativa$/);
    await expect(page.getByText(/Sección en construcción/)).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Ir al año" })).toBeVisible();
    await expect(tarjetas(page).first()).toBeVisible();
    await page.goto("/");
    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Normativa" }).click();
    await expect(page).toHaveURL(/\/normativa$/);
    await expect(page.getByText(/Sección en construcción/)).toHaveCount(0);
    await expect(tarjetas(page).first()).toBeVisible();
  });

  test("E2E-22b · RNF-01 (escritorio): las tarjetas se alternan a cada lado del eje", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const xs: number[] = [];
    const todas = tarjetas(page);
    for (let i = 0; i < (await todas.count()); i++) xs.push(Math.round((await todas.nth(i).boundingBox())!.x));
    test.info().annotations.push({ type: "x-tarjetas", description: xs.join(", ") });
    const lados = new Set(xs);
    expect(lados.size, "dos posiciones horizontales (a cada lado del eje)").toBe(2);
    // Alternan: dos consecutivas no van al mismo lado (dentro de cada año).
    const alternan = xs.every((x, i) => i === 0 || x !== xs[i - 1]);
    expect.soft(alternan, `alternancia consecutiva (${xs.join(", ")})`).toBe(true);
  });
  test("E2E-20 · CA-16.1: al aprobar en /admin una norma pendiente, aparece en /normativa en ≤ 5 min", async ({ page, context }) => {
    soloEscritorio();
    test.setTimeout(10 * 60_000);
    const Q = norma("aprobada-admin", { id: "CREG-RES-E2E777-2026", fecha: "2026-07-01", emisor: "CREG", tipo: "Resolución", numero: "E2E 777" });
    const { publicacion: _p, ...datos } = Q;
    void _p;
    const a = await sembrarAporte({ tipo: "Norma", descripcion: T("aporte-norma"), datos, fuente: Q.enlace, origen: "agente", agente: `${PREFIJO}agente` });
    try {
      await iniciarSesionEditor(context);
      await page.goto(`/admin/${a.id}`);
      const aprobar = page.getByRole("button", { name: "Aprobar y publicar" });
      await expect(aprobar).toBeVisible({ timeout: 60_000 });
      await page.waitForLoadState("networkidle");
      await aprobar.click();
      await expect(page).toHaveURL(/\/admin$/, { timeout: 60_000 });
      const aprobadoEn = Date.now();
      const { data: ap } = await admin().from("aportes").select("publicacion").eq("id", a.id).single();
      expect(ap!.publicacion).toBe("Aprobado");
      let visto = -1;
      while (Date.now() - aprobadoEn <= 5 * 60_000) {
        const html = await (await page.request.get("/normativa")).text();
        if (html.includes(Q.titulo)) { visto = Date.now() - aprobadoEn; break; }
        await page.waitForTimeout(10_000);
      }
      test.info().annotations.push({ type: "tiempo-publicacion", description: visto < 0 ? "no apareció en 5 min" : `${Math.round(visto / 1000)} s` });
      expect(visto, "la norma aprobada aparece en ≤ 5 min").toBeGreaterThanOrEqual(0);
      await abrir(page);
      await expect(tarjeta(page, Q)).toBeVisible();
    } finally {
      await admin().from("normas").delete().eq("id", Q.id);
    }
  });

});

test.describe("004 · Evolución normativa (375 px y RNF)", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(10 * 60_000);
    const espera = await asegurarSiembra(page);
    test.setTimeout(espera + 4 * 60_000);
  });

  test("E2E-22 · RNF-01, RNF-03, RNF-06: a 375 px con movimiento reducido: una columna, sin desborde, filtros plegados, salto inmediato y consola limpia", async ({ page }) => {
    soloMovil();
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errores = vigilarConsola(page);
    await abrir(page);
    await page.waitForTimeout(1000);
    const desborde = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await desborde(), "sin desplazamiento horizontal").toBeLessThanOrEqual(0);
    // Filtros plegados: los desplegables de filtro no están a la vista.
    await expect(botonFiltro(page, "Entidad"), "filtros plegados en móvil").toBeHidden();
    const plegador = plegadorFiltros(page);
    await expect(plegador).toBeVisible();
    expect(await filtrosAbiertos(page), "filtros plegados").toBe(false);
    // Una sola columna: todas las tarjetas comparten x y caben en 375 px.
    const cajas = [];
    for (const n of ORDEN) cajas.push((await tarjeta(page, n).boundingBox())!);
    const xs = new Set(cajas.map((c) => Math.round(c.x)));
    test.info().annotations.push({ type: "cajas", description: cajas.map((c) => `${Math.round(c.x)}+${Math.round(c.width)}`).join(", ") });
    expect(xs.size, "una sola columna").toBe(1);
    for (const c of cajas) expect(c.x + c.width).toBeLessThanOrEqual(375);
    // Sin animaciones al aparecer.
    const anims = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
    expect(anims, "sin animaciones en curso al cargar").toBe(0);
    // Desplegar: aparece de inmediato, sin animación.
    const t = tarjeta(page, N.A);
    await botonDesplegar(t).click();
    const recien = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => (a as CSSAnimation).animationName ?? a.constructor.name));
    expect(recien, "sin animaciones al desplegar").toEqual([]);
    expect(await desborde(), "sin desborde con una tarjeta desplegada").toBeLessThanOrEqual(0);
    // Salto de año inmediato: la posición final se alcanza sin desplazamiento animado.
    await page.evaluate(() => window.scrollTo(0, 0));
    await barraAnios(page).getByRole("link", { name: "2019", exact: true }).click();
    const y1 = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(1200);
    const y2 = await page.evaluate(() => window.scrollY);
    test.info().annotations.push({ type: "salto", description: `scrollY tras el clic ${y1}, 1,2 s después ${y2}` });
    expect(y1, "el salto es inmediato (sin desplazamiento suave)").toBe(y2);
    await expect(page.getByRole("heading", { level: 2, name: "2019", exact: true })).toBeInViewport();
    // Filtros al abrirlos: siguen sin desborde.
    await plegador.click();
    await expect(botonFiltro(page, "Entidad")).toBeVisible();
    expect(await desborde()).toBeLessThanOrEqual(0);
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("E2E-23 · RNF-04: axe sin violaciones (plegada y desplegada) y foco visible al recorrer con Tab", async ({ page }) => {
    const axe = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
    await abrir(page);
    await page.waitForTimeout(1000);
    const correrAxe = async () => {
      await page.addScriptTag({ content: axe });
      return page.evaluate(async () => {
        // @ts-expect-error axe inyectado
        const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
        return r.violations.map((v: { id: string; impact: string; nodes: { target: string[] }[] }) => `${v.id} (${v.impact}) en ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join("; ")}`);
      });
    };
    const v1 = await correrAxe();
    await botonDesplegar(tarjeta(page, N.A)).click();
    const v2 = await correrAxe();
    await abrirFiltro(page, "Entidad");
    const v3 = await correrAxe();
    await page.keyboard.press("Escape");
    test.info().annotations.push({ type: "axe", description: JSON.stringify({ plegada: v1, desplegada: v2, filtro: v3 }) });
    expect.soft([...v1, ...v2, ...v3], "sin violaciones de axe").toEqual([]);

    // Foco visible: cada elemento al que se llega con Tab tiene contorno o sombra.
    await abrir(page);
    const sinFoco: string[] = [];
    const vistos = new Set<string>();
    for (let i = 0; i < 45; i++) {
      await page.keyboard.press("Tab");
      const r = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        if (!a || a === document.body) return null;
        const s = getComputedStyle(a);
        const visible = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== "none");
        return { id: `${a.tagName}|${(a.getAttribute("aria-label") ?? a.innerText ?? "").trim().slice(0, 40)}`, visible };
      });
      if (!r) continue;
      if (vistos.has(r.id)) continue;
      vistos.add(r.id);
      if (!r.visible) sinFoco.push(r.id);
    }
    test.info().annotations.push({ type: "foco", description: `${vistos.size} elementos; sin foco visible: ${sinFoco.join(" · ") || "ninguno"}` });
    expect(sinFoco, "foco visible en todo lo que se alcanza con Tab").toEqual([]);
  });

  test("E2E-24 · RNF-05: LCP local de /normativa (indicativo; la medición en el sitio publicado no se hace)", async ({ browser }) => {
    soloEscritorio();
    const medidas: number[] = [];
    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true, locale: "es-CO" });
      const p = await ctx.newPage();
      const cdp = await ctx.newCDPSession(p);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await p.addInitScript(() => {
        const w = window as unknown as { __lcp: number };
        w.__lcp = 0;
        new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      });
      await p.goto("/normativa", { waitUntil: "load", timeout: 120_000 });
      await p.waitForTimeout(3000);
      medidas.push(await p.evaluate(() => (window as unknown as { __lcp: number }).__lcp));
      await ctx.close();
    }
    const mediana = [...medidas].sort((a, b) => a - b)[1];
    test.info().annotations.push({ type: "lcp-ms", description: `${medidas.map(Math.round).join(", ")} (mediana ${Math.round(mediana)})` });
    expect(mediana).toBeGreaterThan(0);
    expect(mediana).toBeLessThan(2500);
  });
});
