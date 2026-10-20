// T17 · RNF-07: ninguna llave de servicio llega al navegador. Revisa los archivos que Next
// envía al cliente (.next/static) después de `next build`. Correr con: npm run test:secretos
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const ESTATICOS = join(process.cwd(), ".next", "static");

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe("secretos fuera del navegador (RNF-07)", () => {
  test("existe el build que se va a revisar", () => {
    expect(existsSync(ESTATICOS), "Corre `npm run build` antes (npm run test:secretos lo hace)").toBe(true);
  });

  test("ni los valores ni los nombres de las llaves privadas aparecen en .next/static", () => {
    const privadas = [process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.TURNSTILE_SECRET_KEY].filter(
      (v): v is string => !!v && v.length > 8,
    );
    const contenido = archivos(ESTATICOS)
      .filter((r) => /\.(js|css|html|json|txt|map)$/.test(r))
      .map((r) => readFileSync(r, "utf-8"))
      .join("\n");
    for (const valor of privadas) expect(contenido.includes(valor)).toBe(false);
    expect(contenido).not.toMatch(/sb_secret_[A-Za-z0-9_-]{10,}/);
    expect(contenido).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(contenido).not.toContain("TURNSTILE_SECRET_KEY");
  });
});
