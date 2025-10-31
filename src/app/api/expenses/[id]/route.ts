/**
 * API 路由：单个费用操作
 * GET /api/expenses/[id] - 获取单个费用
 * PUT /api/expenses/[id] - 更新费用
 * DELETE /api/expenses/[id] - 删除费用
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ExpenseInput, Expense, ExpenseDB } from '@/types/expense.types';

export const runtime = 'nodejs';

/**
 * GET /api/expenses/[id]
 * 获取单个费用
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('📨 获取费用详情，ID:', id);
    
    // 验证用户身份
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }
    
    // 获取费用
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select(`
        *,
        travel_plans!inner(user_id)
      `)
      .eq('id', id)
      .single();
    
    if (expenseError) {
      console.error('❌ 获取费用失败:', expenseError);
      return NextResponse.json(
        { success: false, error: '费用不存在' },
        { status: 404 }
      );
    }
    
    // 验证权限
    if ((expenseData as any).travel_plans.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '无权访问此费用' },
        { status: 403 }
      );
    }
    
    // 转换数据格式
    const dbExpense = expenseData as any as ExpenseDB;
    const expense: Expense = {
      id: dbExpense.id,
      planId: dbExpense.plan_id,
      category: dbExpense.category as any,
      amount: dbExpense.amount,
      description: dbExpense.description || undefined,
      date: dbExpense.date,
      createdAt: dbExpense.created_at,
    };
    
    console.log('✅ 成功获取费用详情');
    
    return NextResponse.json({
      success: true,
      expense,
    });
    
  } catch (error: any) {
    console.error('❌ 获取费用失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取费用失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/expenses/[id]
 * 更新费用
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('📨 更新费用请求，ID:', id);
    
    // 验证用户身份
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }
    
    // 解析请求体
    const input: Partial<ExpenseInput> = await request.json();
    
    // 验证金额
    if (input.amount !== undefined && input.amount <= 0) {
      return NextResponse.json(
        { success: false, error: '金额必须大于 0' },
        { status: 400 }
      );
    }
    
    // 获取现有费用并验证权限
    const { data: existingData, error: fetchError } = await supabase
      .from('expenses')
      .select(`
        *,
        travel_plans!inner(user_id)
      `)
      .eq('id', id)
      .single();
    
    if (fetchError || !existingData) {
      return NextResponse.json(
        { success: false, error: '费用不存在' },
        { status: 404 }
      );
    }
    
    if ((existingData as any).travel_plans.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '无权修改此费用' },
        { status: 403 }
      );
    }
    
    // 构建更新数据
    const updateData: any = {};
    if (input.category !== undefined) updateData.category = input.category;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.description !== undefined) updateData.description = input.description || null;
    if (input.date !== undefined) updateData.date = input.date;
    
    console.log('📝 更新数据:', updateData);
    
    // 更新费用
    const { data: updatedData, error: updateError } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ 更新费用失败:', updateError);
      return NextResponse.json(
        { success: false, error: '更新费用失败' },
        { status: 500 }
      );
    }
    
    // 转换数据格式
    const dbExpense = updatedData as ExpenseDB;
    const expense: Expense = {
      id: dbExpense.id,
      planId: dbExpense.plan_id,
      category: dbExpense.category as any,
      amount: dbExpense.amount,
      description: dbExpense.description || undefined,
      date: dbExpense.date,
      createdAt: dbExpense.created_at,
    };
    
    console.log('✅ 费用更新成功');
    
    return NextResponse.json({
      success: true,
      expense,
    });
    
  } catch (error: any) {
    console.error('❌ 更新费用失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '更新费用失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expenses/[id]
 * 删除费用
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('📨 删除费用请求，ID:', id);
    
    // 验证用户身份
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }
    
    // 获取费用并验证权限
    const { data: existingData, error: fetchError } = await supabase
      .from('expenses')
      .select(`
        id,
        travel_plans!inner(user_id)
      `)
      .eq('id', id)
      .single();
    
    if (fetchError || !existingData) {
      return NextResponse.json(
        { success: false, error: '费用不存在' },
        { status: 404 }
      );
    }
    
    if ((existingData as any).travel_plans.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '无权删除此费用' },
        { status: 403 }
      );
    }
    
    // 删除费用
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('❌ 删除费用失败:', deleteError);
      return NextResponse.json(
        { success: false, error: '删除费用失败' },
        { status: 500 }
      );
    }
    
    console.log('✅ 费用删除成功');
    
    return NextResponse.json({
      success: true,
    });
    
  } catch (error: any) {
    console.error('❌ 删除费用失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '删除费用失败' },
      { status: 500 }
    );
  }
}

