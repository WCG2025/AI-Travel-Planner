'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExpenseStats } from '@/types/expense.types';
import { EXPENSE_CATEGORIES } from '@/types/expense.types';

interface ExpenseChartProps {
  stats: ExpenseStats | null;
}

export function ExpenseCategoryChart({ stats }: ExpenseChartProps) {
  if (!stats || stats.byCategory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">分类统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            暂无数据
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const data = stats.byCategory.map(cat => ({
    name: cat.categoryName,
    value: cat.amount,
    count: cat.count,
    color: EXPENSE_CATEGORIES[cat.category]?.color || '#6b7280',
  }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">分类统计</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `¥${value.toLocaleString()}`}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* 图例 */}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{item.count}笔</span>
                <span className="font-medium">¥{item.value.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExpenseTrendChart({ stats }: ExpenseChartProps) {
  if (!stats || stats.byDate.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">每日趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            暂无数据
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const data = stats.byDate.map(d => ({
    date: d.date.substring(5), // MM-DD
    amount: d.amount,
    count: d.count,
  }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">每日趋势</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `¥${value.toLocaleString()}`}
            />
            <Bar dataKey="amount" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

