import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Pruebas de integración contra el proyecto Supabase "pruebas" (variables en .env.local).
// Van aparte de `npm test` porque necesitan red y credenciales.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/integracion/**/*.test.ts"],
    env: loadEnv("test", process.cwd(), ""),
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
