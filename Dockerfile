# syntax=docker/dockerfile:1

# Pamasahe Cabanatuan: Next.js standalone server, plus a one-shot migration image.
# docker-compose.yml builds two targets from this file: `migrate` and `runner`.

FROM node:24-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── Dependencies (also the migration image) ──────────────────────────────────
FROM base AS deps
# Prisma's migration engine needs OpenSSL, which the slim image leaves out.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
# The postinstall script runs `prisma generate`, so the schema and config go in first.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci

# Applies pending migrations, then exits. Run before the app starts.
FROM deps AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

# ── Build ────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
# Inlined into the build (metadata, sitemap, robots), so it's a build argument, not a runtime variable.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# No database is reachable here; pages that read it render per request instead.
# Better Auth won't load without a secret, even at build time. This throwaway one exists
# only for this command; the real secret is passed to the running container.
# The cache mount keeps Next's build cache between builds, so rebuilds are faster.
RUN --mount=type=cache,target=/app/.next/cache \
    BETTER_AUTH_SECRET="$(head -c 32 /dev/urandom | base64)" npm run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM base AS runner
# Docker sets HOSTNAME to the container id; the server must listen on every interface.
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
# /api/auth/ok answers without touching the database, so this checks the server, not Postgres.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/auth/ok').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "server.js"]
