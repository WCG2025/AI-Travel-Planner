'use client';

import { useState } from 'react';
import { Clock, MapPin, Navigation, Bus, Footprints, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { formatDistance, formatDuration } from '@/lib/utils';
import type { TransitRoute, TransitSegment } from '@/types/navigation.types';

interface NavigationResultsProps {
  routes: TransitRoute[];
  className?: string;
}

export function NavigationResults({ routes, className = '' }: NavigationResultsProps) {
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  if (routes.length === 0) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Navigation className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">未找到合适的路线</h3>
            <p className="text-muted-foreground">请尝试调整出发地、目的地或时间后重新查询</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 获取交通方式图标
  const getTransportIcon = (transportation: string) => {
    switch (transportation) {
      case '地铁':
      case 'SUBWAY':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">地铁</Badge>;
      case '公交':
      case 'BUS':
        return <Badge variant="outline" className="text-green-600 border-green-600">公交</Badge>;
      case '步行':
      case 'WALKING':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">步行</Badge>;
      default:
        return <Badge variant="outline">{transportation}</Badge>;
    }
  };

  // 格式化距离
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}米`;
    } else {
      return `${(meters / 1000).toFixed(1)}公里`;
    }
  };

  // 格式化时间
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Navigation className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">导航方案</h3>
        <Badge variant="secondary">{routes.length}个方案</Badge>
      </div>

      {routes.map((route) => (
        <Card key={route.routeId} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{route.origin}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{route.destination}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(route.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{formatDistance(route.distance)}</span>
                </div>
                <Badge variant="outline">¥{route.cost.toFixed(2)}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Bus className="h-4 w-4" />
              <span>公交 {formatDistance(route.transitDistance)}</span>
              <Footprints className="h-4 w-4 ml-2" />
              <span>步行 {formatDistance(route.walkingDistance)}</span>
            </div>

            <Collapsible
              open={expandedRoute === route.routeId}
              onOpenChange={(open) => setExpandedRoute(open ? route.routeId : null)}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span>查看详细路线</span>
                  {expandedRoute === route.routeId ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-3 mt-3">
                {route.segments.map((segment, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getTransportIcon(segment.transportation)}
                      <span className="font-medium">{segment.origin}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{segment.destination}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground ml-2">
                      <span>{formatDuration(segment.duration)}</span>
                      <span>{formatDistance(segment.distance)}</span>
                      {segment.vehicle && (
                        <span>{segment.vehicle}</span>
                      )}
                    </div>
                    
                    {segment.instructions && segment.instructions.length > 0 && (
                      <div className="ml-2 space-y-1">
                        {segment.instructions.map((instruction, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">
                            {instruction}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {index < route.segments.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}