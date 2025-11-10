import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log("=== API Debug Route Called ===");
  
  // 获取请求路径和查询参数
  const { searchParams, pathname } = new URL(request.url);
  console.log("Original pathname:", pathname);
  
  const amapPath = pathname.replace('/api/amap/debug2', '');
  console.log("AMAP path:", amapPath);
  
  // 获取 Web服务 API Key
  const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY || process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY;
  console.log("Web service key:", webServiceKey ? `${webServiceKey.substring(0, 8)}...` : '未配置');
  
  // 构建目标 URL
  const targetUrl = new URL(`https://restapi.amap.com${amapPath}`);
  console.log("Base target URL:", targetUrl.toString());
  
  // 添加 API Key
  targetUrl.searchParams.set('key', webServiceKey || '');
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

  const response = {
    debug: true,
    message: "Debug information",
    pathname,
    amapPath,
    targetUrl: targetUrl.toString(),
    webServiceKey: webServiceKey ? `${webServiceKey.substring(0, 8)}...` : '未配置',
    searchParams: paramsObj,
    timestamp: new Date().toISOString()
  };
  
  console.log("Debug response:", response);
  
  return NextResponse.json(response);
}