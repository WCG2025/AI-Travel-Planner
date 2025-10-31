'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanForm } from './plan-form';
import { PlanCard } from './plan-card';
import { PlanDetail } from './plan-detail';
import { useGeneratePlan } from '@/hooks/use-generate-plan';
import { useTravelPlans } from '@/hooks/use-travel-plans';
import { useToast } from '@/hooks/use-toast';
import type { TravelPlan, TravelPlanInput } from '@/types/travel-plan.types';

export function PlanManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TravelPlan | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const { generatePlan, status, plan: generatedPlan, error, progress, progressPercent } = useGeneratePlan();
  const { plans, loading, error: plansError, fetchPlans, deletePlan } = useTravelPlans();
  const { toast } = useToast();
  
  // 处理生成计划
  const handleGeneratePlan = async (input: TravelPlanInput) => {
    try {
      const newPlan = await generatePlan(input);
      
      toast({
        title: '✅ 计划生成成功！',
        description: `已为您生成 ${newPlan.title}`,
      });
      
      // 关闭创建对话框
      setShowCreateDialog(false);
      
      // 刷新计划列表
      await fetchPlans();
      
      // 显示生成的计划
      setSelectedPlan(newPlan);
      setShowDetailDialog(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ 生成失败',
        description: error.message || '请检查网络连接后重试',
      });
    }
  };
  
  // 处理查看计划
  const handleViewPlan = (plan: TravelPlan) => {
    setSelectedPlan(plan);
    setShowDetailDialog(true);
  };
  
  // 处理删除计划
  const handleDeletePlan = async (planId: string) => {
    try {
      await deletePlan(planId);
      toast({
        title: '✅ 删除成功',
        description: '计划已删除',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '❌ 删除失败',
        description: '请稍后重试',
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">我的旅行计划</h2>
          <p className="text-muted-foreground mt-1">
            使用 AI 规划您的完美旅程
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          创建新计划
        </Button>
      </div>
      
      {/* 错误提示 */}
      {plansError && (
        <Alert variant="destructive">
          <AlertDescription>{plansError}</AlertDescription>
        </Alert>
      )}
      
      {/* 计划列表 */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      ) : plans.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onView={handleViewPlan}
              onDelete={handleDeletePlan}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg">
          <div className="text-center space-y-4">
            <div className="text-6xl">🗺️</div>
            <h3 className="text-xl font-semibold">还没有旅行计划</h3>
            <p className="text-muted-foreground">创建您的第一个旅行计划，开始精彩旅程！</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建计划
            </Button>
          </div>
        </div>
      )}
      
      {/* 创建计划对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建新的旅行计划</DialogTitle>
            <DialogDescription>
              使用 AI 生成个性化的旅行计划
            </DialogDescription>
          </DialogHeader>
          
          {status === 'generating' && (
            <Alert>
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>{progress || '正在生成中...'}</span>
                    <span className="font-medium">{Math.round(progressPercent)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    正在使用渐进式生成，逐天创建行程，请稍候...
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <PlanForm
            onSubmit={handleGeneratePlan}
            loading={status === 'generating'}
          />
        </DialogContent>
      </Dialog>
      
      {/* 计划详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.title || '行程详情'}</DialogTitle>
          </DialogHeader>
          {selectedPlan && <PlanDetail plan={selectedPlan} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

