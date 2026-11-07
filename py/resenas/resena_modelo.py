# resenas/resena_modelo.py
# HU-E5-01

# Solo la clase de datos. Nada de lógica aquí.

from datetime import datetime


class Resena:
    def __init__(self, p_id, p_contrato_id, p_cliente, p_especialista,
                 p_calificacion, p_comentario, p_fecha=None):
        # Los atributos NO llevan prefijo: son los mismos nombres del JSON
        self.id = p_id
        self.contrato_id = p_contrato_id  # relación con el contrato por id
        self.cliente = p_cliente
        self.especialista = p_especialista
        self.calificacion = p_calificacion
        self.comentario = p_comentario
        # Si no nos dan fecha, usamos la de este momento (como texto, sirve para JSON)
        self.fecha = p_fecha or datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def a_diccionario(self):
        """Convierte la reseña en diccionario (para devolverla como JSON luego)."""
        return {
            "id": self.id,
            "contrato_id": self.contrato_id,
            "cliente": self.cliente,
            "especialista": self.especialista,
            "calificacion": self.calificacion,
            "comentario": self.comentario,
            "fecha": self.fecha,
        }