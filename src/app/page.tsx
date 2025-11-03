import Link from 'next/link';
import { ArrowRight, Sparkles, Globe2, Wallet, Map, Star, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/80 border-b border-orange-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-orange-500 to-pink-600 p-2.5 rounded-full">
                <Globe2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="font-black text-2xl bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              AI 旅行规划师
            </span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                登录
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all">
                免费开始
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 text-6xl animate-bounce">✈️</div>
        <div className="absolute top-40 right-20 text-5xl animate-pulse">🗺️</div>
        <div className="absolute bottom-40 left-20 text-5xl animate-bounce delay-100">🏖️</div>
        <div className="absolute bottom-20 right-40 text-4xl animate-pulse delay-200">🎒</div>
        
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-6xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 border-2 border-orange-200">
              <Sparkles className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                AI 驱动的智能旅行助手
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-black leading-tight">
              <span className="bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                让 AI 帮你规划
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                完美旅程 🌍
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto font-medium">
              只需告诉我们你的想法，AI 将为你生成
              <span className="text-orange-600 font-bold"> 个性化旅行路线</span>、
              <span className="text-pink-600 font-bold">预算分析</span> 和
              <span className="text-purple-600 font-bold">实时导航</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white shadow-2xl shadow-pink-300 hover:shadow-pink-400 hover:scale-105 transition-all">
                  <Sparkles className="mr-2 h-5 w-5" />
                  开始你的旅程
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 hover:scale-105 transition-all">
                  已有账户？登录
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  1000+
                </div>
                <div className="text-sm text-gray-600 mt-1">旅行计划</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  500+
                </div>
                <div className="text-sm text-gray-600 mt-1">活跃用户</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                  100+
                </div>
                <div className="text-sm text-gray-600 mt-1">目的地</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                为什么选择我们？
              </span>
            </h2>
            <p className="text-xl text-gray-600">全方位的旅行规划解决方案</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Feature 1 */}
            <Card className="p-8 border-2 border-orange-200 bg-white/80 backdrop-blur hover:shadow-2xl hover:shadow-orange-200 hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">智能行程规划</h3>
              <p className="text-gray-600 leading-relaxed">
                支持<span className="text-orange-600 font-semibold">语音</span>和
                <span className="text-pink-600 font-semibold">文字</span>输入，
                AI 自动生成包含景点、美食、住宿的个性化路线
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 border-2 border-pink-200 bg-white/80 backdrop-blur hover:shadow-2xl hover:shadow-pink-200 hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">费用预算管理</h3>
              <p className="text-gray-600 leading-relaxed">
                智能<span className="text-pink-600 font-semibold">预算分析</span>，
                实时记录旅行开销，帮你合理控制预算，避免超支
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 border-2 border-purple-200 bg-white/80 backdrop-blur hover:shadow-2xl hover:shadow-purple-200 hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Map className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">地图导航集成</h3>
              <p className="text-gray-600 leading-relaxed">
                集成<span className="text-purple-600 font-semibold">高德地图</span>，
                提供实时位置服务和导航，让旅程更加顺畅
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-8 border-2 border-orange-200 bg-white/80 backdrop-blur hover:shadow-2xl hover:shadow-orange-200 hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">多人协作</h3>
              <p className="text-gray-600 leading-relaxed">
                支持<span className="text-orange-600 font-semibold">多人</span>共同编辑旅行计划，
                实时同步，让团队旅行规划更简单
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="p-8 border-2 border-pink-200 bg-white/80 backdrop-blur hover:shadow-2xl hover:shadow-pink-200 hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">AI 智能推荐</h3>
              <p className="text-gray-600 leading-relaxed">
                基于你的<span className="text-pink-600 font-semibold">偏好</span>和
                <span className="text-purple-600 font-semibold">历史</span>，
                AI 推荐最适合你的景点和活动
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="p-8 border-2 border-purple-200 bg-white/80 backdrop-blur hover:shadow-2xl hover:shadow-purple-200 hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">实时更新</h3>
              <p className="text-gray-600 leading-relaxed">
                <span className="text-purple-600 font-semibold">实时</span>获取天气、
                交通、景点开放信息，让你的计划始终保持最新
              </p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <Card className="max-w-4xl mx-auto p-12 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 border-0 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                准备好开始你的旅程了吗？
              </h2>
              <p className="text-xl mb-8 text-white/90">
                加入数千名用户，让 AI 帮你规划下一次完美旅行
              </p>
              <Link href="/signup">
                <Button size="lg" className="text-lg px-10 py-6 bg-white text-orange-600 hover:bg-gray-100 shadow-2xl hover:scale-105 transition-all">
                  <Sparkles className="mr-2 h-5 w-5" />
                  立即免费开始
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-orange-100 bg-white/50 backdrop-blur py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  AI 旅行规划师 - 让旅行更智能
                </span>
              </div>
              <div className="text-sm text-gray-500">
                © 2025 AI Travel Planner. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

