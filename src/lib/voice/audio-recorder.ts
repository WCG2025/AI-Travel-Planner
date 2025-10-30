export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  // 请求麦克风权限
  async requestPermission(): Promise<boolean> {
    try {
      console.log('请求麦克风权限...');
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      console.log('✅ 麦克风权限已获取');
      return true;
    } catch (error) {
      console.error('❌ 麦克风权限被拒绝:', error);
      return false;
    }
  }
  
  // 开始录音
  async start(onDataAvailable: (audioData: ArrayBuffer) => void): Promise<void> {
    if (!this.stream) {
      throw new Error('未获取麦克风权限');
    }
    
    console.log('开始录音...');
    
    // 创建音频上下文
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ 
      sampleRate: 16000 
    });
    
    console.log('音频上下文采样率:', this.audioContext.sampleRate);
    
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    
    // 创建 ScriptProcessor（实时音频处理）
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = this.floatTo16BitPCM(inputData);
      onDataAvailable(pcmData.buffer);
    };
    
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    
    console.log('✅ 录音已启动');
  }
  
  // 停止录音
  stop(): void {
    console.log('停止录音...');
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('音频轨道已停止:', track.label);
      });
      this.stream = null;
    }
    
    console.log('✅ 录音已停止');
  }
  
  // Float32Array 转 Int16Array（PCM 格式）
  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }
}

