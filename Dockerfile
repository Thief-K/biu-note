FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Dependencies cache
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY package.json tsconfig.json ./
COPY frontend/package.json frontend/tsconfig.json ./frontend/
COPY backend/package.json backend/tsconfig.json ./backend/
RUN pnpm install --offline --frozen-lockfile

# Build frontend & backend
COPY frontend/ ./frontend/
COPY backend/ ./backend/
RUN pnpm --filter biunote-frontend build
RUN pnpm --filter biunote-backend build

# Production backend dependencies
RUN pnpm --filter biunote-backend deploy --prod /app/deployed-backend

# Production Runner Stage
FROM node:22-alpine AS runner
WORKDIR /app

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache git tzdata

# Production artifacts
COPY --from=builder /app/deployed-backend/node_modules /app/backend/node_modules
COPY --from=builder /app/frontend/dist /app/frontend/dist
COPY --from=builder /app/backend/package.json /app/backend/
COPY --from=builder /app/backend/dist /app/backend/dist

RUN mkdir -p /app/notes

ENV NODE_ENV=production \
    PORT=3000 \
    NOTES_DIR=/app/notes \
    LOGIN_TOKEN=biunote-secret-token \
    TZ=Asia/Shanghai

VOLUME ["/app/notes"]

EXPOSE 3000

WORKDIR /app/backend
CMD ["node", "dist/server.js"]
