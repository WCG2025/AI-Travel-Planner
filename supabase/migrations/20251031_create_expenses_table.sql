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

