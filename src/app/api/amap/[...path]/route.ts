import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

/**
 * GET /api/amap/:path*
 * 通配符代理：代理所有 /api/amap/* 到高德 Web服务 API
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 读取环境变量（服务端可用），优先级：AMAP_WEB_SERVICE_KEY > NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY > NEXT_PUBLIC_AMAP_KEY
    const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY;
    const nextPublicWebServiceKey = process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY;
    const nextPublicAmapKey = process.env.NEXT_PUBLIC_AMAP_KEY;
    const effectiveKey = webServiceKey || nextPublicWebServiceKey || nextPublicAmapKey;

    if (!effectiveKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Web服务 API Key 未配置',
          debug: {
            AMAP_WEB_SERVICE_KEY: webServiceKey ? 'SET' : 'MISSING',
            NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY: nextPublicWebServiceKey ? 'SET' : 'MISSING',
            NEXT_PUBLIC_AMAP_KEY: nextPublicAmapKey ? 'SET' : 'MISSING',
          },
        },
        { status: 500 }
      );
    }

    // 解析目标路径并构建转发 URL
    const { searchParams, pathname } = new URL(request.url);
    // pathname 形如 /api/amap/v3/assistant/inputtips
    const amapPath = pathname.replace('/api/amap', ''); // → /v3/assistant/inputtips
    const targetUrl = new URL(`https://restapi.amap.com${amapPath}`);

    // 注入 API Key
    targetUrl.searchParams.set('key', effectiveKey);
    // 复制其余查询参数（避免覆盖 key）
    searchParams.forEach((value, key) => {
      if (key !== 'key') {
        targetUrl.searchParams.set(key, value);
      }
    });

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `HTTP error! status: ${response.status}`,
          details: errorText,
          debug: {
            requestUrl: targetUrl.toString(),
            responseStatus: response.status,
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '代理请求失败，请重试' },
      { status: 500 }
    );
  }
}