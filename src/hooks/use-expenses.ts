'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Expense, ExpenseInput, ExpenseStats } from '@/types/expense.types';

export function useExpenses(planId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 获取费用列表
  const fetchExpenses = useCallback(async () => {
    if (!planId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/expenses?planId=${planId}`);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || '获取费用失败');
      }
      
      setExpenses(data.expenses || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [planId]);
  
  // 添加费用
  const addExpense = useCallback(async (input: ExpenseInput): Promise<Expense> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || '添加费用失败');
      }
      
      // 刷新列表
      await fetchExpenses();
      
      return data.expense;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchExpenses]);
  
  // 更新费用
  const updateExpense = useCallback(async (id: string, input: Partial<ExpenseInput>): Promise<Expense> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || '更新费用失败');
      }
      
      // 刷新列表
      await fetchExpenses();
      
      return data.expense;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchExpenses]);
  
  // 删除费用
  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || '删除费用失败');
      }
      
      // 刷新列表
      await fetchExpenses();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchExpenses]);
  
  // 自动加载
  useEffect(() => {
    if (planId) {
      fetchExpenses();
    }
  }, [planId, fetchExpenses]);
  
  return {
    expenses,
    stats,
    loading,
    error,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}

