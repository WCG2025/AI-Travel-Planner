/**
 * 高德地图 React Hook
 * 管理地图加载状态和实例
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadAMap, isAMapLoaded } from '@/lib/map/amap-loader';
import type { MapState } from '@/types/map.types';

interface UseAMapOptions {
  apiKey: string;
  onLoad?: (amap: any) => void;
  onError?: (error: Error) => void;
}

export function useAMap({ apiKey, onLoad, onError }: UseAMapOptions) {
  const initialLoaded = isAMapLoaded();
  
  const [state, setState] = useState<MapState>({
    loaded: initialLoaded,
    error: null,
    center: null,
    zoom: 12,
  });

  console.log('🔧 useAMap 初始化:', {
    hasApiKey: !!apiKey,
    initialLoaded,
    currentLoaded: state.loaded,
  });

  // 加载地图
  const load = useCallback(async () => {
    console.log('🔍 load() 被调用:', {
      state_loaded: state.loaded,
      hasApiKey: !!apiKey,
      isAMapLoaded: isAMapLoaded(),
    });

    if (state.loaded) {
      console.log('⏭️ 地图已加载，跳过');
      // 如果已加载，但还没有调用 onLoad，需要调用
      if (onLoad && isAMapLoaded()) {
        const AMap = (window as any).AMap;
        if (AMap) {
          onLoad(AMap);
        }
      }
      return;
    }

    if (!apiKey) {
      const error = new Error('高德地图 API Key 未配置');
      setState(prev => ({ ...prev, error: error.message }));
      onError?.(error);
      return;
    }

    try {
      console.log('🗺️ 开始加载高德地图...');
      const amap = await loadAMap({ key: apiKey });
      
      setState(prev => ({
        ...prev,
        loaded: true,
        error: null,
      }));

      onLoad?.(amap);
    } catch (error: any) {
      console.error('❌ 高德地图加载失败:', error);
      setState(prev => ({
        ...prev,
        loaded: false,
        error: error.message,
      }));
      onError?.(error);
    }
  }, [apiKey, state.loaded, onLoad, onError]);

  // 自动加载
  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    reload: load,
  };
}

