# 错误反馈重试机制

## 🎯 核心思想

当 AI 生成的 JSON 格式错误时，不是简单地重试，而是**把错误信息反馈给 AI，让它自己改正**！

这就像一个"对话式调试"过程：
1. AI 第一次尝试生成
2. 如果格式错误，我们告诉它哪里错了
3. AI 根据反馈修正，再次生成
4. 重复直到成功或达到最大重试次数

## 🔄 工作流程

### 传统重试（之前）
```
尝试1 → ❌ 格式错误 → 等待 → 尝试2（从头开始）→ ❌ 又错 → ...
```
**问题**：AI 不知道自己哪里错了，重复犯同样的错误

### 错误反馈重试（现在）
```
尝试1 → ❌ 格式错误
       ↓
  【反馈错误信息】
  - 错误类型：缺少引号
  - 你的输出：{day:1,...}
  - 问题分析：字段名没有加引号
       ↓
尝试2 → ✅ 修正成功！
```
**优势**：AI 能够理解错误，针对性修正

## 🔧 技术实现

### 1. 修改重试逻辑

#### 之前
```typescript
while (!dayItinerary && retries < maxRetries) {
  try {
    dayItinerary = await generateSingleDay(...);
  } catch (error) {
    retries++;
    await sleep(1000);  // 简单等待后重试
  }
}
```

#### 现在
```typescript
let lastError: string | null = null;
let lastResponse: string | null = null;

while (!dayItinerary && retries < maxRetries) {
  try {
    dayItinerary = await generateSingleDay(
      ...,
      lastError,      // ⭐ 传入上次的错误
      lastResponse    // ⭐ 传入上次的输出
    );
  } catch (error: any) {
    retries++;
    lastError = error.message;          // 保存错误信息
    lastResponse = error.rawResponse;   // 保存原始输出
    
    console.log(`🔄 将错误反馈给 AI，让它自己修正...`);
    await sleep(500);
  }
}
```

### 2. 构造反馈提示词

```typescript
if (lastError && lastResponse) {
  console.log(`📮 添加错误反馈：${lastError.substring(0, 100)}`);
  
  // 1. 发送原始请求
  messages.push({ role: 'user', content: prompt });
  
  // 2. AI 的错误响应
  messages.push({ role: 'assistant', content: lastResponse.substring(0, 1000) });
  
  // 3. 错误反馈
  const feedbackPrompt = `❌ 你的上次输出有错误：

【错误信息】
${lastError}

【你的输出片段】
开头：${lastResponse.substring(0, 150)}
...
结尾：${lastResponse.substring(Math.max(0, lastResponse.length - 150))}

【问题分析】
${getFeedbackAnalysis(lastError)}

请严格按照系统提示的格式，重新生成正确的JSON。记住：
1. 从 { 开始，到 } 结束
2. 所有键和字符串值都要双引号
3. 数字不加引号
4. 不要任何其他文字或解释

直接输出正确的JSON：`;
  
  messages.push({ role: 'user', content: feedbackPrompt });
}
```

### 3. 智能问题分析

根据不同的错误类型，给出针对性的分析：

```typescript
function getFeedbackAnalysis(errorMessage: string): string {
  if (errorMessage.includes('找不到有效的 JSON 结构')) {
    return '你没有返回JSON格式！必须从 { 开始，到 } 结束。';
  }
  if (errorMessage.includes('Unexpected token')) {
    return '你的JSON中有语法错误！检查是否所有字符串都加了双引号，是否有多余的逗号。';
  }
  if (errorMessage.includes('Unexpected end')) {
    return '你的JSON不完整！确保大括号和方括号都正确闭合。';
  }
  if (errorMessage.includes('缺少必需字段')) {
    return '你的JSON缺少必需字段（day, date, activities）！';
  }
  if (errorMessage.includes('活动列表为空')) {
    return '你的activities数组是空的！必须包含至少1个活动。';
  }
  return '格式不符合要求，请严格按照示例格式生成。';
}
```

### 4. 保存原始响应到错误对象

```typescript
try {
  const dayData = parseAIResponse(response);
  return dayData as ItineraryDay;
} catch (error: any) {
  // ⭐ 关键：把原始响应附加到错误对象
  error.rawResponse = response;
  throw error;
}
```

这样外层 catch 就能拿到 AI 的原始输出，用于反馈。

## 📊 实际对话示例

### 示例 1: 缺少引号

**第1次尝试**
```
AI 输出: {day:1,title:"北京一日游",activities:[...]}
错误: Unexpected token d
```

**反馈给 AI**
```
❌ 你的上次输出有错误：

【错误信息】
JSON 格式错误：Unexpected token d。AI 可能在中途改变了格式。

【你的输出片段】
开头：{day:1,title:"北京一日游",...

【问题分析】
你的JSON中有语法错误！检查是否所有字符串都加了双引号，是否有多余的逗号。

请严格按照系统提示的格式，重新生成正确的JSON。
```

**第2次尝试**
```
AI 输出: {"day":1,"title":"北京一日游","activities":[...]}
✅ 成功！
```

### 示例 2: 不完整的 JSON

**第1次尝试**
```
AI 输出: {"day":1,"title":"北京一日游","activities":[{"time":"09:00"...
错误: Unexpected end of JSON input
```

**反馈给 AI**
```
❌ 你的上次输出有错误：

【错误信息】
JSON 不完整，AI 可能被截断了。请尝试更短的行程。

【你的输出片段】
开头：{"day":1,"title":"北京一日游","activities":[...
结尾：..."time":"09:00"

【问题分析】
你的JSON不完整！确保大括号和方括号都正确闭合。
```

**第2次尝试**
```
AI 输出: {"day":1,"title":"北京一日游","activities":[...],"estimatedCost":300}
✅ 成功！
```

### 示例 3: 非 JSON 输出

**第1次尝试**
```
AI 输出: 好的，我来为你生成第1天的行程。首先我们去天安门...
错误: 找不到有效的 JSON 结构（缺少大括号）
```

**反馈给 AI**
```
❌ 你的上次输出有错误：

【错误信息】
找不到有效的 JSON 结构（缺少大括号）

【你的输出片段】
开头：好的，我来为你生成第1天的行程。首先我们去天安门...

【问题分析】
你没有返回JSON格式！必须从 { 开始，到 } 结束。
```

**第2次尝试**
```
AI 输出: {"day":1,"title":"天安门广场","activities":[...]}
✅ 成功！
```

## 🎯 应用场景

### 1. 单天行程生成
- 最多重试 3 次
- 每次失败都反馈错误
- 如果 3 次都失败，抛出异常

### 2. 行程总结生成
- 最多重试 3 次
- 每次失败都反馈错误
- 如果 3 次都失败，使用**默认总结**（不阻断整体流程）

```typescript
if (summaryRetries >= maxSummaryRetries) {
  console.warn('❌ 总结生成失败，使用默认总结');
  summary = {
    highlights: ['精彩行程', '美好回忆', '难忘体验'],
    tips: ['注意安全', '合理安排时间', '保持愉快心情'],
  };
}
```

## 📝 日志输出

### 成功案例
```bash
📅 开始生成第 1/2 天...
🔍 第 1 天 AI 原始返回: {"day":1,"date":"2025-02-01",...
📝 开始解析 AI 返回内容，长度: 587
✅ JSON 解析成功！
✅ 第 1 天生成成功（4 个活动）
```

### 失败后成功案例
```bash
📅 开始生成第 1/2 天...
🔍 第 1 天 AI 原始返回: {day:1,title:"北京",...
❌ JSON 解析失败: Unexpected token d
⚠️ 第 1 天生成失败（尝试 1/3）: JSON 格式错误...
🔄 将错误反馈给 AI，让它自己修正...
📮 添加错误反馈：JSON 格式错误：Unexpected token d
🔍 第 1 天 AI 原始返回: {"day":1,"title":"北京",...
✅ JSON 解析成功！
✅ 第 1 天生成成功（4 个活动）
```

### 失败案例
```bash
📅 开始生成第 1/2 天...
🔍 第 1 天 AI 原始返回: 好的，我来为你...
❌ JSON 解析失败: 找不到有效的 JSON 结构
⚠️ 第 1 天生成失败（尝试 1/3）
🔄 将错误反馈给 AI，让它自己修正...
📮 添加错误反馈：找不到有效的 JSON 结构
🔍 第 1 天 AI 原始返回: 当然，这是第1天...
❌ JSON 解析失败: 找不到有效的 JSON 结构
⚠️ 第 1 天生成失败（尝试 2/3）
...
❌ 第 1 天行程生成失败，已重试 3 次
```

## 📊 预期效果

### 重试成功率提升

| 场景 | 无反馈重试 | 有反馈重试 | 提升 |
|-----|----------|----------|-----|
| 格式错误（缺少引号） | 20% | 80% | +60% |
| JSON 不完整 | 30% | 70% | +40% |
| 混合文本和JSON | 10% | 60% | +50% |
| **总体** | **25%** | **70%** | **+45%** |

### 与原有机制叠加

```
渐进式生成: 基础成功率 30% → 60%
强化提示词: 60% → 75%
增强解析器: 75% → 85%
错误反馈:   85% → 95%+ ⭐
```

## 🔍 调试技巧

### 查看反馈内容

在终端日志中搜索：
```bash
📮 添加错误反馈：
```

这会显示我们发送给 AI 的反馈内容。

### 查看 AI 的修正

对比两次输出：
```bash
🔍 第 1 天 AI 原始返回（第1次）: {day:1,...
🔍 第 1 天 AI 原始返回（第2次）: {"day":1,...
```

看 AI 是否理解并修正了错误。

## 🎯 最佳实践

### 1. 错误信息要具体
❌ 不好：`格式错误`  
✅ 好：`你的JSON中有语法错误！检查是否所有字符串都加了双引号`

### 2. 包含输出片段
让 AI 能看到自己的错误输出，才能修正。

### 3. 给出明确指令
不只是说"错了"，要说"怎么改"。

### 4. 保持系统提示词
每次重试都发送完整的系统提示词，强化规则。

## 🚀 未来优化

### 1. 更细粒度的错误分析
```typescript
// 分析具体哪个字段出错
if (error.message.includes('Unexpected token') && error.position) {
  return `第 ${error.position} 个字符附近有语法错误`;
}
```

### 2. 学习历史错误
```typescript
// 记录常见错误模式
const errorPatterns = loadErrorPatterns();
const suggestion = errorPatterns.getSuggestion(error);
```

### 3. 多模型降级
```typescript
// 如果 DeepSeek 3次都失败，自动切换到 GPT-4
if (retries >= 3 && model === 'deepseek') {
  model = 'gpt-4';
  retries = 0;
}
```

## ✅ 验收标准

- [ ] 当 AI 返回非 JSON 文本时，第2次能修正
- [ ] 当 AI 缺少引号时，第2次能修正
- [ ] 当 AI JSON 不完整时，第2次能修正
- [ ] 终端日志清晰显示反馈内容
- [ ] 总结生成失败时有默认值兜底
- [ ] 整体成功率提升至 90%+

---

**更新时间**: 2025-01-30  
**版本**: v1.0  
**状态**: ✅ 已实现，待测试

