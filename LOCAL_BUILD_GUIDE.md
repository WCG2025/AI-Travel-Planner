# 本地构建 Docker 镜像指南

## 📦 完整构建和导出流程

### 第一步：构建镜像（10-15分钟）

```bash
# 在项目根目录执行
docker build -t ai-travel-planner:latest .
```

等待构建完成，看到：
```
✅ Successfully built xxx
✅ Successfully tagged ai-travel-planner:latest
```

---

### 第二步：测试镜像（可选但推荐）

```bash
# 创建 .env.local 文件（配置您的测试 API Keys）

# 运行测试
docker run -p 3000:3000 --env-file .env.local ai-travel-planner:latest

# 在另一个终端访问
curl http://localhost:3000/api/health

# 浏览器访问
# http://localhost:3000

# 测试完成后停止
Ctrl+C
```

---

### 第三步：导出镜像

```bash
# 导出为 .tar 文件
docker save -o ai-travel-planner-docker-image.tar ai-travel-planner:latest

# 查看文件大小
# Windows PowerShell:
(Get-Item ai-travel-planner-docker-image.tar).length / 1MB
# Linux/Mac:
ls -lh ai-travel-planner-docker-image.tar
```

**预期大小**：约 150-180MB

---

### 第四步：压缩文件（推荐）

```bash
# Windows (使用 7-Zip 或其他工具)
# 右键 → 7-Zip → 添加到压缩包 → 选择 gzip

# Linux/Mac
gzip ai-travel-planner-docker-image.tar
```

**压缩后大小**：约 50-70MB

---

### 第五步：准备交付文件

创建文件夹 `AI-Travel-Planner-Docker`：

```
AI-Travel-Planner-Docker/
├── ai-travel-planner-docker-image.tar.gz   # 压缩的 Docker 镜像
├── docker-compose.yml                       # Docker Compose 配置文件
├── env.example                              # 环境变量模板
├── BUILD_AND_RUN.md                         # 运行指南
└── README.txt                               # 简要说明
```

#### README.txt 内容：

```
AI Travel Planner - Docker 镜像包

快速开始：
1. 导入镜像：docker load -i ai-travel-planner-docker-image.tar.gz
2. 配置环境：复制 env.example 为 .env 并填写 API Keys
3. 启动应用：docker-compose up -d
4. 访问应用：http://localhost:3000

详细说明请查看 BUILD_AND_RUN.md
```

---

### 第六步：打包（用于提交）

```bash
# 压缩整个文件夹
zip -r AI-Travel-Planner-Docker.zip AI-Travel-Planner-Docker/

# 或使用 tar.gz
tar -czf AI-Travel-Planner-Docker.tar.gz AI-Travel-Planner-Docker/
```

---

## 🎯 交付清单

准备提交的文件：

- [ ] ✅ Docker 镜像文件（.tar.gz，约 50-70MB）
- [ ] ✅ docker-compose.yml（启动配置）
- [ ] ✅ env.example（环境变量模板）
- [ ] ✅ BUILD_AND_RUN.md（详细运行指南）
- [ ] ✅ README.txt（快速说明）

**可选**：
- [ ] 完整的项目源代码（GitHub 链接或 zip）
- [ ] 开发文档（docs/ 目录）

---

## ⚙️ 构建参数说明

### Dockerfile 说明

本项目使用**多阶段构建**优化镜像大小：

```
阶段 1 (deps):    安装依赖 → 生成 node_modules
阶段 2 (builder): 构建应用 → 生成 .next
阶段 3 (runner):  最小运行环境 → 只包含必需文件
```

**优势**：
- 最终镜像只有 ~150MB（不包含源码和 dev 依赖）
- 使用非 root 用户运行（更安全）
- 包含健康检查（自动监控）

---

## 📊 文件大小参考

| 文件 | 大小 | 说明 |
|------|------|------|
| Docker 镜像（.tar） | ~150MB | 未压缩 |
| Docker 镜像（.tar.gz） | ~60MB | gzip 压缩 |
| 完整代码（.zip） | ~5MB | 不含 node_modules |
| 提交包（压缩） | ~65MB | 镜像 + 配置 + 文档 |

---

## 🚀 一键构建脚本

**创建 `build.sh`（Linux/Mac）或 `build.bat`（Windows）**：

```bash
#!/bin/bash
# build.sh

echo "🏗️ 开始构建 Docker 镜像..."
docker build -t ai-travel-planner:latest .

echo "📦 导出镜像..."
docker save ai-travel-planner:latest | gzip > ai-travel-planner-docker-image.tar.gz

echo "✅ 完成！"
echo "文件: ai-travel-planner-docker-image.tar.gz"
ls -lh ai-travel-planner-docker-image.tar.gz
```

**使用**：
```bash
chmod +x build.sh
./build.sh
```

---

**按照本指南操作，即可生成可交付的 Docker 镜像文件！** 🐳📦

如有问题，请参考 BUILD_AND_RUN.md 获取详细的运行说明。

