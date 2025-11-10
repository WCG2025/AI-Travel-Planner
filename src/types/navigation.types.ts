// 导航服务相关类型定义

/**
 * 地址建议
 */
export interface AddressSuggestion {
  name: string;
  address: string;
  district: string;
  city?: string;
  adcode: string;
  location?: {
    lng: number;
    lat: number;
  };
  level: string;
}

// 导航查询输入
export interface NavigationQuery {
  origin: string;              // 出发地
  destination: string;         // 目的地
  departureDate?: string;      // 出发日期 (YYYY-MM-DD)
  departureTime?: string;      // 出发时间 (HH:MM)
}

// 导航查询结果
export interface NavigationResult {
  id?: string;
  userId?: string;
  query: NavigationQuery;
  routes: TransitRoute[];      // 导航方案列表（公交路线）
  createdAt?: string;
}

// 公交路线方案
export interface TransitRoute {
  routeId: string;             // 路线ID
  origin: string;              // 起点
  destination: string;         // 终点
  distance: number;            // 总距离（米）
  duration: number;            // 总时间（秒）
  cost: number;                // 总费用（元）
  segments: TransitSegment[];  // 路段详情
  walkingDistance: number;     // 步行距离（米）
  transitDistance: number;     // 公交距离（米）
  restrictions: string[];      // 限制信息
}

// 公交路段
export interface TransitSegment {
  transportation: string;      // 交通方式
  origin: string;              // 起点站
  destination: string;         // 终点站
  distance: number;            // 距离（米）
  duration: number;            // 时间（秒）
  instructions: string[];      // 换乘说明
  vehicle?: string;            // 车辆信息（如：地铁1号线）
  departureStop?: {            // 出发站信息
    name: string;
    location?: {
      lng: number;
      lat: number;
    };
  };
  arrivalStop?: {              // 到达站信息
    name: string;
    location?: {
      lng: number;
      lat: number;
    };
  };
  viaStops?: Array<{           // 途经站点
    name: string;
    location?: {
      lng: number;
      lat: number;
    };
  }>;
}

// 路线方案（兼容现有类型）
export interface Route {
  distance: number;            // 总距离（米）
  duration: number;            // 总时间（秒）
  steps: RouteStep[];          // 路线步骤
  path: Coordinate[];          // 完整路径
  description?: string;         // 路线描述
  cost?: number;               // 花费（元）
}

// 路线步骤
export interface RouteStep {
  instruction: string;          // 导航指令
  distance: number;            // 距离（米）
  duration: number;            // 时间（秒）
  path: Coordinate[];          // 路径坐标点
}

// 地理坐标
export interface Coordinate {
  lng: number;                 // 经度
  lat: number;                 // 纬度
}

// 数据库中存储的导航查询记录（Supabase 格式）
export interface NavigationQueryDB {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  routes: Record<string, any>[];
  created_at: string;
}

// 导航查询状态
export type NavigationQueryStatus = 
  | 'idle'           // 空闲
  | 'querying'       // 查询中
  | 'success'        // 成功
  | 'error';         // 错误