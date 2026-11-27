# AgroCita - Despliegue en la nube

AgroCita se publica con servicios gratuitos:

| Parte | Servicio | Qué se publica |
|---|---|---|
| Base de datos | Neon | PostgreSQL |
| API | Render | `backend-dotnet/Dockerfile` |
| Frontend | Vercel | `frontend/` (Vite) |

## Cómo se actualiza producción

Cada push a `main` ejecuta el workflow `.github/workflows/ci.yml`:

1. **Backend (.NET)**, **Frontend (React)** e **Imágenes Docker** comprueban que todo compile y que las pruebas pasen.
2. Si los tres pasan, **Desplegar a producción**:
   - pide a Render que despliegue la API con ese mismo commit (deploy hook);
   - compila el frontend con la CLI de Vercel y lo publica en producción.

Si algo falla en el paso 1, no se despliega nada y producción se queda con la última versión buena.
Los pull requests solo corren el paso 1.

Mientras falten los secretos de GitHub (paso 4 de esta guía), el trabajo de despliegue termina en verde
con un aviso de que no se desplegó.

## 1. Base de datos en Neon

1. Crear un proyecto en https://neon.tech (región AWS US East).
2. En **Connection details**, copiar host, base de datos, usuario y contraseña.
3. Armar la cadena de conexión en formato Npgsql (la API no acepta el formato `postgresql://...`):

   ```
   Host=ep-xxxx.us-east-2.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=LA_CONTRASEÑA;SSL Mode=Require
   ```

La API crea las tablas sola al arrancar (migraciones de EF Core).

## 2. API en Render

1. En https://render.com: **New → Web Service** y conectar el repositorio `mayorquin-dev/agrocita-nuevo`.
2. Configuración:

   | Campo | Valor |
   |---|---|
   | Language | Docker |
   | Branch | `main` |
   | Root Directory | `backend-dotnet` |
   | Dockerfile Path | `./Dockerfile` |
   | Instance Type | Free |
   | Health Check Path | `/` |

3. Variables de entorno:

   | Variable | Valor |
   |---|---|
   | `PORT` | `8080` |
   | `ConnectionStrings__DefaultConnection` | La cadena de Neon del paso 1 |
   | `JwtSettings__SecretKey` | Una clave aleatoria nueva de al menos 32 caracteres (no la de desarrollo) |
   | `Cors__AllowedOrigins__0` | La URL de Vercel, por ejemplo `https://agrocita-nuevo.vercel.app` |
   | `Seed__SuperAdminEmail` | Correo del primer SuperAdmin |
   | `Seed__SuperAdminPassword` | Contraseña del primer SuperAdmin |
   | `Seed__DemoData` | `true` solo si se quieren los datos de demostración |

4. En **Settings → Build & Deploy**:
   - **Auto-Deploy: Off**. GitHub Actions es quien despliega, solo cuando las pruebas pasan.
   - **Deploy Hook**: copiar la URL. Va en el secreto `RENDER_DEPLOY_HOOK_URL` (paso 4). Es secreta: quien la tenga puede desplegar.

La URL de la API queda como `https://NOMBRE.onrender.com`. Al abrirla debe responder
`{"mensaje":"Bienvenido a AgroCita API", ...}`.

Limitaciones del plan gratuito:

- La API se duerme tras 15 minutos sin uso; la primera petición después tarda cerca de un minuto.
- El disco se borra en cada despliegue: las fotos de evidencias, las firmas y los logos subidos se pierden.
  Para conservarlos hace falta un disco persistente de Render (de pago) o guardar los archivos en un servicio externo.

## 3. Frontend en Vercel

En el proyecto `agrocita-nuevo` de Vercel:

1. **Settings → Build and Deployment → Root Directory**: `frontend`.
2. **Settings → Environment Variables**: agregar `VITE_API_URL` de tipo **Config** con la URL de Render
   terminada en `/api` (por ejemplo `https://NOMBRE.onrender.com/api`), en Production y Preview.

`frontend/vercel.json` ya hace dos cosas:

- envía todas las rutas a `index.html`, para que recargar páginas como `/fincas` no dé 404;
- desactiva el despliegue automático de Vercel en `main`, porque lo hace GitHub Actions después de las pruebas.
  Las demás ramas siguen generando vistas previas en Vercel.

## 4. Secretos en GitHub

En el repositorio: **Settings → Secrets and variables → Actions → New repository secret**.

| Secreto | De dónde sale |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render → servicio de la API → Settings → Deploy Hook |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel → Settings del equipo → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel → proyecto `agrocita-nuevo` → Settings → General → Project ID (empieza con `prj_`) |

## 5. Comprobar

1. Hacer un push a `main` (o en **Actions → CI → Run workflow**).
2. En la pestaña **Actions**, el trabajo **Desplegar a producción** debe terminar en verde, sin avisos de "sin configurar".
3. Abrir la URL de Vercel e iniciar sesión.

Si el login falla con error de red, revisar que `VITE_API_URL` apunte a la API y que
`Cors__AllowedOrigins__0` tenga exactamente la URL de Vercel (sin `/` al final).
