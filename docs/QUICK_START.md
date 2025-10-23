# 快速入门指南

## 🎉 环境配置已完成！

恭喜！项目的基础开发环境已经配置完成。以下是已完成的配置清单：

### ✅ 已完成的配置

#### 1. 项目初始化
- [x] Next.js 15.5+ 项目结构
- [x] TypeScript 类型系统
- [x] App Router 路由模式
- [x] src 目录结构

#### 2. 样式和 UI
- [x] Tailwind CSS 配置
- [x] shadcn/ui 组件库
- [x] 响应式布局支持
- [x] 深色模式支持
- [x] 基础 UI 组件（Button, Card, Input, Label）

#### 3. 开发工具
- [x] ESLint 代码检查
- [x] Prettier 代码格式化
- [x] TypeScript 严格模式
- [x] Git 版本控制配置

#### 4. 依赖包
- [x] Supabase 客户端
- [x] Zustand 状态管理
- [x] Axios HTTP 客户端
- [x] date-fns 日期处理
- [x] lucide-react 图标库

#### 5. 项目结构
```
✅ src/app/              - Next.js 应用页面
✅ src/components/ui/    - UI 基础组件
✅ src/components/features/ - 功能组件目录
✅ src/components/layout/   - 布局组件目录
✅ src/lib/              - 工具库和配置
✅ src/hooks/            - 自定义 Hooks
✅ src/store/            - 状态管理
✅ src/types/            - TypeScript 类型
```

#### 6. Docker 支持
- [x] Dockerfile 配置
- [x] docker-compose.yml 配置
- [x] .dockerignore 配置
- [x] Next.js standalone 输出模式

## 🚀 立即开始

### 查看运行中的应用
开发服务器已经在后台运行，访问：
```
http://localhost:3000
```

你应该能看到一个展示核心功能的欢迎页面。

### 停止开发服务器
如果需要停止开发服务器：
```bash
# 按 Ctrl+C 停止
```

### 重新启动开发服务器
```bash
npm run dev
```

## 📋 下一步工作

根据开发阶段规划，建议按以下顺序进行开发：

### 阶段 2：用户认证系统（优先级：高）

#### 2.1 创建 Supabase 项目
1. 访问 [Supabase 官网](https://supabase.com/)
2. 注册/登录账号
3. 创建新项目
4. 获取项目 URL 和 anon key

#### 2.2 配置环境变量
```bash
# 复制环境变量模板
cp env.example .env.local

# 编辑 .env.local，填入 Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=你的_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
```

#### 2.3 设计数据库表结构
建议的表结构：
```sql
-- 用户配置表（扩展 auth.users）
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 旅行计划表
CREATE TABLE travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL,
  preferences JSONB,
  itinerary JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 费用记录表
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES travel_plans NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 阶段 3：语音输入功能

#### 3.1 申请科大讯飞 API
1. 访问 [科大讯飞开放平台](https://www.xfyun.cn/)
2. 注册并创建应用
3. 获取 APP_ID、API_KEY、API_SECRET
4. 添加到 `.env.local`

#### 3.2 集成语音识别
- 实现语音录制功能
- 调用讯飞 WebSocket API
- 实时显示转写结果

### 阶段 4：AI 行程规划

#### 4.1 申请 DeepSeek API
1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册并获取 API Key
3. 添加到 `.env.local`

#### 4.2 设计 Prompt
```typescript
const systemPrompt = `
你是一个专业的旅行规划助手。根据用户提供的信息，
生成详细的旅行计划，包括：
- 每日行程安排
- 推荐景点和活动
- 餐厅推荐
- 住宿建议
- 交通安排
- 预算分配
`;
```

### 阶段 5：地图集成

#### 5.1 申请高德地图 API
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并创建应用
3. 获取 Web 服务 Key
4. 添加到 `.env.local`

#### 5.2 实现地图功能
- 地点搜索
- 路线规划
- 标记显示
- 导航功能

## 📚 学习资源

### Next.js 14+ 文档
- [Next.js 官方文档](https://nextjs.org/docs)
- [App Router 指南](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

### Supabase 文档
- [Supabase 官方文档](https://supabase.com/docs)
- [认证指南](https://supabase.com/docs/guides/auth)
- [数据库指南](https://supabase.com/docs/guides/database)

### shadcn/ui 组件
- [组件文档](https://ui.shadcn.com/)
- [主题定制](https://ui.shadcn.com/themes)

## 🛠️ 开发技巧

### 1. 代码格式化
```bash
# 格式化所有代码
npx prettier --write .

# 格式化特定文件
npx prettier --write src/app/page.tsx
```

### 2. 类型检查
```bash
# 运行类型检查
npx tsc --noEmit
```

### 3. 代码检查
```bash
# 运行 ESLint
npm run lint

# 自动修复
npm run lint -- --fix
```

### 4. 添加新组件
```bash
# 添加 shadcn/ui 组件
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
```

## 🐛 调试技巧

### 1. 使用 React DevTools
安装浏览器扩展：
- [Chrome 扩展](https://chrome.google.com/webstore/detail/react-developer-tools)
- [Firefox 扩展](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

### 2. Next.js 调试
```json
// package.json 添加调试脚本
{
  "scripts": {
    "dev:debug": "NODE_OPTIONS='--inspect' next dev"
  }
}
```

### 3. 查看构建输出
```bash
npm run build
```

## 📝 提交规范

建议使用 Conventional Commits 规范：
```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具链相关
```

示例：
```bash
git commit -m "feat: 实现用户注册功能"
git commit -m "fix: 修复登录页面布局问题"
git commit -m "docs: 更新 API 文档"
```

## 🎯 开发建议

1. **小步快跑**：每次实现一个小功能，及时提交
2. **测试驱动**：先写测试，再写实现
3. **代码审查**：定期检查代码质量
4. **文档先行**：重要功能要写文档
5. **性能优化**：使用 React DevTools Profiler 分析性能

## 💬 获取帮助

遇到问题时：
1. 查看 `docs/DEVELOPMENT.md` 开发指南
2. 查看 `docs/DEPLOYMENT.md` 部署指南
3. 搜索相关文档和 GitHub Issues
4. 向团队成员或导师求助

祝开发顺利！🚀

