FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY frontend/package.json frontend/tsconfig.json ./frontend/
COPY backend/package.json backend/tsconfig.json ./backend/

RUN pnpm install --frozen-lockfile

COPY frontend/ ./frontend/
COPY backend/ ./backend/

RUN pnpm --filter biunote-frontend build

FROM node:22-alpine AS runner
WORKDIR /app

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache git tzdata

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/notes

ENV NODE_ENV=production \
    PORT=3000 \
    NOTES_DIR=/app/notes \
    LOGIN_TOKEN=biunote-secret-token \
    TZ=Asia/Shanghai

VOLUME ["/app/notes"]

EXPOSE 3000

WORKDIR /app/backend
CMD ["npx", "tsx", "server.ts"]
