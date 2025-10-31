/**
 * API 路由：费用管理
 * GET /api/expenses?planId=xxx - 获取某个计划的所有费用
 * POST /api/expenses - 添加新费用
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ExpenseInput, Expense, ExpenseStats, ExpenseDB, CategoryStat, DateStat } from '@/types/expense.types';
import { EXPENSE_CATEGORIES } from '@/types/expense.types';

export const runtime = 'nodejs';

/**
 * GET /api/expenses?planId=xxx
 * 获取费用列表和统计
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    
    if (!planId) {
      return NextResponse.json(
        { success: false, error: '缺少计划 ID' },
        { status: 400 }
      );
    }
    
    console.log('📨 获取费用列表，计划 ID:', planId);
    
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
    
    // 验证用户是否有权访问此计划
    const { data: plan } = await supabase
      .from('travel_plans')
      .select('id, user_id')
      .eq('id', planId)
      .single();
    
    if (!plan || plan.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '无权访问此计划' },
        { status: 403 }
      );
    }
    
    // 获取费用列表
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('plan_id', planId)
      .order('date', { ascending: false });
    
    if (expensesError) {
      console.error('❌ 获取费用失败:', expensesError);
      return NextResponse.json(
        { success: false, error: '获取费用失败' },
        { status: 500 }
      );
    }
    
    // 转换数据格式
    const expenses: Expense[] = (expensesData as ExpenseDB[]).map(dbExpense => ({
      id: dbExpense.id,
      planId: dbExpense.plan_id,
      category: dbExpense.category as any,
      amount: dbExpense.amount,
      description: dbExpense.description || undefined,
      date: dbExpense.date,
      createdAt: dbExpense.created_at,
    }));
    
    // 计算统计数据
    const stats = calculateStats(expenses);
    
    console.log('✅ 成功获取费用列表，共', expenses.length, '条记录');
    
    return NextResponse.json({
      success: true,
      expenses,
      stats,
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
 * POST /api/expenses
 * 添加新费用
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📨 添加新费用请求');
    
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
    const input: ExpenseInput = await request.json();
    
    // 验证输入
    if (!input.planId || !input.category || !input.amount || !input.date) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数：计划ID、类别、金额、日期' },
        { status: 400 }
      );
    }
    
    if (input.amount <= 0) {
      return NextResponse.json(
        { success: false, error: '金额必须大于 0' },
        { status: 400 }
      );
    }
    
    // 验证用户是否有权访问此计划
    const { data: plan } = await supabase
      .from('travel_plans')
      .select('id, user_id')
      .eq('id', input.planId)
      .single();
    
    if (!plan || plan.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '无权访问此计划' },
        { status: 403 }
      );
    }
    
    console.log('📝 费用信息:', input);
    
    // 插入费用记录
    const { data: expenseData, error: insertError } = await supabase
      .from('expenses')
      .insert({
        plan_id: input.planId,
        category: input.category,
        amount: input.amount,
        description: input.description || null,
        date: input.date,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ 插入费用失败:', insertError);
      return NextResponse.json(
        { success: false, error: '添加费用失败' },
        { status: 500 }
      );
    }
    
    // 转换数据格式
    const dbExpense = expenseData as ExpenseDB;
    const expense: Expense = {
      id: dbExpense.id,
      planId: dbExpense.plan_id,
      category: dbExpense.category as any,
      amount: dbExpense.amount,
      description: dbExpense.description || undefined,
      date: dbExpense.date,
      createdAt: dbExpense.created_at,
    };
    
    console.log('✅ 费用添加成功，ID:', expense.id);
    
    return NextResponse.json({
      success: true,
      expense,
    });
    
  } catch (error: any) {
    console.error('❌ 添加费用失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '添加费用失败' },
      { status: 500 }
    );
  }
}

/**
 * 计算统计数据
 */
function calculateStats(expenses: Expense[]): ExpenseStats {
  if (expenses.length === 0) {
    return {
      total: 0,
      byCategory: [],
      byDate: [],
      count: 0,
      average: 0,
    };
  }
  
  // 总支出
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // 按类别统计
  const categoryMap = new Map<string, { amount: number; count: number }>();
  expenses.forEach(exp => {
    const existing = categoryMap.get(exp.category) || { amount: 0, count: 0 };
    categoryMap.set(exp.category, {
      amount: existing.amount + exp.amount,
      count: existing.count + 1,
    });
  });
  
  const byCategory: CategoryStat[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category: category as any,
    categoryName: EXPENSE_CATEGORIES[category as any]?.label || category,
    amount: data.amount,
    count: data.count,
    percentage: (data.amount / total) * 100,
  })).sort((a, b) => b.amount - a.amount);
  
  // 按日期统计
  const dateMap = new Map<string, { amount: number; count: number }>();
  expenses.forEach(exp => {
    const existing = dateMap.get(exp.date) || { amount: 0, count: 0 };
    dateMap.set(exp.date, {
      amount: existing.amount + exp.amount,
      count: existing.count + 1,
    });
  });
  
  const byDate: DateStat[] = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // 平均消费
  const average = total / expenses.length;
  
  return {
    total,
    byCategory,
    byDate,
    count: expenses.length,
    average,
  };
}

