/**
 * 高德地图路径规划服务
 * 调用高德地图Web服务API实现公交路线规划
 */

import type { NavigationQuery, TransitRoute, TransitSegment } from '@/types/navigation.types';
import { searchAddress } from './address-service';

// 高德地图Web服务API响应类型
interface AMapTransitResponse {
  status: string;
  info: string;
  infocode: string;
  count: string;
  route: {
    origin: string;
    destination: string;
    taxi: {
      distance: string;
      duration: string;
      detail: string;
    };
    transits: Array<{
      cost: string;
      nightflag: string;
      duration: string;
      walking_distance: string;
      segments: Array<{
        walking: {
          distance: string;
          duration: string;
          steps: Array<{
            instruction: string;
            road: string;
            distance: string;
            action: string;
          }>;
        };
        bus: {
          buslines: Array<{
            name: string;
            type: string;
            departure_stop: {
              name: string;
              location: string;
            };
            arrival_stop: {
              name: string;
              location: string;
            };
            via_stops: Array<{
              name: string;
              location: string;
            }>;
            distance: string;
            duration: string;
          }>;
        };
        entrance: {
          name: string;
          location: string;
        };
        exit: {
          name: string;
          location: string;
        };
      }>;
    }>;
  };
}

/**
 * 查询公交路线
 * @param query 导航查询参数
 * @returns 公交路线方案列表
 */
export async function queryTransitRoute(query: NavigationQuery): Promise<TransitRoute[]> {
  try {
    console.log(`🚌 查询公交路线: ${query.origin} → ${query.destination}`);

    // 解析/补全坐标
    const toCoordString = (
      input: string,
      fallbackCity: string
    ): Promise<{ coord: string; city: string; adcode?: string }> => {
      // 如果本身就是坐标 "lng,lat" 直接返回
      const parts = input.split(',');
      if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
        return Promise.resolve({ coord: `${parseFloat(parts[0])},${parseFloat(parts[1])}`, city: fallbackCity });
      }
      // 否则调用地点搜索获取坐标
      return searchAddress(input).then((list) => {
        const first = list.find(s => s.location);
        if (!first || !first.location) {
          throw new Error(`未能解析地址坐标: ${input}`);
        }
        const { lng, lat } = first.location;
        return { coord: `${lng},${lat}`, city: first.city || fallbackCity, adcode: first.adcode };
      });
    };

    const originResolved = await toCoordString(query.origin, '北京');
    const destinationResolved = await toCoordString(query.destination, originResolved.city);

    const normalizeCityAdcode = (adcode?: string, cityName?: string): string => {
      if (adcode && adcode.length === 6) {
        // 将区县级编码归一化为城市级编码（后两位 00）
        return adcode.slice(0, 4) + '00';
      }
      return cityName || '北京';
    };

    // 构建日期与时间参数：如果留白则使用当前查询时间
    const now = new Date();
    const parseDate = (d?: string): Date => {
      if (!d) return now;
      // 期望格式 YYYY-MM-DD；若不同也让 Date 解析
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? now : parsed;
    };
    const formatAMapDate = (d: Date): string => {
      const y = d.getFullYear();
      const m = d.getMonth() + 1; // 1-12
      const day = d.getDate();
      // 根据示例使用不补零的格式：YYYY-M-D
      return `${y}-${m}-${day}`;
    };
    const formatAMapTime = (d: Date): string => {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    };
    const dateForQuery = formatAMapDate(parseDate(query.departureDate));
    const timeForQuery = query.departureTime && /\d{1,2}:\d{2}/.test(query.departureTime)
      ? query.departureTime
      : formatAMapTime(now);

    // 构建请求参数（由服务端代理注入 key）
    const params = new URLSearchParams({
      origin: originResolved.coord,
      destination: destinationResolved.coord,
      // 优先使用 adcode，其次使用城市名
      city: normalizeCityAdcode(originResolved.adcode, originResolved.city),
      strategy: '0', // 最快捷模式
      nightflag: '1', // 包含夜班车
      output: 'json', // 返回JSON格式
    });

    // 传递 date 与 time 参数用于筛选可乘坐路线
    params.append('date', dateForQuery);
    params.append('time', timeForQuery);

    // 注意：公交路径规划对时间参数支持有限，传入不规范可能导致 20003 错误
    // 为了稳定性，这里不传入 date/time 参数，使用默认当前时段规划

    // 跨城时补充目的地城市
    const citydValue = normalizeCityAdcode(destinationResolved.adcode, destinationResolved.city);
    if (citydValue !== normalizeCityAdcode(originResolved.adcode, originResolved.city)) {
      params.append('cityd', citydValue);
    }

    // 调用高德地图Web服务API
    const url = `/api/amap/v3/direction/transit/integrated?${params.toString()}`;
    console.log('📍 请求URL:', url);

    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // 代理统一返回 { success, data }
    if (!result || result.success !== true) {
      const code = result?.code;
      const errorMsg = result?.error || '代理请求失败';
      // 特别处理限流情况为非致命
      if (code === 'AMAP_QPS_EXCEEDED') {
        console.warn('⚠️ 高德地图API QPS超限');
        return [];
      }
      throw new Error(errorMsg);
    }

    const data: AMapTransitResponse = result.data;
    console.log('📦 API响应:', data);

    // 检查API响应状态
    if (data.status !== '1') {
      const info = (data as any)?.info;
      const infocode = (data as any)?.infocode;
      throw new Error(`高德地图API错误: ${info ?? '未知错误'} (${infocode ?? '未知代码'})`);
    }

    // 如果没有找到路线
    if (!data.route || !data.route.transits || data.route.transits.length === 0) {
      console.log('⚠️ 未找到公交路线');
      return [];
    }

    // 转换API响应为我们的数据格式
    const routes: TransitRoute[] = data.route.transits.map((transit, index) => {
      const segments: TransitSegment[] = [];
      let walkingTotal = parseFloat(transit.walking_distance) || 0;
      let busTotal = 0;

      transit.segments.forEach((segment) => {
        // 先推步行子段（如果存在且距离>0）
        if (segment.walking && segment.walking.distance) {
          const wDist = parseFloat(segment.walking.distance) || 0;
          const wDur = parseFloat(segment.walking.duration) || 0;
          if (wDist > 0) {
            segments.push({
              transportation: '步行',
              origin: segment.entrance?.name || '',
              destination: segment.exit?.name || '',
              distance: wDist,
              duration: wDur,
              instructions: segment.walking.steps?.map(step => step.instruction) || [],
            });
          }
        }

        // 再推公交子段（每条线路作为一个段）
        if (segment.bus && Array.isArray(segment.bus.buslines) && segment.bus.buslines.length > 0) {
          segment.bus.buslines.forEach((busline) => {
            const bDist = parseFloat(busline.distance) || 0;
            const bDur = parseFloat(busline.duration) || 0;
            busTotal += bDist;
            segments.push({
              transportation: busline.type === '地铁线路' ? '地铁' : '公交',
              origin: busline.departure_stop?.name || '',
              destination: busline.arrival_stop?.name || '',
              distance: bDist,
              duration: bDur,
              instructions: [`乘坐${busline.name}`, `从${busline.departure_stop?.name}到${busline.arrival_stop?.name}`],
              vehicle: busline.name,
              departureStop: {
                name: busline.departure_stop?.name || '',
                location: parseLocation(busline.departure_stop?.location),
              },
              arrivalStop: {
                name: busline.arrival_stop?.name || '',
                location: parseLocation(busline.arrival_stop?.location),
              },
              viaStops: busline.via_stops?.map(stop => ({
                name: stop.name,
                location: parseLocation(stop.location),
              })) || [],
            });
          });
        }
      });

      const totalDistance = (walkingTotal || 0) + (busTotal || 0);

      return {
        routeId: `route_${index}`,
        // 使用用户原始输入的名称，避免显示坐标字符串
        origin: query.origin,
        destination: query.destination,
        distance: totalDistance,
        duration: parseFloat(transit.duration) || 0,
        cost: parseFloat(transit.cost) || 0,
        segments,
        walkingDistance: walkingTotal,
        transitDistance: busTotal,
        restrictions: [],
      };
    });

    console.log(`✅ 查询成功，找到${routes.length}条公交路线`);
    return routes;

  } catch (error: any) {
    console.error('❌ 查询公交路线失败:', error);
    throw new Error(`查询公交路线失败: ${error.message}`);
  }
}

/**
 * 解析高德地图返回的坐标字符串或对象
 * @param location 坐标字符串，格式为 "经度,纬度"，或包含lng和lat属性的对象
 * @returns 坐标对象
 */
function parseLocation(location?: any): { lng: number; lat: number } | undefined {
  if (!location) return undefined;
  
  // 如果location已经是对象格式，直接返回
  if (typeof location === 'object' && location !== null && 'lng' in location && 'lat' in location) {
    return {
      lng: parseFloat(location.lng) || 0,
      lat: parseFloat(location.lat) || 0
    };
  }
  
  // 如果location是字符串，尝试解析
  if (typeof location === 'string') {
    const parts = location.split(',');
    if (parts.length !== 2) return undefined;
    
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    
    if (isNaN(lng) || isNaN(lat)) return undefined;
    
    return { lng, lat };
  }
  
  // 尝试将location转换为字符串后解析
  try {
    const locationStr = String(location);
    return parseLocation(locationStr);
  } catch {
    return undefined;
  }
}