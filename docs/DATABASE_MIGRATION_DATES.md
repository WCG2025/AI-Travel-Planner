# 数据库迁移：日期字段变为可选

## 🎯 目的

让 `travel_plans` 表的 `start_date` 和 `end_date` 字段变为可选（nullable），以支持**相对日期模式**。

## 📋 迁移脚本

文件：`supabase/migrations/20251031_make_dates_nullable.sql`

```sql
-- 让 travel_plans 表的 start_date 和 end_date 字段可为 null
-- 这样可以支持相对日期模式（第1天、第2天）

-- 修改 start_date 字段为可空
ALTER TABLE travel_plans 
ALTER COLUMN start_date DROP NOT NULL;

-- 修改 end_date 字段为可空
ALTER TABLE travel_plans 
ALTER COLUMN end_date DROP NOT NULL;

-- 添加注释说明
COMMENT ON COLUMN travel_plans.start_date IS '开始日期（可选，相对日期模式下为 NULL）';
COMMENT ON COLUMN travel_plans.end_date IS '结束日期（可选，相对日期模式下为 NULL）';
```

## 🚀 执行迁移

### 方法 1：Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query**
5. 复制粘贴迁移脚本内容
6. 点击 **Run** 执行

### 方法 2：使用 Supabase CLI

如果你安装了 Supabase CLI：

```bash
# 1. 确保 CLI 已连接到项目
supabase link --project-ref your-project-ref

# 2. 应用迁移
supabase db push

# 或者手动执行 SQL
supabase db execute -f supabase/migrations/20251031_make_dates_nullable.sql
```

### 方法 3：直接在 SQL Editor 中执行

```sql
-- 复制以下 SQL 并在 Supabase SQL Editor 中执行

ALTER TABLE travel_plans 
ALTER COLUMN start_date DROP NOT NULL;

ALTER TABLE travel_plans 
ALTER COLUMN end_date DROP NOT NULL;

COMMENT ON COLUMN travel_plans.start_date IS '开始日期（可选，相对日期模式下为 NULL）';
COMMENT ON COLUMN travel_plans.end_date IS '结束日期（可选，相对日期模式下为 NULL）';
```

## ✅ 验证迁移

执行迁移后，验证字段是否可为 null：

```sql
-- 查看表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'travel_plans' 
  AND column_name IN ('start_date', 'end_date');
```

**预期结果**：
| column_name | data_type | is_nullable |
|------------|-----------|-------------|
| start_date | date      | YES         |
| end_date   | date      | YES         |

## 📊 数据影响

### 已有数据
- ✅ **不会影响**已有的旅行计划
- ✅ 已有计划仍然保留具体日期
- ✅ 可以正常查询和显示

### 新数据
- ✅ **绝对日期模式**：`start_date` 和 `end_date` 有值
  ```json
  {
    "title": "北京3日游",
    "start_date": "2025-11-01",
    "end_date": "2025-11-03"
  }
  ```

- ✅ **相对日期模式**：`start_date` 和 `end_date` 为 `null`
  ```json
  {
    "title": "北京3日游",
    "start_date": null,
    "end_date": null,
    "days": 3
  }
  ```

## 🔄 回滚（如果需要）

如果需要回滚（恢复为必需字段）：

```sql
-- ⚠️ 警告：回滚前确保所有记录都有日期值！

-- 先给 NULL 值填充默认日期
UPDATE travel_plans 
SET start_date = CURRENT_DATE 
WHERE start_date IS NULL;

UPDATE travel_plans 
SET end_date = CURRENT_DATE 
WHERE end_date IS NULL;

-- 然后恢复 NOT NULL 约束
ALTER TABLE travel_plans 
ALTER COLUMN start_date SET NOT NULL;

ALTER TABLE travel_plans 
ALTER COLUMN end_date SET NOT NULL;
```

## 🧪 测试

### 测试 1：插入相对日期计划

```sql
INSERT INTO travel_plans (
  user_id, 
  title, 
  destination, 
  start_date, 
  end_date, 
  itinerary
) VALUES (
  'your-user-id',
  '北京3日游',
  '北京',
  NULL,  -- 相对日期模式
  NULL,  -- 相对日期模式
  '[{"day":1,"title":"探索天安门"}]'::json
);
```

### 测试 2：插入绝对日期计划

```sql
INSERT INTO travel_plans (
  user_id, 
  title, 
  destination, 
  start_date, 
  end_date, 
  itinerary
) VALUES (
  'your-user-id',
  '上海3日游',
  '上海',
  '2025-11-01',  -- 绝对日期
  '2025-11-03',  -- 绝对日期
  '[{"day":1,"date":"2025-11-01","title":"探索外滩"}]'::json
);
```

## 📝 相关代码更新

### TypeScript 类型
✅ 已更新 `src/types/database.types.ts`
```typescript
start_date: string | null;  // 可选
end_date: string | null;    // 可选
```

### API 验证
✅ 已更新 `src/app/api/generate-plan/route.ts`
```typescript
// 现在接受 days 而不是强制要求 dates
if (!input.startDate && !input.endDate && !input.days) {
  return NextResponse.json(
    { error: '请提供开始/结束日期或旅行天数' },
    { status: 400 }
  );
}
```

### 数据保存
✅ 已更新保存逻辑
```typescript
start_date: plan.startDate || null,  // 可以为 null
end_date: plan.endDate || null,      // 可以为 null
```

## ⚠️ 重要提示

1. **执行迁移前建议备份数据库**
2. 迁移是**非破坏性**的（不会删除或修改已有数据）
3. 如果有 RLS（Row Level Security）策略涉及这些字段，可能需要更新
4. 迁移后立即测试插入和查询功能

## 🎉 完成后

迁移完成后，你就可以：
- ✅ 使用语音输入直接说"去北京玩三天"
- ✅ 无需选择具体日期
- ✅ 生成相对日期的旅行计划（第1天、第2天）

---

**创建时间**: 2025-10-31  
**迁移文件**: `supabase/migrations/20251031_make_dates_nullable.sql`  
**状态**: 待执行

