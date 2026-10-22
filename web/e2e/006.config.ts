// Configuración de la corrida de la spec 006 (gráficas de /mapa): la misma que
// 002.config.ts (URL configurable con E2E_URL y WebGL por software), pero para
// 006-graficas.spec.ts. E2E_MATCH permite correr archivos auxiliares por tandas.
import { defineConfig } from "@playwright/test";
import base from "./002.config";

export default defineConfig({
  ...base,
  testMatch: process.env.E2E_MATCH ?? "006-graficas.spec.ts",
  outputDir: "../test-results/006",
  reporter: [["list"], ["html", { open: "never", outputFolder: "../playwright-report/006" }]],
});
