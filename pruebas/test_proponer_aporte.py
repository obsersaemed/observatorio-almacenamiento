"""Canal de agentes (T14, RF-12, CA-12.1): las propuestas entran a la cola de aportes como
Pendiente, con origen 'agente', el nombre del agente y fuente obligatoria.
Correr con: python -m unittest discover pruebas"""
import json
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from proponer_aporte import proponer, proponer_carpeta  # noqa: E402
from supabase_rest import ClienteRest  # noqa: E402
from test_importar import ServidorFalso  # noqa: E402

ESQUEMAS = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))

NOTICIA = {
    "tipo": "Noticia",
    "descripcion": "Nueva subasta de almacenamiento",
    "fuente": "https://ejemplo.co/nota",
    "agente": "buscar-noticias",
    "datos": {"fecha": "2026-10-20", "titulo": "Subasta", "medio": "Ejemplo", "enlace": "https://ejemplo.co/nota"},
}


class TestProponerAporte(unittest.TestCase):
    def correr(self, propuesta, estado=201):
        servidor = ServidorFalso(estado, cuerpo=[{"id": 77}])
        self.addCleanup(servidor.cerrar)
        codigo, mensajes = proponer(propuesta, ClienteRest(servidor.url, "llave-de-prueba"), ESQUEMAS)
        return codigo, mensajes, servidor.peticiones

    def test_envia_pendiente_de_agente_y_devuelve_el_seguimiento(self):
        codigo, mensajes, peticiones = self.correr(NOTICIA)
        self.assertEqual(codigo, 0, mensajes)
        self.assertEqual(len(peticiones), 1)
        p = peticiones[0]
        self.assertTrue(p["ruta"].startswith("/rest/v1/aportes"))
        self.assertIn("return=representation", p["cabeceras"]["prefer"])
        fila = p["cuerpo"][0]
        self.assertEqual(fila["origen"], "agente")
        self.assertEqual(fila["agente"], "buscar-noticias")
        self.assertEqual(fila["publicacion"], "Pendiente")
        self.assertEqual(fila["fuente"], "https://ejemplo.co/nota")
        self.assertEqual(fila["datos"], NOTICIA["datos"])
        self.assertNotIn("correo", fila)
        self.assertIn("77", "\n".join(mensajes))

    def test_sin_fuente_se_niega_y_no_envia_nada(self):
        codigo, mensajes, peticiones = self.correr({**NOTICIA, "fuente": ""})
        self.assertNotEqual(codigo, 0)
        self.assertEqual(peticiones, [])
        esperado = ESQUEMAS["_mensajes"]["obligatorio"].format(columna="fuente")
        self.assertTrue(any(esperado in m for m in mensajes), mensajes)

    def test_proyecto_detras_del_medidor_acepta_fuente_textual(self):
        # 008 · RF-09: la misma regla que el validador, la base y /admin.
        propuesta = {"tipo": "Proyecto nuevo", "agente": "carga-008", "descripcion": "Carga 008",
                     "fuente": "Información de Azimut Energía (2026-10)",
                     "datos": {"tipo_uso_conexion": "Maximización de autoconsumo PV y respaldo"}}
        codigo, mensajes, peticiones = self.correr(propuesta)
        self.assertEqual(codigo, 0, mensajes)
        self.assertEqual(len(peticiones), 1)

        gran_escala = {**propuesta, "datos": {"tipo_uso_conexion": "Regulación primaria de frecuencia"}}
        codigo, _, peticiones = self.correr(gran_escala)
        self.assertNotEqual(codigo, 0)
        self.assertEqual(peticiones, [])

    def test_sin_nombre_de_agente_se_niega(self):
        codigo, _, peticiones = self.correr({**NOTICIA, "agente": ""})
        self.assertNotEqual(codigo, 0)
        self.assertEqual(peticiones, [])

    def test_una_correccion_exige_el_registro_afectado(self):
        codigo, mensajes, peticiones = self.correr({**NOTICIA, "tipo": "Corrección", "datos": {"tabla": "noticias"}})
        self.assertNotEqual(codigo, 0)
        self.assertEqual(peticiones, [])
        self.assertIn("registro", "\n".join(mensajes).lower())

    def test_tipo_invalido_se_rechaza_con_el_mensaje_compartido(self):
        codigo, mensajes, _ = self.correr({**NOTICIA, "tipo": "Rumor"})
        self.assertNotEqual(codigo, 0)
        self.assertTrue(any("'tipo' = 'Rumor'" in m for m in mensajes), mensajes)

    def test_error_de_la_api_termina_con_codigo_distinto_de_cero(self):
        codigo, mensajes, _ = self.correr(NOTICIA, estado=500)
        self.assertNotEqual(codigo, 0)
        self.assertIn("falla simulada", "\n".join(mensajes))


if __name__ == "__main__":
    unittest.main()


class TestProponerCarpeta(unittest.TestCase):
    """004 · T17 · RF-14, CA-14.1: la carga inicial se envía como un aporte por archivo."""

    def carpeta(self, propuestas):
        import tempfile
        d = Path(tempfile.mkdtemp())
        for i, p in enumerate(propuestas):
            (d / f"{i:02d}.json").write_text(json.dumps(p, ensure_ascii=False), encoding="utf-8")
        return d

    def test_envia_un_aporte_por_archivo_en_orden(self):
        servidor = ServidorFalso(201, cuerpo=[{"id": 5}])
        self.addCleanup(servidor.cerrar)
        d = self.carpeta([NOTICIA, {**NOTICIA, "descripcion": "Otra"}])
        codigo, mensajes = proponer_carpeta(d, ClienteRest(servidor.url, "llave-de-prueba"), ESQUEMAS)
        self.assertEqual(codigo, 0, mensajes)
        self.assertEqual([p["cuerpo"][0]["descripcion"] for p in servidor.peticiones], ["Nueva subasta de almacenamiento", "Otra"])

    def test_se_detiene_en_el_primer_error(self):
        servidor = ServidorFalso(201, cuerpo=[{"id": 5}])
        self.addCleanup(servidor.cerrar)
        d = self.carpeta([{**NOTICIA, "fuente": ""}, NOTICIA])
        codigo, mensajes = proponer_carpeta(d, ClienteRest(servidor.url, "llave-de-prueba"), ESQUEMAS)
        self.assertEqual(codigo, 1)
        self.assertEqual(servidor.peticiones, [])
        self.assertTrue(any("00.json" in m for m in mensajes))
