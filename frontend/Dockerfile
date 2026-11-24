# ==========================================
# ETAPA 1: BUILD
# ==========================================
FROM node:22-alpine AS build

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# URL de API utilizada durante la compilación
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Compilar frontend
RUN npm run build

# ==========================================
# ETAPA 2: RUNTIME
# ==========================================
FROM nginx:alpine AS runtime

# Configurar Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
