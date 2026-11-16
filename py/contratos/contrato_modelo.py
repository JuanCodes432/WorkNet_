from datetime import datetime


class Contrato:
    def __init__(
        self,
        p_id,
        p_cliente,
        p_especialista,
        p_servicio,
        p_precio,
        p_descripcion="",
        p_estado="activo",
        p_fecha_creacion=None,
        p_cliente_id=None,
        p_fecha_acordada=None,
        p_fecha_actualizacion=None,
        p_especialista_id=None,
    ):
        self.id = p_id
        self.cliente = p_cliente
        self.cliente_id = p_cliente_id
        self.especialista = p_especialista
        self.especialista_id = p_especialista_id
        self.servicio = p_servicio
        self.precio = p_precio
        self.descripcion = p_descripcion
        self.estado = p_estado
        self.fecha_creacion = p_fecha_creacion or datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        self.fecha_acordada = p_fecha_acordada
        self.fecha_actualizacion = (
            p_fecha_actualizacion or self.fecha_creacion
        )

    def a_diccionario(self):
        return {
            "id": self.id,
            "cliente": self.cliente,
            "cliente_id": self.cliente_id,
            "especialista": self.especialista,
            "especialista_id": self.especialista_id,
            "servicio": self.servicio,
            "precio": self.precio,
            "descripcion": self.descripcion,
            "estado": self.estado,
            "fecha_creacion": self.fecha_creacion,
            "fecha_acordada": self.fecha_acordada,
            "fecha_actualizacion": self.fecha_actualizacion,
        }

    @classmethod
    def desde_diccionario(cls, datos):
        return cls(
            datos["id"],
            datos["cliente"],
            datos["especialista"],
            datos["servicio"],
            datos["precio"],
            datos.get("descripcion", ""),
            datos.get("estado", "activo"),
            datos.get("fecha_creacion"),
            datos.get("cliente_id"),
            datos.get("fecha_acordada"),
            datos.get("fecha_actualizacion"),
            datos.get("especialista_id"),
        )
