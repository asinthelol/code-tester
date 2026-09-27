FROM node:24-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-pip g++ \
    && rm -rf /var/lib/apt/lists/*

    RUN pip3 install --no-cache-dir --break-system-packages \
      psycopg2-binary redis pymysql

COPY dist/ ./dist/

ENV NODE_OPTIONS=--experimental-strip-types

ENTRYPOINT ["node", "dist/index.js"]
