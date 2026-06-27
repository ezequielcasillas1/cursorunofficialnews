# Build from repo root (monorepo: mobile/shared is required at runtime):
#   fly deploy --config mobile/server/fly.toml --build-context .
# Or use root fly.toml from repo root: fly deploy
FROM node:20-alpine

WORKDIR /app/server

COPY mobile/server/package.json mobile/server/package-lock.json ./
RUN npm ci --omit=dev

COPY mobile/shared /app/shared
COPY mobile/server/ ./

ENV NODE_ENV=production
ENV PORT=8787
ENV DATA_DIR=/app/data

EXPOSE 8787

CMD ["npm", "start"]
