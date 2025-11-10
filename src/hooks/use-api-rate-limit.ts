import { useCallback, useRef } from 'react';

/**
 * API请求限制Hook
 * 用于防止API调用过于频繁，避免触发QPS限制
 */
export function useApiRateLimit(minInterval = 1500) {
  const lastRequestTime = useRef(0);
  const currentInterval = useRef(minInterval);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 执行带限制的API调用
   * @param apiCall API调用函数
   * @param args API调用参数
   * @returns API调用结果
   */
  const executeWithLimit = useCallback(async <T>(
    apiCall: (...args: any[]) => Promise<T>,
    ...args: any[]
  ): Promise<T | null> => {
    const now = Date.now();
    
    // 检查请求间隔
    if (now - lastRequestTime.current < currentInterval.current) {
      console.log(`请求过于频繁，跳过此次请求 (间隔: ${now - lastRequestTime.current}ms < ${currentInterval.current}ms)`);
      return null;
    }
    
    lastRequestTime.current = now;
    
    try {
      const result = await apiCall(...args);
      return result;
    } catch (error: any) {
      // 如果是QPS限制错误，增加请求间隔
      if (error.message && error.message.includes('CUQPS_HAS_EXCEEDED_THE_LIMIT')) {
        console.log('检测到QPS限制，增加请求间隔');
        currentInterval.current = 3000; // 增加到3秒
        
        // 清除之前的定时器
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // 10秒后恢复正常间隔
        timeoutRef.current = setTimeout(() => {
          currentInterval.current = minInterval;
          console.log(`恢复API请求间隔为${minInterval}ms`);
        }, 10000);
      }
      
      throw error;
    }
  }, [minInterval]);

  /**
   * 重置请求间隔
   */
  const resetInterval = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    currentInterval.current = minInterval;
    lastRequestTime.current = 0;
  }, [minInterval]);

  return {
    executeWithLimit,
    resetInterval,
    currentInterval: currentInterval.current,
  };
}