'use client';

import { useState, useEffect } from 'react';
import { NavigationServiceBar } from './navigation-service-bar';
import { NavigationResults } from './navigation-results';
import { useToast } from '@/hooks/use-toast';
import { queryTransitRoute } from '@/lib/navigation/transit-service';
import { saveNavigationQuery, getNavigationHistory } from '@/lib/navigation/navigation-db';
import type { NavigationQuery, NavigationResult, TransitRoute } from '@/types/navigation.types';

interface NavigationServiceProps {
  className?: string;
}

export function NavigationService({ className = '' }: NavigationServiceProps) {
  const [currentResult, setCurrentResult] = useState<NavigationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [historyCount, setHistoryCount] = useState(0);

  // 获取历史记录数量
  const fetchHistoryCount = async () => {
    try {
      const history = await getNavigationHistory(1); // 只获取1条记录来获取总数
      setHistoryCount(history.length);
    } catch (error) {
      console.error('获取历史记录数量失败:', error);
    }
  };

  // 组件挂载时获取历史记录数量
  useEffect(() => {
    fetchHistoryCount();
  }, []);

  // 处理查询提交
  const handleQuerySubmit = async (query: NavigationQuery): Promise<NavigationResult | null> => {
    setIsLoading(true);
    
    try {
      // 调用高德地图API查询公交路线
      const routes = await queryTransitRoute(query);
      
      if (routes.length === 0) {
        toast({
          title: "未找到路线",
          description: "未找到从出发地到目的地的公交路线，请尝试其他交通方式或调整查询条件。",
          variant: "destructive",
        });
        return null;
      }

      // 创建导航结果对象（直接使用公交路线数据，以便保存路段/站点）
      const result: NavigationResult = {
        query,
        routes,
      };

      // 保存查询结果到数据库
      try {
        await saveNavigationQuery(result);
        toast({
          title: "查询成功",
          description: `找到${routes.length}条公交路线方案`,
        });
        
        // 更新历史记录数量
        fetchHistoryCount();
      } catch (dbError) {
        console.error('保存导航查询失败:', dbError);
        // 即使保存失败，也显示查询结果
        toast({
          title: "查询成功",
          description: `找到${routes.length}条公交路线方案，但保存记录失败`,
          variant: "default",
        });
      }

      // 更新当前结果
      setCurrentResult(result);
      return result;
    } catch (error: any) {
      console.error('导航查询失败:', error);
      toast({
        title: "查询失败",
        description: error.message || "查询路线时发生错误，请重试",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <NavigationServiceBar onQuerySubmit={handleQuerySubmit} historyCount={historyCount} />
      
      {currentResult && (
        <NavigationResults routes={currentResult.routes} />
      )}
      
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在查询路线...</p>
          </div>
        </div>
      )}
    </div>
  );
}