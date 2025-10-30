import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlanManager } from '@/components/features/travel-plan/plan-manager';
import { Separator } from '@/components/ui/separator';
import { VoiceTestSection } from '@/components/features/voice/voice-test-section';

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

      <Separator className="my-8" />

      {/* 语音识别测试区域 */}
      <VoiceTestSection />
    </div>
  );
}

