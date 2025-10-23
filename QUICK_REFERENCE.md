# AI 旅行规划师 - 快速参考指南

## 🚀 当前项目状态

- ✅ **第一阶段**：项目基础架构（100%）
- ✅ **第二阶段**：用户认证系统（100%）
- ⏳ **第三阶段**：语音输入功能（待开始）

## 📋 重要文件路径

### 配置文件
- `env.example` - 环境变量模板（需要复制为 `.env.local`）
- `middleware.ts` - Next.js 中间件（路由保护）
- `components.json` - shadcn/ui 配置

### Supabase 配置
- `src/lib/supabase/client.ts` - 客户端
- `src/lib/supabase/server.ts` - 服务端
- `src/lib/supabase/middleware.ts` - 中间件

### 认证页面
- `/signup` - 注册页面
- `/login` - 登录页面
- `/dashboard` - 用户仪表板（需登录）
- `/profile` - 个人资料（需登录）

### Hooks
- `src/hooks/use-auth.ts` - 获取当前用户
- `src/hooks/use-user-profile.ts` - 获取用户资料
- `src/hooks/use-toast.ts` - 显示通知

## 🔧 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务器
npm run lint             # 代码检查

# 添加 UI 组件
npx shadcn@latest add [component-name]

# 格式化代码
npx prettier --write .
```

## 📝 环境变量配置

### 必需（第二阶段）
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 可选（后续阶段）
```env
DEEPSEEK_API_KEY=xxx
NEXT_PUBLIC_XFYUN_APP_ID=xxx
NEXT_PUBLIC_XFYUN_API_KEY=xxx
NEXT_PUBLIC_XFYUN_API_SECRET=xxx
NEXT_PUBLIC_AMAP_KEY=xxx
NEXT_PUBLIC_AMAP_SECRET=xxx
```

## 🗄️ Supabase 数据库表

### user_profiles
用户资料扩展表
```sql
id, username, full_name, avatar_url, created_at, updated_at
```

### travel_plans
旅行计划表（待使用）
```sql
id, user_id, title, destination, start_date, end_date, budget, preferences, itinerary
```

### expenses
费用记录表（待使用）
```sql
id, plan_id, category, amount, description, date
```

## 🔑 Supabase 配置步骤（如果还没做）

1. **创建项目**
   - 访问 https://supabase.com/
   - 创建新项目
   - 等待初始化完成

2. **获取 API Keys**
   - Settings → API
   - 复制 Project URL 和 anon public key

3. **配置环境变量**
   ```bash
   cp env.example .env.local
   # 编辑 .env.local 填入 API Keys
   ```

4. **创建数据库表**
   - 打开 SQL Editor
   - 复制 `docs/STAGE2_SETUP.md` 中的 SQL 代码
   - 运行创建表和策略

5. **重启开发服务器**
   ```bash
   npm run dev
   ```

## 📚 文档索引

| 文档 | 用途 |
|------|------|
| `README.md` | 项目概述和完整规划 |
| `docs/QUICK_START.md` | 快速入门指南 |
| `docs/DEVELOPMENT.md` | 开发指南 |
| `docs/DEPLOYMENT.md` | 部署指南 |
| `docs/STAGE2_SETUP.md` | 第二阶段配置详细步骤 |
| `docs/STAGE2_COMPLETE.md` | 第二阶段完成报告 |
| `docs/SETUP_COMPLETE.md` | 第一阶段完成报告 |

## 🧪 测试认证功能

### 1. 注册新用户
```
1. 访问 http://localhost:3000
2. 点击"开始使用"或"注册"
3. 填写表单并提交
4. 查看 Supabase Dashboard 确认用户创建
```

### 2. 登录测试
```
1. 访问 /login
2. 输入注册时的邮箱和密码
3. 应该跳转到 /dashboard
```

### 3. 查看个人资料
```
1. 点击右上角头像
2. 选择"个人资料"
3. 编辑信息并保存
```

## 🐛 常见问题快速解决

### 无法连接 Supabase
- 检查 `.env.local` 是否存在
- 确认环境变量拼写正确
- 重启开发服务器

### 注册后需要邮箱验证
- Supabase Dashboard → Settings → Authentication
- 关闭 "Confirm email"（仅开发环境）

### 登录后仍显示未登录
- 清除浏览器 Cookie
- 检查 `middleware.ts` 是否在根目录

## 📊 项目统计

- **总文件数**: 50+
- **代码行数**: 2000+
- **组件数**: 15+
- **页面数**: 5
- **Hooks数**: 3
- **API Routes**: 0（使用 Supabase）

## 🎯 下一步行动

### 立即可做
1. [ ] 测试注册和登录功能
2. [ ] 自定义用户资料
3. [ ] 探索仪表板页面

### 准备第三阶段
1. [ ] 申请科大讯飞账号
2. [ ] 获取语音识别 API Keys
3. [ ] 阅读语音识别 API 文档

### 可选优化
1. [ ] 添加头像上传功能
2. [ ] 实现密码重置
3. [ ] 添加社交登录
4. [ ] 美化错误页面

## 💬 获取帮助

遇到问题时：
1. 查看对应的文档文件
2. 检查浏览器控制台的错误信息
3. 查看 Supabase Dashboard 的日志
4. 搜索错误信息

---

**祝开发顺利！** 🚀

如有问题，请参考 `docs/` 目录下的详细文档。

