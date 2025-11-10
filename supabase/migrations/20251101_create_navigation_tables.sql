-- 创建导航查询记录表
-- 用于存储用户的导航查询历史和结果

CREATE TABLE IF NOT EXISTS navigation_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE,
  departure_time TIME,
  query_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  routes_count INTEGER DEFAULT 0,
  total_distance INTEGER, -- 总距离，单位：米
  total_duration INTEGER, -- 总时间，单位：秒
  min_cost DECIMAL(10, 2), -- 最低费用，单位：元
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建导航路线方案表
-- 用于存储每个查询结果中的具体路线方案

CREATE TABLE IF NOT EXISTS navigation_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES navigation_queries(id) ON DELETE CASCADE,
  route_index INTEGER NOT NULL, -- 路线在查询结果中的索引
  distance INTEGER NOT NULL, -- 距离，单位：米
  duration INTEGER NOT NULL, -- 时间，单位：秒
  cost DECIMAL(10, 2), -- 费用，单位：元
  walking_distance INTEGER DEFAULT 0, -- 步行距离，单位：米
  transit_distance INTEGER DEFAULT 0, -- 公交距离，单位：米
  restrictions TEXT[], -- 限制条件
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建导航路线段表
-- 用于存储每条路线的具体路段信息

CREATE TABLE IF NOT EXISTS navigation_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES navigation_routes(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL, -- 路段在路线中的索引
  transportation TEXT NOT NULL, -- 交通方式：步行、公交、地铁等
  origin TEXT NOT NULL, -- 起点名称
  destination TEXT NOT NULL, -- 终点名称
  distance INTEGER NOT NULL, -- 距离，单位：米
  duration INTEGER NOT NULL, -- 时间，单位：秒
  instructions TEXT[], -- 指令列表
  vehicle TEXT, -- 车辆信息（公交/地铁线路名称）
  departure_stop_name TEXT, -- 上车站点名称
  departure_stop_location POINT, -- 上车站点坐标
  arrival_stop_name TEXT, -- 下车站点名称
  arrival_stop_location POINT, -- 下车站点坐标
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建导航站点表
-- 用于存储公交/地铁站点信息

CREATE TABLE IF NOT EXISTS navigation_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES navigation_segments(id) ON DELETE CASCADE,
  stop_index INTEGER NOT NULL, -- 站点在路段中的索引
  name TEXT NOT NULL, -- 站点名称
  location POINT, -- 站点坐标
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能

CREATE INDEX IF NOT EXISTS idx_navigation_queries_user_id ON navigation_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_navigation_queries_query_time ON navigation_queries(query_time DESC);
CREATE INDEX IF NOT EXISTS idx_navigation_queries_origin_destination ON navigation_queries(origin, destination);

CREATE INDEX IF NOT EXISTS idx_navigation_routes_query_id ON navigation_routes(query_id);
CREATE INDEX IF NOT EXISTS idx_navigation_routes_cost ON navigation_routes(cost);

CREATE INDEX IF NOT EXISTS idx_navigation_segments_route_id ON navigation_segments(route_id);
CREATE INDEX IF NOT EXISTS idx_navigation_segments_transportation ON navigation_segments(transportation);

CREATE INDEX IF NOT EXISTS idx_navigation_stops_segment_id ON navigation_stops(segment_id);

-- 启用行级安全策略

ALTER TABLE navigation_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_stops ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略

-- 用户只能查看自己的导航查询记录
CREATE POLICY "Users can view own navigation queries" ON navigation_queries
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的导航查询记录
CREATE POLICY "Users can insert own navigation queries" ON navigation_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的导航查询记录
CREATE POLICY "Users can update own navigation queries" ON navigation_queries
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的导航查询记录
CREATE POLICY "Users can delete own navigation queries" ON navigation_queries
  FOR DELETE USING (auth.uid() = user_id);

-- 用户可以查看所有导航路线（通过查询记录关联）
CREATE POLICY "Users can view navigation routes through queries" ON navigation_routes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM navigation_queries 
      WHERE navigation_queries.id = navigation_routes.query_id 
      AND navigation_queries.user_id = auth.uid()
    )
  );

-- 用户可以插入导航路线（通过查询记录关联）
CREATE POLICY "Users can insert navigation routes through queries" ON navigation_routes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM navigation_queries 
      WHERE navigation_queries.id = navigation_routes.query_id 
      AND navigation_queries.user_id = auth.uid()
    )
  );

-- 用户可以查看所有导航路段（通过查询记录关联）
CREATE POLICY "Users can view navigation segments through queries" ON navigation_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM navigation_queries 
      WHERE navigation_queries.id = (
        SELECT query_id FROM navigation_routes 
        WHERE navigation_routes.id = navigation_segments.route_id
      )
      AND navigation_queries.user_id = auth.uid()
    )
  );

-- 用户可以插入导航路段（通过查询记录关联）
CREATE POLICY "Users can insert navigation segments through queries" ON navigation_segments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM navigation_queries 
      WHERE navigation_queries.id = (
        SELECT query_id FROM navigation_routes 
        WHERE navigation_routes.id = navigation_segments.route_id
      )
      AND navigation_queries.user_id = auth.uid()
    )
  );

-- 用户可以查看所有导航站点（通过查询记录关联）
CREATE POLICY "Users can view navigation stops through queries" ON navigation_stops
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM navigation_queries 
      WHERE navigation_queries.id = (
        SELECT query_id FROM navigation_routes 
        WHERE navigation_routes.id = (
          SELECT route_id FROM navigation_segments 
          WHERE navigation_segments.id = navigation_stops.segment_id
        )
      )
      AND navigation_queries.user_id = auth.uid()
    )
  );

-- 用户可以插入导航站点（通过查询记录关联）
CREATE POLICY "Users can insert navigation stops through queries" ON navigation_stops
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM navigation_queries 
      WHERE navigation_queries.id = (
        SELECT query_id FROM navigation_routes 
        WHERE navigation_routes.id = (
          SELECT route_id FROM navigation_segments 
          WHERE navigation_segments.id = navigation_stops.segment_id
        )
      )
      AND navigation_queries.user_id = auth.uid()
    )
  );

-- 创建更新时间戳的触发器函数

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为导航查询表创建更新时间戳的触发器

CREATE TRIGGER update_navigation_queries_updated_at 
  BEFORE UPDATE ON navigation_queries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();