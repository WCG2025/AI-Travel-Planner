# AI Travel Planner - Docker 部署指南

## 📦 Docker 镜像说明

本项目提供了完整的 Docker 化部署方案，可以快速部署到任何支持 Docker 的环境。

**镜像大小**：~150MB（多阶段构建优化）  
**Node.js 版本**：18 Alpine  
**端口**：3000

---

## 🚀 快速开始

### ⚠️ 重要提醒：环境变量构建

**本项目必须使用 `docker-compose.build.yml` 来构建镜像**，这样才能在构建时正确注入所有必要的环境变量（特别是 `NEXT_PUBLIC_*` 变量）。

如果使用普通的 `docker build` 命令构建，会出现 Supabase 配置错误：
```
Supabase 配置错误: Object
@supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

### 方式一：使用 docker-compose.build.yml（推荐且必需）

#### 1. 编辑 `docker-compose.build.yml` 文件

打开项目根目录下的 `docker-compose.build.yml` 文件，将所有 `your_xxx` 替换为您的真实 API Key：

```yaml
# docker-compose.build.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        # 构建时注入的环境变量（必需）
        NEXT_PUBLIC_SUPABASE_URL: your_supabase_project_url
        NEXT_PUBLIC_SUPABASE_ANON_KEY: your_supabase_anon_key
        NEXT_PUBLIC_XFYUN_APP_ID: your_xfyun_app_id
        NEXT_PUBLIC_XFYUN_API_KEY: your_xfyun_api_key
        NEXT_PUBLIC_XFYUN_API_SECRET: your_xfyun_api_secret
        NEXT_PUBLIC_AMAP_KEY: your_amap_js_api_key
        NEXT_PUBLIC_AMAP_SECRET: your_amap_secret
    image: ai-travel-planner:latest
    container_name: ai-travel-planner
    ports:
      - "3000:3000"
    environment:
      # 运行时环境变量
      - DEEPSEEK_API_KEY=your_deepseek_api_key
      - AMAP_WEB_SERVICE_KEY=your_amap_web_service_key
      - NODE_ENV=production
    restart: unless-stopped
```

#### 2. 构建并启动容器

```bash
# 构建镜像（会自动注入环境变量）
docker-compose -f docker-compose.build.yml build

# 启动服务（后台运行）
docker-compose -f docker-compose.build.yml up -d

# 查看日志
docker-compose -f docker-compose.build.yml logs -f

# 停止服务
docker-compose -f docker-compose.build.yml down
```

#### 3. 访问应用

打开浏览器访问：
```
http://localhost:3000
```

---

### 方式二：使用预构建的 Docker 镜像文件

如果您有预构建的 `ai-travel-planner-docker-image.tar` 文件：

#### 步骤 1. 加载镜像

```bash
# 加载预构建的镜像
docker load -i ai-travel-planner-docker-image.tar
```

### 步骤 2：创建环境变量文件

在**同一目录**创建 `.env` 文件，内容如下：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
AMAP_WEB_SERVICE_KEY=your_amap_web_service_key
```

**说明**：
- 这两个 API Key 需要您自己申请（见下文）
- 其他所有配置已内置在镜像中
- 如果仅用于测试，可以使用作者提供的测试 Key（见下文）

---

### 步骤 3：启动应用

#### 方法 A：使用 docker run（简单快速）

```bash
docker run -d \
  --name ai-travel-planner \
  -p 3000:3000 \
  -e DEEPSEEK_API_KEY=your_deepseek_api_key \
  -e AMAP_WEB_SERVICE_KEY=your_amap_web_service_key \
  ai-travel-planner:latest
```

**Windows PowerShell 格式**：
```powershell
docker run -d `
  --name ai-travel-planner `
  -p 3000:3000 `
  -e DEEPSEEK_API_KEY=your_deepseek_api_key `
  -e AMAP_WEB_SERVICE_KEY=your_amap_web_service_key `
  ai-travel-planner:latest
```

#### 方法 B：使用 docker-compose（推荐）

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  app:
    image: ai-travel-planner:latest
    container_name: ai-travel-planner
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

然后启动：

```bash
docker-compose up -d
```

---

### 步骤 4：访问应用

打开浏览器，访问：

```
http://localhost:3000
```

**应该看到**：AI Travel Planner 登录页面

---

### ❌ 不推荐的方式：直接使用 Docker 命令

**注意**：以下方式可能导致环境变量注入问题，不推荐使用。

#### 问题示例

```bash
# ❌ 这种方式会导致 Supabase 配置错误
docker build -t ai-travel-planner:latest .
```

如果必须使用 Docker 命令，需要传递所有构建参数：

```bash
# ✅ 正确的构建方式（但仍推荐使用 docker-compose）
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key \
  --build-arg NEXT_PUBLIC_XFYUN_APP_ID=your_xfyun_appid \
  --build-arg NEXT_PUBLIC_XFYUN_API_KEY=your_xfyun_key \
  --build-arg NEXT_PUBLIC_XFYUN_API_SECRET=your_xfyun_secret \
  --build-arg NEXT_PUBLIC_AMAP_KEY=your_amap_js_key \
  --build-arg NEXT_PUBLIC_AMAP_SECRET=your_amap_secret \
  -t ai-travel-planner:latest .
```

---

## 🔑 API Key 申请指南

### 1. Supabase（数据库和认证）

1. 访问 https://supabase.com/
2. 注册账号并创建项目
3. 在项目设置 → API 中获取：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. DeepSeek（AI 行程规划）

1. 访问 https://platform.deepseek.com/
2. 注册账号
3. 在 API Keys 页面创建新 Key
4. 复制 `DEEPSEEK_API_KEY`

### 3. 科大讯飞（语音识别）

1. 访问 https://console.xfyun.cn/
2. 注册账号并创建应用
3. 选择"语音听写（流式版）WebAPI"
4. 获取：
   - `NEXT_PUBLIC_XFYUN_APP_ID`
   - `NEXT_PUBLIC_XFYUN_API_KEY`
   - `NEXT_PUBLIC_XFYUN_API_SECRET`

### 4. 高德地图（地图导航）

1. 访问 https://console.amap.com/
2. 注册账号并创建应用
3. 添加两个 Key：
   - **Web端（JS API）** → `NEXT_PUBLIC_AMAP_KEY`
   - **Web服务** → `AMAP_WEB_SERVICE_KEY`

---

## 🧪 验证部署

### 1. 检查容器状态

```bash
docker ps
```

应该看到：
```
CONTAINER ID   IMAGE                    STATUS         PORTS
xxx            ai-travel-planner:latest Up 2 minutes   0.0.0.0:3000->3000/tcp
```

### 2. 检查健康状态

```bash
curl http://localhost:3000/api/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "uptime": 120.5
}
```

### 3. 访问应用

打开浏览器：http://localhost:3000

应该看到登录页面。

---

## 📊 容器资源使用

### 推荐配置

| 资源 | 最小值 | 推荐值 |
|------|--------|--------|
| CPU | 0.5 核 | 1 核 |
| 内存 | 512MB | 1GB |
| 磁盘 | 500MB | 1GB |

### 性能指标

- **启动时间**：~5-10秒
- **首次访问**：~2秒
- **内存占用**：~200-300MB
- **CPU占用**：空闲 <5%，AI生成时 ~30%

---

## 🐛 故障排查

### 问题 1：Supabase 配置错误（最常见）

**症状**：
```
Supabase 配置错误: Object
@supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

**原因**：使用了错误的构建方式，环境变量没有在构建时正确注入。

**解决方案**：
1. **必须使用 `docker-compose.build.local.yml` 构建**：
   ```bash
   # ❌ 错误方式
   docker build -t ai-travel-planner:latest .
   
   # ✅ 正确方式
   docker-compose -f docker-compose.build.local.yml build
   ```

2. **检查 `docker-compose.build.local.yml` 中的构建参数**：
   ```yaml
   build:
     args:
       NEXT_PUBLIC_SUPABASE_URL: your_actual_supabase_url  # 确保不是 your_xxx
       NEXT_PUBLIC_SUPABASE_ANON_KEY: your_actual_anon_key
   ```

3. **重新构建镜像**：
   ```bash
   # 删除旧镜像
   docker rmi ai-travel-planner:latest
   
   # 重新构建
   docker-compose -f docker-compose.build.local.yml build --no-cache
   
   # 启动
   docker-compose -f docker-compose.build.local.yml up -d
   ```

### 问题 2：容器启动失败

**症状**：`docker ps` 看不到容器

**排查**：
```bash
# 查看所有容器（包括停止的）
docker ps -a

# 查看容器日志
docker-compose -f docker-compose.build.local.yml logs
```

**常见原因**：
- 环境变量缺失或错误
- 端口 3000 已被占用
- Docker 资源不足

### 问题 3：应用无法访问

**症状**：浏览器显示"无法访问此网站"

**排查**：
```bash
# 检查容器状态
docker-compose -f docker-compose.build.local.yml ps

# 检查端口映射
docker port ai-travel-planner
```

**解决**：
- 确认端口映射：`-p 3000:3000`
- 检查防火墙设置
- 使用 `localhost` 或 `127.0.0.1` 访问

### 问题 4：功能不正常

**症状**：页面打开但功能异常

**排查**：
1. 检查环境变量是否正确设置
2. 查看浏览器控制台错误
3. 查看容器日志：
   ```bash
   docker-compose -f docker-compose.build.local.yml logs -f
   ```

**常见问题**：
- API Key 无效或过期
- Supabase 数据库未初始化
- 网络连接问题

---

## 🔒 安全注意事项

### ⚠️ 重要提醒

1. **不要将 API Key 硬编码到镜像中**
   - 使用环境变量传递
   - 不要提交 `.env` 到 Git

2. **生产环境建议**
   - 使用 Docker Secrets
   - 或使用 Kubernetes ConfigMap/Secrets
   - 定期轮换 API Key

3. **网络安全**
   - 使用 HTTPS（生产环境）
   - 配置 CORS 策略
   - 限制 API 访问来源

---

## 📝 环境变量完整列表

| 变量名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 公开 | ✅ | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公开 | ✅ | Supabase 匿名 Key |
| `DEEPSEEK_API_KEY` | 私密 | ✅ | DeepSeek AI Key |
| `NEXT_PUBLIC_XFYUN_APP_ID` | 公开 | ✅ | 科大讯飞 App ID |
| `NEXT_PUBLIC_XFYUN_API_KEY` | 公开 | ✅ | 科大讯飞 API Key |
| `NEXT_PUBLIC_XFYUN_API_SECRET` | 公开 | ✅ | 科大讯飞 API Secret |
| `NEXT_PUBLIC_AMAP_KEY` | 公开 | ✅ | 高德地图 JS API Key |
| `AMAP_WEB_SERVICE_KEY` | 私密 | ✅ | 高德地图 Web服务 Key |
| `NEXT_PUBLIC_AMAP_SECRET` | 公开 | ❌ | 高德地图安全密钥（可选）|

**说明**：
- `NEXT_PUBLIC_` 前缀：客户端可访问
- 无前缀：仅服务端可访问（更安全）

---

## 🎓 给评审老师

### 快速部署步骤

1. **拉取代码**：
   ```bash
   git clone <repository-url>
   cd AI-Travel-Planner
   ```

2. **配置环境变量**：
   - 编辑 `docker-compose.build.local.yml` 文件
   - 将所有 `your_xxx` 替换为您的真实 API Keys

3. **构建并启动应用**：
   ```bash
   # 构建镜像（重要：必须使用此文件）
   docker-compose -f docker-compose.build.local.yml build
   
   # 启动服务
   docker-compose -f docker-compose.build.local.yml up -d
   ```

4. **访问应用**：
   - http://localhost:3000

5. **查看日志**（如有问题）：
   ```bash
   docker-compose -f docker-compose.build.local.yml logs -f
   ```

### ⚠️ 重要提醒

**请务必使用 `docker-compose.build.local.yml` 来构建镜像**，否则会出现 Supabase 配置错误。这是因为 Next.js 的 `NEXT_PUBLIC_*` 环境变量必须在构建时注入，而不能在运行时注入。

### 使用预构建镜像的方式

如果您有 `ai-travel-planner-docker-image.tar` 文件：

1. **加载镜像**：
   ```bash
   docker load -i ai-travel-planner-docker-image.tar
   ```

2. **使用 docker-compose.prod.yml**：
   ```bash
   # 复制配置文件
   cp docker-compose.build.local.yml docker-compose.prod.yml
   
   # 编辑 docker-compose.prod.yml，移除 build 部分，只保留 image
   # 将所有环境变量移到 environment 部分
   
   # 启动
   docker-compose -f docker-compose.prod.yml up -d
   ```

### API Key 说明

本项目使用的 API Keys：

- ✅ **Supabase**：免费套餐即可
- ✅ **DeepSeek**：新用户有免费额度
- ✅ **科大讯飞**：个人开发者免费额度
- ✅ **高德地图**：个人开发者免费额度

所有 API 都有免费套餐，**无需付费**即可完整体验所有功能。

### 测试账号

**首次访问**：
1. 点击"注册"创建账号
2. 使用任意邮箱和密码
3. 登录后即可使用所有功能

---

## 🏗️ 从源码构建

### ⚠️ 重要：必须使用正确的构建方式

**本项目必须使用 `docker-compose.build.local.yml` 来构建**，不能使用普通的 `docker build` 命令。

### 正确的构建方式

```bash
# 1. 克隆仓库
git clone <repository-url>
cd AI-Travel-Planner

# 2. 编辑 docker-compose.build.local.yml
# 将所有 your_xxx 替换为真实的 API Keys

# 3. 构建镜像（正确方式）
docker-compose -f docker-compose.build.local.yml build

# 4. 启动容器
docker-compose -f docker-compose.build.local.yml up -d
```

### ❌ 错误的构建方式

```bash
# ❌ 这种方式会导致 Supabase 配置错误
docker build -t ai-travel-planner:latest .

# ❌ 这种方式也不推荐
docker run -d -p 3000:3000 --env-file .env ai-travel-planner:latest
```

### 为什么必须使用 docker-compose.build.local.yml？

1. **Next.js 构建时需要环境变量**：
   - `NEXT_PUBLIC_*` 变量必须在构建时注入
   - 运行时注入这些变量无效

2. **Dockerfile 中的 ARG 声明**：
   ```dockerfile
   ARG NEXT_PUBLIC_SUPABASE_URL
   ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
   # ... 其他 ARG
   
   ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
   ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **docker-compose.build.local.yml 中的构建参数**：
   ```yaml
   build:
     args:
       NEXT_PUBLIC_SUPABASE_URL: your_actual_url
       NEXT_PUBLIC_SUPABASE_ANON_KEY: your_actual_key
   ```

### 构建时间

- **首次构建**：5-10 分钟（下载依赖）
- **后续构建**：2-3 分钟（使用缓存）

---

## 📋 功能检查清单

部署后，请验证以下功能：

### 基础功能

- [ ] 用户注册和登录
- [ ] 创建旅行计划（表单/语音）
- [ ] 查看计划列表
- [ ] 查看计划详情

### 高级功能

- [ ] AI 行程生成（需要 DeepSeek Key）
- [ ] 语音输入（需要科大讯飞 Key）
- [ ] 地图导航（需要高德地图 Keys）
- [ ] 费用管理

### 如果某个功能不可用

1. 检查对应的 API Key 是否配置
2. 查看浏览器控制台错误
3. 查看容器日志

---

## 💾 数据持久化

### Supabase 云端存储

- ✅ 所有数据存储在 Supabase
- ✅ 容器重启不影响数据
- ✅ 支持多设备同步

### 无需本地数据卷

本项目使用云端数据库，不需要挂载本地卷。

---

## 🔄 更新部署

### 更新到新版本

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像（使用正确的方式）
docker-compose -f docker-compose.build.local.yml build --no-cache

# 3. 重启容器
docker-compose -f docker-compose.build.local.yml up -d
```

### 使用新的镜像文件更新

如果有新的 `ai-travel-planner-docker-image.tar` 文件：

```bash
# 1. 停止当前容器
docker-compose -f docker-compose.build.local.yml down

# 2. 删除旧镜像
docker rmi ai-travel-planner:latest

# 3. 加载新镜像
docker load -i ai-travel-planner-docker-image.tar

# 4. 启动容器
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 技术支持

### 常见问题

参考：`docs/` 目录下的各种文档

### 日志位置

```bash
# 容器日志（使用正确的 compose 文件）
docker-compose -f docker-compose.build.local.yml logs

# 实时日志
docker-compose -f docker-compose.build.local.yml logs -f --tail 100

# 特定服务日志
docker logs ai-travel-planner -f
```

### 进入容器调试

```bash
docker exec -it ai-travel-planner sh
```

---

## 🎯 生产环境建议

### 1. 使用反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 配置 HTTPS

使用 Let's Encrypt 或其他 SSL 证书。

### 3. 资源限制

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 4. 监控和日志

- 使用 Docker 日志驱动
- 集成 Prometheus/Grafana
- 设置告警

---

## 📄 相关文档

- `README.md` - 项目总览
- `docs/STAGE*.md` - 各阶段开发文档
- `env.example` - 环境变量示例
- `.dockerignore` - Docker 忽略文件

---

**部署完成后，请访问 http://localhost:3000 开始使用！** 🎉

如有问题，请查看容器日志或参考项目文档。

