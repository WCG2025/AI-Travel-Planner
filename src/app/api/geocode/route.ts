/**
 * 地理编码 API - 使用高德 Web服务
 * 将地址转换为坐标
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

interface GeocodeRequest {
  address: string;
  city?: string;
}

interface GeocodeResponse {
  success: boolean;
  coordinate?: {
    lng: number;
    lat: number;
  };
  address?: {
    province?: string;
    city?: string;
    district?: string;
    street?: string;
    streetNumber?: string;
    formattedAddress?: string;
  };
  confidence?: number;
  error?: string;
}

/**
 * POST /api/geocode
 * 地理编码：地址 → 坐标
 */
export async function POST(request: NextRequest): Promise<NextResponse<GeocodeResponse>> {
  try {
    const { address, city } = await request.json() as GeocodeRequest;

    // 验证参数
    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少必需参数：address' },
        { status: 400 }
      );
    }

    // 获取 Web服务 API Key
    const webServiceKey = process.env.AMAP_WEB_SERVICE_KEY;
    if (!webServiceKey) {
      console.error('❌ AMAP_WEB_SERVICE_KEY 未配置');
      return NextResponse.json(
        { success: false, error: 'Web服务 API Key 未配置' },
        { status: 500 }
      );
    }

    console.log(`🔍 服务端地理编码: ${address} (城市: ${city || '全国'})`);

    // 构建请求 URL
    const params = new URLSearchParams({
      key: webServiceKey,
      address: address,
    });
    
    if (city) {
      params.append('city', city);
    }

    const url = `https://restapi.amap.com/v3/geocode/geo?${params.toString()}`;

    // 调用高德 Web服务 API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 检查响应状态
    if (data.status !== '1') {
      console.error('❌ 地理编码失败:', data.info);
      return NextResponse.json(
        { success: false, error: `地理编码失败: ${data.info}` },
        { status: 400 }
      );
    }

    // 检查是否有结果
    if (!data.geocodes || data.geocodes.length === 0) {
      console.warn('⚠️ 未找到地理编码结果:', address);
      return NextResponse.json(
        { success: false, error: '未找到地理编码结果' },
        { status: 404 }
      );
    }

    const geocode = data.geocodes[0];
    const location = geocode.location.split(',');

    const result: GeocodeResponse = {
      success: true,
      coordinate: {
        lng: parseFloat(location[0]),
        lat: parseFloat(location[1]),
      },
      address: {
        province: geocode.province,
        city: geocode.city,
        district: geocode.district,
        street: geocode.street,
        streetNumber: geocode.number,
        formattedAddress: geocode.formatted_address,
      },
      confidence: geocode.level === '门牌号' ? 1.0 : geocode.level === '街道' ? 0.9 : 0.8,
    };

    console.log(`✅ 地理编码成功: ${address} → (${result.coordinate.lng}, ${result.coordinate.lat})`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ 地理编码异常:', error);
    return NextResponse.json(
      { success: false, error: error.message || '地理编码失败' },
      { status: 500 }
    );
  }
}

