# 导航服务数据库设计文档

## 概述

本文档详细说明了AI旅行规划应用中导航服务的数据库设计，包括表结构、关系、安全策略和使用方法。

## 数据库表结构

### 1. navigation_queries 表

存储用户的导航查询记录和基本信息。

```sql
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
```

**字段说明：**
- `id`: 查询记录的唯一标识符
- `user_id`: 用户ID，关联到auth.users表
- `origin`: 出发地
- `destination`: 目的地
- `departure_date`: 出发日期（可选）
- `departure_time`: 出发时间（可选）
- `query_time`: 查询时间
- `routes_count`: 返回的路线方案数量
- `total_distance`: 所有路线的总距离（米）
- `total_duration`: 所有路线的总时间（秒）
- `min_cost`: 所有路线中的最低费用（元）
- `created_at`: 记录创建时间
- `updated_at`: 记录更新时间

### 2. navigation_routes 表

存储每个查询结果中的具体路线方案。

```sql
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
```

**字段说明：**
- `id`: 路线记录的唯一标识符
- `query_id`: 关联的查询记录ID
- `route_index`: 路线在查询结果中的索引（从0开始）
- `distance`: 路线总距离（米）
- `duration`: 路线总时间（秒）
- `cost`: 路线费用（元）
- `walking_distance`: 步行距离（米）
- `transit_distance`: 公交距离（米）
- `restrictions`: 路线限制条件数组
- `created_at`: 记录创建时间

### 3. navigation_segments 表

存储每条路线的具体路段信息。

```sql
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
```

**字段说明：**
- `id`: 路段记录的唯一标识符
- `route_id`: 关联的路线记录ID
- `segment_index`: 路段在路线中的索引（从0开始）
- `transportation`: 交通方式（如：步行、公交、地铁）
- `origin`: 路段起点名称
- `destination`: 路段终点名称
- `distance`: 路段距离（米）
- `duration`: 路段时间（秒）
- `instructions`: 路段指令列表
- `vehicle`: 车辆信息（如：地铁1号线）
- `departure_stop_name`: 上车站点名称
- `departure_stop_location`: 上车站点坐标（PostGIS POINT类型）
- `arrival_stop_name`: 下车站点名称
- `arrival_stop_location`: 下车站点坐标（PostGIS POINT类型）
- `created_at`: 记录创建时间

### 4. navigation_stops 表

存储公交/地铁线路的途经站点信息。

```sql
CREATE TABLE IF NOT EXISTS navigation_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES navigation_segments(id) ON DELETE CASCADE,
  stop_index INTEGER NOT NULL, -- 站点在路段中的索引
  name TEXT NOT NULL, -- 站点名称
  location POINT, -- 站点坐标
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**字段说明：**
- `id`: 站点记录的唯一标识符
- `segment_id`: 关联的路段记录ID
- `stop_index`: 站点在路段中的索引（从0开始）
- `name`: 站点名称
- `location`: 站点坐标（PostGIS POINT类型）
- `created_at`: 记录创建时间

## 数据库关系图

```
navigation_queries (1) -----> (N) navigation_routes (1) -----> (N) navigation_segments (1) -----> (N) navigation_stops
      |                                                                                             |
      |                                                                                             |
      |---- auth.users (1)                                                                          |
                                                                                                    |
```

## 索引设计

为了提高查询性能，我们为表创建了以下索引：

```sql
-- navigation_queries 表索引
CREATE INDEX IF NOT EXISTS idx_navigation_queries_user_id ON navigation_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_navigation_queries_query_time ON navigation_queries(query_time DESC);
CREATE INDEX IF NOT EXISTS idx_navigation_queries_origin_destination ON navigation_queries(origin, destination);

-- navigation_routes 表索引
CREATE INDEX IF NOT EXISTS idx_navigation_routes_query_id ON navigation_routes(query_id);
CREATE INDEX IF NOT EXISTS idx_navigation_routes_cost ON navigation_routes(cost);

-- navigation_segments 表索引
CREATE INDEX IF NOT EXISTS idx_navigation_segments_route_id ON navigation_segments(route_id);
CREATE INDEX IF NOT EXISTS idx_navigation_segments_transportation ON navigation_segments(transportation);

-- navigation_stops 表索引
CREATE INDEX IF NOT EXISTS idx_navigation_stops_segment_id ON navigation_stops(segment_id);
```

## 安全策略

我们为所有表启用了行级安全策略（RLS），确保用户只能访问自己的导航数据：

### navigation_queries 表策略

```sql
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
```

### navigation_routes 表策略

```sql
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
```

### navigation_segments 表策略

```sql
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
```

### navigation_stops 表策略

```sql
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
```

## 触发器

为了自动更新记录的修改时间，我们创建了一个触发器：

```sql
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
```

## API 操作

### 保存导航查询结果

```typescript
// src/lib/navigation/navigation-db.ts
export async function saveNavigationQuery(result: NavigationResult): Promise<string> {
  // 实现保存导航查询结果的逻辑
  // 包括保存查询记录、路线、路段和站点信息
}
```

### 获取导航历史记录

```typescript
// src/lib/navigation/navigation-db.ts
export async function getNavigationHistory(limit: number = 10): Promise<NavigationQueryRecord[]> {
  // 实现获取用户导航历史记录的逻辑
}
```

### 获取导航查询详情

```typescript
// src/lib/navigation/navigation-db.ts
export async function getNavigationQueryResult(queryId: string): Promise<NavigationResult | null> {
  // 实现获取特定导航查询详情的逻辑
  // 包括查询记录、路线、路段和站点信息
}
```

## 使用示例

### 保存导航查询

```typescript
// 导航查询结果
const navigationResult: NavigationResult = {
  query: {
    origin: "北京市朝阳区",
    destination: "北京市海淀区",
    departureDate: "2023-12-01",
    departureTime: "09:00"
  },
  routes: [
    {
      routeId: "route_0",
      origin: "北京市朝阳区",
      destination: "北京市海淀区",
      distance: 12500,
      duration: 2700,
      cost: 5.0,
      walkingDistance: 1200,
      transitDistance: 11300,
      restrictions: [],
      segments: [
        {
          transportation: "步行",
          origin: "朝阳区A站",
          destination: "朝阳区B站",
          distance: 500,
          duration: 300,
          instructions: ["向北步行300米", "右转进入朝阳路", "步行200米到B站"]
        },
        {
          transportation: "地铁",
          origin: "朝阳区B站",
          destination: "海淀区C站",
          distance: 10000,
          duration: 1800,
          instructions: ["乘坐地铁10号线", "经过8站到达C站"],
          vehicle: "地铁10号线",
          viaStops: [
            { name: "朝阳门站", location: { lng: 116.434, lat: 39.928 } },
            { name: "东直门站", location: { lng: 116.434, lat: 39.948 } }
          ]
        },
        {
          transportation: "步行",
          origin: "海淀区C站",
          destination: "海淀区D站",
          distance: 700,
          duration: 600,
          instructions: ["出站向南步行", "经过十字路口", "到达目的地"]
        }
      ]
    }
  ]
};

// 保存到数据库
const queryId = await saveNavigationQuery(navigationResult);
console.log(`导航查询已保存，ID: ${queryId}`);
```

### 获取导航历史

```typescript
// 获取最近的10条导航历史
const history = await getNavigationHistory(10);
console.log("导航历史记录:", history);
```

### 获取导航详情

```typescript
// 获取特定导航查询的详情
const queryId = "123e4567-e89b-12d3-a456-426614174000";
const result = await getNavigationQueryResult(queryId);
if (result) {
  console.log("导航查询详情:", result);
} else {
  console.log("未找到导航查询");
}
```

## 注意事项

1. **PostGIS扩展**：导航数据库使用了PostGIS的POINT类型存储坐标，确保PostgreSQL已安装PostGIS扩展。

2. **API限制**：导航功能依赖于高德地图API，请注意API的调用限制和费用。

3. **数据隐私**：导航数据包含用户的位置信息，已通过RLS策略确保用户只能访问自己的数据。

4. **性能考虑**：对于大量历史数据，考虑添加分页和缓存机制。

5. **数据清理**：考虑定期清理旧的导航数据，避免数据库膨胀。

## 迁移脚本

导航数据库表的迁移脚本位于：`supabase/migrations/20251101_create_navigation_tables.sql`

如需应用此迁移，请运行：

```bash
supabase db push
```

## 总结

导航服务的数据库设计采用了分层结构，将导航查询、路线、路段和站点分别存储在不同的表中，通过外键关联。这种设计既保证了数据的规范性，又提供了良好的查询性能。同时，通过行级安全策略确保了用户数据的安全性和隐私性。