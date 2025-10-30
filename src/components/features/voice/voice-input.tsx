'use client';

import { useVoiceRecognition } from '@/hooks/use-voice-recognition';
import { VoiceButton } from './voice-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string) => void;
}

export function VoiceInput({ onResult }: VoiceInputProps) {
  const { status, text, error, startRecognition, stopRecognition, reset } = 
    useVoiceRecognition();
  
  const handleStop = () => {
    stopRecognition();
    // 停止后文本会自动保存到累积文本中
  };
  
  const handleSubmit = () => {
    if (text) {
      onResult(text);
      reset(); // 提交后清空所有文本
    }
  };
  
  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'listening':
        return 'default';
      case 'error':
        return 'destructive';
      case 'connecting':
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return '就绪';
      case 'connecting':
        return '连接中...';
      case 'listening':
        return '正在听...';
      case 'processing':
        return '处理中...';
      case 'error':
        return '错误';
      default:
        return '未知';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* 状态指示 */}
      <div className="flex items-center gap-2">
        <Badge variant={getStatusBadgeVariant()}>
          {getStatusText()}
        </Badge>
        {status === 'listening' && (
          <span className="text-sm text-muted-foreground animate-pulse">
            请说话...
          </span>
        )}
      </div>
      
      {/* 语音按钮和控制 */}
      <div className="flex gap-2">
        <VoiceButton
          status={status}
          onStart={startRecognition}
          onStop={handleStop}
        />
        {text && status === 'idle' && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              className="flex-shrink-0"
            >
              清空重录
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleSubmit}
              className="flex-shrink-0"
            >
              确认提交
            </Button>
          </>
        )}
      </div>
      
      {/* 识别结果 */}
      {text && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                识别结果：
                {status === 'listening' && <span className="text-primary ml-2">（实时更新中...）</span>}
              </p>
              <p className="text-base font-medium whitespace-pre-wrap">{text}</p>
              {status === 'idle' && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 可以继续点击"开始语音输入"追加更多内容，或点击"确认提交"完成
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
      
      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* 使用提示 */}
      {status === 'idle' && !text && !error && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>使用说明</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>点击"开始语音输入"按钮，然后说话。说完后点击"停止录音"按钮结束。</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>💡 <strong>重要提示：</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                  <li>确保浏览器已授予麦克风权限</li>
                  <li>说话时尽量保持连续，避免长时间停顿</li>
                  <li>连续10秒无声音，系统会自动断开连接</li>
                  <li>可以分多次录制，结果会自动累加</li>
                  <li>完成后点击"确认提交"应用结果</li>
                </ul>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

