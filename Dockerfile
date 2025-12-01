FROM node:24.7-alpine3.21 AS base

WORKDIR /usr/src/app

RUN npm i -g pnpm

FROM base AS build

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

ENV PATH_TO_PRISMA=src/infra/database/prisma

RUN pnpm prisma generate
RUN pnpm build

FROM base AS release

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma.config.ts ./prisma.config.ts
COPY --from=build /usr/src/app/src/infra/database/prisma/migrations ./prisma/migrations
COPY --from=build /usr/src/app/src/infra/database/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=build /usr/src/app/src/infra/database/generated ./dist/infra/database/generated

EXPOSE 3333

ENV PORT=3333
ENV NODE_ENV=production
ENV HOST="0.0.0.0"
ENV PATH_TO_PRISMA=./prisma

ENTRYPOINT ["pnpm", "start"]

RUN pnpm rm prisma
