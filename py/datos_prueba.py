"""Carga inicial de contratos y reseñas para la demostración."""

import almacenamiento
from contratos import fn_crear_contrato, fn_historial_contratos
from resenas import fn_crear_resena


DATOS_DEMO = (
    (
        "Pepito perez",
        "Revisión de grifería",
        50000,
        "Revisión y ajuste del grifo de la cocina",
        4,
        "Buen servicio, explicó el problema y lo solucionó rápido.",
    ),
    (
        "Pepito perez",
        "Instalación de lavaplatos",
        90000,
        "Instalación de un lavaplatos nuevo",
        None,
        None,
    ),
    ("Ana", "Plomería", 50000, "Reparación de una fuga de agua", None, None),
    (
        "María Fernanda",
        "Instalación de lavamanos",
        95000,
        "Instalación y revisión de las conexiones",
        5,
        "Excelente servicio, llegó puntual y dejó todo funcionando.",
    ),
    (
        "Julián",
        "Reparación de tubería",
        80000,
        "Cambio de un tramo de tubería",
        4,
        "Solucionó el problema y explicó claramente el trabajo.",
    ),
    (
        "Valentina",
        "Mantenimiento de grifo",
        45000,
        "Mantenimiento de grifo de cocina",
        5,
        "Muy amable y cuidadoso. El grifo quedó como nuevo.",
    ),
    (
        "Andrés",
        "Destape de desagüe",
        60000,
        "Limpieza del desagüe del baño",
        3,
        "El trabajo quedó bien, aunque tomó un poco más de lo esperado.",
    ),
    (
        "Camila",
        "Instalación de ducha",
        70000,
        "Instalación de ducha nueva",
        4,
        "Buen trabajo y comunicación durante todo el servicio.",
    ),
    ("Santiago", "Revisión de tuberías", 55000, "Revisión general", None, None),
)


def cargar_datos_de_prueba():
    almacenamiento.cargar("cuentas")
    if not almacenamiento.cargar("contratos"):
        for cliente, servicio, precio, descripcion, _, _ in DATOS_DEMO:
            fn_crear_contrato(
                cliente,
                "Carlos Gómez",
                servicio,
                precio,
                descripcion,
            )

    if not almacenamiento.cargar("resenas"):
        contratos = fn_historial_contratos()
        for (
            cliente,
            servicio,
            _,
            _,
            calificacion,
            comentario,
        ) in DATOS_DEMO:
            if calificacion is None:
                continue
            contrato = next(
                (
                    elemento
                    for elemento in contratos
                    if elemento.estado == "activo"
                    and elemento.cliente == cliente
                    and elemento.especialista == "Carlos Gómez"
                    and elemento.servicio == servicio
                ),
                None,
            )
            if contrato is not None:
                fn_crear_resena(
                    contrato.id,
                    cliente,
                    calificacion,
                    comentario,
                )

    return fn_historial_contratos(), almacenamiento.cargar("resenas")
