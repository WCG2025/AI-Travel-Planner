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
  
  // 计算天数（支持相对日期模式）
  let days: number;
  if (input.startDate && input.endDate) {
    days = differenceInDays(new Date(input.endDate), new Date(input.startDate)) + 1;
  } else if (input.days) {
    days = input.days;
  } else {
    throw new Error('请提供开始/结束日期或天数');
  }
  
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
    
    // 生成当天行程（最多重试10次，带错误反馈）
    let dayItinerary: ItineraryDay | null = null;
    let retries = 0;
    const maxRetries = 10;
    let lastError: string | null = null;
    let lastResponse: string | null = null;
    
    while (!dayItinerary && retries < maxRetries) {
      try {
        dayItinerary = await generateSingleDay(
          client,
          conversationHistory,
          input,
          day,
          days,
          itinerary,
          lastError,
          lastResponse
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
        lastError = error.message;
        lastResponse = error.rawResponse || null;
        
        console.warn(`⚠️ 第 ${day} 天生成失败（尝试 ${retries}/${maxRetries}）:`, error.message);
        
        if (retries >= maxRetries) {
          throw new Error(`第 ${day} 天行程生成失败，已重试 ${maxRetries} 次：${error.message}`);
        }
        
        console.log(`🔄 将错误反馈给 AI，让它自己修正...`);
        
        // 短暂等待
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  // 步骤 3: 生成总结（带重试）
  onProgress?.(days + 1, days + 1, '正在生成行程总结...');
  console.log('📝 开始生成行程总结...');
  
  let summary: any = null;
  let summaryRetries = 0;
  const maxSummaryRetries = 10;
  let lastSummaryError: string | null = null;
  let lastSummaryResponse: string | null = null;
  
  while (!summary && summaryRetries < maxSummaryRetries) {
    try {
      summary = await generateSummary(
        client,
        conversationHistory,
        input,
        itinerary,
        lastSummaryError,
        lastSummaryResponse
      );
    } catch (error: any) {
      summaryRetries++;
      lastSummaryError = error.message;
      lastSummaryResponse = error.rawResponse || null;
      
      console.warn(`⚠️ 总结生成失败（尝试 ${summaryRetries}/${maxSummaryRetries}）:`, error.message);
      
      if (summaryRetries >= maxSummaryRetries) {
        // 如果总结生成失败，使用默认总结
        console.warn('❌ 总结生成失败，使用默认总结');
        summary = {
          highlights: ['精彩行程', '美好回忆', '难忘体验'],
          tips: ['注意安全', '合理安排时间', '保持愉快心情'],
        };
      } else {
        console.log(`🔄 将错误反馈给 AI，重新生成总结...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  console.log('✅ 渐进式生成完成！');
  
  // 组装完整计划（日期可选）
  const plan: TravelPlan = {
    title: planOverview.title,
    destination: input.destination,
    startDate: input.startDate,  // 可能为 undefined
    endDate: input.endDate,      // 可能为 undefined
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
 * 生成单天行程（带错误反馈重试）
 */
async function generateSingleDay(
  client: any,
  conversationHistory: Array<{ role: string; content: string }>,
  input: TravelPlanInput,
  dayNumber: number,
  totalDays: number,
  previousDays: ItineraryDay[],
  lastError?: string | null,
  lastResponse?: string | null
): Promise<ItineraryDay> {
  // 计算日期（如果有具体日期）或使用相对日期
  let dateStr: string;
  if (input.startDate) {
    const currentDate = new Date(input.startDate);
    currentDate.setDate(currentDate.getDate() + dayNumber - 1);
    dateStr = format(currentDate, 'yyyy-MM-dd');
  } else {
    dateStr = `第${dayNumber}天`;
  }
  
  // 超强系统提示词
  const systemPrompt = `你是JSON格式生成器。严格遵守：

【绝对规则】
1. 只返回纯JSON，从{开始到}结束
2. 不要markdown代码块(不要\`\`\`)
3. 所有键必须双引号："day"不是day
4. 所有字符串值必须双引号："北京"不是北京
5. 数字不加引号：100不是"100"
6. 【重要】每天的景点必须不同，严禁出现重复景点！
7. 【重要】需要为每天的行程安排住宿酒店。

【示例-正确】
{"day":1,"title":"探索北京","activities":[{"time":"09:00","title":"天安门","description":"游览天安门广场","location":"天安门","address":"北京市东城区东长安街","cost":0,"type":"attraction","tips":["早起避开人群"]}],"estimatedCost":200}

【示例-错误】
{day:1,title:探索北京}  ❌缺少引号
{"day":"1"}  ❌数字加了引号
{"title":"天安门"}  ❌如果其他天已有天安门，不能再出现

从第一个字符{到最后一个字符}，中间不能有任何其他内容。`;

  // 构建已访问景点列表
  const visitedLocations = new Set<string>();
  previousDays.forEach(d => {
    d.activities.forEach(a => {
      if (a.title) visitedLocations.add(a.title);
      if (a.location) visitedLocations.add(a.location);
    });
  });
  
  const visitedList = Array.from(visitedLocations);
  
  // 构建提示词
  const previousContext = previousDays.length > 0
    ? `已安排景点：${previousDays.map(d => `第${d.day}天-${d.title} (${d.activities.map(a => a.title).join('、')})`).join('；')}\n`
    : '';
  
  let prompt = `${previousContext}生成第${dayNumber}天行程

目的地：${input.destination}
${input.startDate ? `日期：${dateStr}` : `相对日期：${dateStr}`}
预算：${input.budget || 1000}元
要求：3-5个活动

${visitedList.length > 0 ? `⚠️ 严禁重复以下景点：${visitedList.join('、')}\n` : ''}

返回格式(严格遵守)：
{"day":${dayNumber}${input.startDate ? `,"date":"${dateStr}"` : ''},"title":"主题","activities":[{"time":"09:00","title":"景点名","description":"简介","location":"景点名称","address":"详细地址","cost":50,"type":"attraction","tips":["提示1","提示2"]},{"time":"12:00","title":"午餐","description":"午餐安排","location":"餐厅名","address":"详细地址","cost":80,"type":"meal","tips":["推荐菜品"]},{"time":"18:30","title":"晚餐","description":"晚餐安排","location":"餐厅名","address":"详细地址","cost":120,"type":"meal","tips":["推荐菜品"]}],"estimatedCost":300}

重要说明：
- ${input.startDate ? 'date字段必须是 yyyy-MM-dd 格式的具体日期' : 'date字段可以省略，因为使用相对日期模式'}
- type只能是: attraction,meal,transportation,accommodation,other
- location字段应为景点名称（如"中山陵"）
- address字段应为详细地址（如"南京市玄武区石象路7号"），用于地理编码
- 【硬性要求】每个景点/活动的title和location必须与之前的天不同，严禁重复！
- 【硬性要求】如果发现重复，必须选择其他景点替代
- 【时间安排】请合理安排时间，不要总是使用固定时间（09:00, 12:00, 14:00, 16:30, 19:00），可以根据活动内容灵活调整
- 【餐饮安排】必须包含午餐和晚餐安排，晚餐时间建议在18:00-20:00之间
直接返回JSON，不要其他内容`;

  // 如果有上次的错误，添加错误反馈
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];
  
  if (lastError && lastResponse) {
    console.log(`📮 添加错误反馈：${lastError.substring(0, 100)}`);
    
    // 添加原始请求
    messages.push({ role: 'user', content: prompt });
    
    // 添加 AI 的错误响应
    messages.push({ role: 'assistant', content: lastResponse.substring(0, 1000) });
    
    // 添加错误反馈
    const feedbackPrompt = `❌ 你的上次输出有错误：

【错误信息】
${lastError}

【你的输出片段】
开头：${lastResponse.substring(0, 150)}
${lastResponse.length > 300 ? `...
结尾：${lastResponse.substring(Math.max(0, lastResponse.length - 150))}` : ''}

【问题分析】
${getFeedbackAnalysis(lastError)}

请严格按照系统提示的格式，重新生成正确的JSON。记住：
1. 从 { 开始，到 } 结束
2. 所有键和字符串值都要双引号
3. 数字不加引号
4. 不要任何其他文字或解释

直接输出正确的JSON：`;
    
    messages.push({ role: 'user', content: feedbackPrompt });
  } else {
    // 首次生成
    messages.push({ role: 'user', content: prompt });
  }
  
  const response = await client.chat(messages, {
    temperature: 0.3,  // 降低温度，更保守
    maxTokens: 600,    // 减少token，避免过长
  });
  
  console.log(`🔍 第 ${dayNumber} 天 AI 原始返回:`, response.substring(0, 200));
  
  try {
    const dayData = parseAIResponse(response);
    
    // 验证必需字段（date 在相对日期模式下可选）
    if (!dayData.day || !dayData.activities) {
      throw new Error('缺少必需字段 (day 或 activities)');
    }
    
    // 如果没有 date 字段，添加相对日期
    if (!dayData.date && !input.startDate) {
      dayData.date = `第${dayNumber}天`;
    }
    
    return dayData as ItineraryDay;
  } catch (error: any) {
    // 将原始响应附加到错误中，用于下次重试时反馈给 AI
    error.rawResponse = response;
    throw error;
  }
}

/**
 * 根据错误类型生成反馈分析
 */
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

/**
 * 生成行程总结（带错误反馈）
 */
async function generateSummary(
  client: any,
  conversationHistory: Array<{ role: string; content: string }>,
  input: TravelPlanInput,
  itinerary: ItineraryDay[],
  lastError?: string | null,
  lastResponse?: string | null
): Promise<any> {
  const systemPrompt = `你是JSON生成器。规则：
1. 只返回纯JSON，从{开始到}结束
2. 所有键和字符串值必须双引号
3. 不要markdown代码块
4. 不要任何其他文字`;

  const itinerarySummary = itinerary.map(day => 
    `第${day.day}天-${day.title}`
  ).join('，');
  
  const prompt = `总结${itinerary.length}天行程：${itinerarySummary}

返回格式：
{"highlights":["亮点1","亮点2","亮点3"],"tips":["建议1","建议2","建议3"]}`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];
  
  if (lastError && lastResponse) {
    console.log(`📮 添加总结错误反馈：${lastError.substring(0, 100)}`);
    
    messages.push({ role: 'user', content: prompt });
    messages.push({ role: 'assistant', content: lastResponse.substring(0, 500) });
    
    const feedbackPrompt = `❌ 你的上次输出有错误：

【错误信息】
${lastError}

【你的输出】
${lastResponse.substring(0, 200)}

【问题】
${getFeedbackAnalysis(lastError)}

重新生成正确的JSON（只返回JSON，不要其他内容）：`;
    
    messages.push({ role: 'user', content: feedbackPrompt });
  } else {
    messages.push({ role: 'user', content: prompt });
  }
  
  const response = await client.chat(messages, {
    temperature: 0.3,
    maxTokens: 300,
  });
  
  try {
    return parseAIResponse(response);
  } catch (error: any) {
    error.rawResponse = response;
    throw error;
  }
}

