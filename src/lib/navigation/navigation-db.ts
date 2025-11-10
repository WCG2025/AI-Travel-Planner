/**
 * 导航查询数据库操作服务
 * 用于存储和检索导航查询记录和结果
 */

import { createClient } from '@/lib/supabase/client';
import type { NavigationQuery, NavigationResult, TransitRoute, TransitSegment } from '@/types/navigation.types';

// 导航查询记录数据库类型
interface NavigationQueryRecord {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  departure_date: string | null;
  departure_time: string | null;
  query_time: string;
  routes_count: number;
  total_distance: number | null;
  total_duration: number | null;
  min_cost: number | null;
  created_at: string;
  updated_at: string;
}

// 导航路线数据库类型
interface NavigationRouteRecord {
  id: string;
  query_id: string;
  route_index: number;
  distance: number;
  duration: number;
  cost: number | null;
  walking_distance: number;
  transit_distance: number;
  restrictions: string[] | null;
  created_at: string;
}

// 导航路段数据库类型
interface NavigationSegmentRecord {
  id: string;
  route_id: string;
  segment_index: number;
  transportation: string;
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  instructions: string[] | null;
  vehicle: string | null;
  departure_stop_name: string | null;
  departure_stop_location: { x: number; y: number } | null;
  arrival_stop_name: string | null;
  arrival_stop_location: { x: number; y: number } | null;
  created_at: string;
}

// 导航站点数据库类型
interface NavigationStopRecord {
  id: string;
  segment_id: string;
  stop_index: number;
  name: string;
  location: { x: number; y: number } | null;
  created_at: string;
}

/**
 * 保存导航查询结果到数据库
 * @param result 导航查询结果
 * @returns 保存的查询记录ID
 */
export async function saveNavigationQuery(result: NavigationResult): Promise<string> {
  const supabase = createClient();
  
  try {
    // 获取当前用户ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    // 统计信息：改为显示“最快方案”的时长与距离
    const routesCount = result.routes.length;
    const bestRoute = result.routes.reduce((best, r) => {
      if (!best) return r;
      return r.duration < best.duration ? r : best;
    }, result.routes[0] as any);
    const totalDistance = bestRoute ? bestRoute.distance : 0;
    const totalDuration = bestRoute ? bestRoute.duration : 0;
    const minCost = result.routes.length > 0 
      ? Math.min(...result.routes.map(route => (route.cost ?? Infinity))) 
      : null;

    // 插入导航查询记录
    const { data: queryRecord, error: queryError } = await supabase
      .from('navigation_queries')
      .insert({
        user_id: user.id,
        origin: result.query.origin,
        destination: result.query.destination,
        departure_date: result.query.departureDate || null,
        departure_time: result.query.departureTime || null,
        routes_count: routesCount,
        total_distance: totalDistance,
        total_duration: totalDuration,
        min_cost: minCost,
      })
      .select()
      .single();

    if (queryError) {
      console.error('保存导航查询记录失败:', queryError);
      throw queryError;
    }

    const queryId = queryRecord.id;
    console.log(`✅ 导航查询记录已保存，ID: ${queryId}`);

    // 保存每条路线
    for (let i = 0; i < result.routes.length; i++) {
      const route = result.routes[i];
      
      // 插入路线记录
      const { data: routeRecord, error: routeError } = await supabase
        .from('navigation_routes')
        .insert({
          query_id: queryId,
          route_index: i,
          distance: route.distance,
          duration: route.duration,
          cost: route.cost || null,
          walking_distance: (route as any).walkingDistance || 0,
          transit_distance: (route as any).transitDistance || 0,
          restrictions: (route as any).restrictions || null,
        })
        .select()
        .single();

      if (routeError) {
        console.error('保存导航路线记录失败:', routeError);
        throw routeError;
      }

      const routeId = routeRecord.id;
      console.log(`✅ 导航路线记录已保存，ID: ${routeId}`);

      // 保存每个路段
      if (route.segments && route.segments.length > 0) {
        for (let j = 0; j < route.segments.length; j++) {
          const segment = route.segments[j];
          
          // 插入路段记录
          const { data: segmentRecord, error: segmentError } = await supabase
            .from('navigation_segments')
            .insert({
              route_id: routeId,
              segment_index: j,
              transportation: segment.transportation,
              origin: segment.origin,
              destination: segment.destination,
              distance: segment.distance,
              duration: segment.duration,
              instructions: segment.instructions || null,
              vehicle: (segment as any).vehicle || null,
              departure_stop_name: (segment as any).departureStop?.name || null,
              // 为避免不同数据库几何类型导致插入失败，坐标暂不写入（留空），仅存储站点名称
              departure_stop_location: null,
              arrival_stop_name: (segment as any).arrivalStop?.name || null,
              arrival_stop_location: null,
            })
            .select()
            .single();

          if (segmentError) {
            console.error('保存导航路段记录失败:', segmentError);
            throw segmentError;
          }

          const segmentId = segmentRecord.id;
          console.log(`✅ 导航路段记录已保存，ID: ${segmentId}`);

          // 保存途经站点
          if ((segment as any).viaStops && (segment as any).viaStops.length > 0) {
            const stopsToInsert = (segment as any).viaStops.map((stop: any, index: number) => ({
              segment_id: segmentId,
              stop_index: index,
              name: stop.name,
              // 暂不写入坐标，避免几何类型差异导致插入失败
              location: null,
            }));

            const { error: stopsError } = await supabase
              .from('navigation_stops')
              .insert(stopsToInsert);

            if (stopsError) {
              console.error('保存导航站点记录失败:', stopsError);
              throw stopsError;
            }

            console.log(`✅ 导航站点记录已保存，数量: ${stopsToInsert.length}`);
          }
        }
      }
    }

    console.log(`✅ 导航查询结果已完整保存到数据库`);
    return queryId;

  } catch (error) {
    console.error('保存导航查询结果失败:', error);
    throw error;
  }
}

/**
 * 获取用户的导航查询历史记录
 * @param limit 返回记录数量限制
 * @returns 导航查询历史记录列表
 */
export async function getNavigationHistory(limit: number = 10): Promise<NavigationQueryRecord[]> {
  const supabase = createClient();
  
  try {
    // 获取当前用户ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    // 查询用户的导航查询历史记录
    const { data, error } = await supabase
      .from('navigation_queries')
      .select('*')
      .eq('user_id', user.id)
      .order('query_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取导航查询历史失败:', error);
      throw error;
    }

    return data || [];

  } catch (error) {
    console.error('获取导航查询历史失败:', error);
    throw error;
  }
}

/**
 * 获取导航查询的详细结果
 * @param queryId 导航查询ID
 * @returns 完整的导航查询结果
 */
export async function getNavigationQueryResult(queryId: string): Promise<NavigationResult | null> {
  const supabase = createClient();
  
  try {
    // 获取当前用户ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    // 获取导航查询记录
    const { data: queryRecord, error: queryError } = await supabase
      .from('navigation_queries')
      .select('*')
      .eq('id', queryId)
      .eq('user_id', user.id)
      .single();

    if (queryError) {
      console.error('获取导航查询记录失败:', queryError);
      throw queryError;
    }

    if (!queryRecord) {
      return null;
    }

    // 获取路线记录
    const { data: routeRecords, error: routeError } = await supabase
      .from('navigation_routes')
      .select('*')
      .eq('query_id', queryId)
      .order('route_index');

    if (routeError) {
      console.error('获取导航路线记录失败:', routeError);
      throw routeError;
    }

    // 转换路线记录为TransitRoute对象
    const routes: TransitRoute[] = [];

    for (const routeRecord of routeRecords || []) {
      // 获取路段记录
      const { data: segmentRecords, error: segmentError } = await supabase
        .from('navigation_segments')
        .select('*')
        .eq('route_id', routeRecord.id)
        .order('segment_index');

      if (segmentError) {
        console.error('获取导航路段记录失败:', segmentError);
        throw segmentError;
      }

      // 转换路段记录为TransitSegment对象
      const segments: TransitSegment[] = [];

      for (const segmentRecord of segmentRecords || []) {
        // 获取站点记录
        const { data: stopRecords, error: stopError } = await supabase
          .from('navigation_stops')
          .select('*')
          .eq('segment_id', segmentRecord.id)
          .order('stop_index');

        if (stopError) {
          console.error('获取导航站点记录失败:', stopError);
          throw stopError;
        }

        // 解析坐标点
        const parsePoint = (point: string | null): { lng: number; lat: number } | undefined => {
          if (!point) return undefined;
          // 格式: "POINT(lng lat)"
          const match = point.match(/POINT\(([^ ]+) ([^)]+)\)/);
          if (!match) return undefined;
          return {
            lng: parseFloat(match[1]),
            lat: parseFloat(match[2]),
          };
        };

        // 转换路段记录
        const segment: TransitSegment = {
          transportation: segmentRecord.transportation,
          origin: segmentRecord.origin,
          destination: segmentRecord.destination,
          distance: segmentRecord.distance,
          duration: segmentRecord.duration,
          instructions: segmentRecord.instructions || [],
          vehicle: segmentRecord.vehicle || undefined,
          departureStop: segmentRecord.departure_stop_name ? {
            name: segmentRecord.departure_stop_name,
            location: parsePoint(segmentRecord.departure_stop_location),
          } : undefined,
          arrivalStop: segmentRecord.arrival_stop_name ? {
            name: segmentRecord.arrival_stop_name,
            location: parsePoint(segmentRecord.arrival_stop_location),
          } : undefined,
          viaStops: stopRecords?.map(stop => ({
            name: stop.name,
            location: parsePoint(stop.location),
          })) || [],
        };

        segments.push(segment);
      }

      // 转换路线记录
      const route: TransitRoute = {
        routeId: routeRecord.id,
        origin: queryRecord.origin,
        destination: queryRecord.destination,
        distance: routeRecord.distance,
        duration: routeRecord.duration,
        cost: routeRecord.cost || 0,
        segments,
        walkingDistance: routeRecord.walking_distance,
        transitDistance: routeRecord.transit_distance,
        restrictions: routeRecord.restrictions || [],
      };

      routes.push(route);
    }

    // 构建导航查询结果
    const result: NavigationResult = {
      query: {
        origin: queryRecord.origin,
        destination: queryRecord.destination,
        departureDate: queryRecord.departure_date || undefined,
        departureTime: queryRecord.departure_time || undefined,
      },
      routes,
    };

    return result;

  } catch (error) {
    console.error('获取导航查询结果失败:', error);
    throw error;
  }
}

/**
 * 删除导航查询记录（级联删除相关路线、路段、站点）
 * @param queryId 导航查询ID
 */
export async function deleteNavigationQuery(queryId: string): Promise<void> {
  const supabase = createClient();
  // 获取当前用户ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('用户未登录');
  }

  const { error } = await supabase
    .from('navigation_queries')
    .delete()
    .eq('id', queryId)
    .eq('user_id', user.id);

  if (error) {
    console.error('删除导航查询失败:', error);
    throw error;
  }
}