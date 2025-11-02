# Windows 系统 Docker 安装和构建指南

## 📋 前置准备

### 第一步：安装 Docker Desktop

#### 1. 下载 Docker Desktop

访问：https://www.docker.com/products/docker-desktop/

点击 "Download for Windows" 下载安装程序。

#### 2. 系统要求

- Windows 10 64位：专业版、企业版或教育版（Build 19041或更高）
- 或 Windows 11
- 启用 WSL 2（Windows Subsystem for Linux 2）

#### 3. 安装步骤

1. 运行下载的 `Docker Desktop Installer.exe`
2. 按照安装向导操作
3. 确保勾选 "Use WSL 2 instead of Hyper-V"
4. 安装完成后重启电脑

#### 4. 启动 Docker Desktop

- 从开始菜单启动 "Docker Desktop"
- 等待 Docker 引擎启动（任务栏图标变绿）
- 看到 "Docker Desktop is running" 提示

#### 5. 验证安装

打开 PowerShell 或命令提示符，执行：

```powershell
docker --version
```

应该看到类似输出：
```
Docker version 24.0.x, build xxx
```

---

## 🏗️ 构建 Docker 镜像

### 方法 A：使用 PowerShell（推荐）

#### 1. 打开 PowerShell

- 按 `Win + X`
- 选择 "Windows PowerShell" 或 "终端"

#### 2. 进入项目目录

```powershell
cd C:\Users\96588\Desktop\AI-Travel-Planner
```

#### 3. 构建镜像

```powershell
docker build -t ai-travel-planner:latest .
```

**预计时间**：10-15 分钟

**成功标志**：
```
Successfully built xxx
Successfully tagged ai-travel-planner:latest
```

---

### 方法 B：使用构建脚本

#### 创建 `build.ps1` 文件（PowerShell 脚本）：

```powershell
# build.ps1
Write-Host "🏗️ 开始构建 Docker 镜像..." -ForegroundColor Cyan

docker build -t ai-travel-planner:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 构建成功！" -ForegroundColor Green
    docker images | Select-String "ai-travel-planner"
} else {
    Write-Host "❌ 构建失败！" -ForegroundColor Red
}
```

#### 运行脚本：

```powershell
# 允许执行脚本（仅首次需要）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 运行构建
.\build.ps1
```

---

## 📦 导出镜像文件

### 步骤 1：导出为 .tar 文件

```powershell
docker save -o ai-travel-planner-docker-image.tar ai-travel-planner:latest
```

### 步骤 2：压缩文件

#### 使用 7-Zip（推荐）

1. 下载并安装 7-Zip：https://www.7-zip.org/
2. 右键点击 `ai-travel-planner-docker-image.tar`
3. 选择 `7-Zip` → `添加到压缩包...`
4. 压缩格式选择 `gzip`
5. 点击 `确定`

#### 或使用 PowerShell（Windows 10+）

```powershell
# 使用内置压缩（较慢）
Compress-Archive -Path ai-travel-planner-docker-image.tar -DestinationPath ai-travel-planner-docker-image.zip
```

### 步骤 3：查看文件

```powershell
Get-ChildItem ai-travel-planner-docker-image.* | Format-Table Name, @{Label="Size (MB)"; Expression={[math]::Round($_.Length/1MB, 2)}}
```

应该看到：
```
Name                                    Size (MB)
----                                    ---------
ai-travel-planner-docker-image.tar      150.00
ai-travel-planner-docker-image.tar.gz   55.00
```

---

## 🧪 本地测试

### 步骤 1：创建测试环境变量

复制 `env.example` 为 `.env.local`，填入您的测试 API Keys。

### 步骤 2：使用 docker-compose 测试

创建 `docker-compose.test.yml`：

```yaml
version: '3.8'

services:
  app:
    image: ai-travel-planner:latest
    ports:
      - "3000:3000"
    env_file:
      - .env.local
```

启动测试：

```powershell
docker-compose -f docker-compose.test.yml up
```

### 步骤 3：访问测试

打开浏览器：http://localhost:3000

### 步骤 4：停止测试

```powershell
Ctrl+C

# 清理
docker-compose -f docker-compose.test.yml down
```

---

## 📝 准备交付

### 创建交付文件夹

```powershell
# 创建文件夹
New-Item -ItemType Directory -Path AI-Travel-Planner-Docker

# 复制文件
Copy-Item ai-travel-planner-docker-image.tar.gz AI-Travel-Planner-Docker/
Copy-Item docker-compose.yml AI-Travel-Planner-Docker/
Copy-Item env.example AI-Travel-Planner-Docker/
Copy-Item BUILD_AND_RUN.md AI-Travel-Planner-Docker/

# 创建简要说明
@"
AI Travel Planner - Docker 镜像包

快速开始：
1. 解压镜像文件（如果是 .tar.gz）
2. 导入镜像：docker load -i ai-travel-planner-docker-image.tar
3. 配置环境：复制 env.example 为 .env 并填写 API Keys
4. 启动应用：docker-compose up -d
5. 访问应用：http://localhost:3000

详细说明请查看 BUILD_AND_RUN.md

注意：所有 API Keys 需要自行申请（均有免费套餐）
详细申请步骤见 env.example 文件中的注释

项目地址：https://github.com/WCG2025/AI-Travel-Planner
"@ | Out-File -FilePath AI-Travel-Planner-Docker/README.txt -Encoding UTF8

# 压缩整个文件夹
Compress-Archive -Path AI-Travel-Planner-Docker -DestinationPath AI-Travel-Planner-Docker.zip
```

---

## ✅ 完成！

现在您有：
- ✅ `AI-Travel-Planner-Docker.zip` - 完整的交付包
  - Docker 镜像文件（压缩）
  - 配置文件
  - 运行文档

---

## 🐛 常见问题

### Q: Docker Desktop 启动失败？

**A**: 
1. 确保已启用 WSL 2
2. 更新 Windows 到最新版本
3. 在 BIOS 中启用虚拟化（Intel VT-x 或 AMD-V）

### Q: 构建很慢？

**A**: 
- 首次构建需要下载基础镜像和依赖
- 后续构建会使用缓存，更快
- 确保网络连接稳定

### Q: 构建失败？

**A**:
- 查看错误信息
- 确保 Docker Desktop 正在运行
- 尝试重启 Docker Desktop
- 清除缓存：`docker system prune -a`

---

**按照本指南操作，即可在 Windows 上成功构建 Docker 镜像！** 🐳💻

任何问题请参考文档或查看 Docker Desktop 的帮助文档。

