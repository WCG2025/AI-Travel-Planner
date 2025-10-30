-- 创建旅行计划表
CREATE TABLE IF NOT EXISTS public.travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget INTEGER,
  preferences JSONB DEFAULT '{}',
  itinerary JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_travel_plans_user_id ON public.travel_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_plans_created_at ON public.travel_plans(created_at DESC);

-- 启用行级安全策略
ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的计划
CREATE POLICY "Users can view their own travel plans"
  ON public.travel_plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能插入自己的计划
CREATE POLICY "Users can insert their own travel plans"
  ON public.travel_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的计划
CREATE POLICY "Users can update their own travel plans"
  ON public.travel_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的计划
CREATE POLICY "Users can delete their own travel plans"
  ON public.travel_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- 创建触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_travel_plans_updated_at
  BEFORE UPDATE ON public.travel_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

