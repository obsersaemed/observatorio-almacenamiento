// E2E de la spec 007 · Rediseño de la interfaz (escenarios E2E-01 a E2E-42 de plan.md).
// Corre contra `npm run dev` conectado al proyecto Supabase "pruebas", sin sembrar datos:
// compara lo que muestra cada página con lo que muestra /mapa o con la base (solo lectura).
//   npx playwright test -c e2e/007.config.ts --project=escritorio --workers=1
// Escritorio a 1280 × 900, salvo E2E-40 (375 px).
import { test, expect, type Page, type Locator } from "@playwright/test";
import fs from "node:fs";
import { admin, vigilarConsola } from "./utilidades";

test.use({ viewport: { width: 1280, height: 900 } });
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "escritorio", "Los escenarios de la 007 fijan su propio ancho");
});

const PAGINAS = ["/", "/mapa", "/vehiculos", "/normativa", "/noticias", "/aportar"];
const SECCIONES = ["/mapa", "/vehiculos", "/normativa", "/noticias"];
const ESTADOS = ["En operación", "En construcción", "Anunciado", "Inactivo"];
const GRIS_OSCURO = "rgb(63, 69, 72)"; // --teal-600 / --brand-ink
const NARANJA = "rgb(232, 147, 90)"; // --accent (#e8935a)
const BLANCO = "rgb(255, 255, 255)";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** «1.234,5» → 1234.5; vacío → 0. */
const num = (s: string) => {
  const t = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return t === "" || t === "-" ? 0 : Number(t);
};
const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
/** Luminancia relativa (WCAG) de un color «rgb(...)». */
function luminancia(c: string) {
  const [r, g, b] = rgb(c).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const css = (loc: Locator, prop: string) => loc.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), prop);

// ---------- Localizadores ----------
const tabla = (page: Page) => page.getByRole("table", { name: /Proyectos de almacenamiento/ });
const filas = (page: Page) => tabla(page).getByRole("rowgroup").nth(1).getByRole("row");
const puntos = (page: Page) => page.getByRole("button", { name: new RegExp(` · (${ESTADOS.join("|")})$`) });
const botonFiltros = (page: Page) => page.getByRole("button", { name: /^(Filtros|Ocultar filtros)/ });
const conteo = (page: Page) => page.getByRole("status").filter({ hasText: /\d/ }).first();
const chip = (page: Page, valor: string) => page.getByRole("button", { name: `Quitar filtro ${valor}`, exact: true });
const grupoFiltro = (page: Page, nombre: string) => page.getByRole("group", { name: nombre, exact: true });
// 008 reemplazó las pestañas internas del mapa por botones de segmento debajo del título
// (grupo «Tipo de almacenamiento», botones con aria-pressed, ?segmento=detras-del-medidor).
const botonesSegmento = (page: Page) => page.getByRole("group", { name: "Tipo de almacenamiento" });
const panelMapa = (page: Page) => page.getByRole("region", { name: "Mapa", exact: true });
const lineaPuntos = (page: Page) => page.getByRole("list", { name: "Normas en el tiempo" }).getByRole("button");
const fichas = (page: Page) => page.getByTestId("linea-tiempo").locator("article[id^='norma-']");

async function abrirMapa(page: Page, query = "") {
  await page.goto(`/mapa${query}`);
  await expect(tabla(page)).toBeVisible({ timeout: 60_000 });
  if (query) {
    // Los filtros de la URL se aplican al hidratar: se espera a que la barra los muestre y a que
    // la tabla tenga tantas filas como dice el conteo.
    await expect(botonFiltros(page)).toHaveText(/^Filtros \(\d+\)$/, { timeout: 60_000 });
    await expect
      .poll(async () => (await filas(page).count()) === Number(((await conteo(page).textContent()) ?? "").replace(/\D/g, "")), { timeout: 30_000 })
      .toBe(true);
  }
}

async function esperarPuntos(page: Page) {
  await expect(page.locator(".maplibregl-map")).toBeVisible({ timeout: 60_000 });
  await expect(puntos(page).first()).toBeAttached({ timeout: 60_000 });
}

async function abrirNormativa(page: Page, query = "") {
  await page.goto(`/normativa${query}`);
  await expect(fichas(page).first()).toBeVisible({ timeout: 60_000 });
}

/** Lee la tabla de /mapa: estado, MW, MWh, año de FPO y si tiene ubicación. */
async function leerTabla(page: Page) {
  return filas(page).evaluateAll((trs) =>
    trs.map((tr) => {
      const c = [...tr.querySelectorAll("td")].map((td) => td.textContent?.trim() ?? "");
      return { nombre: c[0], estado: c[2], mw: c[6], mwh: c[7], fpo: c[8], ubicado: !c[0].includes("sin ubicación en el mapa") };
    }),
  );
}

/** Despliega un filtro dentro del panel y marca una opción. */
async function marcarFiltro(page: Page, grupo: string, valor: string) {
  if ((await botonFiltros(page).getAttribute("aria-expanded")) !== "true") await botonFiltros(page).click();
  const b = grupoFiltro(page, grupo).getByRole("button", { name: new RegExp(`^${esc(grupo)} `) });
  await b.click();
  await grupoFiltro(page, grupo).getByRole("checkbox", { name: new RegExp(`^${esc(valor)} \\(\\d+\\)$`) }).check();
  await page.keyboard.press("Escape");
}

/** Dispersión horizontal de los puntos del mapa (crece al acercar). */
async function dispersion(page: Page) {
  const xs = await puntos(page).evaluateAll((es) => es.map((e) => e.getBoundingClientRect().left));
  return Math.max(...xs) - Math.min(...xs);
}

async function correrAxe(page: Page) {
  const axe = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
  await page.addScriptTag({ content: axe });
  return page.evaluate(async () => {
    // @ts-expect-error axe inyectado
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    type Nodo = { target: string[]; html: string; any: { data?: { contrastRatio?: number; fgColor?: string; bgColor?: string } }[] };
    return (r.violations as { id: string; impact: string; nodes: Nodo[] }[])
      .filter((v) => v.impact === "serious" || v.impact === "critical" || v.id === "color-contrast")
      .flatMap((v) =>
        v.nodes.map((n) => {
          const d = n.any.find((a) => a.data?.contrastRatio)?.data;
          const extra = d ? ` · contraste ${d.contrastRatio}:1 (${d.fgColor} sobre ${d.bgColor})` : "";
          return `${v.id} (${v.impact}) en ${n.target.join(" ")}${extra} · ${n.html.slice(0, 120)}`;
        }),
      );
  });
}

async function cargar(page: Page, ruta: string) {
  await page.goto(ruta);
  await page.waitForLoadState("load");
  if (ruta === "/mapa") await expect(tabla(page)).toBeVisible({ timeout: 60_000 });
  if (ruta === "/normativa") await expect(fichas(page).first()).toBeVisible({ timeout: 60_000 });
  if (ruta === "/noticias") await expect(page.locator("[data-tema]").first()).toBeVisible({ timeout: 60_000 });
  if (ruta === "/vehiculos") await expect(page.getByRole("table", { name: "Participación por tipo de batería" })).toBeVisible({ timeout: 60_000 });
  if (ruta === "/") await expect(page.getByTestId("barra-crecimiento").first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(800);
}

// ======================================================================
// General
// ======================================================================
test.describe("007 · General", () => {
  test("E2E-01 · CA-01.1, RNF-04: axe sin violaciones serias ni críticas y sin fallas de contraste", async ({ page }) => {
    test.setTimeout(300_000);
    const problemas: string[] = [];
    for (const ruta of PAGINAS) {
      await cargar(page, ruta);
      for (const p of await correrAxe(page)) problemas.push(`${ruta}: ${p}`);
    }
    test.info().annotations.push({ type: "axe", description: problemas.join("\n") || "ninguno" });
    expect(problemas).toEqual([]);
  });

  test("E2E-02 · CA-01.2: ningún texto naranja sobre blanco o gris claro", async ({ page }) => {
    test.setTimeout(240_000);
    const problemas: string[] = [];
    for (const ruta of PAGINAS) {
      await cargar(page, ruta);
      const malos = await page.evaluate(() => {
        const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
        const lum = (c: string) => {
          const [r, g, b] = parse(c).map((v) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const naranja = (c: string) => {
          const [r, g, b] = parse(c);
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          if (max - min < 60 || max !== r) return false;
          const h = ((g - b) / (max - min)) * 60;
          return h >= 10 && h <= 45;
        };
        const fondo = (e: Element | null): string => {
          for (let n = e; n; n = n.parentElement) {
            const c = getComputedStyle(n).backgroundColor;
            const a = parse(c)[3];
            if (c && c !== "transparent" && (a === undefined || a > 0.5)) return c;
          }
          return "rgb(255, 255, 255)";
        };
        const fuera: string[] = [];
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let t = w.nextNode(); t; t = w.nextNode()) {
          const texto = t.textContent?.trim();
          const e = t.parentElement;
          if (!texto || !e || !e.checkVisibility?.()) continue;
          const color = getComputedStyle(e).color;
          if (naranja(color) && lum(fondo(e)) > 0.6) fuera.push(`«${texto.slice(0, 40)}» ${color} sobre ${fondo(e)}`);
        }
        return fuera;
      });
      for (const m of malos) problemas.push(`${ruta}: ${m}`);
    }
    expect(problemas).toEqual([]);
  });

  test("E2E-03 · CA-02.1: encabezado gris oscuro, barra naranja y menú en orden", async ({ page }) => {
    await page.goto("/");
    const encabezado = page.locator("header").first();
    expect(await css(encabezado, "background-color")).toBe(GRIS_OSCURO);
    const nombre = encabezado.getByRole("link", { name: /Observatorio de Almacenamiento de Energía/ });
    await expect(nombre).toBeVisible();
    const barra = nombre.locator("span[aria-hidden='true']");
    expect(await css(barra, "background-color")).toBe(NARANJA);
    const enlaces = page.getByRole("navigation", { name: "Principal" }).getByRole("link");
    await expect(enlaces).toHaveText(["Inicio", "Implementación", "Vehículos", "Normativa", "Noticias", "Aportar"]);
  });

  test("E2E-04 · CA-02.2: «Normativa» es la página actual con subrayado naranja", async ({ page }) => {
    await page.goto("/normativa");
    const enlaces = page.getByRole("navigation", { name: "Principal" }).getByRole("link");
    const n = await enlaces.count();
    for (let i = 0; i < n; i++) {
      const e = enlaces.nth(i);
      const texto = (await e.textContent())?.trim();
      if (texto === "Normativa") {
        await expect(e).toHaveAttribute("aria-current", "page");
        expect(await css(e, "border-bottom-color")).toBe(NARANJA);
        expect(parseFloat(await css(e, "border-bottom-width"))).toBeGreaterThanOrEqual(2);
      } else {
        await expect(e, texto).not.toHaveAttribute("aria-current", /.+/);
        expect(await css(e, "border-bottom-color"), texto).not.toBe(NARANJA);
      }
    }
  });

  test("E2E-05 · CA-03.1: tras el h1 van las cifras o el contenido; la intro es el último bloque", async ({ page }) => {
    test.setTimeout(180_000);
    const contenido: Record<string, (b: Locator) => Locator> = {
      "/mapa": (b) => b.getByRole("group", { name: "Potencia instalada [MW]" }),
      "/vehiculos": (b) => b.getByRole("group", { name: /^Vehículos eléctricos registrados/ }),
      "/normativa": (b) => b.getByRole("button", { name: /^Filtros/ }),
      "/noticias": (b) => b.locator("article").first(),
    };
    for (const ruta of SECCIONES) {
      await cargar(page, ruta);
      const intro = await page.locator('meta[name="description"]').getAttribute("content");
      const main = page.locator("main");
      const hijos = main.locator(":scope > *");
      await expect(hijos.first(), ruta).toHaveJSProperty("tagName", "H1");
      // 008 (RF-03): en /mapa los botones de segmento van entre el título y las cifras.
      const conBotones = ruta === "/mapa";
      if (conBotones) await expect(hijos.nth(1), "botones de segmento tras el h1").toHaveAttribute("aria-label", "Tipo de almacenamiento");
      const segundo = hijos.nth(conBotones ? 2 : 1);
      await expect(contenido[ruta](segundo), `${ruta}: contenido tras el h1`).toBeVisible();
      await expect(segundo, `${ruta}: la intro no va tras el h1`).not.toContainText(intro!.slice(0, 60));
      await expect(hijos.last(), `${ruta}: la intro va al final`).toHaveText(intro!);
    }
  });

  test("E2E-06 · CA-04.1: botón principal gris oscuro y secundario blanco con borde gris", async ({ page }) => {
    await abrirMapa(page);
    const principal = botonFiltros(page);
    expect(await css(principal, "background-color")).toBe(GRIS_OSCURO);
    expect(await css(principal, "color")).toBe(BLANCO);
    expect(await css(principal, "background-image")).toBe("none");
    const secundario = page.getByRole("button", { name: "Descargar CSV", exact: true });
    expect(await css(secundario, "background-color")).toBe(BLANCO);
    const borde = await css(secundario, "border-top-color");
    expect(parseFloat(await css(secundario, "border-top-width"))).toBeGreaterThan(0);
    const [r, g, b] = rgb(borde);
    expect(Math.max(r, g, b) - Math.min(r, g, b), `borde gris (${borde})`).toBeLessThan(25);
    expect(await css(secundario, "background-image")).toBe("none");
    for (const b of [principal, secundario]) {
      expect(parseFloat(await css(b, "border-top-left-radius"))).toBeLessThanOrEqual(8);
      expect(await css(b, "box-shadow")).not.toMatch(/rgb\(232, 147, 90\)/);
    }
  });

  test("E2E-07 · CA-05.1: íconos SVG de trazo, sin ▲/▼ ni emojis", async ({ page }) => {
    const sinSimbolos = async (ruta: string) => {
      const texto = await page.locator("body").innerText();
      expect(texto, ruta).not.toMatch(/[▲▼△▽]/);
      // Emojis de presentación gráfica («©» de los créditos del mapa no es un emoji).
      expect(texto, ruta).not.toMatch(/\p{Emoji_Presentation}/u);
      // Los íconos dentro de botones y enlaces son del mismo juego (Lucide).
      const ajenos = await page.locator("main").evaluate((m) =>
        [...m.querySelectorAll("button svg, a svg")]
          .filter((s) => !s.classList.contains("lucide") && !s.closest(".maplibregl-map"))
          .map((s) => s.outerHTML.slice(0, 80)),
      );
      expect(ajenos, ruta).toEqual([]);
    };
    await abrirMapa(page);
    const nombre = tabla(page).getByRole("columnheader", { name: "Nombre" });
    await nombre.getByRole("button").click();
    await expect(nombre).toHaveAttribute("aria-sort", "ascending");
    await expect(nombre.locator("svg.lucide")).toHaveCount(1);
    await nombre.getByRole("button").click();
    await expect(nombre).toHaveAttribute("aria-sort", "descending");
    await expect(nombre.locator("svg.lucide")).toHaveCount(1);
    await sinSimbolos("/mapa");
    await cargar(page, "/");
    await sinSimbolos("/");
    // Las imágenes de las tarjetas del inicio son de trazo (sin relleno en el ícono del vehículo).
    const secciones = page.getByRole("region", { name: "Secciones principales" });
    const vehiculo = secciones.locator("article").nth(1).locator("svg").first();
    await expect(vehiculo).toHaveAttribute("fill", "none");
  });

  test("E2E-08 · CA-06.1: mapa de Colombia tenue al fondo de cada página", async ({ page }) => {
    test.setTimeout(180_000);
    for (const ruta of PAGINAS) {
      await page.goto(ruta);
      const fondo = await page.evaluate(() => {
        const e = [...document.querySelectorAll("body *")].find((n) => getComputedStyle(n).backgroundImage.includes("fondo-colombia"));
        if (!e) return null;
        const s = getComputedStyle(e);
        return { opacidad: Number(s.opacity), posicion: s.position, z: s.zIndex };
      });
      expect(fondo, ruta).not.toBeNull();
      expect(fondo!.opacidad, ruta).toBeLessThan(0.3);
      expect(fondo!.posicion, ruta).toBe("fixed");
      expect(Number(fondo!.z), ruta).toBeLessThan(0);
      const r = await page.request.get("/fondo-colombia.png");
      expect(r.ok()).toBeTruthy();
    }
  });

  test("E2E-09 · CA-07.1: pestañas de «Capacidad por estado» en grupo gris claro y activa gris oscuro", async ({ page }) => {
    await abrirMapa(page);
    const tarjeta = page.getByRole("region", { name: "Gráficas" }).getByRole("region", { name: "Capacidad por estado", exact: true });
    const grupo = tarjeta.getByRole("tablist");
    await expect(grupo).toBeVisible({ timeout: 60_000 });
    const fondoGrupo = await css(grupo, "background-color");
    const activa = grupo.getByRole("tab", { selected: true });
    const inactiva = grupo.getByRole("tab", { selected: false }).first();
    const fondoActiva = await css(activa, "background-color");
    expect(luminancia(fondoGrupo), `grupo ${fondoGrupo}`).toBeGreaterThan(0.8);
    expect(luminancia(fondoActiva), `activa ${fondoActiva}`).toBeLessThan(0.25);
    expect(await css(inactiva, "background-color")).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  });
});

// ======================================================================
// Filtros recogidos (RF-08, RF-09)
// ======================================================================
test.describe("007 · Filtros", () => {
  test("E2E-10 · CA-08.1, CA-08.2: /mapa carga con los filtros recogidos; se despliegan y se recogen", async ({ page }) => {
    await abrirMapa(page);
    const boton = botonFiltros(page);
    await expect(boton).toHaveText("Filtros");
    await expect(boton).toHaveAttribute("aria-expanded", "false");
    await expect(grupoFiltro(page, "Estado")).toBeHidden();
    const total = await filas(page).count();
    await expect(conteo(page)).toHaveText(`${total.toLocaleString("es-CO")} ${total === 1 ? "proyecto" : "proyectos"}`);
    // RF-08: la búsqueda solo va «si la página la tiene»; /mapa no tiene búsqueda general (T13).
    const busqueda = await page.getByRole("searchbox").count();
    test.info().annotations.push({ type: "búsqueda", description: busqueda ? "hay búsqueda en la barra" : "/mapa no tiene búsqueda general (RF-08: «si la página la tiene»)" });
    await boton.click();
    await expect(boton).toHaveText("Ocultar filtros");
    await expect(boton).toHaveAttribute("aria-expanded", "true");
    await expect(grupoFiltro(page, "Estado")).toBeVisible();
    await boton.click();
    await expect(boton).toHaveText("Filtros");
    await expect(grupoFiltro(page, "Estado")).toBeHidden();
  });

  test("E2E-11 · CA-08.3: el chip del filtro de estado aparece y al pulsarlo se quita", async ({ page }) => {
    await abrirMapa(page);
    const total = await filas(page).count();
    await marcarFiltro(page, "Estado", "En operación");
    await botonFiltros(page).click(); // recoger
    await expect(botonFiltros(page)).toHaveText("Filtros (1)");
    await expect(chip(page, "En operación")).toBeVisible();
    await expect(chip(page, "En operación")).toHaveText("En operación");
    const filtrado = await filas(page).count();
    expect(filtrado).toBeLessThan(total);
    await expect(conteo(page)).toHaveText(new RegExp(`^${filtrado.toLocaleString("es-CO")} proyectos?$`));
    await chip(page, "En operación").click();
    await expect(chip(page, "En operación")).toHaveCount(0);
    await expect(botonFiltros(page)).toHaveText("Filtros");
    await expect(filas(page)).toHaveCount(total);
    await expect(conteo(page)).toHaveText(`${total.toLocaleString("es-CO")} proyectos`);
  });

  test("E2E-12 · CA-08.4: /normativa carga con los filtros recogidos, con chips y conteo", async ({ page }) => {
    await abrirNormativa(page);
    const boton = botonFiltros(page);
    await expect(boton).toHaveText("Filtros");
    await expect(boton).toHaveAttribute("aria-expanded", "false");
    await expect(grupoFiltro(page, "Entidad")).toBeHidden();
    await expect(conteo(page)).toHaveText(/^\d+ normas?$/);
    await boton.click();
    await expect(grupoFiltro(page, "Entidad")).toBeVisible();
    await boton.click();
    await abrirNormativa(page, "?entidad=CREG");
    await expect(boton).toHaveText("Filtros (1)");
    await expect(boton).toHaveAttribute("aria-expanded", "false");
    await expect(chip(page, "CREG")).toBeVisible();
    await chip(page, "CREG").click();
    await expect(boton).toHaveText("Filtros");
  });

  test("E2E-13 · CA-09.1: /mapa?estado=En operación carga filtrado, con chip y el panel recogido", async ({ page }) => {
    await abrirMapa(page, "?estado=En%20operaci%C3%B3n");
    await expect(botonFiltros(page)).toHaveText("Filtros (1)");
    await expect(botonFiltros(page)).toHaveAttribute("aria-expanded", "false");
    await expect(chip(page, "En operación")).toBeVisible();
    const t = await leerTabla(page);
    expect(t.length).toBeGreaterThan(0);
    expect(new Set(t.map((f) => f.estado))).toEqual(new Set(["En operación"]));
    await expect(conteo(page)).toHaveText(new RegExp(`^${t.length} proyectos?$`));
  });
});

// ======================================================================
// Inicio
// ======================================================================
test.describe("007 · Inicio", () => {
  /** Las barras de la gráfica del inicio, leídas de su tabla equivalente. */
  async function barrasInicio(page: Page) {
    await cargar(page, "/");
    const t = page.getByRole("table", { name: "Crecimiento del almacenamiento [MW acumulados]" });
    return t.locator("tbody tr").evaluateAll((trs) =>
      trs.map((tr) => {
        const c = [...tr.children].map((x) => x.textContent?.trim() ?? "");
        return { anio: c[0], mw: c[1], tipo: c[2] };
      }),
    );
  }

  test("E2E-14 · CA-10.1, CA-10.3: cada barra es el acumulado de MW sin los Inactivo (contra /mapa)", async ({ page }) => {
    const barras = await barrasInicio(page);
    expect(barras.length).toBeGreaterThan(0);
    for (const b of barras) expect(b.mw, `formato es-CO de ${b.anio}`).toMatch(/^\d{1,3}(\.\d{3})*,\d$/);
    await abrirMapa(page, "?estado=En%20operaci%C3%B3n&estado=En%20construcci%C3%B3n&estado=Anunciado");
    const proy = (await leerTabla(page)).filter((p) => /^\d{4}$/.test(p.fpo));
    expect(proy.every((p) => p.estado !== "Inactivo")).toBeTruthy();
    const anios = [...new Set(proy.map((p) => p.fpo))].sort();
    expect(barras.map((b) => b.anio)).toEqual(anios);
    for (const b of barras) {
      const hasta = proy.filter((p) => p.fpo <= b.anio);
      const esperado = hasta.reduce((a, p) => a + num(p.mw), 0);
      // La tabla muestra cada MW con un decimal: se admite el redondeo acumulado.
      expect(Math.abs(num(b.mw) - esperado), `año ${b.anio}: ${b.mw} vs ${esperado}`).toBeLessThanOrEqual(0.05 * (hasta.length + 1));
    }
    // CA-10.3: con los Inactivo la suma sería otra (si hay Inactivo con potencia y año).
    await abrirMapa(page, "?estado=Inactivo");
    const inactivos = (await leerTabla(page)).filter((p) => /^\d{4}$/.test(p.fpo) && num(p.mw) > 0);
    test.info().annotations.push({ type: "inactivos con año y MW", description: String(inactivos.length) });
  });

  test("E2E-15 · CA-10.2: barras de proyección en naranja, las demás en gris; nota de proyección", async ({ page }) => {
    const barras = await barrasInicio(page);
    const columnas = page.getByTestId("columna");
    await expect(columnas).toHaveCount(barras.length);
    for (let i = 0; i < barras.length; i++) {
      const color = await css(columnas.nth(i), "background-color");
      expect(color, `${barras[i].anio} (${barras[i].tipo})`).toBe(barras[i].tipo === "Proyección" ? NARANJA : GRIS_OSCURO);
    }
    // Gris hasta el último año solo en operación y naranja desde el primero con proyección.
    const tipos = barras.map((b) => b.tipo);
    const primera = tipos.indexOf("Proyección");
    if (primera >= 0) expect(tipos.slice(primera).every((t) => t === "Proyección")).toBeTruthy();
    await expect(page.getByText(/Las barras naranja son proyección/)).toBeVisible();
  });

  test("E2E-16 · CA-11.1: con movimiento reducido las barras aparecen en su altura final", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const columnas = page.getByTestId("columna");
    await expect(columnas.first()).toBeVisible({ timeout: 60_000 });
    const medir = () =>
      columnas.evaluateAll((cs) => cs.map((c) => ({ alto: c.getBoundingClientRect().height, transicion: getComputedStyle(c).transitionProperty + " " + getComputedStyle(c).transitionDuration })));
    const antes = await medir();
    await page.waitForTimeout(1500);
    const despues = await medir();
    expect(antes.map((a) => a.alto)).toEqual(despues.map((a) => a.alto));
    expect(Math.max(...antes.map((a) => a.alto))).toBeGreaterThan(50);
    for (const a of antes) expect(a.transicion).toMatch(/^(none|all) 0s$|none/);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test("E2E-17 · CA-11.2: nada se mueve en bucle tras 10 s", async ({ page }) => {
    test.setTimeout(600_000);
    const problemas: string[] = [];
    for (const ruta of PAGINAS) {
      await cargar(page, ruta);
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      await page.waitForTimeout(3000);
      const infinitas = await page.evaluate(() =>
        document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations === Infinity).length,
      );
      if (infinitas) problemas.push(`${ruta}: ${infinitas} animaciones infinitas`);
      // Capturas de la pantalla visible, sin el lienzo del mapa: las teselas de OpenStreetMap
      // siguen llegando y redibujándose (no es un bucle del sitio). Las capturas de página
      // completa de páginas largas variaban sin ningún cambio en el DOM (diagnóstico del 10-27).
      const mascara = [page.locator(".maplibregl-map")];
      const a = await page.screenshot({ mask: mascara });
      await page.waitForTimeout(10_000);
      const b = await page.screenshot({ mask: mascara });
      if (!a.equals(b)) problemas.push(`${ruta}: la página cambió entre las dos capturas`);
      const enCurso = await page.evaluate(() => document.getAnimations().filter((x) => x.playState === "running").length);
      if (enCurso) problemas.push(`${ruta}: ${enCurso} animaciones en curso tras 10 s`);
    }
    expect(problemas).toEqual([]);
  });

  test("E2E-18 · CA-12.1: tres tarjetas de «Secciones principales» con sus textos y botones", async ({ page }) => {
    await page.goto("/");
    const secciones = page.getByRole("region", { name: "Secciones principales" });
    const tarjetas = secciones.locator("article");
    await expect(tarjetas).toHaveCount(3);
    const esperado = [
      { titulo: "Implementación de SAEB en Colombia", texto: "Mapa e inventario de los SAEB en Colombia.", ruta: "/mapa" },
      { titulo: "Almacenamiento de energía en vehículos eléctricos", texto: "Tecnologías y oportunidades de almacenamiento energético en la movilidad eléctrica.", ruta: "/vehiculos" },
      { titulo: "Evolución normativa de los SAEB", texto: "Consulta el marco regulatorio de los SAEB en Colombia.", ruta: "/normativa" },
    ];
    for (let i = 0; i < 3; i++) {
      const t = tarjetas.nth(i);
      await expect(t.getByRole("heading")).toHaveText(esperado[i].titulo);
      await expect(t.getByText(esperado[i].texto, { exact: true })).toBeVisible();
      await expect(t.getByRole("link")).toHaveAttribute("href", esperado[i].ruta);
    }
    await tarjetas.nth(2).getByRole("link").click();
    await expect(page).toHaveURL(/\/normativa$/, { timeout: 30_000 });
  });

  test("E2E-19 · CA-12.2: la tarjeta de Implementación muestra Colombia con un punto por proyecto del color de su estado", async ({ page }) => {
    test.setTimeout(180_000);
    await abrirMapa(page);
    await esperarPuntos(page);
    const delMapa = (
      await puntos(page).evaluateAll((es) => es.map((e) => getComputedStyle(e).backgroundColor))
    ).sort();
    const ubicados = (await leerTabla(page)).filter((p) => p.ubicado).length;
    expect(delMapa.length).toBe(ubicados);
    await cargar(page, "/");
    const tarjeta = page.getByRole("region", { name: "Secciones principales" }).locator("article").first();
    await expect(tarjeta.locator("img")).toHaveAttribute("src", /fondo-colombia/);
    const del_inicio = (await tarjeta.getByTestId("punto-proyecto").evaluateAll((es) => es.map((e) => getComputedStyle(e).backgroundColor))).sort();
    expect(del_inicio).toEqual(delMapa);
  });

  test("E2E-20 · CA-13.1: MW y MWh del inicio coinciden con /mapa filtrado por «En operación»", async ({ page }) => {
    await abrirMapa(page, "?estado=En%20operaci%C3%B3n");
    const t = await leerTabla(page);
    const mw = t.reduce((a, p) => a + num(p.mw), 0);
    const mwh = t.reduce((a, p) => a + num(p.mwh), 0);
    await cargar(page, "/");
    const tMw = page.getByRole("group", { name: "Potencia en operación [MW]" });
    const tMwh = page.getByRole("group", { name: "Energía en operación [MWh]" });
    await expect(tMw).toBeVisible();
    await expect(tMwh).toBeVisible();
    const vMw = (await tMw.getByTestId("kpi-valor").textContent())!;
    const vMwh = (await tMwh.getByTestId("kpi-valor").textContent())!;
    expect(vMw).toMatch(/ MW$/);
    expect(vMwh).toMatch(/ MWh$/);
    expect(Math.abs(num(vMw) - mw)).toBeLessThanOrEqual(0.05 * (t.length + 1));
    expect(Math.abs(num(vMwh) - mwh)).toBeLessThanOrEqual(0.05 * (t.length + 1));
    // Tarjetas separadas (MW y MWh no se suman).
    expect(await tMw.evaluate((a, b) => a.contains(b as Node), await tMwh.elementHandle())).toBeFalsy();
  });

  test("E2E-21 · CA-14.1: últimas noticias con fecha y botón «Aportar» a /aportar", async ({ page }) => {
    await page.goto("/");
    const lista = page.getByRole("list", { name: "Últimas noticias" });
    await expect(lista).toBeVisible({ timeout: 60_000 });
    const items = lista.getByRole("listitem");
    const n = await items.count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(3);
    for (let i = 0; i < n; i++) await expect(items.nth(i).locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
    const fechas = await items.locator("time").evaluateAll((ts) => ts.map((t) => t.getAttribute("datetime")!));
    expect([...fechas].sort().reverse()).toEqual(fechas);
    const aportar = page.getByRole("region", { name: "Aportar al observatorio" }).getByRole("link", { name: "Aportar" });
    await aportar.click();
    await expect(page).toHaveURL(/\/aportar$/);
  });
});

// ======================================================================
// /mapa
// ======================================================================
test.describe("007 · Implementación", () => {
  test("E2E-22 · CA-15.1: a 1280 px el orden es KPI, filtros, tres gráficas en una fila, mapa e inventario", async ({ page }) => {
    await abrirMapa(page);
    const graficas = page.getByRole("region", { name: "Gráficas" });
    await expect(graficas.getByRole("region", { name: "Tecnología", exact: true })).toBeVisible({ timeout: 60_000 });
    const y = async (l: Locator) => (await l.boundingBox())!.y;
    const orden = [
      await y(page.getByRole("region", { name: "Instalado (en operación)" })),
      await y(botonFiltros(page)),
      await y(graficas),
      await y(panelMapa(page)),
      await y(tabla(page)),
    ];
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
    const tops = await graficas.evaluate((g) => [...g.children].map((c) => Math.round(c.getBoundingClientRect().top)));
    expect(tops).toHaveLength(3);
    expect(new Set(tops).size, "las tres gráficas en una fila").toBe(1);
  });

  // Ajustado por la 008: las pestañas internas pasaron a ser botones de segmento debajo del título
  // (aria-pressed; se usan con Tab y Enter en lugar de flechas). Ver también 008 · E2E-03 y E2E-04.
  test("E2E-23 · CA-16.1, CA-16.2 (ajustado por 008): botones de segmento con «Gran escala» elegido; el teclado cambia", async ({ page }) => {
    await abrirMapa(page);
    const grupo = botonesSegmento(page);
    const gran = grupo.getByRole("button", { name: "Gran escala", exact: true });
    const detras = grupo.getByRole("button", { name: "Detrás del medidor", exact: true });
    await expect(gran).toHaveAttribute("aria-pressed", "true");
    await expect(detras).toHaveAttribute("aria-pressed", "false");
    await gran.focus();
    await page.keyboard.press("Tab");
    await expect(detras).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(detras).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Shift+Tab");
    await expect(gran).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(gran).toHaveAttribute("aria-pressed", "true");
    await expect(panelMapa(page)).toBeVisible({ timeout: 60_000 });
  });

  test("E2E-24 · CA-17.1: el mapa carga con Colombia a la vista y los créditos de OpenStreetMap", async ({ page }) => {
    await abrirMapa(page);
    await esperarPuntos(page);
    await page.waitForTimeout(1500);
    const marco = (await page.locator(".maplibregl-map").boundingBox())!;
    const fuera = await puntos(page).evaluateAll(
      (es, m) =>
        es
          .map((e) => ({ n: e.getAttribute("aria-label"), r: e.getBoundingClientRect() }))
          .filter(({ r }) => {
            const x = r.left + r.width / 2, y = r.top + r.height / 2;
            return x < m.x || x > m.x + m.width || y < m.y || y > m.y + m.height;
          })
          .map((p) => p.n),
      marco,
    );
    expect(fuera, "puntos fuera del encuadre inicial").toEqual([]);
    await expect(page.getByText(/OpenStreetMap/).first()).toBeVisible();
  });

  test("E2E-25 · CA-17.2: «Acercar», «Alejar» y la rueda cambian el zoom", async ({ page }) => {
    await abrirMapa(page);
    await esperarPuntos(page);
    await page.waitForTimeout(1500);
    const inicial = await dispersion(page);
    await page.getByRole("button", { name: "Acercar" }).click();
    await page.waitForTimeout(1200);
    const cerca = await dispersion(page);
    expect(cerca).toBeGreaterThan(inicial * 1.3);
    await page.getByRole("button", { name: "Alejar" }).click();
    await page.waitForTimeout(1200);
    const lejos = await dispersion(page);
    expect(lejos).toBeLessThan(cerca * 0.8);
    const marco = (await page.locator(".maplibregl-map").boundingBox())!;
    await page.mouse.move(marco.x + marco.width / 2, marco.y + marco.height / 2);
    await page.mouse.wheel(0, -600);
    await page.waitForTimeout(1500);
    expect(Math.abs((await dispersion(page)) - lejos)).toBeGreaterThan(lejos * 0.1);
  });

  test("E2E-26 · CA-17.3: clic en un punto abre la tarjeta del proyecto", async ({ page }) => {
    await abrirMapa(page);
    await esperarPuntos(page);
    await page.waitForTimeout(1000);
    const labels = await puntos(page).evaluateAll((es) => es.map((e) => e.getAttribute("aria-label") ?? ""));
    for (const l of labels) {
      const p = page.getByRole("button", { name: l, exact: true });
      const libre = await p.evaluate((e) => {
        e.scrollIntoView({ block: "center" });
        const r = e.getBoundingClientRect();
        return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === e;
      });
      if (!libre) continue;
      await p.click();
      const nombre = l.replace(/ · [^·]+$/, "");
      await expect(page.getByRole("dialog", { name: nombre })).toBeVisible();
      return;
    }
    throw new Error("Ningún punto libre para el puntero");
  });

  // Ajustado por la 008: el aviso sale al elegir el botón de segmento cuando no hay proyectos
  // aprobados del segmento (008 · RF-08). Si la base ya los tiene, el caso no se puede observar.
  test("E2E-27 · CA-18.1 (ajustado por 008): «Detrás del medidor» sin proyectos muestra el aviso sin mapa; al volver reaparece", async ({ page }) => {
    const { data } = await admin()
      .from("proyectos")
      .select("nombre")
      .eq("publicacion", "Aprobado")
      .ilike("tipo_uso_conexion", "%Maximización de autoconsumo PV y respaldo%");
    test.skip((data ?? []).length > 0, "La base ya tiene proyectos aprobados del segmento (lo cubre la 008)");
    await abrirMapa(page);
    await esperarPuntos(page);
    const grupo = botonesSegmento(page);
    await grupo.getByRole("button", { name: "Detrás del medidor", exact: true }).click();
    const aviso = page.getByRole("region", { name: "Sección en construcción" });
    await expect(aviso.getByRole("heading", { name: "Sección en construcción" })).toBeVisible();
    await expect(aviso).toContainText(/detrás del medidor/i);
    await expect(page.locator(".maplibregl-map")).toHaveCount(0);
    await expect(puntos(page)).toHaveCount(0);
    await grupo.getByRole("button", { name: "Gran escala", exact: true }).click();
    await esperarPuntos(page);
  });

  test("E2E-28 · CA-19.1: encabezados de la tabla en orden (sin «Servicios», 008 · CA-12.1)", async ({ page }) => {
    await abrirMapa(page);
    await expect(tabla(page).getByRole("columnheader")).toHaveText([
      "Nombre", "Promotor", "Estado", "Departamento", "Municipio", "Potencia [MW]", "Energía [MWh]", "Año de FPO",
    ]);
  });
});

// ======================================================================
// /vehiculos
// ======================================================================
test.describe("007 · Vehículos", () => {
  test("E2E-29 · CA-20.1: primero las tarjetas de vehículos y MWh y la tabla de participación por batería", async ({ page }) => {
    await cargar(page, "/vehiculos");
    const segundo = page.locator("main > *").nth(1);
    const vehiculos = segundo.getByRole("group", { name: /^Vehículos eléctricos registrados/ });
    const mwh = segundo.getByRole("group", { name: "Energía almacenada en circulación [MWh]" });
    const participacion = segundo.getByRole("table", { name: "Participación por tipo de batería" });
    await expect(vehiculos).toBeVisible();
    await expect(mwh).toBeVisible();
    await expect(participacion).toBeVisible();
    // Mismos valores: el KPI coincide con el conteo de la barra y los % suman 100.
    const v = (await vehiculos.getByTestId("kpi-valor").textContent())!;
    await expect(conteo(page)).toHaveText(`${v} vehículos`);
    expect((await mwh.getByTestId("kpi-valor").textContent())!).toMatch(/^\d{1,3}(\.\d{3})*,\d MWh$/);
    const pct = await participacion.locator("tbody td:nth-child(2)").allTextContents();
    expect(Math.abs(pct.reduce((a, p) => a + num(p), 0) - 100)).toBeLessThanOrEqual(0.1 * pct.length);
    // La barra de filtros va después de las cifras.
    const yCifras = (await vehiculos.boundingBox())!.y;
    expect((await botonFiltros(page).boundingBox())!.y).toBeGreaterThan(yCifras);
  });

  test("E2E-30 · CA-21.1: la barra de filtros muestra fuentes, última actualización y ventas hasta", async ({ page }) => {
    await cargar(page, "/vehiculos");
    await expect(botonFiltros(page)).toHaveAttribute("aria-expanded", "false");
    const barra = botonFiltros(page).locator("xpath=ancestor::div[contains(@class,'rounded-[10px]')][1]");
    await expect(barra).toContainText(/Fuentes: .+/);
    await expect(barra).toContainText(/Última actualización: \d{2}\/\d{2}\/\d{4}/);
    await expect(barra).toContainText(/Ventas hasta el \d{2}\/\d{2}\/\d{4}/);
    await expect(barra.getByText(/Última actualización/)).toBeVisible();
  });

  test("E2E-31 · CA-22.1: las cuatro gráficas van debajo de las cifras", async ({ page }) => {
    await cargar(page, "/vehiculos");
    const yCifras = (await page.getByRole("group", { name: /^Vehículos eléctricos registrados/ }).boundingBox())!.y;
    for (const t of [
      "Vehículos eléctricos vendidos por marca y año de registro",
      "Participación de marcas en el mercado %",
      "Tecnología de batería",
      "Energía en circulación por tipo de batería [MWh]",
    ]) {
      const r = page.getByRole("region", { name: t, exact: true });
      await expect(r, t).toBeVisible({ timeout: 60_000 });
      expect((await r.boundingBox())!.y, t).toBeGreaterThan(yCifras);
    }
  });
});

// ======================================================================
// /normativa
// ======================================================================
test.describe("007 · Normativa", () => {
  test("E2E-32 · CA-23.1: línea de puntos con años, un punto por norma y leyenda por emisor", async ({ page }) => {
    await abrirNormativa(page);
    const n = await fichas(page).count();
    await expect(lineaPuntos(page)).toHaveCount(n);
    const yPuntos = (await lineaPuntos(page).first().boundingBox())!.y;
    expect(yPuntos).toBeLessThan((await fichas(page).first().boundingBox())!.y);
    // Años marcados en la línea.
    const contenedor = page.getByRole("list", { name: "Normas en el tiempo" }).locator("xpath=..");
    const anios = (await contenedor.innerText()).match(/\b(19|20)\d{2}\b/g) ?? [];
    expect(anios.length).toBeGreaterThan(1);
    // Leyenda: un emisor por cada emisor de los puntos, con su color.
    const emisoresFichas = new Set(await fichas(page).evaluateAll((as) => as.map((a) => a.querySelector("p span.font-bold")?.textContent?.trim() ?? "")));
    const leyenda = page.getByRole("list", { name: "Emisores" }).getByRole("listitem");
    expect(new Set((await leyenda.allTextContents()).map((t) => t.trim()))).toEqual(emisoresFichas);
    // Cada punto tiene el color de su emisor en la leyenda.
    const colorLeyenda = new Map(
      await leyenda.evaluateAll((ls) => ls.map((l) => [l.textContent!.trim(), getComputedStyle(l.querySelector("span")!).backgroundColor] as [string, string])),
    );
    const malos = await lineaPuntos(page).evaluateAll(
      (bs, colores) => bs.filter((b) => colores[b.getAttribute("aria-label")!.split(" ")[0]] !== getComputedStyle(b).backgroundColor).map((b) => b.getAttribute("aria-label")),
      Object.fromEntries(colorLeyenda),
    );
    expect(malos).toEqual([]);
  });

  test("E2E-33 · CA-23.2: filtrando por CREG, la línea de puntos muestra lo mismo que la línea de tiempo", async ({ page }) => {
    await abrirNormativa(page);
    const total = await fichas(page).count();
    await marcarFiltro(page, "Entidad", "CREG");
    await expect(chip(page, "CREG")).toBeVisible();
    await expect.poll(() => fichas(page).count()).toBeLessThan(total);
    const n = await fichas(page).count();
    await expect(lineaPuntos(page)).toHaveCount(n);
    const etiquetas = await lineaPuntos(page).evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-label")!));
    expect(etiquetas.every((e) => e.startsWith("CREG "))).toBeTruthy();
  });

  /** Compara el recuadro con la ficha que tiene el mismo título. */
  async function revisarRecuadro(page: Page, punto: Locator) {
    const recuadro = page.getByRole("tooltip");
    await expect(recuadro).toBeVisible();
    await expect(punto).toHaveAttribute("aria-describedby", (await recuadro.getAttribute("id"))!);
    const lineas = (await recuadro.locator("p").allTextContents()).map((t) => t.trim());
    expect(lineas).toHaveLength(4);
    const [emisor, tipoNumero, fecha, titulo] = lineas;
    const ficha = fichas(page).filter({ has: page.getByRole("heading", { name: titulo, exact: true }) }).first();
    await expect(ficha).toContainText(emisor);
    await expect(ficha).toContainText(tipoNumero);
    await expect(ficha.locator("time")).toHaveText(fecha);
    expect(await punto.getAttribute("aria-label")).toContain(`${emisor} ${tipoNumero}, ${fecha}`);
  }

  test("E2E-34 · CA-24.1: pasar el mouse o enfocar un punto muestra emisor, tipo y número, fecha y título", async ({ page }) => {
    await abrirNormativa(page);
    const primero = lineaPuntos(page).nth(0);
    await primero.hover();
    await revisarRecuadro(page, primero);
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await primero.focus();
    await page.keyboard.press("Tab");
    const segundo = lineaPuntos(page).nth(1);
    await expect(segundo).toBeFocused();
    await revisarRecuadro(page, segundo);
  });

  test("E2E-35 · CA-25.1: clic en un punto deja su ficha a la vista y resaltada", async ({ page }) => {
    await abrirNormativa(page);
    // El último punto suele ser una ficha lejana (la línea de tiempo va de la más reciente a la más antigua o al revés).
    const n = await lineaPuntos(page).count();
    for (const i of [0, n - 1]) {
      const p = lineaPuntos(page).nth(i);
      await p.scrollIntoViewIfNeeded();
      await p.click();
      const resaltada = page.locator("article[data-resaltada='true']");
      await expect(resaltada).toHaveCount(1);
      await expect(resaltada).toBeInViewport();
      const id = (await resaltada.getAttribute("id"))!;
      expect(await p.getAttribute("aria-label")).toContain((await resaltada.locator("time").textContent())!.trim());
      expect(id).toMatch(/^norma-/);
      expect(parseFloat(await css(resaltada, "outline-width"))).toBeGreaterThan(0);
    }
  });

  test("E2E-36 · CA-25.2: Enter sobre un punto enfocado lleva a la ficha, resaltada y con el foco", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await abrirNormativa(page);
    const n = await lineaPuntos(page).count();
    const p = lineaPuntos(page).nth(n - 1);
    await p.focus();
    await page.keyboard.press("Enter");
    const resaltada = page.locator("article[data-resaltada='true']");
    await expect(resaltada).toHaveCount(1);
    await expect(resaltada).toBeInViewport();
    await expect(resaltada).toBeFocused();
  });

  test("E2E-37 · CA-26.1: la línea de tiempo conserva normas, años y «Ver explicación»", async ({ page }) => {
    await abrirNormativa(page);
    const n = await fichas(page).count();
    await expect(conteo(page)).toHaveText(`${n} ${n === 1 ? "norma" : "normas"}`);
    await expect(fichas(page).getByRole("button", { name: "Ver explicación" })).toHaveCount(n);
    const anios = await page.getByTestId("linea-tiempo").locator("section[aria-label]").evaluateAll((ss) => ss.map((s) => s.getAttribute("aria-label")!));
    expect(anios.length).toBeGreaterThan(0);
    const enlacesAnio = (await page.getByRole("navigation", { name: "Ir al año" }).getByRole("link").allTextContents()).map((t) => t.trim());
    expect(enlacesAnio).toEqual(anios);
    // Las fichas se despliegan.
    const ver = fichas(page).first().getByRole("button", { name: "Ver explicación" });
    await ver.click();
    await expect(ver).toHaveAttribute("aria-expanded", "true");
  });
});

// ======================================================================
// /noticias
// ======================================================================
/** Regla de RF-28, escrita aparte del código: primera etiqueta, sin tildes ni mayúsculas. */
function temaEsperado(etiquetas: string | null) {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
  const primera = norm((etiquetas ?? "").split(";")[0] ?? "");
  const lista: Record<string, string> = {
    regulacion: "Regulación",
    subasta: "Subasta",
    mercado: "Mercado",
    empresas: "Empresas",
    ambiental: "Ambiente",
    ambiente: "Ambiente",
    "politica publica": "Política pública",
  };
  return lista[primera] ?? "General";
}

test.describe("007 · Noticias", () => {
  test("E2E-38 · CA-27.1, CA-27.2: cada tarjeta con ilustración y etiqueta de tema; sin imágenes de medios", async ({ page }) => {
    const externas: string[] = [];
    page.on("request", (r) => {
      if (r.resourceType() === "image" && !new URL(r.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/)) externas.push(r.url());
    });
    await cargar(page, "/noticias");
    const tarjetas = page.locator("main article");
    const n = await tarjetas.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const t = tarjetas.nth(i);
      const banda = t.locator("[data-tema]");
      await expect(banda).toHaveCount(1);
      // Arriba: la banda es el primer hijo de la tarjeta.
      expect(await t.evaluate((a) => a.firstElementChild?.hasAttribute("data-tema"))).toBeTruthy();
      await expect(banda.locator("svg")).toHaveCount(1);
      await expect(banda).toContainText((await banda.getAttribute("data-tema"))!);
    }
    expect(await page.locator("main img").count()).toBe(0);
    expect(externas).toEqual([]);
  });

  test("E2E-39 · CA-28.1–28.3: el tema de cada noticia sale de su primera etiqueta (contra la base)", async ({ page }) => {
    const { data, error } = await admin().from("noticias").select("titulo,etiquetas").eq("publicacion", "Aprobado");
    if (error) throw error;
    await cargar(page, "/noticias");
    const enPagina = await page.locator("main article").evaluateAll((as) =>
      as.map((a) => ({ titulo: a.getAttribute("aria-label")!, tema: a.querySelector("[data-tema]")?.getAttribute("data-tema") ?? "" })),
    );
    expect(enPagina.length).toBe(data!.length);
    const etiquetas = new Map(data!.map((d) => [d.titulo as string, d.etiquetas as string | null]));
    const generales: string[] = [];
    for (const n of enPagina) {
      expect(etiquetas.has(n.titulo), n.titulo).toBeTruthy();
      const e = etiquetas.get(n.titulo) ?? null;
      expect(n.tema, `${n.titulo} («${e}»)`).toBe(temaEsperado(e));
      if (n.tema === "General") generales.push(`«${n.titulo}» (etiquetas: ${e ?? "vacío"})`);
    }
    test.info().annotations.push({ type: "noticias en General", description: generales.join("\n") || "ninguna" });
  });
});

// ======================================================================
// No funcionales
// ======================================================================
test.describe("007 · No funcionales", () => {
  test("E2E-40 · RNF-01: a 375 px no hay desplazamiento horizontal y las filas pasan a una columna", async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 375, height: 812 });
    const problemas: string[] = [];
    const unaColumna = async (ruta: string, contenedor: Locator) => {
      const xs = await contenedor.evaluate((c) => [...c.children].map((h) => Math.round(h.getBoundingClientRect().left)));
      if (new Set(xs).size > 1) problemas.push(`${ruta}: fila en varias columnas (${xs.join(", ")})`);
    };
    for (const ruta of PAGINAS) {
      await cargar(page, ruta);
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      if (sw > cw) problemas.push(`${ruta}: desplazamiento horizontal (${sw} > ${cw})`);
      if (ruta === "/") {
        await unaColumna(ruta, page.getByRole("region", { name: "Secciones principales" }).locator("article").first().locator(".."));
        await unaColumna(ruta, page.getByRole("list", { name: "Últimas noticias" }));
      }
      if (ruta === "/mapa") {
        const g = page.getByRole("region", { name: "Gráficas" });
        await expect(g.getByRole("region", { name: "Tecnología", exact: true })).toBeVisible({ timeout: 60_000 });
        await unaColumna(ruta, g);
      }
    }
    expect(problemas).toEqual([]);
  });

  test("E2E-41 · RNF-02: cifras con coma decimal, punto de miles y unidades entre corchetes", async ({ page }) => {
    const problemas: string[] = [];
    for (const ruta of ["/", "/mapa", "/vehiculos"]) {
      await cargar(page, ruta);
      const kpis = await page.locator("[role='group']:has([data-testid='kpi-valor'])").evaluateAll((gs) =>
        gs.map((g) => ({ etiqueta: g.getAttribute("aria-label")!, valor: g.querySelector("[data-testid='kpi-valor']")!.textContent!.trim() })),
      );
      expect(kpis.length, ruta).toBeGreaterThan(0);
      for (const k of kpis) {
        const unidad = / (MWh?)$/.exec(k.valor)?.[1];
        const patron = unidad ? /^\d{1,3}(\.\d{3})*,\d MWh?$/ : /^\d{1,3}(\.\d{3})*$/;
        if (!patron.test(k.valor)) problemas.push(`${ruta}: «${k.etiqueta}» = «${k.valor}»`);
        if (unidad && !k.etiqueta.includes(`[${unidad}]`) && !/proyectada/.test(k.etiqueta))
          problemas.push(`${ruta}: «${k.etiqueta}» sin la unidad [${unidad}] entre corchetes`);
      }
      // Ninguna cifra con punto decimal en inglés («12.5 MW») ni coma de miles («1,234 MW»).
      const texto = await page.locator("main").innerText();
      for (const m of texto.match(/\d+[.,]\d+\s?MWh?\b/g) ?? []) {
        if (/^\d+\.\d{1,2}\s?MWh?$/.test(m) || /^\d{1,3},\d{3}\s?MWh?$/.test(m)) problemas.push(`${ruta}: «${m}»`);
      }
    }
    expect(problemas).toEqual([]);
  });

  test("RNF-03: con movimiento reducido no hay desplazamiento suave ni animaciones; el salto de RF-25 es instantáneo", async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const ruta of PAGINAS) {
      await cargar(page, ruta);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), ruta).not.toBe("smooth");
      const enCurso = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
      expect(enCurso, `${ruta}: animaciones en curso`).toBe(0);
    }
    await abrirNormativa(page);
    const n = await lineaPuntos(page).count();
    const p = lineaPuntos(page).nth(n - 1);
    await p.click();
    // Sin esperar: la ficha resaltada ya debe estar a la vista en el siguiente cuadro.
    const enVista = await page.evaluate(
      () =>
        new Promise<boolean>((ok) =>
          requestAnimationFrame(() => {
            const a = document.querySelector("article[data-resaltada='true']");
            if (!a) return ok(false);
            const r = a.getBoundingClientRect();
            ok(r.bottom > 0 && r.top < window.innerHeight);
          }),
        ),
    );
    expect(enVista).toBeTruthy();
  });

  test("E2E-42 · RNF-06: consola sin errores en las seis páginas", async ({ page }) => {
    test.setTimeout(240_000);
    const problemas: string[] = [];
    for (const ruta of PAGINAS) {
      const errores = vigilarConsola(page);
      await cargar(page, ruta);
      await page.waitForTimeout(1500);
      for (const e of errores) problemas.push(`${ruta}: ${e.slice(0, 200)}`);
      page.removeAllListeners("console");
      page.removeAllListeners("pageerror");
    }
    expect(problemas).toEqual([]);
  });
});
