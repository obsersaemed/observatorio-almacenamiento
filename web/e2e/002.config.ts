// Configuración de la corrida de la spec 002: la misma que playwright.config.ts, pero
// con la URL del servidor configurable (E2E_URL) y WebGL por software (SwiftShader)
// para que el mapa de MapLibre se dibuje en Chromium sin interfaz.
import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

const URL = process.env.E2E_URL ?? "http://localhost:3000";
const args = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "002-implementacion.spec.ts",
  outputDir: "../test-results/002",
  reporter: [["list"], ["html", { open: "never", outputFolder: "../playwright-report/002" }]],
  use: { ...base.use, baseURL: URL },
  projects: (base.projects ?? []).map((p) => ({
    ...p,
    use: { ...p.use, baseURL: URL, launchOptions: { args } },
  })),
  webServer: { ...(base.webServer as object), url: URL } as never,
});
