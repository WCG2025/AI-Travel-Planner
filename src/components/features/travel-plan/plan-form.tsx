'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VoiceInput } from '@/components/features/voice/voice-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { TravelPlanInput } from '@/types/travel-plan.types';

// 表单验证 Schema
const formSchema = z.object({
  destination: z.string().min(2, '目的地至少需要 2 个字符'),
  startDate: z.date({ required_error: '请选择开始日期' }),
  endDate: z.date({ required_error: '请选择结束日期' }),
  budget: z.number().min(0).optional(),
  travelers: z.number().min(1).max(100).optional(),
  interests: z.array(z.string()).optional(),
  pace: z.enum(['relaxed', 'moderate', 'fast']).optional(),
  specialRequirements: z.string().optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: '结束日期必须晚于或等于开始日期',
  path: ['endDate'],
}).refine((data) => {
  const days = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return days <= 10;
}, {
  message: '行程天数不能超过 10 天（生成时间较长，建议分多个行程规划）',
  path: ['endDate'],
});

type FormValues = z.infer<typeof formSchema>;

interface PlanFormProps {
  onSubmit: (input: TravelPlanInput) => Promise<void>;
  loading?: boolean;
}

export function PlanForm({ onSubmit, loading = false }: PlanFormProps) {
  const [inputMode, setInputMode] = useState<'form' | 'voice'>('form');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: '',
      travelers: 1,
      pace: 'moderate',
      interests: [],
      budget: undefined,
      specialRequirements: '',
    },
  });
  
  // 处理语音输入结果
  const handleVoiceResult = (text: string) => {
    // 将语音内容填充到特殊需求字段
    const currentValue = form.getValues('specialRequirements') || '';
    form.setValue(
      'specialRequirements',
      currentValue ? `${currentValue}\n${text}` : text
    );
  };
  
  // 表单提交
  const handleSubmit = async (values: FormValues) => {
    const input: TravelPlanInput = {
      destination: values.destination,
      startDate: format(values.startDate, 'yyyy-MM-dd'),
      endDate: format(values.endDate, 'yyyy-MM-dd'),
      budget: values.budget,
      travelers: values.travelers,
      preferences: {
        interests: values.interests,
        pace: values.pace,
      },
      specialRequirements: values.specialRequirements,
    };
    
    await onSubmit(input);
  };
  
  // 兴趣标签
  const interestOptions = [
    { value: 'history', label: '历史文化' },
    { value: 'nature', label: '自然风光' },
    { value: 'food', label: '美食' },
    { value: 'shopping', label: '购物' },
    { value: 'photography', label: '摄影' },
    { value: 'adventure', label: '探险' },
    { value: 'relaxation', label: '休闲放松' },
    { value: 'nightlife', label: '夜生活' },
  ];
  
  const toggleInterest = (interest: string) => {
    const current = form.getValues('interests') || [];
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    form.setValue('interests', updated);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          创建 AI 旅行计划
        </CardTitle>
        <CardDescription>
          填写您的旅行需求，AI 将为您生成个性化的详细行程
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">表单输入</TabsTrigger>
            <TabsTrigger value="voice">语音输入</TabsTrigger>
          </TabsList>
          
          <TabsContent value="form" className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* 目的地 */}
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>目的地 *</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：北京、日本东京、巴黎" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 日期 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>开始日期 *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'yyyy-MM-dd')
                                ) : (
                                  <span>选择日期</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>结束日期 *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'yyyy-MM-dd')
                                ) : (
                                  <span>选择日期</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < (form.getValues('startDate') || new Date())}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 行程天数提示 */}
                {form.watch('startDate') && form.watch('endDate') && (
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    📅 行程天数：
                    {Math.ceil(
                      (form.watch('endDate').getTime() - form.watch('startDate').getTime()) / 
                      (1000 * 60 * 60 * 24)
                    ) + 1} 天
                    {Math.ceil(
                      (form.watch('endDate').getTime() - form.watch('startDate').getTime()) / 
                      (1000 * 60 * 60 * 24)
                    ) + 1 > 7 && (
                      <span className="ml-2 text-orange-600">
                        ⚠️ 行程较长，生成时间约 30-60 秒
                      </span>
                    )}
                  </div>
                )}
                
                {/* 预算和人数 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>预算（元）</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="例如：5000"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormDescription>总预算，留空则灵活安排</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="travelers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>同行人数</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 兴趣爱好 */}
                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>兴趣爱好</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {interestOptions.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant={(field.value || []).includes(option.value) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleInterest(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                      <FormDescription>选择您感兴趣的活动类型</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 旅行节奏 */}
                <FormField
                  control={form.control}
                  name="pace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>旅行节奏</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择旅行节奏" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="relaxed">轻松悠闲</SelectItem>
                          <SelectItem value="moderate">适中</SelectItem>
                          <SelectItem value="fast">紧凑高效</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 特殊需求 */}
                <FormField
                  control={form.control}
                  name="specialRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>特殊需求或备注</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="例如：带小孩、需要无障碍设施、素食等"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        您可以切换到"语音输入"标签页使用语音描述需求
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 提交按钮 */}
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      AI 正在生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      生成旅行计划
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="voice" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>使用语音描述您的旅行需求，例如：</p>
                <p className="mt-2 italic">
                  "我想去北京旅游三天，预算五千元，喜欢历史文化和美食"
                </p>
              </div>
              
              <VoiceInput onResult={handleVoiceResult} />
              
              {form.watch('specialRequirements') && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">语音输入内容：</p>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">
                      {form.watch('specialRequirements')}
                    </p>
                  </div>
                </div>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setInputMode('form')}
                className="w-full"
              >
                切换到表单输入
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

