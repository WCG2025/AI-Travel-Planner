import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log("=== Enhanced Debug Route Called ===");
  
  try {
    // 获取请求路径和查询参数
    const { searchParams, pathname } = new URL(request.url);
    console.log("Full URL:", request.url);
    console.log("Pathname:", pathname);
    
    // 解析路径
    const amapPath = pathname.replace('/api/amap/debug', '');
    console.log("AMAP path:", amapPath);
    
    // 获取API密钥
    const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY;
    console.log("API Key from env:", webServiceKey ? `${webServiceKey.substring(0, 8)}...` : '未配置');
    
    if (!webServiceKey) {
      return NextResponse.json({ error: 'API Key not configured' });
    }
    
    // 构建目标URL
    const baseUrl = 'https://restapi.amap.com';
    const targetPath = amapPath || '/v3/assistant/inputtips';
    const targetUrl = new URL(targetPath, baseUrl);
    
    // 添加API密钥
    targetUrl.searchParams.set('key', webServiceKey);
    
    // 复制其他查询参数
    searchParams.forEach((value, key) => {
      if (key !== 'key') {
        targetUrl.searchParams.set(key, value);
      }
    });
    
    console.log("Final target URL:", targetUrl.toString());
    
    // 发送请求
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log("Response status:", response.status);
    
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
    
    return NextResponse.json({
      success: true,
      debugInfo: {
        originalUrl: request.url,
        pathname: pathname,
        amapPath: amapPath,
        targetUrl: targetUrl.toString(),
        apiKey: webServiceKey ? `${webServiceKey.substring(0, 8)}...` : '未配置'
      },
      data: data
    });
    
  } catch (error: any) {
    console.error("Debug route error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}