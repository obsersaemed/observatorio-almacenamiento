// E2E de la spec 005 · Noticias (/noticias).
// Escrito por el probador independiente a partir de spec.md y de la sección
// "Escenarios E2E" de plan.md, sin leer el código de producción.
// Corre contra la app local (`next start`) conectada al proyecto Supabase "pruebas".
// Los datos sembrados son ficticios, llevan el prefijo PREFIJO en el título y se borran al final.
import { test, expect, type Page, type Locator } from "@playwright/test";
import fs from "node:fs";
import { admin, iniciarSesionEditor, limpiarTodo, PREFIJO, sembrarAporte, vigilarConsola } from "./utilidades";

const T = (k: string) => `${PREFIJO}005-${k}`;
const ENLACE = (k: string) => `https://ejemplo.co/noticia-${k}`;

type Noticia = { fecha: string; titulo: string; medio: string; enlace: string; resumen: string; publicacion: string };
const noticia = (k: string, fecha: string, medio: string, publicacion = "Aprobado"): Noticia => ({
  fecha, titulo: T(k), medio, enlace: ENLACE(k), resumen: `Resumen propio de prueba sobre ${k}.`, publicacion,
});

// ---------- Siembra (ficticia) ----------
// 4 aprobadas de 2025 y 2026 (dos con la misma fecha) y 1 pendiente.
const N = {
  R: noticia("reciente", "2026-09-14", "Medio de prueba Uno"),
  A: noticia("alfa-misma-fecha", "2026-02-03", "Medio de prueba Dos"),
  B: noticia("beta-misma-fecha", "2026-02-03", "Medio de prueba Tres"),
  V: noticia("vieja", "2025-01-20", "Medio de prueba Cuatro"),
};
const P = noticia("pendiente", "2026-05-05", "Medio de prueba Cinco", "Pendiente");
const SIEMBRA = [...Object.values(N), P];
// Orden esperado (CA-01.1 y CA-01.2: misma fecha → título alfabético).
const ORDEN = [N.R, N.A, N.B, N.V];
const ddmmaaaa = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)}`;
const TEXTO_FINAL = "Si quieres saber más sobre esta noticia, haz clic en el enlace";

async function htmlNoticias(page: Page) {
  return (await page.request.get("/noticias")).text();
}

/** Siembra (si hace falta) y espera a que /noticias muestre lo sembrado. Devuelve la espera en ms. */
async function asegurarSiembra(page: Page) {
  const { data } = await admin().from("noticias").select("titulo,publicacion").like("titulo", `${PREFIJO}005-%`);
  const ok = (data ?? []).length === SIEMBRA.length && SIEMBRA.every((s) => (data ?? []).some((d) => d.titulo === s.titulo && d.publicacion === s.publicacion));
  if (!ok) {
    await limpiarTodo();
    const { error } = await admin().from("noticias").insert(SIEMBRA);
    if (error) throw new Error("No se pudo sembrar noticias: " + error.message);
  }
  const inicio = Date.now();
  for (;;) {
    const html = await htmlNoticias(page);
    if (ORDEN.every((n) => html.includes(n.titulo))) return Date.now() - inicio;
    if (Date.now() - inicio > 7 * 60_000) throw new Error("Lo sembrado no apareció en /noticias en 7 min");
    await page.waitForTimeout(10_000);
  }
}

/** Noticias aprobadas que no son de esta corrida. */
async function ajenas() {
  const { data } = await admin().from("noticias").select("titulo").eq("publicacion", "Aprobado");
  return (data ?? []).filter((d) => !d.titulo.startsWith(PREFIJO)).map((d) => d.titulo);
}

async function abrir(page: Page) {
  await page.goto("/noticias");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 60_000 });
}

/** Tarjeta de una noticia: el artículo (o elemento de lista) que contiene su título. */
function tarjeta(page: Page, n: Noticia): Locator {
  return page.getByRole("main").locator("article, li").filter({ hasText: n.titulo }).last();
}

/** Orden de aparición de los títulos sembrados en el texto de la página. */
async function ordenEnPagina(page: Page, lista: Noticia[]) {
  const texto = await page.getByRole("main").innerText();
  return lista
    .map((n) => ({ t: n.titulo, i: texto.indexOf(n.titulo) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.t);
}

function soloEscritorio() { test.skip(test.info().project.name !== "escritorio", "Escenario de datos: solo escritorio"); }
function soloMovil() { test.skip(test.info().project.name !== "movil-375", "Escenario de 375 px"); }

test.beforeEach(async ({ page, context }) => {
  // Los enlaces de prueba (ejemplo.co) no salen a internet.
  await context.route("https://ejemplo.co/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<title>nota</title>ok" }));
  await page.addInitScript(() => {
    const poner = () => { const st = document.createElement("style"); st.textContent = "nextjs-portal{display:none!important}"; document.head.appendChild(st); };
    if (document.head) poner(); else document.addEventListener("DOMContentLoaded", poner);
  });
});

test.afterAll(async () => {
  if (test.info().project.name === "movil-375") await limpiarTodo();
});

// ---------- Sin noticias aprobadas (antes de sembrar) ----------
test.describe("005 · Noticias (vacía)", () => {
  test("E2E-05 · CA-04.1: sin noticias aprobadas se lee «Todavía no hay noticias publicadas»", async ({ page }) => {
    soloEscritorio();
    test.setTimeout(10 * 60_000);
    await limpiarTodo();
    const otras = await ajenas();
    test.skip(otras.length > 0, `El entorno tiene noticias aprobadas ajenas: ${otras.join(", ")}`);
    // La página se regenera cada cierto tiempo: se espera hasta 7 min a que refleje la base vacía.
    const inicio = Date.now();
    for (;;) {
      const html = await htmlNoticias(page);
      if (!html.includes(`${PREFIJO}005-`)) break;
      if (Date.now() - inicio > 7 * 60_000) throw new Error("/noticias sigue mostrando noticias sembradas tras 7 min");
      await page.waitForTimeout(10_000);
    }
    const errores = vigilarConsola(page);
    await abrir(page);
    await expect(page.getByText("Todavía no hay noticias publicadas")).toBeVisible();
    await expect(page.getByRole("main").getByText(TEXTO_FINAL)).toHaveCount(0);
    expect(errores, "consola sin errores").toEqual([]);
  });
});

// ---------- Con datos sembrados ----------
test.describe("005 · Noticias (datos)", () => {
  test.beforeEach(async ({ page }) => {
    if (test.info().project.name !== "escritorio") return;
    test.setTimeout(10 * 60_000);
    const espera = await asegurarSiembra(page);
    test.info().annotations.push({ type: "espera-siembra-ms", description: String(espera) });
    test.setTimeout(espera + 4 * 60_000);
    const otras = await ajenas();
    if (otras.length) test.info().annotations.push({ type: "noticias-aprobadas-ajenas", description: otras.join(", ") });
  });

  test("E2E-01 · CA-01.1, CA-01.2: de la más reciente a la más antigua; con la misma fecha, por título", async ({ page }) => {
    soloEscritorio();
    const errores = vigilarConsola(page);
    await abrir(page);
    expect(await ordenEnPagina(page, ORDEN)).toEqual(ORDEN.map((n) => n.titulo));
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("E2E-02 · CA-02.1: la tarjeta muestra fecha dd/mm/aaaa, medio, título y resumen", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    for (const n of ORDEN) {
      const t = tarjeta(page, n);
      await expect(t, `tarjeta de ${n.titulo}`).toBeVisible();
      await expect(t).toContainText(ddmmaaaa(n.fecha));
      await expect(t).toContainText(n.medio);
      await expect(t).toContainText(n.titulo);
      await expect(t).toContainText(n.resumen);
      // Una sola tarjeta por noticia: no contiene a las demás.
      for (const o of ORDEN) if (o !== n) await expect(t).not.toContainText(o.titulo);
    }
    // No se muestra la fecha en formato ISO.
    await expect(page.getByRole("main")).not.toContainText(N.R.fecha);
    await page.screenshot({ path: test.info().outputPath("noticias-escritorio.png"), fullPage: true });
  });

  test("E2E-03 · CA-03.1: al final de la tarjeta se lee «Si quieres saber más…» y el enlace abre la nota en una pestaña nueva", async ({ page, context }) => {
    soloEscritorio();
    await abrir(page);
    for (const n of ORDEN) {
      const t = tarjeta(page, n);
      await expect(t).toContainText(TEXTO_FINAL);
      const txt = (await t.innerText()).trim();
      const pos = txt.lastIndexOf("Si quieres saber más");
      expect(pos, "el texto está en la tarjeta").toBeGreaterThan(-1);
      expect(pos, "el texto va después del resumen").toBeGreaterThan(txt.indexOf(n.resumen));
      const enlace = t.locator(`a[href="${n.enlace}"]`);
      await expect(enlace, `enlace a ${n.enlace}`).toHaveCount(1);
      await expect(enlace).toHaveAttribute("target", "_blank");
    }
    const n = N.A;
    const [nueva] = await Promise.all([context.waitForEvent("page"), tarjeta(page, n).locator(`a[href="${n.enlace}"]`).click()]);
    await nueva.waitForLoadState();
    expect(nueva.url()).toBe(n.enlace);
    expect(page.url(), "la página de noticias sigue abierta").toMatch(/\/noticias$/);
    await nueva.close();
  });

  test("E2E-04 · CA-03.2: el nombre accesible de cada enlace incluye el título de su noticia y no hay dos iguales", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const problemas: string[] = [];
    for (const n of ORDEN) {
      const enlaces = page.getByRole("main").locator(`a[href="${n.enlace}"]`);
      for (let i = 0; i < (await enlaces.count()); i++) {
        const nombre = await enlaces.nth(i).evaluate((e) => {
          // Nombre accesible aproximado: aria-labelledby, aria-label o texto.
          const lb = e.getAttribute("aria-labelledby");
          if (lb) return lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim();
          return (e.getAttribute("aria-label") ?? (e as HTMLElement).innerText).trim();
        });
        if (!nombre.includes(n.titulo)) problemas.push(`enlace a ${n.enlace}: «${nombre}» no incluye el título`);
      }
    }
    // Además, con la API de accesibilidad: el enlace se encuentra por un nombre que contiene el título.
    for (const n of ORDEN) {
      const porNombre = page.getByRole("main").getByRole("link", { name: n.titulo });
      if ((await porNombre.count()) < 1) problemas.push(`no hay enlace cuyo nombre accesible contenga «${n.titulo}»`);
    }
    // Ningún par de enlaces de la página se anuncia igual.
    const nombres = (await page.getByRole("main").getByRole("link").evaluateAll((es) =>
      es.map((e) => (e.getAttribute("aria-label") ?? (e as HTMLElement).innerText).trim()),
    ));
    const repetidos = nombres.filter((x, i) => nombres.indexOf(x) !== i);
    test.info().annotations.push({ type: "nombres-enlaces", description: nombres.join(" | ") });
    if (repetidos.length) problemas.push(`nombres repetidos: ${[...new Set(repetidos)].join(" | ")}`);
    expect(problemas).toEqual([]);
  });

  test("E2E-06 · CA-05.1: la noticia pendiente no aparece", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    const html = await page.content();
    expect(html).not.toContain(P.titulo);
    expect(html).not.toContain(P.resumen);
    expect(html).not.toContain(P.enlace);
  });

  test("E2E-07 · CA-06.1: en /admin la carga inicial son aportes Noticia pendientes de origen agente (buscar-noticias), con enlace, y no están en /noticias", async ({ page, context }) => {
    soloEscritorio();
    const { data: pend } = await admin()
      .from("aportes").select("id,datos,fuente,origen,agente,publicacion")
      .eq("tipo", "Noticia").eq("publicacion", "Pendiente").not("descripcion", "like", `${PREFIJO}%`);
    test.info().annotations.push({ type: "aportes-noticia-pendientes", description: String((pend ?? []).length) });
    expect((pend ?? []).length, "hay aportes de la carga inicial").toBeGreaterThan(0);
    const problemas: string[] = [];
    for (const a of pend ?? []) {
      const d = a.datos as { fecha?: string; enlace?: string; titulo?: string; medio?: string; resumen?: string };
      if (a.origen !== "agente") problemas.push(`${a.id}: origen ${a.origen}`);
      if (a.agente !== "buscar-noticias") problemas.push(`${a.id}: agente ${a.agente}`);
      if (!d.fecha || d.fecha < "2025-01-01") problemas.push(`${a.id}: fecha ${d.fecha} anterior a 2025`);
      if (!d.titulo || !d.medio || !d.enlace) problemas.push(`${a.id}: falta título, medio o enlace`);
      if (!d.resumen) problemas.push(`${a.id}: falta el resumen (obligatorio en la carga inicial)`);
    }
    await iniciarSesionEditor(context);
    await page.goto("/admin");
    const tabla = page.getByRole("table");
    await expect(tabla).toBeVisible({ timeout: 60_000 });
    for (const a of pend ?? []) {
      const fila = tabla.getByRole("row").filter({ has: page.getByRole("cell", { name: String(a.id), exact: true }) });
      if ((await fila.count()) !== 1) { problemas.push(`${a.id}: no está en la lista de /admin`); continue; }
      const txt = await fila.innerText();
      if (!/Noticia/.test(txt)) problemas.push(`${a.id}: el tipo no se ve como Noticia`);
      if (!/Agente/i.test(txt)) problemas.push(`${a.id}: el origen no se ve como agente`);
      const enlace = (a.datos as { enlace?: string })?.enlace ?? a.fuente;
      const hrefs = await fila.getByRole("link").evaluateAll((es) => es.map((e) => e.getAttribute("href")));
      if (!hrefs.some((h) => h && enlace && (h === enlace || enlace.startsWith(h.replace(/\/$/, ""))))) problemas.push(`${a.id}: la fila no tiene el enlace de la nota`);
    }
    await page.screenshot({ path: test.info().outputPath("admin-lista.png"), fullPage: true });
    // Detalle de un aporte: muestra el enlace y el agente.
    const primero = (pend ?? [])[0];
    await page.goto(`/admin/${primero.id}`);
    await expect(page.getByText("Cargando aporte…")).toBeHidden({ timeout: 60_000 });
    const det = await page.getByRole("main").innerText();
    const enl = (primero.datos as { enlace: string }).enlace;
    if (!det.includes(enl) && !(await page.locator(`a[href="${enl}"], input[value="${enl}"]`).count())) problemas.push(`detalle ${primero.id}: no muestra el enlace`);
    if (!det.includes("buscar-noticias")) test.info().annotations.push({ type: "observacion", description: `detalle ${primero.id}: no se lee «buscar-noticias»` });
    await page.screenshot({ path: test.info().outputPath("admin-detalle-noticia.png"), fullPage: true });
    // Ninguna está en /noticias.
    const html = await htmlNoticias(page);
    for (const a of pend ?? []) {
      const d = a.datos as { titulo?: string; enlace?: string };
      if ((d.titulo && html.includes(d.titulo)) || (d.enlace && html.includes(d.enlace))) problemas.push(`${a.id}: ya aparece en /noticias`);
    }
    test.info().annotations.push({ type: "problemas", description: problemas.join("; ") || "ninguno" });
    expect(problemas).toEqual([]);
  });

  test("E2E-09 · CA-09.1: /noticias no ofrece descargas CSV", async ({ page }) => {
    soloEscritorio();
    await abrir(page);
    await expect(page.getByRole("link", { name: /descarg|csv/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /descarg|csv/i })).toHaveCount(0);
    await expect(page.locator("a[download]")).toHaveCount(0);
    await expect(page.locator('a[href*=".csv" i], a[href*="csv" i]')).toHaveCount(0);
    await expect(page.getByRole("main").getByText(/descargar/i)).toHaveCount(0);
  });

  test("E2E-10 · CA-10.1: la tarjeta «Noticias» del inicio y el menú llevan a la lista", async ({ page }) => {
    soloEscritorio();
    await page.goto("/");
    const tarjetaInicio = page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: /Noticias/ });
    await expect(tarjetaInicio).toHaveCount(1);
    await tarjetaInicio.click();
    await expect(page).toHaveURL(/\/noticias$/);
    await expect(page.getByText(/Sección en construcción/)).toHaveCount(0);
    await expect(page.getByRole("main")).toContainText(N.R.titulo);
    await page.goto("/");
    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Noticias" }).click();
    await expect(page).toHaveURL(/\/noticias$/);
    await expect(page.getByText(/Sección en construcción/)).toHaveCount(0);
    await expect(page.getByRole("main")).toContainText(N.R.titulo);
  });

  test("E2E-08 · CA-08.1: al aprobar en /admin una noticia pendiente, aparece en /noticias en ≤ 5 min", async ({ page, context }) => {
    soloEscritorio();
    test.setTimeout(10 * 60_000);
    const Q = noticia("aprobada-admin", "2026-06-10", "Medio de prueba Seis");
    const { publicacion: _p, ...datos } = Q;
    void _p;
    const a = await sembrarAporte({ tipo: "Noticia", descripcion: T("aporte-noticia"), datos, fuente: Q.enlace, origen: "agente", agente: `${PREFIJO}agente` });
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
        const html = await htmlNoticias(page);
        if (html.includes(Q.titulo)) { visto = Date.now() - aprobadoEn; break; }
        await page.waitForTimeout(10_000);
      }
      test.info().annotations.push({ type: "tiempo-publicacion", description: visto < 0 ? "no apareció en 5 min" : `${Math.round(visto / 1000)} s` });
      expect(visto, "la noticia aprobada aparece en ≤ 5 min").toBeGreaterThanOrEqual(0);
      await abrir(page);
      const t = tarjeta(page, Q);
      await expect(t).toContainText(ddmmaaaa(Q.fecha));
      await expect(t).toContainText(Q.medio);
      await expect(t).toContainText(Q.resumen);
      // Queda en su lugar por fecha: entre la reciente y las del 03/02/2026.
      expect(await ordenEnPagina(page, [N.R, Q, N.A, N.B, N.V])).toEqual([N.R, Q, N.A, N.B, N.V].map((n) => n.titulo));
    } finally {
      await admin().from("noticias").delete().eq("enlace", Q.enlace);
    }
  });
});

// ---------- RNF ----------
test.describe("005 · Noticias (375 px y RNF)", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(10 * 60_000);
    const espera = await asegurarSiembra(page);
    test.setTimeout(espera + 4 * 60_000);
  });

  test("E2E-11 · RNF-01, RNF-03, RNF-06: a 375 px con movimiento reducido: sin desborde, sin animaciones y consola limpia", async ({ page }) => {
    soloMovil();
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errores = vigilarConsola(page);
    await abrir(page);
    const anims0 = await page.evaluate(() => document.getAnimations().map((a) => (a as CSSAnimation).animationName ?? a.constructor.name));
    await page.waitForTimeout(1000);
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(desborde, "sin desplazamiento horizontal").toBeLessThanOrEqual(0);
    for (const n of ORDEN) {
      const c = (await tarjeta(page, n).boundingBox())!;
      expect(c.x, `${n.titulo} empieza dentro de la pantalla`).toBeGreaterThanOrEqual(0);
      expect(c.x + c.width, `${n.titulo} cabe en 375 px`).toBeLessThanOrEqual(375);
    }
    // Textos largos (enlaces y títulos) no se salen de su tarjeta.
    const salidos = await page.getByRole("main").evaluate((m) => {
      const ancho = document.documentElement.clientWidth;
      return [...m.querySelectorAll("*")].filter((e) => e.getBoundingClientRect().right > ancho + 0.5).map((e) => e.tagName + ":" + (e.textContent ?? "").slice(0, 40));
    });
    expect(salidos, "ningún elemento se sale a la derecha").toEqual([]);
    test.info().annotations.push({ type: "animaciones-al-cargar", description: anims0.join(", ") || "ninguna" });
    const anims = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => (a as CSSAnimation).animationName ?? a.constructor.name));
    expect(anims, "sin animaciones en curso").toEqual([]);
    // Al desplazarse tampoco aparecen animaciones.
    await page.mouse.wheel(0, 2000);
    const anims2 = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => (a as CSSAnimation).animationName ?? a.constructor.name));
    expect(anims2, "sin animaciones al desplazarse").toEqual([]);
    await page.screenshot({ path: test.info().outputPath("noticias-375.png"), fullPage: true });
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("E2E-12 · RNF-04: axe sin violaciones y foco visible al recorrer con Tab", async ({ page }) => {
    const axe = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
    await abrir(page);
    await page.waitForTimeout(1000);
    await page.addScriptTag({ content: axe });
    const v = await page.evaluate(async () => {
      // @ts-expect-error axe inyectado
      const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
      return r.violations.map((x: { id: string; impact: string; nodes: { target: string[] }[] }) => `${x.id} (${x.impact}) en ${x.nodes.map((n) => n.target.join(" ")).slice(0, 4).join("; ")}`);
    });
    test.info().annotations.push({ type: "axe", description: JSON.stringify(v) });
    expect.soft(v, "sin violaciones de axe").toEqual([]);

    const sinFoco: string[] = [];
    const vistos = new Set<string>();
    const enlacesNotas = new Set<string>();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const r = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        if (!a || a === document.body) return null;
        const s = getComputedStyle(a);
        const visible = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== "none");
        return { id: `${a.tagName}|${(a.getAttribute("aria-label") ?? a.innerText ?? "").trim().slice(0, 60)}`, href: a.getAttribute("href"), visible };
      });
      if (!r) continue;
      if (r.href) enlacesNotas.add(r.href);
      if (vistos.has(r.id)) continue;
      vistos.add(r.id);
      if (!r.visible) sinFoco.push(r.id);
    }
    test.info().annotations.push({ type: "foco", description: `${vistos.size} elementos; sin foco visible: ${sinFoco.join(" · ") || "ninguno"}` });
    expect(sinFoco, "foco visible en todo lo que se alcanza con Tab").toEqual([]);
    for (const n of ORDEN) expect.soft(enlacesNotas.has(n.enlace), `el enlace de ${n.titulo} se alcanza con Tab`).toBe(true);
  });

  test("E2E-13 · RNF-05: LCP local de /noticias (indicativo; la medición en el sitio publicado no se hace)", async ({ browser }) => {
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
      await p.goto("/noticias", { waitUntil: "load", timeout: 120_000 });
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
