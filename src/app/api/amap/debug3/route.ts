import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log("=== Enhanced Debug Route Called ===");
  
  // 获取请求路径和查询参数
  const { searchParams, pathname } = new URL(request.url);
  console.log("Original pathname:", pathname);
  console.log("Full URL:", request.url);
  
  const amapPath = pathname.replace('/api/amap/debug3', '');
  console.log("AMAP path:", amapPath);
  
  // 获取 Web服务 API Key
  const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY || process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY;
  console.log("Web service key from env:", webServiceKey ? `${webServiceKey.substring(0, 8)}...` : '未配置');
  
  // 构建目标 URL
  const targetUrl = new URL(`https://restapi.amap.com${amapPath}`);
  console.log("Base target URL:", targetUrl.toString());
  
  // 添加 API Key
  if (webServiceKey) {
    targetUrl.searchParams.set('key', webServiceKey);
    console.log("Added key to target URL");
  }
  
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
  
  // 执行实际请求以测试
  try {
    console.log("Making actual request to:", targetUrl.toString());
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log("Actual response status:", response.status);
    const data = await response.json();
    console.log("Actual response data:", JSON.stringify(data, null, 2));
    
    const debugInfo = {
      debug: true,
      message: "Enhanced debug information",
      originalUrl: request.url,
      pathname,
      amapPath,
      targetUrl: targetUrl.toString(),
      webServiceKey: webServiceKey ? `${webServiceKey.substring(0, 8)}...` : '未配置',
      searchParams: paramsObj,
      actualResponse: {
        status: response.status,
        data
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(debugInfo);
  } catch (error: any) {
    console.error("Error in debug route:", error);
    return NextResponse.json({
      debug: true,
      error: error.message,
      stack: error.stack
    });
  }
}