# WorkNet

## Backend de cuentas

El servidor usa únicamente la biblioteca estándar de Python y SQLite. Desde la
raíz del repositorio, ejecútalo con:

```powershell
python backend\Gestionar_Cuenta.py
```

Luego abre `http://127.0.0.1:8000/Perfil%20Profesional/Perfil_Profesional.html`.
La base de datos se crea automáticamente en `backend\worknet.sqlite3`.

Abre las páginas desde ese servidor (no directamente como archivos `file://`)
para que compartan el origen y puedan comunicarse con la API. La integración
del perfil está en
`Perfil Profesional\Conexion_Backend_Front_Perfil_Profesional.js`; la página
de cuenta eliminada es una confirmación estática a la que se llega después de
que el perfil solicita la eliminación a la API.

### API

- `POST /api/accounts`: crea una cuenta y abre su sesión. JSON: `email`,
  `password` (mínimo 12 caracteres) y `profile` (perfil con `name`,
  `profession`, `city` y `university`).
- `POST /api/sessions`: inicia sesión con `email` y `password`.
- `GET /api/me/profile`: devuelve el perfil de la sesión actual.
- `PATCH /api/me/profile`: actualiza el perfil de la sesión actual con JSON.
- `DELETE /api/me/account`: elimina la cuenta y cierra su sesión.
- `GET /api/cities`: devuelve las ciudades disponibles.

La sesión se guarda en una cookie `HttpOnly` y dura siete días. En producción,
configura `WORKNET_COOKIE_SECURE=1`, `WORKNET_HOST` y `WORKNET_DB_PATH`, y sirve
el sitio mediante HTTPS.
