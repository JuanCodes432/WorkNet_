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

Al iniciar el servidor se carga un contrato de prueba para Ana y Carlos Gómez.
El formulario completa automáticamente el ID del contrato y el nombre de Ana;
solo debes elegir la calificación y escribir el comentario. Los contratos y las
reseñas se guardan en memoria y se reinician al detener el servidor.

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