// E2E-19 · RNF-02: LCP de "/" con build de producción y red 4G lenta.
// No se compila localmente (límite de RAM: no correr `npm run build` con `npm run dev`).
// Se mide, solo lectura, contra el sitio publicado en Vercel, emulando un móvil con la
// red y la CPU que usa Lighthouse para móvil ("Slow 4G": 150 ms RTT, 1,6 Mb/s de bajada,
// 750 kb/s de subida; CPU 4× más lenta). Se corre solo con E2E_LCP=1.
import { test, expect } from "@playwright/test";

const SITIO = process.env.E2E_LCP_URL ?? "https://observatorio-almacenamiento.vercel.app";
const RUTAS = ["/", "/aportar", "/mapa", "/vehiculos", "/normativa", "/noticias"];

test.describe("001 · RNF-02 (LCP)", () => {
  test.skip(process.env.E2E_LCP !== "1", "Medición de LCP: corrida aparte con E2E_LCP=1");

  for (const ruta of RUTAS) {
    test(`E2E-19 · RNF-02: LCP de ${ruta} < 2,5 s en 4G`, async ({ browser }, info) => {
      test.skip(info.project.name !== "escritorio");
      test.setTimeout(180_000);
      const medidas: number[] = [];
      for (let i = 0; i < 3; i++) {
        const context = await browser.newContext({
          viewport: { width: 412, height: 823 },
          deviceScaleFactor: 1.75,
          isMobile: true,
          hasTouch: true,
          locale: "es-CO",
        });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 150,
          downloadThroughput: (1.6 * 1024 * 1024) / 8,
          uploadThroughput: (750 * 1024) / 8,
        });
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await page.addInitScript(() => {
          const w = window as unknown as { __lcp: number };
          w.__lcp = 0;
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) w.__lcp = e.startTime;
          }).observe({ type: "largest-contentful-paint", buffered: true });
        });
        await page.goto(SITIO + ruta, { waitUntil: "load", timeout: 120_000 });
        await page.waitForTimeout(3000);
        // LCP se fija con la primera interacción; se lee antes de interactuar.
        const lcp = await page.evaluate(() => (window as unknown as { __lcp: number }).__lcp);
        medidas.push(lcp);
        await context.close();
      }
      const ordenadas = [...medidas].sort((a, b) => a - b);
      const mediana = ordenadas[1];
      info.annotations.push({ type: "lcp-ms", description: `${ruta}: ${medidas.map((m) => Math.round(m)).join(", ")} (mediana ${Math.round(mediana)})` });
      expect(mediana, `LCP mediana de ${ruta}`).toBeGreaterThan(0);
      expect(mediana, `LCP mediana de ${ruta}`).toBeLessThan(2500);
    });
  }
});
