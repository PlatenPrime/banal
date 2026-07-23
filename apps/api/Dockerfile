# Multi-stage API image for Railway.
# Build from repo root: docker build -f apps/api/Dockerfile -t banal-api .
# Context MUST be the monorepo root (workspace + @app/shared-contracts).
# Healthcheck uses GET /health (see railway.toml).

FROM node:24-bookworm-slim AS builder

WORKDIR /app

ENV HUSKY=0 \
    CI=true \
    NX_DAEMON=false

COPY package.json package-lock.json nx.json tsconfig.base.json tsconfig.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/web-e2e/package.json apps/web-e2e/
COPY libs/shared-contracts/package.json libs/shared-contracts/

# Skip husky/prepare; native packages use prebuilds (@node-rs/argon2).
RUN npm ci --ignore-scripts

COPY apps/api apps/api
COPY libs/shared-contracts libs/shared-contracts

RUN npx nx run api:build

FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HUSKY=0 \
    CI=true

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/web-e2e/package.json apps/web-e2e/
COPY libs/shared-contracts/package.json libs/shared-contracts/

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/libs/shared-contracts/dist libs/shared-contracts/dist
COPY --from=builder /app/apps/api/dist apps/api/dist

USER node

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
