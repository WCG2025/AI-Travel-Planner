/**
 * API 路由：解析语音输入的费用信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseExpenseFromText } from '@/lib/ai/expense-parser';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30秒超时

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: '请提供有效的文本内容' },
        { status: 400 }
      );
    }
    
    console.log('🎤 收到费用解析请求，文本长度:', text.length);
    
    // 调用解析函数
    const result = await parseExpenseFromText(text);
    
    console.log('✅ 解析完成，置信度:', result.confidence);
    
    return NextResponse.json({
      success: true,
      parsed: result,
    });
    
  } catch (error: any) {
    console.error('❌ 费用解析失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || '解析失败，请重试',
      },
      { status: 500 }
    );
  }
}

