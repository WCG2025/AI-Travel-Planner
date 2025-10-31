// 费用管理相关类型定义

// 费用类别
export type ExpenseCategory = 
  | 'transportation'  // 交通
  | 'accommodation'   // 住宿
  | 'food'            // 餐饮
  | 'attraction'      // 门票/景点
  | 'shopping'        // 购物
  | 'entertainment'   // 娱乐
  | 'other';          // 其他

// 费用记录
export interface Expense {
  id?: string;
  planId: string;              // 关联的旅行计划 ID
  category: ExpenseCategory;   // 费用类别
  amount: number;              // 金额
  description?: string;        // 描述
  date: string;                // 日期 (YYYY-MM-DD)
  createdAt?: string;          // 创建时间
}

// 费用输入（用于创建/更新）
export interface ExpenseInput {
  planId: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  date: string;
}

// 语音解析结果
export interface ParsedExpense {
  category?: ExpenseCategory;  // 解析出的类别
  amount?: number;             // 解析出的金额
  description?: string;        // 解析出的描述
  date?: string;               // 解析出的日期
  confidence: 'high' | 'medium' | 'low';  // 解析置信度
  missingFields: string[];     // 缺失的字段
}

// 费用统计
export interface ExpenseStats {
  total: number;               // 总支出
  byCategory: CategoryStat[];  // 分类统计
  byDate: DateStat[];          // 按日统计
  count: number;               // 记录数量
  average: number;             // 平均消费
}

// 分类统计
export interface CategoryStat {
  category: ExpenseCategory;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

// 日期统计
export interface DateStat {
  date: string;
  amount: number;
  count: number;
}

// 预算信息
export interface Budget {
  total: number;               // 总预算
  byCategory?: {               // 分类预算（可选）
    [key in ExpenseCategory]?: number;
  };
}

// 预算对比
export interface BudgetComparison {
  budget: number;              // 预算
  actual: number;              // 实际支出
  remaining: number;           // 剩余预算
  percentage: number;          // 使用百分比
  status: 'safe' | 'warning' | 'exceeded';  // 状态
}

// 分类预算对比
export interface CategoryBudgetComparison {
  category: ExpenseCategory;
  categoryName: string;
  budget: number;
  actual: number;
  remaining: number;
  percentage: number;
}

// 数据库中的费用记录格式（Supabase）
export interface ExpenseDB {
  id: string;
  plan_id: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
}

// API 响应
export interface GetExpensesResponse {
  success: boolean;
  expenses?: Expense[];
  stats?: ExpenseStats;
  error?: string;
}

export interface CreateExpenseResponse {
  success: boolean;
  expense?: Expense;
  error?: string;
}

export interface UpdateExpenseResponse {
  success: boolean;
  expense?: Expense;
  error?: string;
}

export interface DeleteExpenseResponse {
  success: boolean;
  error?: string;
}

export interface ParseExpenseResponse {
  success: boolean;
  parsed?: ParsedExpense;
  error?: string;
}

// 费用类别映射
export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  transportation: { label: '交通', icon: '🚗', color: '#3b82f6' },
  accommodation: { label: '住宿', icon: '🏨', color: '#8b5cf6' },
  food: { label: '餐饮', icon: '🍽️', color: '#10b981' },
  attraction: { label: '门票', icon: '🎫', color: '#f59e0b' },
  shopping: { label: '购物', icon: '🛍️', color: '#ec4899' },
  entertainment: { label: '娱乐', icon: '🎭', color: '#06b6d4' },
  other: { label: '其他', icon: '📝', color: '#6b7280' },
};

