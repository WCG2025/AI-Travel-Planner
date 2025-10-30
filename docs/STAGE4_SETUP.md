# 第四阶段：AI 旅行规划核心功能 - 配置与开发文档

## 📋 概述

第四阶段实现了 AI 旅行规划的核心功能，使用 DeepSeek API 生成个性化的旅行计划。

## ✅ 已完成功能

### 1. DeepSeek AI 集成
- ✅ DeepSeek 客户端封装
- ✅ 智能 Prompt 设计
- ✅ 错误处理和重试机制
- ✅ 流式响应支持（预留）

### 2. 旅行计划生成
- ✅ 表单输入支持
- ✅ 语音输入集成（第三阶段功能）
- ✅ AI 生成详细行程
- ✅ JSON 解析和验证
- ✅ 数据库自动保存

### 3. UI 组件
- ✅ 计划创建表单（支持语音输入）
- ✅ 计划卡片展示
- ✅ 计划详情查看
- ✅ 计划列表管理
- ✅ 响应式布局

### 4. 数据库设计
- ✅ `travel_plans` 表
- ✅ 行级安全策略（RLS）
- ✅ 自动更新时间戳
- ✅ 用户数据隔离

## 🔧 环境配置

### 1. DeepSeek API 配置

在 `.env.local` 中添加：

\`\`\`env
# DeepSeek API
DEEPSEEK_API_KEY=your_api_key_here
NEXT_PUBLIC_DEEPSEEK_API_ENDPOINT=https://api.deepseek.com
\`\`\`

### 2. 数据库迁移

运行数据库迁移脚本：

\`\`\`bash
# 在 Supabase Dashboard 的 SQL Editor 中执行
supabase/migrations/20250130_create_travel_plans_table.sql
\`\`\`

或者使用 Supabase CLI：

\`\`\`bash
supabase db push
\`\`\`

### 3. 依赖包

已安装的新依赖：

\`\`\`json
{
  "dependencies": {
    "openai": "^4.x.x",
    "date-fns": "^3.x.x",
    "@hookform/resolvers": "^3.x.x",
    "zod": "^3.x.x"
  }
}
\`\`\`

## 📁 文件结构

\`\`\`
src/
├── types/
│   └── travel-plan.types.ts          # 旅行计划类型定义
├── lib/
│   └── ai/
│       ├── ai-config.ts               # AI 配置
│       ├── deepseek-client.ts         # DeepSeek 客户端
│       ├── prompts.ts                 # Prompt 模板
│       └── plan-generator.ts          # 计划生成逻辑
├── app/
│   └── api/
│       └── generate-plan/
│           └── route.ts               # 生成计划 API
├── hooks/
│   ├── use-generate-plan.ts          # 生成计划 Hook
│   └── use-travel-plans.ts           # 计划列表 Hook
├── components/
│   └── features/
│       └── travel-plan/
│           ├── plan-form.tsx          # 创建表单
│           ├── plan-card.tsx          # 计划卡片
│           ├── plan-detail.tsx        # 计划详情
│           └── plan-manager.tsx       # 计划管理器
└── app/(dashboard)/
    └── dashboard/
        └── page.tsx                   # Dashboard 页面

supabase/
└── migrations/
    └── 20250130_create_travel_plans_table.sql  # 数据库迁移
\`\`\`

## 🚀 核心功能说明

### 1. AI 生成流程

1. **用户输入** → 填写旅行需求（表单或语音）
2. **参数验证** → 检查必需字段和格式
3. **Prompt 构建** → 生成结构化提示词
4. **AI 调用** → DeepSeek API 生成计划
5. **JSON 解析** → 提取和验证数据
6. **数据库保存** → 自动保存到 Supabase
7. **结果展示** → 显示详细行程

### 2. Prompt 设计

系统提示词定义了 AI 的角色：
- 专业旅行规划师
- 深入理解用户需求
- 提供合理的时间安排
- 准确的预算估算
- 实用的旅行建议

用户提示词包含：
- 基本信息（目的地、日期、预算等）
- 旅行偏好（兴趣、节奏、住宿等）
- 特殊需求
- 输出格式要求（严格 JSON）

### 3. 数据库表结构

\`\`\`sql
CREATE TABLE travel_plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget INTEGER,
  preferences JSONB,
  itinerary JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
\`\`\`

### 4. 语音输入集成

计划表单支持两种输入模式：
- **表单输入**：传统的表单字段
- **语音输入**：使用第三阶段的语音识别功能

用户可以通过语音描述旅行需求，语音内容会自动填充到"特殊需求"字段。

## 📊 API 接口

### POST /api/generate-plan

生成旅行计划

**请求体：**

\`\`\`json
{
  "input": {
    "destination": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "budget": number,
    "travelers": number,
    "preferences": {
      "interests": ["string"],
      "pace": "relaxed" | "moderate" | "fast",
      "accommodation": ["string"],
      "transportation": ["string"],
      "dietary": ["string"]
    },
    "specialRequirements": "string"
  }
}
\`\`\`

**响应：**

\`\`\`json
{
  "success": true,
  "plan": {
    "id": "uuid",
    "title": "string",
    "destination": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "days": number,
    "itinerary": [
      {
        "day": 1,
        "date": "YYYY-MM-DD",
        "title": "string",
        "activities": [
          {
            "time": "HH:MM",
            "title": "string",
            "description": "string",
            "location": "string",
            "cost": number,
            "type": "attraction" | "meal" | "transportation" | ...,
            "tips": ["string"]
          }
        ],
        "estimatedCost": number
      }
    ],
    "summary": {
      "totalCost": number,
      "highlights": ["string"],
      "tips": ["string"],
      "warnings": ["string"],
      "packingList": ["string"]
    }
  }
}
\`\`\`

## 🧪 测试步骤

### 1. 验证 API 配置

在浏览器控制台测试：

\`\`\`javascript
fetch('/api/generate-plan')
  .then(r => r.json())
  .then(console.log)
// 应该返回: { status: 'ok', message: '...', version: '1.0.0' }
\`\`\`

### 2. 测试生成功能

1. 访问 Dashboard: `http://localhost:3000/dashboard`
2. 点击"创建新计划"
3. 填写旅行需求：
   - 目的地：北京
   - 开始日期：明天
   - 结束日期：后天
   - 预算：3000
   - 选择兴趣：历史文化、美食
4. 点击"生成旅行计划"
5. 等待 AI 生成（约 10-30 秒）
6. 查看详细行程

### 3. 测试语音输入

1. 在创建表单中切换到"语音输入"标签
2. 点击"开始语音输入"
3. 说："我想去杭州玩三天，预算五千元，喜欢自然风光和美食"
4. 点击"确认提交"
5. 切换回"表单输入"标签
6. 确认语音内容已填充到"特殊需求"字段

### 4. 测试计划管理

1. 生成多个计划
2. 在 Dashboard 查看计划列表
3. 点击任意计划查看详情
4. 测试删除功能

## 🔍 常见问题

### 1. API 调用失败

**问题**: `API Key 无效，请检查配置`

**解决**:
- 检查 `.env.local` 中的 `DEEPSEEK_API_KEY`
- 确认 API Key 是否有效
- 重启开发服务器

### 2. 数据库保存失败

**问题**: `保存到数据库失败`

**解决**:
- 确认已执行数据库迁移
- 检查 Supabase 连接
- 检查 RLS 策略是否正确

### 3. JSON 解析失败

**问题**: `AI 返回的内容格式不正确`

**解决**:
- AI 可能没有严格按照 JSON 格式返回
- 尝试调整 Prompt 或重试
- 检查 AI 配置的 `temperature` 参数

### 4. 生成时间过长

**问题**: 生成超过 60 秒

**解决**:
- 这是正常的，复杂行程需要时间
- 可以在 `src/lib/ai/ai-config.ts` 调整 `timeout`
- 考虑实现流式响应（已预留接口）

### 5. 计划内容不满意

**问题**: AI 生成的计划不符合预期

**解决**:
- 提供更详细的需求描述
- 在"特殊需求"中明确要求
- 使用语音输入更详细地描述需求
- 调整 `src/lib/ai/prompts.ts` 中的 Prompt

## 📈 性能优化建议

### 1. 缓存策略

考虑实现计划缓存：
- 相似需求的计划可以复用
- 减少 API 调用次数
- 降低成本

### 2. 流式响应

已预留 `chatStream` 接口，可以实现：
- 实时显示生成进度
- 更好的用户体验
- 避免超时问题

### 3. 后台队列

对于复杂行程，可以考虑：
- 使用后台任务队列
- 异步生成计划
- 完成后通知用户

## 🎯 下一步计划

### 第五阶段：地图可视化（待实施）

- [ ] 集成地图服务（高德/百度）
- [ ] 在地图上标注景点
- [ ] 显示路线和距离
- [ ] 交互式行程调整

### 第六阶段：协作与分享（待实施）

- [ ] 多人协作编辑
- [ ] 计划分享链接
- [ ] 导出 PDF/图片
- [ ] 社交媒体分享

## 📝 技术栈

- **AI**: DeepSeek API (兼容 OpenAI SDK)
- **前端**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **表单**: React Hook Form, Zod
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth

## 🔗 相关文档

- [第三阶段文档](./STAGE3_SETUP.md) - 语音输入功能
- [第二阶段文档](./STAGE2_SETUP.md) - 用户认证系统
- [部署文档](./DEPLOYMENT.md) - 生产环境部署

## ✨ 更新日志

### v1.0.0 (2025-01-30)

- ✅ 实现 DeepSeek AI 集成
- ✅ 创建旅行计划生成系统
- ✅ 集成语音输入功能
- ✅ 完善 UI 组件
- ✅ 实现数据库保存
- ✅ 添加计划管理功能

---

**开发完成时间**: 2025年1月30日  
**版本**: 1.0.0  
**状态**: ✅ 已完成

