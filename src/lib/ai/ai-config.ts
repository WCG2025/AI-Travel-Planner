// AI 相关配置

export const AI_CONFIG = {
  // DeepSeek API 配置
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: process.env.NEXT_PUBLIC_DEEPSEEK_API_ENDPOINT || 'https://api.deepseek.com',
  
  // 模型配置
  model: 'deepseek-chat',  // DeepSeek 对话模型
  
  // 生成参数
  generation: {
    temperature: 0.7,       // 温度：0.7 平衡创造力和准确性
    maxTokens: 3000,        // 最大 token 数（降低以加快生成）
    topP: 0.9,              // Top-p 采样
    presencePenalty: 0.1,   // 存在惩罚
    frequencyPenalty: 0.1,  // 频率惩罚
  },
  
  // 重试配置
  retry: {
    maxRetries: 3,          // 最大重试次数
    retryDelay: 1000,       // 重试延迟（毫秒）
  },
  
  // 超时配置
  timeout: 120000,          // 请求超时时间（毫秒）- 2 分钟
  
  // 提示词限制
  limits: {
    maxInputLength: 2000,   // 最大输入长度（字符）
    maxDays: 30,            // 最大行程天数
    minBudget: 100,         // 最小预算（元）
    maxBudget: 1000000,     // 最大预算（元）
  },
};

// 验证 API 配置
export function validateAIConfig(): { valid: boolean; error?: string } {
  if (!AI_CONFIG.apiKey) {
    return {
      valid: false,
      error: 'DeepSeek API Key 未配置，请在 .env.local 中设置 DEEPSEEK_API_KEY',
    };
  }
  
  if (!AI_CONFIG.baseURL) {
    return {
      valid: false,
      error: 'DeepSeek API Endpoint 未配置',
    };
  }
  
  return { valid: true };
}

// 错误信息映射
export const AI_ERROR_MESSAGES = {
  'insufficient_quota': '您的 API 配额不足，请检查 DeepSeek 账户余额',
  'rate_limit_exceeded': '请求过于频繁，请稍后再试',
  'invalid_api_key': 'API Key 无效，请检查配置',
  'model_not_found': '模型不存在，请联系管理员',
  'timeout': '请求超时，请重试',
  'network_error': '网络错误，请检查网络连接',
  'parse_error': 'AI 响应解析失败，请重试',
  'validation_error': '输入参数验证失败',
  'unknown_error': '未知错误，请重试或联系管理员',
};

