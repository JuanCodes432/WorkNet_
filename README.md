# WorkNet_

## Ejecutar la aplicación

Se necesita Python 3. Para instalar Flask, abre una terminal en la raíz del
repositorio y ejecuta:

```powershell
python -m pip install -r requirements.txt
```

Inicia el servidor:

```powershell
python py\api.py
```

Abre <http://127.0.0.1:5000/> para ver la página de reseñas. La API y la página
usan el mismo servidor; no abras el HTML con Live Server para esta prueba.

Al iniciar el servidor se cargan contratos de prueba para varios clientes y
seis reseñas de ejemplo para Carlos Gómez. En el formulario puedes seleccionar
un contrato todavía no reseñado para publicar otra opinión. Los contratos y las
reseñas se guardan en memoria y se reinician al detener el servidor.

En esta demostración, la cuenta actual es Pepito perez: solo sus contratos
aparecen en el formulario y solo sus reseñas muestran acciones para editar o
eliminar. La identidad está fijada para la demostración y no sustituye un
sistema de inicio de sesión para una aplicación real.

## Rutas principales de la API

- `GET /api/contratos`: historial de contratos.
- `POST /api/contratos`: crea un contrato.
- `GET`, `PATCH` y `DELETE /api/contratos/<id>`: consulta, modifica y elimina
  lógicamente un contrato.
- `GET /api/resenas?especialista=Carlos%20Gómez`: consulta reseñas.
- `POST /api/resenas`: crea una reseña.
- `PATCH` y `DELETE /api/resenas/<id>`: modifica y elimina una reseña.

Las rutas POST y PATCH reciben JSON. Para probar la publicación desde la
página, primero debe existir un contrato activo para el cliente y especialista
indicados en el formulario.