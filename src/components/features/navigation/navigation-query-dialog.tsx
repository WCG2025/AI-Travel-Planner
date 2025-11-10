'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AddressSuggestion, getAddressSuggestions } from '@/lib/navigation/address-service';
import type { NavigationQuery, NavigationResult } from '@/types/navigation.types';

interface NavigationQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (query: NavigationQuery) => Promise<NavigationResult | null>;
  initialQuery?: Partial<NavigationQuery>;
}

export function NavigationQueryDialog({
  open,
  onOpenChange,
  onSubmit,
  initialQuery
}: NavigationQueryDialogProps) {
  const [query, setQuery] = useState<NavigationQuery>({
    origin: '',
    destination: '',
    departureDate: format(new Date(), 'yyyy-MM-dd'),
    departureTime: format(new Date(), 'HH:mm'),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originSuggestions, setOriginSuggestions] = useState<AddressSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<AddressSuggestion[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showOriginCalendar, setShowOriginCalendar] = useState(false);
  const [showDestinationCalendar, setShowDestinationCalendar] = useState(false);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  


  // 当对话框打开时，如果有初始查询，则填充表单
  useEffect(() => {
    if (open && initialQuery) {
      setQuery(prev => ({
        ...prev,
        ...initialQuery,
        departureDate: initialQuery.departureDate || format(new Date(), 'yyyy-MM-dd'),
        departureTime: initialQuery.departureTime || format(new Date(), 'HH:mm'),
      }));
    }
  }, [open, initialQuery]);

  // 防抖函数 - 增加立即执行选项
  const debounce = (func: Function, delay: number, immediate: boolean = false) => {
    let timeoutId: NodeJS.Timeout | null = null;
    return (...args: any[]) => {
      const callNow = immediate && !timeoutId;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (!immediate) func(...args);
      }, delay);
      if (callNow) func(...args);
    };
  };

  // 获取地址建议
  const fetchAddressSuggestions = async (input: string, type: 'origin' | 'destination') => {
    console.log(`获取地址建议: ${input}, 类型: ${type}`);
    
    // 如果输入为空，清空建议列表
    if (!input.trim()) {
      console.log('输入为空，清空建议列表');
      if (type === 'origin') {
        setOriginSuggestions([]);
        setShowOriginSuggestions(false);
      } else {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      }
      return;
    }

    try {
      console.log('调用getAddressSuggestions...');
      // 调用高德地图的输入提示API
      const suggestions = await getAddressSuggestions(input);
      console.log('getAddressSuggestions返回结果:', suggestions);
      
      if (type === 'origin') {
        console.log('设置出发地建议:', suggestions);
        setOriginSuggestions(suggestions);
        setShowOriginSuggestions(suggestions.length > 0);
      } else {
        console.log('设置目的地建议:', suggestions);
        setDestinationSuggestions(suggestions);
        setShowDestinationSuggestions(suggestions.length > 0);
      }
    } catch (err) {
      console.error('获取地址建议失败:', err);
      // 不显示错误提示，只是不显示建议
      if (type === 'origin') {
        setOriginSuggestions([]);
        setShowOriginSuggestions(false);
      } else {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      }
    }
  };

  // 创建防抖版本的获取地址建议函数
  // 使用更长的延迟时间和立即执行选项来优化用户体验
  const debouncedFetchOriginSuggestions = debounce((input: string) => {
    fetchAddressSuggestions(input, 'origin');
  }, 300); // 减少到300毫秒，提高响应速度

  const debouncedFetchDestinationSuggestions = debounce((input: string) => {
    fetchAddressSuggestions(input, 'destination');
  }, 300); // 减少到300毫秒，提高响应速度

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originInputRef.current && !originInputRef.current.contains(event.target as Node)) {
        setShowOriginSuggestions(false);
      }
      if (destinationInputRef.current && !destinationInputRef.current.contains(event.target as Node)) {
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理出发地输入变化
  const handleOriginChange = (value: string) => {
    setQuery(prev => ({ ...prev, origin: value }));
    debouncedFetchOriginSuggestions(value);
  };

  // 处理目的地输入变化
  const handleDestinationChange = (value: string) => {
    setQuery(prev => ({ ...prev, destination: value }));
    debouncedFetchDestinationSuggestions(value);
  };

  // 选择地址建议
  const handleSelectSuggestion = (suggestion: AddressSuggestion, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setQuery(prev => ({ ...prev, origin: suggestion.name }));
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
    } else {
      setQuery(prev => ({ ...prev, destination: suggestion.name }));
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!query.origin.trim()) {
      setError('请输入出发地');
      return;
    }

    if (!query.destination.trim()) {
      setError('请输入目的地');
      return;
    }

    if (query.origin === query.destination) {
      setError('出发地和目的地不能相同');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(query);
      onOpenChange(false);
      // 重置表单
      setQuery({
        origin: '',
        destination: '',
        departureDate: format(new Date(), 'yyyy-MM-dd'),
        departureTime: format(new Date(), 'HH:mm'),
      });
    } catch (err: any) {
      setError(err.message || '查询失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 生成时间选项
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>路径查询</DialogTitle>
          <DialogDescription>
            输入出发地和目的地，查询公交出行方案
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 出发地输入 */}
          <div className="space-y-2">
            <Label htmlFor="origin">出发地</Label>
            <div className="relative" ref={originInputRef}>
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="origin"
                placeholder="请输入出发地"
                value={query.origin}
                onChange={(e) => handleOriginChange(e.target.value)}
                onFocus={() => {
                  if (originSuggestions.length > 0) {
                    setShowOriginSuggestions(true);
                  }
                }}
                className="pl-10"
              />
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                  {originSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center justify-between"
                      onClick={() => handleSelectSuggestion(suggestion, 'origin')}
                    >
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{suggestion.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {suggestion.address} {suggestion.district}
                          </div>
                        </div>
                      </div>
                      {suggestion.city && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.city}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 目的地输入 */}
          <div className="space-y-2">
            <Label htmlFor="destination">目的地</Label>
            <div className="relative" ref={destinationInputRef}>
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="destination"
                placeholder="请输入目的地"
                value={query.destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                onFocus={() => {
                  if (destinationSuggestions.length > 0) {
                    setShowDestinationSuggestions(true);
                  }
                }}
                className="pl-10"
              />
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                  {destinationSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center justify-between"
                      onClick={() => handleSelectSuggestion(suggestion, 'destination')}
                    >
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{suggestion.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {suggestion.address} {suggestion.district}
                          </div>
                        </div>
                      </div>
                      {suggestion.city && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.city}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 日期和时间选择 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 日期选择 */}
            <div className="space-y-2">
              <Label htmlFor="date">出发日期</Label>
              <Popover open={showOriginCalendar} onOpenChange={setShowOriginCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !query.departureDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {query.departureDate ? format(new Date(query.departureDate), "yyyy年MM月dd日") : "选择日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={query.departureDate ? new Date(query.departureDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setQuery(prev => ({ ...prev, departureDate: format(date, 'yyyy-MM-dd') }));
                        setShowOriginCalendar(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 时间选择 */}
            <div className="space-y-2">
              <Label htmlFor="time">出发时间</Label>
              <Select value={query.departureTime} onValueChange={(value) => setQuery(prev => ({ ...prev, departureTime: value }))}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="选择时间" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeOptions().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  查询中...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  查询路线
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}