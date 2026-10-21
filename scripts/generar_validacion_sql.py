"""Genera la validación SQL de las tablas a partir de datos/esquemas.json (RF-16, CA-16.1).

Cada tabla recibe un disparador BEFORE INSERT/UPDATE que rechaza los valores con
exactamente los mismos mensajes (_mensajes) que usan la web y scripts/validar_datos.py.
Se ejecuta antes que las restricciones CHECK de 0001, así que el mensaje que llega es este.

Uso:
    python scripts/generar_validacion_sql.py              # imprime el bloque SQL
    python scripts/generar_validacion_sql.py --escribir   # lo reemplaza en la migración 0003
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validar_datos import RAIZ, columna_sql, limite  # noqa: E402

INICIO = "-- >>> validación generada desde datos/esquemas.json con scripts/generar_validacion_sql.py (no editar a mano)"
FIN = "-- <<< fin de la validación generada"
MIGRACION = RAIZ / "supabase" / "migrations" / "0003_correcciones_e2e.sql"
ESQUEMAS = ("proyectos", "normativa", "noticias", "aportes")


def literal(texto):
    return "'" + str(texto).replace("'", "''") + "'"


def lanzar(mensaje, valor_sql=None):
    """RAISE con código check_violation; si lleva valor, el mensaje usa format() con %s."""
    if valor_sql is None:
        return f"raise exception using errcode = '23514', message = {literal(mensaje)};"
    return f"raise exception using errcode = '23514', message = format({literal(mensaje)}, {valor_sql});"


def reglas_de(columna, mensajes):
    col = f"new.{columna_sql(columna['nombre'])}"
    m = lambda clave, **kw: mensajes[clave].format(columna=columna["nombre"], **kw)  # noqa: E731
    lineas = []
    if columna.get("obligatorio"):
        lineas.append(f"if {col} is null or btrim({col}::text) = '' then {lanzar(m('obligatorio'))} end if;")
    tipo = columna["tipo"]
    if tipo == "enum":
        valores = ", ".join(literal(v) for v in columna["valores"])
        texto = m("valores", valor="%s", valores=", ".join(columna["valores"]))
        lineas.append(f"if {col} is not null and {col} not in ({valores}) then {lanzar(texto, col)} end if;")
    elif tipo == "numero" and ("min" in columna or "max" in columna):
        condiciones = []
        if "min" in columna:
            condiciones.append(f"{col} < {columna['min']}")
        if "max" in columna:
            condiciones.append(f"{col} > {columna['max']}")
        texto = m("rango", valor="%s", min=limite(columna.get("min", "-inf")), max=limite(columna.get("max", "inf")))
        lineas.append(f"if {col} is not null and ({' or '.join(condiciones)}) then {lanzar(texto, col)} end if;")
    elif tipo == "urls":
        lineas.append(
            f"if {col} is not null and exists (select 1 from regexp_split_to_table(btrim({col}), '\\s+') as u "
            f"where u <> '' and u !~ '^https?://\\S+$') then {lanzar(m('urls'))} end if;"
        )
    return lineas


def generar(esquemas):
    mensajes = esquemas["_mensajes"]
    partes = [INICIO]
    for nombre in ESQUEMAS:
        esquema = esquemas[nombre]
        tabla = esquema["tabla"]
        cuerpo = []
        for c in esquema["columnas"]:
            if not c.get("privado"):
                cuerpo.extend(reglas_de(c, mensajes))
        partes.append(
            f"create or replace function public.validar_{tabla}() returns trigger\n"
            f"language plpgsql set search_path = public as $$\n"
            f"begin\n" + "".join(f"  {l}\n" for l in cuerpo) + "  return new;\nend;\n$$;\n"
            f"drop trigger if exists validar_{tabla} on public.{tabla};\n"
            f"create trigger validar_{tabla} before insert or update on public.{tabla}\n"
            f"  for each row execute function public.validar_{tabla}();"
        )
    partes.append(FIN)
    return "\n\n".join(partes) + "\n"


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--escribir", action="store_true", help=f"reemplaza el bloque en {MIGRACION.name}")
    a = p.parse_args()
    bloque = generar(json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8")))
    if not a.escribir:
        print(bloque)
        return
    texto = MIGRACION.read_text(encoding="utf-8")
    inicio, fin = texto.index(INICIO), texto.index(FIN) + len(FIN)
    MIGRACION.write_text(texto[:inicio] + bloque.rstrip("\n") + texto[fin:], encoding="utf-8")
    print(f"Bloque de validación actualizado en {MIGRACION}")


if __name__ == "__main__":
    main()
