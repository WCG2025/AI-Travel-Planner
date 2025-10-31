'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseCard } from './expense-card';
import { ExpenseForm } from './expense-form';
import { ExpenseStatsCards } from './expense-stats';
import { ExpenseCategoryChart, ExpenseTrendChart } from './expense-chart';
import { useExpenses } from '@/hooks/use-expenses';
import { useExpenseStats } from '@/hooks/use-expense-stats';
import { useToast } from '@/hooks/use-toast';
import type { Expense, ExpenseInput, Budget } from '@/types/expense.types';

interface ExpenseListProps {
  planId: string;
  budget?: Budget;
}

export function ExpenseList({ planId, budget }: ExpenseListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const { expenses, stats, loading, error, addExpense, updateExpense, deleteExpense } = useExpenses(planId);
  const { budgetComparison } = useExpenseStats(expenses, budget);
  const { toast } = useToast();
  
  const handleAdd = async (input: ExpenseInput) => {
    try {
      await addExpense(input);
      toast({
        title: '✅ 添加成功',
        description: '费用记录已保存',
      });
      setShowAddDialog(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ 添加失败',
        description: error.message,
      });
    }
  };
  
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };
  
  const handleUpdate = async (input: ExpenseInput) => {
    if (!editingExpense?.id) return;
    
    try {
      await updateExpense(editingExpense.id, input);
      toast({
        title: '✅ 更新成功',
        description: '费用记录已更新',
      });
      setEditingExpense(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ 更新失败',
        description: error.message,
      });
    }
  };
  
  const handleDelete = async (expense: Expense) => {
    if (!expense.id) return;
    
    try {
      await deleteExpense(expense.id);
      toast({
        title: '✅ 删除成功',
        description: '费用记录已删除',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ 删除失败',
        description: error.message,
      });
    }
  };
  
  if (loading && expenses.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {error}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">费用管理</h3>
          <p className="text-sm text-muted-foreground">记录和分析旅行花费</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加费用
        </Button>
      </div>
      
      {/* 统计卡片 */}
      <ExpenseStatsCards stats={stats} budgetComparison={budgetComparison} />
      
      {/* 图表 */}
      {stats && stats.count > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <ExpenseCategoryChart stats={stats} />
          <ExpenseTrendChart stats={stats} />
        </div>
      )}
      
      {/* 费用列表 */}
      <div>
        <h4 className="text-sm font-medium mb-3">费用记录</h4>
        
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <div className="text-center space-y-3">
              <div className="text-4xl">💰</div>
              <h3 className="text-lg font-medium">还没有费用记录</h3>
              <p className="text-sm text-muted-foreground">开始记录您的旅行花费吧</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                添加第一笔费用
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 添加费用对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加费用</DialogTitle>
            <DialogDescription>
              可以手动输入或使用语音记账
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            planId={planId}
            onSubmit={handleAdd}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
      
      {/* 编辑费用对话框 */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑费用</DialogTitle>
            <DialogDescription>
              修改费用记录信息
            </DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              planId={planId}
              onSubmit={handleUpdate}
              loading={loading}
              initialValues={editingExpense}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

