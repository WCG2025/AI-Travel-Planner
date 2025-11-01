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
  const [state, setState] = useState<MapState>({
    loaded: isAMapLoaded(),
    error: null,
    center: null,
    zoom: 12,
  });

  // 加载地图
  const load = useCallback(async () => {
    if (state.loaded) {
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

