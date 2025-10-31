# Expenses 表升级指南

## 📋 升级概述

本文档指导您将第二阶段创建的 `expenses` 表升级到第五阶段的完整版本。

### 升级内容

- ✅ 添加 `updated_at` 字段（记录更新时间）
- ✅ 创建自动更新时间触发器
- ✅ 添加性能优化索引（3个）
- ✅ 添加数据完整性约束（金额 > 0）

### 安全保证

- ✅ **不会删除任何现有数据**
- ✅ **向后兼容**：现有功能不受影响
- ✅ **可回滚**：提供完整的回滚方案
- ✅ **幂等性**：重复执行不会出错

---

## 📊 第一步：升级前检查

### 1.1 登录 Supabase Dashboard

1. 访问 https://app.supabase.com
2. 登录您的账号
3. 选择项目：**AI-Travel-Planner**
4. 点击左侧菜单 **SQL Editor**

### 1.2 检查现有表结构

在 SQL Editor 中执行以下查询：

```sql
-- 检查 expenses 表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'expenses'
) AS table_exists;
```

**预期结果**：`table_exists: true`

### 1.3 查看现有字段

```sql
-- 查看所有字段
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;
```

**预期看到 7 个字段**：
1. id
2. plan_id
3. category
4. amount
5. description
6. date
7. created_at

**如果看到 8 个字段（包括 updated_at）**：说明已经升级过，可以跳过部分步骤。

### 1.4 检查现有索引

```sql
-- 查看所有索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'expenses';
```

**预期结果**：只有 1 个主键索引（`expenses_pkey`）

### 1.5 备份现有数据（可选但推荐）

```sql
-- 查看现有数据数量
SELECT COUNT(*) as total_expenses FROM expenses;

-- 如果有数据，可以导出备份
SELECT * FROM expenses;
```

💡 **提示**：可以点击 SQL Editor 右上角的 "Download CSV" 保存备份。

---

## 🚀 第二步：执行升级

### 2.1 复制升级脚本

点击 SQL Editor 中的 **New Query** 创建新查询，然后复制以下完整脚本：

```sql
-- ============================================================
-- Expenses 表升级脚本（第二阶段 → 第五阶段）
-- 版本：1.0
-- 日期：2025-10-31
-- 说明：增量升级，不删除现有数据
-- ============================================================

-- 开始事务（确保要么全部成功，要么全部回滚）
BEGIN;

-- ------------------------------------------------------------
-- 第 1 项：添加 updated_at 字段
-- ------------------------------------------------------------
DO $$ 
BEGIN
  -- 检查字段是否已存在
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'updated_at'
  ) THEN
    -- 添加字段
    ALTER TABLE expenses 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
    
    -- 将现有记录的 updated_at 设置为 created_at
    UPDATE expenses SET updated_at = created_at;
    
    RAISE NOTICE '✅ 已添加 updated_at 字段';
  ELSE
    RAISE NOTICE '⏭️ updated_at 字段已存在，跳过';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 第 2 项：创建自动更新时间触发器
-- ------------------------------------------------------------
-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_update_expenses_updated_at ON expenses;

-- 创建新触发器
CREATE TRIGGER trigger_update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

RAISE NOTICE '✅ 已创建自动更新时间触发器';

-- ------------------------------------------------------------
-- 第 3 项：创建性能优化索引
-- ------------------------------------------------------------
-- 索引 1：按计划 ID 查询（最常用）
CREATE INDEX IF NOT EXISTS idx_expenses_plan_id ON expenses(plan_id);
RAISE NOTICE '✅ 已创建 idx_expenses_plan_id 索引';

-- 索引 2：按日期查询/排序
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
RAISE NOTICE '✅ 已创建 idx_expenses_date 索引';

-- 索引 3：按类别统计
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
RAISE NOTICE '✅ 已创建 idx_expenses_category 索引';

-- ------------------------------------------------------------
-- 第 4 项：添加数据完整性约束
-- ------------------------------------------------------------
DO $$ 
BEGIN
  -- 检查约束是否已存在
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'expenses_amount_positive'
  ) THEN
    -- 先检查是否有违反约束的数据
    IF EXISTS (SELECT 1 FROM expenses WHERE amount <= 0) THEN
      RAISE WARNING '⚠️ 发现金额 <= 0 的记录，请先修复数据';
      RAISE EXCEPTION '无法添加约束：存在无效数据';
    END IF;
    
    -- 添加约束
    ALTER TABLE expenses 
    ADD CONSTRAINT expenses_amount_positive CHECK (amount > 0);
    
    RAISE NOTICE '✅ 已添加金额正数约束';
  ELSE
    RAISE NOTICE '⏭️ 金额约束已存在，跳过';
  END IF;
END $$;

-- 提交事务
COMMIT;

-- ============================================================
-- 升级完成！显示结果摘要
-- ============================================================
SELECT '🎉 Expenses 表升级完成！' AS status;

-- 显示最终字段列表
SELECT '📋 字段列表：' AS info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;

-- 显示最终索引列表
SELECT '📊 索引列表：' AS info;
SELECT indexname FROM pg_indexes 
WHERE tablename = 'expenses'
ORDER BY indexname;

-- 显示触发器列表
SELECT '⚡ 触发器列表：' AS info;
SELECT trigger_name, event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'expenses';
```

### 2.2 执行升级

1. **粘贴脚本**到 SQL Editor
2. **检查一遍**：确保完整复制
3. **点击 Run** 或按 `Ctrl/Cmd + Enter` 执行
4. **等待执行完成**（通常 1-3 秒）

### 2.3 查看执行结果

执行成功后，您应该在输出中看到：

```
✅ 已添加 updated_at 字段
✅ 已创建自动更新时间触发器
✅ 已创建 idx_expenses_plan_id 索引
✅ 已创建 idx_expenses_date 索引
✅ 已创建 idx_expenses_category 索引
✅ 已添加金额正数约束
🎉 Expenses 表升级完成！
```

---

## ✅ 第三步：升级后验证

### 3.1 验证字段列表

```sql
-- 应该看到 8 个字段
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;
```

**预期结果**：
```
1. id
2. plan_id
3. category
4. amount
5. description
6. date
7. created_at
8. updated_at ← 新增！
```

### 3.2 验证索引

```sql
-- 应该看到 4 个索引
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'expenses'
ORDER BY indexname;
```

**预期结果**：
```
1. expenses_pkey              (主键，原有)
2. idx_expenses_category      (新增)
3. idx_expenses_date          (新增)
4. idx_expenses_plan_id       (新增)
```

### 3.3 验证触发器

```sql
-- 应该看到 1 个触发器
SELECT trigger_name, event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'expenses';
```

**预期结果**：
```
trigger_name: trigger_update_expenses_updated_at
event_manipulation: UPDATE
```

### 3.4 验证约束

```sql
-- 应该看到金额约束
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'expenses'::regclass
AND contype = 'c';  -- c = CHECK constraint
```

**预期结果**：
```
conname: expenses_amount_positive
definition: CHECK (amount > 0)
```

### 3.5 测试触发器

```sql
-- 测试自动更新时间
BEGIN;

-- 创建测试记录（需要替换为真实的 plan_id）
INSERT INTO expenses (plan_id, category, amount, date)
SELECT id, 'food', 99.99, CURRENT_DATE
FROM travel_plans
LIMIT 1;

-- 记录初始时间
SELECT id, created_at, updated_at 
FROM expenses 
ORDER BY created_at DESC 
LIMIT 1;

-- 等待 1 秒（模拟）
SELECT pg_sleep(1);

-- 更新记录
UPDATE expenses 
SET amount = 88.88
WHERE id = (
  SELECT id FROM expenses 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 检查 updated_at 是否自动更新
SELECT 
  id, 
  created_at, 
  updated_at,
  updated_at > created_at AS "时间已更新"
FROM expenses 
ORDER BY created_at DESC 
LIMIT 1;

-- 清理测试数据
DELETE FROM expenses 
WHERE id = (
  SELECT id FROM expenses 
  ORDER BY created_at DESC 
  LIMIT 1
);

ROLLBACK;  -- 回滚测试
```

**预期结果**：`时间已更新: true`

---

## 🎊 第四步：完成确认

### 升级检查清单

请确认以下所有项目：

- [ ] ✅ `expenses` 表有 **8 个字段**（包括 `updated_at`）
- [ ] ✅ 有 **4 个索引**（1 个主键 + 3 个性能索引）
- [ ] ✅ 有 **1 个触发器**（自动更新时间）
- [ ] ✅ 有 **1 个约束**（金额 > 0）
- [ ] ✅ 原有 **4 个 RLS 策略**仍然存在
- [ ] ✅ 现有数据完整无损
- [ ] ✅ 触发器测试通过

### 升级完成后的优势

| 优化项 | 效果 |
|--------|------|
| `updated_at` 字段 | ✅ 代码正常运行，记录修改历史 |
| 自动更新触发器 | ✅ 无需手动维护时间戳 |
| `idx_expenses_plan_id` | ✅ 按计划查询速度提升 **10-100倍** |
| `idx_expenses_date` | ✅ 日期范围查询更快 |
| `idx_expenses_category` | ✅ 分类统计计算更快 |
| 金额约束 | ✅ 防止无效数据（负数金额） |

---

## 🐛 故障排除

### 问题 1：执行时报错 "column already exists"

**原因**：`updated_at` 字段已存在

**解决**：这是正常的，脚本会跳过该步骤，继续执行其他升级

---

### 问题 2：报错 "无法添加约束：存在无效数据"

**原因**：数据库中有金额 ≤ 0 的记录

**解决**：先修复数据
```sql
-- 查找问题数据
SELECT * FROM expenses WHERE amount <= 0;

-- 修复或删除问题数据
UPDATE expenses SET amount = 1 WHERE amount <= 0;
-- 或
DELETE FROM expenses WHERE amount <= 0;

-- 然后重新执行升级脚本
```

---

### 问题 3：看不到执行消息

**原因**：SQL Editor 可能隐藏了 NOTICE 消息

**解决**：查看 "Messages" 标签，或直接执行验证查询确认结果

---

### 问题 4：触发器测试失败

**原因**：可能没有 travel_plans 记录

**解决**：先创建一个测试计划，或跳过触发器测试（触发器已创建成功）

---

## 🔙 回滚方案

如果升级后发现问题，可以执行以下脚本回滚：

```sql
-- ⚠️ 警告：此操作会删除升级内容，但不会删除数据

BEGIN;

-- 删除触发器
DROP TRIGGER IF EXISTS trigger_update_expenses_updated_at ON expenses;
DROP FUNCTION IF EXISTS update_expenses_updated_at();

-- 删除索引
DROP INDEX IF EXISTS idx_expenses_plan_id;
DROP INDEX IF EXISTS idx_expenses_date;
DROP INDEX IF EXISTS idx_expenses_category;

-- 删除约束
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_amount_positive;

-- 删除 updated_at 字段（⚠️ 会丢失更新时间信息）
ALTER TABLE expenses DROP COLUMN IF EXISTS updated_at;

COMMIT;

SELECT '✅ 已回滚到升级前状态' AS status;
```

**注意**：回滚会删除 `updated_at` 字段及其数据，但不会影响其他费用数据。

---

## 📞 需要帮助？

如果遇到问题：

1. **检查错误消息**：复制完整的错误信息
2. **查看验证结果**：运行验证查询，提供输出
3. **检查现有数据**：确认是否有异常数据
4. **联系支持**：提供上述信息以便快速定位问题

---

## 🎯 下一步

升级完成后，您可以：

1. ✅ 继续测试费用管理功能
2. ✅ 参考 `docs/STAGE5_TEST_GUIDE.md` 进行完整功能测试
3. ✅ 享受性能提升和新功能！

---

**升级脚本版本**：1.0  
**最后更新**：2025-10-31  
**兼容性**：PostgreSQL 12+, Supabase

---

## 📚 相关文档

- [STAGE5_SETUP.md](./STAGE5_SETUP.md) - 第五阶段配置指南
- [STAGE5_TEST_GUIDE.md](./STAGE5_TEST_GUIDE.md) - 功能测试指南
- [STAGE5_DATABASE_SETUP.md](./STAGE5_DATABASE_SETUP.md) - 全新安装指南

**恭喜！按照本文档完成升级后，您的 expenses 表将达到第五阶段的完整功能！** 🎉

