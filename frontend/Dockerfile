# =========================================================
# GlobalHack-IveSeenThisBefore — Frontend
# Multi-stage: build Vite → serve com nginx
# =========================================================

FROM node:20-alpine AS builder
WORKDIR /app

# Dependências (workspace raiz)
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci --workspace=frontend

# Código fonte
COPY frontend/ ./frontend/
COPY . .

# Build de produção
WORKDIR /app/frontend
RUN npm run build

# ---- Servidor nginx ----
FROM nginx:1.25-alpine AS runner

# Remove config padrão e copia a nossa
RUN rm /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build do Vite
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
