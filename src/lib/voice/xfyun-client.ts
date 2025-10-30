import CryptoJS from 'crypto-js';
import { Base64 } from 'js-base64';
import { VOICE_CONFIG } from './voice-config';
import type { VoiceConfig, VoiceRecognitionResult } from '@/types/voice.types';

export class XFYunVoiceClient {
  private ws: WebSocket | null = null;
  private config: VoiceConfig;
  private resultCallback: ((result: VoiceRecognitionResult) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private closeCallback: ((isManual: boolean) => void) | null = null;
  private isFirstFrame: boolean = true;
  private isManualClose: boolean = false; // 标记是否为主动关闭
  
  constructor(config: VoiceConfig) {
    this.config = config;
  }
  
  // 生成鉴权 URL
  private getAuthUrl(): string {
    const url = new URL(VOICE_CONFIG.wsUrl);
    const host = url.host;
    const path = url.pathname;
    const date = new Date().toUTCString();
    
    console.log('生成鉴权 URL - Host:', host);
    console.log('生成鉴权 URL - Path:', path);
    console.log('生成鉴权 URL - Date:', date);
    
    // 生成签名
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.config.apiSecret);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    
    const authorizationOrigin = `api_key="${this.config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authorization = Base64.encode(authorizationOrigin);
    
    const authUrl = `${VOICE_CONFIG.wsUrl}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
    console.log('鉴权 URL 生成完成');
    
    return authUrl;
  }
  
  // 连接 WebSocket
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const authUrl = this.getAuthUrl();
        console.log('开始连接 WebSocket...');
        this.ws = new WebSocket(authUrl);
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket 连接成功');
          resolve();
        };
        
        this.ws.onerror = (error) => {
          console.error('❌ WebSocket 连接错误:', error);
          reject(new Error('WebSocket 连接失败'));
        };
        
        this.ws.onclose = (event) => {
          console.log('⚠️ WebSocket 连接关闭:', event.code, event.reason);
          const isManual = this.isManualClose;
          
          if (event.code === 1000) {
            console.log(isManual ? '✅ 用户主动关闭' : '⚠️ 服务器正常关闭');
          } else if (event.code === 1006) {
            console.log('⚠️ 异常断开（可能是服务器超时或网络问题）');
          } else {
            console.log('⚠️ 其他原因关闭');
          }
          
          // 通知外部连接已关闭，并传递是否为主动关闭的标志
          if (this.closeCallback) {
            this.closeCallback(isManual);
          }
          
          // 重置标志
          this.isManualClose = false;
        };
      } catch (error) {
        console.error('创建 WebSocket 时出错:', error);
        reject(error);
      }
    });
  }
  
  // 发送音频数据
  sendAudio(audioData: ArrayBuffer, isLast: boolean = false): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket 未连接，状态:', this.ws?.readyState);
      throw new Error('WebSocket 未连接');
    }
    
    // 确定帧状态：0=首帧，1=中间帧，2=尾帧
    let frameStatus = 1;
    if (isLast) {
      frameStatus = 2;
    } else if (this.isFirstFrame) {
      frameStatus = 0;
      this.isFirstFrame = false;
      console.log('📤 发送首帧数据');
    }
    
    const params = {
      common: {
        app_id: this.config.appId,
      },
      business: {
        language: VOICE_CONFIG.recognition.language,
        accent: VOICE_CONFIG.recognition.accent,
        domain: VOICE_CONFIG.recognition.domain,
        dwa: 'wpgs', // 动态修正
        vad_eos: 10000, // 静音超时时间(ms)，10秒无声音自动断句
        ptt: 0, // 标点符号
      },
      data: {
        status: frameStatus,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: this.arrayBufferToBase64(audioData),
      },
    };
    
    if (frameStatus === 0) {
      console.log('📤 发送首帧，大小:', audioData.byteLength, '字节');
    } else if (frameStatus === 2) {
      console.log('📤 发送尾帧');
    } else {
      // 中间帧不打印太多日志，避免刷屏
      if (Math.random() < 0.1) { // 只打印 10% 的日志
        console.log('📤 发送音频数据，大小:', audioData.byteLength, '字节');
      }
    }
    
    this.ws.send(JSON.stringify(params));
  }
  
  // 监听识别结果
  onResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.resultCallback = callback;
    
    if (!this.ws) return;
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('收到识别结果:', data);
        
        if (data.code !== 0) {
          console.error('识别错误:', data.message);
          if (this.errorCallback) {
            this.errorCallback(new Error(data.message));
          }
          return;
        }
        
        // 解析结果
        if (data.data && data.data.result) {
          const text = this.parseResult(data);
          const isFinal = data.data.status === 2;
          
          console.log('解析文本:', text, '是否最终结果:', isFinal);
          
          if (this.resultCallback) {
            this.resultCallback({ text, isFinal });
          }
        }
      } catch (error) {
        console.error('解析消息时出错:', error);
      }
    };
  }
  
  // 监听错误
  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }
  
  // 监听连接关闭
  // isManual: true = 用户主动关闭，false = 服务器断开
  onClose(callback: (isManual: boolean) => void): void {
    this.closeCallback = callback;
  }
  
  // 解析识别结果
  private parseResult(data: any): string {
    try {
      const words = data.data.result.ws;
      return words.map((w: any) => w.cw[0].w).join('');
    } catch (error) {
      console.error('解析结果时出错:', error);
      return '';
    }
  }
  
  // ArrayBuffer 转 Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  // 关闭连接
  close(): void {
    if (this.ws) {
      console.log('🔌 主动关闭 WebSocket 连接');
      this.isManualClose = true; // 标记为主动关闭
      this.ws.close();
      this.ws = null;
    }
    // 重置首帧标志
    this.isFirstFrame = true;
  }
  
  // 检查连接状态
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

