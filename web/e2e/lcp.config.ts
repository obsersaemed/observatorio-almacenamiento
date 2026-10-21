// Configuración aparte para E2E-19 (LCP contra el sitio publicado): sin servidor local.
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "001-lcp.spec.ts",
  workers: 1,
  retries: 1,
  reporter: [["list"]],
  projects: [{ name: "escritorio", use: { ...devices["Desktop Chrome"] } }],
});
