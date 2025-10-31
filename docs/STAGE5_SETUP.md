# 第五阶段：费用预算与管理

## 🎯 目标

实现旅行费用的记录、分析和管理功能，包括：
1. 费用记录管理（添加、编辑、删除、查看）
2. **语音记账**功能（复用科大讯飞 API）
3. **AI 智能分类**（使用 DeepSeek）
4. 费用统计和可视化
5. 预算对比和超支预警

---

## 📊 功能清单

### 1. 费用记录管理 ✅
- [x] 数据库表已存在（`expenses`）
- [ ] 创建费用类型定义
- [ ] 实现 CRUD API 路由
- [ ] 创建费用列表组件
- [ ] 创建添加/编辑费用表单

### 2. 语音记账 🎤
- [x] 科大讯飞 API 已配置
- [ ] 创建语音记账解析器（AI 提取费用信息）
- [ ] 集成到费用表单
- [ ] 语音输入示例："今天午餐花了 68 块"

### 3. AI 智能功能 🤖
- [x] DeepSeek API 已配置
- [ ] 自动分类费用（从描述推断类别）
- [ ] 智能预算建议
- [ ] 费用异常检测

### 4. 数据可视化 📈
- [ ] 安装图表库（recharts）
- [ ] 费用统计卡片
- [ ] 分类饼图
- [ ] 预算对比柱状图
- [ ] 时间趋势折线图

### 5. 预算管理 💰
- [ ] 预算设置功能
- [ ] 实际 vs 预算对比
- [ ] 超支预警提示
- [ ] 剩余预算展示

---

## 🗄️ 数据库设计

### Expenses 表（已存在）

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES travel_plans(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,  -- 费用类别
  amount DECIMAL(10, 2) NOT NULL, -- 金额
  description TEXT,               -- 描述
  date DATE NOT NULL,             -- 日期
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_expenses_plan_id ON expenses(plan_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
```

### 费用类别

```typescript
export type ExpenseCategory = 
  | 'transportation'  // 交通
  | 'accommodation'   // 住宿
  | 'food'            // 餐饮
  | 'attraction'      // 门票/景点
  | 'shopping'        // 购物
  | 'entertainment'   // 娱乐
  | 'other';          // 其他
```

---

## 🔧 技术栈

### 新增依赖

```bash
npm install recharts           # 图表库
npm install date-fns           # 日期处理（已安装）
```

### 已有资源
- ✅ 科大讯飞语音识别 API
- ✅ DeepSeek AI API
- ✅ Supabase 数据库
- ✅ React Hook Form + Zod

---

## 📁 文件结构

```
src/
├── types/
│   └── expense.types.ts          # 费用类型定义
├── lib/
│   └── ai/
│       └── expense-parser.ts     # AI 解析费用信息
├── app/
│   └── api/
│       └── expenses/
│           ├── route.ts          # 获取费用列表
│           ├── [id]/route.ts    # 获取/更新/删除单个费用
│           └── parse-voice/route.ts  # 语音解析费用
├── components/
│   └── features/
│       └── expenses/
│           ├── expense-list.tsx      # 费用列表
│           ├── expense-form.tsx      # 添加/编辑表单
│           ├── expense-card.tsx      # 费用卡片
│           ├── expense-stats.tsx     # 统计卡片
│           ├── expense-chart.tsx     # 图表组件
│           └── voice-expense.tsx     # 语音记账
└── hooks/
    ├── use-expenses.ts           # 费用管理 Hook
    └── use-expense-stats.ts      # 统计数据 Hook
```

---

## 🎨 UI 设计

### 1. 费用列表页面

```
┌─────────────────────────────────────────────┐
│  📊 费用管理                    [+ 添加费用] │
├─────────────────────────────────────────────┤
│  统计卡片行                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │总支出│ │预算  │ │剩余  │ │记录  │      │
│  │¥3580│ │¥5000│ │¥1420│ │  25  │      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
├─────────────────────────────────────────────┤
│  图表行                                      │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ 分类饼图     │  │ 每日趋势图   │        │
│  └──────────────┘  └──────────────┘        │
├─────────────────────────────────────────────┤
│  费用记录列表                                │
│  ┌─────────────────────────────────────┐   │
│  │ 🍽️ 午餐        2025-11-01  ¥68    │   │
│  │    宽窄巷子火锅                      │   │
│  ├─────────────────────────────────────┤   │
│  │ 🎫 门票        2025-11-01  ¥120   │   │
│  │    熊猫基地门票                      │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 2. 添加费用对话框

```
┌─────────────────────────────────────┐
│  添加费用                     [×]   │
├─────────────────────────────────────┤
│  选择输入方式：                      │
│  [ 语音输入 ] [ 手动输入 ]          │
├─────────────────────────────────────┤
│  语音输入：                          │
│  ┌───────────────────────────────┐  │
│  │ 🎤 点击开始语音输入           │  │
│  │                               │  │
│  │ "今天午餐在宽窄巷子火锅花了   │  │
│  │  68 块"                       │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  AI 解析结果：                       │
│  类别：[ 餐饮 ▼ ]                   │
│  金额：[ 68 ]                       │
│  描述：[ 宽窄巷子火锅 ]             │
│  日期：[ 2025-11-01 ]               │
├─────────────────────────────────────┤
│  [ 取消 ]              [ 保存 ]     │
└─────────────────────────────────────┘
```

---

## 🔊 语音记账示例

### 支持的语音格式

```
✅ "今天午餐花了 68 块"
   → category: food, amount: 68, date: today

✅ "昨天住酒店 350 元"
   → category: accommodation, amount: 350, date: yesterday

✅ "打车去机场 120"
   → category: transportation, amount: 120, date: today

✅ "买了一件衣服 298"
   → category: shopping, amount: 298, date: today

✅ "熊猫基地门票 120 块"
   → category: attraction, amount: 120, description: 熊猫基地门票
```

### AI 解析流程

```typescript
// 用户语音 → 文本
"今天午餐在宽窄巷子花了 68 块"

// AI 解析
{
  "category": "food",        // 从"午餐"推断
  "amount": 68,              // 提取数字
  "description": "宽窄巷子午餐",  // 提取地点和场景
  "date": "2025-11-01"       // "今天"转为日期
}
```

---

## 🤖 AI 智能功能

### 1. 自动分类

```typescript
// 输入：描述文本
"在星巴克喝了一杯咖啡"

// AI 分析
{
  category: "food",          // 咖啡 → 餐饮
  suggestedAmount: 35,       // 根据常识估算
  tags: ["饮品", "咖啡店"]
}
```

### 2. 异常检测

```typescript
// 场景：单笔费用过高
{
  amount: 5000,
  category: "food",
  alert: "餐饮费用异常偏高，请确认金额是否正确"
}

// 场景：频繁消费
{
  sameDayCount: 8,
  category: "shopping",
  alert: "今日购物次数较多，注意控制支出"
}
```

### 3. 智能建议

```typescript
{
  totalSpent: 4500,
  budget: 5000,
  remaining: 500,
  daysLeft: 2,
  suggestion: "剩余预算较少，建议每天控制在 ¥250 以内"
}
```

---

## 📈 数据可视化

### 1. 分类饼图

```typescript
{
  categories: [
    { name: "交通", value: 1200, color: "#3b82f6" },
    { name: "住宿", value: 1500, color: "#8b5cf6" },
    { name: "餐饮", value: 800, color: "#10b981" },
    { name: "门票", value: 300, color: "#f59e0b" },
    { name: "其他", value: 200, color: "#6b7280" }
  ]
}
```

### 2. 每日趋势

```typescript
{
  data: [
    { date: "11-01", amount: 650 },
    { date: "11-02", amount: 890 },
    { date: "11-03", amount: 720 }
  ]
}
```

### 3. 预算对比

```typescript
{
  categories: [
    { name: "交通", budget: 1500, actual: 1200 },
    { name: "住宿", budget: 2000, actual: 1500 },
    { name: "餐饮", budget: 1000, actual: 800 }
  ]
}
```

---

## 🔐 权限控制

### RLS 策略

```sql
-- 用户只能查看自己计划的费用
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM travel_plans
      WHERE travel_plans.id = expenses.plan_id
      AND travel_plans.user_id = auth.uid()
    )
  );

-- 用户只能添加费用到自己的计划
CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM travel_plans
      WHERE travel_plans.id = expenses.plan_id
      AND travel_plans.user_id = auth.uid()
    )
  );
```

---

## 🧪 测试场景

### 1. 手动添加费用
- [ ] 填写所有字段
- [ ] 提交保存
- [ ] 查看费用列表
- [ ] 编辑费用
- [ ] 删除费用

### 2. 语音记账
- [ ] 录音："今天午餐花了 68 块"
- [ ] AI 解析正确
- [ ] 确认保存
- [ ] 列表显示

### 3. 统计图表
- [ ] 总支出计算正确
- [ ] 预算对比准确
- [ ] 图表显示正常
- [ ] 响应式布局

### 4. 边界情况
- [ ] 金额为 0
- [ ] 描述为空
- [ ] 未来日期
- [ ] 超出预算

---

## 📝 开发步骤

### 第一步：类型定义和基础设置
1. 创建 `expense.types.ts`
2. 定义费用相关接口
3. 安装 recharts

### 第二步：API 路由
1. 创建 `/api/expenses` 路由（列表/添加）
2. 创建 `/api/expenses/[id]` 路由（获取/更新/删除）
3. 创建 `/api/expenses/parse-voice` 路由（语音解析）

### 第三步：AI 解析器
1. 创建 `expense-parser.ts`
2. 实现语音文本解析
3. 实现智能分类

### 第四步：UI 组件
1. 创建费用列表组件
2. 创建添加/编辑表单
3. 集成语音输入
4. 创建统计卡片

### 第五步：数据可视化
1. 创建图表组件
2. 实现数据统计逻辑
3. 响应式设计

### 第六步：集成测试
1. 完整流程测试
2. 性能优化
3. 错误处理

---

## 🎯 验收标准

- [ ] 可以手动添加费用记录
- [ ] 可以通过语音添加费用
- [ ] AI 能够正确解析语音内容
- [ ] 统计数据准确
- [ ] 图表显示正常
- [ ] 预算对比功能正常
- [ ] 响应式设计良好
- [ ] 无 Linter 错误
- [ ] 通过所有测试场景

---

**准备开始开发！** 🚀

下一步：创建类型定义和安装依赖。

