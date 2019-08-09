FROM node:latest as builder

WORKDIR /var/www/app
ENV NODE_ENV=production

COPY package.json /var/www/app
COPY lerna.json /var/www/app/

COPY beta/package.json /var/www/beta/
COPY embed/package.json /var/www/embed/
COPY upload/package.json /var/www/upload/

COPY packages/api-factory-generator/package.json /var/www/packages/api-factory-generator/
COPY packages/artwork-component/package.json /var/www/packages/artwork-component/
COPY packages/button-component/package.json /var/www/packages/button-component/
COPY packages/button/package.json /var/www/packages/button/
COPY packages/choo-plugins/package.json /var/www/packages/choo-plugins/
COPY packages/counter/package.json /var/www/packages/counter/
COPY packages/dialog-component/package.json /var/www/packages/dialog-component/
COPY packages/envlocalify/package.json /var/www/packages/envlocalify/
COPY packages/icon-element/package.json /var/www/packages/icon-element/
COPY packages/input-element/package.json /var/www/packages/input-element/
COPY packages/link-element/package.json /var/www/packages/link-element/
COPY packages/menu-button/package.json /var/www/packages/menu-button/
COPY packages/nanoplayer/package.json /var/www/packages/nanoplayer/
COPY packages/pagination/package.json /var/www/packages/play-count/
COPY packages/player-component/package.json /var/www/packages/player-component/
COPY packages/playlist-component/package.json /var/www/packages/playlist-component/
COPY packages/rangeslider/package.json /var/www/packages/rangeslider/
COPY packages/schemas/package.json /var/www/packages/schemas/
COPY packages/seeker-component/package.json /var/www/packages/seeker-component/
COPY packages/tachyons/package.json /var/www/packages/seeker-component/
COPY packages/theme-skins/package.json /var/www/packages/theme-skins/
COPY packages/tools/package.json /var/www/packages/tools/
COPY packages/track-component/package.json /var/www/packages/track-component/
COPY packages/utils/package.json /var/www/packages/utils/
COPY packages/volume-control-component/package.json /var/www/packages/volume-control-componen/

RUN npm ci --ignore-scripts --production --no-optional
RUN npx lerna bootstrap --hoist --ignore-scripts -- --production --no-optional

COPY . /var/www/app/

RUN npm run build:app
RUN npm run build:embed

FROM nginx:1.15-alpine
COPY --from=builder /var/www/beta/dist /usr/share/nginx/html
