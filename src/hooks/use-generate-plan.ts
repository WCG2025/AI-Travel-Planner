'use client';

import { useState, useCallback } from 'react';
import type { TravelPlanInput, TravelPlan, GenerationStatus } from '@/types/travel-plan.types';

export function useGeneratePlan() {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  
  // 生成旅行计划
  const generatePlan = useCallback(async (input: TravelPlanInput) => {
    try {
      console.log('🚀 开始生成旅行计划...');
      setStatus('generating');
      setError(null);
      setPlan(null);
      setProgress('正在连接 AI 服务...');
      
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });
      
      setProgress('正在接收 AI 响应...');
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '生成失败');
      }
      
      if (!data.success) {
        throw new Error(data.error || '生成失败');
      }
      
      console.log('✅ 计划生成成功');
      setPlan(data.plan);
      setStatus('success');
      setProgress('生成完成！');
      
      return data.plan;
    } catch (err: any) {
      console.error('❌ 生成计划失败:', err);
      setStatus('error');
      setError(err.message || '生成失败，请重试');
      setProgress('');
      throw err;
    }
  }, []);
  
  // 重置状态
  const reset = useCallback(() => {
    setStatus('idle');
    setPlan(null);
    setError(null);
    setProgress('');
  }, []);
  
  return {
    status,
    plan,
    error,
    progress,
    generatePlan,
    reset,
  };
}

