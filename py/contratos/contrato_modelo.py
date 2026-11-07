# HU-E4-01

from datetime import datetime


class Contrato:
    def __init__(self, p_id, p_cliente, p_especialista, p_servicio,
                 p_precio, p_descripcion="", p_estado="activo",
                 p_fecha_creacion=None):
        self.id = p_id
        self.cliente = p_cliente
        self.especialista = p_especialista
        self.servicio = p_servicio
        self.precio = p_precio
        self.descripcion = p_descripcion
        self.estado = p_estado
        self.fecha_creacion = p_fecha_creacion or datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    def a_diccionario(self):
        return {
            "id": self.id,
            "cliente": self.cliente,
            "especialista": self.especialista,
            "servicio": self.servicio,
            "precio": self.precio,
            "descripcion": self.descripcion,
            "estado": self.estado,
            "fecha_creacion": self.fecha_creacion,
        }
