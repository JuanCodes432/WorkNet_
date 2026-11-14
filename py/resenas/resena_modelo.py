from datetime import datetime


class Resena:
    def __init__(
        self,
        p_id,
        p_contrato_id,
        p_cliente,
        p_especialista,
        p_calificacion,
        p_comentario,
        p_fecha=None,
    ):
        self.id = p_id
        self.contrato_id = p_contrato_id
        self.cliente = p_cliente
        self.especialista = p_especialista
        self.calificacion = p_calificacion
        self.comentario = p_comentario
        self.fecha = p_fecha or datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def a_diccionario(self):
        return {
            "id": self.id,
            "contrato_id": self.contrato_id,
            "cliente": self.cliente,
            "especialista": self.especialista,
            "calificacion": self.calificacion,
            "comentario": self.comentario,
            "fecha": self.fecha,
        }

    @classmethod
    def desde_diccionario(cls, datos):
        return cls(
            datos["id"],
            datos["contrato_id"],
            datos["cliente"],
            datos["especialista"],
            datos["calificacion"],
            datos["comentario"],
            datos.get("fecha"),
        )
