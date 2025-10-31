# 相对日期模式

## 🎯 功能说明

现在旅行计划支持**相对日期模式**，用户只需提供**目的地和天数**，无需指定具体的开始/结束日期！

## 🆚 两种模式对比

### 1. 绝对日期模式（原有功能）

**用户输入**：
- 目的地：北京
- 开始日期：2025-11-01
- 结束日期：2025-11-03

**生成结果**：
```json
{
  "title": "北京3日游",
  "startDate": "2025-11-01",
  "endDate": "2025-11-03",
  "days": 3,
  "itinerary": [
    {
      "day": 1,
      "date": "2025-11-01",
      "title": "探索天安门",
      "activities": [...]
    },
    {
      "day": 2,
      "date": "2025-11-02",
      "title": "游览故宫",
      "activities": [...]
    },
    {
      "day": 3,
      "date": "2025-11-03",
      "title": "长城之旅",
      "activities": [...]
    }
  ]
}
```

### 2. 相对日期模式（新功能）⭐

**用户输入**：
- 目的地：北京
- 天数：3天
- ❌ 不需要具体日期！

**生成结果**：
```json
{
  "title": "北京3日游",
  "days": 3,
  "itinerary": [
    {
      "day": 1,
      "date": "第1天",
      "title": "探索天安门",
      "activities": [...]
    },
    {
      "day": 2,
      "date": "第2天",
      "title": "游览故宫",
      "activities": [...]
    },
    {
      "day": 3,
      "date": "第3天",
      "title": "长城之旅",
      "activities": [...]
    }
  ]
}
```

## 🎤 语音输入示例

### 标准描述（推荐）

**语音**：
> "我想去北京旅游三天，预算五千元，喜欢历史文化和美食"

**解析结果**：
- ✅ 目的地：北京
- ✅ 天数：3天
- ✅ 预算：5000元
- ✅ 兴趣：历史文化、美食
- ❌ 无具体日期 → 使用相对日期模式

### 简洁描述

**语音**：
> "去杭州玩两天"

**解析结果**：
- ✅ 目的地：杭州
- ✅ 天数：2天
- ❌ 无具体日期 → 使用相对日期模式

### 详细描述

**语音**：
> "我和家人想去三亚度假五天，喜欢海滩和水上运动，预算一万左右"

**解析结果**：
- ✅ 目的地：三亚
- ✅ 天数：5天
- ✅ 人数：2人（我和家人）
- ✅ 兴趣：海滩、水上运动
- ✅ 预算：10000元
- ❌ 无具体日期 → 使用相对日期模式

## 🔧 技术实现

### 类型定义更新

```typescript
// TravelPlanInput - 用户输入
export interface TravelPlanInput {
  destination: string;       // 必需
  startDate?: string;         // 可选 ⭐
  endDate?: string;           // 可选 ⭐
  days?: number;              // 可选（如果没有具体日期）
  budget?: number;
  // ...
}

// TravelPlan - 生成的计划
export interface TravelPlan {
  title: string;
  destination: string;
  startDate?: string;         // 可选 ⭐
  endDate?: string;           // 可选 ⭐
  days: number;               // 必需
  itinerary: ItineraryDay[];
  // ...
}

// ItineraryDay - 每天的行程
export interface ItineraryDay {
  day: number;
  date?: string;              // 可选（可以是具体日期或"第X天"）⭐
  title: string;
  activities: Activity[];
  // ...
}
```

### 天数计算逻辑

```typescript
// 支持两种方式计算天数
let days: number;
if (input.startDate && input.endDate) {
  // 方式1：从具体日期计算
  days = differenceInDays(new Date(input.endDate), new Date(input.startDate)) + 1;
} else if (input.days) {
  // 方式2：直接使用天数
  days = input.days;
} else {
  throw new Error('请提供开始/结束日期或天数');
}
```

### 日期字符串生成

```typescript
// 计算日期（如果有具体日期）或使用相对日期
let dateStr: string;
if (input.startDate) {
  // 绝对日期模式：计算具体日期
  const currentDate = new Date(input.startDate);
  currentDate.setDate(currentDate.getDate() + dayNumber - 1);
  dateStr = format(currentDate, 'yyyy-MM-dd');  // "2025-11-01"
} else {
  // 相对日期模式：使用相对描述
  dateStr = `第${dayNumber}天`;  // "第1天"
}
```

### AI 提示词适配

```typescript
// 根据模式调整提示词
let prompt = `生成第${dayNumber}天行程

目的地：${input.destination}
${input.startDate ? `日期：${dateStr}` : `相对日期：${dateStr}`}
预算：${input.budget || 1000}元

返回格式：
{"day":${dayNumber}${input.startDate ? `,"date":"${dateStr}"` : ''},"title":"主题",...}

${input.startDate 
  ? 'date字段必须是 yyyy-MM-dd 格式的具体日期' 
  : 'date字段可以省略，因为使用相对日期模式'}
`;
```

### 验证逻辑更新

```typescript
export function validateTravelPlan(plan: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 必需字段检查
  if (!plan.title) errors.push('缺少标题');
  if (!plan.destination) errors.push('缺少目的地');
  if (!plan.days) errors.push('缺少天数');
  
  // ✅ startDate 和 endDate 现在是可选的
  
  if (!plan.itinerary || !Array.isArray(plan.itinerary)) {
    errors.push('缺少行程数组');
  }
  
  return { valid: errors.length === 0, errors };
}
```

## 💡 使用场景

### 场景 1：灵活规划

**适合人群**：还没确定具体日期的用户

**语音输入**：
> "我想去丽江玩四天，喜欢古城和自然风光"

**优势**：
- 先生成行程方案
- 确定满意后再选择具体日期
- 可以多次调整

### 场景 2：模板参考

**适合人群**：想要一个通用的行程模板

**语音输入**：
> "去日本东京五天，喜欢动漫和美食"

**优势**：
- 生成通用的"东京5日游"模板
- 适用于任何时间段
- 可以分享给其他人参考

### 场景 3：快速规划

**适合人群**：想快速了解需要几天

**语音输入**：
> "去西安旅游，想看兵马俑和古城墙"

**AI 建议**：
- 根据景点推荐天数（如3天）
- 生成相对日期的行程
- 用户可以根据实际情况调整

## 🎨 UI 显示

### 绝对日期模式显示

```
📅 北京3日游
🗓️ 2025-11-01 至 2025-11-03

Day 1 - 2025-11-01 - 探索天安门
  09:00 天安门广场
  14:00 故宫博物院
  ...

Day 2 - 2025-11-02 - 游览故宫
  ...
```

### 相对日期模式显示

```
📅 北京3日游
⏱️ 共3天行程

第1天 - 探索天安门
  09:00 天安门广场
  14:00 故宫博物院
  ...

第2天 - 游览故宫
  ...
```

## ✅ 优势

### 1. **更灵活**
- 不需要立即确定出发日期
- 可以先规划行程内容

### 2. **更简单**
- 语音输入更自然
- 不用说"从某月某日到某月某日"

### 3. **更通用**
- 生成的行程可以重复使用
- 适用于任何时间段

### 4. **更快速**
- 减少了日期选择的步骤
- 专注于行程内容本身

## 🧪 测试用例

### 测试 1：纯相对日期

**输入**：
```json
{
  "destination": "北京",
  "days": 3,
  "budget": 5000
}
```

**预期输出**：
```json
{
  "title": "北京3日游",
  "days": 3,
  "startDate": undefined,
  "endDate": undefined,
  "itinerary": [
    { "day": 1, "date": "第1天", ... },
    { "day": 2, "date": "第2天", ... },
    { "day": 3, "date": "第3天", ... }
  ]
}
```

### 测试 2：绝对日期（向后兼容）

**输入**：
```json
{
  "destination": "北京",
  "startDate": "2025-11-01",
  "endDate": "2025-11-03",
  "budget": 5000
}
```

**预期输出**：
```json
{
  "title": "北京3日游",
  "days": 3,
  "startDate": "2025-11-01",
  "endDate": "2025-11-03",
  "itinerary": [
    { "day": 1, "date": "2025-11-01", ... },
    { "day": 2, "date": "2025-11-02", ... },
    { "day": 3, "date": "2025-11-03", ... }
  ]
}
```

### 测试 3：语音输入（相对日期）

**语音**：
> "我想去北京旅游三天，预算五千元"

**解析结果**：
```json
{
  "destination": "北京",
  "days": 3,
  "budget": 5000,
  "missingFields": [],
  "confidence": "high"
}
```

**生成计划**：相对日期模式 ✅

## 📋 注意事项

### 1. 保存到数据库

- 相对日期模式的计划也可以正常保存
- `start_date` 和 `end_date` 字段为 `null`
- `days` 字段记录天数

### 2. 向后兼容

- 旧的绝对日期模式完全保留
- 可以自动识别使用哪种模式

### 3. 未来扩展

**可以添加**：
- "转换为具体日期" 功能
- 用户可以在相对日期计划上指定开始日期
- 自动转换为绝对日期模式

---

**更新时间**: 2025-10-31  
**版本**: v1.0  
**状态**: ✅ 已实现

