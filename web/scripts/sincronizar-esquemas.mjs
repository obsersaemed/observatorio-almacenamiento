// Copia datos/esquemas.json (fuente única, compartida con scripts/validar_datos.py) a
// src/generado/, porque Turbopack no resuelve archivos fuera de web/. No editar la copia.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const web = join(dirname(fileURLToPath(import.meta.url)), "..");
const destino = join(web, "src", "generado", "esquemas.json");
mkdirSync(dirname(destino), { recursive: true });
copyFileSync(join(web, "..", "datos", "esquemas.json"), destino);
