/**
 * 地址自动完成服务
 * 用于实现出发地和目的地的实时候选推荐功能
 */

import type { AddressSuggestion } from '@/types/navigation.types';

// 高德地图输入提示API响应类型
interface AMapInputTipsResponse {
  status: string;
  info: string;
  infocode: string;
  count: string;
  tips: Array<{
    name: string;
    district: string;
    adcode: string;
    location: string;
    address: string;
    level: string;
  }>;
}

/**
 * 根据关键词获取地址建议（输入提示）
 * @param keyword 关键词
 * @param city 城市名称（可选）
 * @param limit 返回结果数量限制
 * @returns 地址建议列表
 */
export async function getAddressSuggestions(
  keyword: string, 
  city?: string,
  limit: number = 10
): Promise<AddressSuggestion[]> {
  try {
    // 如果关键词为空，返回空数组
    if (!keyword.trim()) {
      return [];
    }

    console.log(`🔍 获取地址建议: ${keyword} (城市: ${city || '全国'})`);

    // 构建请求参数（不再需要在客户端传递API Key，由服务端代理处理）
    const params = new URLSearchParams({
      keywords: keyword,
    });

    // 添加城市参数（如果提供）
    if (city) {
      params.append('city', city);
    }

    // 添加结果数量限制
    if (limit > 0) {
      params.append('citylimit', 'false'); // 不限制城市范围
    }

    // 调用我们自己的API代理路由
    const url = `/api/amap/v3/assistant/inputtips?${params.toString()}`;
    console.log('📍 请求URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // 检查代理响应是否成功
    if (!result.success) {
      // 特别处理QPS超限错误
      if (result.code === 'AMAP_QPS_EXCEEDED') {
        console.warn('⚠️ 高德地图API QPS超限，请稍后再试');
        return []; // 返回空数组而不是抛出错误，避免界面崩溃
      }
      
      throw new Error(result.error || '获取地址建议失败');
    }

    const data: AMapInputTipsResponse = result.data;
    console.log('📦 API响应:', data);

    // 检查API响应状态
    if (data.status !== '1') {
      console.warn(`⚠️ 高德地图API响应错误: ${data.info} (${data.infocode})`);
      return []; // 返回空数组而不是抛出错误，避免界面崩溃
    }

    // 如果没有找到建议
    if (!data.tips || data.tips.length === 0) {
      console.log('⚠️ 未找到地址建议');
      return [];
    }

    // 转换API响应为我们的数据格式
    const suggestions: AddressSuggestion[] = data.tips.slice(0, limit).map((tip) => {
      // 解析坐标
      const parseLocation = (location?: any): { lng: number; lat: number } | undefined => {
        if (!location) return undefined;
        
        // 处理不同类型的location数据
        let locationStr = '';
        if (typeof location === 'string') {
          locationStr = location;
        } else if (typeof location === 'object' && location.lng !== undefined && location.lat !== undefined) {
          return { lng: location.lng, lat: location.lat };
        } else if (typeof location === 'object' && location.toString) {
          locationStr = location.toString();
        } else {
          return undefined;
        }
        
        const parts = locationStr.split(',');
        if (parts.length !== 2) return undefined;
        
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        
        if (isNaN(lng) || isNaN(lat)) return undefined;
        
        return { lng, lat };
      };

      return {
        name: tip.name,
        address: tip.address,
        district: tip.district,
        city: '', // API响应中没有直接返回城市，可以从district中提取
        adcode: tip.adcode,
        location: parseLocation(tip.location),
        level: tip.level,
      };
    });

    console.log(`✅ 搜索成功，找到${suggestions.length}条地址建议`);
    return suggestions;

  } catch (error: any) {
    console.error('❌ 获取地址建议失败:', error);
    // 返回空数组而不是抛出错误，避免界面崩溃
    return [];
  }
}

/**
 * 根据关键词搜索地址（用于获取更精确的结果）
 * @param keyword 地址关键词
 * @param city 城市名称（可选）
 * @returns 地址建议列表
 */
export async function searchAddress(
  keyword: string, 
  city?: string
): Promise<AddressSuggestion[]> {
  try {
    // 如果关键词为空，返回空数组
    if (!keyword.trim()) {
      return [];
    }

    console.log(`🔍 搜索地址: ${keyword}`);

    // 构建请求参数（不再需要在客户端传递API Key，由服务端代理处理）
    const params = new URLSearchParams({
      keywords: keyword,
      output: 'json', // 返回JSON格式
      offset: '10', // 返回记录数量
      page: '1', // 当前页数
      extensions: 'all', // 返回详细信息
    });

    // 添加城市参数（如果提供）
    if (city) {
      params.append('city', city);
    }

    // 调用我们自己的API代理路由
    const url = `/api/amap/v3/place/text?${params.toString()}`;
    console.log('📍 请求URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // 检查代理响应是否成功
    if (!result.success) {
      // 特别处理QPS超限错误
      if (result.code === 'AMAP_QPS_EXCEEDED') {
        console.warn('⚠️ 高德地图API QPS超限，请稍后再试');
        return []; // 返回空数组而不是抛出错误，避免界面崩溃
      }
      
      throw new Error(result.error || '搜索地址失败');
    }

    const data = result.data;
    console.log('📦 API响应:', data);

    // 检查API响应状态
    if (data.status !== '1') {
      console.warn(`⚠️ 高德地图API响应错误: ${data.info} (${data.infocode})`);
      return []; // 返回空数组而不是抛出错误，避免界面崩溃
    }

    // 如果没有找到结果
    if (!data.pois || data.pois.length === 0) {
      console.log('⚠️ 未找到地址');
      return [];
    }

    // 转换API响应为我们的数据格式
    const suggestions: AddressSuggestion[] = data.pois.map((poi: any) => {
      // 解析坐标
      const parseLocation = (location?: any): { lng: number; lat: number } | undefined => {
        if (!location) return undefined;
        
        // 处理不同类型的location数据
        let locationStr = '';
        if (typeof location === 'string') {
          locationStr = location;
        } else if (typeof location === 'object' && location.lng !== undefined && location.lat !== undefined) {
          return { lng: location.lng, lat: location.lat };
        } else if (typeof location === 'object' && location.toString) {
          locationStr = location.toString();
        } else {
          return undefined;
        }
        
        const parts = locationStr.split(',');
        if (parts.length !== 2) return undefined;
        
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        
        if (isNaN(lng) || isNaN(lat)) return undefined;
        
        return { lng, lat };
      };

      return {
        name: poi.name,
        address: poi.address || poi.pname + poi.cityname + poi.adname,
        district: poi.adname,
        city: poi.cityname,
        adcode: poi.adcode,
        location: parseLocation(poi.location),
        level: poi.level,
      };
    });

    console.log(`✅ 搜索成功，找到${suggestions.length}条地址`);
    return suggestions;

  } catch (error: any) {
    console.error('❌ 搜索地址失败:', error);
    // 返回空数组而不是抛出错误，避免界面崩溃
    return [];
  }
}