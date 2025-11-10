import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

/**
 * GET /api/amap/:path*
 * 代理 GET 请求到高德地图 API
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("=== AMap API Proxy Route Called ===");
  try {
    // 获取所有相关的环境变量
    const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY;
    const nextPublicWebServiceKey = process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY;
    const nextPublicAmapKey = process.env.NEXT_PUBLIC_AMAP_KEY;
    
    console.log('Environment variables check:');
    console.log('- AMAP_WEB_SERVICE_KEY:', webServiceKey ? `${webServiceKey.substring(0, 8)}...` : 'NOT SET');
    console.log('- NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY:', nextPublicWebServiceKey ? `${nextPublicWebServiceKey.substring(0, 8)}...` : 'NOT SET');
    console.log('- NEXT_PUBLIC_AMAP_KEY:', nextPublicAmapKey ? `${nextPublicAmapKey.substring(0, 8)}...` : 'NOT SET');
    
    // 确定使用的密钥（优先级：AMAP_WEB_SERVICE_KEY > NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY > NEXT_PUBLIC_AMAP_KEY）
    const effectiveKey = webServiceKey || nextPublicWebServiceKey || nextPublicAmapKey;
    
    if (!effectiveKey) {
      console.error('❌ No API Key found in environment variables');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Web服务 API Key 未配置',
          debug: {
            AMAP_WEB_SERVICE_KEY: webServiceKey ? 'SET' : 'MISSING',
            NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY: nextPublicWebServiceKey ? 'SET' : 'MISSING',
            NEXT_PUBLIC_AMAP_KEY: nextPublicAmapKey ? 'SET' : 'MISSING'
          }
        },
        { status: 500 }
      );
    }
    
    console.log('🔐 Using effective API Key:', effectiveKey ? `${effectiveKey.substring(0, 8)}...` : '未配置');

    // 获取请求路径和查询参数
    const { searchParams, pathname } = new URL(request.url);
    console.log("Original pathname:", pathname);
    const amapPath = pathname.replace('/api/amap', '');
    console.log("AMAP path:", amapPath);
    
    // 构建目标 URL
    const targetUrl = new URL(`https://restapi.amap.com${amapPath}`);
    console.log("Base target URL:", targetUrl.toString());
    
    // 添加 API Key
    targetUrl.searchParams.set('key', effectiveKey);
    console.log("Target URL with key:", targetUrl.toString());
    
    // 复制其他查询参数（排除key参数）
    const paramsObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      paramsObj[key] = value;
      if (key !== 'key') { // 避免覆盖我们设置的 API Key
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
      const errorText = await response.text();
      console.error("❌ HTTP error! status:", response.status);
      console.error("- Error response body:", errorText);
      
      return NextResponse.json(
        {
          success: false,
          error: `HTTP error! status: ${response.status}`,
          details: errorText,
          debug: {
            requestUrl: targetUrl.toString(),
            responseStatus: response.status,
            responseBody: errorText
          }
        },
        { status: response.status }
      );
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
        stack: error.stack
      },
      { status: 500 }
    );
  }
}