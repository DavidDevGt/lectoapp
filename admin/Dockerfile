# ==============================================================================
# Dockerfile Multi-Stage para Panel Admin (React + Vite + Nginx)
# ==============================================================================

# 1. Build de producción de la SPA React
FROM node:22-alpine AS builder
WORKDIR /app
# corepack toma la versión de pnpm del campo "packageManager" de package.json,
# única fuente de verdad compartida con CI y con las máquinas de desarrollo.
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# 2. Servidor web Nginx ultraligero para servir los estáticos y proxiar /api
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
