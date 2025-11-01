/**
 * 地理编码服务
 * 地址 ⟷ 坐标 相互转换
 */

import { getAMap } from './amap-loader';
import type { Coordinate, Address, GeocodingResult } from '@/types/map.types';

/**
 * 地理编码：地址 → 坐标
 * 调用服务端 API，使用高德 Web服务
 */
export async function geocode(address: string, city?: string): Promise<GeocodingResult> {
  try {
    console.log(`🔍 开始地理编码: ${address} (城市: ${city || '全国'})`);
    
    // 调用服务端 API
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        city,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const error = new Error(data.error || `地理编码失败: ${address}`);
      console.error('❌', error.message);
      throw error;
    }

    const result: GeocodingResult = {
      coordinate: data.coordinate,
      address: data.address,
      confidence: data.confidence || 0.8,
    };

    console.log(`✅ 地理编码成功: ${address} → (${result.coordinate.lng}, ${result.coordinate.lat})`);
    
    return result;
    
  } catch (error: any) {
    console.error('❌ 地理编码异常:', address, error);
    throw error;
  }
}

/**
 * 逆地理编码：坐标 → 地址
 */
export async function reverseGeocode(coordinate: Coordinate): Promise<GeocodingResult> {
  return new Promise((resolve, reject) => {
    try {
      const AMap = getAMap();
      const geocoder = new AMap.Geocoder();

      const lngLat = [coordinate.lng, coordinate.lat];

      geocoder.getAddress(lngLat, (status: string, result: any) => {
        if (status === 'complete' && result.info === 'OK') {
          const regeocode = result.regeocode;
          const addressComponent = regeocode.addressComponent;

          const geocodingResult: GeocodingResult = {
            coordinate,
            address: {
              province: addressComponent.province,
              city: addressComponent.city,
              district: addressComponent.district,
              street: addressComponent.street,
              streetNumber: addressComponent.streetNumber,
              formattedAddress: regeocode.formattedAddress,
            },
          };

          console.log(`✅ 逆地理编码成功: (${coordinate.lng}, ${coordinate.lat}) → ${regeocode.formattedAddress}`);
          resolve(geocodingResult);
        } else {
          const error = new Error(`逆地理编码失败: ${result.info || status}`);
          console.error('❌', error.message);
          reject(error);
        }
      });
    } catch (error) {
      console.error('❌ 逆地理编码异常:', error);
      reject(error);
    }
  });
}

/**
 * 批量地理编码（带并发控制）
 * 使用服务端API，更稳定可靠
 */
export async function batchGeocode(
  addresses: string[],
  city?: string,
  concurrency: number = 1 // 进一步降低到1，完全避免 QPS 限流
): Promise<(GeocodingResult | null)[]> {
  console.log(`🔄 批量地理编码: ${addresses.length} 个地址，并发数: ${concurrency} (使用服务端API - 串行模式)`);
  
  const results: (GeocodingResult | null)[] = new Array(addresses.length).fill(null);
  const startTime = Date.now();
  
  // 分批处理
  for (let i = 0; i < addresses.length; i += concurrency) {
    const batch = addresses.slice(i, Math.min(i + concurrency, addresses.length));
    const batchIndex = i;
    
    const batchNum = Math.floor(i / concurrency) + 1;
    const totalBatches = Math.ceil(addresses.length / concurrency);
    console.log(`📦 处理批次 ${batchNum}/${totalBatches}: ${batch.length} 个地址`);
    console.log(`   地址列表:`, batch.join(', '));
    
    const batchStartTime = Date.now();
    const batchResults = await Promise.allSettled(
      batch.map((address, idx) => {
        console.log(`   → 正在编码 [${batchIndex + idx + 1}/${addresses.length}]: ${address}`);
        return geocode(address, city);
      })
    );
    const batchDuration = ((Date.now() - batchStartTime) / 1000).toFixed(1);
    
    let successInBatch = 0;
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results[batchIndex + index] = result.value;
        successInBatch++;
      } else {
        console.warn(`⚠️ 地理编码失败: ${batch[index]}`);
        console.warn(`   原因:`, result.reason?.message || result.reason);
        results[batchIndex + index] = null;
      }
    });
    
    console.log(`✅ 批次 ${batchNum} 完成: ${successInBatch}/${batch.length} 成功 (耗时 ${batchDuration}秒)`);
    
    // 增加延迟，彻底避免 QPS 限流
    if (i + concurrency < addresses.length) {
      console.log(`⏸️ 等待 600ms 后继续...`);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ 批量地理编码完成: ${successCount}/${addresses.length} 成功 (总耗时 ${totalDuration}秒)`);
  
  return results;
}

/**
 * 获取当前位置
 */
export async function getCurrentPosition(): Promise<Coordinate> {
  return new Promise((resolve, reject) => {
    try {
      const AMap = getAMap();
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,  // 高精度
        timeout: 10000,            // 超时时间
        maximumAge: 0,             // 不使用缓存
        convert: true,             // 自动偏移坐标
        showButton: false,         // 不显示定位按钮
        showMarker: false,         // 不显示定位标记
        showCircle: false,         // 不显示定位精度圈
      });

      geolocation.getCurrentPosition((status: string, result: any) => {
        if (status === 'complete') {
          const position = result.position;
          const coordinate: Coordinate = {
            lng: position.lng,
            lat: position.lat,
          };
          console.log(`✅ 获取当前位置成功: (${position.lng}, ${position.lat})`);
          resolve(coordinate);
        } else {
          const error = new Error(`定位失败: ${result.message || status}`);
          console.error('❌', error.message);
          reject(error);
        }
      });
    } catch (error) {
      console.error('❌ 定位异常:', error);
      reject(error);
    }
  });
}

