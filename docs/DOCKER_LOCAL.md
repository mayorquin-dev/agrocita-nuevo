# AgroCita - Guía de ejecución local con Docker

## 1. Descripción

AgroCita utiliza Docker Compose para ejecutar localmente los tres componentes principales de la aplicación:

- **Frontend:** React, TypeScript, Vite y Nginx.
- **Backend:** API REST desarrollada con ASP.NET Core 10.
- **Base de datos:** PostgreSQL 16.

Docker Compose administra los servicios, la red interna y los volúmenes persistentes.

## 2. Requisitos previos

Antes de iniciar, es necesario tener instalado:

- Windows 10/11 o un sistema operativo compatible.
- Docker Desktop.
- Docker Compose V2.
- Git, para clonar el repositorio.

Verificar las instalaciones:

```powershell
docker --version
docker compose version
```

## 3. Obtener el proyecto

Clonar el repositorio:

```powershell
git clone https://github.com/mayorquin-dev/agrocita-nuevo.git
cd agrocita-nuevo
```

## 4. Iniciar la aplicación

Desde la carpeta raíz del proyecto, ejecutar:

```powershell
docker compose up -d --build
```

Este comando construye las imágenes necesarias e inicia PostgreSQL, la API y el frontend en segundo plano.

Para comprobar el estado de los servicios:

```powershell
docker compose ps
```

PostgreSQL debe aparecer como `healthy`, mientras que la API y el frontend deben aparecer como `Up`.

## 5. Acceso a los servicios

| Servicio | Dirección |
|---|---|
| Aplicación web | http://localhost:5173 |
| API REST | http://localhost:5071 |
| Documentación interactiva de la API | http://localhost:5071/scalar |
| PostgreSQL | localhost:5433 |

El frontend utiliza Nginx para redirigir las solicitudes `/api/` hacia el backend.

La API se comunica con PostgreSQL mediante el nombre del servicio `postgres` dentro de la red de Docker.

## 6. Usuarios de demostración

Las siguientes credenciales están configuradas para el entorno local de desarrollo:

| Rol | Correo | Contraseña |
|---|---|---|
| SuperAdmin | superadmin@agrocita.hn | SuperAdmin123* |
| AdminEmpresa (AgroConsulta) | admin@agroconsulta.hn | Admin123* |
| Técnico (AgroConsulta) | tecnico@agroconsulta.hn | Tecnico123* |
| Técnico (AgroConsulta) | tecnico2@agroconsulta.hn | Tecnico123* |
| Productor (AgroConsulta) | productor@agroconsulta.hn | Productor123* |
| Productor (AgroConsulta) | productor2@agroconsulta.hn | Productor123* |
| AdminEmpresa (AgroServicios) | admin@agroservicios.hn | Admin123* |

Código de invitación de AgroConsulta: `AGROCONSU001`.

## 7. Persistencia de datos

AgroCita utiliza dos volúmenes nombrados de Docker para conservar los datos cuando los contenedores se detienen o recrean.

| Volumen | Contenedor | Ruta |
|---|---|---|
| `agrocita_postgres_data` | PostgreSQL | `/var/lib/postgresql/data` |
| `agrocita_storage_data` | API | `/app/almacenamiento` |

Los volúmenes son administrados por Docker Compose y se conservan al ejecutar `docker compose down`, siempre que no se utilice la opción `-v`.

### Comprobar los volúmenes

```powershell
docker volume ls
```

Para revisar los puntos de montaje:

```powershell
docker inspect agrocita-postgres --format "{{range .Mounts}}{{println .Name .Destination}}{{end}}"

docker inspect agrocita-api --format "{{range .Mounts}}{{println .Name .Destination}}{{end}}"
```

### Respaldo de PostgreSQL

Crear un respaldo en formato personalizado dentro del contenedor:

```powershell
docker exec agrocita-postgres pg_dump -U postgres -d agrocita -Fc -f /tmp/agrocita_backup.dump
```

Copiarlo al equipo:

```powershell
docker cp agrocita-postgres:/tmp/agrocita_backup.dump "$env:TEMP\agrocita_backup.dump"
```

### Restaurar PostgreSQL

En una base de datos de destino vacía, copiar el archivo al contenedor:

```powershell
docker cp "$env:TEMP\agrocita_backup.dump" agrocita-postgres:/tmp/agrocita_backup.dump
```

Restaurar:

```powershell
docker exec agrocita-postgres pg_restore -U postgres -d agrocita --no-owner --no-acl /tmp/agrocita_backup.dump
```

La restauración debe realizarse con cuidado y sobre una base de datos de destino apropiada. No debe ejecutarse sobre una base de datos que ya contenga información que se quiera conservar.

## 8. Comandos habituales

### Iniciar los servicios

```powershell
docker compose up -d
```

### Detener y eliminar los contenedores

```powershell
docker compose down
```

Los volúmenes nombrados permanecen intactos.

### Consultar el estado

```powershell
docker compose ps
```

### Consultar los registros de todos los servicios

```powershell
docker compose logs
```

### Consultar los registros de un servicio específico

```powershell
docker compose logs --tail 100 api
docker compose logs --tail 100 postgres
docker compose logs --tail 100 frontend
```

### Reconstruir las imágenes

```powershell
docker compose up -d --build
```

### Recrear un servicio

```powershell
docker compose up -d --force-recreate api
```

Se puede sustituir `api` por `postgres` o `frontend`, según el servicio que se necesite recrear.

## 9. Diagnóstico de conexión con PostgreSQL

La API dispone de un endpoint de diagnóstico:

```powershell
Invoke-RestMethod http://localhost:5173/api/diagnostics/database
```

Una respuesta correcta indica que la conexión con PostgreSQL está establecida.

También se puede comprobar directamente el estado de PostgreSQL:

```powershell
docker exec agrocita-postgres pg_isready -U postgres -d agrocita
```

## 10. Migraciones y datos iniciales

Al iniciar la API, el inicializador de la aplicación aplica las migraciones pendientes de Entity Framework Core y prepara los datos iniciales configurados para el entorno.

Los datos de demostración se crean cuando corresponde según las condiciones del inicializador. No se debe asumir que reiniciar los contenedores reinicia la base de datos.

## 11. Variables de entorno

La configuración principal del entorno Docker se encuentra en `docker-compose.yml`.

Entre las variables utilizadas están:

| Variable | Descripción |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | Entorno de ejecución de ASP.NET Core |
| `ASPNETCORE_HTTP_PORTS` | Puerto interno de la API |
| `ConnectionStrings__DefaultConnection` | Conexión de PostgreSQL |
| `JwtSettings__SecretKey` | Clave de firma JWT |
| `Seed__SuperAdminEmail` | Correo del SuperAdmin inicial |
| `Seed__SuperAdminPassword` | Contraseña del SuperAdmin inicial |
| `Seed__DemoData` | Habilita los datos de demostración |
| `Almacenamiento__Ruta` | Ruta de almacenamiento de archivos |

**Importante:** las credenciales y la clave JWT incluidas en la configuración actual son exclusivamente para desarrollo local. Deben reemplazarse por secretos seguros antes de utilizar la aplicación en producción.

## 12. Advertencia sobre los volúmenes

El siguiente comando elimina los contenedores y también los volúmenes administrados por Compose:

```powershell
docker compose down -v
```

**No utilizarlo si se desea conservar la base de datos o los archivos almacenados.**

Para detener la aplicación sin eliminar los datos, utilizar:

```powershell
docker compose down
```

## 13. Solución de problemas

### PostgreSQL no está saludable

Consultar los registros:

```powershell
docker compose logs --tail 100 postgres
```

### La API no inicia

```powershell
docker compose logs --tail 100 api
```

Comprobar que PostgreSQL esté saludable antes de revisar la API.

### El frontend no carga

```powershell
docker compose logs --tail 100 frontend
```

Verificar que el puerto 5173 esté disponible.

### Reconstruir un servicio después de modificar su código

```powershell
docker compose up -d --build api
```

Para el frontend:

```powershell
docker compose up -d --build frontend
```

---

**AgroCita:** plataforma web de gestión y seguimiento de asistencia agrícola.