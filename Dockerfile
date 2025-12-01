FROM node:22.11.0 AS base

RUN npm i -g pnpm

FROM base AS dependencies

WORKDIR /usr/app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

FROM base AS build

WORKDIR /usr/app

COPY . .
COPY --from=dependencies /usr/app/node_modules ./node_modules

RUN pnpm build
RUN pnpm prune --prod

FROM node:22.11.0-alpine3.20 AS deploy 

WORKDIR /usr/app

RUN npm i -g pnpm prisma

COPY --from=build /usr/app/dist ./dist
COPY --from=build /usr/app/node_modules ./node_modules
COPY --from=build /usr/app/package.json ./package.json
COPY --from=build /usr/app/prisma ./prisma

RUN pnpm prisma generate

EXPOSE 3333 

CMD ["pnpm", "start"]