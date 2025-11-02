import { Header } from '@/components/layout/header';

// 强制动态渲染，避免构建时预渲染子页面
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

