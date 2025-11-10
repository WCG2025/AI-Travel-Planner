import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("=== AMap API Key Test Route ===");
  
  // 获取所有相关的环境变量
  const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY;
  const nextPublicWebServiceKey = process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY;
  const nextPublicAmapKey = process.env.NEXT_PUBLIC_AMAP_KEY;
  
  console.log('Environment variables:');
  console.log('- AMAP_WEB_SERVICE_KEY:', webServiceKey ? `${webServiceKey.substring(0, 8)}...` : 'NOT SET');
  console.log('- NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY:', nextPublicWebServiceKey ? `${nextPublicWebServiceKey.substring(0, 8)}...` : 'NOT SET');
  console.log('- NEXT_PUBLIC_AMAP_KEY:', nextPublicAmapKey ? `${nextPublicAmapKey.substring(0, 8)}...` : 'NOT SET');
  
  // 确定使用的密钥
  const effectiveKey = webServiceKey || nextPublicWebServiceKey || nextPublicAmapKey;
  
  if (!effectiveKey) {
    console.error('❌ No API Key found in environment variables');
    return NextResponse.json(
      { 
        success: false, 
        error: 'API Key 未配置',
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
  
  // 构建测试URL
  const testUrl = new URL('https://restapi.amap.com/v3/assistant/inputtips');
  testUrl.searchParams.set('key', effectiveKey);
  testUrl.searchParams.set('keywords', '上海');
  
  console.log("Test URL:", testUrl.toString());
  
  try {
    // 发送测试请求
    const response = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log("AMap API response status:", response.status);
    console.log("AMap API response headers:", [...response.headers.entries()]);
    
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
            testUrl: testUrl.toString(),
            responseStatus: response.status,
            responseBody: errorText
          }
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log("✅ AMap API response data received");
    console.log("- Status:", data.status);
    console.log("- Info:", data.info);
    console.log("- Infocode:", data.infocode);
    
    // 返回结果
    return NextResponse.json({
      success: true,
      debug: {
        webServiceKey: webServiceKey ? `${webServiceKey.substring(0, 8)}...` : 'NOT SET',
        nextPublicWebServiceKey: nextPublicWebServiceKey ? `${nextPublicWebServiceKey.substring(0, 8)}...` : 'NOT SET',
        nextPublicAmapKey: nextPublicAmapKey ? `${nextPublicAmapKey.substring(0, 8)}...` : 'NOT SET',
        effectiveKey: effectiveKey ? `${effectiveKey.substring(0, 8)}...` : 'NOT SET',
        testUrl: testUrl.toString()
      },
      data: data
    });
    
  } catch (error: any) {
    console.error('❌ AMap API request failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || '测试请求失败，请重试',
        stack: error.stack
      },
      { status: 500 }
    );
  }
}