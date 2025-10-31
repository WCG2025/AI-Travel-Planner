/**
 * AI 解析语音文本为费用信息
 */

import { getDeepSeekClient } from './deepseek-client';
import { format, subDays, parse } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ParsedExpense, ExpenseCategory } from '@/types/expense.types';

/**
 * 从自然语言中解析费用信息
 */
export async function parseExpenseFromText(text: string): Promise<ParsedExpense> {
  console.log('🔍 开始解析费用信息...');
  console.log('📝 输入文本:', text);
  
  const client = getDeepSeekClient();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  
  const systemPrompt = `你是费用信息解析器。从用户的自然语言描述中提取费用信息。

严格规则：
1. 只返回纯JSON，从{开始到}结束
2. 所有键和字符串值必须双引号
3. 数字不加引号
4. 不要任何其他文字或解释

返回格式：
{
  "category": "类别代码",
  "amount": 金额数字,
  "description": "描述文本",
  "date": "YYYY-MM-DD"
}

类别代码必须是以下之一：
- transportation (交通：打车、公交、地铁、飞机、火车、租车等)
- accommodation (住宿：酒店、民宿、旅馆等)
- food (餐饮：早餐、午餐、晚餐、零食、饮料、咖啡等)
- attraction (门票：景点、博物馆、展览、演出等)
- shopping (购物：买衣服、纪念品、日用品等)
- entertainment (娱乐：KTV、酒吧、游戏、按摩等)
- other (其他：无法归类的)

如果某个字段无法从文本中提取，设置为null。`;

  const userPrompt = `解析这条费用记录：

"${text}"

提示：
- 今天是 ${today}
- 昨天是 ${yesterday}
- 从描述中识别金额、类别、地点/内容、日期
- "今天"转为 ${today}，"昨天"转为 ${yesterday}
- 如果没说日期，默认为今天
- 金额提取数字（68、68块、68元 都提取为 68）

直接返回JSON：`;

  try {
    const response = await client.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.1, // 低温度，更精确
        maxTokens: 300,
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
    
    // 验证和处理数据
    const category = validateCategory(parsed.category);
    const amount = validateAmount(parsed.amount);
    const date = validateDate(parsed.date) || today;
    
    // 检查缺失的必需字段
    const missingFields: string[] = [];
    if (!category) {
      missingFields.push('类别');
    }
    if (!amount || amount <= 0) {
      missingFields.push('金额');
    }
    
    // 评估置信度
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (category && amount && amount > 0) {
      if (parsed.description && parsed.description.trim().length > 0) {
        confidence = 'high';
      } else {
        confidence = 'medium';
      }
    }
    
    console.log(`📊 解析结果 - 类别: ${category}, 金额: ${amount}, 日期: ${date}, 置信度: ${confidence}`);
    
    const result: ParsedExpense = {
      category,
      amount,
      description: parsed.description || undefined,
      date,
      confidence,
      missingFields,
    };
    
    return result;
    
  } catch (error: any) {
    console.error('❌ 解析失败:', error.message);
    
    // 返回一个低置信度的结果
    return {
      confidence: 'low',
      missingFields: ['类别', '金额'],
    };
  }
}

/**
 * 验证类别
 */
function validateCategory(category: string | null): ExpenseCategory | undefined {
  if (!category) return undefined;
  
  const validCategories: ExpenseCategory[] = [
    'transportation',
    'accommodation',
    'food',
    'attraction',
    'shopping',
    'entertainment',
    'other',
  ];
  
  return validCategories.includes(category as ExpenseCategory) 
    ? (category as ExpenseCategory) 
    : undefined;
}

/**
 * 验证金额
 */
function validateAmount(amount: any): number | undefined {
  if (amount === null || amount === undefined) return undefined;
  
  const num = Number(amount);
  return !isNaN(num) && num > 0 ? num : undefined;
}

/**
 * 验证日期
 */
function validateDate(date: string | null): string | undefined {
  if (!date) return undefined;
  
  try {
    // 尝试解析日期
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return undefined;
    
    // 返回格式化的日期
    return format(parsed, 'yyyy-MM-dd');
  } catch {
    return undefined;
  }
}

/**
 * 智能分类（从描述推断类别）
 */
export async function suggestCategory(description: string): Promise<ExpenseCategory> {
  console.log('🤖 AI 智能分类:', description);
  
  const client = getDeepSeekClient();
  
  const systemPrompt = `你是费用分类专家。根据描述判断费用类别。

只返回一个单词，必须是以下之一：
transportation, accommodation, food, attraction, shopping, entertainment, other

不要返回任何其他内容。`;

  const userPrompt = `这笔费用属于什么类别？

"${description}"`;

  try {
    const response = await client.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.1,
        maxTokens: 20,
      }
    );
    
    const category = response.trim().toLowerCase();
    const validated = validateCategory(category);
    
    console.log('✅ 分类结果:', validated || 'other');
    
    return validated || 'other';
  } catch (error) {
    console.error('❌ 分类失败，使用默认值');
    return 'other';
  }
}

