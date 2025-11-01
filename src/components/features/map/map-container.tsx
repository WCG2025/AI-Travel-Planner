/**
 * 地图容器组件
 * 基础地图展示和交互
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useAMap } from '@/hooks/use-amap';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Coordinate, MapConfig } from '@/types/map.types';

interface MapContainerProps {
  apiKey: string;
  config?: MapConfig;
  onMapReady?: (map: any, amap: any) => void;
  className?: string;
  children?: React.ReactNode;
}

export function MapContainer({
  apiKey,
  config = {},
  onMapReady,
  className = '',
  children,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [amap, setAMap] = useState<any>(null);

  // 调试信息
  console.log('📦 MapContainer 渲染:', {
    hasApiKey: !!apiKey,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : '无',
  });

  // 加载高德地图 API
  const { loaded, error: loadError } = useAMap({
    apiKey,
    onLoad: setAMap,
  });

  // 初始化地图实例
  useEffect(() => {
    if (!loaded || !amap || !containerRef.current || map) {
      return;
    }

    try {
      console.log('🗺️ 初始化地图实例...');

      // 默认配置
      const defaultConfig: MapConfig = {
        zoom: 12,
        center: { lng: 116.397428, lat: 39.90923 }, // 北京天安门
        showTraffic: false,
        showScale: true,
        showCompass: true,
        enableScrollWheelZoom: true,
      };

      const finalConfig = { ...defaultConfig, ...config };

      // 创建地图实例
      const mapInstance = new amap.Map(containerRef.current, {
        zoom: finalConfig.zoom,
        center: finalConfig.center ? [finalConfig.center.lng, finalConfig.center.lat] : undefined,
        mapStyle: finalConfig.mapStyle || 'amap://styles/normal',
        viewMode: '2D',
        scrollWheel: finalConfig.enableScrollWheelZoom,
      });

      // 添加控件（暂时禁用以诊断 NaN 问题）
      // if (finalConfig.showScale) {
      //   mapInstance.addControl(new amap.Scale());
      // }

      // if (finalConfig.showCompass) {
      //   mapInstance.addControl(new amap.ToolBar());
      // }

      // 显示路况
      if (finalConfig.showTraffic) {
        const trafficLayer = new amap.TileLayer.Traffic({
          zIndex: 10,
        });
        trafficLayer.setMap(mapInstance);
      }

      console.log('✅ 地图实例初始化成功');
      setMap(mapInstance);
      onMapReady?.(mapInstance, amap);

    } catch (error) {
      console.error('❌ 地图初始化失败:', error);
    }
  }, [loaded, amap, config, map, onMapReady]);

  // 清理
  useEffect(() => {
    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, [map]);

  // 加载中
  if (!loaded && !loadError) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">加载地图中...</p>
        </div>
      </div>
    );
  }

  // 加载失败
  if (loadError) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">地图加载失败</p>
            <p className="text-sm mt-1">{loadError}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      {children}
    </div>
  );
}

