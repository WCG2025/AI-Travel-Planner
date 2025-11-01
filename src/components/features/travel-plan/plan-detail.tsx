'use client';

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, DollarSign, MapPin, Clock, AlertCircle, Lightbulb, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseList } from '@/components/features/expenses/expense-list';
import { ItineraryMap } from '@/components/features/map/itinerary-map';
import type { TravelPlan, Activity } from '@/types/travel-plan.types';

interface PlanDetailProps {
  plan: TravelPlan;
}

export function PlanDetail({ plan }: PlanDetailProps) {
  // 活动类型图标和标签映射
  const activityTypeMap: Record<string, { label: string; icon: string }> = {
    attraction: { label: '景点', icon: '🏛️' },
    meal: { label: '用餐', icon: '🍽️' },
    transportation: { label: '交通', icon: '🚗' },
    accommodation: { label: '住宿', icon: '🏨' },
    shopping: { label: '购物', icon: '🛍️' },
    entertainment: { label: '娱乐', icon: '🎭' },
    other: { label: '其他', icon: '📝' },
  };
  
  return (
    <Tabs defaultValue="itinerary" className="space-y-6">
      {/* 标题和基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{plan.title}</CardTitle>
          <CardDescription className="flex items-center gap-4 text-base mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {plan.destination}
            </span>
            {plan.startDate && plan.endDate ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(plan.startDate), 'yyyy年MM月dd日', { locale: zhCN })} -{' '}
                {format(new Date(plan.endDate), 'yyyy年MM月dd日', { locale: zhCN })}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                相对日期行程
              </span>
            )}
            <Badge variant="secondary">{plan.days}天</Badge>
          </CardDescription>
        </CardHeader>
        
        {plan.budget && (
          <CardContent>
            <div className="flex items-center gap-2 text-lg font-medium">
              <DollarSign className="h-5 w-5" />
              总预算：¥{plan.budget.toLocaleString()}
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* 标签页导航 */}
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="itinerary">行程安排</TabsTrigger>
        <TabsTrigger value="map">地图导航</TabsTrigger>
        <TabsTrigger value="expenses">费用管理</TabsTrigger>
      </TabsList>
      
      {/* 行程安排标签页 */}
      <TabsContent value="itinerary" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>详细行程</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {plan.itinerary.map((day) => (
              <AccordionItem key={day.day} value={`day-${day.day}`}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3 text-left">
                    <Badge>第{day.day}天</Badge>
                    <span className="font-medium">{day.title}</span>
                    {day.date && !day.date.startsWith('第') ? (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(day.date), 'MM月dd日', { locale: zhCN })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {day.date || `第${day.day}天`}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {day.activities.map((activity, index) => (
                      <ActivityCard key={index} activity={activity} typeMap={activityTypeMap} />
                    ))}
                    
                    {day.estimatedCost && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 pt-4 border-t">
                        <DollarSign className="h-4 w-4" />
                        当天预计费用：¥{day.estimatedCost}
                      </div>
                    )}
                    
                    {day.notes && (
                      <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
                        💡 {day.notes}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      
      {/* 总结和建议 */}
      {plan.summary && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* 行程亮点 */}
          {plan.summary.highlights && plan.summary.highlights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  行程亮点
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.summary.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">✨</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* 旅行建议 */}
          {plan.summary.tips && plan.summary.tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  旅行建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.summary.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">💡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* 注意事项 */}
          {plan.summary.warnings && plan.summary.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  注意事项
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.summary.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-destructive mt-1">⚠️</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* 行李清单 */}
          {plan.summary.packingList && plan.summary.packingList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  行李清单
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.summary.packingList.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="mt-1">📦</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      </TabsContent>
      
      {/* 地图导航标签页 */}
      <TabsContent value="map">
        <Card>
          <CardHeader>
            <CardTitle>地图导航</CardTitle>
            <CardDescription>
              在地图上查看行程中的所有景点和路线
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ItineraryMap 
              plan={plan}
              apiKey={process.env.NEXT_PUBLIC_AMAP_KEY || ''}
              className="h-[600px]"
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* 费用管理标签页 */}
      <TabsContent value="expenses">
        <ExpenseList 
          planId={plan.id} 
          budget={plan.budget ? { total: plan.budget } : undefined}
        />
      </TabsContent>
    </Tabs>
  );
}

// 活动卡片组件
function ActivityCard({
  activity,
  typeMap,
}: {
  activity: Activity;
  typeMap: Record<string, { label: string; icon: string }>;
}) {
  const typeInfo = typeMap[activity.type] || typeMap.other;
  
  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-card">
      <div className="flex flex-col items-center gap-1 min-w-[60px]">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{activity.time}</span>
        {activity.endTime && (
          <span className="text-xs text-muted-foreground">至 {activity.endTime}</span>
        )}
      </div>
      
      <Separator orientation="vertical" />
      
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{typeInfo.icon}</span>
              <h4 className="font-medium">{activity.title}</h4>
              <Badge variant="outline" className="text-xs">
                {typeInfo.label}
              </Badge>
            </div>
            
            {activity.location && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {activity.location}
              </p>
            )}
          </div>
          
          {activity.cost && (
            <span className="text-sm font-medium text-primary">
              ¥{activity.cost}
            </span>
          )}
        </div>
        
        <p className="text-sm">{activity.description}</p>
        
        {activity.tips && activity.tips.length > 0 && (
          <div className="text-xs text-muted-foreground space-y-1">
            {activity.tips.map((tip, index) => (
              <p key={index}>💡 {tip}</p>
            ))}
          </div>
        )}
        
        {activity.bookingInfo && (
          <p className="text-xs text-muted-foreground">
            📌 预订信息：{activity.bookingInfo}
          </p>
        )}
      </div>
    </div>
  );
}

