'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  Clock, 
  MapPin, 
  ArrowRight, 
  Route, 
  ChevronRight,
  History,
  Trash
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getNavigationHistory, deleteNavigationQuery } from '@/lib/navigation/navigation-db';
import { useToast } from '@/hooks/use-toast';
import type { NavigationQuery } from '@/types/navigation.types';

// 导航查询记录类型
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

interface NavigationHistoryProps {
  onQueryClick: (query: NavigationQuery) => void;
  className?: string;
}

export function NavigationHistory({ onQueryClick, className = '' }: NavigationHistoryProps) {
  const [history, setHistory] = useState<NavigationQueryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // 获取导航历史记录
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const records = await getNavigationHistory(10);
      setHistory(records);
    } catch (error) {
      console.error('获取导航历史失败:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件挂载时获取历史记录
  useEffect(() => {
    fetchHistory();
  }, []);

  // 处理查询点击
  const handleQueryClick = (record: NavigationQueryRecord) => {
    onQueryClick({
      origin: record.origin,
      destination: record.destination,
      departureDate: record.departure_date || undefined,
      departureTime: record.departure_time || undefined,
    });
  };

  // 删除记录
  const handleDelete = async (record: NavigationQueryRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = window.confirm('确认删除该查询记录？此操作不可恢复');
    if (!ok) return;
    try {
      await deleteNavigationQuery(record.id);
      setHistory(prev => prev.filter(item => item.id !== record.id));
      toast({ title: '已删除', description: '查询历史记录已删除' });
    } catch (error: any) {
      toast({ title: '删除失败', description: error.message || '请稍后重试', variant: 'destructive' });
    }
  };

  // 格式化时间
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  // 格式化距离
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters}米`;
    } else {
      return `${(meters / 1000).toFixed(1)}公里`;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-4 w-4" />
          <h3 className="text-sm font-medium">查询历史</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchHistory}>
          刷新
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : history.length === 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="p-6 text-center">
            <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">暂无查询历史</p>
            <p className="text-xs text-muted-foreground mt-1">
              开始查询路线后，历史记录将显示在这里
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((record) => (
            <Card key={record.id} className="overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="p-4" onClick={() => handleQueryClick(record)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* 路线信息 */}
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium truncate">{record.origin}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium truncate">{record.destination}</span>
                    </div>

                    {/* 查询时间和日期时间 */}
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(record.query_time), 'MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      
                      {record.departure_date && (
                        <div className="flex items-center space-x-1">
                          <span>出发: {record.departure_date}</span>
                          {record.departure_time && <span>{record.departure_time}</span>}
                        </div>
                      )}
                    </div>

                    {/* 路线统计信息 */}
                    <div className="flex items-center space-x-4 text-xs">
                      <Badge variant="secondary" className="text-xs">
                        <Route className="h-3 w-3 mr-1" />
                        {record.routes_count}条路线
                      </Badge>
                      
                      {record.total_duration && (
                        <span className="text-muted-foreground">
                          {formatDuration(record.total_duration)}
                        </span>
                      )}
                      
                      {record.total_distance && (
                        <span className="text-muted-foreground">
                          {formatDistance(record.total_distance)}
                        </span>
                      )}
                      
                      {record.min_cost && (
                        <span className="text-muted-foreground">
                          最低¥{record.min_cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => handleDelete(record, e)} className="text-red-600 hover:text-red-700">
                      <Trash className="h-4 w-4" /> 删除
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}