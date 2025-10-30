import { getDeepSeekClient } from './deepseek-client';
import { getSystemPrompt, parseAIResponse, validateTravelPlan } from './prompts';
import type { TravelPlanInput, TravelPlan, ItineraryDay } from '@/types/travel-plan.types';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 渐进式生成旅行计划（逐天生成，更稳定）
 * @param input 旅行需求
 * @param onProgress 进度回调函数
 */
export async function generateTravelPlanIterative(
  input: TravelPlanInput,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<TravelPlan> {
  console.log('🔄 使用渐进式生成模式...');
  
  const days = differenceInDays(new Date(input.endDate), new Date(input.startDate)) + 1;
  const client = getDeepSeekClient();
  
  // 步骤 1: 生成计划概要和基本信息
  onProgress?.(0, days + 1, '正在生成计划概要...');
  const planOverview = await generatePlanOverview(client, input, days);
  
  console.log('✅ 计划概要生成完成');
  
  // 步骤 2: 逐天生成详细行程
  const itinerary: ItineraryDay[] = [];
  const conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: getSystemPrompt() },
    { role: 'user', content: getOverviewPrompt(input, days) },
    { role: 'assistant', content: JSON.stringify(planOverview) },
  ];
  
  for (let day = 1; day <= days; day++) {
    onProgress?.(day, days + 1, `正在生成第 ${day} 天行程...`);
    console.log(`📅 开始生成第 ${day}/${days} 天...`);
    
    // 生成当天行程（最多重试3次）
    let dayItinerary: ItineraryDay | null = null;
    let retries = 0;
    const maxRetries = 3;
    
    while (!dayItinerary && retries < maxRetries) {
      try {
        dayItinerary = await generateSingleDay(
          client,
          conversationHistory,
          input,
          day,
          days,
          itinerary
        );
        
        // 验证生成的行程
        if (!dayItinerary.activities || dayItinerary.activities.length === 0) {
          throw new Error('活动列表为空');
        }
        
        console.log(`✅ 第 ${day} 天生成成功（${dayItinerary.activities.length} 个活动）`);
        
        // 添加到历史记录
        itinerary.push(dayItinerary);
        conversationHistory.push({
          role: 'assistant',
          content: JSON.stringify(dayItinerary),
        });
        
      } catch (error: any) {
        retries++;
        console.warn(`⚠️ 第 ${day} 天生成失败（尝试 ${retries}/${maxRetries}）:`, error.message);
        
        if (retries >= maxRetries) {
          throw new Error(`第 ${day} 天行程生成失败，已重试 ${maxRetries} 次：${error.message}`);
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }
  
  // 步骤 3: 生成总结
  onProgress?.(days + 1, days + 1, '正在生成行程总结...');
  console.log('📝 开始生成行程总结...');
  
  const summary = await generateSummary(client, conversationHistory, input, itinerary);
  
  console.log('✅ 渐进式生成完成！');
  
  // 组装完整计划
  const plan: TravelPlan = {
    title: planOverview.title,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    days,
    budget: input.budget,
    preferences: input.preferences,
    itinerary,
    summary,
  };
  
  // 最终验证
  const validation = validateTravelPlan(plan);
  if (!validation.valid) {
    console.error('❌ 最终验证失败:', validation.errors);
    throw new Error(`行程数据验证失败：${validation.errors.join('、')}`);
  }
  
  return plan;
}

/**
 * 生成计划概要
 */
async function generatePlanOverview(
  client: any,
  input: TravelPlanInput,
  days: number
): Promise<{ title: string }> {
  const prompt = `为以下旅行生成一个吸引人的标题：

目的地：${input.destination}
天数：${days}天
预算：${input.budget ? `${input.budget}元` : '灵活'}

只返回JSON格式：
{
  "title": "行程标题（简洁有吸引力）"
}`;

  const response = await client.chat([
    { role: 'system', content: '你是专业的旅行规划师，只返回JSON格式。' },
    { role: 'user', content: prompt },
  ], { temperature: 0.8, maxTokens: 100 });
  
  return parseAIResponse(response);
}

/**
 * 获取概要生成的提示词
 */
function getOverviewPrompt(input: TravelPlanInput, days: number): string {
  return `我需要为${input.destination}制定${days}天旅行计划，预算${input.budget || '灵活'}元。`;
}

/**
 * 生成单天行程
 */
async function generateSingleDay(
  client: any,
  conversationHistory: Array<{ role: string; content: string }>,
  input: TravelPlanInput,
  dayNumber: number,
  totalDays: number,
  previousDays: ItineraryDay[]
): Promise<ItineraryDay> {
  const currentDate = new Date(input.startDate);
  currentDate.setDate(currentDate.getDate() + dayNumber - 1);
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  
  // 构建上下文摘要
  const previousSummary = previousDays.length > 0
    ? `\n\n前几天已安排：\n${previousDays.map(d => `第${d.day}天：${d.title}（${d.activities.length}个活动）`).join('\n')}`
    : '';
  
  const prompt = `现在生成第 ${dayNumber} 天的详细行程（共${totalDays}天）。${previousSummary}

要求：
- 日期：${dateStr}
- 安排 3-5 个活动
- 时间合理分配
- 控制在预算内

只返回JSON格式：
{
  "day": ${dayNumber},
  "date": "${dateStr}",
  "title": "第${dayNumber}天主题",
  "activities": [
    {
      "time": "09:00",
      "title": "活动名称",
      "description": "详细描述",
      "location": "地点",
      "cost": 100,
      "type": "attraction",
      "tips": ["建议1", "建议2"]
    }
  ],
  "estimatedCost": 500
}

注意：
1. 所有字段名和字符串值必须加双引号
2. type只能是：attraction, meal, transportation, accommodation, shopping, entertainment, other
3. 确保JSON格式完全正确`;

  const messages = [
    ...conversationHistory,
    { role: 'user', content: prompt },
  ];
  
  const response = await client.chat(messages, {
    temperature: 0.7,
    maxTokens: 800,
  });
  
  const dayData = parseAIResponse(response);
  
  // 验证必需字段
  if (!dayData.day || !dayData.date || !dayData.activities) {
    throw new Error('缺少必需字段');
  }
  
  return dayData as ItineraryDay;
}

/**
 * 生成行程总结
 */
async function generateSummary(
  client: any,
  conversationHistory: Array<{ role: string; content: string }>,
  input: TravelPlanInput,
  itinerary: ItineraryDay[]
): Promise<any> {
  const itinerarySummary = itinerary.map(day => 
    `第${day.day}天：${day.title}（${day.activities.length}个活动，预计${day.estimatedCost}元）`
  ).join('\n');
  
  const prompt = `基于以上${itinerary.length}天行程，生成一份总结：

${itinerarySummary}

只返回JSON格式：
{
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "tips": ["建议1", "建议2", "建议3"]
}

注意：所有字段和字符串必须加双引号`;

  const messages = [
    ...conversationHistory,
    { role: 'user', content: prompt },
  ];
  
  const response = await client.chat(messages, {
    temperature: 0.7,
    maxTokens: 500,
  });
  
  return parseAIResponse(response);
}

