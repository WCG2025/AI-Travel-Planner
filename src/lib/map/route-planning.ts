/**
 * 路线规划服务
 * 支持驾车、步行、骑行、公交等多种交通方式
 */

import { getAMap } from './amap-loader';
import type { 
  Coordinate, 
  Route, 
  RouteStep, 
  RoutePlanRequest,
  TravelMode 
} from '@/types/map.types';

/**
 * 驾车路线规划
 */
export async function planDrivingRoute(
  origin: Coordinate,
  destination: Coordinate,
  waypoints?: Coordinate[]
): Promise<Route> {
  return new Promise((resolve, reject) => {
    try {
      const AMap = getAMap();
      const driving = new AMap.Driving({
        policy: AMap.DrivingPolicy.LEAST_TIME, // 最快捷
      });

      const originLngLat = [origin.lng, origin.lat];
      const destLngLat = [destination.lng, destination.lat];
      const waypointsLngLat = waypoints?.map(wp => [wp.lng, wp.lat]);

      const searchOptions = waypointsLngLat 
        ? { waypoints: waypointsLngLat }
        : {};

      driving.search(
        originLngLat,
        destLngLat,
        searchOptions,
        (status: string, result: any) => {
          if (status === 'complete' && result.info === 'OK') {
            const routeData = result.routes[0];
            const route = parseDrivingRoute(routeData);
            
            console.log(`✅ 驾车路线规划成功: 距离 ${(route.distance / 1000).toFixed(1)}km, 时间 ${Math.round(route.duration / 60)}分钟`);
            resolve(route);
          } else {
            const error = new Error(`驾车路线规划失败: ${result.info || status}`);
            console.error('❌', error.message);
            reject(error);
          }
        }
      );
    } catch (error) {
      console.error('❌ 驾车路线规划异常:', error);
      reject(error);
    }
  });
}

/**
 * 步行路线规划
 */
export async function planWalkingRoute(
  origin: Coordinate,
  destination: Coordinate
): Promise<Route> {
  return new Promise((resolve, reject) => {
    try {
      const AMap = getAMap();
      const walking = new AMap.Walking();

      const originLngLat = [origin.lng, origin.lat];
      const destLngLat = [destination.lng, destination.lat];

      walking.search(
        originLngLat,
        destLngLat,
        (status: string, result: any) => {
          if (status === 'complete' && result.info === 'OK') {
            const routeData = result.routes[0];
            const route = parseWalkingRoute(routeData);
            
            console.log(`✅ 步行路线规划成功: 距离 ${(route.distance / 1000).toFixed(1)}km, 时间 ${Math.round(route.duration / 60)}分钟`);
            resolve(route);
          } else {
            const error = new Error(`步行路线规划失败: ${result.info || status}`);
            console.error('❌', error.message);
            reject(error);
          }
        }
      );
    } catch (error) {
      console.error('❌ 步行路线规划异常:', error);
      reject(error);
    }
  });
}

/**
 * 骑行路线规划
 */
export async function planRidingRoute(
  origin: Coordinate,
  destination: Coordinate
): Promise<Route> {
  return new Promise((resolve, reject) => {
    try {
      const AMap = getAMap();
      const riding = new AMap.Riding();

      const originLngLat = [origin.lng, origin.lat];
      const destLngLat = [destination.lng, destination.lat];

      riding.search(
        originLngLat,
        destLngLat,
        (status: string, result: any) => {
          if (status === 'complete' && result.info === 'OK') {
            const routeData = result.routes[0];
            const route = parseRidingRoute(routeData);
            
            console.log(`✅ 骑行路线规划成功: 距离 ${(route.distance / 1000).toFixed(1)}km, 时间 ${Math.round(route.duration / 60)}分钟`);
            resolve(route);
          } else {
            const error = new Error(`骑行路线规划失败: ${result.info || status}`);
            console.error('❌', error.message);
            reject(error);
          }
        }
      );
    } catch (error) {
      console.error('❌ 骑行路线规划异常:', error);
      reject(error);
    }
  });
}

/**
 * 公交路线规划
 */
export async function planTransitRoute(
  origin: Coordinate,
  destination: Coordinate,
  city: string
): Promise<Route> {
  return new Promise((resolve, reject) => {
    try {
      const AMap = getAMap();
      const transfer = new AMap.Transfer({
        city: city,
        policy: AMap.TransferPolicy.LEAST_TIME, // 最快捷
      });

      const originLngLat = [origin.lng, origin.lat];
      const destLngLat = [destination.lng, destination.lat];

      transfer.search(
        originLngLat,
        destLngLat,
        (status: string, result: any) => {
          if (status === 'complete' && result.info === 'OK') {
            const routeData = result.plans[0];
            const route = parseTransitRoute(routeData);
            
            console.log(`✅ 公交路线规划成功: 距离 ${(route.distance / 1000).toFixed(1)}km, 时间 ${Math.round(route.duration / 60)}分钟`);
            resolve(route);
          } else {
            const error = new Error(`公交路线规划失败: ${result.info || status}`);
            console.error('❌', error.message);
            reject(error);
          }
        }
      );
    } catch (error) {
      console.error('❌ 公交路线规划异常:', error);
      reject(error);
    }
  });
}

/**
 * 统一路线规划接口
 */
export async function planRoute(request: RoutePlanRequest): Promise<Route> {
  const { origin, destination, waypoints, mode } = request;

  switch (mode) {
    case 'driving':
      return planDrivingRoute(origin, destination, waypoints);
    case 'walking':
      return planWalkingRoute(origin, destination);
    case 'riding':
      return planRidingRoute(origin, destination);
    case 'transit':
      // 公交需要城市信息，这里默认使用目的地城市
      return planTransitRoute(origin, destination, '全国');
    default:
      throw new Error(`不支持的交通方式: ${mode}`);
  }
}

/**
 * 解析驾车路线数据
 */
function parseDrivingRoute(routeData: any): Route {
  const steps: RouteStep[] = routeData.steps.map((step: any) => ({
    instruction: step.instruction,
    distance: step.distance,
    duration: step.time,
    path: step.path.map((p: any) => ({
      lng: p.lng,
      lat: p.lat,
    })),
  }));

  const path: Coordinate[] = [];
  steps.forEach(step => {
    path.push(...step.path);
  });

  return {
    distance: routeData.distance,
    duration: routeData.time,
    steps,
    path,
    description: `${routeData.steps.length}个路段`,
    cost: routeData.tolls || 0,
  };
}

/**
 * 解析步行路线数据
 */
function parseWalkingRoute(routeData: any): Route {
  const steps: RouteStep[] = routeData.steps.map((step: any) => ({
    instruction: step.instruction,
    distance: step.distance,
    duration: step.time,
    path: step.path.map((p: any) => ({
      lng: p.lng,
      lat: p.lat,
    })),
  }));

  const path: Coordinate[] = [];
  steps.forEach(step => {
    path.push(...step.path);
  });

  return {
    distance: routeData.distance,
    duration: routeData.time,
    steps,
    path,
    description: `步行 ${routeData.steps.length}段`,
  };
}

/**
 * 解析骑行路线数据
 */
function parseRidingRoute(routeData: any): Route {
  const steps: RouteStep[] = routeData.rides.map((ride: any) => ({
    instruction: ride.instruction,
    distance: ride.distance,
    duration: ride.time,
    path: ride.path.map((p: any) => ({
      lng: p.lng,
      lat: p.lat,
    })),
  }));

  const path: Coordinate[] = [];
  steps.forEach(step => {
    path.push(...step.path);
  });

  return {
    distance: routeData.distance,
    duration: routeData.time,
    steps,
    path,
    description: `骑行 ${routeData.rides.length}段`,
  };
}

/**
 * 解析公交路线数据
 */
function parseTransitRoute(planData: any): Route {
  const steps: RouteStep[] = [];
  let totalDistance = 0;
  let totalDuration = 0;

  planData.segments.forEach((segment: any) => {
    if (segment.transit) {
      // 公交/地铁段
      const transit = segment.transit;
      steps.push({
        instruction: `乘坐 ${transit.lines[0].name} (${transit.on_station.name} → ${transit.off_station.name})`,
        distance: segment.distance || 0,
        duration: segment.time || 0,
        path: [],
      });
    } else if (segment.walking) {
      // 步行段
      const walking = segment.walking;
      steps.push({
        instruction: `步行 ${Math.round(walking.distance)}米`,
        distance: walking.distance,
        duration: walking.time,
        path: walking.steps?.map((s: any) => s.path).flat().map((p: any) => ({
          lng: p.lng,
          lat: p.lat,
        })) || [],
      });
    }
    
    totalDistance += segment.distance || 0;
    totalDuration += segment.time || 0;
  });

  return {
    distance: totalDistance,
    duration: totalDuration,
    steps,
    path: [],
    description: `${steps.length}个路段，${planData.railway_distance ? '含地铁' : '公交'}`,
    cost: planData.cost || 0,
  };
}

/**
 * 计算两点之间的直线距离（米）
 */
export function calculateDistance(from: Coordinate, to: Coordinate): number {
  const AMap = getAMap();
  const fromLngLat = new AMap.LngLat(from.lng, from.lat);
  const toLngLat = new AMap.LngLat(to.lng, to.lat);
  return fromLngLat.distance(toLngLat);
}

/**
 * 格式化距离显示
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}米`;
  }
  return `${(meters / 1000).toFixed(1)}公里`;
}

/**
 * 格式化时间显示
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
}

