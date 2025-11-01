/**
 * 行程地图组件
 * 在地图上展示行程中的所有景点和路线
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer } from './map-container';
import { geocode, batchGeocode } from '@/lib/map/geocoding';
import { planRoute, formatDistance, formatDuration } from '@/lib/map/route-planning';
import { Loader2, Navigation, MapPin, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { TravelPlan, Activity, ItineraryDay } from '@/types/travel-plan.types';
import type { Coordinate, TravelMode } from '@/types/map.types';

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
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

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

  // 加载行程数据到地图
  useEffect(() => {
    if (!map || !amap || !plan.itinerary || plan.itinerary.length === 0) {
      return;
    }

    loadItineraryData();
  }, [map, amap, plan]);

  // 加载行程数据
  const loadItineraryData = async () => {
    if (!map || !amap) return;

    setLoading(true);
    setError(null);

    try {
      // 收集所有需要地理编码的活动
      const activities: Activity[] = [];
      plan.itinerary.forEach((day: ItineraryDay) => {
        day.activities.forEach((activity: Activity) => {
          if (activity.location) {
            activities.push(activity);
          }
        });
      });

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

      if (successCount === 0) {
        setError('无法获取任何景点的位置信息');
        setLoading(false);
        return;
      }

      // 清除旧标记
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);

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
        validCoordinates.push(coordinate);

        try {
          // 创建标记
          const marker = new amap.Marker({
            position: [coordinate.lng, coordinate.lat],
            title: activity.title,
            icon: new amap.Icon({
              size: new amap.Size(32, 32),
              image: getMarkerIconUrl(activity.type),
              imageSize: new amap.Size(32, 32),
            }),
            offset: new amap.Pixel(-16, -32),
          });

          // 点击标记
          marker.on('click', () => {
            setSelectedActivity(activity);
            
            // 创建信息窗口
            const infoWindow = new amap.InfoWindow({
              content: createInfoWindowContent(activity),
              offset: new amap.Pixel(0, -32),
            });
            infoWindow.open(map, marker.getPosition());
          });

          marker.setMap(map);
          newMarkers.push(marker);
          
          console.log(`✅ 创建标记: "${activity.title}" (${coordinate.lng.toFixed(6)}, ${coordinate.lat.toFixed(6)})`);
        } catch (error: any) {
          console.error(`❌ 创建标记失败: "${activity.title}"`, error.message);
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
            map.setZoomAndCenter(15, [validCoords[0].lng, validCoords[0].lat]);
          } else {
            // 多个点，设置边界
            const bounds = new amap.Bounds(
              [validCoords[0].lng, validCoords[0].lat],
              [validCoords[0].lng, validCoords[0].lat]
            );

            validCoords.forEach(coord => {
              bounds.extend([coord.lng, coord.lat]);
            });

            map.setBounds(bounds, false, [60, 60, 60, 60]);
          }
        } catch (error: any) {
          console.error('❌ 设置地图边界失败:', error);
          // 使用默认中心点
          if (validCoordinates[0]) {
            map.setZoomAndCenter(12, [validCoordinates[0].lng, validCoordinates[0].lat]);
          }
        }
      }

      // 尝试绘制路线（前两个点）
      if (validCoordinates.length >= 2) {
        try {
          const route = await planRoute({
            origin: validCoordinates[0],
            destination: validCoordinates[1],
            mode: 'walking',
          });

          setRouteInfo({
            distance: route.distance,
            duration: route.duration,
          });

          // 绘制路线
          const polyline = new amap.Polyline({
            path: route.path.map(p => [p.lng, p.lat]),
            strokeColor: '#4285F4',
            strokeWeight: 5,
            strokeOpacity: 0.8,
            lineJoin: 'round',
            lineCap: 'round',
          });

          polyline.setMap(map);
          console.log(`✅ 路线绘制成功`);
        } catch (error: any) {
          console.warn('⚠️ 路线规划失败（不影响地图显示）:', error?.message || error);
          // 路线规划失败不影响地图基本功能
          setRouteInfo(null);
        }
      } else {
        console.log(`ℹ️ 有效坐标 ${validCoordinates.length} 个，跳过路线规划`);
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ 成功加载 ${newMarkers.length} 个地点 (总耗时 ${totalTime}秒)`);
      setLoading(false);

    } catch (error: any) {
      console.error('❌ 加载行程数据失败:', error);
      setError(error.message || '加载地图数据失败');
      setLoading(false);
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

        {/* 路线信息 */}
        {routeInfo && !loading && (
          <div className="absolute bottom-4 left-4 z-10">
            <Card>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">路线信息</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>距离: {formatDistance(routeInfo.distance)}</div>
                  <div>时间: {formatDuration(routeInfo.duration)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 图例 */}
        {markers.length > 0 && !loading && (
          <div className="absolute top-4 right-4 z-10">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="text-sm font-medium">图例</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(ACTIVITY_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-3 h-3 rounded-full border-2 border-white"
                        style={{ backgroundColor: color }}
                      />
                      <span className="capitalize">{type}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </MapContainer>
    </div>
  );
}

