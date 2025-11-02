# 基于 Node.js 18 的 Alpine Linux 镜像
FROM node:18-alpine AS base

# 安装依赖阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制依赖配置文件
COPY package.json package-lock.json* ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app

# 定义构建参数（从外部传入）
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_XFYUN_APP_ID
ARG NEXT_PUBLIC_XFYUN_API_KEY
ARG NEXT_PUBLIC_XFYUN_API_SECRET
ARG NEXT_PUBLIC_AMAP_KEY
ARG NEXT_PUBLIC_AMAP_SECRET

# 设置为环境变量（构建时可用）
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_XFYUN_APP_ID=$NEXT_PUBLIC_XFYUN_APP_ID
ENV NEXT_PUBLIC_XFYUN_API_KEY=$NEXT_PUBLIC_XFYUN_API_KEY
ENV NEXT_PUBLIC_XFYUN_API_SECRET=$NEXT_PUBLIC_XFYUN_API_SECRET
ENV NEXT_PUBLIC_AMAP_KEY=$NEXT_PUBLIC_AMAP_KEY
ENV NEXT_PUBLIC_AMAP_SECRET=$NEXT_PUBLIC_AMAP_SECRET

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建 Next.js 应用
RUN npm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 直接启动应用（环境变量已在构建时注入）
CMD ["node", "server.js"]

