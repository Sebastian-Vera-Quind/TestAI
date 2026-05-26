FROM node:22-alpine AS deps
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY domain/models/package.json ./domain/models/package.json
COPY domain/ports/package.json ./domain/ports/package.json
COPY application/usecase/package.json ./application/usecase/package.json
COPY infra/api/package.json ./infra/api/package.json
COPY infra/driven-adapters/ai/package.json ./infra/driven-adapters/ai/package.json
COPY infra/driven-adapters/engine/package.json ./infra/driven-adapters/engine/package.json
COPY infra/driven-adapters/persistence/package.json ./infra/driven-adapters/persistence/package.json
COPY infra/helper/package.json ./infra/helper/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile && pnpm -r run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache curl
RUN curl -o /app/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

COPY --from=build /app /app
COPY ./setup.sh /app/setup.sh

EXPOSE 3000
CMD ["/bin/sh", "/app/setup.sh"]
