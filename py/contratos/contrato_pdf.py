from datetime import datetime
from io import BytesIO
import textwrap


ANCHO_PAGINA = 595
ALTO_PAGINA = 842
MARGEN_IZQUIERDO = 55
MARGEN_SUPERIOR = 770
ANCHO_TEXTO = 88


def _texto_pdf(texto):
    return texto.encode("cp1252", errors="replace").replace(
        b"\\", b"\\\\"
    ).replace(b"(", b"\\(").replace(b")", b"\\)")


def _linea(texto, fuente="F1", tamano=11, color="0.15 0.22 0.33"):
    return (texto, fuente, tamano, color)


def _crear_paginas(datos, numero):
    fecha_elaboracion = datetime.now().strftime("%d/%m/%Y")
    precio = f"{datos['precio']:,.0f}".replace(",", ".")
    secciones = [
        _linea("WORKNET", "F2", 20, "0.12 0.27 0.55"),
        _linea("ACUERDO DE SERVICIO", "F2", 10, "0.38 0.44 0.54"),
        _linea(""),
        _linea(f"Recibo de acuerdo REC-{numero}", "F2", 17),
        _linea(f"Elaborado el {fecha_elaboracion}", "F1", 10,
               "0.38 0.44 0.54"),
        _linea(""),
        _linea("PARTICIPANTES", "F2", 11, "0.12 0.27 0.55"),
        _linea(f"Cliente: {datos['cliente']}"),
        _linea(f"Profesional: {datos['especialista']}"),
        _linea(""),
        _linea("SERVICIO ACORDADO", "F2", 11, "0.12 0.27 0.55"),
        _linea(f"Servicio: {datos['servicio']}"),
    ]

    campos = (
        ("Alcance del servicio", datos.get("alcance")),
        ("Fecha del servicio", datos.get("fecha")),
        ("Hora", datos.get("hora")),
        ("Lugar del servicio", datos.get("direccion")),
        ("Importe total acordado", f"COP {precio}"),
        ("Condiciones acordadas", datos.get("condiciones")),
    )
    for etiqueta, valor in campos:
        secciones.append(_linea(""))
        secciones.append(_linea(etiqueta.upper(), "F2", 11, "0.12 0.27 0.55"))
        for linea in textwrap.wrap(
            valor or "No especificado",
            width=ANCHO_TEXTO,
            break_long_words=True,
            break_on_hyphens=False,
        ):
            secciones.append(_linea(linea))

    secciones.extend([
        _linea(""),
        _linea("Este documento no es un comprobante de pago.", "F2", 10),
        _linea("Registra únicamente las condiciones del servicio."),
        _linea("No acredita entrega de dinero ni reemplaza una factura."),
        _linea("Su generación no implica la aceptación de la otra parte."),
    ])

    paginas = []
    pagina = []
    y = MARGEN_SUPERIOR
    for linea in secciones:
        if y < 70:
            paginas.append(pagina)
            pagina = []
            y = MARGEN_SUPERIOR
        pagina.append((linea, y))
        y -= 25 if linea[0] == "" else 19
    if pagina:
        paginas.append(pagina)
    return paginas


def generar_pdf_recibo(datos, numero):
    """Construye el PDF del acuerdo usando solo la biblioteca estándar."""
    paginas = _crear_paginas(datos, numero)
    objetos = [b"", b"", b"", b""]
    ids_paginas = []

    for elementos in paginas:
        operaciones = [
            b"0.16 0.39 0.88 RG",
            b"2 w",
            b"55 735 m 540 735 l S",
        ]
        for (texto, fuente, tamano, color), y in elementos:
            if not texto:
                continue
            x = MARGEN_IZQUIERDO
            operaciones.append(
                f"BT /{fuente} {tamano} Tf {color} rg "
                f"{x} {y} Td (".encode("ascii")
                + _texto_pdf(texto)
                + b") Tj ET"
            )
        operaciones.append(
            f"BT /F1 8 Tf 0.45 0.49 0.56 rg 55 38 Td "
            f"(WorkNet | REC-{numero}) Tj ET".encode("ascii")
        )
        contenido = b"\n".join(operaciones)

        id_contenido = len(objetos) + 1
        objetos.append(
            f"<< /Length {len(contenido)} >>\nstream\n".encode("ascii")
            + contenido
            + b"\nendstream"
        )
        id_pagina = len(objetos) + 1
        objetos.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox "
            f"[0 0 {ANCHO_PAGINA} {ALTO_PAGINA}] "
            f"/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> "
            f"/Contents {id_contenido} 0 R >>".encode("ascii")
        )
        ids_paginas.append(id_pagina)

    objetos[0] = b"<< /Type /Catalog /Pages 2 0 R >>"
    objetos[1] = (
        f"<< /Type /Pages /Kids "
        f"[{' '.join(f'{id_pagina} 0 R' for id_pagina in ids_paginas)}] "
        f"/Count {len(ids_paginas)} >>".encode("ascii")
    )
    objetos[2] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
    objetos[3] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"

    salida = BytesIO()
    salida.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for numero_objeto, objeto in enumerate(objetos, start=1):
        offsets.append(salida.tell())
        salida.write(f"{numero_objeto} 0 obj\n".encode("ascii"))
        salida.write(objeto)
        salida.write(b"\nendobj\n")

    inicio_xref = salida.tell()
    salida.write(f"xref\n0 {len(objetos) + 1}\n".encode("ascii"))
    salida.write(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        salida.write(f"{offset:010d} 00000 n \n".encode("ascii"))
    salida.write(
        f"trailer\n<< /Size {len(objetos) + 1} /Root 1 0 R >>\n"
        f"startxref\n{inicio_xref}\n%%EOF".encode("ascii")
    )
    return salida.getvalue()
