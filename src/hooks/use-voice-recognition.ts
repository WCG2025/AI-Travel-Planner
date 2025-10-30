'use client';

import { useState, useCallback, useRef } from 'react';
import { XFYunVoiceClient } from '@/lib/voice/xfyun-client';
import { AudioRecorder } from '@/lib/voice/audio-recorder';
import type { VoiceRecognitionStatus, VoiceRecognitionResult } from '@/types/voice.types';

export function useVoiceRecognition() {
  const [status, setStatus] = useState<VoiceRecognitionStatus>('idle');
  const [text, setText] = useState(''); // 显示的文本（累积 + 当前会话）
  const [error, setError] = useState<string | null>(null);
  
  const clientRef = useRef<XFYunVoiceClient | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const currentSessionTextRef = useRef<string>(''); // 当前识别会话的文本（单次会话内累积）
  const currentSegmentTextRef = useRef<string>(''); // 当前正在识别的段落（流式替换）
  const accumulatedTextRef = useRef<string>(''); // 已完成会话的累积文本
  
  // 开始识别
  const startRecognition = useCallback(async () => {
    try {
      console.log('=== 开始语音识别流程 ===');
      console.log('当前累积文本:', accumulatedTextRef.current);
      setStatus('connecting');
      setError(null);
      currentSessionTextRef.current = ''; // 清空当前会话文本
      currentSegmentTextRef.current = ''; // 清空当前段落文本
      
      // 检查环境变量
      const appId = process.env.NEXT_PUBLIC_XFYUN_APP_ID;
      const apiKey = process.env.NEXT_PUBLIC_XFYUN_API_KEY;
      const apiSecret = process.env.NEXT_PUBLIC_XFYUN_API_SECRET;
      
      console.log('检查环境变量配置:');
      console.log('- APPID:', appId ? '已配置 ✓' : '未配置 ✗');
      console.log('- APIKey:', apiKey ? '已配置 ✓' : '未配置 ✗');
      console.log('- APISecret:', apiSecret ? '已配置 ✓' : '未配置 ✗');
      
      if (!appId || !apiKey || !apiSecret) {
        throw new Error('科大讯飞 API 配置不完整，请检查 .env.local 文件');
      }
      
      // 创建客户端
      console.log('创建科大讯飞客户端...');
      clientRef.current = new XFYunVoiceClient({
        appId,
        apiKey,
        apiSecret,
      });
      
      // 连接 WebSocket
      console.log('连接 WebSocket...');
      await clientRef.current.connect();
      
      // 监听识别结果
      clientRef.current.onResult((result: VoiceRecognitionResult) => {
        console.log('收到识别结果:', result);
        if (result.text) {
          // 检测是否开始了新的一段话
          // 如果新文本比当前段落短，说明是新的一段（科大讯飞重新开始识别）
          if (currentSegmentTextRef.current && result.text.length < currentSegmentTextRef.current.length) {
            console.log('🔄 检测到新段落，保存前一段:', currentSegmentTextRef.current);
            // 将前一段追加到当前会话文本
            if (currentSessionTextRef.current) {
              currentSessionTextRef.current += ' ' + currentSegmentTextRef.current;
            } else {
              currentSessionTextRef.current = currentSegmentTextRef.current;
            }
          }
          
          // 更新当前段落文本（科大讯飞返回的是当前段落的累积结果）
          currentSegmentTextRef.current = result.text;
          
          // 计算完整的当前会话文本（已保存的段落 + 当前段落）
          const fullSessionText = currentSessionTextRef.current
            ? `${currentSessionTextRef.current} ${result.text}`
            : result.text;
          
          // 显示文本 = 历史累积 + 当前完整会话
          const combinedText = accumulatedTextRef.current 
            ? `${accumulatedTextRef.current}\n${fullSessionText}` 
            : fullSessionText;
          setText(combinedText);
          console.log('当前段落:', result.text);
          console.log('完整会话文本:', fullSessionText);
        }
      });
      
      // 监听错误
      clientRef.current.onError((err: Error) => {
        console.error('识别过程中出错:', err);
        setError(err.message);
        setStatus('error');
      });
      
      // 监听 WebSocket 断开（可能是用户主动关闭或服务器超时断开）
      clientRef.current.onClose((isManual: boolean) => {
        console.log(isManual ? '✅ 用户主动关闭连接' : '⚠️ WebSocket 连接被动断开');
        
        // 停止录音
        if (recorderRef.current) {
          recorderRef.current.stop();
          recorderRef.current = null;
        }
        
        // 保存当前段落到会话文本
        if (currentSegmentTextRef.current) {
          if (currentSessionTextRef.current) {
            currentSessionTextRef.current += ' ' + currentSegmentTextRef.current;
          } else {
            currentSessionTextRef.current = currentSegmentTextRef.current;
          }
          console.log('💾 保存最后一段:', currentSegmentTextRef.current);
        }
        
        // 如果有当前会话的识别结果，追加到累积文本
        if (currentSessionTextRef.current) {
          if (accumulatedTextRef.current) {
            accumulatedTextRef.current += '\n' + currentSessionTextRef.current;
          } else {
            accumulatedTextRef.current = currentSessionTextRef.current;
          }
          setText(accumulatedTextRef.current);
          console.log('✅ 已保存当前会话识别结果');
          console.log('累积文本:', accumulatedTextRef.current);
        }
        
        // 更新状态
        if (clientRef.current) {
          clientRef.current = null;
        }
        
          // 判断如何处理状态
        if (isManual) {
          // 用户主动关闭，不显示警告
          setStatus('idle');
          console.log('✅ 语音识别正常结束');
        } else {
          // 服务器被动断开
          if (currentSessionTextRef.current || currentSegmentTextRef.current) {
            // 有识别结果，视为正常结束
            setStatus('idle');
            console.log('✅ 已获取到识别结果，连接正常结束');
          } else {
            // 无识别结果，显示警告
            setStatus('error');
            setError('⚠️ 连接已断开。提示：说话间隔不要太长，科大讯飞服务器会在10秒无声音时自动断开连接。');
          }
        }
        
        // 清空当前会话和段落文本
        currentSessionTextRef.current = '';
        currentSegmentTextRef.current = '';
      });
      
      // 创建录音器
      console.log('创建音频录制器...');
      recorderRef.current = new AudioRecorder();
      const hasPermission = await recorderRef.current.requestPermission();
      
      if (!hasPermission) {
        throw new Error('未获取麦克风权限，请在浏览器设置中允许使用麦克风');
      }
      
      // 开始录音
      console.log('开始录音和识别...');
      await recorderRef.current.start((audioData) => {
        try {
          clientRef.current?.sendAudio(audioData);
        } catch (err) {
          console.error('发送音频数据失败:', err);
        }
      });
      
      setStatus('listening');
      console.log('=== 语音识别已启动，正在监听... ===');
    } catch (err) {
      console.error('=== 启动语音识别失败 ===', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : '识别失败，请重试');
      
      // 清理资源
      if (clientRef.current) {
        clientRef.current.close();
        clientRef.current = null;
      }
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
    }
  }, []);
  
  // 停止识别
  const stopRecognition = useCallback(() => {
    console.log('=== 用户主动停止语音识别 ===');
    setStatus('processing');
    
    // 发送最后一帧
    if (clientRef.current) {
      try {
        clientRef.current.sendAudio(new ArrayBuffer(0), true);
      } catch (err) {
        console.error('发送结束帧失败:', err);
      }
      
      // 延迟关闭连接，等待最后的识别结果
      // close() 会触发 onClose 回调，并传递 isManual=true
      setTimeout(() => {
        if (clientRef.current) {
          clientRef.current.close(); // 主动关闭，会设置 isManualClose = true
          clientRef.current = null;
        }
      }, 500);
    } else {
      // 如果连接已关闭，直接设置状态
      setStatus('idle');
    }
    
    // 停止录音
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
    console.log('=== 语音识别已停止 ===');
  }, []);
  
  // 重置（清空所有累积文本）
  const reset = useCallback(() => {
    console.log('🔄 重置语音识别状态（清空所有文本）');
    setText('');
    currentSessionTextRef.current = '';
    currentSegmentTextRef.current = '';
    accumulatedTextRef.current = '';
    setError(null);
    setStatus('idle');
  }, []);
  
  return {
    status,
    text,
    error,
    startRecognition,
    stopRecognition,
    reset,
  };
}

