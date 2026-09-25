FROM node:24-slim

WORKDIR /app
COPY dist/index.js ./dist/index.js

ENV NODE_OPTIONS=--experimental-strip-types

ENTRYPOINT ["node", "dist/index.js"]
