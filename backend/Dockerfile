# ==============================================================================
# Dockerfile Multi-Stage para Backend (Node.js 22 LTS + TypeScript + Prisma)
# ==============================================================================

FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
# corepack toma la versión de pnpm del campo "packageManager" de package.json,
# única fuente de verdad compartida con CI y con las máquinas de desarrollo.
RUN corepack enable

# 1. Dependencias
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# 2. Compilación (Build)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build

# 3. Runner de Producción
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./dist/generated
COPY --from=builder /app/src ./src

EXPOSE 3000
# Se invoca el binario de Prisma directamente en lugar de `pnpm exec`: pnpm
# revalida el árbol de dependencias en cada arranque, lo que obliga a corepack a
# descargar pnpm desde el registro cada vez que el contenedor se levanta y hace
# que el arranque dependa de tener red. El binario ya está en la imagen.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
