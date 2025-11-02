# Docker 环境变量问题解决方案

## 🚨 问题描述

在 Docker 容器中运行时，浏览器控制台报错：
```
Uncaught Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

## 🔍 问题根因

1. **Next.js 环境变量机制**：
   - `NEXT_PUBLIC_` 前缀的环境变量需要在**构建时**可用
   - Next.js 会将这些变量**静态注入**到客户端代码中
   - 构建后的代码中，`process.env.NEXT_PUBLIC_XXX` 会被替换为实际值

2. **Docker 构建流程**：
   - Docker 镜像在**构建时**没有环境变量
   - 环境变量在**运行时**通过 `--env-file` 提供
   - 导致客户端代码中的环境变量为 `undefined`

## ✅ 解决方案

### 方案 1：构建时提供环境变量（推荐）

重新构建镜像时提供环境变量：

```bash
# 1. 创建构建时环境变量文件
cp .env.local .env.build

# 2. 构建时使用环境变量
docker build --env-file .env.build -t ai-travel-planner:latest .
```

### 方案 2：使用 ARG 和 ENV（更灵活）

修改 `Dockerfile`：

```dockerfile
# 在构建阶段添加 ARG
FROM base AS builder
WORKDIR /app

# 定义构建参数
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_XFYUN_APP_ID
ARG NEXT_PUBLIC_XFYUN_API_KEY
ARG NEXT_PUBLIC_XFYUN_API_SECRET
ARG NEXT_PUBLIC_AMAP_KEY
ARG NEXT_PUBLIC_AMAP_SECRET

# 设置为环境变量
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_XFYUN_APP_ID=$NEXT_PUBLIC_XFYUN_APP_ID
ENV NEXT_PUBLIC_XFYUN_API_KEY=$NEXT_PUBLIC_XFYUN_API_KEY
ENV NEXT_PUBLIC_XFYUN_API_SECRET=$NEXT_PUBLIC_XFYUN_API_SECRET
ENV NEXT_PUBLIC_AMAP_KEY=$NEXT_PUBLIC_AMAP_KEY
ENV NEXT_PUBLIC_AMAP_SECRET=$NEXT_PUBLIC_AMAP_SECRET

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build
```

构建命令：

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://cyxwcrxrmonevvvafaet.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --build-arg NEXT_PUBLIC_XFYUN_APP_ID="850876d4" \
  --build-arg NEXT_PUBLIC_XFYUN_API_KEY="81c297deba83bc8ef7c22073bca93aec" \
  --build-arg NEXT_PUBLIC_XFYUN_API_SECRET="NTNmYmJjZDVkOTJiMWM4YzVlYzZiMDRh" \
  --build-arg NEXT_PUBLIC_AMAP_KEY="1e25b66013ee7ab6ac4de0b6c81940d6" \
  --build-arg NEXT_PUBLIC_AMAP_SECRET="31892577c1335fcb8d12648c8af2aff9" \
  -t ai-travel-planner:latest .
```

### 方案 3：使用 docker-compose（最简单）

创建 `docker-compose.build.yml`：

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        NEXT_PUBLIC_XFYUN_APP_ID: ${NEXT_PUBLIC_XFYUN_APP_ID}
        NEXT_PUBLIC_XFYUN_API_KEY: ${NEXT_PUBLIC_XFYUN_API_KEY}
        NEXT_PUBLIC_XFYUN_API_SECRET: ${NEXT_PUBLIC_XFYUN_API_SECRET}
        NEXT_PUBLIC_AMAP_KEY: ${NEXT_PUBLIC_AMAP_KEY}
        NEXT_PUBLIC_AMAP_SECRET: ${NEXT_PUBLIC_AMAP_SECRET}
    image: ai-travel-planner:latest
    ports:
      - "3000:3000"
    environment:
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - AMAP_WEB_SERVICE_KEY=${AMAP_WEB_SERVICE_KEY}
```

构建和运行：

```bash
# 构建（会自动从 .env 读取变量）
docker-compose -f docker-compose.build.yml build

# 运行
docker-compose -f docker-compose.build.yml up -d
```

## 🎯 立即解决方案（当前情况）

由于您已经有了构建好的镜像，最快的解决方案是：

### 步骤 1：修改 Dockerfile

```dockerfile
# 在 builder 阶段添加
FROM base AS builder
WORKDIR /app

# 添加构建参数
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_XFYUN_APP_ID
ARG NEXT_PUBLIC_XFYUN_API_KEY
ARG NEXT_PUBLIC_XFYUN_API_SECRET
ARG NEXT_PUBLIC_AMAP_KEY
ARG NEXT_PUBLIC_AMAP_SECRET

# 设置环境变量
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_XFYUN_APP_ID=$NEXT_PUBLIC_XFYUN_APP_ID
ENV NEXT_PUBLIC_XFYUN_API_KEY=$NEXT_PUBLIC_XFYUN_API_KEY
ENV NEXT_PUBLIC_XFYUN_API_SECRET=$NEXT_PUBLIC_XFYUN_API_SECRET
ENV NEXT_PUBLIC_AMAP_KEY=$NEXT_PUBLIC_AMAP_KEY
ENV NEXT_PUBLIC_AMAP_SECRET=$NEXT_PUBLIC_AMAP_SECRET

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build
```

### 步骤 2：重新构建

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://cyxwcrxrmonevvvafaet.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eHdjcnhybW9uZXZ2dmFmYWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMDI2NTAsImV4cCI6MjA3Njc3ODY1MH0.uOsrfc1Z9uZ5EYT3DLTjVKCazFILemh7xSWJx9calk8" \
  --build-arg NEXT_PUBLIC_XFYUN_APP_ID="850876d4" \
  --build-arg NEXT_PUBLIC_XFYUN_API_KEY="81c297deba83bc8ef7c22073bca93aec" \
  --build-arg NEXT_PUBLIC_XFYUN_API_SECRET="NTNmYmJjZDVkOTJiMWM4YzVlYzZiMDRh" \
  --build-arg NEXT_PUBLIC_AMAP_KEY="1e25b66013ee7ab6ac4de0b6c81940d6" \
  --build-arg NEXT_PUBLIC_AMAP_SECRET="31892577c1335fcb8d12648c8af2aff9" \
  -t ai-travel-planner:latest .
```

### 步骤 3：运行

```bash
docker run -d \
  --name ai-travel-planner \
  -p 3000:3000 \
  -e DEEPSEEK_API_KEY="sk-969745a2242c498f9a6c459634f0389a" \
  -e AMAP_WEB_SERVICE_KEY="24c835245683a29acd0559fd571a5267" \
  ai-travel-planner:latest
```

## 📝 更新文档

需要更新以下文档：

1. **BUILD_AND_RUN.md** - 添加构建参数说明
2. **LOCAL_BUILD_GUIDE.md** - 更新构建命令
3. **docker-compose.yml** - 添加构建配置

## ⚠️ 安全注意事项

1. **API Keys 会被嵌入镜像**：
   - `NEXT_PUBLIC_` 变量会被静态注入到客户端代码
   - 任何人都可以从浏览器开发者工具中看到这些值
   - 这是 Next.js 的正常行为，不是安全问题

2. **敏感信息处理**：
   - 只有 `NEXT_PUBLIC_` 前缀的变量会暴露给客户端
   - `DEEPSEEK_API_KEY` 和 `AMAP_WEB_SERVICE_KEY` 仅在服务端使用，不会暴露

3. **生产环境建议**：
   - 为不同环境创建不同的镜像
   - 使用 CI/CD 管道自动化构建
   - 定期轮换 API Keys

## 🎉 验证成功

构建完成后，访问 http://localhost:3000，应该不再看到 Supabase 错误。

可以在浏览器控制台执行以下命令验证：

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
```

应该看到正确的值，而不是 `undefined`。
