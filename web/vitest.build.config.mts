import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

// Revisión del resultado del build (T17): se corre después de `next build`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/build/**/*.test.ts"],
    env: loadEnv("test", process.cwd(), ""),
  },
});
