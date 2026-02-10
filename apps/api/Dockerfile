ARG NODE_VERSION=24.13.0
FROM node:${NODE_VERSION}-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apk add --no-cache git

FROM base AS prepare

WORKDIR /app
RUN pnpm add turbo --global
COPY . .
RUN turbo prune cared-api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS builder
WORKDIR /app

ARG HTTPS_PROXY
ENV HTTPS_PROXY=$HTTPS_PROXY

# First install dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN pnpm install

# Build the project and its dependencies
COPY --from=prepare /app/out/full/ .

RUN pnpm turbo build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 cared
RUN adduser --system --uid 1001 cared
USER cared
COPY --from=builder /app .

CMD node apps/api/dist/index.mjs
