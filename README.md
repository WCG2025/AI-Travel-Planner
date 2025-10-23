# AI-Travel-Planner

大语言模型辅助软件工程(2025)作业 - Web 版 AI 旅行规划师

## 项目简介

AI 旅行规划师是一款智能旅行规划应用，通过 AI 技术帮助用户自动生成个性化旅行路线，提供费用预算管理和实时旅行辅助服务。

## 核心功能

- 🎤 **智能行程规划**：支持语音/文字输入，AI 自动生成个性化旅行路线
- 💰 **费用预算管理**：智能预算分析与旅行开销记录
- 👤 **用户管理系统**：注册登录、多份行程保存与云端同步
- 🗺️ **地图导航集成**：实时位置服务与导航功能
- 📊 **数据可视化**：直观的行程展示与费用统计

## 技术栈

### 前端框架
- **Next.js 14+**（App Router）- React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **Zustand** - 状态管理

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
- **GitHub Actions** - CI/CD 自动化

## 环境要求

### 开发环境
- **Node.js**: >= 18.17.0
- **npm**: >= 9.0.0 或 **pnpm**: >= 8.0.0
- **Git**: >= 2.0.0
- **Docker**: >= 24.0.0（用于部署）

### API Keys 配置
项目运行需要以下 API Keys（需自行申请）：
- 科大讯飞语音识别 API Key
- 高德地图 Web 服务 API Key
- DeepSeek API Key
- Supabase 项目 URL 和 Anon Key

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-username/AI-Travel-Planner.git
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
NEXT_PUBLIC_AMAP_KEY=your_amap_key
NEXT_PUBLIC_AMAP_SECRET=your_amap_secret
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

## Docker 部署

### 构建镜像
```bash
docker build -t ai-travel-planner:latest .
```

### 运行容器
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
  -e DEEPSEEK_API_KEY=your_deepseek_api_key \
  ai-travel-planner:latest
```

### 使用 Docker Compose
```bash
docker-compose up -d
```

## 开发阶段规划

### 第一阶段：项目基础架构（Week 1）
- [x] 项目初始化与 Next.js 脚手架搭建
- [ ] Tailwind CSS 与 UI 组件库配置
- [ ] 项目目录结构规划
- [ ] ESLint、Prettier 代码规范配置
- [ ] Git 工作流与分支策略制定

### 第二阶段：用户认证系统（Week 1-2）✅
- [x] Supabase 项目创建与数据库设计
- [x] 用户注册功能开发
- [x] 用户登录/登出功能
- [x] 受保护路由中间件
- [x] 用户个人信息管理页面

### 第三阶段：语音输入功能（Week 2）
- [ ] 科大讯飞 Web API 集成
- [ ] 语音录制与实时识别
- [ ] 语音转文字功能
- [ ] 语音输入 UI 组件开发
- [ ] 错误处理与降级方案

### 第四阶段：AI 行程规划核心（Week 2-3）
- [ ] DeepSeek API 接口封装
- [ ] Prompt 工程与优化
- [ ] 行程生成算法
- [ ] 行程数据结构设计
- [ ] 行程列表与详情页面
- [ ] 行程编辑与保存功能

### 第五阶段：地图与导航集成（Week 3-4）
- [ ] 高德地图 JavaScript API 集成
- [ ] 地图展示组件开发
- [ ] 景点标记与信息窗口
- [ ] 路线规划与导航
- [ ] 地图交互优化

### 第六阶段：费用预算管理（Week 4）
- [ ] 费用预算数据模型
- [ ] AI 预算分析功能
- [ ] 费用记录与分类
- [ ] 语音记账功能
- [ ] 费用统计与可视化图表
- [ ] 预算超支提醒

### 第七阶段：云端数据同步（Week 5）
- [ ] Supabase 实时订阅
- [ ] 行程数据云端同步
- [ ] 离线数据缓存策略
- [ ] 多设备数据一致性
- [ ] 冲突解决机制

### 第八阶段：UI/UX 优化（Week 5-6）
- [ ] 响应式设计适配
- [ ] 地图为主的交互界面
- [ ] 加载状态与骨架屏
- [ ] 动画与过渡效果
- [ ] 深色模式支持
- [ ] 无障碍访问优化

### 第九阶段：Docker 化与部署（Week 6）
- [ ] Dockerfile 编写
- [ ] Docker Compose 配置
- [ ] 环境变量管理
- [ ] GitHub Actions CI/CD 配置
- [ ] 阿里云镜像仓库推送
- [ ] 生产环境部署

### 第十阶段：测试与文档（Week 7）
- [ ] 单元测试编写
- [ ] 集成测试
- [ ] E2E 测试
- [ ] API 文档编写
- [ ] 用户使用手册
- [ ] 部署文档完善
- [ ] 代码注释补充

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

项目地址：[https://github.com/your-username/AI-Travel-Planner](https://github.com/your-username/AI-Travel-Planner)

---

**开发时间线**：预计 7 周完成
**当前状态**：第一阶段 - 项目基础架构搭建中