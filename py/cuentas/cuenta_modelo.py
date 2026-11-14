from datetime import datetime


class Cuenta:
    def __init__(
        self,
        p_id,
        p_email,
        p_password_hash,
        p_perfil,
        p_fecha_creacion=None,
    ):
        self.id = p_id
        self.email = p_email
        self.password_hash = p_password_hash
        self.perfil = p_perfil
        self.fecha_creacion = p_fecha_creacion or datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    def a_diccionario(self):
        return {
            "id": self.id,
            "email": self.email,
            "password_hash": self.password_hash,
            "profile": self.perfil,
            "created_at": self.fecha_creacion,
        }

    @classmethod
    def desde_diccionario(cls, datos):
        return cls(
            datos["id"],
            datos["email"],
            datos["password_hash"],
            datos["profile"],
            datos.get("created_at"),
        )
