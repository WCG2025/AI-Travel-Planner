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
          "title": "上午景点",
          "description": "详细描述",
          "location": "地点名",
          "cost": 100,
          "type": "attraction",
          "tips": ["建议1", "建议2"]
        },
        {
          "time": "12:30",
          "title": "午餐",
          "description": "午餐安排",
          "location": "餐厅名",
          "cost": 80,
          "type": "meal",
          "tips": ["推荐菜品"]
        },
        {
          "time": "18:30",
          "title": "晚餐",
          "description": "晚餐安排",
          "location": "餐厅名",
          "cost": 120,
          "type": "meal",
          "tips": ["推荐菜品"]
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
7. 每天3-6个活动，保持简洁
8. 直接输出JSON，不要markdown标记

**重要**：整个JSON从头到尾格式必须完全一致，后面不能偷懒！`;
  
  return prompt;
}

/**
 * 解析 AI 返回的 JSON（超强版）
 */
export function parseAIResponse(content: string): any {
  console.log('📝 开始解析 AI 返回内容，长度:', content.length);
  
  try {
    // 步骤 1: 清理和提取
    let jsonStr = content.trim();
    
    // 移除 markdown 代码块
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();
    
    // 提取完整的 JSON 对象
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('找不到有效的 JSON 结构（缺少大括号）');
    }
    
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    console.log('✂️ 提取 JSON 片段，长度:', jsonStr.length);
    
    // 步骤 2: 标点符号修复
    jsonStr = jsonStr
      .replace(/：/g, ':')   // 中文冒号
      .replace(/，/g, ',')   // 中文逗号
      .replace(/"/g, '"')   // 中文左引号
      .replace(/"/g, '"')   // 中文右引号
      .replace(/'/g, '"')   // 左单引号
      .replace(/'/g, '"');  // 右单引号
    
    // 步骤 3: 修复缺少引号的字段名（最激进）
    // 匹配所有无引号的字段名
    jsonStr = jsonStr.replace(/([,\{\n\r\s])([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // 步骤 4: 修复缺少引号的字符串值（升级版）
    // 处理 : value, 或 : value} 或 : value]
    jsonStr = jsonStr.replace(/:\s*([^"\d\[\{\-][^,\}\]]*?)([,\}\]])/g, (match, value, ending) => {
      const trimmed = value.trim();
      // 跳过 true/false/null
      if (trimmed === 'true' || trimmed === 'false' || trimmed === 'null') {
        return `: ${trimmed}${ending}`;
      }
      // 跳过已经有引号的
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return match;
      }
      // 清理并加引号
      const cleaned = trimmed.replace(/，$/, '').replace(/：$/, '');
      return `: "${cleaned}"${ending}`;
    });
    
    // 步骤 5: 修复数组中缺少引号的字符串（递归处理）
    let prevJsonStr = '';
    let iterations = 0;
    const maxIterations = 5;
    
    while (prevJsonStr !== jsonStr && iterations < maxIterations) {
      prevJsonStr = jsonStr;
      iterations++;
      
      // 查找数组并修复
      jsonStr = jsonStr.replace(/\[([^\[\]]*?)\]/g, (match, content) => {
        if (!content.trim()) return '[]';
        
        // 分割并处理每个元素
        const items: string[] = [];
        let current = '';
        let inQuotes = false;
        let depth = 0;
        
        for (let i = 0; i < content.length; i++) {
          const char = content[i];
          
          if (char === '"' && (i === 0 || content[i - 1] !== '\\')) {
            inQuotes = !inQuotes;
            current += char;
          } else if (!inQuotes && (char === '{' || char === '[')) {
            depth++;
            current += char;
          } else if (!inQuotes && (char === '}' || char === ']')) {
            depth--;
            current += char;
          } else if (!inQuotes && char === ',' && depth === 0) {
            items.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        if (current.trim()) {
          items.push(current.trim());
        }
        
        // 给每个元素加引号（如果需要）
        const fixedItems = items.map(item => {
          // 已经有引号、是数字、是对象、是布尔值
          if (
            item.startsWith('"') ||
            item.startsWith('{') ||
            item.startsWith('[') ||
            /^\d+$/.test(item) ||
            item === 'true' ||
            item === 'false' ||
            item === 'null'
          ) {
            return item;
          }
          // 去掉可能的旧引号再加新的
          const cleaned = item.replace(/^["']|["']$/g, '');
          return `"${cleaned}"`;
        });
        
        return `[${fixedItems.join(',')}]`;
      });
    }
    
    // 步骤 6: 修复尾随逗号
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    
    console.log('🔧 修复后的 JSON 前200字符:', jsonStr.substring(0, 200));
    console.log('🔧 修复后的 JSON 后200字符:', jsonStr.substring(Math.max(0, jsonStr.length - 200)));
    
    // 步骤 7: 尝试解析
    const parsed = JSON.parse(jsonStr);
    
    console.log('✅ JSON 解析成功！');
    return parsed;
    
  } catch (error: any) {
    console.error('❌ JSON 解析失败:', error.message);
    console.error('📄 原始内容（前300字符）:', content.substring(0, 300));
    console.error('📄 原始内容（中300字符）:', content.substring(Math.floor(content.length / 2) - 150, Math.floor(content.length / 2) + 150));
    console.error('📄 原始内容（后300字符）:', content.substring(Math.max(0, content.length - 300)));
    
    // 提供更有用的错误信息
    if (error.message.includes('Unexpected token')) {
      throw new Error(`JSON 格式错误：${error.message}。AI 可能在中途改变了格式。`);
    } else if (error.message.includes('Unexpected end')) {
      throw new Error('JSON 不完整，AI 可能被截断了。请尝试更短的行程。');
    } else {
      throw new Error(`AI 返回的内容格式不正确，无法解析为 JSON：${error.message}`);
    }
  }
}

/**
 * 验证行程数据格式
 */
export function validateTravelPlan(plan: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 必需字段检查（日期变为可选）
  if (!plan.title) errors.push('缺少标题');
  if (!plan.destination) errors.push('缺少目的地');
  if (!plan.days) errors.push('缺少天数');
  // startDate 和 endDate 现在是可选的（相对日期模式）
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

