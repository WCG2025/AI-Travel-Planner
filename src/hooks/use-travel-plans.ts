'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TravelPlan } from '@/types/travel-plan.types';

export function useTravelPlans() {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取所有计划
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('请先登录');
      }
      
      const { data, error: dbError } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (dbError) throw dbError;
      
      // 转换数据格式
      const transformedPlans: TravelPlan[] = (data || []).map((item) => {
        // 优先使用数据库中的 days 字段
        let days = item.days;
        
        // 如果没有 days，尝试从日期计算
        if (!days && item.start_date && item.end_date) {
          days = Math.ceil(
            (new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) / 
            (1000 * 60 * 60 * 24)
          ) + 1;
        }
        
        // 如果还是没有，从 itinerary 数组长度获取
        if (!days && item.itinerary && Array.isArray(item.itinerary)) {
          days = item.itinerary.length;
        }
        
        // 默认值
        if (!days) {
          days = 1;
        }
        
        return {
          id: item.id,
          userId: item.user_id,
          title: item.title,
          destination: item.destination,
          startDate: item.start_date || undefined,
          endDate: item.end_date || undefined,
          days,
          budget: item.budget || undefined,
          preferences: item.preferences || undefined,
          itinerary: item.itinerary || [],
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        };
      });
      
      setPlans(transformedPlans);
    } catch (err: any) {
      console.error('获取计划列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 删除计划
  const deletePlan = useCallback(async (planId: string) => {
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from('travel_plans')
        .delete()
        .eq('id', planId);
      
      if (dbError) throw dbError;
      
      // 更新本地状态
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      
      return true;
    } catch (err: any) {
      console.error('删除计划失败:', err);
      throw err;
    }
  }, []);
  
  // 初始加载
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);
  
  return {
    plans,
    loading,
    error,
    fetchPlans,
    deletePlan,
  };
}

