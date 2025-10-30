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
  const systemPrompt = `你是专业的JSON生成器。规则：
1. 只返回纯JSON，不要任何其他文字
2. 所有键和字符串值必须用双引号
3. 不要添加markdown代码块标记`;

  const prompt = `生成标题：${input.destination}${days}天游

返回格式：
{"title":"标题内容"}`;

  const response = await client.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ], { temperature: 0.5, maxTokens: 50 });
  
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
  
  // 超强系统提示词
  const systemPrompt = `你是JSON格式生成器。严格遵守：

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

从第一个字符{到最后一个字符}，中间不能有任何其他内容。`;

  // 简化的提示词
  const previousContext = previousDays.length > 0
    ? `已安排：${previousDays.map(d => `第${d.day}天-${d.title}`).join('，')}\n`
    : '';
  
  const prompt = `${previousContext}生成第${dayNumber}天行程

目的地：${input.destination}
日期：${dateStr}
预算：${input.budget || 1000}元
要求：3-4个活动

返回格式(严格遵守)：
{"day":${dayNumber},"date":"${dateStr}","title":"主题","activities":[{"time":"09:00","title":"景点名","description":"简介","location":"地址","cost":50,"type":"attraction","tips":["提示1","提示2"]}],"estimatedCost":300}

type只能是: attraction,meal,transportation,accommodation,other
直接返回JSON，不要其他内容`;

  // 使用独立的消息，不依赖历史记录
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];
  
  const response = await client.chat(messages, {
    temperature: 0.3,  // 降低温度，更保守
    maxTokens: 600,    // 减少token，避免过长
  });
  
  console.log(`🔍 第 ${dayNumber} 天 AI 原始返回:`, response.substring(0, 200));
  
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
  const systemPrompt = `你是JSON生成器。规则：
1. 只返回纯JSON
2. 所有键和字符串值必须双引号
3. 不要markdown代码块`;

  const itinerarySummary = itinerary.map(day => 
    `第${day.day}天-${day.title}`
  ).join('，');
  
  const prompt = `总结${itinerary.length}天行程：${itinerarySummary}

返回格式：
{"highlights":["亮点1","亮点2","亮点3"],"tips":["建议1","建议2","建议3"]}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];
  
  const response = await client.chat(messages, {
    temperature: 0.3,
    maxTokens: 300,
  });
  
  return parseAIResponse(response);
}

