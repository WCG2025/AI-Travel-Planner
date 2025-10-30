import type { TravelPlanInput } from '@/types/travel-plan.types';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 生成系统提示词
 */
export function getSystemPrompt(): string {
  return `你是专业的旅行规划师，必须严格遵守 JSON 格式规范。

【格式要求-必须遵守】：
1. 所有字段名加双引号："title"
2. 所有字符串值加双引号："北京"
3. 所有数组元素加双引号：["建议1", "建议2"]
4. 数字不加引号：100
5. 使用英文标点：冒号:  逗号,  引号"
6. 从头到尾保持格式一致

【禁止】：
- 不要使用中文标点：、，：
- 不要省略引号
- 不要改变格式

格式比内容更重要，必须保证 JSON 可解析。`;
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

**严格规则（从第一行到最后一行都要遵守）：**
1. 字段名加引号："time": "09:00" ✅  time: 09:00 ❌
2. 字符串值加引号："location": "北京" ✅  location: 北京 ❌
3. 数组元素加引号："tips": ["建议1"] ✅  tips: [建议1] ❌
4. 数字不加引号："cost": 100 ✅  "cost": "100" ❌
5. 使用英文冒号和逗号：":"  ","  ✅  "：" "，" ❌
6. type必须是：attraction, meal, transportation, accommodation, shopping, entertainment, other
7. 每天3-5个活动，保持简洁
8. 直接输出JSON，不要markdown标记

**重要**：整个JSON从头到尾格式必须完全一致，后面不能偷懒！`;
  
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
      .replace(/"/g, '"')  // 中文引号
      .replace(/'/g, '"')  // 单引号替换为双引号
      .replace(/'/g, '"'); // 单引号替换为双引号
    
    // 2. 修复缺少引号的字段名
    // time: -> "time":
    jsonStr = jsonStr.replace(/([,\{\n\r]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // 3. 修复缺少引号的字符串值（中文内容）
    // : 值, -> : "值",
    // : 值} -> : "值"}
    // : 值] -> : "值"]
    jsonStr = jsonStr.replace(/:\s*([^\d\[\{"][^,\}\]\n]*?)([,\}\]])/g, (match, value, ending) => {
      // 如果值已经有引号，或者是 true/false/null，不处理
      if (value.trim().match(/^["']|^true$|^false$|^null$/)) {
        return match;
      }
      // 去掉值前后的空格和中文标点
      const cleanValue = value.trim().replace(/，$/, '').replace(/：$/, '');
      return `: "${cleanValue}"${ending}`;
    });
    
    // 4. 修复数组中缺少引号的字符串
    // [值1, 值2] -> ["值1", "值2"]
    jsonStr = jsonStr.replace(/\[([^\]]*)\]/g, (match, content) => {
      // 如果数组为空或已经有引号，不处理
      if (!content.trim() || content.includes('"')) {
        return match;
      }
      // 分割并给每个元素加引号
      const items = content.split(',').map(item => {
        const trimmed = item.trim();
        // 如果是数字、true、false、null，不加引号
        if (trimmed.match(/^\d+$|^true$|^false$|^null$/)) {
          return trimmed;
        }
        // 移除已有的引号再加
        const cleaned = trimmed.replace(/^["']|["']$/g, '');
        return `"${cleaned}"`;
      });
      return `[${items.join(', ')}]`;
    });
    
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

