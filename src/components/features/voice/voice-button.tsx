'use client';

import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VoiceRecognitionStatus } from '@/types/voice.types';

interface VoiceButtonProps {
  status: VoiceRecognitionStatus;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function VoiceButton({ status, onStart, onStop, disabled }: VoiceButtonProps) {
  const isListening = status === 'listening';
  const isProcessing = status === 'connecting' || status === 'processing';
  
  return (
    <Button
      type="button"
      size="lg"
      variant={isListening ? 'destructive' : 'default'}
      disabled={disabled || isProcessing}
      onClick={isListening ? onStop : onStart}
      className={cn(
        'relative transition-all duration-300',
        isListening && 'animate-pulse'
      )}
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {status === 'connecting' ? '连接中...' : '处理中...'}
        </>
      ) : isListening ? (
        <>
          <MicOff className="mr-2 h-5 w-5" />
          停止录音
        </>
      ) : (
        <>
          <Mic className="mr-2 h-5 w-5" />
          开始语音输入
        </>
      )}
      
      {isListening && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </Button>
  );
}

