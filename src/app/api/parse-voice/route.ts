/**
 * API 路由：解析语音输入的旅行需求
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseTravelRequest } from '@/lib/ai/parse-travel-request';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30秒超时

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '请提供有效的文本内容' },
        { status: 400 }
      );
    }
    
    console.log('🎤 收到语音解析请求，文本长度:', text.length);
    
    // 调用解析函数
    const result = await parseTravelRequest(text);
    
    console.log('✅ 解析完成，置信度:', result.confidence);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
    
  } catch (error: any) {
    console.error('❌ 语音解析失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || '解析失败，请重试',
      },
      { status: 500 }
    );
  }
}

