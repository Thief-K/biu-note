# ==========================================
# 阶段 1: 构建阶段（前端打包与依赖管理）
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

# 启用 pnpm（与 lockfileVersion 9 保持一致）
RUN corepack enable && corepack prepare pnpm@9 --activate

# 复制包清单与 TS 配置（利用 Docker 缓存层）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY frontend/package.json frontend/tsconfig.json ./frontend/
COPY backend/package.json backend/tsconfig.json ./backend/

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# 编译前端
RUN pnpm --filter biunote-frontend build

# ==========================================
# 阶段 2: 极简生产运行镜像
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

# 切换为阿里云镜像源并安装 Git（笔记版本自动 commit 必需）与时区数据
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache git tzdata

# 复制后端源码与前端构建产物
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist

# 创建持久化笔记目录
RUN mkdir -p /app/notes

# 设置环境变量默认值（统一持久化到 /app/notes，元数据与向量位于 /app/notes/.biunote/）
ENV NODE_ENV=production \
    PORT=3000 \
    NOTES_DIR=/app/notes \
    LOGIN_TOKEN=biunote-secret-token \
    TZ=Asia/Shanghai

VOLUME ["/app/notes"]

EXPOSE 3000

WORKDIR /app/backend
CMD ["npx", "tsx", "server.ts"]
