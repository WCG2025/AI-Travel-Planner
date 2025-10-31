# 第五阶段数据库设置

## 应用数据库迁移

由于您可能没有安装 Supabase CLI，请按照以下步骤手动应用数据库迁移：

### 步骤 1: 登录 Supabase Dashboard

1. 访问 https://app.supabase.com
2. 登录您的账号
3. 选择您的项目（AI-Travel-Planner）

### 步骤 2: 打开 SQL Editor

1. 在左侧菜单中找到 **SQL Editor**
2. 点击进入

### 步骤 3: 执行迁移 SQL

1. 点击 **New Query** 创建新查询
2. 复制以下 SQL 内容：

```sql
-- 创建费用记录表
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES travel_plans(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建索引
CREATE INDEX idx_expenses_plan_id ON expenses(plan_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- 添加 RLS 策略
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己旅行计划的费用
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (
    plan_id IN (
      SELECT id FROM travel_plans WHERE user_id = auth.uid()
    )
  );

-- 用户只能添加自己旅行计划的费用
CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    plan_id IN (
      SELECT id FROM travel_plans WHERE user_id = auth.uid()
    )
  );

-- 用户只能更新自己旅行计划的费用
CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (
    plan_id IN (
      SELECT id FROM travel_plans WHERE user_id = auth.uid()
    )
  );

-- 用户只能删除自己旅行计划的费用
CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (
    plan_id IN (
      SELECT id FROM travel_plans WHERE user_id = auth.uid()
    )
  );
```

3. 粘贴到 SQL Editor 中
4. 点击 **Run** 或按 `Ctrl/Cmd + Enter` 执行

### 步骤 4: 验证迁移

执行以下 SQL 验证表是否创建成功：

```sql
-- 检查 expenses 表
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;

-- 检查 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'expenses';

-- 检查索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'expenses';
```

预期输出：
- ✅ expenses 表应该有 8 个字段（id, plan_id, category, amount, description, date, created_at, updated_at）
- ✅ 应该有 4 个 RLS 策略（SELECT, INSERT, UPDATE, DELETE）
- ✅ 应该有 3 个索引（plan_id, date, category）

### 步骤 5: 测试数据插入（可选）

```sql
-- 注意：这只是测试，需要替换为真实的 plan_id
-- 您可以先查询一个真实的 plan_id:
SELECT id FROM travel_plans LIMIT 1;

-- 然后插入测试数据（替换 'your-plan-id-here'）
INSERT INTO expenses (plan_id, category, amount, description, date)
VALUES (
  'your-plan-id-here',
  'food',
  68.50,
  '午餐 - 川菜馆',
  CURRENT_DATE
);

-- 查询测试数据
SELECT * FROM expenses;

-- 清理测试数据（如果需要）
DELETE FROM expenses WHERE description = '午餐 - 川菜馆';
```

## 常见问题

### Q: 执行 SQL 时报错 "permission denied"
**A:** 确保您使用的是项目所有者账号登录，或者账号有足够的权限。

### Q: RLS 策略创建失败
**A:** 检查 `travel_plans` 表是否存在，以及是否有 `user_id` 字段。

### Q: 触发器创建失败
**A:** 确保 PostgreSQL 版本支持 PL/pgSQL 语言。Supabase 默认支持。

### Q: 如何回滚迁移？
**A:** 执行以下 SQL：

```sql
-- 删除 RLS 策略
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

-- 删除触发器和函数
DROP TRIGGER IF EXISTS trigger_update_expenses_updated_at ON expenses;
DROP FUNCTION IF EXISTS update_expenses_updated_at();

-- 删除表（注意：这会删除所有费用数据！）
DROP TABLE IF EXISTS expenses CASCADE;
```

## 下一步

迁移完成后，您可以：
1. 启动开发服务器：`npm run dev`
2. 参考 `docs/STAGE5_TEST_GUIDE.md` 进行功能测试
3. 开始使用费用管理功能！

---

**重要提示**：
- 在生产环境中，建议使用版本控制工具（如 Supabase Migrations）管理数据库迁移
- 执行删除操作前请务必备份数据
- RLS 策略确保用户只能访问自己的数据，请勿禁用

