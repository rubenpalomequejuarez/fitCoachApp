# FitCoach

App para entrenadores personales y sus clientes.

- **Entrenador**: gestiona clientes, asigna ejercicios (con imagen o con un enlace a un vídeo privado de YouTube) y crea la dieta semanal con alimentos, cantidades y receta.
- **Cliente**: ve su dieta semanal y sus ejercicios, y marca los ejercicios como completados (el progreso se reinicia cada semana).

Lo que cuelga el entrenador lo ve el cliente al entrar: los datos están compartidos a través del servidor.

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior (recomendado 20 o 22).

## Arrancar en modo desarrollo

```bash
npm install
npm run seed
npm run dev
```

`npm run seed` crea las cuentas y datos de ejemplo. Solo hace falta la primera vez (o después de `npm run reset-data`) y se niega a ejecutarse con `NODE_ENV=production`: sin ese paso el servidor arranca con la base de datos vacía.

Abre **http://localhost:5173**. Se arrancan a la vez el servidor (puerto 3001) y la web (puerto 5173).

Para probarla desde el móvil, conéctalo a la misma wifi y abre `http://<IP de tu ordenador>:5173`.

## Cuentas de prueba

| Perfil | Email | Contraseña |
|---|---|---|
| Entrenador | `carlos@fitcoach.test` | `entrenador123` |
| Cliente (con dieta y ejercicios) | `maria@fitcoach.test` | `cliente123` |
| Clientes sin dieta | `javier@`, `lucia@`, `pablo@fitcoach.test` | `cliente123` |

En desarrollo (`npm run dev`), la pantalla de login muestra un botón «Rellenar automáticamente» con la cuenta de prueba del perfil elegido. El build de producción no incluye ese bloque ni las credenciales.

### Probar el flujo completo

1. Entra como **entrenador** → Clientes → Lucía Martín → **Asignar** un ejercicio con enlace de YouTube o con imagen.
2. Pestaña **Dietas** → Lucía → **Añadir comida**, alimentos, receta → «Guardar y enviar al cliente».
3. Cierra sesión (icono arriba a la derecha) y entra como `lucia@fitcoach.test` en el perfil **Cliente**: verás la dieta y el ejercicio, y podrás marcarlo como completado.

## Versión de producción (un solo proceso)

```bash
npm run build
npm start
```

Abre **http://localhost:3001**.

## Datos

Se guardan en `server/data/db.json` (y las imágenes en `server/data/uploads/`). Para volver a empezar con los datos de ejemplo:

```bash
npm run reset-data
npm run seed
```

## Pruebas automáticas del servidor

```bash
npm test
```

Cubren el login por perfil, permisos, el flujo entrenador → cliente, la validación de enlaces de YouTube, la subida de imágenes y el alta de clientes.

## Estructura

```
server/            API (Express) + persistencia en JSON
  app.js           rutas y permisos
  validate.js      validación de datos, enlaces de YouTube e imágenes
  seed.js          datos de ejemplo
  test/            pruebas
client/src/        interfaz (React + Vite)
  Login.jsx
  client/          perfil cliente: dieta y ejercicios
  trainer/         perfil entrenador: clientes, ejercicios, dietas
  styles.css       paleta oliva y arena del diseño de Figma
```

## Notas y límites actuales

- Es un prototipo funcional: los datos van a un archivo JSON, sin base de datos real. Para producción habría que pasar a una base de datos (p. ej. PostgreSQL) y servir por HTTPS.
- La recuperación de contraseña no está implementada: el entrenador fija la contraseña inicial de cada cliente.
- Los vídeos de YouTube **no se incrustan**: se abren en YouTube. La miniatura solo aparece si el vídeo es público o no listado; en los privados se muestra un fondo liso con el botón de reproducir.
- Las imágenes se reducen a 1280 px en el navegador antes de subirlas, para mantener la app ligera.
