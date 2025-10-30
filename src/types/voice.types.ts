// 语音识别状态
export type VoiceRecognitionStatus = 
  | 'idle'       // 空闲
  | 'connecting' // 连接中
  | 'listening'  // 监听中
  | 'processing' // 处理中
  | 'error';     // 错误

// 语音识别配置
export interface VoiceConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
  language?: 'zh_cn' | 'en_us'; // 语言
  accent?: 'mandarin' | 'cantonese'; // 方言
}

// 语音识别结果
export interface VoiceRecognitionResult {
  text: string;        // 识别文本
  isFinal: boolean;    // 是否为最终结果
  confidence?: number; // 置信度
}

// 语音识别错误
export interface VoiceRecognitionError {
  code: string;
  message: string;
}

