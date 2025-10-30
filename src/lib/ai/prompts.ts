import type { TravelPlanInput } from '@/types/travel-plan.types';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 生成系统提示词
 */
export function getSystemPrompt(): string {
  return `你是一位专业的旅行规划师。

重要要求：
1. 必须严格返回有效的 JSON 格式
2. 所有字段名和字符串值必须使用双引号
3. 数字和布尔值不加引号
4. 不要在 JSON 中使用中文标点符号（如：、，）
5. 确保 JSON 格式正确可解析

使用简体中文内容，但保持标准 JSON 格式。`;
}

/**
 * 生成行程规划提示词
 */
export function getTravelPlanPrompt(input: TravelPlanInput): string {
  const days = differenceInDays(
    new Date(input.endDate),
    new Date(input.startDate)
  ) + 1;
  
  // 构建偏好描述
  let preferencesText = '';
  if (input.preferences) {
    const { interests, pace, accommodation, transportation, dietary } = input.preferences;
    
    if (interests && interests.length > 0) {
      preferencesText += `\n- 兴趣爱好：${interests.join('、')}`;
    }
    if (pace) {
      const paceMap = {
        relaxed: '轻松悠闲',
        moderate: '适中',
        fast: '紧凑高效'
      };
      preferencesText += `\n- 旅行节奏：${paceMap[pace]}`;
    }
    if (accommodation && accommodation.length > 0) {
      preferencesText += `\n- 住宿偏好：${accommodation.join('、')}`;
    }
    if (transportation && transportation.length > 0) {
      preferencesText += `\n- 交通偏好：${transportation.join('、')}`;
    }
    if (dietary && dietary.length > 0) {
      preferencesText += `\n- 饮食偏好：${dietary.join('、')}`;
    }
  }
  
  const prompt = `制定${days}天${input.destination}旅行计划：

基本信息：
- 目的地：${input.destination}
- 日期：${format(new Date(input.startDate), 'MM月dd日', { locale: zhCN })}-${format(new Date(input.endDate), 'MM月dd日', { locale: zhCN })}（${days}天）
- 预算：${input.budget ? `${input.budget}元` : '灵活'}
- 人数：${input.travelers || 1}人${preferencesText}
${input.specialRequirements ? `\n特殊要求：${input.specialRequirements}` : ''}

**输出格式（必须严格遵守）：**

只返回纯 JSON，格式如下：
{
  "title": "行程标题",
  "destination": "${input.destination}",
  "startDate": "${input.startDate}",
  "endDate": "${input.endDate}",
  "days": ${days},
  "itinerary": [
    {
      "day": 1,
      "date": "${input.startDate}",
      "title": "第1天主题",
      "activities": [
        {
          "time": "09:00",
          "title": "活动名称",
          "description": "详细描述",
          "location": "地点名",
          "cost": 100,
          "type": "attraction",
          "tips": ["建议1", "建议2"]
        }
      ],
      "estimatedCost": 500
    }
  ],
  "summary": {
    "highlights": ["亮点1", "亮点2"],
    "tips": ["建议1", "建议2"]
  }
}

**关键规则：**
1. 所有字段名必须加双引号："title"
2. 所有字符串值必须加双引号："北京"
3. 数字不加引号：100
4. 数组使用方括号：["a", "b"]
5. 对象使用花括号：{"key": "value"}
6. type 只能是：attraction, meal, transportation, accommodation, shopping, entertainment, other
7. 每天3-5个活动
8. 不要输出代码块标记（\`\`\`json），直接输出 JSON`;
  
  return prompt;
}

/**
 * 解析 AI 返回的 JSON
 */
export function parseAIResponse(content: string): any {
  try {
    // 移除可能的 markdown 代码块标记
    let jsonStr = content.trim();
    
    // 移除 ```json 和 ``` 标记
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    
    jsonStr = jsonStr.trim();
    
    // 尝试找到完整的 JSON 对象（从第一个 { 到最后一个 }）
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    
    // 尝试修复常见的格式问题
    // 1. 替换中文标点为英文标点
    jsonStr = jsonStr
      .replace(/：/g, ':')  // 中文冒号
      .replace(/，/g, ',')  // 中文逗号
      .replace(/"/g, '"')  // 中文引号
      .replace(/"/g, '"'); // 中文引号
    
    // 2. 修复缺少引号的字段名（常见模式）
    // 例如：time:09:00 -> "time":"09:00"
    jsonStr = jsonStr.replace(/([,\{]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // 解析 JSON
    const parsed = JSON.parse(jsonStr);
    
    console.log('✅ JSON 解析成功');
    return parsed;
  } catch (error: any) {
    console.error('❌ JSON 解析失败:', error.message);
    console.error('尝试解析的内容（前500字符）:', content.substring(0, 500));
    console.error('尝试解析的内容（后500字符）:', content.substring(Math.max(0, content.length - 500)));
    throw new Error('AI 返回的内容格式不正确，无法解析为 JSON。请尝试更短的行程（2-3天）或重新生成。');
  }
}

/**
 * 验证行程数据格式
 */
export function validateTravelPlan(plan: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 必需字段检查
  if (!plan.title) errors.push('缺少标题');
  if (!plan.destination) errors.push('缺少目的地');
  if (!plan.startDate) errors.push('缺少开始日期');
  if (!plan.endDate) errors.push('缺少结束日期');
  if (!plan.itinerary || !Array.isArray(plan.itinerary)) {
    errors.push('缺少行程数组');
  }
  
  // 行程数据检查
  if (plan.itinerary && Array.isArray(plan.itinerary)) {
    if (plan.itinerary.length === 0) {
      errors.push('行程不能为空');
    }
    
    plan.itinerary.forEach((day: any, index: number) => {
      if (!day.day) errors.push(`第 ${index + 1} 天缺少 day 字段`);
      if (!day.date) errors.push(`第 ${index + 1} 天缺少 date 字段`);
      if (!day.activities || !Array.isArray(day.activities)) {
        errors.push(`第 ${index + 1} 天缺少 activities 数组`);
      } else if (day.activities.length === 0) {
        errors.push(`第 ${index + 1} 天没有安排活动`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

