"""Cliente REST: un reintento solo si la conexión no llegó a establecerse (la petición no
salió), como fetchConReintento en la web. Correr con: python -m unittest discover pruebas"""
import sys
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import supabase_rest  # noqa: E402
from supabase_rest import ClienteRest, ErrorRest  # noqa: E402


class RespuestaFalsa:
    def __init__(self, texto=b'[{"id": 1}]'):
        self.texto = texto

    def read(self):
        return self.texto

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


SIN_CONEXION = urllib.error.URLError(TimeoutError(10060, "la conexión expiró"))


class TestReintento(unittest.TestCase):
    def test_reintenta_una_vez_si_no_hubo_conexion(self):
        with mock.patch.object(supabase_rest.urllib.request, "urlopen", side_effect=[SIN_CONEXION, RespuestaFalsa()]) as abrir:
            self.assertEqual(ClienteRest("https://x.co", "k").seleccionar("t"), [{"id": 1}])
            self.assertEqual(abrir.call_count, 2)

    def test_si_vuelve_a_fallar_informa_sin_conexion(self):
        with mock.patch.object(supabase_rest.urllib.request, "urlopen", side_effect=[SIN_CONEXION, SIN_CONEXION]) as abrir:
            with self.assertRaises(ErrorRest):
                ClienteRest("https://x.co", "k").insertar("t", [{}])
            self.assertEqual(abrir.call_count, 2)

    def test_no_reintenta_un_tiempo_agotado_con_la_peticion_ya_enviada(self):
        with mock.patch.object(supabase_rest.urllib.request, "urlopen", side_effect=TimeoutError("lectura")) as abrir:
            with self.assertRaises(ErrorRest):
                ClienteRest("https://x.co", "k").insertar("t", [{}])
            self.assertEqual(abrir.call_count, 1)


if __name__ == "__main__":
    unittest.main()
