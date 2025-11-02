/**
 * 行程地图组件
 * 在地图上展示行程中的所有景点和路线
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer } from './map-container';
import { batchGeocode } from '@/lib/map/geocoding';
import { Loader2, MapPin, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { TravelPlan, Activity, ItineraryDay } from '@/types/travel-plan.types';
import type { Coordinate } from '@/types/map.types';

interface ItineraryMapProps {
  plan: TravelPlan;
  apiKey: string;
  className?: string;
}

// 活动类型对应的地图标记颜色
const ACTIVITY_COLORS: Record<string, string> = {
  attraction: '#FF5722',    // 景点 - 红色
  meal: '#FF9800',          // 用餐 - 橙色
  accommodation: '#2196F3', // 住宿 - 蓝色
  transportation: '#9C27B0',// 交通 - 紫色
  shopping: '#4CAF50',      // 购物 - 绿色
  entertainment: '#E91E63', // 娱乐 - 粉色
  other: '#757575',         // 其他 - 灰色
};

export function ItineraryMap({ plan, apiKey, className = '' }: ItineraryMapProps) {
  const [map, setMap] = useState<any>(null);
  const [amap, setAMap] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [polylines, setPolylines] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = 全部，1,2,3... = 具体天数
  
  // 组件挂载状态跟踪
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      console.log('🗺️ ItineraryMap 组件已卸载，取消所有操作');
    };
  }, []);

  // 调试信息
  console.log('🗺️ ItineraryMap 渲染:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length,
    planId: plan.id,
    itineraryCount: plan.itinerary?.length,
  });

  // 地图准备好后的回调
  const handleMapReady = useCallback((mapInstance: any, amapInstance: any) => {
    setMap(mapInstance);
    setAMap(amapInstance);
  }, []);

  // 加载行程数据到地图（当地图ready或筛选天数改变时）
  useEffect(() => {
    if (!map || !amap || !plan.itinerary || plan.itinerary.length === 0) {
      return;
    }

    loadItineraryData();
  }, [map, amap, plan, selectedDay]); // 添加 selectedDay 依赖，切换天数时重新加载

  // 加载行程数据
  const loadItineraryData = async () => {
    if (!map || !amap) return;
    
    // 检查组件是否已卸载
    if (!isMountedRef.current) {
      console.log('⏹️ 组件已卸载，跳过加载');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 收集需要显示的活动（根据筛选的天数）
      const activities: Activity[] = [];
      const activityDayMap: Map<number, number> = new Map(); // 记录每个活动属于第几天
      
      plan.itinerary.forEach((day: ItineraryDay, dayIndex: number) => {
        // 如果选择了"全部"(0) 或 当前天，则添加活动
        if (selectedDay === 0 || selectedDay === day.day) {
          day.activities.forEach((activity: Activity) => {
            if (activity.location) {
              activityDayMap.set(activities.length, day.day); // 记录这个活动属于第几天
              activities.push(activity);
            }
          });
        }
      });
      
      console.log(`📅 筛选第${selectedDay === 0 ? '全部' : selectedDay}天，共 ${activities.length} 个景点`);

      if (activities.length === 0) {
        setError('行程中没有地点信息');
        setLoading(false);
        return;
      }

      console.log(`🗺️ 开始为 ${activities.length} 个景点进行地理编码...`);
      const startTime = Date.now();

      // 优先使用已有坐标，减少地理编码请求
      const needGeocode: { activity: Activity; index: number; address: string }[] = [];
      const coordinates: (Coordinate | null)[] = new Array(activities.length).fill(null);

      activities.forEach((activity, index) => {
        // 如果活动已有坐标，直接使用
        if (activity.coordinates) {
          coordinates[index] = activity.coordinates;
        } else {
          // 需要地理编码
          needGeocode.push({
            activity,
            index,
            address: activity.address || `${plan.destination}${activity.location}`,
          });
        }
      });

      console.log(`📍 ${coordinates.filter(c => c).length} 个景点已有坐标，${needGeocode.length} 个需要地理编码`);

      // 批量地理编码（仅编码需要的）
      if (needGeocode.length > 0) {
        const addresses = needGeocode.map(item => item.address);
        const geocodingResults = await batchGeocode(addresses, plan.destination);

        // 填充地理编码结果
        geocodingResults.forEach((result, i) => {
          if (result) {
            coordinates[needGeocode[i].index] = result.coordinate;
          }
        });
      }

      const successCount = coordinates.filter(c => c).length;
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ 地理编码完成: ${successCount}/${activities.length} 个景点成功 (耗时 ${duration}秒)`);

      // 再次检查组件是否已卸载
      if (!isMountedRef.current) {
        console.log('⏹️ 组件已卸载，停止处理');
        return;
      }

      if (successCount === 0) {
        setError('无法获取任何景点的位置信息');
        setLoading(false);
        return;
      }

      // 清除旧标记和连线
      if (markers.length > 0) {
        markers.forEach(marker => marker.setMap(null));
        setMarkers([]);
      }
      if (polylines.length > 0) {
        polylines.forEach(line => line.setMap(null));
        setPolylines([]);
      }

      // 创建新标记
      const newMarkers: any[] = [];
      const validCoordinates: Coordinate[] = [];

      coordinates.forEach((coordinate, index) => {
        // 严格验证坐标
        if (!coordinate || 
            typeof coordinate.lng !== 'number' || 
            typeof coordinate.lat !== 'number' ||
            isNaN(coordinate.lng) || 
            isNaN(coordinate.lat) ||
            coordinate.lng < -180 || coordinate.lng > 180 ||
            coordinate.lat < -90 || coordinate.lat > 90) {
          const activity = activities[index];
          console.warn(`⚠️ 景点 [${index + 1}] "${activity?.title}" 坐标无效，跳过标记创建`);
          return;
        }

        const activity = activities[index];
        const activityDay = activityDayMap.get(index) || 1; // 获取这个活动属于第几天

        try {
          // 检查组件是否已卸载
          if (!isMountedRef.current) return;
          
          console.log(`   → 准备创建标记: "${activity.title}" at [${coordinate.lng}, ${coordinate.lat}], 第${activityDay}天`);
          
          // 创建标记前最后验证（在 push 之前）
          if (!coordinate.lng || !coordinate.lat || isNaN(coordinate.lng) || isNaN(coordinate.lat)) {
            console.error(`   ❌ 坐标二次验证失败，跳过: ${JSON.stringify(coordinate)}`);
            return;
          }
          
          // 只有完全验证通过，才加入 validCoordinates
          validCoordinates.push(coordinate);
          
          // 根据天数选择颜色
          const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
          const markerColor = colors[(activityDay - 1) % colors.length];
          
          // 创建带颜色的标记
          const marker = new amap.Marker({
            position: new amap.LngLat(coordinate.lng, coordinate.lat),
            title: activity.title,
            label: {
              content: `<div style="background: ${markerColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${activity.title}</div>`,
              offset: new amap.Pixel(0, -35),
              direction: 'top',
            },
            // 使用简单的彩色圆点
            icon: `https://webapi.amap.com/theme/v1.3/markers/n/mark_b${activityDay}.png`, // 使用高德官方彩色图标
            zIndex: 100,
          });

          // 创建详细信息窗口（点击显示）
          const infoWindow = new amap.InfoWindow({
            content: createInfoWindowContent(activity),
            offset: new amap.Pixel(0, -32),
            closeWhenClickMap: true,
          });

          // 点击标记显示详细信息
          marker.on('click', () => {
            setSelectedActivity(activity);
            infoWindow.open(map, marker.getPosition());
          });

          // 鼠标悬停显示提示（可选）
          marker.on('mouseover', () => {
            marker.setTop(true); // 置顶显示
          });

          marker.setMap(map);
          newMarkers.push(marker);
          
          console.log(`✅ 创建标记: "${activity.title}" (${coordinate.lng.toFixed(6)}, ${coordinate.lat.toFixed(6)})`);
        } catch (error: any) {
          // 只有组件仍挂载时才报错
          if (isMountedRef.current) {
            console.error(`❌ 创建标记失败: "${activity.title}"`, error.message);
          }
        }
      });

      setMarkers(newMarkers);

      // 调整视野以包含所有标记
      if (validCoordinates.length > 0) {
        try {
          // 检查坐标有效性
          const validCoords = validCoordinates.filter(coord => 
            coord && 
            typeof coord.lng === 'number' && 
            typeof coord.lat === 'number' &&
            !isNaN(coord.lng) && 
            !isNaN(coord.lat) &&
            coord.lng >= -180 && coord.lng <= 180 &&
            coord.lat >= -90 && coord.lat <= 90
          );

          if (validCoords.length === 0) {
            console.warn('⚠️ 没有有效的坐标用于设置地图边界');
            return;
          }

          console.log(`📍 使用 ${validCoords.length} 个有效坐标设置地图边界`);

          if (validCoords.length === 1) {
            // 只有一个点，直接设置中心
            console.log(`📍 单点模式: 设置中心为 [${validCoords[0].lng}, ${validCoords[0].lat}]`);
            map.setZoomAndCenter(15, new amap.LngLat(validCoords[0].lng, validCoords[0].lat));
          } else {
            // 多个点，计算中心点和合适的缩放级别
            console.log(`📍 多点模式: ${validCoords.length} 个坐标`);
            
            // 计算中心点
            let sumLng = 0, sumLat = 0;
            validCoords.forEach(coord => {
              sumLng += coord.lng;
              sumLat += coord.lat;
            });
            const centerLng = sumLng / validCoords.length;
            const centerLat = sumLat / validCoords.length;
            
            // 计算合适的缩放级别（根据坐标分布）
            let maxLng = validCoords[0].lng, minLng = validCoords[0].lng;
            let maxLat = validCoords[0].lat, minLat = validCoords[0].lat;
            validCoords.forEach(coord => {
              maxLng = Math.max(maxLng, coord.lng);
              minLng = Math.min(minLng, coord.lng);
              maxLat = Math.max(maxLat, coord.lat);
              minLat = Math.min(minLat, coord.lat);
            });
            
            const lngSpan = maxLng - minLng;
            const latSpan = maxLat - minLat;
            const maxSpan = Math.max(lngSpan, latSpan);
            
            // 根据跨度确定缩放级别
            let zoom = 15;
            if (maxSpan > 0.5) zoom = 11;
            else if (maxSpan > 0.2) zoom = 12;
            else if (maxSpan > 0.1) zoom = 13;
            else if (maxSpan > 0.05) zoom = 14;
            
            console.log(`📍 设置中心: [${centerLng.toFixed(6)}, ${centerLat.toFixed(6)}], 缩放: ${zoom}`);
            map.setZoomAndCenter(zoom, new amap.LngLat(centerLng, centerLat));
          }
        } catch (error: any) {
          // 只有组件仍挂载时才报错
          if (isMountedRef.current) {
            console.error('❌ 设置地图边界失败:', error);
            // 使用默认中心点
            if (validCoordinates[0]) {
              map.setZoomAndCenter(12, [validCoordinates[0].lng, validCoordinates[0].lat]);
            }
          }
        }
      }

      // 绘制每天内景点之间的连线
      console.log('🔗 开始绘制每天内的景点连线...');
      const newPolylines: any[] = [];
      
      // 当筛选特定天时，coordinates 数组只包含该天的景点
      // 所以直接使用 coordinates 数组即可，不需要 globalIndex
      if (selectedDay === 0) {
        // 查看全部天：需要按天分组
        let globalIndex = 0;
        
        plan.itinerary.forEach((day: ItineraryDay, dayIndex: number) => {
          const dayActivities = day.activities.filter(a => a.location);
          const dayCoordinates: Coordinate[] = [];
          
          // 收集这一天的有效坐标
          for (let i = 0; i < dayActivities.length; i++) {
            const coord = coordinates[globalIndex + i];
            if (coord && 
                typeof coord.lng === 'number' && 
                typeof coord.lat === 'number' &&
                !isNaN(coord.lng) && 
                !isNaN(coord.lat)) {
              dayCoordinates.push(coord);
            }
          }
          
          globalIndex += dayActivities.length;
          
          // 绘制这一天的连线
          if (dayCoordinates.length >= 2) {
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
            const color = colors[(day.day - 1) % colors.length];
            
            drawDayPolyline(dayCoordinates, color, day.day, newPolylines, amap, map);
            console.log(`✅ 第${day.day}天: 连接 ${dayCoordinates.length} 个景点，颜色: ${color}`);
          }
        });
      } else {
        // 查看单独某一天：coordinates 数组就是该天的所有坐标
        const dayCoordinates = coordinates.filter(coord => 
          coord && 
          typeof coord.lng === 'number' && 
          typeof coord.lat === 'number' &&
          !isNaN(coord.lng) && 
          !isNaN(coord.lat)
        );
        
        if (dayCoordinates.length >= 2) {
          const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
          const color = colors[(selectedDay - 1) % colors.length];
          
          drawDayPolyline(dayCoordinates, color, selectedDay, newPolylines, amap, map);
          console.log(`✅ 第${selectedDay}天: 连接 ${dayCoordinates.length} 个景点，颜色: ${color}`);
        }
      }
      
      console.log(`✅ 总共绘制 ${newPolylines.length} 条连线`);
      setPolylines(newPolylines);

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ 成功加载 ${newMarkers.length} 个地点，${newPolylines.length} 条连线 (总耗时 ${totalTime}秒)`);
      setLoading(false);

    } catch (error: any) {
      // 只有组件仍挂载时才报错和设置错误状态
      if (isMountedRef.current) {
        console.error('❌ 加载行程数据失败:', error);
        setError(error.message || '加载地图数据失败');
        setLoading(false);
      } else {
        console.log('⏹️ 组件已卸载，忽略错误:', error.message);
      }
    }
  };

  // 绘制一天的连线和箭头
  const drawDayPolyline = (
    dayCoordinates: Coordinate[],
    color: string,
    dayNumber: number,
    polylinesArray: any[],
    amap: any,
    map: any
  ) => {
    const path = dayCoordinates.map(coord => [coord.lng, coord.lat]);
    
    // 绘制连线
    const polyline = new amap.Polyline({
      path: path,
      strokeColor: color,
      strokeWeight: 3,
      strokeOpacity: 0.7,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true,
    });
    
    polyline.setMap(map);
    polylinesArray.push(polyline);
    
    // 添加方向箭头
    for (let i = 0; i < dayCoordinates.length - 1; i++) {
      const start = dayCoordinates[i];
      const end = dayCoordinates[i + 1];
      
      const midLng = (start.lng + end.lng) / 2;
      const midLat = (start.lat + end.lat) / 2;
      
      const mathAngle = Math.atan2(end.lat - start.lat, end.lng - start.lng) * 180 / Math.PI;
      const angle = -mathAngle;
      
      console.log(`   箭头 ${i+1}: 第${dayNumber}天, 角度: ${angle.toFixed(1)}°`);
      
      const arrowSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
          <path d="M 5 10 L 15 10 M 11 6 L 15 10 L 11 14" 
                fill="none" 
                stroke="${color}" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"/>
        </svg>
      `;
      const arrowIcon = `data:image/svg+xml;base64,${btoa(arrowSvg)}`;
      
      const arrowMarker = new amap.Marker({
        position: new amap.LngLat(midLng, midLat),
        icon: new amap.Icon({
          size: new amap.Size(20, 20),
          image: arrowIcon,
          imageSize: new amap.Size(20, 20),
        }),
        angle: angle,
        offset: new amap.Pixel(-10, -10),
        zIndex: 50,
      });
      
      arrowMarker.setMap(map);
      polylinesArray.push(arrowMarker);
    }
  };

  // 获取标记图标
  const getMarkerIconUrl = (type: string): string => {
    // 使用简单的颜色圆点作为标记
    // 实际项目中可以使用自定义图标
    const color = ACTIVITY_COLORS[type] || ACTIVITY_COLORS.other;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="8" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // 创建信息窗口内容
  const createInfoWindowContent = (activity: Activity): string => {
    return `
      <div style="padding: 12px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${activity.title}</h3>
        <p style="margin: 0 0 6px 0; font-size: 14px; color: #666;">${activity.time}</p>
        <p style="margin: 0 0 6px 0; font-size: 14px;">${activity.description}</p>
        ${activity.location ? `<p style="margin: 0; font-size: 13px; color: #888;"><strong>📍</strong> ${activity.location}</p>` : ''}
        ${activity.cost ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #FF5722;"><strong>💰</strong> ¥${activity.cost}</p>` : ''}
      </div>
    `;
  };

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        apiKey={apiKey}
        config={{
          zoom: 13,
          center: plan.destination ? undefined : { lng: 116.397428, lat: 39.90923 },
        }}
        onMapReady={handleMapReady}
        className="w-full h-full min-h-[400px]"
      >
        {/* 加载提示 */}
        {loading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <Card>
              <CardContent className="flex items-center gap-2 p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">加载地图数据...</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 max-w-md">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}


        {/* 天数筛选器 */}
        {!loading && markers.length > 0 && (
          <div className="absolute top-4 left-4 z-10">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="text-sm font-medium">选择天数</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedDay(0)}
                    className={`px-3 py-1 text-xs rounded ${
                      selectedDay === 0
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    全部
                  </button>
                  {plan.itinerary.map((day: ItineraryDay) => {
                    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
                    const dayColor = colors[(day.day - 1) % colors.length];
                    
                    return (
                      <button
                        key={day.day}
                        onClick={() => setSelectedDay(day.day)}
                        className={`px-3 py-1 text-xs rounded font-medium ${
                          selectedDay === day.day
                            ? 'text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={selectedDay === day.day ? { backgroundColor: dayColor } : {}}
                      >
                        第{day.day}天
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </MapContainer>
    </div>
  );
}

