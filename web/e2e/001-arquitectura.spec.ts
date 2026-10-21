// E2E de la spec 001 · Arquitectura y plataforma base.
// Escrito por el probador independiente a partir de spec.md y de la sección
// "Escenarios E2E" de plan.md, sin leer el código de producción.
// Corre contra `npm run dev` conectado al proyecto Supabase "pruebas".
import { test, expect, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  admin,
  anonimo,
  CORREO_EDITOR,
  DOMINIO_PRUEBA,
  esperarTurnstile,
  iniciarSesionEditor,
  limpiarTodo,
  PREFIJO,
  proyectoPrueba,
  sembrarAporte,
  sembrarProyectos,
  sufijo,
  vigilarConsola,
} from "./utilidades";

const RAIZ = path.resolve(__dirname, "..", "..");
const CINCO_MIN = 5 * 60_000;

// Las pruebas con datos corren solo en el proyecto de escritorio; el de 375 px
// corre los recorridos de RNF (E2E-17, E2E-18).
function soloEscritorio() {
  test.skip(test.info().project.name !== "escritorio", "Escenario de datos: solo escritorio");
}

const fmt1 = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

async function sumaEnOperacion() {
  const { data, error } = await admin()
    .from("proyectos")
    .select("estado,potencia_nominal_mw,capacidad_maxima_mwh,publicacion")
    .eq("publicacion", "Aprobado");
  if (error) throw error;
  const op = data!.filter((p) => p.estado === "En operación");
  return {
    mw: op.reduce((s, p) => s + Number(p.potencia_nominal_mw ?? 0), 0),
    mwh: op.reduce((s, p) => s + Number(p.capacidad_maxima_mwh ?? 0), 0),
    porEstado: data!.reduce<Record<string, number>>((acc, p) => {
      acc[p.estado] = (acc[p.estado] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

/** Conteos por estado tal como los expone el árbol de accesibilidad (sin el número animado aria-hidden). */
async function conteosPorEstado(page: Page) {
  const snap = await page.getByRole("group", { name: "Proyectos por estado" }).ariaSnapshot();
  const res: Record<string, string> = {};
  let termino = "";
  for (const l of snap.split(/\r?\n/)) {
    const t = l.match(/- term: (.+)$/);
    if (t) termino = t[1].replace(/^"|"$/g, "");
    const d = l.match(/- definition: (.+)$/);
    if (d && termino) res[termino] = d[1].replace(/^"|"$/g, "");
  }
  return res;
}

async function textoKpi(page: Page, nombre: string) {
  // Árbol de accesibilidad: excluye el número animado (aria-hidden) y deja el valor final.
  return (await page.getByRole("group", { name: nombre }).ariaSnapshot()).replace(/\s+/g, " ").trim();
}

/** Recarga una URL hasta que se cumpla la condición o pasen `ms` (RF-10: máximo 5 min). */
async function hastaQue(page: Page, url: string, cond: () => Promise<boolean>, ms = CINCO_MIN + 30_000) {
  const inicio = Date.now();
  for (;;) {
    await page.goto(url);
    if (await cond()) return Date.now() - inicio;
    if (Date.now() - inicio > ms) return -1;
    await page.waitForTimeout(15_000);
  }
}

async function contarAportes(descripcion: string) {
  const { count } = await admin()
    .from("aportes")
    .select("id", { count: "exact", head: true })
    .eq("descripcion", descripcion);
  return count ?? 0;
}

async function llenarAporte(page: Page, opciones: { descripcion: string; sinFuente?: boolean; sinCorreo?: boolean; tipo?: string }) {
  await page.goto("/aportar");
  await esperarTurnstile(page);
  if (opciones.tipo) await page.getByLabel("Tipo de aporte").selectOption(opciones.tipo);
  await page.getByLabel("Descripción").fill(opciones.descripcion);
  if (!opciones.sinFuente) await page.getByLabel("Enlace de la fuente").fill("https://ejemplo.co/fuente-aporte");
  if (!opciones.sinCorreo) await page.getByLabel("Correo de contacto").fill(`${PREFIJO}aportante@${DOMINIO_PRUEBA}`);
}

async function csvPublico(page: Page) {
  const r = await page.request.get("/datos/proyectos.csv");
  expect(r.ok()).toBeTruthy();
  return { texto: await r.text(), cabeceras: r.headers() };
}

test.beforeAll(async () => {
  if (test.info().project.name === "escritorio") await limpiarTodo();
});
test.afterAll(async () => {
  if (test.info().project.name === "escritorio") await limpiarTodo();
});

test.describe("001 · Plataforma base", () => {
  test("E2E-01 · CA-01.1: un proyecto Pendiente no aparece en páginas ni descargas", async ({ page }) => {
    soloEscritorio();
    test.setTimeout(CINCO_MIN + 120_000);
    const errores = vigilarConsola(page);
    const [aprobado, pendiente] = await sembrarProyectos([
      proyectoPrueba({ nombre: `${PREFIJO}aprobado-${sufijo()}`, publicacion: "Aprobado" }),
      proyectoPrueba({ nombre: `${PREFIJO}pendiente-${sufijo()}`, publicacion: "Pendiente", potencia_nominal_mw: 900 }),
    ]);
    // Descarga: solo el aprobado (se espera hasta 5 min por si la descarga está en caché).
    const { mw } = await sumaEnOperacion();
    const espera = await hastaQue(page, "/", async () =>
      (await csvPublico(page)).texto.includes(aprobado.nombre) &&
      (await textoKpi(page, "Potencia en operación [MW]")).includes(`${fmt1(mw)} MW`));
    expect(espera, "el aprobado debe reflejarse en la descarga y en los KPI en ≤ 5 min").toBeGreaterThanOrEqual(0);
    const { texto } = await csvPublico(page);
    expect(texto).toContain(aprobado.nombre);
    expect(texto).not.toContain(pendiente.nombre);
    // KPI del inicio: no incluyen los 900 MW del pendiente.
    await page.goto("/");
    await expect(page.getByRole("group", { name: "Potencia en operación [MW]" })).toContainText(`${fmt1(mw)} MW`);
    // Ninguna página pública muestra el pendiente.
    for (const ruta of ["/", "/mapa", "/vehiculos", "/normativa", "/noticias", "/aportar", "/datos/noticias.csv"]) {
      const r = await page.request.get(ruta);
      expect(await r.text(), `ruta ${ruta}`).not.toContain(pendiente.nombre);
    }
    // El cliente anónimo de Supabase tampoco puede leerlo.
    const { data: anon } = await anonimo().from("proyectos").select("nombre").eq("nombre", pendiente.nombre);
    expect(anon ?? []).toEqual([]);
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("E2E-02 · CA-02.1: KPI de MW y MWh en operación separados, solo En operación, coma decimal", async ({ page }) => {
    soloEscritorio();
    test.setTimeout(CINCO_MIN + 120_000);
    const errores = vigilarConsola(page);
    await sembrarProyectos([
      proyectoPrueba({ estado: "En operación", potencia_nominal_mw: 2.5, capacidad_maxima_mwh: 3.5 }),
      proyectoPrueba({ estado: "En construcción", potencia_nominal_mw: 40, capacidad_maxima_mwh: 80 }),
      proyectoPrueba({ estado: "Anunciado", potencia_nominal_mw: 60, capacidad_maxima_mwh: 120 }),
      proyectoPrueba({ estado: "Inactivo", potencia_nominal_mw: 7, capacidad_maxima_mwh: 7 }),
      proyectoPrueba({ estado: "En operación", publicacion: "Pendiente", potencia_nominal_mw: 300, capacidad_maxima_mwh: 300 }),
    ]);
    const { mw, mwh, porEstado } = await sumaEnOperacion();
    const esperadoMw = `${fmt1(mw)} MW`;
    const esperadoMwh = `${fmt1(mwh)} MWh`;
    const espera = await hastaQue(page, "/", async () => (await textoKpi(page, "Potencia en operación [MW]")).includes(esperadoMw));
    expect(espera, `KPI MW debe mostrar ${esperadoMw} en ≤ 5 min`).toBeGreaterThanOrEqual(0);
    const tarjetaMw = page.getByRole("group", { name: "Potencia en operación [MW]" });
    const tarjetaMwh = page.getByRole("group", { name: "Energía en operación [MWh]" });
    await expect(tarjetaMw).toContainText(esperadoMw);
    await expect(tarjetaMwh).toContainText(esperadoMwh);
    // Tarjetas separadas: la de MW no menciona MWh y viceversa.
    expect(await tarjetaMw.innerText()).not.toMatch(/MWh/);
    expect(await tarjetaMwh.innerText()).not.toMatch(/\bMW\b(?!h)/);
    // Coma decimal.
    expect(await tarjetaMw.innerText()).toMatch(/\d,\d MW/);
    // Conteo por estado (solo aprobados).
    const porEstadoUI = page.getByRole("group", { name: "Proyectos por estado" });
    await expect(porEstadoUI).toBeVisible();
    const conteos = await conteosPorEstado(page);
    for (const [estado, n] of Object.entries(porEstado)) expect(conteos[estado], `conteo de ${estado}`).toBe(String(n));
    expect(errores, "consola sin errores").toEqual([]);
  });

  test("E2E-03 · CA-03.1: sin enlace de fuente el envío se bloquea y señala el campo", async ({ page }) => {
    soloEscritorio();
    const descripcion = `${PREFIJO}sin-fuente-${sufijo()}`;
    await llenarAporte(page, { descripcion, sinFuente: true });
    await page.getByRole("button", { name: "Enviar aporte" }).click();
    const fuente = page.getByLabel("Enlace de la fuente");
    // El navegador bloquea el envío y señala el campo (validación del formulario).
    expect(await fuente.evaluate((e: HTMLInputElement) => e.validity.valueMissing)).toBe(true);
    await expect(fuente).toBeFocused();
    expect(await fuente.evaluate((e: HTMLInputElement) => e.validationMessage)).not.toBe("");
    await expect(page.getByText("Número de seguimiento")).toHaveCount(0);
    // Si se salta la validación del navegador, el servidor también lo señala.
    await page.evaluate(() => ((document.querySelector("form") as HTMLFormElement).noValidate = true));
    await page.getByRole("button", { name: "Enviar aporte" }).click();
    const alerta = page.getByRole("alert").filter({ hasText: "Revisa lo siguiente" });
    await expect(alerta).toBeVisible({ timeout: 20_000 });
    await expect(alerta).toContainText(/fuente/i);
    await expect(page.getByText("Número de seguimiento")).toHaveCount(0);
    expect(await contarAportes(descripcion), "no hay aporte nuevo").toBe(0);
  });

  test("E2E-04 · CA-03.2: sin correo de contacto el envío se bloquea y señala el campo", async ({ page }) => {
    soloEscritorio();
    const descripcion = `${PREFIJO}sin-correo-${sufijo()}`;
    await llenarAporte(page, { descripcion, sinCorreo: true });
    await page.getByRole("button", { name: "Enviar aporte" }).click();
    const correo = page.getByLabel("Correo de contacto");
    expect(await correo.evaluate((e: HTMLInputElement) => e.validity.valueMissing)).toBe(true);
    await expect(correo).toBeFocused();
    await expect(page.getByText("Número de seguimiento")).toHaveCount(0);
    await page.evaluate(() => ((document.querySelector("form") as HTMLFormElement).noValidate = true));
    await page.getByRole("button", { name: "Enviar aporte" }).click();
    const alerta = page.getByRole("alert").filter({ hasText: "Revisa lo siguiente" });
    await expect(alerta).toBeVisible({ timeout: 20_000 });
    await expect(alerta).toContainText(/correo/i);
    expect(await contarAportes(descripcion), "no hay aporte nuevo").toBe(0);
  });

  test("E2E-05 · CA-04.1, CA-06.1: aporte válido → número de seguimiento, nada cambia en / y queda pendiente", async ({ page, context }) => {
    soloEscritorio();
    const errores = vigilarConsola(page);
    test.setTimeout(CINCO_MIN + 180_000);
    // Se espera a que el inicio y la descarga reflejen la base (otras pruebas siembran
    // proyectos y el sitio tiene hasta 5 min para mostrarlos, RF-10).
    const { mw: mwBase } = await sumaEnOperacion();
    const { data: aprobados } = await admin().from("proyectos").select("nombre").eq("publicacion", "Aprobado");
    await hastaQue(page, "/", async () => {
      const t = (await csvPublico(page)).texto;
      return (await textoKpi(page, "Potencia en operación [MW]")).includes(`${fmt1(mwBase)} MW`) &&
        (aprobados ?? []).every((p) => t.includes(p.nombre)) &&
        !/e2e-\d{8}-\S*(pendiente|csv-)/.test(t);
    });
    await page.goto("/");
    // Se espera a que el bloque de conteos esté en el árbol de accesibilidad (en la corrida
    // del 2026-10-21 la primera lectura, justo después de cargar, salió vacía).
    await expect.poll(() => textoKpi(page, "Proyectos por estado"), { timeout: 15_000 }).toContain("term");
    const kpiAntes = await textoKpi(page, "Potencia en operación [MW]");
    const estadosAntes = await textoKpi(page, "Proyectos por estado");
    const csvAntes = (await csvPublico(page)).texto;

    const descripcion = `${PREFIJO}valido-${sufijo()}`;
    await llenarAporte(page, { descripcion });
    await page.getByRole("button", { name: "Enviar aporte" }).click();
    const estado = page.getByRole("status").filter({ hasText: "Número de seguimiento" });
    await expect(estado).toBeVisible({ timeout: 30_000 });
    const numero = (await estado.locator("strong").innerText()).trim();
    expect(numero).toMatch(/^\d+$/);

    await page.goto("/");
    await expect.poll(() => textoKpi(page, "Proyectos por estado"), { timeout: 15_000 }).toContain("term");
    expect(await textoKpi(page, "Potencia en operación [MW]")).toBe(kpiAntes);
    expect(await textoKpi(page, "Proyectos por estado")).toBe(estadosAntes);
    const csvDespues = (await csvPublico(page)).texto;
    expect(csvDespues.split(/\r?\n/).length).toBe(csvAntes.split(/\r?\n/).length);
    expect(await page.content()).not.toContain(descripcion);

    await iniciarSesionEditor(context);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Aportes pendientes" })).toBeVisible();
    const fila = page.getByRole("row").filter({ has: page.getByRole("cell", { name: numero, exact: true }) });
    await expect(fila).toHaveCount(1);
    await page.goto(`/admin/${numero}`);
    await expect(page.getByText(descripcion)).toBeVisible();
    await expect(page.getByRole("definition").filter({ hasText: /^Pendiente$/ })).toBeVisible();
    // RNF-10: el correo del aportante no se publica.
    await page.goto("/");
    expect(await page.content()).not.toContain(`${PREFIJO}aportante@`);
    expect(errores.filter((e) => !/turnstile|challenges\.cloudflare/i.test(e)), "consola sin errores").toEqual([]);
  });

  test("E2E-06 · CA-05.1: con la llave de prueba «siempre falla» el envío se rechaza y no se guarda", async ({ page }) => {
    soloEscritorio();
    test.skip(
      process.env.E2E_TURNSTILE_FALLA !== "1",
      "Requiere el servidor con TURNSTILE_SECRET_KEY de prueba «siempre falla» (corrida aparte)",
    );
    const descripcion = `${PREFIJO}turnstile-falla-${sufijo()}`;
    await llenarAporte(page, { descripcion });
    await page.getByRole("button", { name: "Enviar aporte" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /verific|humano|robot|captcha/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Número de seguimiento")).toHaveCount(0);
    expect(await contarAportes(descripcion), "no se guarda").toBe(0);
  });

  test("E2E-06b · CA-05.1 (complementaria): un envío sin respuesta de verificación se rechaza", async ({ page }) => {
    soloEscritorio();
    const descripcion = `${PREFIJO}sin-token-${sufijo()}`;
    await llenarAporte(page, { descripcion });
    await page.evaluate(() => document.querySelector('input[name="cf-turnstile-response"]')?.remove());
    await page.getByRole("button", { name: "Enviar aporte" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /\S/ }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Número de seguimiento")).toHaveCount(0);
    expect(await contarAportes(descripcion), "no se guarda").toBe(0);
  });

  test("E2E-07 · CA-05.2: el 6.º aporte del mismo origen en una hora recibe un mensaje de espera", async ({ page }) => {
    soloEscritorio();
    test.setTimeout(300_000);
    await limpiarTodo(); // deja el origen sin aportes recientes de estas pruebas
    for (let i = 1; i <= 5; i++) {
      await llenarAporte(page, { descripcion: `${PREFIJO}limite-${i}-${sufijo()}` });
      await page.getByRole("button", { name: "Enviar aporte" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Número de seguimiento" }), `aporte ${i}`).toBeVisible({ timeout: 30_000 });
    }
    const sexto = `${PREFIJO}limite-6-${sufijo()}`;
    await llenarAporte(page, { descripcion: sexto });
    await page.getByRole("button", { name: "Enviar aporte" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /espera|intenta|más tarde|límite|hora/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Número de seguimiento")).toHaveCount(0);
    expect(await contarAportes(sexto)).toBe(0);
  });

  test("E2E-08 · CA-07.1: /admin sin sesión redirige al acceso y un correo no autorizado no recibe enlace", async ({ page, context }) => {
    soloEscritorio();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/entrar/);
    await expect(page.getByRole("heading", { name: "Acceso de editores" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Aportes pendientes" })).toHaveCount(0);

    const intruso = `${PREFIJO}intruso-${sufijo()}@${DOMINIO_PRUEBA}`;
    await page.getByLabel("Correo de editor").fill(intruso);
    await page.getByRole("button", { name: "Recibir enlace de acceso" }).click();
    await expect(page.getByRole("status")).toContainText(/Si ese correo está autorizado/);
    // No se envía enlace: Supabase Auth no tiene ningún usuario ni invitación para ese correo.
    const { data } = await admin().auth.admin.listUsers({ page: 1, perPage: 1000 });
    expect(data.users.find((u) => u.email === intruso), "no se generó usuario ni enlace").toBeUndefined();

    // Una sesión válida de Auth que no está en la lista de editores tampoco ve /admin.
    const noEditor = `${PREFIJO}noeditor@${DOMINIO_PRUEBA}`;
    await iniciarSesionEditor(context, noEditor);
    await admin().from("editores").delete().eq("correo", noEditor);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Aportes pendientes" })).toHaveCount(0);
    const { data: aps } = await admin().from("aportes").select("id").limit(1);
    if (aps?.[0]) {
      await page.goto(`/admin/${aps[0].id}`);
      await expect(page.getByRole("button", { name: "Aprobar y publicar" })).toHaveCount(0);
    }
  });

  test("E2E-09 · CA-08.1: corrección de potencia → valor actual y propuesto lado a lado, con fuente", async ({ page, context }) => {
    soloEscritorio();
    const [p] = await sembrarProyectos([proyectoPrueba({ potencia_nominal_mw: 3 })]);
    const fuente = `https://ejemplo.co/correccion-${sufijo()}`;
    const a = await sembrarAporte({
      tipo: "Corrección",
      registro_afectado: p.nombre,
      descripcion: `${PREFIJO}correccion-potencia`,
      datos: { potencia_nominal_mw: 4.5 },
      fuente,
      origen: "usuario",
    });
    await iniciarSesionEditor(context);
    await page.goto("/admin");
    const fila = page.getByRole("row").filter({ has: page.getByRole("cell", { name: String(a.id), exact: true }) });
    await expect(fila).toContainText("Corrección");
    await expect(fila).toContainText(/Usuario/i);
    await expect(fila).toContainText(/\d{2}\/\d{2}\/\d{4}/);
    await expect(fila.getByRole("link", { name: "ejemplo.co" })).toHaveAttribute("href", fuente);
    await fila.getByRole("link", { name: "Revisar" }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/${a.id}$`));
    await expect(page.getByRole("heading", { name: "Valor actual frente al propuesto" })).toBeVisible();
    const filaPotencia = page.getByRole("row").filter({ has: page.getByRole("rowheader", { name: /potencia/i }) });
    await expect(filaPotencia).toHaveCount(1);
    const celdas = filaPotencia.getByRole("cell");
    await expect(celdas.nth(0)).toHaveText(/^3([.,]0)?$/);
    await expect(celdas.nth(1)).toHaveText(/^4[.,]5$/);
    await expect(page.getByRole("link", { name: fuente })).toBeVisible();
    // RNF-04: coma decimal, unidades entre corchetes y nombres legibles en la interfaz del editor.
    await expect.soft(celdas.nth(1), "RNF-04: coma decimal en el valor propuesto").toHaveText(/^4,5$/);
    await expect.soft(filaPotencia.getByRole("rowheader"), "RNF-04: nombre legible con unidad").toHaveText("Potencia nominal [MW]");
    await expect.soft(page.getByText(/[a-z]+_[a-z_]+/), "RNF-04: sin nombres técnicos con guion bajo").toHaveCount(0);
    await expect.soft(page.getByRole("definition").filter({ hasText: /\d{2}\/\d{2}\/\d{4}/ }), "RNF-04: fecha dd/mm/aaaa en el detalle").toHaveCount(1);
    const formAprobar = page.getByRole("form", { name: "Aprobar aporte" });
    await expect.soft(formAprobar.getByLabel("Potencia nominal [MW]"), "RNF-04: coma decimal en el campo ajustable").toHaveValue("4,5");
    await expect.soft(formAprobar.getByLabel("Longitud"), "RNF-04: coma decimal en la longitud").toHaveValue("-73,91");
  });

  test("E2E-10 · CA-09.1: rechazar sin motivo exige el motivo", async ({ page, context }) => {
    soloEscritorio();
    const a = await sembrarAporte({
      tipo: "Noticia",
      descripcion: `${PREFIJO}rechazo-sin-motivo`,
      datos: { titulo: `${PREFIJO}noticia` },
      fuente: "https://ejemplo.co/noticia",
      origen: "usuario",
    });
    await iniciarSesionEditor(context);
    await page.goto(`/admin/${a.id}`);
    const motivo = page.getByLabel(/Motivo/);
    await expect(motivo).toBeVisible();
    await page.getByRole("button", { name: "Rechazar aporte" }).click();
    // El envío se bloquea y se señala el motivo: validación del navegador o mensaje visible.
    const bloqueadoNativo = await motivo.evaluate((e: HTMLTextAreaElement | HTMLInputElement) => e.validity.valueMissing);
    test.info().annotations.push({ type: "validacion-nativa-motivo", description: String(bloqueadoNativo) });
    if (!bloqueadoNativo) {
      await expect(page.getByRole("alert").filter({ hasText: /motivo/i })).toBeVisible({ timeout: 20_000 });
    }
    // Saltando la validación del navegador, el servidor también lo exige.
    await page.evaluate(() =>
      document.querySelectorAll("form").forEach((f) => ((f as HTMLFormElement).noValidate = true)),
    );
    await page.getByRole("button", { name: "Rechazar aporte" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /motivo/i })).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(new RegExp(`/admin/${a.id}$`));
    const { data } = await admin().from("aportes").select("publicacion").eq("id", a.id).single();
    expect(data!.publicacion).toBe("Pendiente");
  });

  test("E2E-11 · CA-09.2, CA-10.1, CA-11.1: ajustar y aprobar publica lo ajustado en ≤ 5 min y queda en el historial", async ({ page, context }) => {
    soloEscritorio();
    test.setTimeout(CINCO_MIN + 180_000);
    const [p] = await sembrarProyectos([proyectoPrueba({ potencia_nominal_mw: 3, estado: "En operación" })]);
    const fuenteAporte = `https://ejemplo.co/correccion-aprobada-${sufijo()}`;
    const a = await sembrarAporte({
      tipo: "Corrección",
      registro_afectado: p.nombre,
      descripcion: `${PREFIJO}ajustar-y-aprobar`,
      datos: { potencia_nominal_mw: 4.5 },
      fuente: fuenteAporte,
      origen: "usuario",
    });
    await iniciarSesionEditor(context);
    await page.goto(`/admin/${a.id}`);
    const campo = page.getByLabel("Potencia nominal [MW]");
    await expect(campo).toHaveValue(/4[.,]5/);
    await campo.fill("5,25");
    await page.getByRole("button", { name: "Aprobar y publicar" }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
    const aprobadoEn = Date.now();

    // CA-10.1: visible en el sitio público (descarga) sin intervención, en ≤ 5 min.
    const espera = await hastaQue(page, "/", async () => {
      const linea = (await csvPublico(page)).texto.split(/\r?\n/).find((l) => l.startsWith(p.nombre + ","));
      return !!linea && linea.split(",")[11] === "5.25";
    });
    expect(espera, "la versión ajustada (5,25 MW) se publica en ≤ 5 min").toBeGreaterThanOrEqual(0);
    test.info().annotations.push({ type: "tiempo-publicacion", description: `${Math.round((Date.now() - aprobadoEn) / 1000)} s` });

    // CA-09.2: se publica la versión ajustada y se guardan ambas.
    const { data: aporte } = await admin().from("aportes").select("*").eq("id", a.id).single();
    expect(aporte!.publicacion).toBe("Aprobado");
    expect(Number(aporte!.datos.potencia_nominal_mw)).toBe(4.5);
    expect(Number(aporte!.datos_aprobados.potencia_nominal_mw)).toBe(5.25);

    // CA-11.1: historial con fecha, editor, aporte, valores anterior y nuevo, y fuente.
    const { data: hist } = await admin().from("historial").select("*").eq("aporte_id", a.id);
    expect(hist).toHaveLength(1);
    const h = hist![0];
    expect(h.creado_en).toBeTruthy();
    expect(h.editor).toBe(CORREO_EDITOR);
    expect(h.registro).toBe(p.nombre);
    expect(Number(h.antes.potencia_nominal_mw)).toBe(3);
    expect(Number(h.despues.potencia_nominal_mw)).toBe(5.25);
    expect(h.fuente, "la fuente del historial es la del aporte").toBe(fuenteAporte);

    // CA-11.1: el registro publicado conserva su fuente anterior y suma la del aporte.
    const { data: reg } = await admin().from("proyectos").select("fuente").eq("nombre", p.nombre).single();
    expect(reg!.fuente, "conserva la fuente anterior").toContain("https://ejemplo.co/fuente-e2e");
    expect(reg!.fuente, "suma la fuente del aporte").toContain(fuenteAporte);
    const lineaCsv = (await csvPublico(page)).texto.split(/\r?\n/).find((l) => l.startsWith(p.nombre + ","))!;
    expect(lineaCsv, "la descarga pública lleva ambas fuentes").toContain("https://ejemplo.co/fuente-e2e");
    expect(lineaCsv, "la descarga pública lleva ambas fuentes").toContain(fuenteAporte);

    // CA-11.1: el historial se consulta en /admin (desde el detalle del aporte).
    await page.goto(`/admin/${a.id}`);
    await page.getByRole("link", { name: /historial/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/historial/);
    await expect(page.getByRole("heading", { name: "Historial de cambios" })).toBeVisible();
    const filaH = page.getByRole("row").filter({ hasText: p.nombre }).filter({ hasText: `N.º ${a.id}` });
    await expect(filaH).toHaveCount(1);
    const hoy = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Bogota" }).format(new Date());
    await expect(filaH.getByRole("cell").nth(0), "fecha dd/mm/aaaa").toHaveText(hoy);
    await expect(filaH, "editor").toContainText(CORREO_EDITOR);
    await expect(filaH.getByRole("link", { name: `N.º ${a.id}` }), "aporte de origen").toHaveAttribute("href", `/admin/${a.id}`);
    await expect(filaH.getByRole("listitem").filter({ hasText: "Potencia nominal [MW]" }), "valores anterior y nuevo").toHaveText("Potencia nominal [MW]: 3 → 5,25");
    const enlacesFuente = filaH.getByRole("cell").last().getByRole("link");
    await expect(enlacesFuente, "fuente del aporte").toHaveCount(1);
    await expect(enlacesFuente).toHaveAttribute("href", fuenteAporte);
    // Acceso directo desde la navegación del editor.
    await page.goto("/admin");
    await page.getByRole("navigation", { name: "Editores" }).getByRole("link", { name: "Historial" }).click();
    await expect(page.getByRole("heading", { name: "Historial de cambios" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: `N.º ${a.id}` })).toHaveCount(1);
    // Sin sesión, el historial no es público.
    const anon = await page.context().browser()!.newContext();
    const pAnon = await anon.newPage();
    await pAnon.goto("http://localhost:3000/admin/historial");
    await expect(pAnon).toHaveURL(/\/admin\/entrar/);
    await expect(pAnon.getByText(CORREO_EDITOR)).toHaveCount(0);
    await anon.close();
  });

  test("E2E-12 · CA-12.1: una noticia propuesta por el agente aparece con origen agente y su nombre", async ({ page, context }) => {
    soloEscritorio();
    test.setTimeout(180_000);
    const agente = `${PREFIJO}agente-noticias`;
    const descripcion = `${PREFIJO}noticia-agente-${sufijo()}`;
    const r = spawnSync(
      "python",
      [
        "scripts/proponer_aporte.py",
        "--entorno", "pruebas",
        "--tipo", "Noticia",
        "--agente", agente,
        "--descripcion", descripcion,
        "--fuente", "https://ejemplo.co/noticia-agente",
        "--datos", JSON.stringify({ titulo: `${PREFIJO}titulo noticia`, medio: "Ejemplo", fecha: "2026-10-20", enlace: "https://ejemplo.co/noticia-agente" }),
      ],
      { cwd: RAIZ, encoding: "utf8", timeout: 120_000 },
    );
    test.info().annotations.push({ type: "proponer_aporte", description: `salida=${r.status} ${(r.stdout + r.stderr).trim().slice(0, 300)}` });
    expect(r.status, r.stderr).toBe(0);
    const { data } = await admin().from("aportes").select("id,origen,agente,publicacion").eq("descripcion", descripcion).single();
    expect(data!.origen).toBe("agente");
    expect(data!.publicacion).toBe("Pendiente");

    await iniciarSesionEditor(context);
    await page.goto("/admin");
    const fila = page.getByRole("row").filter({ has: page.getByRole("cell", { name: String(data!.id), exact: true }) });
    await expect(fila).toContainText(/agente/i);
    await expect.soft(fila, "nombre del agente en la lista").toContainText(agente);
    await page.goto(`/admin/${data!.id}`);
    await expect(page.getByRole("definition").filter({ hasText: /agente/i }).first()).toBeVisible();
    await expect(page.getByText(agente).first(), "nombre del agente en el detalle").toBeVisible();
  });

  test("E2E-13 · CA-13.1: el respaldo genera CSV sin correos, o termina con error si la API falla", async () => {
    soloEscritorio();
    test.setTimeout(240_000);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-respaldo-"));
    const carpeta = path.join(tmp, "ok");
    fs.mkdirSync(carpeta);
    // GIT_DIR inexistente: el respaldo de prueba no puede tocar el repositorio.
    const entorno = { ...process.env, GIT_DIR: path.join(tmp, "sin-git") };
    const ok = spawnSync("python", ["scripts/respaldo.py", "--entorno", "pruebas", "--carpeta", carpeta], {
      cwd: RAIZ, encoding: "utf8", timeout: 180_000, env: entorno,
    });
    expect(ok.status, ok.stderr).toBe(0);
    const archivos = fs.readdirSync(carpeta).filter((f) => f.endsWith(".csv"));
    expect(archivos.sort()).toEqual(expect.arrayContaining(["proyectos.csv", "normativa.csv", "noticias.csv"]));
    for (const f of archivos) {
      const t = fs.readFileSync(path.join(carpeta, f), "utf8");
      expect(t, `${f} sin correos`).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    }
    // Falla de la API: entorno apuntando a un servidor inexistente.
    const malo = path.join(tmp, "falla.env");
    fs.writeFileSync(
      malo,
      "NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9\nSUPABASE_URL=http://127.0.0.1:9\nSUPABASE_SERVICE_ROLE_KEY=clave-falsa-e2e\nNEXT_PUBLIC_SUPABASE_ANON_KEY=clave-falsa-e2e\n",
    );
    const carpetaFalla = path.join(tmp, "falla");
    fs.mkdirSync(carpetaFalla);
    const falla = spawnSync("python", ["scripts/respaldo.py", "--entorno", malo, "--carpeta", carpetaFalla], {
      cwd: RAIZ, encoding: "utf8", timeout: 180_000, env: entorno,
    });
    expect(falla.status).not.toBe(0);
    expect(falla.stdout + falla.stderr).toMatch(/error/i);
    expect(fs.readdirSync(carpetaFalla)).toEqual([]);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("E2E-14 · CA-14.1: la descarga trae solo aprobados, columna de fuente, licencia CC BY 4.0 y sin correos", async ({ page }) => {
    soloEscritorio();
    test.setTimeout(CINCO_MIN + 120_000);
    const [ap, pe] = await sembrarProyectos([
      proyectoPrueba({ nombre: `${PREFIJO}csv-aprobado-${sufijo()}` }),
      proyectoPrueba({ nombre: `${PREFIJO}csv-pendiente-${sufijo()}`, publicacion: "Pendiente" }),
    ]);
    const espera = await hastaQue(page, "/", async () => (await csvPublico(page)).texto.includes(ap.nombre));
    expect(espera).toBeGreaterThanOrEqual(0);
    const { texto, cabeceras } = await csvPublico(page);
    expect(cabeceras["content-type"]).toMatch(/text\/csv/);
    expect(cabeceras["content-disposition"]).toMatch(/attachment/);
    expect(texto).toMatch(/CC BY 4\.0/);
    const lineas = texto.replace(/^﻿/, "").split(/\r?\n/);
    const cabecera = lineas.find((l) => l.startsWith("Nombre,"))!;
    expect(cabecera.split(",")).toContain("Fuente");
    expect(texto).toContain(ap.nombre);
    expect(texto).not.toContain(pe.nombre);
    expect(texto).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    // Todas las filas publicadas en la base aparecen; ninguna que no esté aprobada.
    const { data } = await admin().from("proyectos").select("nombre,publicacion");
    for (const fila of data!) {
      if (fila.publicacion === "Aprobado") expect(texto, fila.nombre).toContain(fila.nombre);
      else expect(texto, fila.nombre).not.toContain(fila.nombre);
    }
    // Otras secciones con descarga (si existen) también llevan licencia.
    const noticias = await page.request.get("/datos/noticias.csv");
    if (noticias.ok()) expect(await noticias.text()).toMatch(/CC BY 4\.0/);
  });

  test("E2E-15 · CA-15.1: la importación rechaza los 7 proyectos con coordenadas 49,653 y acepta el CSV corregido", async () => {
    soloEscritorio();
    test.setTimeout(240_000);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-importar-"));
    // CSV original (antes de la corrección de coordenadas), tomado del historial de git.
    const original = spawnSync("git", ["show", "f98891d:datos/proyectos.csv"], { cwd: RAIZ, encoding: "utf8" });
    expect(original.status).toBe(0);
    expect(original.stdout).toContain("49,653");
    const rutaOriginal = path.join(tmp, "proyectos-original.csv");
    fs.writeFileSync(rutaOriginal, original.stdout);
    const r1 = spawnSync("python", ["scripts/importar.py", "--entorno", "pruebas", "--csv", rutaOriginal, "--simular"], {
      cwd: RAIZ, encoding: "utf8", timeout: 180_000,
    });
    const salida1 = r1.stdout + r1.stderr;
    expect(r1.status).not.toBe(0);
    const nombres = ["BESS Termozipa", "La Martina", "Celsia Solar Palmira 2", "Canadian solar", "Bosques Solares de los Llanos 8", "Parque solar andromeda", "Pradera solar"];
    for (const n of nombres) expect(salida1, n).toMatch(new RegExp(`RECHAZO.*\\(${n}\\).*Latitud.*fuera de rango`));

    // CSV corregido de prueba: los datos actuales con nombres prefijados.
    const rutaCorregido = path.join(tmp, "proyectos-corregido.csv");
    const prep = spawnSync("python", [path.join(__dirname, "csv_prueba.py"), path.join(RAIZ, "datos", "proyectos.csv"), rutaCorregido, PREFIJO], { encoding: "utf8" });
    expect(prep.status, prep.stderr).toBe(0);
    const r2 = spawnSync("python", ["scripts/importar.py", "--entorno", "pruebas", "--csv", rutaCorregido, "--simular"], {
      cwd: RAIZ, encoding: "utf8", timeout: 180_000,
    });
    expect(r2.status, r2.stdout + r2.stderr).toBe(0);
    expect(r2.stdout).toMatch(/7 proyectos válidos/);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("E2E-16 · CA-16.1: Estado = Planeado se rechaza con el mismo mensaje por aprobación, base de datos e importación", async ({ page, context }) => {
    soloEscritorio();
    test.setTimeout(240_000);
    const mensajes: Record<string, string> = {};

    // 1) Importación.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-planeado-"));
    const ruta = path.join(tmp, "planeado.csv");
    const prep = spawnSync("python", [path.join(__dirname, "csv_prueba.py"), path.join(RAIZ, "datos", "proyectos.csv"), ruta, PREFIJO, "planeado"], { encoding: "utf8" });
    expect(prep.status, prep.stderr).toBe(0);
    const r = spawnSync("python", ["scripts/importar.py", "--entorno", "pruebas", "--csv", ruta, "--simular"], {
      cwd: RAIZ, encoding: "utf8", timeout: 180_000,
    });
    expect(r.status).not.toBe(0);
    const linea = (r.stdout + r.stderr).split(/\r?\n/).find((l) => l.includes("Planeado"))!;
    mensajes.importacion = linea.replace(/^.*\): /, "").trim();
    fs.rmSync(tmp, { recursive: true, force: true });

    // 2) Aprobación por el editor.
    const a = await sembrarAporte({
      tipo: "Proyecto nuevo",
      descripcion: `${PREFIJO}nuevo-planeado`,
      datos: { ...proyectoPrueba({ estado: "Planeado" }), publicacion: undefined },
      fuente: "https://ejemplo.co/nuevo",
      origen: "usuario",
    });
    await iniciarSesionEditor(context);
    await page.goto(`/admin/${a.id}`);
    // En la aprobación, Estado es una lista con solo los valores permitidos.
    const estado = page.getByRole("combobox", { name: "Estado *" });
    await expect(estado).toBeVisible();
    const opciones = (await estado.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    expect(opciones).toEqual(["En operación", "En construcción", "Anunciado", "Inactivo"]);
    // Una petición manipulada (opción inyectada en el navegador) debe rechazarse en el servidor.
    // Se inyecta después de que la página termine de hidratarse (si no, React descarta la opción).
    await page.waitForLoadState("networkidle");
    await estado.evaluate((s: HTMLSelectElement) => {
      const o = document.createElement("option");
      o.value = "Planeado";
      o.textContent = "Planeado";
      s.appendChild(o);
      s.value = "Planeado";
    });
    await expect(estado).toHaveValue("Planeado");
    await page.getByRole("button", { name: "Aprobar y publicar" }).click();
    const alerta = page.getByRole("form", { name: "Aprobar aporte" }).getByRole("alert");
    await expect(alerta).toContainText("Planeado", { timeout: 20_000 });
    mensajes.aprobacion = (await alerta.innerText()).trim();
    const { data } = await admin().from("aportes").select("publicacion").eq("id", a.id).single();
    expect(data!.publicacion).toBe("Pendiente");

    // 3) Base de datos (vía directa con la llave de servicio).
    const db = await admin().from("proyectos").insert(proyectoPrueba({ estado: "Planeado" }));
    expect(db.error, "la base rechaza el valor").not.toBeNull();
    mensajes.baseDeDatos = db.error!.message;
    const { count: planeados } = await admin().from("proyectos").select("id", { count: "exact", head: true }).eq("estado", "Planeado");
    expect(planeados, "no se guardó ningún proyecto Planeado").toBe(0);

    test.info().annotations.push({ type: "mensajes", description: JSON.stringify(mensajes) });
    expect(mensajes.importacion).toContain("Planeado");
    expect.soft(mensajes.aprobacion, "aprobación = importación").toBe(mensajes.importacion);
    expect.soft(mensajes.baseDeDatos, "base de datos = importación").toBe(mensajes.importacion);
  });

  test("E2E-17 · CA-17.1: con movimiento reducido los KPI aparecen sin animación de conteo", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __kpi: string[] };
      w.__kpi = [];
      const leer = () => {
        const t = document.body?.innerText ?? "";
        const m = t.match(/[\d.,]+ MWh?/g);
        if (m) {
          const v = m.join(" | ");
          if (w.__kpi[w.__kpi.length - 1] !== v) w.__kpi.push(v);
        }
      };
      const id = setInterval(leer, 20);
      setTimeout(() => clearInterval(id), 4000);
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForTimeout(4200);
    const valores = await page.evaluate(() => (window as unknown as { __kpi: string[] }).__kpi);
    test.info().annotations.push({ type: "valores-kpi-reducido", description: JSON.stringify(valores) });
    expect(valores.length, `valores vistos: ${JSON.stringify(valores)}`).toBe(1);
    const animaciones = await page.evaluate(() =>
      document.getAnimations().filter((a) => a.playState === "running").length,
    );
    expect(animaciones).toBe(0);

    // Referencia (no bloqueante): sin la preferencia, RF-17 pide animación.
    const p2 = await page.context().newPage();
    await p2.addInitScript(() => {
      const w = window as unknown as { __kpi: string[] };
      w.__kpi = [];
      const id = setInterval(() => {
        const m = (document.body?.innerText ?? "").match(/[\d.,]+ MWh?/g);
        if (m) {
          const v = m.join(" | ");
          if (w.__kpi[w.__kpi.length - 1] !== v) w.__kpi.push(v);
        }
      }, 20);
      setTimeout(() => clearInterval(id), 4000);
    });
    await p2.emulateMedia({ reducedMotion: "no-preference" });
    await p2.goto("/");
    await p2.waitForTimeout(4200);
    const normales = await p2.evaluate(() => (window as unknown as { __kpi: string[] }).__kpi);
    test.info().annotations.push({ type: "valores-kpi-normal", description: `${normales.length} valores: ${JSON.stringify(normales.slice(0, 5))}` });
    expect.soft(normales.length, "sin movimiento reducido hay animación de conteo (RF-17)").toBeGreaterThan(1);
    await p2.close();
  });

  test("E2E-18 · RNF-01, RNF-03: 375 px sin desplazamiento horizontal, sin violaciones graves de axe y consola limpia", async ({ page }, info) => {
    test.setTimeout(240_000);
    if (info.project.name === "escritorio") await page.setViewportSize({ width: 375, height: 812 });
    const rutas = ["/", "/aportar", "/mapa", "/vehiculos", "/normativa", "/noticias", "/admin/entrar"];
    const axe = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
    const problemas: string[] = [];
    for (const ruta of rutas) {
      const errores = vigilarConsola(page);
      await page.goto(ruta);
      await page.waitForLoadState("load");
      await page.waitForTimeout(1500);
      const { sw, cw } = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      if (sw > cw) problemas.push(`${ruta}: desplazamiento horizontal (${sw} > ${cw})`);
      await page.addScriptTag({ content: axe });
      const graves = await page.evaluate(async () => {
        // @ts-expect-error axe inyectado
        const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
        return r.violations
          .filter((v: { impact: string }) => v.impact === "serious" || v.impact === "critical")
          .map((v: { id: string; impact: string; nodes: { target: string[] }[] }) => `${v.id} (${v.impact}) en ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join("; ")}`);
      });
      for (const g of graves) problemas.push(`${ruta}: axe ${g}`);
      for (const e of errores) problemas.push(`${ruta}: consola: ${e.slice(0, 200)}`);
      page.removeAllListeners("console");
      page.removeAllListeners("pageerror");
      // Teclado: el primer Tab lleva al enlace para saltar al contenido.
      await page.keyboard.press("Tab");
      const foco = await page.evaluate(() => document.activeElement?.textContent?.trim());
      if (foco !== "Saltar al contenido") problemas.push(`${ruta}: primer Tab en «${foco}»`);
    }
    test.info().annotations.push({ type: "problemas", description: problemas.join("\n") || "ninguno" });
    expect(problemas).toEqual([]);
  });

  test("RNF-09: cada página pública tiene título y descripción propios", async ({ page }) => {
    soloEscritorio();
    const vistos = new Map<string, string>();
    for (const ruta of ["/", "/aportar", "/mapa", "/vehiculos", "/normativa", "/noticias"]) {
      await page.goto(ruta);
      const titulo = await page.title();
      const desc = await page.locator('meta[name="description"]').getAttribute("content");
      expect(titulo, ruta).toBeTruthy();
      expect(desc, ruta).toBeTruthy();
      expect([...vistos.values()], `título repetido en ${ruta}`).not.toContain(titulo);
      vistos.set(ruta, titulo);
    }
  });

  test("RNF-07: ninguna llave de servicio llega al navegador", async ({ page }) => {
    soloEscritorio();
    test.setTimeout(120_000);
    const { ENV } = await import("./utilidades");
    const secretos = [ENV.SUPABASE_SERVICE_ROLE_KEY, ENV.TURNSTILE_SECRET_KEY].filter((s) => s && s.length > 10);
    const cuerpos: string[] = [];
    const pendientes: Promise<void>[] = [];
    page.on("response", async (r) => {
      const tipo = r.headers()["content-type"] ?? "";
      if (/javascript|html|json|text/.test(tipo)) pendientes.push(r.text().then((t) => { cuerpos.push(t); }, () => undefined));
    });
    for (const ruta of ["/", "/aportar", "/admin/entrar", "/mapa"]) {
      await page.goto(ruta);
      await page.waitForLoadState("load");
      await page.waitForTimeout(3000);
    }
    await Promise.all(pendientes);
    expect(cuerpos.length).toBeGreaterThan(5);
    const filtrado = cuerpos.filter((c) => secretos.some((s) => c.includes(s)));
    expect(filtrado.length, "respuestas que contienen una llave de servicio").toBe(0);
  });
});
