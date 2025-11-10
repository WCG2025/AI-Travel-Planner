import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("=== DETAILED Step-by-Step Debug AMap API Proxy Route ===");
  
  // 步骤1: 检查环境变量
  console.log("Step 1: Checking environment variables...");
  const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY;
  const nextPublicWebServiceKey = process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY;
  
  console.log('- AMAP_WEB_SERVICE_KEY:', webServiceKey ? `${webServiceKey.substring(0, 8)}...` : 'NOT SET');
  console.log('- NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY:', nextPublicWebServiceKey ? `${nextPublicWebServiceKey.substring(0, 8)}...` : 'NOT SET');
  
  const effectiveKey = webServiceKey || nextPublicWebServiceKey;
  
  if (!effectiveKey) {
    console.error('❌ No API Key found in environment variables');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Web服务 API Key 未配置',
        step: 1,
        debug: {
          AMAP_WEB_SERVICE_KEY: webServiceKey ? 'SET' : 'MISSING',
          NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY: nextPublicWebServiceKey ? 'SET' : 'MISSING'
        }
      },
      { status: 500 }
    );
  }
  
  console.log('✅ Step 1: API Key found');
  
  // 步骤2: 解析请求
  console.log("Step 2: Parsing request...");
  const { searchParams, pathname } = new URL(request.url);
  console.log("- Original URL:", request.url);
  console.log("- Pathname:", pathname);
  
  const amapPath = pathname.replace('/api/amap/debug-detailed-step', '');
  console.log("- AMap path:", amapPath || '(empty)');
  
  console.log('✅ Step 2: Request parsed');
  
  // 步骤3: 构建目标URL
  console.log("Step 3: Building target URL...");
  const baseUrl = 'https://restapi.amap.com';
  const finalPath = amapPath || '/v3/assistant/inputtips';
  const targetUrl = new URL(finalPath, baseUrl);
  console.log("- Base URL:", baseUrl);
  console.log("- Final path:", finalPath);
  console.log("- Target URL (before key):", targetUrl.toString());
  
  console.log('✅ Step 3: Target URL built');
  
  // 步骤4: 添加API密钥
  console.log("Step 4: Adding API key...");
  targetUrl.searchParams.set('key', effectiveKey);
  console.log("- Target URL (after key):", targetUrl.toString());
  
  console.log('✅ Step 4: API key added');
  
  // 步骤5: 复制查询参数
  console.log("Step 5: Copying query parameters...");
  console.log("- Original search params:");
  const paramsObj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    paramsObj[key] = value;
    console.log(`  ${key}: ${value}`);
  });
  
  searchParams.forEach((value, key) => {
    if (key !== 'key') {
      targetUrl.searchParams.set(key, value);
      console.log(`- Added param ${key}=${value} to target URL`);
    } else {
      console.log(`- Skipped param ${key} to avoid conflict with API key`);
    }
  });
  
  console.log("- Final target URL:", targetUrl.toString());
  console.log('✅ Step 5: Query parameters copied');
  
  // 步骤6: 发送请求
  console.log("Step 6: Sending request to AMap API...");
  console.log("- Request URL:", targetUrl.toString());
  console.log("- Request headers:", {
    'Content-Type': 'application/json',
  });
  
  try {
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log("- AMap API response status:", response.status);
    console.log("- AMap API response headers:", [...response.headers.entries()]);
    
    if (!response.ok) {
      console.error(`❌ HTTP error! status: ${response.status}`);
      const errorText = await response.text();
      console.error("- Error response body:", errorText);
      
      return NextResponse.json(
        {
          success: false,
          error: `HTTP error! status: ${response.status}`,
          step: 6,
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
    console.log("- AMap API response data received");
    console.log("- Response data keys:", Object.keys(data));
    console.log("- Status:", data.status);
    console.log("- Info:", data.info);
    console.log("- Infocode:", data.infocode);
    
    console.log('✅ Step 6: Request successful');
    
    // 返回结果
    return NextResponse.json({
      success: true,
      step: 6,
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
    console.error('❌ Step 6 - AMap API request failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || '代理请求失败，请重试',
        step: 6,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}