/**
 * AI 解析自然语言旅行需求
 */

import { getDeepSeekClient } from './deepseek-client';

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

如果某个字段没有提到，设置为null。
⚠️ 重要：只有用户明确说了具体日期（如"11月1日"、"下周五"）时，才提取 startDate/endDate，否则不要自动计算日期！`;
  
  const userPrompt = `解析这段旅行需求：

"${text}"

提示：
- 从描述中识别目的地、天数、预算、兴趣爱好等信息
- interests 可能包含：history（历史文化）、nature（自然风光）、food（美食）、shopping（购物）、photography（摄影）、adventure（探险）、relaxation（休闲放松）、nightlife（夜生活）
- 只有用户明确说了具体日期，才提取日期字段

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
    
    // 日期处理（只有当 AI 明确识别出日期时才使用，否则保持 undefined）
    let startDate: string | undefined = parsed.startDate;
    let endDate: string | undefined = parsed.endDate;
    
    // 不再自动计算日期！让 startDate 和 endDate 保持 undefined
    // 这样就会使用相对日期模式（第1天、第2天）
    
    // 检查缺失的必需字段（只有目的地和天数是必需的）
    const missingFields: string[] = [];
    if (!parsed.destination) {
      missingFields.push('目的地');
    }
    if (!parsed.days || parsed.days <= 0) {
      missingFields.push('天数');
    }
    
    // 评估置信度（基于目的地和天数）
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (parsed.destination && parsed.days) {
      confidence = 'high';
    } else if (parsed.destination || parsed.days) {
      confidence = 'medium';
    }
    
    console.log(`📅 日期模式: ${startDate ? '绝对日期' : '相对日期'}`);
    console.log(`📅 开始日期: ${startDate || '未指定'}`);
    console.log(`📅 结束日期: ${endDate || '未指定'}`);
    console.log(`📅 天数: ${parsed.days || '未知'}`);

    
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
      missingFields: ['目的地', '天数'],
      travelers: 1,
      pace: 'moderate',
    };
  }
}

