# Dockerfile compatible con Monorepo para Next.js
FROM node:20-alpine AS base

# 1. Instalar dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias desde la raíz y el frontend
COPY package.json package-lock.json* ./
# Nota: En monorepo, necesitamos el lockfile de la raíz
COPY frontend/package.json ./frontend/

# Instalar dependencias usando los Workspaces de NPM
RUN npm ci

# 2. Construir el proyecto
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copiamos todo el monorepo (necesario para resolver workspaces)
COPY . .

# Variables de entorno para el build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_SUPABASE_URL="https://sbdejytqnucpokrfrjzq.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy"
ENV FISCAL_ENCRYPTION_KEY="dummy-key-for-build-only"

# Ejecutar el build del workspace frontend
RUN npm run build --workspace=frontend

# 3. Imagen de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiamos solo lo necesario del output standalone
COPY --from=builder /app/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

USER nextjs

ENV PORT 8080
EXPOSE 8080

# El servidor standalone se genera en la raíz del workspace
CMD ["node", "frontend/server.js"]
