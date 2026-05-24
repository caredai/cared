ARG NODE_VERSION=24.16.0
FROM node:${NODE_VERSION}-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"

RUN corepack enable

FROM base AS builder

RUN apk add --no-cache gcompat git

WORKDIR /app

COPY package.json ./
COPY tsconfig.docker.json ./tsconfig.json

RUN sed -i '/workspace:/d' package.json && \
    sed -i '/catalog:/d' package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile
COPY src ./src
RUN pnpm run build

FROM builder AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --no-frozen-lockfile

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=prod-deps --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono
EXPOSE 3000

ENTRYPOINT ["node", "/app/dist/index.js"]
