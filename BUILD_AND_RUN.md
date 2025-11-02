# AI Travel Planner - Docker 镜像构建和运行指南

## 🎯 概述

本文档说明如何构建 Docker 镜像、导出镜像文件，以及如何运行该镜像。

**适用对象**：
- 项目开发者（构建镜像）
- 评审老师（运行镜像）

---

## 🏗️ 第一部分：构建和导出镜像（开发者操作）

### 前置要求

- ✅ 已安装 Docker Desktop（Windows/Mac）或 Docker Engine（Linux）
- ✅ Docker 正在运行

### 步骤 1：构建镜像

打开终端（或 PowerShell），在项目根目录执行：

```bash
docker build -t ai-travel-planner:latest .
```

**说明**：
- `-t ai-travel-planner:latest` - 镜像名称和标签
- `.` - 使用当前目录的 Dockerfile

**预计时间**：首次构建 10-15 分钟

**成功标志**：
```
Successfully built xxx
Successfully tagged ai-travel-planner:latest
```

---

### 步骤 2：验证镜像

```bash
docker images | grep ai-travel-planner
```

应该看到：
```
ai-travel-planner   latest    xxx   2 minutes ago   150MB
```

---

### 步骤 3：导出镜像为文件

```bash
docker save -o ai-travel-planner-docker-image.tar ai-travel-planner:latest
```

**说明**：
- `-o ai-travel-planner-docker-image.tar` - 输出文件名
- `ai-travel-planner:latest` - 要导出的镜像

**文件大小**：约 150MB（压缩后）

**可选：压缩文件（减小体积）**

```bash
# 使用 gzip 压缩
gzip ai-travel-planner-docker-image.tar

# 生成文件：ai-travel-planner-docker-image.tar.gz
# 大小：约 50-60MB
```

---

### 步骤 4：准备交付

将以下文件打包：

```
提交包/
├── ai-travel-planner-docker-image.tar      # Docker 镜像文件
├── docker-compose.yml                       # Docker Compose 配置
├── env.example                              # 环境变量模板
└── DOCKER_RUN_GUIDE.md                      # 运行指南（见下文）
```

**或压缩后**：
```
提交包/
├── ai-travel-planner-docker-image.tar.gz   # 压缩的镜像（推荐）
├── docker-compose.yml
├── env.example
└── DOCKER_RUN_GUIDE.md
```

---

## 📦 第二部分：导入和运行镜像（评审老师操作）

### 前置要求

- ✅ 已安装 Docker Desktop 或 Docker Engine
- ✅ Docker 正在运行

### 快速开始

#### 步骤 1：导入镜像

**如果是 .tar 文件**：
```bash
docker load -i ai-travel-planner-docker-image.tar
```

**如果是 .tar.gz 文件**：
```bash
# Windows PowerShell
docker load -i (gzip -d -c ai-travel-planner-docker-image.tar.gz)

# Linux/Mac
gunzip -c ai-travel-planner-docker-image.tar.gz | docker load
```

**成功标志**：
```
Loaded image: ai-travel-planner:latest
```

**⚠️ 重要说明**：
- 本镜像已在构建时包含所有必需的环境变量
- 无需额外配置 `NEXT_PUBLIC_` 前缀的环境变量
- 只需配置服务端环境变量（见步骤 3）

---

#### 步骤 2：验证镜像

```bash
docker images
```

应该看到：
```
REPOSITORY            TAG       IMAGE ID       SIZE
ai-travel-planner     latest    xxx            150MB
```

---

#### 步骤 3：配置环境变量

**创建 `.env` 文件**（与 docker-compose.yml 同目录）：

```env
# 服务端环境变量（必需）
DEEPSEEK_API_KEY=your_deepseek_key
AMAP_WEB_SERVICE_KEY=your_web_service_key

# 可选：如果需要覆盖内置配置
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**📝 说明**：
- **客户端环境变量**（`NEXT_PUBLIC_*`）已内置在镜像中
- **服务端环境变量**需要在运行时提供
- 如需使用不同的 Supabase 项目，可以覆盖内置配置

**⚠️ 重要**：
- `DEEPSEEK_API_KEY` 和 `AMAP_WEB_SERVICE_KEY` 必须填写
- 请使用您自己申请的免费 API Key
- 详细申请步骤见下文"API Keys 申请指南"

---

#### 步骤 4A：使用 docker-compose 运行（推荐）

**创建 `docker-compose.yml` 文件**：

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
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**启动应用**：

```bash
# 启动（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止应用
docker-compose down
```

---

#### 步骤 4B：直接使用 Docker 命令运行

```bash
docker run -d \
  --name ai-travel-planner \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  ai-travel-planner:latest
```

**查看日志**：
```bash
docker logs -f ai-travel-planner
```

**停止容器**：
```bash
docker stop ai-travel-planner
docker rm ai-travel-planner
```

---

### 步骤 5：访问应用

打开浏览器访问：
```
http://localhost:3000
```

应该看到登录页面。

---

## 🧪 验证应用运行正常

### 1. 检查容器状态

```bash
docker ps
```

应该看到：
```
CONTAINER ID   IMAGE                   STATUS         PORTS
xxx            ai-travel-planner:latest  Up 2 minutes   0.0.0.0:3000->3000/tcp
```

### 2. 检查健康状态

```bash
curl http://localhost:3000/api/health
```

或在浏览器访问：`http://localhost:3000/api/health`

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T...",
  "uptime": 120.5
}
```

### 3. 测试功能

1. **注册账号**
   - 访问 http://localhost:3000
   - 点击"注册"
   - 填写邮箱和密码
   - 成功注册

2. **登录**
   - 使用刚注册的账号登录
   - 进入 Dashboard

3. **创建行程**
   - 点击"创建新计划"
   - 使用表单或语音输入
   - 等待 AI 生成（约 30 秒）
   - 查看行程详情

4. **查看地图**
   - 切换到"地图导航"标签页
   - 等待加载（约 5 秒）
   - 看到景点标记和连线

5. **记录费用**
   - 切换到"费用管理"标签页
   - 添加费用（手动或语音）
   - 查看统计图表

---

## 🔑 API Keys 申请指南

所有 API 都提供免费套餐，无需付费：

### 1. Supabase（数据库）

1. 访问 https://supabase.com/
2. 注册并创建项目
3. 在项目设置 → API 中获取 URL 和 Key

**免费额度**：500MB 数据库

### 2. DeepSeek（AI）

1. 访问 https://platform.deepseek.com/
2. 注册账号
3. 创建 API Key

**免费额度**：新用户有免费 Token

### 3. 科大讯飞（语音）

1. 访问 https://console.xfyun.cn/
2. 注册并创建应用
3. 选择"语音听写（流式版）WebAPI"
4. 获取 App ID、API Key、API Secret

**免费额度**：500万字符/年

### 4. 高德地图（地图）

1. 访问 https://console.amap.com/
2. 注册并创建应用
3. **添加两个 Key**：
   - **Web端（JS API）** - 用于地图显示
   - **Web服务** - 用于地理编码

**免费额度**：
- JS API：不限量
- Web服务：30万次/天

---

## 🐛 故障排查

### 问题 1：容器启动失败

```bash
# 查看日志
docker logs ai-travel-planner

# 常见原因：
# - 端口 3000 被占用
# - 环境变量未配置
# - API Key 无效
```

### 问题 2：功能不可用

**症状**：某个功能报错

**检查**：
1. 确认对应的 API Key 已配置
2. 查看浏览器控制台错误
3. 查看 Docker 容器日志

**常见问题**：
- AI 生成失败 → 检查 DEEPSEEK_API_KEY
- 语音识别失败 → 检查科大讯飞配置
- 地图不显示 → 检查高德地图 Keys
- 数据无法保存 → 检查 Supabase 配置

### 问题 3：页面打不开

```bash
# 检查容器是否运行
docker ps

# 检查端口映射
docker port ai-travel-planner

# 确认访问 localhost:3000
```

---

## 📊 系统要求

### 最低配置

- CPU：2 核
- 内存：2GB
- 磁盘：2GB 可用空间
- 端口：3000 可用

### 推荐配置

- CPU：4 核
- 内存：4GB
- 磁盘：5GB 可用空间
- 网络：稳定的互联网连接（访问 API）

---

## 📝 技术说明

### 镜像信息

- **基础镜像**：Node.js 18 Alpine
- **最终大小**：~150MB
- **架构**：linux/amd64
- **端口**：3000
- **健康检查**：内置（/api/health）

### 环境变量

| 变量 | 类型 | 必需 | 说明 |
|------|------|------|------|
| NEXT_PUBLIC_SUPABASE_URL | 公开 | ✅ | Supabase URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | 公开 | ✅ | Supabase Key |
| DEEPSEEK_API_KEY | 私密 | ✅ | DeepSeek Key |
| NEXT_PUBLIC_XFYUN_APP_ID | 公开 | ✅ | 讯飞 App ID |
| NEXT_PUBLIC_XFYUN_API_KEY | 公开 | ✅ | 讯飞 Key |
| NEXT_PUBLIC_XFYUN_API_SECRET | 公开 | ✅ | 讯飞 Secret |
| NEXT_PUBLIC_AMAP_KEY | 公开 | ✅ | 高德 JS Key |
| AMAP_WEB_SERVICE_KEY | 私密 | ✅ | 高德 Web服务 Key |

---

## 🎓 给评审老师

### 最简单的运行步骤

1. **获取文件**
   - `ai-travel-planner-docker-image.tar.gz`（压缩镜像）
   - `docker-compose.yml`（配置文件）
   - `env.example`（环境变量模板）

2. **导入镜像**
   ```bash
   # 解压并导入
   gunzip -c ai-travel-planner-docker-image.tar.gz | docker load
   
   # 或如果是 .tar 文件
   docker load -i ai-travel-planner-docker-image.tar
   ```

3. **配置环境**
   - 复制 `env.example` 为 `.env`
   - 填入您的 API Keys（免费申请）

4. **启动应用**
   ```bash
   docker-compose up -d
   ```

5. **访问**
   ```
   http://localhost:3000
   ```

6. **测试**
   - 注册账号
   - 创建旅行计划
   - 查看地图
   - 记录费用

7. **停止**
   ```bash
   docker-compose down
   ```

---

## 📋 常见问题

### Q: 是否需要数据库？

**A**: 不需要本地数据库。本项目使用 Supabase 云数据库，只需在 `.env` 中配置 Supabase URL 和 Key。

### Q: API Keys 是否包含在镜像中？

**A**: **不包含**。出于安全考虑，所有 API Keys 都需要在运行时通过环境变量提供。请参考 `env.example` 申请您自己的免费 API Keys。

### Q: 镜像是否支持 ARM 架构（如 Apple Silicon）？

**A**: 当前镜像为 linux/amd64。在 Apple Silicon (M1/M2) Mac 上运行时，Docker Desktop 会自动模拟，可能稍慢但可用。

### Q: 如何更新到新版本？

**A**: 
1. 获取新的镜像文件
2. 删除旧镜像：`docker rmi ai-travel-planner:latest`
3. 导入新镜像：`docker load -i ...`
4. 重启容器：`docker-compose up -d`

---

## 📞 技术支持

如有问题，请查看：
- 项目 README.md
- docs/ 目录下的详细文档
- GitHub Issues（如有公开仓库）

---

## 🔒 安全提示

1. **不要分享包含真实 API Keys 的 .env 文件**
2. **定期轮换 API Keys**
3. **生产环境建议使用 HTTPS**
4. **限制 API Keys 的访问来源**

---

## ✅ 验收清单

运行成功后，请验证以下功能：

### 基础功能
- [ ] 用户注册和登录
- [ ] 创建旅行计划（表单/语音）
- [ ] 查看计划列表和详情

### 高级功能  
- [ ] AI 行程生成
- [ ] 语音输入（浏览器需授权麦克风）
- [ ] 地图导航（显示景点和路线）
- [ ] 费用管理和统计

### 性能
- [ ] 首页加载 < 3秒
- [ ] AI 生成行程 < 1分钟
- [ ] 地图加载 < 10秒

---

**祝使用愉快！** 🎉🗺️✈️

如有任何问题，请查看完整的 README.md 或项目文档。

