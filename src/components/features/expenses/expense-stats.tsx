'use client';

import { DollarSign, TrendingUp, Receipt, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ExpenseStats, BudgetComparison } from '@/types/expense.types';

interface ExpenseStatsProps {
  stats: ExpenseStats | null;
  budgetComparison?: BudgetComparison | null;
}

export function ExpenseStatsCards({ stats, budgetComparison }: ExpenseStatsProps) {
  if (!stats) return null;
  
  return (
    <div className="space-y-4">
      {/* 统计卡片行 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 总支出 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总支出</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{stats.total.toLocaleString()}
            </div>
            {budgetComparison && (
              <p className="text-xs text-muted-foreground mt-1">
                预算 ¥{budgetComparison.budget.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* 剩余预算 */}
        {budgetComparison && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">剩余预算</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                budgetComparison.status === 'exceeded' 
                  ? 'text-destructive' 
                  : budgetComparison.status === 'warning'
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                ¥{budgetComparison.remaining.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                已使用 {budgetComparison.percentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* 记录数量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">记录数</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              平均 ¥{stats.average.toFixed(0)}/笔
            </p>
          </CardContent>
        </Card>
        
        {/* 分类数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">消费分类</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byCategory.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.byCategory[0]?.categoryName} 最多
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* 预算进度条 */}
      {budgetComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">预算使用情况</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress 
              value={Math.min(budgetComparison.percentage, 100)} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>¥{stats.total.toLocaleString()} / ¥{budgetComparison.budget.toLocaleString()}</span>
              <span>{budgetComparison.percentage.toFixed(1)}%</span>
            </div>
            
            {/* 预算警告 */}
            {budgetComparison.status === 'exceeded' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  已超出预算 ¥{Math.abs(budgetComparison.remaining).toLocaleString()}
                </AlertDescription>
              </Alert>
            )}
            
            {budgetComparison.status === 'warning' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  预算即将用完，还剩 ¥{budgetComparison.remaining.toLocaleString()}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

