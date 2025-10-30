import { NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/deepseek-client';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/test-deepseek
 * 测试 DeepSeek API 连接
 */
export async function GET() {
  try {
    console.log('🔍 开始测试 DeepSeek API...');
    
    const client = getDeepSeekClient();
    
    console.log('📤 发送测试请求...');
    const startTime = Date.now();
    
    const result = await client.testConnection();
    
    const duration = Date.now() - startTime;
    console.log(`✅ 测试完成，耗时: ${duration}ms`);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'DeepSeek API 连接成功',
        duration: `${duration}ms`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          duration: `${duration}ms`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ DeepSeek API 测试失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '未知错误',
      },
      { status: 500 }
    );
  }
}

