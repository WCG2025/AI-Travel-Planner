// 高德地图相关类型定义

// 地理坐标
export interface Coordinate {
  lng: number; // 经度
  lat: number; // 纬度
}

// 地址信息
export interface Address {
  province?: string;      // 省份
  city?: string;          // 城市
  district?: string;      // 区县
  street?: string;        // 街道
  streetNumber?: string;  // 门牌号
  formattedAddress: string; // 格式化地址
}

// 地理编码结果
export interface GeocodingResult {
  coordinate: Coordinate;
  address: Address;
  confidence?: number; // 置信度
}

// POI（兴趣点）信息
export interface POI {
  id?: string;
  name: string;
  address: string;
  coordinate: Coordinate;
  type?: string;        // POI 类型（景点、餐厅等）
  phone?: string;
  rating?: number;
  photoUrl?: string;
}

// 路线规划策略
export type RoutePlanStrategy = 
  | 'LEAST_TIME'      // 最快捷
  | 'LEAST_DISTANCE'  // 最短距离
  | 'LEAST_FEE'       // 最少收费
  | 'LEAST_TRANSFER'  // 最少换乘
  | 'WALK'            // 步行
  | 'RIDING';         // 骑行

// 交通方式
export type TravelMode = 
  | 'driving'    // 驾车
  | 'transit'    // 公交
  | 'walking'    // 步行
  | 'riding';    // 骑行

// 路线规划请求
export interface RoutePlanRequest {
  origin: Coordinate;        // 起点
  destination: Coordinate;   // 终点
  waypoints?: Coordinate[];  // 途经点
  mode: TravelMode;          // 交通方式
  strategy?: RoutePlanStrategy; // 规划策略
}

// 路线步骤
export interface RouteStep {
  instruction: string;       // 导航指令
  distance: number;          // 距离（米）
  duration: number;          // 时间（秒）
  path: Coordinate[];        // 路径坐标点
}

// 路线方案
export interface Route {
  distance: number;          // 总距离（米）
  duration: number;          // 总时间（秒）
  steps: RouteStep[];        // 路线步骤
  path: Coordinate[];        // 完整路径
  description?: string;      // 路线描述
  cost?: number;             // 花费（元）
}

// 地图标记选项
export interface MapMarkerOptions {
  position: Coordinate;
  title?: string;
  content?: string;
  icon?: string;
  zIndex?: number;
  clickable?: boolean;
  draggable?: boolean;
}

// 地图配置
export interface MapConfig {
  zoom?: number;             // 缩放级别 (3-18)
  center?: Coordinate;       // 中心点
  mapStyle?: string;         // 地图样式
  showTraffic?: boolean;     // 显示路况
  showScale?: boolean;       // 显示比例尺
  showCompass?: boolean;     // 显示指南针
  enableScrollWheelZoom?: boolean; // 鼠标滚轮缩放
}

// 高德地图加载配置
export interface AMapLoaderConfig {
  key: string;               // API Key
  version?: string;          // 版本号
  plugins?: string[];        // 插件列表
}

// 地图实例状态
export interface MapState {
  loaded: boolean;
  error: string | null;
  center: Coordinate | null;
  zoom: number;
}

