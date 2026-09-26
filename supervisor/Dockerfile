FROM node:24-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY dist/index.js ./dist/index.js

ENV NODE_OPTIONS=--experimental-strip-types

ENTRYPOINT ["node", "dist/index.js"]
