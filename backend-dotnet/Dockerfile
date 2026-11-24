# ==========================================
# ETAPA 1: BUILD
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build

WORKDIR /src

# Copiar archivos de proyecto
COPY src/AgroCita.Domain/AgroCita.Domain.csproj src/AgroCita.Domain/
COPY src/AgroCita.Application/AgroCita.Application.csproj src/AgroCita.Application/
COPY src/AgroCita.Infrastructure/AgroCita.Infrastructure.csproj src/AgroCita.Infrastructure/
COPY src/AgroCita.API/AgroCita.API.csproj src/AgroCita.API/

# Restaurar dependencias
RUN dotnet restore src/AgroCita.API/AgroCita.API.csproj

# Copiar el código fuente
COPY src/ ./src/

# Publicar aplicación
RUN dotnet publish src/AgroCita.API/AgroCita.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ==========================================
# ETAPA 2: RUNTIME
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime

WORKDIR /app

# Dependencias nativas para QuestPDF y globalización
RUN apk add --no-cache \
    icu-libs \
    fontconfig \
    freetype \
    harfbuzz \
    libstdc++ \
    libgcc

# Configuración de ASP.NET Core
ENV ASPNETCORE_HTTP_PORTS=8080
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

# Copiar archivos publicados
COPY --from=build /app/publish .

# Preparar almacenamiento local
RUN mkdir -p /app/almacenamiento \
	&& chown -R app:app /app

# Ejecutar sin privilegios de root
USER app

EXPOSE 8080

ENTRYPOINT ["dotnet", "AgroCita.API.dll"]
