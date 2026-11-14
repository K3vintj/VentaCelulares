FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install --global pnpm@10.34.3 && pnpm install --frozen-lockfile
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm --prefix backend ci
COPY . .
RUN npm run build:all

FROM node:24-bookworm-slim AS dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000 SERVE_FRONTEND=true COOKIE_SECURE=true
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/backend/dist ./backend/dist
COPY --from=build --chown=node:node /app/backend/package.json ./backend/package.json
COPY --from=build --chown=node:node /app/backend/sql ./backend/sql
COPY --from=build --chown=node:node /app/backend/certs ./backend/certs
COPY --from=dependencies --chown=node:node /app/backend/node_modules ./backend/node_modules
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=12s --start-period=20s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health/ready',{signal:AbortSignal.timeout(10000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "backend/dist/index.js"]
