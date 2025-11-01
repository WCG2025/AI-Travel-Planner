/**
 * 地理编码服务
 * 地址 ⟷ 坐标 相互转换
 */

import { getAMap } from './amap-loader';
import type { Coordinate, Address, GeocodingResult } from '@/types/map.types';

/**
 * 地理编码：地址 → 坐标
 */
export async function geocode(address: string, city?: string): Promise<GeocodingResult> {
  return new Promise((resolve, reject) => {
    try {
      const AMap = getAMap();
      const geocoder = new AMap.Geocoder({
        city: city || '全国',
      });

      geocoder.getLocation(address, (status: string, result: any) => {
        if (status === 'complete' && result.info === 'OK') {
          const geocode = result.geocodes[0];
          const location = geocode.location;

          const geocodingResult: GeocodingResult = {
            coordinate: {
              lng: location.lng,
              lat: location.lat,
            },
            address: {
              province: geocode.province,
              city: geocode.city,
              district: geocode.district,
              street: geocode.street,
              streetNumber: geocode.number,
              formattedAddress: geocode.formattedAddress,
            },
            confidence: geocode.level === 'building' ? 1.0 : 0.8,
          };

          console.log(`✅ 地理编码成功: ${address} → (${location.lng}, ${location.lat})`);
          resolve(geocodingResult);
        } else {
          const error = new Error(`地理编码失败: ${result.info || status}`);
          console.error('❌', error.message);
          reject(error);
        }
      });
    } catch (error) {
      console.error('❌ 地理编码异常:', error);
      reject(error);
    }
  });
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
 * 批量地理编码
 */
export async function batchGeocode(
  addresses: string[],
  city?: string
): Promise<(GeocodingResult | null)[]> {
  const results = await Promise.allSettled(
    addresses.map(address => geocode(address, city))
  );

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return null;
  });
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

