import { createBrowserClient } from '@supabase/ssr';

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // 使用单例模式，避免重复创建客户端
  if (clientInstance) {
    return clientInstance;
  }

  // 优先使用构建时的环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase 配置错误:', {
      url: supabaseUrl ? '已配置' : '未配置',
      key: supabaseAnonKey ? '已配置' : '未配置',
      env: process.env.NODE_ENV,
      allEnv: typeof window !== 'undefined' ? 'browser' : 'server'
    });
    
    // 在浏览器环境中，尝试从 window 对象获取（如果有的话）
    if (typeof window !== 'undefined') {
      console.error('浏览器环境 - 环境变量应该在构建时注入');
    }
    
    throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client!');
  }

  console.log('创建 Supabase 客户端:', {
    url: supabaseUrl.substring(0, 30) + '...',
    keyLength: supabaseAnonKey.length,
    env: process.env.NODE_ENV
  });

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return clientInstance;
}

