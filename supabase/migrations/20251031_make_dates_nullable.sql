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

