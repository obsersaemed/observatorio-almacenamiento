"""Canal de agentes: propone un aporte a la cola de revisión (RF-12).

Lo usan las skills `buscar-noticias` y `ficha-normativa` en lugar de editar los CSV. El
aporte entra como Pendiente, con origen 'agente' y el nombre del agente; solo un editor
lo publica desde /admin. Usa la llave de servicio de web/.env.local y nunca la imprime.

Uso:
    python scripts/proponer_aporte.py --entorno pruebas --archivo propuesta.json
    python scripts/proponer_aporte.py --entorno pruebas --carpeta specs/004-normativa/propuestas
    python scripts/proponer_aporte.py --entorno pruebas --tipo Noticia --agente buscar-noticias \\
        --descripcion "..." --fuente https://... --datos '{"fecha": "2026-10-20", ...}'

Formato de propuesta.json:
    {"tipo": "Noticia" | "Norma" | "Proyecto nuevo" | "Corrección",
     "agente": "buscar-noticias", "descripcion": "...", "fuente": "https://...",
     "registro_afectado": "solo en correcciones",
     "datos": {columnas de la tabla destino con nombres SQL, p. ej. "titulo", "enlace"}}
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from supabase_rest import ErrorRest, cliente_de_entorno  # noqa: E402
from validar_datos import RAIZ, columna_sql, segmento_de_fila, validar_valor  # noqa: E402


def segmento_del_proyecto(datos, esquemas):
    """Segmento (008) del proyecto propuesto, deducido de sus servicios."""
    cols = esquemas["proyectos"]["columnas"]
    reg = {c["nombre"]: str(datos.get(columna_sql(c["nombre"])) or "") for c in cols}
    return segmento_de_fila(cols, reg)


def proponer(propuesta, cliente, esquemas):
    """Devuelve (código de salida, mensajes)."""
    fila = {
        "tipo": str(propuesta.get("tipo", "")).strip(),
        "registro_afectado": str(propuesta.get("registro_afectado") or "").strip() or None,
        "descripcion": str(propuesta.get("descripcion", "")).strip(),
        "fuente": str(propuesta.get("fuente", "")).strip(),
        "origen": "agente",
        "agente": str(propuesta.get("agente", "")).strip(),
        "publicacion": "Pendiente",
        "datos": propuesta.get("datos") or {},
    }

    # Mismas reglas que el formulario y la base; el correo (privado) no aplica a agentes.
    errores = []
    segmento = segmento_del_proyecto(fila["datos"], esquemas) if isinstance(fila["datos"], dict) else None
    for c in esquemas["aportes"]["columnas"]:
        if c.get("privado") or c["nombre"] not in fila:
            continue
        if fila[c["nombre"]] and c.get("texto_si_segmento") and c["texto_si_segmento"] == segmento:
            continue  # 008 · RF-09: referencia textual sin URL
        problema = validar_valor(c, fila[c["nombre"]] or "", esquemas["_mensajes"])
        if problema:
            errores.append(problema)
    if not fila["agente"]:
        errores.append("Indica el nombre del agente (por ejemplo, buscar-noticias).")
    if fila["tipo"] == "Corrección" and not fila["registro_afectado"]:
        errores.append("Una corrección debe indicar el registro afectado.")
    if not isinstance(fila["datos"], dict):
        errores.append("'datos' debe ser un objeto JSON con las columnas propuestas.")
    if errores:
        return 1, [f"RECHAZO  {e}" for e in errores]

    try:
        respuesta = cliente.insertar("aportes", [fila], devolver=True)
    except ErrorRest as e:
        return 2, [f"ERROR  {e}"]
    seguimiento = respuesta[0]["id"] if respuesta else "?"
    return 0, [f"Aporte {seguimiento} propuesto como Pendiente por el agente '{fila['agente']}'. Revísalo en /admin."]


def proponer_carpeta(carpeta, cliente, esquemas):
    """Un aporte por cada .json de la carpeta, en orden de nombre (004 · RF-14). Se detiene en el
    primer rechazo o error para no dejar la carga a medias sin aviso."""
    salida = []
    for archivo in sorted(Path(carpeta).glob("*.json")):
        codigo, mensajes = proponer(json.loads(archivo.read_text(encoding="utf-8")), cliente, esquemas)
        salida += [f"{archivo.name}: {m}" for m in mensajes]
        if codigo:
            return codigo, salida
    return 0, salida


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--entorno", required=True, help="'pruebas' o ruta a un archivo .env")
    p.add_argument("--archivo", help="propuesta en JSON")
    p.add_argument("--carpeta", help="carpeta con una propuesta JSON por archivo")
    for campo in ("tipo", "agente", "descripcion", "fuente", "registro-afectado", "datos"):
        p.add_argument(f"--{campo}")
    a = p.parse_args()

    if a.carpeta:
        propuesta = None
    elif a.archivo:
        propuesta = json.loads(Path(a.archivo).read_text(encoding="utf-8"))
    else:
        try:
            datos = json.loads(a.datos) if a.datos else {}
        except json.JSONDecodeError as e:
            print(f"RECHAZO  --datos no es JSON válido: {e}")
            sys.exit(1)
        propuesta = {"tipo": a.tipo, "agente": a.agente, "descripcion": a.descripcion, "fuente": a.fuente,
                     "registro_afectado": a.registro_afectado, "datos": datos}

    esquemas = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))
    try:
        cliente = cliente_de_entorno(a.entorno)
    except ErrorRest as e:
        print(f"ERROR  {e}")
        sys.exit(2)
    if a.carpeta:
        codigo, mensajes = proponer_carpeta(a.carpeta, cliente, esquemas)
    else:
        codigo, mensajes = proponer(propuesta, cliente, esquemas)
    print("\n".join(mensajes))
    sys.exit(codigo)


if __name__ == "__main__":
    main()
