FROM node:12-alpine as builder

WORKDIR /var/www/app

COPY . .

ENV NODE_ENV=development

RUN npx lerna bootstrap

RUN npm run build

FROM node:12-alpine

COPY . .

RUN npx lerna bootstrap

COPY --from=builder /var/www/app/beta/dist ./dist

EXPOSE 8080

CMD ["npm", "start"]
