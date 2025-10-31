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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { TravelPlanInput } from '@/types/travel-plan.types';
import type { ParsedTravelRequest } from '@/lib/ai/parse-travel-request';

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
  return days <= 7;
}, {
  message: '行程天数不能超过 7 天（AI 生成长行程时容易出错，建议分多个行程规划）',
  path: ['endDate'],
});

type FormValues = z.infer<typeof formSchema>;

interface PlanFormProps {
  onSubmit: (input: TravelPlanInput) => Promise<void>;
  loading?: boolean;
}

export function PlanForm({ onSubmit, loading = false }: PlanFormProps) {
  const [inputMode, setInputMode] = useState<'form' | 'voice'>('form');
  const [voiceText, setVoiceText] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  
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
    setVoiceText(text);
    setParseError(null);
  };
  
  // 直接从语音生成计划
  const handleVoiceSubmit = async () => {
    if (!voiceText.trim()) {
      setParseError('请先使用语音输入描述您的旅行需求');
      return;
    }
    
    setParsing(true);
    setParseError(null);
    
    try {
      console.log('🎤 开始解析语音需求...');
      
      // 调用 API 解析语音
      const response = await fetch('/api/parse-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: voiceText }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || '解析失败');
      }
      
      const parsed: ParsedTravelRequest = result.data;
      console.log('📊 解析结果:', parsed);
      
      // 检查是否有必需字段
      if (parsed.missingFields && parsed.missingFields.length > 0) {
        setParseError(
          `从您的描述中无法识别出${parsed.missingFields.join('、')}。` +
          `请补充描述，或切换到表单输入模式。`
        );
        setParsing(false);
        return;
      }
      
      // 构建输入（日期可选）
      const input: TravelPlanInput = {
        destination: parsed.destination!,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        days: parsed.days,
        budget: parsed.budget,
        travelers: parsed.travelers,
        preferences: {
          interests: parsed.interests,
          pace: parsed.pace,
        },
        specialRequirements: parsed.specialRequirements,
      };
      
      console.log('✅ 准备提交:', input);
      
      await onSubmit(input);
    } catch (error: any) {
      console.error('❌ 语音生成失败:', error);
      setParseError(error.message || '语音解析失败，请重试或使用表单输入');
    } finally {
      setParsing(false);
    }
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
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">💡 语音输入提示：</p>
                    <p className="text-sm">请清晰描述您的旅行需求，包括：</p>
                    <ul className="text-sm list-disc list-inside ml-2 space-y-1">
                      <li><strong>目的地</strong>（必需）：例如"北京"</li>
                      <li><strong>时长</strong>（必需）：例如"三天"或"2天"</li>
                      <li><strong>预算</strong>（可选）：例如"预算五千元"</li>
                      <li><strong>兴趣</strong>（可选）：例如"喜欢历史文化和美食"</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      示例："我想去北京旅游三天，预算五千元，喜欢历史文化和美食"
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
              
              <VoiceInput onResult={handleVoiceResult} />
              
              {voiceText && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">📝 语音输入内容：</p>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-sm whitespace-pre-wrap">
                      {voiceText}
                    </p>
                  </div>
                </div>
              )}
              
              {parseError && (
                <Alert variant="destructive">
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="flex-1"
                  onClick={handleVoiceSubmit}
                  disabled={!voiceText || loading || parsing}
                >
                  {parsing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      AI 正在解析...
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      正在生成计划...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      创建旅行计划
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // 将语音内容填充到表单的特殊需求
                    if (voiceText) {
                      form.setValue('specialRequirements', voiceText);
                    }
                    setInputMode('form');
                  }}
                  disabled={loading || parsing}
                >
                  表单输入
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                点击"创建旅行计划"将直接使用语音内容生成，或切换到"表单输入"手动填写
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

