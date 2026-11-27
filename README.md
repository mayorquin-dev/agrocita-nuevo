# AgroCita

[![CI](https://github.com/mayorquin-dev/agrocita-nuevo/actions/workflows/ci.yml/badge.svg)](https://github.com/mayorquin-dev/agrocita-nuevo/actions/workflows/ci.yml)

Plataforma web de gestión y seguimiento de asistencia agrícola (SaaS B2B multi-empresa).

## Backend

API REST desarrollada con ASP.NET Core 10, C#, Entity Framework Core y PostgreSQL.

## Arquitectura

El backend sigue los principios de Clean Architecture:

- **AgroCita.API:** endpoints REST, controladores, autenticación, CORS y middleware global de errores.
- **AgroCita.Application:** casos de uso por funcionalidad (`Features/`), DTOs, validadores de FluentValidation e interfaces.
- **AgroCita.Domain:** entidades y reglas del dominio.
- **AgroCita.Infrastructure:** persistencia con EF Core, migraciones, datos iniciales y servicios de seguridad.

## Tecnologías

- .NET 10
- ASP.NET Core Web API
- C#
- Entity Framework Core
- PostgreSQL
- Npgsql
- JWT
- FluentValidation

## Estructura

El backend se encuentra en `backend-dotnet/`.

La documentación del proyecto y el modelo entidad-relación están en `backend-dotnet/doc/`.

## Cómo ejecutar AgroCita con Docker

La forma recomendada de ejecutar el proyecto localmente es mediante Docker Compose.

Consulta la guía completa: [Guía de ejecución local con Docker](docs/DOCKER_LOCAL.md).

### Requisitos

- Docker Desktop.
- Docker Compose V2.

### Iniciar la aplicación

Desde la raíz del proyecto:

```powershell
docker compose up -d --build
```
## Frontend

Aplicación web en `frontend/` con React 19, TypeScript y Vite.

- **Vertical Slicing:** cada funcionalidad vive en `src/features/` (`auth`, `fincas`, `solicitudes`, `visitas`, `calidad`, `informes`, `productores`, `tecnicos`, `organizacion`, `admin`) con sus páginas, componentes, esquemas de Zod y llamadas a la API. Lo compartido está en `src/shared/`.
- **Rutas protegidas:** guardias de `react-router-dom` en `src/shared/routing/guards.tsx` (`RequireAuth`, `RequireRole`, `GuestOnly`).
- **Validación en vivo:** Zod + React Hook Form en `mode: 'onChange'`, con las mismas reglas y mensajes que FluentValidation.
- **Resiliencia HTTP:** cliente Axios con interceptores (`src/shared/api/http.ts`) que adjuntan el token Bearer y cierran la sesión ante un 401, y extractor universal de errores (`src/shared/api/errors.ts`).

### Cómo ejecutar el frontend

Con el backend corriendo en `http://localhost:5071`:

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`. Para apuntar a otra API, crea un archivo `.env` con `VITE_API_URL` (ver `.env.example`).

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Verificación de tipos y compilación de producción |
| `npm run lint` | Análisis estático |

## Convenciones de la API

- URL base `/api`, JSON en camelCase, fechas en ISO 8601 (las fechas con hora van en UTC).
- Autenticación con `Authorization: Bearer <token>`. El token lleva los claims `usuarioId`, `email`, `rol` y `empresaId`.
- El `empresaId` nunca se envía: el backend lo toma del token y filtra todas las consultas con filtros globales de EF Core.
- Los estados viajan como texto: `Pendiente`, `EnAtencion`, `Atendida`, `Rechazada` (solicitudes);
  `Pendiente`, `Confirmada`, `EnProceso`, `Completada`, `Cancelada` (visitas);
  `Activa`, `Vencida`, `Suspendida`, `Cancelada` (suscripciones).
- Los listados largos aceptan `?pagina=1&tamano=20` y devuelven `{ items, total, pagina, tamano }`.
- Todos los errores tienen la misma forma:

  ```json
  {
    "title": "Datos inválidos",
    "status": 400,
    "detail": "Revise los campos marcados e intente de nuevo.",
    "errors": { "dni": ["El DNI debe tener 13 dígitos."] }
  }
  ```

  `errors` solo aparece en los errores de validación (400). Los demás códigos son 401, 403, 404 y 409.

## Pruebas

```bash
cd backend-dotnet
dotnet test AgroCita.slnx
```

## Integración continua

GitHub Actions ejecuta `.github/workflows/ci.yml` en cada push a `main`, en cada pull request hacia `main`
y de forma manual desde la pestaña **Actions**. El flujo tiene tres trabajos:

| Trabajo | Qué comprueba |
|---|---|
| Backend (.NET) | `dotnet restore`, compilación en Release y `dotnet test` (los resultados quedan como artefacto) |
| Frontend (React) | `npm ci`, `npm run lint` y `npm run build` (verificación de tipos y compilación) |
| Imágenes Docker | `docker compose build` de la API y el frontend; corre solo si los dos anteriores pasan |

Si un trabajo falla, el commit o el pull request aparece con una ✗ roja y GitHub muestra en qué paso falló.
