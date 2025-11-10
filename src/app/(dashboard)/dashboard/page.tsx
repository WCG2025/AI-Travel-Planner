import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlanManager } from '@/components/features/travel-plan/plan-manager';
import { NavigationService } from '@/components/features/navigation/navigation-service';

// 强制动态渲染，不在构建时预渲染
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">欢迎回来！</h1>
        <p className="text-muted-foreground mt-2">
          使用 AI 规划您的完美旅程
        </p>
      </div>

      {/* 旅行计划管理 */}
      <PlanManager />

      {/* 导航服务（公交路径查询） */}
      <NavigationService />
    </div>
  );
}

