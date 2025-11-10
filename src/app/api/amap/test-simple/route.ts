import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log("=== Simple Test Route Called ===");
  
  // 直接使用已知有效的API密钥调用高德地图API
  const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY;
  const testUrl = `https://restapi.amap.com/v3/assistant/inputtips?keywords=上海&key=${webServiceKey}`;
  
  try {
    console.log("Calling AMap API directly:", testUrl);
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log("Direct API response:", data);
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error("Direct API call failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}