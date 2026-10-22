"""003 · T05 · RF-12, RF-14, CA-14.1, CA-14.2: importación de vehículos contra un servidor REST
simulado. Datos ficticios. Correr con: python -m unittest discover pruebas"""
import json
import shutil
import sys
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from importar_vehiculos import importar  # noqa: E402
from supabase_rest import ClienteRest  # noqa: E402
from test_importar import ServidorFalso  # noqa: E402
from test_validar_datos import ENC_LINEAS, ENC_VENTAS  # noqa: E402


class TestImportarVehiculos(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        self.esquemas = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))

    def tearDown(self):
        shutil.rmtree(self.dir)

    def correr(self, lineas, ventas, corte="2026-09-17", simular=False, estado=200):
        (self.dir / "vehiculos_lineas.csv").write_text(ENC_LINEAS + lineas, encoding="utf-8")
        (self.dir / "vehiculos_ventas.csv").write_text(ENC_VENTAS + ventas, encoding="utf-8")
        servidor = ServidorFalso(estado, cuerpo=7)
        self.addCleanup(servidor.cerrar)
        codigo, mensajes = importar(self.dir, corte, ClienteRest(servidor.url, "llave-de-prueba"), self.esquemas, simular)
        return codigo, mensajes, servidor.peticiones

    def test_con_errores_no_llama_a_la_base_y_sale_con_1(self):
        codigo, mensajes, peticiones = self.correr("Marca A,Linea 1,NMC,40,60,\n", "Linea 1,2024,-3\n")
        self.assertEqual(codigo, 1)
        self.assertEqual(peticiones, [])
        self.assertTrue(any("RECHAZO" in m and "Tipo de batería" in m for m in mensajes), mensajes)
        self.assertTrue(any("RECHAZO" in m and "Unidades" in m for m in mensajes), mensajes)

    def test_con_datos_validos_llama_una_vez_a_reemplazar_vehiculos(self):
        codigo, mensajes, peticiones = self.correr("Marca A,Linea 1,LFP,40,60,100\n", "Linea 1,2024,100\nLinea 1,2025,0\n")
        self.assertEqual(codigo, 0, mensajes)
        self.assertEqual(len(peticiones), 1)
        p = peticiones[0]
        self.assertEqual(p["ruta"], "/rest/v1/rpc/reemplazar_vehiculos")
        self.assertEqual(p["cuerpo"]["p_corte"], "2026-09-17")
        self.assertEqual(p["cuerpo"]["p_lineas"], [{
            "marca": "Marca A", "linea": "Linea 1", "tipo_de_bateria": "LFP",
            "capacidad_minima_kwh": 40, "capacidad_maxima_kwh": 60, "potencia_kw": 100,
        }])
        self.assertEqual(p["cuerpo"]["p_ventas"], [
            {"linea": "Linea 1", "ano": 2024, "unidades": 100},
            {"linea": "Linea 1", "ano": 2025, "unidades": 0},
        ])
        self.assertTrue(any("1 línea" in m and "100 unidades" in m for m in mensajes), mensajes)

    def test_simular_no_envia_nada(self):
        codigo, mensajes, peticiones = self.correr("Marca A,Linea 1,LFP,40,60,\n", "Linea 1,2024,10\n", simular=True)
        self.assertEqual(codigo, 0)
        self.assertEqual(peticiones, [])
        self.assertTrue(any("Simulación" in m for m in mensajes))

    def test_el_corte_no_puede_ser_posterior_a_hoy_ni_invalido(self):
        manana = (date.today() + timedelta(days=1)).isoformat()
        for corte in (manana, "17/09/2026", ""):
            codigo, mensajes, peticiones = self.correr("Marca A,Linea 1,LFP,40,60,\n", "Linea 1,2024,10\n", corte=corte)
            self.assertEqual(codigo, 1, corte)
            self.assertEqual(peticiones, [])
            self.assertTrue(any("corte" in m.lower() for m in mensajes), mensajes)

    def test_un_rechazo_de_la_base_se_reporta_y_sale_con_1(self):
        codigo, mensajes, _ = self.correr("Marca A,Linea 1,LFP,40,60,\n", "Linea 1,2024,10\n", estado=400)
        self.assertEqual(codigo, 1)
        self.assertTrue(any("falla simulada" in m for m in mensajes), mensajes)
