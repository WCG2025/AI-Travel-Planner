import { getDeepSeekClient } from './deepseek-client';
import { getSystemPrompt, getTravelPlanPrompt, parseAIResponse, validateTravelPlan } from './prompts';
import type { TravelPlanInput, TravelPlan } from '@/types/travel-plan.types';

/**
 * 生成旅行计划
 */
export async function generateTravelPlan(input: TravelPlanInput): Promise<TravelPlan> {
  console.log('🚀 开始生成旅行计划...');
  console.log('输入参数:', input);
  
  try {
    // 获取 DeepSeek 客户端
    const client = getDeepSeekClient();
    
    // 生成 Prompt
    const systemPrompt = getSystemPrompt();
    const userPrompt = getTravelPlanPrompt(input);
    
    console.log('📝 发送 Prompt 到 AI...');
    
    // 调用 AI
    const response = await client.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.7,
      maxTokens: 4000,
    });
    
    console.log('📥 收到 AI 响应');
    
    // 解析响应
    const planData = parseAIResponse(response);
    
    // 验证数据格式
    const validation = validateTravelPlan(planData);
    if (!validation.valid) {
      console.error('❌ 行程数据验证失败:', validation.errors);
      throw new Error(`行程数据格式错误：${validation.errors.join('、')}`);
    }
    
    console.log('✅ 行程生成成功');
    
    // 补充输入的偏好信息
    const plan: TravelPlan = {
      ...planData,
      budget: input.budget,
      preferences: input.preferences,
    };
    
    return plan;
  } catch (error: any) {
    console.error('❌ 生成旅行计划失败:', error);
    throw error;
  }
}

/**
 * 流式生成旅行计划
 */
export async function generateTravelPlanStream(
  input: TravelPlanInput,
  onChunk: (chunk: string) => void
): Promise<TravelPlan> {
  console.log('🚀 开始流式生成旅行计划...');
  
  try {
    const client = getDeepSeekClient();
    const systemPrompt = getSystemPrompt();
    const userPrompt = getTravelPlanPrompt(input);
    
    // 流式调用
    const fullResponse = await client.chatStream(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      onChunk
    );
    
    // 解析完整响应
    const planData = parseAIResponse(fullResponse);
    
    // 验证
    const validation = validateTravelPlan(planData);
    if (!validation.valid) {
      throw new Error(`行程数据格式错误：${validation.errors.join('、')}`);
    }
    
    const plan: TravelPlan = {
      ...planData,
      budget: input.budget,
      preferences: input.preferences,
    };
    
    return plan;
  } catch (error: any) {
    console.error('❌ 流式生成失败:', error);
    throw error;
  }
}

