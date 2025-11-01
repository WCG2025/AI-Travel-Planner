/**
 * 高德地图加载器
 * 负责动态加载高德地图 JavaScript API
 */

import type { AMapLoaderConfig } from '@/types/map.types';

// 全局 AMap 命名空间声明
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig?: {
      securityJsCode?: string;
    };
  }
}

// 默认配置
const DEFAULT_CONFIG: Partial<AMapLoaderConfig> = {
  version: '2.0',
  plugins: [
    'AMap.Geocoder',           // 地理编码
    'AMap.Geolocation',        // 定位
    'AMap.Marker',             // 点标记
    'AMap.InfoWindow',         // 信息窗口
    'AMap.Polyline',           // 折线
    'AMap.Driving',            // 驾车路径规划
    'AMap.Walking',            // 步行路径规划
    'AMap.Riding',             // 骑行路径规划
    'AMap.Transfer',           // 公交路径规划
    'AMap.Scale',              // 比例尺
    'AMap.ToolBar',            // 工具条
  ],
};

let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<any> | null = null;

/**
 * 加载高德地图 API
 */
export async function loadAMap(config: AMapLoaderConfig): Promise<any> {
  // 如果已加载，直接返回
  if (isLoaded && window.AMap) {
    return window.AMap;
  }

  // 如果正在加载，返回加载 Promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // 开始加载
  isLoading = true;
  loadPromise = new Promise((resolve, reject) => {
    try {
      // 合并配置
      const finalConfig = {
        ...DEFAULT_CONFIG,
        ...config,
      };

      // 创建脚本标签
      const script = document.createElement('script');
      script.type = 'text/javascript';
      
      // 构建 API URL
      const params = new URLSearchParams({
        key: finalConfig.key,
        version: finalConfig.version || '2.0',
        plugins: (finalConfig.plugins || []).join(','),
      });
      
      script.src = `https://webapi.amap.com/maps?${params.toString()}`;
      
      // 加载成功
      script.onload = () => {
        if (window.AMap) {
          isLoaded = true;
          isLoading = false;
          console.log('✅ 高德地图 API 加载成功');
          resolve(window.AMap);
        } else {
          const error = new Error('高德地图 API 加载失败：AMap 对象未定义');
          isLoading = false;
          reject(error);
        }
      };
      
      // 加载失败
      script.onerror = () => {
        const error = new Error('高德地图 API 加载失败：网络错误');
        isLoading = false;
        reject(error);
      };
      
      // 添加到页面
      document.head.appendChild(script);
      
    } catch (error) {
      isLoading = false;
      reject(error);
    }
  });

  return loadPromise;
}

/**
 * 获取高德地图实例（必须在加载后调用）
 */
export function getAMap(): any {
  if (!isLoaded || !window.AMap) {
    throw new Error('高德地图 API 尚未加载，请先调用 loadAMap()');
  }
  return window.AMap;
}

/**
 * 检查是否已加载
 */
export function isAMapLoaded(): boolean {
  return isLoaded && !!window.AMap;
}

/**
 * 设置安全密钥（高德地图安全升级）
 */
export function setAMapSecurityKey(securityJsCode: string) {
  window._AMapSecurityConfig = {
    securityJsCode,
  };
}

