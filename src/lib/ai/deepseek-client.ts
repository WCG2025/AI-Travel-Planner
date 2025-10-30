import OpenAI from 'openai';
import { AI_CONFIG, validateAIConfig, AI_ERROR_MESSAGES } from './ai-config';

// DeepSeek 客户端类
export class DeepSeekClient {
  private client: OpenAI;
  
  constructor() {
    // 验证配置
    const validation = validateAIConfig();
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // 初始化 OpenAI 客户端（DeepSeek API 兼容 OpenAI 格式）
    this.client = new OpenAI({
      apiKey: AI_CONFIG.apiKey,
      baseURL: AI_CONFIG.baseURL,
      timeout: AI_CONFIG.timeout,
      maxRetries: AI_CONFIG.retry.maxRetries,
    });
    
    console.log('✅ DeepSeek 客户端初始化成功');
  }
  
  /**
   * 发送聊天请求
   * @param messages 消息列表
   * @param options 可选参数
   */
  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ): Promise<string> {
    try {
      console.log('📤 发送请求到 DeepSeek API...');
      console.log('消息数量:', messages.length);
      
      const response = await this.client.chat.completions.create({
        model: AI_CONFIG.model,
        messages: messages as any,
        temperature: options?.temperature ?? AI_CONFIG.generation.temperature,
        max_tokens: options?.maxTokens ?? AI_CONFIG.generation.maxTokens,
        top_p: AI_CONFIG.generation.topP,
        presence_penalty: AI_CONFIG.generation.presencePenalty,
        frequency_penalty: AI_CONFIG.generation.frequencyPenalty,
        stream: options?.stream ?? false,
      });
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('AI 返回内容为空');
      }
      
      console.log('✅ 收到 AI 响应');
      console.log('Token 使用:', response.usage);
      
      return content;
    } catch (error: any) {
      console.error('❌ DeepSeek API 调用失败:', error);
      throw this.handleError(error);
    }
  }
  
  /**
   * 流式聊天请求
   * @param messages 消息列表
   * @param onChunk 接收到每个 chunk 的回调
   */
  async chatStream(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      console.log('📤 发送流式请求到 DeepSeek API...');
      
      const stream = await this.client.chat.completions.create({
        model: AI_CONFIG.model,
        messages: messages as any,
        temperature: AI_CONFIG.generation.temperature,
        max_tokens: AI_CONFIG.generation.maxTokens,
        top_p: AI_CONFIG.generation.topP,
        stream: true,
      });
      
      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      }
      
      console.log('✅ 流式响应完成');
      return fullContent;
    } catch (error: any) {
      console.error('❌ DeepSeek 流式 API 调用失败:', error);
      throw this.handleError(error);
    }
  }
  
  /**
   * 处理 API 错误
   */
  private handleError(error: any): Error {
    // OpenAI SDK 错误
    if (error.response) {
      const status = error.response.status;
      const errorCode = error.response.data?.error?.code;
      
      console.error('API 错误状态:', status);
      console.error('错误代码:', errorCode);
      
      // 根据错误码返回友好的错误信息
      if (status === 401) {
        return new Error(AI_ERROR_MESSAGES.invalid_api_key);
      } else if (status === 429) {
        return new Error(AI_ERROR_MESSAGES.rate_limit_exceeded);
      } else if (status === 402 || errorCode === 'insufficient_quota') {
        return new Error(AI_ERROR_MESSAGES.insufficient_quota);
      } else if (status === 404) {
        return new Error(AI_ERROR_MESSAGES.model_not_found);
      }
    }
    
    // 网络错误
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new Error(AI_ERROR_MESSAGES.timeout);
    }
    
    if (error.code === 'ENOTFOUND' || error.message?.includes('network')) {
      return new Error(AI_ERROR_MESSAGES.network_error);
    }
    
    // 其他错误
    return new Error(
      error.message || AI_ERROR_MESSAGES.unknown_error
    );
  }
  
  /**
   * 测试 API 连接
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 测试 DeepSeek API 连接...');
      
      const response = await this.chat([
        { role: 'user', content: '你好，请简短回复。' },
      ]);
      
      if (response) {
        console.log('✅ API 连接测试成功');
        return { success: true };
      }
      
      return { success: false, error: '未收到响应' };
    } catch (error: any) {
      console.error('❌ API 连接测试失败:', error);
      return {
        success: false,
        error: error.message || '连接失败',
      };
    }
  }
}

// 创建单例实例
let deepSeekClient: DeepSeekClient | null = null;

/**
 * 获取 DeepSeek 客户端实例
 */
export function getDeepSeekClient(): DeepSeekClient {
  if (!deepSeekClient) {
    deepSeekClient = new DeepSeekClient();
  }
  return deepSeekClient;
}

