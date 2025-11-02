'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceInput } from '@/components/features/voice/voice-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { ExpenseInput, ExpenseCategory, ParsedExpense } from '@/types/expense.types';
import { EXPENSE_CATEGORIES } from '@/types/expense.types';

const formSchema = z.object({
  category: z.string().min(1, '请选择类别'),
  amount: z.number().min(0.01, '金额必须大于 0'),
  description: z.string().optional(),
  date: z.date({ required_error: '请选择日期' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  planId: string;
  onSubmit: (input: ExpenseInput) => Promise<void>;
  loading?: boolean;
  initialValues?: Partial<ExpenseInput>;
}

export function ExpenseForm({ planId, onSubmit, loading = false, initialValues }: ExpenseFormProps) {
  const [inputMode, setInputMode] = useState<'form' | 'voice'>('form');
  const [voiceText, setVoiceText] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // 获取默认日期
  const getDefaultDate = (): Date => {
    if (initialValues?.date) {
      const parsedDate = new Date(initialValues.date);
      // 确保日期有效
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return new Date();
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: initialValues?.category || '',
      amount: initialValues?.amount || undefined,
      description: initialValues?.description || '',
      date: getDefaultDate(),
    },
  });
  
  // 处理表单提交
  const handleFormSubmit = async (values: FormValues) => {
    console.log('📝 表单提交，原始 values:', values);
    
    // 确保日期存在
    if (!values.date) {
      console.error('❌ 日期字段缺失:', values);
      return;
    }
    
    // 验证日期是否有效
    if (isNaN(values.date.getTime())) {
      console.error('❌ 日期无效:', values.date);
      return;
    }
    
    const input: ExpenseInput = {
      planId,
      category: values.category as ExpenseCategory,
      amount: values.amount,
      description: values.description,
      date: format(values.date, 'yyyy-MM-dd'),
    };
    
    console.log('✅ 准备提交的输入:', input);
    await onSubmit(input);
  };
  
  // 处理语音输入
  const handleVoiceResult = (text: string) => {
    setVoiceText(text);
    setParseError(null);
  };
  
  // 解析并应用语音输入
  const handleVoiceApply = async () => {
    if (!voiceText.trim()) {
      setParseError('请先使用语音输入');
      return;
    }
    
    setParsing(true);
    setParseError(null);
    
    try {
      // 调用 API 解析语音
      const response = await fetch('/api/expenses/parse-voice', {
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
      
      const parsed: ParsedExpense = result.parsed;
      
      // 检查必需字段
      if (parsed.missingFields && parsed.missingFields.length > 0) {
        setParseError(
          `无法识别：${parsed.missingFields.join('、')}。请补充描述或手动填写。`
        );
        setParsing(false);
        return;
      }
      
      // 应用解析结果到表单
      if (parsed.category) {
        form.setValue('category', parsed.category);
      }
      if (parsed.amount) {
        form.setValue('amount', parsed.amount);
      }
      if (parsed.description) {
        form.setValue('description', parsed.description);
      }
      if (parsed.date) {
        const parsedDate = new Date(parsed.date);
        // 确保日期有效
        if (!isNaN(parsedDate.getTime())) {
          form.setValue('date', parsedDate);
        }
      }
      
      // 切换到表单模式
      setInputMode('form');
      
    } catch (error: any) {
      setParseError(error.message || '解析失败，请重试');
    } finally {
      setParsing(false);
    }
  };
  
  return (
    <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="form">手动输入</TabsTrigger>
        <TabsTrigger value="voice">语音输入</TabsTrigger>
      </TabsList>
      
      {/* 表单输入 */}
      <TabsContent value="form" className="mt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* 类别 */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>类别 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择费用类别" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(EXPENSE_CATEGORIES).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <span>{info.icon}</span>
                            <span>{info.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* 金额 */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>金额 *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value !== undefined && !isNaN(field.value) ? field.value : ''}
                      onChange={(e) => {
                        const value = e.target.valueAsNumber;
                        field.onChange(isNaN(value) ? undefined : value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* 描述 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="例如：午餐、打车、门票等"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* 日期 */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>日期 *</FormLabel>
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
                        onSelect={(date) => {
                          // 确保日期不为 undefined
                          if (date) {
                            field.onChange(date);
                          }
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* 提交按钮 */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存费用'
              )}
            </Button>
          </form>
        </Form>
      </TabsContent>
      
      {/* 语音输入 */}
      <TabsContent value="voice" className="mt-4">
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">💡 语音输入示例：</p>
                <ul className="text-sm list-disc list-inside ml-2 space-y-1">
                  <li>"今天午餐花了 68 块"</li>
                  <li>"打车去机场 120 元"</li>
                  <li>"熊猫基地门票 120"</li>
                  <li>"昨天住酒店 350"</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
          
          <VoiceInput onResult={handleVoiceResult} />
          
          {voiceText && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">📝 语音内容：</p>
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-sm whitespace-pre-wrap">{voiceText}</p>
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
              className="flex-1"
              onClick={handleVoiceApply}
              disabled={!voiceText || loading || parsing}
            >
              {parsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI 解析中...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  应用到表单
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            点击"应用到表单"将语音内容转为表单数据，可继续修改后保存
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}

