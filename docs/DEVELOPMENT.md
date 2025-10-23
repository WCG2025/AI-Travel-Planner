# 开发指南

## 项目已完成的配置

### ✅ 第一阶段完成项
- [x] Next.js 14+ 项目初始化
- [x] TypeScript 配置
- [x] Tailwind CSS 配置
- [x] ESLint 配置
- [x] Prettier 代码格式化配置
- [x] Supabase 依赖安装
- [x] Zustand 状态管理安装
- [x] shadcn/ui 组件库初始化
- [x] 项目目录结构创建
- [x] 环境变量配置文件（env.example）

## 已安装的核心依赖

### 生产依赖
- `next` - Next.js 框架
- `react` & `react-dom` - React 库
- `typescript` - TypeScript
- `@supabase/supabase-js` - Supabase 客户端
- `@supabase/ssr` - Supabase SSR 支持
- `zustand` - 状态管理
- `axios` - HTTP 客户端
- `date-fns` - 日期处理
- `lucide-react` - 图标库
- `tailwindcss` - CSS 框架
- `class-variance-authority` - 样式变体管理
- `clsx` & `tailwind-merge` - 类名合并工具

### 开发依赖
- `eslint` - 代码检查
- `prettier` - 代码格式化
- `prettier-plugin-tailwindcss` - Tailwind CSS 排序

## 项目目录结构

```
AI-Travel-Planner/
├── docs/                      # 文档目录
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── globals.css       # 全局样式
│   │   ├── layout.tsx        # 根布局
│   │   └── page.tsx          # 首页
│   ├── components/           # React 组件
│   │   ├── ui/              # shadcn/ui 组件
│   │   ├── features/        # 功能组件
│   │   └── layout/          # 布局组件
│   ├── lib/                  # 工具库
│   │   ├── supabase/        # Supabase 配置
│   │   ├── ai/              # AI 服务
│   │   ├── voice/           # 语音识别
│   │   ├── map/             # 地图服务
│   │   └── utils.ts         # 通用工具函数
│   ├── hooks/                # 自定义 Hooks
│   ├── store/                # Zustand Store
│   └── types/                # TypeScript 类型
├── public/                    # 静态资源
├── components.json            # shadcn/ui 配置
├── env.example                # 环境变量示例
├── eslint.config.mjs          # ESLint 配置
├── next.config.ts             # Next.js 配置
├── package.json               # 项目依赖
├── postcss.config.mjs         # PostCSS 配置
├── prettier.config.js         # Prettier 配置
├── tailwind.config.ts         # Tailwind 配置
└── tsconfig.json              # TypeScript 配置
```

## 下一步开发计划

### 第二阶段：用户认证系统
1. 创建 Supabase 项目
2. 设计数据库表结构
3. 实现用户注册功能
4. 实现用户登录/登出
5. 创建受保护的路由中间件
6. 开发用户个人信息管理页面

### 建议的开发流程
1. 先在 Supabase 官网创建项目
2. 获取项目的 URL 和 anon key
3. 复制 `env.example` 为 `.env.local` 并填入配置
4. 开始开发认证相关功能

## 常用命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 代码格式化
npx prettier --write .

# 添加 shadcn/ui 组件
npx shadcn@latest add [component-name]
```

## 注意事项

1. **环境变量管理**
   - 使用 `env.example` 作为模板
   - 不要提交 `.env.local` 到 Git
   - API Keys 必须保密

2. **代码规范**
   - 提交前运行 `npm run lint`
   - 使用 Prettier 格式化代码
   - 遵循 TypeScript 类型定义

3. **组件开发**
   - UI 组件放在 `src/components/ui/`
   - 业务组件放在 `src/components/features/`
   - 布局组件放在 `src/components/layout/`

4. **状态管理**
   - 全局状态使用 Zustand
   - 局部状态使用 React useState
   - 服务器状态考虑使用 React Query（可选）

## 问题排查

### 开发服务器无法启动
- 检查 Node.js 版本是否 >= 18.17.0
- 删除 `node_modules` 和 `.next` 目录重新安装
- 检查端口 3000 是否被占用

### 类型错误
- 运行 `npm run build` 检查类型错误
- 确保所有依赖的类型定义已安装

### 样式不生效
- 检查 Tailwind CSS 配置
- 确保导入了 `globals.css`
- 清除 `.next` 缓存

