'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      toast({
        title: '登录成功！',
        description: '正在跳转到仪表板...',
      });

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      toast({
        title: '登录失败',
        description: error instanceof Error ? error.message : '请检查邮箱和密码',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-orange-200 shadow-2xl shadow-orange-100">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <CardTitle className="text-3xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
          欢迎回来
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          登录继续你的旅行规划之旅
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              disabled={loading}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all" 
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          还没有账户？{' '}
          <Link href="/signup" className="text-orange-600 hover:text-pink-600 font-semibold hover:underline transition-colors">
            立即注册 →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

