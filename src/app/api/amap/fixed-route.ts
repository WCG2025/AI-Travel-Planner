import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

/**
 * GET /api/amap/fixed-route/:path*
 * 修复版代理 GET 请求到高德地图 API
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("=== Fixed API Proxy Route Called ===");
  try {
    // 获取 Web服务 API Key
    const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY || process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY;
    console.log('🔐 Web服务 API Key:', webServiceKey ? `${webServiceKey.substring(0, 8)}...` : '未配置');
    
    if (!webServiceKey) {
      console.error('❌ AMAP_WEB_SERVICE_KEY 未配置');
      return NextResponse.json(
        { success: false, error: 'Web服务 API Key 未配置' },
        { status: 500 }
      );
    }

    // 获取请求路径和查询参数
    const { searchParams, pathname } = new URL(request.url);
    console.log("Original pathname:", pathname);
    const amapPath = pathname.replace('/api/amap/fixed-route', '');
    console.log("AMAP path:", amapPath);
    
    // 构建目标 URL
    const targetUrl = new URL(`https://restapi.amap.com${amapPath}`);
    console.log("Base target URL:", targetUrl.toString());
    
    // 添加 API Key
    targetUrl.searchParams.set('key', webServiceKey);
    console.log("Target URL with key:", targetUrl.toString());
    
    // 复制其他查询参数
    const paramsObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      paramsObj[key] = value;
      if (key !== 'key') { // 避免覆盖 API Key
        targetUrl.searchParams.set(key, value);
      }
    });
    console.log("All search params:", paramsObj);
    console.log("Final target URL:", targetUrl.toString());

    // 调用高德地图 Web服务 API
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("AMap API response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("AMap API response data:", JSON.stringify(data, null, 2));
    
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('❌ 高德地图 API 代理失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || '代理请求失败，请重试',
      },
      { status: 500 }
    );
  }
}