"""Convierte una guia en Markdown (p. ej. GUIA_LOOKER.md) (subconjunto simple de Markdown) a un .docx con estilo del Observatorio."""
import re
import sys
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor, Cm, Emu

FUENTE = "Arial"
MONO = "Consolas"
TEXTO = RGBColor(0x3C, 0x40, 0x43)
SUAVE = RGBColor(0x6B, 0x70, 0x75)
OSCURO = "5F6B73"
CLARO = "F4F5F6"
BORDE = "D9DCDF"
ACENTO = "F4B183"  # naranja de la maqueta TEJ

import argparse
ap = argparse.ArgumentParser(description=__doc__)
ap.add_argument("src")
ap.add_argument("dst")
ap.add_argument("--antetitulo", default="OBSERVATORIO DE TRANSICIÓN ENERGÉTICA JUSTA · ALMACENAMIENTO")
ap.add_argument("--pie", default="Guía Looker Studio · Observatorio BESS")
args = ap.parse_args()
src, dst = args.src, args.dst
lineas = open(src, encoding="utf-8").read().splitlines()

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21.59), Cm(27.94)  # Carta
for lado in ("left_margin", "right_margin"):
    setattr(sec, lado, Cm(2.2))
sec.top_margin, sec.bottom_margin = Cm(2.2), Cm(2.0)
ANCHO = sec.page_width - sec.left_margin - sec.right_margin

# ---------- estilos base ----------
def fuente_estilo(estilo, tam, color=TEXTO, negrita=None):
    f = estilo.font
    f.name, f.size, f.color.rgb = FUENTE, Pt(tam), color
    if negrita is not None:
        f.bold = negrita
    rpr = estilo.element.get_or_add_rPr()
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts"); rpr.append(rf)
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), FUENTE)
    for a in ("w:asciiTheme", "w:hAnsiTheme", "w:cstheme", "w:eastAsiaTheme"):
        rf.attrib.pop(qn(a), None)

normal = doc.styles["Normal"]
fuente_estilo(normal, 10.5)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.15

for nombre, tam, antes, despues in (("Heading 1", 16, 18, 6), ("Heading 2", 12.5, 12, 4)):
    st = doc.styles[nombre]
    fuente_estilo(st, tam, RGBColor(0x2B, 0x2F, 0x33), True)
    st.paragraph_format.space_before = Pt(antes)
    st.paragraph_format.space_after = Pt(despues)
    st.paragraph_format.keep_with_next = True

for nombre in ("List Number", "List Bullet"):
    fuente_estilo(doc.styles[nombre], 10.5)
    doc.styles[nombre].paragraph_format.space_after = Pt(3)

# ---------- utilidades XML ----------
def sombrear(elem_pr, color):
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), color)
    elem_pr.append(shd)

def borde_parrafo(p, lado, color, tam=12, espacio=6):
    ppr = p._p.get_or_add_pPr()
    bdr = ppr.find(qn("w:pBdr"))
    if bdr is None:
        bdr = OxmlElement("w:pBdr"); ppr.append(bdr)
    b = OxmlElement(f"w:{lado}")
    b.set(qn("w:val"), "single"); b.set(qn("w:sz"), str(tam)); b.set(qn("w:space"), str(espacio)); b.set(qn("w:color"), color)
    bdr.append(b)

def bordes_tabla(tabla):
    tblpr = tabla._tbl.tblPr
    bordes = OxmlElement("w:tblBorders")
    for lado in ("top", "left", "bottom", "right", "insideH", "insideV"):
        b = OxmlElement(f"w:{lado}")
        b.set(qn("w:val"), "single"); b.set(qn("w:sz"), "4"); b.set(qn("w:space"), "0"); b.set(qn("w:color"), BORDE)
        bordes.append(b)
    tblpr.append(bordes)
    mar = OxmlElement("w:tblCellMar")
    for lado, v in (("top", 60), ("bottom", 60), ("left", 100), ("right", 100)):
        m = OxmlElement(f"w:{lado}"); m.set(qn("w:w"), str(v)); m.set(qn("w:type"), "dxa"); mar.append(m)
    tblpr.append(mar)

def repetir_encabezado(fila):
    trpr = fila._tr.get_or_add_trPr()
    h = OxmlElement("w:tblHeader"); h.set(qn("w:val"), "true"); trpr.append(h)
    ns = OxmlElement("w:cantSplit"); trpr.append(ns)

# ---------- texto en linea: **negrita**, `codigo`, colores #RRGGBB ----------
TOKEN = re.compile(r"(\*\*.+?\*\*|`[^`]+`|#[0-9A-Fa-f]{6}\b|https?://\S+)")

def en_linea(p, texto, tam=None, color=None, negrita=False):
    for parte in TOKEN.split(texto):
        if not parte:
            continue
        if parte.startswith("**") and parte.endswith("**"):
            en_linea(p, parte[2:-2], tam, color, True)
            continue
        if parte.startswith("`") and parte.endswith("`"):
            r = p.add_run(parte[1:-1])
            r.font.name = MONO
            r._element.get_or_add_rPr().append(_sombra_run(CLARO))
            r.font.size = Pt((tam or 10.5) - 0.5)
            r.bold = negrita
            continue
        if re.fullmatch(r"#[0-9A-Fa-f]{6}", parte):
            hexa = parte[1:].upper()
            claro = sum(int(hexa[k:k + 2], 16) for k in (0, 2, 4)) > 3 * 225
            m = p.add_run("□ " if claro else "■ ")
            m.font.color.rgb = RGBColor(0x9A, 0xA0, 0xA6) if claro else RGBColor.from_string(hexa)
            m.font.size = Pt((tam or 10.5) + 2)
            r = p.add_run(parte.upper())
            r.font.name = MONO
        elif parte.startswith("http"):
            r = p.add_run(parte)
            r.font.color.rgb = RGBColor(0x2F, 0x63, 0xA8)
            r.underline = True
        else:
            r = p.add_run(parte)
            if color is not None:
                r.font.color.rgb = color
        r.bold = negrita or r.bold
        if tam:
            r.font.size = Pt(tam)

def _sombra_run(color):
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), color)
    return shd

# ---------- bloques ----------
def tabla_md(filas):
    celdas = [[c.strip() for c in f.strip().strip("|").split("|")] for f in filas]
    cab, cuerpo = celdas[0], [f for f in celdas[2:]]
    ncol = len(cab)
    # Ancho por columna proporcional al texto mas largo (con minimo), en EMU.
    largo = [max(min(len(f[i]) if i < len(f) else 0, 60) for f in [cab] + cuerpo) + 6 for i in range(ncol)]
    largo = [max(l, len(cab[i]) + 8) for i, l in enumerate(largo)]
    total = sum(largo)
    anchos = [int(ANCHO * l / total) for l in largo]
    anchos[-1] = ANCHO - sum(anchos[:-1])

    t = doc.add_table(rows=1 + len(cuerpo), cols=ncol)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    bordes_tabla(t)
    for i, fila in enumerate([cab] + cuerpo):
        for j in range(ncol):
            c = t.rows[i].cells[j]
            c.width = Emu(anchos[j])
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            texto = fila[j] if j < len(fila) else ""
            if i == 0:
                p.paragraph_format.keep_with_next = True  # el encabezado no queda solo al final de la pagina
                sombrear(c._tc.get_or_add_tcPr(), OSCURO)
                en_linea(p, texto, 9.5, RGBColor(0xFF, 0xFF, 0xFF), True)
            else:
                if i % 2 == 0:
                    sombrear(c._tc.get_or_add_tcPr(), CLARO)
                en_linea(p, "" if texto == "-" else texto, 9.5)
    repetir_encabezado(t.rows[0])
    for fila in t.rows[1:]:
        fila._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))
    for col, w in zip(t.columns, anchos):
        col.width = Emu(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def codigo(bloque):
    for k, linea in enumerate(bloque):
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.space_after = Pt(0) if k < len(bloque) - 1 else Pt(8)
        pf.space_before = Pt(0)
        pf.line_spacing = 1.0
        pf.left_indent = Cm(0.3)
        pf.keep_with_next = k < len(bloque) - 1
        sombrear(p._p.get_or_add_pPr(), CLARO)
        borde_parrafo(p, "left", OSCURO, 18, 8)
        r = p.add_run(linea if linea else " ")
        r.font.name = MONO
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(0x2B, 0x2F, 0x33)

def nota(texto):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.3)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(8)
    sombrear(p._p.get_or_add_pPr(), "FDF1E7")
    borde_parrafo(p, "left", ACENTO, 24, 8)
    r = p.add_run("Nota: "); r.bold = True
    en_linea(p, texto, 10)

# ---------- portada ----------
def portada(titulo, subtitulo):
    p = doc.add_paragraph()
    r = p.add_run(args.antetitulo)
    r.bold = True; r.font.size = Pt(9); r.font.color.rgb = SUAVE
    _espaciado(r, 30)
    p.paragraph_format.space_after = Pt(4)
    p = doc.add_paragraph()
    r = p.add_run(titulo); r.bold = True; r.font.size = Pt(24); r.font.color.rgb = RGBColor(0x2B, 0x2F, 0x33)
    p.paragraph_format.space_after = Pt(6)
    p = doc.add_paragraph()
    en_linea(p, subtitulo, 11, SUAVE)
    borde_parrafo(p, "bottom", ACENTO, 18, 10)
    p.paragraph_format.space_after = Pt(14)

def _espaciado(run, valor):
    sp = OxmlElement("w:spacing"); sp.set(qn("w:val"), str(valor))
    run._element.get_or_add_rPr().append(sp)

# ---------- pie de pagina con numero ----------
def pie():
    p = sec.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = p.add_run(f"{args.pie}  —  página ")
    r.font.size = Pt(8.5); r.font.color.rgb = SUAVE
    r2 = p.add_run()
    for tipo, txt in (("begin", None), (None, "PAGE"), ("end", None)):
        if tipo:
            fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), tipo); r2._element.append(fc)
        else:
            it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = txt; r2._element.append(it)
    r2.font.size = Pt(8.5); r2.font.color.rgb = SUAVE

pie()

# ---------- recorrido del markdown ----------
i = 0
titulo_hecho = False
while i < len(lineas):
    ln = lineas[i]
    s = ln.strip()
    if not s:
        i += 1; continue
    if s.startswith("# ") and not titulo_hecho:
        # El primer parrafo despues del titulo es el subtitulo de la portada.
        j = i + 1
        while j < len(lineas) and not lineas[j].strip():
            j += 1
        portada(s[2:].strip(), lineas[j].strip())
        titulo_hecho = True
        i = j + 1; continue
    if s.startswith("## "):
        doc.add_heading(s[3:].strip(), level=1); i += 1; continue
    if s.startswith("### "):
        doc.add_heading(s[4:].strip(), level=2); i += 1; continue
    if s.startswith("```"):
        bloque = []; i += 1
        while i < len(lineas) and not lineas[i].strip().startswith("```"):
            bloque.append(lineas[i]); i += 1
        codigo(bloque); i += 1; continue
    if s.startswith("|"):
        filas = []
        while i < len(lineas) and lineas[i].strip().startswith("|"):
            filas.append(lineas[i]); i += 1
        tabla_md(filas); continue
    if s.startswith("> "):
        nota(s[2:].strip()); i += 1; continue
    if s.startswith("- [ ] "):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.left_indent = Cm(0.6)
        p.paragraph_format.first_line_indent = Cm(-0.6)
        r = p.add_run("☐  "); r.font.size = Pt(12)
        en_linea(p, s[6:]); i += 1; continue
    if s.startswith("- "):
        p = doc.add_paragraph(style="List Bullet"); en_linea(p, s[2:]); i += 1; continue
    m = re.match(r"(\d+)\.\s+(.*)", s)
    if m:
        # Numeracion escrita a mano: "List Number" de Word continua la cuenta entre secciones.
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.left_indent = Cm(0.7)
        p.paragraph_format.first_line_indent = Cm(-0.7)
        r = p.add_run(f"{m.group(1)}.\t"); r.bold = True
        p.paragraph_format.tab_stops.add_tab_stop(Cm(0.7))
        en_linea(p, m.group(2)); i += 1; continue
    p = doc.add_paragraph(); en_linea(p, s); i += 1

doc.core_properties.title = next((l[2:].strip() for l in lineas if l.startswith("# ")), "")
doc.core_properties.subject = "Observatorio de Transición Energética Justa"
doc.save(dst)
print("ok", dst)
