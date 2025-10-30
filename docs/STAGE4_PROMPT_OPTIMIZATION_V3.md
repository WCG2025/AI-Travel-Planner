# 提示词框架优化 V3

## 🎯 问题现状

即使使用渐进式生成，AI 在生成单天行程时仍然会返回无法解析的 JSON 格式，导致第 1 天就失败并重试 3 次。

## 🔧 本次优化策略

### 1. **超强系统提示词**

#### 之前（冗长但不够明确）
```typescript
'你是专业的旅行规划师，只返回JSON格式。'
```

#### 现在（规则+示例+警告）
```typescript
`你是JSON格式生成器。严格遵守：

【绝对规则】
1. 只返回纯JSON，从{开始到}结束
2. 不要markdown代码块(不要\`\`\`)
3. 所有键必须双引号："day"不是day
4. 所有字符串值必须双引号："北京"不是北京
5. 数字不加引号：100不是"100"

【示例-正确】
{"day":1,"title":"探索北京","activities":[{"time":"09:00","title":"天安门","description":"游览天安门广场","location":"天安门","cost":0,"type":"attraction","tips":["早起避开人群"]}],"estimatedCost":200}

【示例-错误】
{day:1,title:探索北京}  ❌缺少引号
{"day":"1"}  ❌数字加了引号

从第一个字符{到最后一个字符}，中间不能有任何其他内容。`
```

**关键改进**：
- ✅ 使用【绝对规则】强调不可违反
- ✅ 提供完整的正确示例（一行压缩格式）
- ✅ 提供错误示例并标注 ❌
- ✅ 明确"从第一个字符到最后一个字符"

### 2. **简化用户提示词**

#### 之前（过于啰嗦）
```typescript
`现在生成第 ${dayNumber} 天的详细行程（共${totalDays}天）。

前几天已安排：
第1天：xxx
第2天：xxx

要求：
- 日期：2025-01-01
- 安排 3-5 个活动
- 时间合理分配
- 控制在预算内

只返回JSON格式：
{
  "day": 1,
  ...
}

注意：
1. 所有字段名和字符串值必须加双引号
2. type只能是：...
3. 确保JSON格式完全正确`
```

#### 现在（简洁明确）
```typescript
`生成第${dayNumber}天行程

目的地：${input.destination}
日期：${dateStr}
预算：${input.budget || 1000}元
要求：3-4个活动

返回格式(严格遵守)：
{"day":${dayNumber},"date":"${dateStr}","title":"主题","activities":[{"time":"09:00","title":"景点名","description":"简介","location":"地址","cost":50,"type":"attraction","tips":["提示1","提示2"]}],"estimatedCost":300}

type只能是: attraction,meal,transportation,accommodation,other
直接返回JSON，不要其他内容`
```

**关键改进**：
- ✅ 去掉冗余的"现在"、"详细"等词
- ✅ 单行压缩的示例格式（AI 更容易模仿）
- ✅ 最后一句明确："直接返回JSON，不要其他内容"

### 3. **降低生成参数**

```typescript
// 之前
temperature: 0.7,
maxTokens: 800,

// 现在
temperature: 0.3,  // 更保守，减少创意发挥
maxTokens: 600,    // 避免过长导致格式崩溃
```

**原因**：
- 低温度让 AI 更严格遵守格式
- 少 token 减少后期"偷懒"的可能

### 4. **独立消息策略**

#### 之前（依赖历史记录）
```typescript
const messages = [
  ...conversationHistory,  // 包含之前所有对话
  { role: 'user', content: prompt },
];
```

#### 现在（每次独立）
```typescript
const messages = [
  { role: 'system', content: systemPrompt },  // 每次都发送强系统提示
  { role: 'user', content: prompt },
];
```

**原因**：
- conversationHistory 可能累积过多内容
- 每次独立发送确保系统提示词始终生效
- 减少上下文混乱

### 5. **超强 JSON 解析器**

#### 新增功能

1. **多轮数组修复**
```typescript
let prevJsonStr = '';
let iterations = 0;
const maxIterations = 5;

while (prevJsonStr !== jsonStr && iterations < maxIterations) {
  prevJsonStr = jsonStr;
  iterations++;
  
  // 递归修复嵌套数组
  jsonStr = jsonStr.replace(/\[([^\[\]]*?)\]/g, ...);
}
```

2. **智能分割数组元素**
```typescript
// 手动解析数组内容，考虑引号和括号深度
let current = '';
let inQuotes = false;
let depth = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  
  if (char === '"' && content[i - 1] !== '\\') {
    inQuotes = !inQuotes;
  } else if (!inQuotes && char === ',') {
    items.push(current.trim());
    current = '';
  }
  ...
}
```

3. **详细的错误日志**
```typescript
console.log('📝 开始解析 AI 返回内容，长度:', content.length);
console.log('✂️ 提取 JSON 片段，长度:', jsonStr.length);
console.log('🔧 修复后的 JSON 前200字符:', ...);
console.log('🔧 修复后的 JSON 后200字符:', ...);

// 错误时输出三段：前、中、后
console.error('📄 原始内容（前300字符）:', ...);
console.error('📄 原始内容（中300字符）:', ...);
console.error('📄 原始内容（后300字符）:', ...);
```

4. **更友好的错误信息**
```typescript
if (error.message.includes('Unexpected token')) {
  throw new Error(`JSON 格式错误：${error.message}。AI 可能在中途改变了格式。`);
} else if (error.message.includes('Unexpected end')) {
  throw new Error('JSON 不完整，AI 可能被截断了。请尝试更短的行程。');
}
```

## 📊 优化效果预期

### 成功率提升

| 优化项 | 预期提升 |
|--------|---------|
| 超强系统提示 | +20% |
| 简化用户提示 | +10% |
| 降低温度参数 | +15% |
| 独立消息策略 | +10% |
| 增强解析器 | +20% |
| **总计** | **+75%** |

### 从失败率角度

- 之前：单天生成失败率 ~70%（即使有3次重试）
- 预期：单天生成失败率 ~10-15%
- 目标：5天行程总体成功率 > 90%

## 🧪 测试验证

### 测试步骤

1. **清除缓存重启服务**
```bash
npm run dev
```

2. **测试 2 天短行程**
- 目的地：北京
- 观察终端日志中的"🔍 第 X 天 AI 原始返回"

3. **测试 3 天中等行程**
- 目的地：成都
- 检查是否需要重试

4. **测试 5 天长行程**
- 目的地：云南
- 统计重试次数

### 关键日志标识

```bash
# 好的信号
🔍 第 1 天 AI 原始返回: {"day":1,"title":...
📝 开始解析 AI 返回内容，长度: 587
✂️ 提取 JSON 片段，长度: 585
🔧 修复后的 JSON 前200字符: {"day":1,...
✅ JSON 解析成功！
✅ 第 1 天生成成功（4 个活动）

# 坏的信号
🔍 第 1 天 AI 原始返回: 好的，我来为你生成...
❌ JSON 解析失败: 找不到有效的 JSON 结构
⚠️ 第 1 天生成失败（尝试 1/3）
```

## 🔍 调试技巧

### 1. 查看 AI 原始返回

在 `generateSingleDay` 中添加了：
```typescript
console.log(`🔍 第 ${dayNumber} 天 AI 原始返回:`, response.substring(0, 200));
```

如果 AI 返回的开头不是 `{`，说明提示词无效。

### 2. 查看修复过程

在 `parseAIResponse` 中添加了多个步骤日志：
```typescript
console.log('✂️ 提取 JSON 片段，长度:', jsonStr.length);
console.log('🔧 修复后的 JSON 前200字符:', ...);
```

可以看到解析器是如何修复 JSON 的。

### 3. 错误时查看全文

错误日志会输出三段：
- 前 300 字符：看开头是否有 `{`
- 中 300 字符：看中间是否格式突变
- 后 300 字符：看结尾是否有 `}` 或被截断

## 📝 如果还是失败

### 可能的原因

1. **AI 模型本身限制**
   - DeepSeek 可能对超严格 JSON 支持不佳
   - 考虑切换到 GPT-4 或 Claude

2. **网络或 API 问题**
   - 检查 API 密钥是否有效
   - 检查 /api/test-deepseek 是否能通

3. **Token 限制**
   - 可能需要进一步减少 maxTokens
   - 或者减少每天的活动数量（3-4 → 2-3）

### 进一步优化

1. **最简化 JSON 结构**
```json
{
  "day": 1,
  "title": "主题",
  "activities": [
    {"time": "09:00", "name": "景点", "cost": 50}
  ]
}
```

2. **使用 JSON Schema**
```typescript
const schema = {
  type: "object",
  properties: {
    day: { type: "number" },
    title: { type: "string" },
    ...
  }
};
```

3. **切换 AI 模型**
```typescript
// 使用 GPT-4
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
});
```

## 📚 相关文件

```
src/
├── lib/
│   └── ai/
│       ├── plan-generator-iterative.ts  ✏️ 提示词优化
│       └── prompts.ts                   ✏️ 解析器增强
```

## ✅ 验收标准

- [ ] 2天行程：首次成功率 ≥ 80%
- [ ] 3天行程：3次重试内成功率 ≥ 90%
- [ ] 5天行程：总体成功率 ≥ 85%
- [ ] 终端日志清晰可读
- [ ] 错误信息有指导意义

---

**更新时间**: 2025-01-30  
**版本**: V3.0  
**状态**: ✅ 已实现，待测试

