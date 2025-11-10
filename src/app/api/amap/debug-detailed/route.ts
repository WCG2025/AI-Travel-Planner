import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("=== Detailed Debug AMap API Proxy Route ===");
  
  try {
    // 1. 获取 Web服务 API Key
    const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY;
    const nextPublicWebServiceKey = process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY;
    
    console.log('Environment variables check:');
    console.log('- AMAP_WEB_SERVICE_KEY:', webServiceKey ? `${webServiceKey.substring(0, 8)}...` : 'NOT SET');
    console.log('- NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY:', nextPublicWebServiceKey ? `${nextPublicWebServiceKey.substring(0, 8)}...` : 'NOT SET');
    
    const effectiveKey = webServiceKey || nextPublicWebServiceKey;
    
    if (!effectiveKey) {
      console.error('❌ No API Key found in environment variables');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Web服务 API Key 未配置',
          debug: {
            AMAP_WEB_SERVICE_KEY: webServiceKey ? 'SET' : 'MISSING',
            NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY: nextPublicWebServiceKey ? 'SET' : 'MISSING'
          }
        },
        { status: 500 }
      );
    }

    // 2. 解析请求URL
    const { searchParams, pathname } = new URL(request.url);
    console.log("Original request URL:", request.url);
    console.log("Pathname:", pathname);
    
    // 3. 提取高德地图API路径
    const amapPath = pathname.replace('/api/amap/debug-detailed', '');
    console.log("Extracted AMap path:", amapPath || '(empty - using default)');
    
    // 4. 构建目标URL
    const baseUrl = 'https://restapi.amap.com';
    const finalPath = amapPath || '/v3/assistant/inputtips'; // 默认路径
    const targetUrl = new URL(finalPath, baseUrl);
    console.log("Base target URL constructed:", `${baseUrl}${finalPath}`);
    
    // 5. 设置API密钥
    targetUrl.searchParams.set('key', effectiveKey);
    console.log("Set API key in target URL");
    
    // 6. 复制其他查询参数（除了key）
    console.log("Processing query parameters:");
    searchParams.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
      if (key !== 'key') {
        targetUrl.searchParams.set(key, value);
        console.log(`    Added to target URL`);
      } else {
        console.log(`    Skipped (would conflict with API key)`);
      }
    });
    
    console.log("Final target URL:", targetUrl.toString());
    
    // 7. 发送请求到高德地图API
    console.log("Sending request to AMap API...");
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("AMap API response status:", response.status);
    console.log("AMap API response headers:", [...response.headers.entries()]);
    
    if (!response.ok) {
      console.error(`❌ HTTP error! status: ${response.status}`);
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      
      return NextResponse.json(
        {
          success: false,
          error: `HTTP error! status: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("AMap API response data received");
    console.log("Response data keys:", Object.keys(data));
    console.log("Status:", data.status);
    console.log("Info:", data.info);
    console.log("Infocode:", data.infocode);
    
    // 返回结果
    return NextResponse.json({
      success: true,
      debug: {
        originalUrl: request.url,
        pathname: pathname,
        amapPath: amapPath,
        targetUrl: targetUrl.toString(),
        apiKey: effectiveKey ? `${effectiveKey.substring(0, 8)}...` : 'NOT SET'
      },
      data: data
    });

  } catch (error: any) {
    console.error('❌ Detailed debugging - AMap API proxy failed:', error);
    
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