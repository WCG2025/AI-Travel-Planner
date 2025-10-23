import Link from 'next/link';
import { ArrowRight, PlaneTakeoff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <PlaneTakeoff className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">AI 旅行规划师</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/signup">
              <Button>开始使用</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-8 md:p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-center flex flex-col gap-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              AI 旅行规划师
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              让 AI 帮你规划完美旅程
            </p>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              通过语音或文字告诉我们你的需求，AI 将自动生成个性化的旅行路线、预算分析和实时导航
            </p>
          </div>

          <div className="flex gap-4 mt-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                免费开始
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                登录账户
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full">
            <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="text-lg font-semibold mb-2">智能行程规划</h3>
              <p className="text-sm text-muted-foreground">
                支持语音/文字输入，AI 自动生成个性化旅行路线，包含景点、美食、住宿等详细安排
              </p>
            </div>
            <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-lg font-semibold mb-2">费用预算管理</h3>
              <p className="text-sm text-muted-foreground">
                智能预算分析，实时记录旅行开销，帮你合理控制预算，避免超支
              </p>
            </div>
            <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-lg font-semibold mb-2">地图导航集成</h3>
              <p className="text-sm text-muted-foreground">
                集成高德地图，提供实时位置服务和导航功能，让你的旅程更加顺畅
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mt-12 text-center text-sm text-muted-foreground space-y-2">
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              第二阶段开发完成 ✅ 用户认证系统
            </p>
            <p className="text-xs">Next.js + TypeScript + Tailwind CSS + Supabase</p>
          </div>
        </div>
      </main>
    </div>
  );
}

