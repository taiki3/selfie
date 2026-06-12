# syntax=docker/dockerfile:1
# selfie-api — Fastify + PostgreSQL backend.

# --- Build stage ---
FROM node:22-slim AS builder

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=${HTTP_PROXY} HTTPS_PROXY=${HTTPS_PROXY} NO_PROXY=${NO_PROXY}

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune to production dependencies for the runtime image.
RUN npm ci --omit=dev

# --- Runtime stage ---
FROM node:22-slim AS runtime
ENV NODE_ENV=production

WORKDIR /app
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY migrations ./migrations

EXPOSE 3001
# Migrations + seed run at startup (see src/index.ts).
CMD ["node", "dist/index.js"]
