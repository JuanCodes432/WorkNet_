# WorkNet

Demo universitaria para conectar clientes con especialistas. El sitio y todas
las APIs se ejecutan en un solo servidor Flask y comparten el origen
`http://127.0.0.1:5000/`.

## Instalación y arranque

Desde la raíz del repositorio:

```powershell
python -m pip install -r requirements.txt
python py\api.py
```

Abre <http://127.0.0.1:5000/> y navega desde Inicio a Reseñas o Perfil. No abras
las páginas mediante `file://` ni uses Live Server para esta demostración.

El servidor usa `WORKNET_HOST` para elegir la dirección donde escucha. En
producción configura `WORKNET_SECRET_KEY` con un valor secreto y
`WORKNET_COOKIE_SECURE=1` al servir mediante HTTPS. El valor secreto por
defecto solo es para desarrollo local.

## Datos

`data/` contiene los JSON persistidos: `contratos.json`, `resenas.json`,
`cuentas.json` y `contadores.json`. Se crean al usarse si todavía no existen;
los cambios se escriben de forma segura para conservarlos entre reinicios. Las
contraseñas se guardan como hashes. Los archivos de datos locales se ignoran
en Git. Otros datos preexistentes, como `data/especialistas.json`, no se
modifican.

Al arrancar, los contratos y las seis reseñas de ejemplo de Carlos Gómez se
cargan únicamente cuando sus archivos correspondientes están vacíos.

## Rutas web

- `GET /`: inicio.
- `GET /resenas`: reseñas.
- `GET /Perfil%20Profesional/Perfil_Profesional.html`: perfil profesional y
  páginas estáticas de esa carpeta.
- `GET /contrato`: generar contrato.
- `GET /historial-contratos`: historial.
- `GET /Cuenta%20Eliminada/cuenta_eliminada.html`: confirmación de cuenta
  eliminada.

## API

### Contratos (`py/contratos/contrato_rutas.py`)

- `GET`, `POST /api/contratos`
- `GET`, `PATCH`, `DELETE /api/contratos/<id>`

### Reseñas (`py/resenas/resena_rutas.py`)

- `GET /api/resenas?especialista=<nombre>`
- `POST /api/resenas`
- `PATCH`, `DELETE /api/resenas/<id>`

### Cuentas (`py/cuentas/cuenta_rutas.py`)

- `POST /api/accounts`: crea una cuenta e inicia sesión.
- `POST /api/sessions`: inicia sesión.
- `DELETE /api/me/session`: cierra sesión.
- `GET`, `PATCH /api/me/profile`: consulta o actualiza el perfil.
- `DELETE /api/me/account`: elimina la cuenta.
- `GET /api/cities`: consulta ciudades disponibles.

Las rutas POST y PATCH reciben un objeto JSON. Las sesiones usan una cookie
firmada HttpOnly con duración de siete días.
