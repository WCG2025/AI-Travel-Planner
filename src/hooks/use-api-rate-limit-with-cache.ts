import { useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * API请求限制和缓存Hook
 * 用于防止API调用过于频繁，避免触发QPS限制，并提供缓存机制
 */
export function useApiRateLimitWithCache<T = any>(minInterval = 1500, cacheExpiry = 5 * 60 * 1000) {
  const lastRequestTime = useRef(0);
  const currentInterval = useRef(minInterval);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  /**
   * 生成缓存键
   * @param apiCall API调用函数
   * @param args API调用参数
   * @returns 缓存键
   */
  const generateCacheKey = useCallback((apiCall: Function, ...args: any[]): string => {
    try {
      // 使用函数的toString()作为标识，因为箭头函数的name属性可能是undefined
      let funcId = 'function';
      
      // 尝试获取函数名
      if (apiCall.name) {
        funcId = apiCall.name;
      } else {
        // 如果没有name属性，尝试从函数字符串中提取名称
        const funcStr = apiCall.toString();
        const nameMatch = funcStr.match(/function\s+(\w+)/);
        if (nameMatch) {
          funcId = nameMatch[1];
        } else {
          // 如果无法提取名称，使用函数字符串的前50个字符
          funcId = funcStr.substring(0, 50).replace(/\s+/g, '_');
        }
      }
      
      return `${funcId}_${JSON.stringify(args)}`;
    } catch (error) {
      // 如果生成缓存键失败，使用参数作为键
      console.warn('生成缓存键失败，使用参数作为键:', error);
      return `api_${JSON.stringify(args)}`;
    }
  }, []);

  /**
   * 从缓存获取数据
   * @param cacheKey 缓存键
   * @returns 缓存的数据或null
   */
  const getFromCache = useCallback((cacheKey: string): T | null => {
    const entry = cacheRef.current.get(cacheKey);
    if (!entry) return null;
    
    // 检查缓存是否过期
    if (Date.now() - entry.timestamp > cacheExpiry) {
      cacheRef.current.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }, [cacheExpiry]);

  /**
   * 将数据存入缓存
   * @param cacheKey 缓存键
   * @param data 数据
   */
  const setCache = useCallback((cacheKey: string, data: T): void => {
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  /**
   * 执行带限制和缓存的API调用
   * @param apiCall API调用函数
   * @param args API调用参数
   * @returns API调用结果
   */
  const executeWithLimit = useCallback(async (
    apiCall: (...args: any[]) => Promise<T>,
    ...args: any[]
  ): Promise<T | null> => {
    console.log('executeWithLimit调用:', apiCall.name || '匿名函数', args);
    
    const cacheKey = generateCacheKey(apiCall, ...args);
    console.log('生成的缓存键:', cacheKey);
    
    // 先尝试从缓存获取
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log('从缓存返回数据:', cacheKey);
      return cachedData;
    }
    
    const now = Date.now();
    
    // 检查请求间隔
    if (now - lastRequestTime.current < currentInterval.current) {
      console.log(`请求过于频繁，跳过此次请求 (间隔: ${now - lastRequestTime.current}ms < ${currentInterval.current}ms)`);
      return null;
    }
    
    lastRequestTime.current = now;
    
    try {
      console.log('执行API调用...');
      const result = await apiCall(...args);
      console.log('API调用成功，结果:', result);
      
      // 将结果存入缓存
      setCache(cacheKey, result);
      
      return result;
    } catch (error: any) {
      console.error('API调用失败:', error);
      
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
  }, [generateCacheKey, getFromCache, setCache, minInterval]);

  /**
   * 清除缓存
   * @param pattern 可选的缓存键模式，如果不提供则清除所有缓存
   */
  const clearCache = useCallback((pattern?: string): void => {
    if (!pattern) {
      cacheRef.current.clear();
      return;
    }
    
    for (const key of cacheRef.current.keys()) {
      if (key.includes(pattern)) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

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
    clearCache,
    resetInterval,
    currentInterval: currentInterval.current,
    cacheSize: cacheRef.current.size,
  };
}