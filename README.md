# FitCoach

Aplicación para entrenadores personales y sus clientes: gestión de ejercicios, rutinas y dietas, seguimiento del esfuerzo de cada cliente y comunicación entre ambos.

## Estado del proyecto

| Parte | Carpeta | Estado |
|---|---|---|
| Web | `apps/web` | Interfaz completa en React + TypeScript. Funciona con datos de demostración guardados en el navegador; pendiente de conectar a la API. |
| API | `apps/api` | Primera versión en Express con persistencia en JSON. Se sustituye por una API en NestJS sobre PostgreSQL. |
| Base de datos | `docker-compose.yml` | PostgreSQL 17 para desarrollo. |

## Requisitos

- [Node.js](https://nodejs.org) 22 o superior.
- [Docker](https://docs.docker.com/get-docker/) para la base de datos.

## Arranque

```bash
npm install
npm run dev
```

Abre **http://localhost:5173**. En el acceso se elige el perfil **Entrenador** o **Cliente**; los datos son de demostración. Para probarla desde el móvil, conéctalo a la misma wifi y abre `http://<IP de tu ordenador>:5173`.

Detalle de la funcionalidad en [apps/web/README.md](apps/web/README.md).

## Base de datos PostgreSQL (desarrollo)

```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

Levanta PostgreSQL 17 en `localhost:5432` (solo accesible desde el propio equipo), con los datos en un volumen de Docker. Para pararlo: `docker compose down`; para borrar también los datos: `docker compose down -v`.

## API actual (Express)

```bash
npm run seed      # crea las cuentas y datos de ejemplo; se niega a ejecutarse con NODE_ENV=production
npm run dev:api   # http://localhost:3001
```

Guarda los datos en `apps/api/data/db.json` y las imágenes en `apps/api/data/uploads/`. `npm run reset-data` los borra. La web todavía no consume esta API.

Cuentas de ejemplo que crea el seed:

| Perfil | Email | Contraseña |
|---|---|---|
| Entrenador | `carlos@fitcoach.test` | `entrenador123` |
| Cliente | `maria@fitcoach.test` | `cliente123` |

## Pruebas

```bash
npm test
```

Ejecuta las pruebas de las reglas de negocio de la web (asignaciones, copias independientes, migración de datos, RPE y carga, CSV) y las de la API (acceso por perfil, permisos, flujo entrenador → cliente, validaciones y subida de imágenes).

## Estructura

```
apps/
  api/               API
  web/               interfaz (React + Vite + TypeScript)
docker-compose.yml   servicios de desarrollo
.env.example         variables de entorno
```

El repositorio es un workspace de npm: los comandos de la raíz delegan en `apps/api` y `apps/web`.
