# Supabase 环境变量错误修复指南

## 🚨 当前问题

浏览器控制台报错：
```
Uncaught Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

## 🔍 问题原因

Docker 镜像在构建时没有环境变量，而 Next.js 的 `NEXT_PUBLIC_` 环境变量需要在构建时就可用。

## ✅ 解决方案

### 方案 1：重新构建镜像（推荐）

当网络恢复后，使用以下命令重新构建：

```powershell
# 使用构建参数
docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://cyxwcrxrmonevvvafaet.supabase.co" `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eHdjcnhybW9uZXZ2dmFmYWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMDI2NTAsImV4cCI6MjA3Njc3ODY1MH0.uOsrfc1Z9uZ5EYT3DLTjVKCazFILemh7xSWJx9calk8" `
  --build-arg NEXT_PUBLIC_XFYUN_APP_ID="850876d4" `
  --build-arg NEXT_PUBLIC_XFYUN_API_KEY="81c297deba83bc8ef7c22073bca93aec" `
  --build-arg NEXT_PUBLIC_XFYUN_API_SECRET="NTNmYmJjZDVkOTJiMWM4YzVlYzZiMDRh" `
  --build-arg NEXT_PUBLIC_AMAP_KEY="1e25b66013ee7ab6ac4de0b6c81940d6" `
  --build-arg NEXT_PUBLIC_AMAP_SECRET="31892577c1335fcb8d12648c8af2aff9" `
  -t ai-travel-planner:latest .
```

### 方案 2：使用 docker-compose（更简单）

创建 `docker-compose.build.yml`：

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SUPABASE_URL: "https://cyxwcrxrmonevvvafaet.supabase.co"
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eHdjcnhybW9uZXZ2dmFmYWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMDI2NTAsImV4cCI6MjA3Njc3ODY1MH0.uOsrfc1Z9uZ5EYT3DLTjVKCazFILemh7xSWJx9calk8"
        NEXT_PUBLIC_XFYUN_APP_ID: "850876d4"
        NEXT_PUBLIC_XFYUN_API_KEY: "81c297deba83bc8ef7c22073bca93aec"
        NEXT_PUBLIC_XFYUN_API_SECRET: "NTNmYmJjZDVkOTJiMWM4YzVlYzZiMDRh"
        NEXT_PUBLIC_AMAP_KEY: "1e25b66013ee7ab6ac4de0b6c81940d6"
        NEXT_PUBLIC_AMAP_SECRET: "31892577c1335fcb8d12648c8af2aff9"
    image: ai-travel-planner:fixed
    container_name: ai-travel-planner
    ports:
      - "3000:3000"
    environment:
      - DEEPSEEK_API_KEY=sk-969745a2242c498f9a6c459634f0389a
      - AMAP_WEB_SERVICE_KEY=24c835245683a29acd0559fd571a5267
    restart: unless-stopped
```

然后运行：

```powershell
# 构建和启动
docker-compose -f docker-compose.build.yml up -d --build

# 查看日志
docker-compose -f docker-compose.build.yml logs -f
```

### 方案 3：临时解决方案（当前可用）

如果无法重新构建，可以修改代码来处理这种情况：

1. **修改 Supabase 客户端**（已完成）
2. **使用服务端 API 提供配置**（已完成）
3. **在前端延迟初始化 Supabase**

## 🧪 验证修复

构建完成后：

1. **启动容器**：
   ```powershell
   docker run -d --name ai-travel-planner -p 3000:3000 `
     -e DEEPSEEK_API_KEY="sk-969745a2242c498f9a6c459634f0389a" `
     -e AMAP_WEB_SERVICE_KEY="24c835245683a29acd0559fd571a5267" `
     ai-travel-planner:latest
   ```

2. **访问应用**：http://localhost:3000

3. **检查控制台**：不应该再有 Supabase 错误

4. **验证环境变量**：
   ```javascript
   // 在浏览器控制台执行
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
   console.log('Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
   ```

## 📋 网络问题解决

如果遇到 Docker 网络问题：

### 1. 更换 Docker 镜像源

```powershell
# 创建或编辑 Docker daemon 配置
# 文件位置：C:\Users\<用户名>\.docker\daemon.json

{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```

重启 Docker Desktop。

### 2. 使用代理

如果有代理，在 Docker Desktop 设置中配置。

### 3. 离线构建

如果网络持续有问题，可以：

1. 在有网络的环境下构建
2. 导出镜像：`docker save -o image.tar ai-travel-planner:latest`
3. 在目标环境导入：`docker load -i image.tar`

## 🎯 最终交付

修复后的镜像应该包含：

1. ✅ 构建时注入的环境变量
2. ✅ 正常工作的 Supabase 客户端
3. ✅ 完整的应用功能

导出命令：

```powershell
# 导出镜像
docker save -o ai-travel-planner-fixed.tar ai-travel-planner:latest

# 压缩
gzip ai-travel-planner-fixed.tar
# 或使用 7-Zip 压缩为 .tar.gz
```

## 📝 更新文档

需要更新以下文档：

1. **BUILD_AND_RUN.md** - 添加构建参数说明
2. **LOCAL_BUILD_GUIDE.md** - 更新构建命令
3. **docker-compose.yml** - 添加构建配置示例

## ⚠️ 重要提醒

1. **API Keys 安全**：
   - 构建参数中的 API Keys 会被嵌入到镜像中
   - 这是 Next.js `NEXT_PUBLIC_` 变量的正常行为
   - 客户端代码本来就可以访问这些值

2. **生产环境**：
   - 为不同环境创建不同的镜像
   - 使用 CI/CD 自动化构建流程
   - 定期轮换 API Keys

3. **测试验证**：
   - 确保所有功能正常工作
   - 验证地图加载
   - 测试 AI 生成功能
   - 检查语音识别

修复完成后，应用将完全正常运行！🎉
