'use client';

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, DollarSign, MapPin, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TravelPlan } from '@/types/travel-plan.types';

interface PlanCardProps {
  plan: TravelPlan;
  onView?: (plan: TravelPlan) => void;
  onDelete?: (planId: string) => void;
}

export function PlanCard({ plan, onView, onDelete }: PlanCardProps) {
  const handleView = () => {
    if (onView) {
      onView(plan);
    }
  };
  
  const handleDelete = () => {
    if (onDelete && plan.id) {
      if (confirm('确定要删除这个旅行计划吗？')) {
        onDelete(plan.id);
      }
    }
  };
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleView}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{plan.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {plan.destination}
            </CardDescription>
          </div>
          <Badge variant="secondary">{plan.days}天</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {plan.startDate && plan.endDate ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(plan.startDate), 'MM月dd日', { locale: zhCN })} -{' '}
              {format(new Date(plan.endDate), 'MM月dd日', { locale: zhCN })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>相对日期 • {plan.days}天行程</span>
          </div>
        )}
        
        {plan.budget && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>预算：¥{plan.budget.toLocaleString()}</span>
          </div>
        )}
        
        {plan.summary?.highlights && plan.summary.highlights.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {plan.summary.highlights[0]}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            handleView();
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          查看详情
        </Button>
        {onDelete && plan.id && (
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

