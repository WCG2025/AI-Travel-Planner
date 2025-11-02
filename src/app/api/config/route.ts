import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 返回客户端需要的配置（仅公开配置）
    const config = {
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      xfyun: {
        appId: process.env.NEXT_PUBLIC_XFYUN_APP_ID || '',
        apiKey: process.env.NEXT_PUBLIC_XFYUN_API_KEY || '',
        apiSecret: process.env.NEXT_PUBLIC_XFYUN_API_SECRET || '',
      },
      amap: {
        key: process.env.NEXT_PUBLIC_AMAP_KEY || '',
        secret: process.env.NEXT_PUBLIC_AMAP_SECRET || '',
      },
    };

    // 验证必需的配置
    const missing = [];
    if (!config.supabase.url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!config.supabase.anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!config.xfyun.appId) missing.push('NEXT_PUBLIC_XFYUN_APP_ID');
    if (!config.xfyun.apiKey) missing.push('NEXT_PUBLIC_XFYUN_API_KEY');
    if (!config.xfyun.apiSecret) missing.push('NEXT_PUBLIC_XFYUN_API_SECRET');
    if (!config.amap.key) missing.push('NEXT_PUBLIC_AMAP_KEY');

    if (missing.length > 0) {
      console.error('缺少环境变量:', missing);
      return NextResponse.json(
        { 
          error: '配置不完整',
          missing,
          message: `缺少环境变量: ${missing.join(', ')}`
        },
        { status: 500 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('获取配置失败:', error);
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 }
    );
  }
}
