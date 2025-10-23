# 部署指南

## 本地部署

### 1. 环境准备
确保已安装：
- Node.js >= 18.17.0
- npm >= 9.0.0
- Docker >= 24.0.0（可选）

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp env.example .env.local

# 编辑 .env.local 文件，填入你的 API Keys
```

### 3. 安装依赖
```bash
npm install
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## Docker 部署

### 方式一：使用 Docker Compose（推荐）

1. 确保 `.env.local` 文件已配置
2. 运行：
```bash
docker-compose up -d
```

3. 查看日志：
```bash
docker-compose logs -f
```

4. 停止服务：
```bash
docker-compose down
```

### 方式二：手动构建 Docker 镜像

1. 构建镜像：
```bash
docker build -t ai-travel-planner:latest .
```

2. 运行容器：
```bash
docker run -d \
  --name ai-travel-planner \
  -p 3000:3000 \
  --env-file .env.local \
  ai-travel-planner:latest
```

3. 查看日志：
```bash
docker logs -f ai-travel-planner
```

4. 停止容器：
```bash
docker stop ai-travel-planner
docker rm ai-travel-planner
```

## 阿里云镜像仓库部署

### 1. 登录阿里云镜像仓库
```bash
docker login --username=你的用户名 registry.cn-hangzhou.aliyuncs.com
```

### 2. 构建并标记镜像
```bash
docker build -t ai-travel-planner:v1.0.0 .
docker tag ai-travel-planner:v1.0.0 registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:v1.0.0
```

### 3. 推送镜像
```bash
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:v1.0.0
```

### 4. 从镜像仓库拉取并运行
```bash
docker pull registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:v1.0.0
docker run -d -p 3000:3000 --env-file .env.local \
  registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:v1.0.0
```

## GitHub Actions 自动化部署

创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Aliyun Container Registry
      uses: docker/login-action@v2
      with:
        registry: registry.cn-hangzhou.aliyuncs.com
        username: ${{ secrets.ALIYUN_USERNAME }}
        password: ${{ secrets.ALIYUN_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest
          registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:${{ github.sha }}
```

### 配置 GitHub Secrets
在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加：
- `ALIYUN_USERNAME`: 阿里云镜像仓库用户名
- `ALIYUN_PASSWORD`: 阿里云镜像仓库密码

## 生产环境优化建议

### 1. 性能优化
- 启用 Next.js 图片优化
- 配置 CDN 加速静态资源
- 使用 Redis 缓存
- 启用 Gzip 压缩

### 2. 安全配置
- 使用 HTTPS
- 配置 CORS 策略
- 设置安全响应头
- 定期更新依赖

### 3. 监控和日志
- 配置应用性能监控（APM）
- 集成错误追踪（如 Sentry）
- 设置日志收集系统
- 配置健康检查端点

### 4. 扩展性
- 使用负载均衡
- 配置自动扩缩容
- 数据库读写分离
- 使用消息队列处理异步任务

## 常见问题

### 1. 构建失败
- 检查 Node.js 版本
- 清除缓存：`rm -rf .next node_modules && npm install`
- 检查依赖版本兼容性

### 2. 容器无法启动
- 检查端口占用
- 查看容器日志
- 验证环境变量配置

### 3. API 调用失败
- 确认 API Keys 正确配置
- 检查网络连接
- 查看 API 配额是否用尽

## 验收标准

部署成功后，请验证以下功能：
- [ ] 网站可正常访问
- [ ] 用户注册登录功能正常
- [ ] 语音识别功能可用
- [ ] 地图显示正常
- [ ] AI 行程生成功能正常
- [ ] 数据持久化正常

## 提交说明

根据作业要求，提交内容应包括：
1. GitHub 仓库地址
2. Docker 镜像下载地址
3. README 文档（包含运行说明）
4. API Keys（保证 3 个月内可用）
5. 详细的 Git 提交记录

请将以上内容整理成 PDF 文件提交。

