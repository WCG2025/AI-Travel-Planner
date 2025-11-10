'use client';

import { useState, useEffect } from 'react';
import { Navigation, Plus, Route, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NavigationQueryDialog } from './navigation-query-dialog';
import { NavigationHistory } from './navigation-history';
import { getNavigationHistory } from '@/lib/navigation/navigation-db';
import type { NavigationQuery, NavigationResult } from '@/types/navigation.types';

interface NavigationServiceBarProps {
  onQuerySubmit?: (query: NavigationQuery) => Promise<NavigationResult | null>;
  className?: string;
  historyCount?: number;
}

export function NavigationServiceBar({ 
  onQuerySubmit,
  className = '',
  historyCount = 0
}: NavigationServiceBarProps) {
  const [showQueryDialog, setShowQueryDialog] = useState(false);
  const [initialQuery, setInitialQuery] = useState<Partial<NavigationQuery> | undefined>(undefined);
  const [recentQueries, setRecentQueries] = useState<NavigationResult[]>([]);

  // 获取导航历史记录数量
  const fetchHistoryCount = async () => {
    try {
      const history = await getNavigationHistory(10);
      // 这里应该更新父组件传递的historyCount，但由于是props，不能直接修改
      // 实际使用中，父组件应该通过回调来更新historyCount
    } catch (error) {
      console.error('获取导航历史失败:', error);
    }
  };

  // 组件挂载时获取历史记录数量
  useEffect(() => {
    fetchHistoryCount();
  }, []);

  // 处理查询提交
  const handleQuerySubmit = async (query: NavigationQuery) => {
    if (!onQuerySubmit) return null;
    
    try {
      const result = await onQuerySubmit(query);
      if (result) {
        // 添加到最近查询
        setRecentQueries(prev => [result, ...prev.slice(0, 4)]);
        // 查询成功后更新历史记录数量
        fetchHistoryCount();
      }
      return result;
    } catch (error) {
      console.error('导航查询失败:', error);
      throw error;
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          导航服务
        </CardTitle>
        <CardDescription>
          使用高德地图规划您的出行路线，支持公交导航方案查询
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Route className="h-4 w-4" />
              <span>公交出行</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>实时路线</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>精准定位</span>
            </div>
          </div>
          <Button 
            onClick={() => setShowQueryDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            新增路径查询
          </Button>
        </div>

        {/* 最近查询记录 */}
        {(recentQueries.length > 0 || historyCount > 0) && (
          <NavigationHistory 
            queries={recentQueries} 
            historyCount={historyCount}
            onQueryClick={(query) => {
              // 点击历史记录时，打开查询对话框并填充数据
              setInitialQuery(query);
              setShowQueryDialog(true);
            }}
          />
        )}
      </CardContent>

      {/* 路径查询对话框 */}
      <NavigationQueryDialog
        open={showQueryDialog}
        onOpenChange={setShowQueryDialog}
        onSubmit={handleQuerySubmit}
        initialQuery={initialQuery}
      />
    </Card>
  );
}