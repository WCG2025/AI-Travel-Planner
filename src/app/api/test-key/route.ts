import { NextResponse } from 'next/server';

export async function GET() {
  const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY || process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY;
  
  return NextResponse.json({
    AMAP_WEB_SERVICE_KEY: process.env.AMAP_WEB_SERVICE_KEY ? `${process.env.AMAP_WEB_SERVICE_KEY.substring(0, 8)}...` : '未配置',
    NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY: process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY ? `${process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY.substring(0, 8)}...` : '未配置',
    webServiceKey: webServiceKey ? `${webServiceKey.substring(0, 8)}...` : '未配置'
  });
}