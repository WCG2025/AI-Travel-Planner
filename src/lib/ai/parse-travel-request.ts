/**
 * AI 解析自然语言旅行需求
 */

import { getDeepSeekClient } from './deepseek-client';
import { format, addDays } from 'date-fns';

export interface ParsedTravelRequest {
  destination?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  budget?: number;
  travelers?: number;
  interests?: string[];
  pace?: 'relaxed' | 'moderate' | 'fast';
  specialRequirements?: string;
  confidence: 'high' | 'medium' | 'low'; // 解析置信度
  missingFields: string[]; // 缺失的必需字段
}

/**
 * 从自然语言中解析旅行需求
 */
export async function parseTravelRequest(text: string): Promise<ParsedTravelRequest> {
  console.log('🔍 开始解析自然语言旅行需求...');
  console.log('📝 输入文本:', text);
  
  const client = getDeepSeekClient();
  
  const systemPrompt = `你是旅行需求解析器。从用户的自然语言描述中提取旅行信息。

严格规则：
1. 只返回纯JSON，从{开始到}结束
2. 所有键和字符串值必须双引号
3. 数字不加引号
4. 不要任何其他文字或解释

返回格式：
{
  "destination": "目的地（如果提到）",
  "days": 天数（数字，如果提到）,
  "budget": 预算（数字，单位元，如果提到）,
  "travelers": 人数（数字，如果提到，默认1）,
  "interests": ["兴趣1", "兴趣2"],
  "pace": "relaxed/moderate/fast（如果提到节奏）",
  "specialRequirements": "其他特殊需求"
}

如果某个字段没有提到，设置为null。`;

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  
  const userPrompt = `解析这段旅行需求：

"${text}"

提示：
- 今天是 ${format(new Date(), 'yyyy-MM-dd')}
- 如果没有明确说明开始日期，默认为明天（${tomorrow}）
- 从描述中识别目的地、天数、预算、兴趣爱好等信息
- interests 可能包含：history（历史文化）、nature（自然风光）、food（美食）、shopping（购物）、photography（摄影）、adventure（探险）、relaxation（休闲放松）、nightlife（夜生活）

直接返回JSON：`;

  try {
    const response = await client.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.1, // 低温度，更精确
        maxTokens: 500,
      }
    );
    
    console.log('🤖 AI 原始返回:', response.substring(0, 200));
    
    // 解析JSON
    let jsonStr = response.trim();
    
    // 移除可能的 markdown 代码块标记
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // 提取 JSON 对象
    const startIdx = jsonStr.indexOf('{');
    const endIdx = jsonStr.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      throw new Error('AI 返回的内容不是有效的 JSON');
    }
    
    jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    
    const parsed = JSON.parse(jsonStr);
    console.log('✅ 解析成功:', parsed);
    
    // 计算日期
    let startDate: string | undefined;
    let endDate: string | undefined;
    
    if (parsed.days && parsed.days > 0) {
      // 如果有天数，计算日期
      startDate = tomorrow;
      const end = addDays(new Date(tomorrow), parsed.days - 1);
      endDate = format(end, 'yyyy-MM-dd');
    }
    
    // 检查缺失的必需字段
    const missingFields: string[] = [];
    if (!parsed.destination && !startDate) {
      missingFields.push('destination', 'dates');
    } else if (!parsed.destination) {
      missingFields.push('destination');
    } else if (!startDate) {
      missingFields.push('dates');
    }
    
    // 评估置信度
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (parsed.destination && startDate && endDate) {
      confidence = 'high';
    } else if (parsed.destination || (startDate && endDate)) {
      confidence = 'medium';
    }
    
    const result: ParsedTravelRequest = {
      destination: parsed.destination || undefined,
      startDate,
      endDate,
      days: parsed.days || undefined,
      budget: parsed.budget || undefined,
      travelers: parsed.travelers || 1,
      interests: parsed.interests || [],
      pace: parsed.pace || 'moderate',
      specialRequirements: parsed.specialRequirements || text, // 保留原文
      confidence,
      missingFields,
    };
    
    console.log('📊 最终解析结果:', result);
    
    return result;
    
  } catch (error: any) {
    console.error('❌ 解析失败:', error.message);
    
    // 返回一个低置信度的结果
    return {
      specialRequirements: text,
      confidence: 'low',
      missingFields: ['destination', 'dates'],
      travelers: 1,
      pace: 'moderate',
    };
  }
}

