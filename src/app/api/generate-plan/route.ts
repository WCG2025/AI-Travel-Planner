import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTravelPlan } from '@/lib/ai/plan-generator';
import type { TravelPlanInput, GeneratePlanRequest, GeneratePlanResponse } from '@/types/travel-plan.types';

export const runtime = 'nodejs';
export const maxDuration = 60; // 最大执行时间 60 秒

/**
 * POST /api/generate-plan
 * 生成旅行计划
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📨 收到生成计划请求');
    
    // 验证用户身份
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ 未授权：用户未登录');
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }
    
    console.log('✅ 用户已认证:', user.id);
    
    // 解析请求体
    const body: GeneratePlanRequest = await request.json();
    const { input } = body;
    
    // 验证输入
    if (!input.destination || !input.startDate || !input.endDate) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数：目的地、开始日期、结束日期' },
        { status: 400 }
      );
    }
    
    console.log('📝 输入参数:', input);
    
    // 生成旅行计划
    console.log('🤖 调用 AI 生成计划...');
    const plan = await generateTravelPlan(input);
    
    console.log('✅ 计划生成成功');
    
    // 保存到数据库
    console.log('💾 保存计划到数据库...');
    const { data: savedPlan, error: dbError } = await supabase
      .from('travel_plans')
      .insert({
        user_id: user.id,
        title: plan.title,
        destination: plan.destination,
        start_date: plan.startDate,
        end_date: plan.endDate,
        budget: plan.budget || null,
        preferences: plan.preferences || {},
        itinerary: plan.itinerary || [],
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('❌ 数据库保存失败:', dbError);
      // 即使保存失败，也返回生成的计划
      return NextResponse.json({
        success: true,
        plan,
        warning: '计划生成成功，但保存到数据库失败',
      });
    }
    
    console.log('✅ 计划已保存，ID:', savedPlan.id);
    
    // 返回成功响应
    const response: GeneratePlanResponse = {
      success: true,
      plan: {
        ...plan,
        id: savedPlan.id,
        userId: user.id,
        createdAt: savedPlan.created_at,
        updatedAt: savedPlan.updated_at,
      },
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ 生成计划失败:', error);
    
    // 返回错误响应
    return NextResponse.json(
      {
        success: false,
        error: error.message || '生成计划失败，请稍后重试',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-plan
 * 测试 API 是否可用
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: '旅行计划生成 API 运行正常',
    version: '1.0.0',
  });
}

