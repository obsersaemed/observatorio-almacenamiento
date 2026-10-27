// Configuración de la corrida de la spec 007 (rediseño): la misma que 002.config.ts (URL
// configurable con E2E_URL y WebGL por software para el mapa), pero para 007-rediseno.spec.ts.
//   npx playwright test -c e2e/007.config.ts --project=escritorio --workers=1
import { defineConfig } from "@playwright/test";
import base from "./002.config";

export default defineConfig({
  ...base,
  testMatch: "007-rediseno.spec.ts",
  outputDir: "../test-results/007",
  reporter: [["list"], ["html", { open: "never", outputFolder: "../playwright-report/007" }]],
  // Sin trazas: en este equipo guardarlas fallaba con errores de E/S («UNKNOWN: unknown error, open …trace»).
  use: { ...base.use, trace: "off" },
  projects: (base.projects ?? []).map((p) => ({ ...p, use: { ...p.use, trace: "off" } })),
});
