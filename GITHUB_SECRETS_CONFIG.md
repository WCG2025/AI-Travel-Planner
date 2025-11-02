# GitHub Secrets 配置指南

## 🔑 需要配置的 Secrets

根据您的阿里云信息，请在 GitHub 仓库中添加以下 Secrets：

---

## 📋 配置步骤

### 第一步：进入 GitHub 仓库设置

1. 打开 GitHub 仓库页面
2. 点击 `Settings`（设置）
3. 左侧菜单选择 `Secrets and variables` → `Actions`
4. 点击 `New repository secret` 按钮

---

### 第二步：添加 Secret 1

**Name（名称）**：
```
ALIYUN_REGISTRY_USERNAME
```

**Secret（值）**：
```
南京大学张逸飞
```

点击 `Add secret` 保存

---

### 第三步：添加 Secret 2

**Name（名称）**：
```
ALIYUN_REGISTRY_PASSWORD
```

**Secret（值）**：
```
[您设置的 Registry 登录密码]
```

⚠️ 这是您在阿里云容器镜像服务中设置的密码，不是阿里云账号密码！

点击 `Add secret` 保存

---

### 第四步：验证配置

配置完成后，您应该在 Secrets 页面看到：

```
✅ ALIYUN_REGISTRY_USERNAME
✅ ALIYUN_REGISTRY_PASSWORD
```

**不需要添加** `ALIYUN_NAMESPACE`，因为我们直接在 workflow 中硬编码了完整路径。

---

## ✅ 配置完成！

现在您可以推送代码触发自动构建：

```bash
git push origin main
```

### 查看构建进度

1. 进入 GitHub 仓库
2. 点击 `Actions` 标签
3. 查看 "Build and Push Docker Image" workflow 的运行状态

### 构建成功后

镜像会被推送到：
```
crpi-k4lj39suds93xcmi.cn-hangzhou.personal.cr.aliyuncs.com/syouhouu-ai-travel-planner/ai-travel-planner:latest
```

---

## 🧪 验证镜像

### 登录并拉取

```bash
# 登录阿里云镜像仓库
docker login --username=南京大学张逸飞 crpi-k4lj39suds93xcmi.cn-hangzhou.personal.cr.aliyuncs.com

# 输入密码（您设置的 Registry 密码）

# 拉取镜像
docker pull crpi-k4lj39suds93xcmi.cn-hangzhou.personal.cr.aliyuncs.com/syouhouu-ai-travel-planner/ai-travel-planner:latest

# 运行测试
docker run -p 3000:3000 --env-file .env crpi-k4lj39suds93xcmi.cn-hangzhou.personal.cr.aliyuncs.com/syouhouu-ai-travel-planner/ai-travel-planner:latest
```

---

## 📝 给评审老师的说明

### 镜像地址

```
crpi-k4lj39suds93xcmi.cn-hangzhou.personal.cr.aliyuncs.com/syouhouu-ai-travel-planner/ai-travel-planner:latest
```

### 拉取命令

```bash
docker pull crpi-k4lj39suds93xcmi.cn-hangzhou.personal.cr.aliyuncs.com/syouhouu-ai-travel-planner/ai-travel-planner:latest
```

### 运行要求

- 需要配置环境变量（`.env` 文件）
- 所有 API Keys 需自行申请（免费）
- 详细步骤参见 `DOCKER_DEPLOYMENT.md`

---

**配置完成！准备推送代码触发构建！** 🚀

