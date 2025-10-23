import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 获取用户的旅行计划
  const { data: plans } = await supabase
    .from('travel_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">我的旅行计划</h1>
          <p className="text-muted-foreground mt-2">
            管理您的所有旅行计划
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          创建新计划
        </Button>
      </div>

      {plans && plans.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>{plan.title}</CardTitle>
                <CardDescription>{plan.destination}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">日期：</span>
                    {new Date(plan.start_date).toLocaleDateString()} -{' '}
                    {new Date(plan.end_date).toLocaleDateString()}
                  </p>
                  {plan.budget && (
                    <p>
                      <span className="font-medium">预算：</span>¥
                      {plan.budget.toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="text-6xl">🗺️</div>
              <h3 className="text-xl font-semibold">还没有旅行计划</h3>
              <p className="text-muted-foreground">创建您的第一个旅行计划，开始精彩旅程！</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                创建计划
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

