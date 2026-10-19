"""Hook PostToolUse de Claude Code: si se editó algo en datos/, corre el validador.

Lee el evento JSON por stdin. Si hay errores, los envía por stderr y sale con 2
para que Claude los vea y los corrija.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validar_datos import RAIZ, validar  # noqa: E402


def main():
    try:
        evento = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    ruta = (evento.get("tool_input") or {}).get("file_path", "")
    try:
        Path(ruta).resolve().relative_to(RAIZ / "datos")
    except ValueError:
        return 0
    errores, _ = validar()
    if errores:
        sys.stderr.reconfigure(encoding="utf-8")
        print("El validador de datos encontró errores:\n" + "\n".join(errores), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
