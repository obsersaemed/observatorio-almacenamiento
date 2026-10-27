// Configuración de la corrida de la spec 008 (detrás del medidor): la misma que 002.config.ts (URL
// configurable con E2E_URL y WebGL por software para el mapa), pero para 008-medidor.spec.ts.
//   npx playwright test -c e2e/008.config.ts --project=escritorio --workers=1
import { defineConfig } from "@playwright/test";
import base from "./002.config";

export default defineConfig({
  ...base,
  testMatch: "008-medidor.spec.ts",
  outputDir: "../test-results/008",
  reporter: [["list"], ["html", { open: "never", outputFolder: "../playwright-report/008" }]],
  workers: 1,
  // La primera compilación de /mapa en `next dev` tarda más de 30 s en este equipo.
  timeout: 120_000,
  // Sin trazas: en este equipo guardarlas fallaba con errores de E/S («UNKNOWN: unknown error, open …trace»).
  use: { ...base.use, trace: "off" },
  projects: (base.projects ?? []).map((p) => ({ ...p, use: { ...p.use, trace: "off" } })),
});
