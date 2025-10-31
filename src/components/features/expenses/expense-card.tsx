'use client';

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Trash2, Edit, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Expense } from '@/types/expense.types';
import { EXPENSE_CATEGORIES } from '@/types/expense.types';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const categoryInfo = EXPENSE_CATEGORIES[expense.category];
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(expense);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm('确定要删除这条费用记录吗？')) {
      onDelete(expense);
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* 图标 */}
            <div className="text-2xl mt-0.5">
              {categoryInfo?.icon || '📝'}
            </div>
            
            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {categoryInfo?.label || expense.category}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(expense.date), 'MM月dd日', { locale: zhCN })}
                </span>
              </div>
              
              {expense.description && (
                <p className="text-sm text-foreground line-clamp-2 mb-1">
                  {expense.description}
                </p>
              )}
              
              <div className="text-lg font-bold text-foreground">
                ¥{expense.amount.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-1 ml-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

