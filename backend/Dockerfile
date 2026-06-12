# =========================================================
# GlobalHack-IveSeenThisBefore — Backend
# Node.js 20 LTS + TypeScript (via tsx)
# =========================================================

FROM node:20-alpine AS base
WORKDIR /app

# --- Dependências ---
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --workspace=backend --omit=dev

# --- Código fonte ---
COPY backend/ ./backend/
COPY data/ ./data/

WORKDIR /app/backend

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# tsx para rodar TypeScript diretamente em produção (sem compilação)
CMD ["../node_modules/.bin/tsx", "src/index.ts"]
