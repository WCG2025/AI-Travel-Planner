'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  fullName: z.string().min(2, '姓名至少需要 2 个字符'),
  username: z.string().min(3, '用户名至少需要 3 个字符').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// 客户端组件，不会在构建时预渲染
export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // 获取用户资料
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
          setValue('fullName', data.full_name || '');
          setValue('username', data.username || '');
        } else {
          // 如果没有资料，使用认证信息
          setValue('fullName', user.user_metadata?.full_name || '');
        }
      };

      fetchProfile();
    }
  }, [user, authLoading, router, supabase, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        id: user.id,
        full_name: data.fullName,
        username: data.username,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: '保存成功',
        description: '您的个人资料已更新',
      });
    } catch (error) {
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '请稍后再试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">个人资料</h1>
        <p className="text-muted-foreground mt-2">管理您的个人信息</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>更新您的个人资料信息</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" value={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">邮箱地址不可修改</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="fullName">姓名</Label>
              <Input
                id="fullName"
                placeholder="张三"
                {...register('fullName')}
                disabled={loading}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">用户名（可选）</Label>
              <Input
                id="username"
                placeholder="zhangsan"
                {...register('username')}
                disabled={loading}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存更改'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>查看您的账户详情</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">账户 ID</Label>
            <p className="text-sm font-mono mt-1">{user?.id}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">创建时间</Label>
            <p className="text-sm mt-1">
              {user?.created_at
                ? new Date(user.created_at).toLocaleString('zh-CN')
                : '未知'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

