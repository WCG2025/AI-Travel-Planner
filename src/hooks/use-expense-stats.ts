import { useMemo } from 'react';
import type { Expense, ExpenseStats, Budget, BudgetComparison } from '@/types/expense.types';
import { EXPENSE_CATEGORIES } from '@/types/expense.types';

/**
 * 计算费用统计数据
 */
export function useExpenseStats(expenses: Expense[], budget?: Budget): {
  stats: ExpenseStats | null;
  budgetComparison: BudgetComparison | null;
} {
  const stats = useMemo(() => {
    if (expenses.length === 0) {
      return null;
    }
    
    // 总计
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = expenses.length;
    
    // 按类别统计
    const categoryMap = new Map<string, { amount: number; count: number }>();
    expenses.forEach(exp => {
      const existing = categoryMap.get(exp.category) || { amount: 0, count: 0 };
      categoryMap.set(exp.category, {
        amount: existing.amount + exp.amount,
        count: existing.count + 1,
      });
    });
    
    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category: category as any,
      categoryName: EXPENSE_CATEGORIES[category]?.label || category,
      amount: data.amount,
      count: data.count,
      percentage: (data.amount / total) * 100,
    }));
    
    // 按日期统计
    const dateMap = new Map<string, { amount: number; count: number }>();
    expenses.forEach(exp => {
      const existing = dateMap.get(exp.date) || { amount: 0, count: 0 };
      dateMap.set(exp.date, {
        amount: existing.amount + exp.amount,
        count: existing.count + 1,
      });
    });
    
    const byDate = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // 平均消费
    const average = count > 0 ? total / count : 0;
    
    return {
      total,
      count,
      byCategory,
      byDate,
      average,
    };
  }, [expenses]);
  
  const budgetComparison = useMemo(() => {
    if (!budget || !stats) {
      return null;
    }
    
    const remaining = budget.total - stats.total;
    const percentage = (stats.total / budget.total) * 100;
    
    let status: 'safe' | 'warning' | 'exceeded';
    if (percentage >= 100) {
      status = 'exceeded';
    } else if (percentage >= 80) {
      status = 'warning';
    } else {
      status = 'safe';
    }
    
    return {
      budget: budget.total,
      actual: stats.total,
      remaining,
      percentage,
      status,
    };
  }, [budget, stats]);
  
  return { stats, budgetComparison };
}
