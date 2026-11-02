# renovate: datasource=docker depName=node versioning=docker
FROM docker.io/library/node:24.22.2-alpine3.24 AS dependencies
WORKDIR /app
COPY package.json ./
RUN apk add --no-cache python3 make g++
RUN npm install --omit=dev --no-audit --no-fund

FROM docker.io/library/node:24.22.2-alpine3.24
WORKDIR /app
# Runtime only: remove the bundled package managers and their dependency trees.
RUN rm -rf /usr/local/lib/node_modules /opt/yarn* \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg \
 && mkdir -p /data && chown node:node /data
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/
USER node
CMD ["node", "src/index.js"]
