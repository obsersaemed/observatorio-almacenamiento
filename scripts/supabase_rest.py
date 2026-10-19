"""Cliente mínimo de la API REST de Supabase (PostgREST) con la biblioteca estándar.
Lo usan importar.py, proponer_aporte.py y respaldo.py. Las llaves se leen de
web/.env.local (o del archivo que se indique) y nunca se imprimen."""
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ENTORNOS = {"pruebas": RAIZ / "web" / ".env.local"}


class ErrorRest(Exception):
    pass


def leer_env(ruta):
    env = {}
    for linea in Path(ruta).read_text(encoding="utf-8").splitlines():
        m = re.match(r"^([A-Z_]+)=(.*)$", linea.strip())
        if m:
            env[m.group(1)] = m.group(2).strip()
    return env


def cliente_de_entorno(entorno, llave="SUPABASE_SERVICE_ROLE_KEY"):
    """Cliente para un entorno con nombre ('pruebas') o la ruta de un archivo .env."""
    ruta = ENTORNOS.get(entorno, entorno)
    env = leer_env(ruta)
    url, valor = env.get("NEXT_PUBLIC_SUPABASE_URL"), env.get(llave)
    if not url or not valor:
        raise ErrorRest(f"Faltan NEXT_PUBLIC_SUPABASE_URL o {llave} en {ruta}")
    return ClienteRest(url, valor)


class ClienteRest:
    def __init__(self, url, llave, tiempo=30):
        self.base = url.rstrip("/") + "/rest/v1/"
        self.llave = llave
        self.tiempo = tiempo

    def _pedir(self, metodo, ruta, cuerpo=None, prefer=None):
        datos = None if cuerpo is None else json.dumps(cuerpo, ensure_ascii=False).encode("utf-8")
        cabeceras = {"apikey": self.llave, "Authorization": f"Bearer {self.llave}",
                     "Content-Type": "application/json", "Accept": "application/json"}
        if prefer:
            cabeceras["Prefer"] = prefer
        peticion = urllib.request.Request(self.base + ruta, data=datos, headers=cabeceras, method=metodo)
        try:
            with urllib.request.urlopen(peticion, timeout=self.tiempo) as r:
                texto = r.read().decode("utf-8")
                return json.loads(texto) if texto else None
        except urllib.error.HTTPError as e:
            raise ErrorRest(f"{metodo} {ruta.split('?')[0]} → HTTP {e.code}: {e.read().decode('utf-8', 'replace')}") from None
        except urllib.error.URLError as e:
            raise ErrorRest(f"{metodo} {ruta.split('?')[0]} → sin conexión: {e.reason}") from None

    def insertar(self, tabla, filas, conflicto=None, devolver=False):
        """POST de una lista de filas; con `conflicto` actualiza las que ya existen (upsert)."""
        ruta = tabla + (f"?on_conflict={urllib.parse.quote(conflicto)}" if conflicto else "")
        prefer = ["return=representation" if devolver else "return=minimal"]
        if conflicto:
            prefer.append("resolution=merge-duplicates")
        return self._pedir("POST", ruta, filas, ",".join(prefer))

    def seleccionar(self, tabla, consulta="select=*"):
        return self._pedir("GET", f"{tabla}?{consulta}")
