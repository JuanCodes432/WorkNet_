# WorkNet

Demo universitaria para conectar clientes con especialistas. El sitio y todas
las APIs se ejecutan en un solo servidor Flask y comparten el origen
`http://127.0.0.1:5000/`.

## Instalaci?n y arranque

Desde la ra?z del repositorio:

```powershell
python -m pip install -r requirements.txt
python pypi.py
```

Inicia el servidor desde la ra?z del repositorio:

```powershell
python pypi.py
```

Abre <http://127.0.0.1:5000/contrato> para generar y exportar recibos PDF.
La API y el formulario deben usar el mismo servidor; no abras `Contrato.html`
directamente ni uses Live Server. Para ver la p?gina de rese?as, abre
<http://127.0.0.1:5000/>. Tambi?n puedes abrir Crear perfil en
<http://127.0.0.1:5000/Perfil%20Profesional/Crear_Perfil.html> o iniciar sesi?n
en <http://127.0.0.1:5000/Perfil%20Profesional/Iniciar_Sesion.html>.

El servidor usa `WORKNET_HOST` para elegir la direcci?n donde escucha. En
producci?n configura `WORKNET_SECRET_KEY` con un valor secreto y
`WORKNET_COOKIE_SECURE=1` al servir mediante HTTPS. El valor secreto por
defecto solo es para desarrollo local.

## Datos

`data/` contiene los JSON persistidos: `contratos.json`, `resenas.json`,
`cuentas.json` y `contadores.json`. Se crean al usarse si todav?a no existen;
los cambios se escriben de forma segura para conservarlos entre reinicios. Las
contrase?as se guardan como hashes. Los archivos de datos locales se ignoran
en Git. Otros datos preexistentes, como `data/especialistas.json`, no se
modifican.

Las rutas POST y PATCH reciben JSON. Para probar la publicaci?n desde la
p?gina, primero debe existir un contrato activo para el cliente y especialista
indicados en el formulario.

Al generar un recibo desde `/contrato`, el servidor crea el contrato y genera
un PDF con el acuerdo. El navegador descarga el archivo
`recibo-acuerdo-REC-<id>.pdf` en la carpeta de descargas configurada en el equipo.
La generaci?n del PDF est? implementada en `py/contratos/contrato_pdf.py` y no
requiere dependencias adicionales.

El bot?n ?Exportar a PDF? descarga la vista previa sin crear otro recibo.
?Generar recibo? registra el acuerdo en el historial, descarga el PDF y abre el
historial de recibos.

Al arrancar, los contratos y las seis rese?as de ejemplo de Carlos G?mez se
cargan ?nicamente cuando sus archivos correspondientes est?n vac?os.

## Rutas web

- `GET /`: inicio.
- `GET /resenas`: rese?as.
- `GET /Perfil%20Profesional/Perfil_Profesional.html`: perfil profesional y
  p?ginas est?ticas de esa carpeta.
- `GET /Perfil%20Profesional/Crear_Perfil.html`: crear perfil y cuenta.
- `GET /Perfil%20Profesional/Iniciar_Sesion.html`: inicio de sesi?n.
- `GET /contrato`: generar contrato.
- `GET /historial-contratos`: historial.
- `GET /Cuenta%20Eliminada/cuenta_eliminada.html`: confirmaci?n de cuenta
  eliminada.

## API

### Contratos (`py/contratos/contrato_rutas.py`)

- `GET`, `POST /api/contratos`
- `GET`, `PATCH`, `DELETE /api/contratos/<id>`

### Rese?as (`py/resenas/resena_rutas.py`)

- `GET /api/resenas?especialista=<nombre>`
- `POST /api/resenas`
- `PATCH`, `DELETE /api/resenas/<id>`

### Cuentas (`py/cuentas/cuenta_rutas.py`)

- `POST /api/accounts`: crea una cuenta e inicia sesi?n.
- `POST /api/sessions`: inicia sesi?n.
- `DELETE /api/me/session`: cierra sesi?n.
- `GET`, `PATCH /api/me/profile`: consulta o actualiza el perfil.
- `DELETE /api/me/account`: elimina la cuenta.
- `GET /api/cities`: consulta ciudades disponibles.

Las rutas POST y PATCH reciben un objeto JSON. Las sesiones usan una cookie
firmada HttpOnly con duraci?n de siete d?as.
