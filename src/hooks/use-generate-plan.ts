'use client';

import { useState, useCallback } from 'react';
import type { TravelPlanInput, TravelPlan, GenerationStatus } from '@/types/travel-plan.types';

export function useGeneratePlan() {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  // 生成旅行计划
  const generatePlan = useCallback(async (input: TravelPlanInput) => {
    try {
      console.log('🚀 开始生成旅行计划...');
      setStatus('generating');
      setError(null);
      setPlan(null);
      setProgress('正在连接 AI 服务...');
      setProgressPercent(0);
      
      // 计算总天数用于进度显示（支持相对日期模式）
      let days: number;
      if (input.startDate && input.endDate) {
        // 绝对日期模式：从日期计算天数
        days = Math.ceil(
          (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        ) + 1;
      } else if (input.days) {
        // 相对日期模式：直接使用天数
        days = input.days;
      } else {
        // 默认值
        days = 3;
      }
      
      // 模拟进度更新（每秒更新一次）
      const progressInterval = setInterval(() => {
        setProgressPercent(prev => {
          if (prev >= 90) return prev;
          return prev + (100 / (days * 2)); // 估算每天需要约2个进度单位
        });
      }, 1000);
      
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });
      
      clearInterval(progressInterval);
      setProgress('正在接收 AI 响应...');
      setProgressPercent(95);
      
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
      setProgressPercent(100);
      
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
    progressPercent,
    generatePlan,
    reset,
  };
}

