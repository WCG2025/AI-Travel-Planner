# 🔧 重新构建镜像指南

## 问题说明

如果您在使用导入的镜像时遇到 Supabase 错误：
```
Uncaught Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

这说明您导入的镜像是旧版本，没有包含 API Keys。

## 解决方案

### 步骤 1：停止并清理旧容器和镜像

```bash
# 停止所有容器
docker-compose down

# 删除旧镜像
docker rmi ai-travel-planner:latest
docker rmi ai-travel-planner:fixed

# 可选：清理所有未使用的镜像
docker image prune -a
```

### 步骤 2：重新构建镜像

```bash
# 使用包含真实 API Keys 的配置文件构建
docker-compose -f docker-compose.build.local.yml up -d --build
```

**说明**：
- `docker-compose.build.local.yml` 包含真实的 API Keys
- 这个文件**仅用于本地构建**，不会提交到 GitHub
- 构建过程大约需要 10-15 分钟

### 步骤 3：等待构建完成

您应该看到：
```
✓ Compiled successfully
Successfully built xxx
Successfully tagged ai-travel-planner:latest
Container ai-travel-planner  Started
```

### 步骤 4：验证应用

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs ai-travel-planner

# 访问应用
# http://localhost:3000
```

### 步骤 5：测试功能

1. 访问 http://localhost:3000
2. 点击"注册"或"登录"
3. **不应该再有 Supabase 错误**

### 步骤 6：导出新镜像（可选）

如果构建成功，您可以导出新镜像：

```bash
# 导出镜像
docker save -o ai-travel-planner-new.tar ai-travel-planner:latest

# 查看文件大小
ls -lh ai-travel-planner-new.tar
```

---

## 为什么需要重新构建？

### 环境变量类型

| 变量类型 | 何时需要 | 如何提供 |
|---------|---------|---------|
| `NEXT_PUBLIC_*` | **构建时** | `--build-arg` |
| 其他（服务端） | **运行时** | `.env` 文件 |

### Next.js 的工作原理

1. **构建时**：
   - Next.js 读取 `NEXT_PUBLIC_*` 环境变量
   - 将这些值**静态写入**到客户端 JavaScript 代码中
   - 例如：`process.env.NEXT_PUBLIC_SUPABASE_URL` → `"https://xxx.supabase.co"`

2. **运行时**：
   - 浏览器加载已编译的 JavaScript 文件
   - 文件中已包含环境变量的值
   - **无法**再从 `.env` 文件读取

### 示例

**构建前的代码**：
```typescript
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

**构建后（镜像中的代码）**：
```javascript
const url = "https://cyxwcrxrmonevvvafaet.supabase.co"; // 已替换
```

**如果构建时没有提供环境变量**：
```javascript
const url = undefined; // ❌ 错误！
```

---

## 快速参考

### 一键重建命令

```bash
# 完整流程
docker-compose down && \
docker rmi ai-travel-planner:latest && \
docker-compose -f docker-compose.build.local.yml up -d --build
```

### 验证镜像是否正确

```bash
# 测试配置 API
curl http://localhost:3000/api/config

# 应该返回您的 Supabase URL 和其他配置
```

---

## 文件说明

- `docker-compose.yml` - 标准运行配置（使用已存在的镜像）
- `docker-compose.build.yml` - 模板文件（占位符，用于 GitHub）
- `docker-compose.build.local.yml` - 本地构建配置（包含真实 API Keys）⚠️

**重要**：
- ⚠️ `docker-compose.build.local.yml` 已添加到 `.gitignore`
- ⚠️ 不要提交包含真实 API Keys 的文件到 GitHub

---

## 常见问题

### Q: 为什么 .env 文件不起作用？

**A**: `.env` 文件只能提供**服务端**环境变量（如 `DEEPSEEK_API_KEY`），无法提供**客户端**环境变量（`NEXT_PUBLIC_*`）。客户端变量必须在构建时注入。

### Q: 我可以在运行时更改 Supabase URL 吗？

**A**: 不可以。一旦镜像构建完成，Supabase URL 就已经写入代码中，无法在运行时更改。如果需要更改，必须重新构建镜像。

### Q: 构建需要多长时间？

**A**: 首次构建约 10-15 分钟（需要下载 Node.js 镜像和安装依赖）。后续构建如果有缓存会更快（2-3 分钟）。

---

**祝构建顺利！** 🐳✨

如果遇到问题，请查看容器日志：`docker logs ai-travel-planner`

