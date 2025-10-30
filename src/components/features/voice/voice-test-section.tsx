'use client';

import { useState } from 'react';
import { VoiceInput } from './voice-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function VoiceTestSection() {
  const [history, setHistory] = useState<string[]>([]);
  
  const handleVoiceResult = (text: string) => {
    // 当用户点击"确认提交"时，保存到历史记录
    if (text.trim()) {
      setHistory(prev => [text, ...prev].slice(0, 5)); // 保留最近5条
    }
  };
  
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🎤 语音识别测试
              <Badge variant="secondary" className="text-xs">第三阶段</Badge>
            </CardTitle>
            <CardDescription className="mt-2">
              测试科大讯飞语音识别 API 是否正常工作
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 语音输入组件 */}
        <VoiceInput onResult={handleVoiceResult} />
        
        {/* 提交历史记录 */}
        {history.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                📝 提交历史（最近5条）
              </h3>
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted/50 rounded-md text-sm border border-border/50"
                  >
                    <span className="text-muted-foreground mr-2">#{index + 1}</span>
                    <span className="whitespace-pre-wrap">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        {/* 提示信息 */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>💡 <strong>测试说明：</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>点击"开始语音输入"按钮开始录音</li>
            <li>清晰地说出您想要测试的内容</li>
            <li>说完后点击"停止录音"按钮结束</li>
            <li>可以多次录制，结果会自动累加</li>
            <li>完成后点击"确认提交"保存到历史记录</li>
          </ul>
          <p className="mt-2">
            <strong>测试建议：</strong>尝试分段说话，如第一次说"我想去北京旅游三天"，第二次说"预算一万元左右"，测试累积功能
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

