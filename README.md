# AI-Travel-Planner

大语言模型辅助软件工程(2025)作业 - Web 版 AI 旅行规划师

## 项目简介

AI 旅行规划师是一款智能旅行规划应用，通过 AI 技术帮助用户自动生成个性化旅行路线，提供费用预算管理和地图导航功能。

### ✨ 项目亮点

- 🤖 **全语音交互**：从创建行程到记账，全程支持语音操作
- 🎯 **AI 智能生成**：DeepSeek 驱动的行程规划，错误自我修正机制
- 📊 **实时可视化**：地图导航 + 费用图表，数据一目了然
- 🔒 **安全可靠**：Supabase RLS 策略，用户数据完全隔离
- ⚡ **性能优化**：渐进式生成、批量处理、串行地理编码
- 🎨 **现代设计**：shadcn/ui + Tailwind CSS，美观易用

## 核心功能

- 🎤 **智能行程规划**：支持语音/文字输入，AI 自动生成个性化旅行路线，相对日期模式支持
- 💰 **费用预算管理**：智能预算分析、语音记账、费用统计图表与预算预警
- 👤 **用户管理系统**：注册登录、多份行程保存与云端同步、个人资料管理
- 🗺️ **地图导航集成**：高德地图可视化、景点标记、路线连接、方向指示
- 📊 **数据可视化**：行程时间轴、费用分类饼图、每日趋势图、预算进度条

## 技术栈

### 前端框架
- **Next.js 15**（App Router）- React 全栈框架
- **React 19** - 最新特性
- **TypeScript 5** - 类型安全
- **Tailwind CSS 3** - 样式框架
- **shadcn/ui** - 现代 UI 组件库
- **Recharts** - 数据可视化图表

### 后端服务
- **Next.js API Routes** - 后端 API 接口
- **Supabase** - 数据库（PostgreSQL）与用户认证

### 第三方服务集成
- **科大讯飞 Web API** - 语音识别功能
- **高德地图 JavaScript API** - 地图展示与导航
- **DeepSeek API** - 大语言模型（行程规划与费用预算）

### 开发工具
- **ESLint & Prettier** - 代码规范
- **Husky** - Git hooks
- **Docker** - 容器化部署

## 环境要求

### 开发环境
- **Node.js**: >= 18.17.0
- **npm**: >= 9.0.0 或 **pnpm**: >= 8.0.0
- **Git**: >= 2.0.0
- **Docker**: >= 24.0.0（用于部署）

### API Keys 配置
项目运行需要以下 API Keys（需自行申请）：

#### 必需的 API Keys
1. **Supabase**（用户认证和数据库）
   - 项目 URL
   - Anon Key

2. **DeepSeek**（AI 行程规划）
   - API Key

3. **科大讯飞**（语音识别）
   - App ID
   - API Key  
   - API Secret

4. **高德地图**（地图导航）
   - Web端（JS API）Key - 用于地图显示
   - Web服务 API Key - 用于地理编码

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/WCG2025/AI-Travel-Planner.git
cd AI-Travel-Planner
```

### 2. 安装依赖
```bash
npm install
# 或
pnpm install
```

### 3. 环境变量配置
复制 `.env.example` 文件为 `.env.local`：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的 API Keys：
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key
NEXT_PUBLIC_DEEPSEEK_API_ENDPOINT=https://api.deepseek.com

# 科大讯飞
NEXT_PUBLIC_XFYUN_APP_ID=your_xfyun_app_id
NEXT_PUBLIC_XFYUN_API_KEY=your_xfyun_api_key
NEXT_PUBLIC_XFYUN_API_SECRET=your_xfyun_api_secret

# 高德地图
NEXT_PUBLIC_AMAP_KEY=your_amap_js_api_key  # Web端（JS API）
AMAP_WEB_SERVICE_KEY=your_amap_web_service_key  # Web服务（地理编码）
NEXT_PUBLIC_AMAP_SECRET=your_amap_secret  # 可选
```

### 4. 运行开发服务器
```bash
npm run dev
# 或
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 5. 构建生产版本
```bash
npm run build
npm run start
```

## 🐳 Docker 部署（验收人员请看这里）

### ⚡ 5分钟快速开始

本项目提供已打包好的 Docker 镜像，开箱即用。

#### 前置要求

- ✅ 安装 Docker Desktop: https://www.docker.com/products/docker-desktop/
- ✅ 确保 Docker 正在运行

#### 步骤 1：导入镜像

```bash
docker load -i ai-travel-planner-docker-image.tar
```

**预计时间**：30秒

#### 步骤 2：创建环境变量文件

在镜像文件同目录创建 `.env` 文件：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
AMAP_WEB_SERVICE_KEY=your_amap_web_service_key
```

**说明**：
- 这两个 API Key 需自行申请（免费）
- 其他所有配置已内置在镜像中
- 详细申请步骤见下文

#### 步骤 3：启动应用

**方法 A - 使用 docker run**（简单直接）：

```bash
docker run -d --name ai-travel-planner -p 3000:3000 \
  -e DEEPSEEK_API_KEY=your_deepseek_api_key \
  -e AMAP_WEB_SERVICE_KEY=your_amap_web_service_key \
  ai-travel-planner:latest
```

**Windows PowerShell**：
```powershell
docker run -d --name ai-travel-planner -p 3000:3000 `
  -e DEEPSEEK_API_KEY=your_deepseek_api_key `
  -e AMAP_WEB_SERVICE_KEY=your_amap_web_service_key `
  ai-travel-planner:latest
```

**方法 B - 使用 docker-compose**（推荐）：

创建 `docker-compose.yml`：
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

启动：
```bash
docker-compose up -d
```

#### 步骤 4：访问应用

打开浏览器：**http://localhost:3000**

---

### 🔑 API Keys 快速申请

#### 1. DeepSeek（AI 行程规划）- 必需

**地址**：https://platform.deepseek.com/

**步骤**：注册 → 创建 API Key → 复制（格式：`sk-xxxxx`）

**免费额度**：新用户有免费 Token

#### 2. 高德地图 Web服务（地理编码）- 必需

**地址**：https://console.amap.com/

**步骤**：注册 → 创建应用 → 选择 **Web服务** 类型 → 获取 Key

**免费额度**：30万次/天

---

### 📋 功能验证清单

- [ ] 用户注册和登录
- [ ] AI 生成旅行计划（需 DeepSeek Key）
- [ ] 语音输入（需浏览器麦克风权限）
- [ ] 地图导航（景点标记、连线、箭头）
- [ ] 费用管理和统计

---

### 📚 详细文档

- 📖 **快速运行指南.md** - 给验收人员的完整指南 ⭐⭐⭐⭐⭐
- 📖 **BUILD_AND_RUN.md** - 完整的构建和运行指南
- 📖 **DELIVERY_PACKAGE.md** - 交付包说明
- 📖 **REBUILD_GUIDE.md** - 镜像重建指南

---

### 💡 重要说明

**已内置在镜像中**（无需配置）：
- ✅ Supabase（数据库）
- ✅ 科大讯飞（语音识别）
- ✅ 高德地图（地图显示）

**需要运行时提供**（仅2个）：
- 🔧 `DEEPSEEK_API_KEY` - AI 行程规划
- 🔧 `AMAP_WEB_SERVICE_KEY` - 地理编码服务

**镜像信息**：
- 文件大小：67 MB（压缩）
- 镜像大小：294 MB（运行时）
- 更新时间：2025-11-03

---

### 🐛 常见问题

**Q: 容器无法启动？**
```bash
docker logs ai-travel-planner  # 查看日志
```

**Q: AI 生成不工作？**
- 检查 DEEPSEEK_API_KEY 是否配置正确

**Q: 地图不显示？**
- 检查 AMAP_WEB_SERVICE_KEY 是否配置正确

**Q: 语音识别不工作？**
- 浏览器需要授权麦克风权限

---

### 🔄 从源码构建（开发者）

如果您想使用自己的 API Keys 重新构建镜像：

```bash
# 1. 编辑 docker-compose.build.yml
# 2. 重新构建
docker-compose -f docker-compose.build.yml up -d --build
# 3. 导出新镜像
docker save -o my-image.tar ai-travel-planner:latest
```

详细步骤参考：**REBUILD_GUIDE.md**

## 开发阶段规划

### 第一阶段：项目基础架构（Week 1）
- [x] 项目初始化与 Next.js 脚手架搭建
- [x] Tailwind CSS 与 UI 组件库配置
- [x] 项目目录结构规划
- [x] ESLint、Prettier 代码规范配置
- [x] Git 工作流与分支策略制定

### 第二阶段：用户认证系统 ✅
- [x] Supabase 项目创建与数据库设计
- [x] 用户注册功能开发
- [x] 用户登录/登出功能
- [x] 受保护路由中间件
- [x] 用户个人信息管理页面

### 第三阶段：语音输入功能 ✅
- [x] 科大讯飞 Web API 集成
- [x] 语音录制与实时识别
- [x] 语音转文字功能
- [x] 语音输入 UI 组件开发
- [x] 集成到计划创建和费用记账

### 第四阶段：AI 行程规划核心 ✅
- [x] DeepSeek API 接口封装
- [x] Prompt 工程与优化（错误反馈重试机制）
- [x] 渐进式行程生成算法
- [x] 行程数据结构设计
- [x] 行程列表与详情页面
- [x] 相对/绝对日期模式支持
- [x] 语音直接生成行程

### 第五阶段：费用预算管理 ✅
- [x] 费用预算数据模型
- [x] AI 费用解析功能（语音记账）
- [x] 费用记录与分类（7种类别）
- [x] 语音记账功能
- [x] 费用统计与可视化图表（饼图、柱状图）
- [x] 预算超支提醒（三级预警）

### 第六阶段：地图与导航集成 ✅
- [x] 高德地图 JavaScript API 集成
- [x] 高德 Web服务 API（地理编码）
- [x] 地图展示组件开发
- [x] 景点标记与信息窗口
- [x] 每日路线可视化（直线+箭头）
- [x] 服务端地理编码（准确可靠）

### 第七阶段：UI/UX 优化与完善（进行中）
- [x] 响应式设计全面适配
- [x] 加载状态与骨架屏优化
- [x] 动画与过渡效果
- [x] 深色模式支持
- [x] 无障碍访问优化
- [x] 用户引导与帮助提示

### 第八阶段：Docker 化与部署 ✅
- [x] Dockerfile 编写
- [x] Docker Compose 配置
- [x] 环境变量管理
- [x] 多阶段构建优化
- [x] 镜像导出与分发
- [x] 部署文档完善

### 第九阶段：文档与交付 ✅
- [x] 部署文档完善（BUILD_AND_RUN.md）
- [x] 用户使用手册（DELIVERY_PACKAGE.md）
- [x] 交付清单（交付清单.txt）
- [x] 代码注释补充
- [x] Docker 使用指南
- [x] GitHub 仓库完善

## 项目结构

```
AI-Travel-Planner/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── (auth)/            # 认证相关页面
│   │   ├── (dashboard)/       # 主应用页面
│   │   ├── api/               # API 路由
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   ├── ui/               # UI 基础组件
│   │   ├── features/         # 功能组件
│   │   └── layout/           # 布局组件
│   ├── lib/                   # 工具函数与配置
│   │   ├── supabase/         # Supabase 客户端
│   │   ├── ai/               # AI 服务封装
│   │   ├── voice/            # 语音识别服务
│   │   └── map/              # 地图服务
│   ├── hooks/                 # 自定义 React Hooks
│   ├── store/                 # Zustand 状态管理
│   ├── types/                 # TypeScript 类型定义
│   └── styles/                # 全局样式
├── public/                    # 静态资源
├── .env.example               # 环境变量示例
├── .env.local                 # 本地环境变量（不提交）
├── docker-compose.yml         # Docker Compose 配置
├── Dockerfile                 # Docker 镜像配置
├── next.config.js             # Next.js 配置
├── package.json               # 项目依赖
├── tailwind.config.ts         # Tailwind 配置
└── tsconfig.json              # TypeScript 配置
```

## 安全注意事项

⚠️ **重要提醒**：
- 切勿将任何 API Key 直接写入代码
- 使用环境变量管理敏感信息
- `.env.local` 文件已加入 `.gitignore`
- 在设置页面提供 API Key 输入窗口供用户配置

## 贡献指南

1. Fork 本仓库
2. 创建特性分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 开启 Pull Request

## 许可证

本项目仅用于教学目的。

## 联系方式

项目地址：[https://github.com/WCG2025/AI-Travel-Planner](https://github.com/WCG2025/AI-Travel-Planner)

---

## 🎉 项目进度

**已完成阶段**：1-9 阶段（全部完成）
**当前状态**：✅ 项目完成，可交付
**完成度**：100%

### 主要里程碑

| 阶段 | 功能 | 状态 | 完成时间 |
|------|------|------|----------|
| 阶段1 | 项目基础架构 | ✅ | Week 1 |
| 阶段2 | 用户认证系统 | ✅ | Week 1-2 |
| 阶段3 | 语音输入功能 | ✅ | Week 2 |
| 阶段4 | AI 行程规划 | ✅ | Week 2-3 |
| 阶段5 | 费用预算管理 | ✅ | Week 3 |
| 阶段6 | 地图导航集成 | ✅ | Week 3 |
| 阶段7 | UI/UX 优化 | ✅ | Week 3-4 |
| 阶段8 | Docker 部署 | ✅ | Week 4 |
| 阶段9 | 文档与交付 | ✅ | Week 4 |

### 📦 交付内容

- ✅ **GitHub 仓库**：完整源码 + 95+ 次提交历史
- ✅ **Docker 镜像**：ai-travel-planner-docker-image.tar（67MB）
- ✅ **完整文档**：BUILD_AND_RUN.md、DELIVERY_PACKAGE.md 等
- ✅ **环境配置**：env.example、docker-compose.yml
- ✅ **中文说明**：交付清单.txt

### 🎯 项目特色

- 🤖 **全链路 AI**：从行程规划到费用分类，AI 全程辅助
- 🎤 **语音交互**：创建计划、记录费用，全程语音操作
- 🗺️ **地图可视化**：景点标记、路线连接、方向指示
- 📊 **数据分析**：预算跟踪、费用统计、可视化图表
- 🐳 **一键部署**：Docker 容器化，5分钟启动应用

---