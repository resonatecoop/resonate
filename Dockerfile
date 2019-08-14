FROM node:latest as builder

RUN mkdir -p /tmp/app

WORKDIR /tmp/app

ENV NODE_ENV=production

COPY . /tmp/app

RUN npx lerna bootstrap

RUN npm run build:app

COPY . /var/www/app/

FROM nginx:1.13.12-alpine

WORKDIR /var/www/app

COPY --from=builder /tmp/app/beta/dist/ /var/www/app/
