// 强制动态渲染，避免构建时预渲染子页面
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce">✈️</div>
      <div className="absolute top-20 right-10 text-5xl opacity-20 animate-pulse">🗺️</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-bounce">🏖️</div>
      <div className="absolute bottom-10 right-20 text-4xl opacity-20 animate-pulse">🎒</div>
      
      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  );
}

