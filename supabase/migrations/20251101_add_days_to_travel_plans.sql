-- 添加 days 字段到 travel_plans 表
-- 用于存储行程天数（支持相对日期模式）

-- 1. 添加 days 字段（可选，因为老数据可能没有）
ALTER TABLE travel_plans
ADD COLUMN IF NOT EXISTS days INTEGER;

-- 2. 为现有记录计算并填充 days 值
-- 对于有 start_date 和 end_date 的记录，从日期计算
UPDATE travel_plans
SET days = (end_date::date - start_date::date) + 1
WHERE start_date IS NOT NULL 
  AND end_date IS NOT NULL 
  AND days IS NULL;

-- 3. 对于相对日期的记录（没有 start_date/end_date），从 itinerary 数组长度获取
UPDATE travel_plans
SET days = jsonb_array_length(itinerary::jsonb)
WHERE days IS NULL 
  AND itinerary IS NOT NULL;

-- 4. 添加注释
COMMENT ON COLUMN travel_plans.days IS '行程天数（支持相对日期模式，当 start_date/end_date 为空时使用）';

-- 5. 验证数据
DO $$
BEGIN
  RAISE NOTICE '✅ days 字段已添加';
  RAISE NOTICE '记录数: %', (SELECT COUNT(*) FROM travel_plans);
  RAISE NOTICE '有 days 的记录: %', (SELECT COUNT(*) FROM travel_plans WHERE days IS NOT NULL);
  RAISE NOTICE '缺少 days 的记录: %', (SELECT COUNT(*) FROM travel_plans WHERE days IS NULL);
END $$;

