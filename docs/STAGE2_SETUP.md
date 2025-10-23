# 第二阶段：用户认证系统 - 配置指南

## ✅ 已完成的开发

### 1. 安装的依赖包
- ✅ `react-hook-form` - 表单处理
- ✅ `zod` - 模式验证
- ✅ `@hookform/resolvers` - 表单验证解析器

### 2. 安装的 UI 组件
- ✅ Toast（通知组件）
- ✅ Form（表单组件）
- ✅ Dialog（对话框组件）
- ✅ Avatar（头像组件）
- ✅ Dropdown Menu（下拉菜单）
- ✅ Separator（分隔符）

### 3. 创建的文件结构

```
src/
├── lib/supabase/
│   ├── client.ts           ✅ 浏览器端 Supabase 客户端
│   ├── server.ts           ✅ 服务端 Supabase 客户端
│   └── middleware.ts       ✅ Supabase 中间件配置
├── types/
│   ├── database.types.ts   ✅ 数据库类型定义
│   └── auth.types.ts       ✅ 认证相关类型
├── hooks/
│   ├── use-auth.ts         ✅ 认证 Hook
│   └── use-user-profile.ts ✅ 用户资料 Hook
├── components/layout/
│   └── header.tsx          ✅ 头部导航组件
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx      ✅ 认证页面布局
│   │   ├── login/
│   │   │   └── page.tsx    ✅ 登录页面
│   │   └── signup/
│   │       └── page.tsx    ✅ 注册页面
│   └── (dashboard)/
│       ├── layout.tsx      ✅ 仪表板布局
│       ├── dashboard/
│       │   └── page.tsx    ✅ 仪表板页面
│       └── profile/
│           └── page.tsx    ✅ 个人资料页面
└── middleware.ts           ✅ Next.js 中间件
```

## 🔧 环境配置步骤

### 步骤 1：创建 Supabase 项目

1. 访问 [https://supabase.com/](https://supabase.com/)
2. 注册或登录账号
3. 点击 "New Project"
4. 填写项目信息：
   - **Name**: ai-travel-planner（或其他名称）
   - **Database Password**: 设置一个强密码（请记住）
   - **Region**: 选择 Singapore（离中国最近）
   - **Pricing Plan**: Free（免费计划）
5. 点击 "Create new project" 并等待项目初始化（约 2-3 分钟）

### 步骤 2：获取 API Keys

项目创建完成后：

1. 在左侧菜单点击 **Settings（设置）**
2. 选择 **API** 选项卡
3. 找到以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` （很长的字符串）

### 步骤 3：配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# 方式1：复制模板文件
cp env.example .env.local

# 方式2：直接创建
# 在 Windows PowerShell 中：
New-Item -Path .env.local -ItemType File

# 在 Windows CMD 中：
type nul > .env.local
```

编辑 `.env.local` 文件，填入从 Supabase 获取的信息：

```env
# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL=https://你的项目id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_public_key

# 其他 API（暂时可以留空，后续阶段使用）
DEEPSEEK_API_KEY=
NEXT_PUBLIC_DEEPSEEK_API_ENDPOINT=https://api.deepseek.com

NEXT_PUBLIC_XFYUN_APP_ID=
NEXT_PUBLIC_XFYUN_API_KEY=
NEXT_PUBLIC_XFYUN_API_SECRET=

NEXT_PUBLIC_AMAP_KEY=
NEXT_PUBLIC_AMAP_SECRET=
```

### 步骤 4：创建数据库表

在 Supabase Dashboard 中：

1. 点击左侧菜单的 **SQL Editor**
2. 点击 **New query**
3. 粘贴以下 SQL 代码并运行（点击 Run 按钮）：

```sql
-- 创建用户配置表
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 启用行级安全（RLS）
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户可以查看自己的资料" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户可以插入自己的资料" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 创建自动创建用户资料的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：用户注册时自动创建资料
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建旅行计划表
CREATE TABLE travel_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(10, 2),
  preferences JSONB DEFAULT '{}'::jsonb,
  itinerary JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 启用 RLS
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户可以查看自己的旅行计划" ON travel_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建旅行计划" ON travel_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的旅行计划" ON travel_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的旅行计划" ON travel_plans
  FOR DELETE USING (auth.uid() = user_id);

-- 创建费用记录表
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES travel_plans ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 启用 RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户可以查看自己计划的费用" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM travel_plans
      WHERE travel_plans.id = expenses.plan_id
      AND travel_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以创建费用记录" ON expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM travel_plans
      WHERE travel_plans.id = expenses.plan_id
      AND travel_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以更新自己计划的费用" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM travel_plans
      WHERE travel_plans.id = expenses.plan_id
      AND travel_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以删除自己计划的费用" ON expenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM travel_plans
      WHERE travel_plans.id = expenses.plan_id
      AND travel_plans.user_id = auth.uid()
    )
  );
```

### 步骤 5：配置邮件模板（可选但推荐）

Supabase 默认会发送验证邮件。你可以自定义邮件模板：

1. 在 Supabase Dashboard 中，点击 **Authentication**
2. 选择 **Email Templates**
3. 自定义以下模板：
   - **Confirm signup**: 注册确认邮件
   - **Magic Link**: 魔法链接登录
   - **Change Email Address**: 更改邮箱
   - **Reset Password**: 重置密码

### 步骤 6：重启开发服务器

```bash
# 如果开发服务器正在运行，先停止（Ctrl+C）
# 然后重新启动
npm run dev
```

## 🧪 测试认证系统

### 1. 注册新用户

1. 访问 http://localhost:3000
2. 点击"开始使用"或"注册"
3. 填写注册表单：
   - 姓名：张三
   - 邮箱：test@example.com
   - 密码：至少 6 个字符
4. 点击"注册"按钮

**注意**：Supabase 默认需要邮箱验证。在开发环境中，你可以：
- 查看 Supabase Dashboard > Authentication > Users 确认用户已创建
- 或者在 Settings > Authentication > Email Auth 中关闭 "Confirm email" 选项

### 2. 登录测试

1. 访问 http://localhost:3000/login
2. 输入注册时的邮箱和密码
3. 点击"登录"
4. 应该会跳转到 `/dashboard` 页面

### 3. 查看个人资料

1. 登录后，点击右上角的用户头像
2. 选择"个人资料"
3. 可以编辑姓名和用户名
4. 点击"保存更改"

### 4. 退出登录

1. 点击右上角的用户头像
2. 选择"退出登录"
3. 应该会跳转回首页

## 🐛 常见问题

### 问题 1：注册后提示"检查邮箱"

**原因**：Supabase 默认启用邮箱验证。

**解决方案**：
1. 在 Supabase Dashboard > Settings > Authentication
2. 找到 "Email" 部分
3. 关闭 "Confirm email" 开关（仅开发环境）
4. 或者使用真实邮箱注册并点击验证链接

### 问题 2：无法连接到 Supabase

**检查清单**：
- [ ] `.env.local` 文件是否存在
- [ ] 环境变量是否正确填写
- [ ] Supabase 项目是否处于活跃状态
- [ ] 开发服务器是否重启

### 问题 3：登录后仍然显示未登录

**解决方案**：
1. 清除浏览器 Cookie
2. 检查中间件配置
3. 确保 `middleware.ts` 文件在项目根目录

### 问题 4：数据库表创建失败

**解决方案**：
1. 逐步运行 SQL 语句，找出错误的部分
2. 确保没有语法错误
3. 检查 Supabase 项目的数据库连接是否正常

## 📊 数据库结构

### user_profiles 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 用户 ID（关联 auth.users） |
| username | TEXT | 用户名（唯一） |
| full_name | TEXT | 全名 |
| avatar_url | TEXT | 头像 URL |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### travel_plans 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 计划 ID |
| user_id | UUID | 用户 ID |
| title | TEXT | 计划标题 |
| destination | TEXT | 目的地 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期 |
| budget | DECIMAL | 预算 |
| preferences | JSONB | 偏好设置 |
| itinerary | JSONB | 行程安排 |

### expenses 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 费用 ID |
| plan_id | UUID | 计划 ID |
| category | TEXT | 类别 |
| amount | DECIMAL | 金额 |
| description | TEXT | 描述 |
| date | DATE | 日期 |

## 🎯 下一步

第二阶段完成后，你可以：

1. **开始第三阶段**：集成科大讯飞语音识别
2. **优化现有功能**：
   - 添加密码重置功能
   - 实现社交登录（Google, GitHub）
   - 添加头像上传功能
3. **开始开发核心功能**：
   - 创建旅行计划表单
   - 实现 AI 行程生成

## 📝 总结

第二阶段已完成以下功能：

- ✅ 用户注册
- ✅ 用户登录
- ✅ 用户登出
- ✅ 个人资料管理
- ✅ 受保护的路由
- ✅ 数据库集成
- ✅ 完整的认证流程

**恭喜！** 用户认证系统已全部配置完成！🎉

