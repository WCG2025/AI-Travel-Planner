export const VOICE_CONFIG = {
  // WebSocket 地址
  wsUrl: 'wss://iat-api.xfyun.cn/v2/iat',
  
  // 音频参数
  audio: {
    sampleRate: 16000,      // 采样率
    encoding: 'raw',         // 编码格式
    channels: 1,             // 声道数
    bitDepth: 16,            // 位深度
    frameSize: 1280,         // 每帧大小（字节）
  },
  
  // 识别参数
  recognition: {
    language: 'zh_cn',       // 中文
    accent: 'mandarin',      // 普通话
    domain: 'iat',           // 应用领域
    punctuation: true,       // 动态添加标点
    vadEos: 10000,           // 静音超时时间(毫秒) - 10秒无声音自动断句并断开连接
  },
  
  // 权限提示
  permissions: {
    title: '需要麦克风权限',
    message: '为了使用语音输入功能，请允许浏览器访问您的麦克风。',
  },
  
  // 使用提示
  tips: {
    silenceTimeout: '连续10秒无声音输入，科大讯飞服务器会自动断开连接',
    continuous: '说话时尽量保持连续，避免长时间停顿',
  },
};

