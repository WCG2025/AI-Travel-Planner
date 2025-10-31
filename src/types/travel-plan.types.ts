// 旅行计划相关类型定义

// 用户输入的旅行需求
export interface TravelPlanInput {
  destination: string;          // 目的地
  startDate?: string;            // 开始日期 (YYYY-MM-DD)，可选
  endDate?: string;              // 结束日期 (YYYY-MM-DD)，可选
  days?: number;                 // 天数（如果没有具体日期）
  budget?: number;               // 预算（元）
  travelers?: number;            // 同行人数
  preferences?: TravelPreferences; // 旅行偏好
  specialRequirements?: string;  // 特殊需求
}

// 旅行偏好
export interface TravelPreferences {
  interests?: string[];          // 兴趣爱好
  pace?: 'relaxed' | 'moderate' | 'fast'; // 节奏
  accommodation?: string[];      // 住宿偏好
  transportation?: string[];     // 交通偏好
  dietary?: string[];            // 饮食偏好
}

// AI 生成的完整旅行计划
export interface TravelPlan {
  id?: string;
  userId?: string;
  title: string;                 // 计划标题
  destination: string;           // 目的地
  startDate?: string;            // 开始日期（可选，相对日期模式下不需要）
  endDate?: string;              // 结束日期（可选，相对日期模式下不需要）
  days: number;                  // 天数
  budget?: number;               // 预算
  preferences?: TravelPreferences;
  itinerary: ItineraryDay[];     // 行程安排
  summary?: PlanSummary;         // 计划摘要
  createdAt?: string;
  updatedAt?: string;
}

// 每天的行程
export interface ItineraryDay {
  day: number;                   // 第几天
  date?: string;                 // 日期（可选，可以是具体日期或"第X天"）
  title: string;                 // 当天主题
  activities: Activity[];        // 活动列表
  estimatedCost?: number;        // 当天预估费用
  notes?: string;                // 备注
}

// 单个活动
export interface Activity {
  time: string;                  // 时间 (HH:MM)
  endTime?: string;              // 结束时间
  title: string;                 // 活动标题
  description: string;           // 详细描述
  location?: string;             // 地点
  address?: string;              // 详细地址
  coordinates?: {                // 坐标（为地图功能准备）
    lat: number;
    lng: number;
  };
  duration?: string;             // 持续时间
  cost?: number;                 // 费用
  type: ActivityType;            // 活动类型
  tips?: string[];               // 小贴士
  bookingInfo?: string;          // 预订信息
}

// 活动类型
export type ActivityType = 
  | 'attraction'      // 景点游览
  | 'meal'            // 用餐
  | 'transportation'  // 交通
  | 'accommodation'   // 住宿
  | 'shopping'        // 购物
  | 'entertainment'   // 娱乐
  | 'other';          // 其他

// 计划摘要
export interface PlanSummary {
  totalCost?: number;            // 总费用
  highlights: string[];          // 亮点
  tips: string[];                // 总体建议
  warnings?: string[];           // 注意事项
  packingList?: string[];        // 行李清单
}

// AI 生成状态
export type GenerationStatus = 
  | 'idle'           // 空闲
  | 'generating'     // 生成中
  | 'success'        // 成功
  | 'error';         // 错误

// AI 生成请求
export interface GeneratePlanRequest {
  input: TravelPlanInput;
  userId: string;
}

// AI 生成响应
export interface GeneratePlanResponse {
  success: boolean;
  plan?: TravelPlan;
  error?: string;
}

// 数据库中存储的旅行计划（Supabase 格式）
export interface TravelPlanDB {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number | null;
  preferences: Record<string, any>;
  itinerary: Record<string, any>[];
  created_at: string;
  updated_at: string;
}

