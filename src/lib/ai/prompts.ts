import type { TravelPlanInput } from '@/types/travel-plan.types';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 生成系统提示词
 */
export function getSystemPrompt(): string {
  return `你是一位专业的旅行规划师，拥有丰富的全球旅行经验和深厚的地理文化知识。

你的任务是根据用户的需求，生成详细、实用、个性化的旅行计划。

要求：
1. 深入理解用户的偏好和需求
2. 提供合理的时间安排和路线规划
3. 推荐性价比高的景点、餐厅和住宿
4. 给出准确的预算估算
5. 提供实用的旅行建议和注意事项
6. 考虑当地的天气、交通、文化等因素

请以专业、友好的语气回复，使用简体中文。`;
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
  
  const prompt = `请为我制定一份详细的旅行计划：

【基本信息】
- 目的地：${input.destination}
- 出发日期：${format(new Date(input.startDate), 'yyyy年MM月dd日', { locale: zhCN })}
- 结束日期：${format(new Date(input.endDate), 'yyyy年MM月dd日', { locale: zhCN })}
- 总天数：${days}天
- 总预算：${input.budget ? `约 ${input.budget.toLocaleString()} 元` : '灵活安排'}
- 同行人数：${input.travelers || 1}人${preferencesText}

${input.specialRequirements ? `【特殊需求】\n${input.specialRequirements}\n` : ''}
【输出要求】
请严格按照以下 JSON 格式返回旅行计划（不要包含任何其他文字，只返回 JSON）：

\`\`\`json
{
  "title": "行程标题，简洁有吸引力",
  "destination": "${input.destination}",
  "startDate": "${input.startDate}",
  "endDate": "${input.endDate}",
  "days": ${days},
  "itinerary": [
    {
      "day": 1,
      "date": "${input.startDate}",
      "title": "第1天的主题，如：初识${input.destination}",
      "activities": [
        {
          "time": "09:00",
          "endTime": "12:00",
          "title": "活动名称",
          "description": "详细描述这个活动，包括看点、体验等",
          "location": "具体地点名称",
          "address": "详细地址",
          "duration": "3小时",
          "cost": 100,
          "type": "attraction",
          "tips": [
            "实用建议1",
            "实用建议2"
          ],
          "bookingInfo": "预订信息（如需要）"
        }
      ],
      "estimatedCost": 500,
      "notes": "当天的特别提醒或建议"
    }
  ],
  "summary": {
    "totalCost": 5000,
    "highlights": [
      "行程亮点1",
      "行程亮点2"
    ],
    "tips": [
      "总体建议1",
      "总体建议2"
    ],
    "warnings": [
      "注意事项1",
      "注意事项2"
    ],
    "packingList": [
      "必带物品1",
      "必带物品2"
    ]
  }
}
\`\`\`

【重要说明】
1. 每天安排 3-5 个活动，时间分配合理
2. activity 的 type 可选值：attraction（景点）、meal（用餐）、transportation（交通）、accommodation（住宿）、shopping（购物）、entertainment（娱乐）、other（其他）
3. 费用要符合预算，并给出合理的估算
4. 时间安排要考虑交通、用餐、休息
5. 推荐的地点要真实存在且适合旅游
6. 每个活动的描述要详细、实用
7. 提供的建议要具体、可操作
8. 如果预算有限，优先推荐性价比高的选择
9. 考虑季节因素，推荐合适的活动

请现在就生成这份旅行计划，记住：只返回 JSON，不要有其他内容。`;
  
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
    
    // 解析 JSON
    const parsed = JSON.parse(jsonStr);
    
    console.log('✅ JSON 解析成功');
    return parsed;
  } catch (error) {
    console.error('❌ JSON 解析失败:', error);
    console.error('原始内容:', content);
    throw new Error('AI 返回的内容格式不正确，无法解析为 JSON');
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

