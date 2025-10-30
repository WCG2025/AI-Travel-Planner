# 第四阶段测试指南 🧪

## 前置条件

### 1. 验证 DeepSeek API 配置

检查 `.env.local` 文件：

```env
DEEPSEEK_API_KEY=sk-969745a2242c498f9a6c459634f0389a
NEXT_PUBLIC_DEEPSEEK_API_ENDPOINT=https://api.deepseek.com
```

### 2. 执行数据库迁移

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 复制 supabase/migrations/20250130_create_travel_plans_table.sql 的内容并执行
```

或者使用 SQL Editor 直接运行以下命令创建表：

```sql
CREATE TABLE IF NOT EXISTS public.travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget INTEGER,
  preferences JSONB DEFAULT '{}',
  itinerary JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own plans" ON public.travel_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.travel_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.travel_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.travel_plans FOR DELETE USING (auth.uid() = user_id);
```

## 测试步骤

### 测试 1: API 健康检查 ✅

在浏览器中打开：
```
http://localhost:3000/api/generate-plan
```

预期响应：
```json
{
  "status": "ok",
  "message": "旅行计划生成 API 运行正常",
  "version": "1.0.0"
}
```

### 测试 2: 创建简单行程 ✅

1. 访问 Dashboard: http://localhost:3000/dashboard
2. 点击"创建新计划"按钮
3. 填写表单：
   - 目的地：`北京`
   - 开始日期：选择明天
   - 结束日期：选择后天
   - 预算：`3000`
   - 同行人数：`1`
   - 选择兴趣：`历史文化`、`美食`
   - 旅行节奏：`适中`
4. 点击"生成旅行计划"
5. 等待 10-20 秒
6. 查看生成的计划详情

**预期结果**：
- ✅ 生成包含 2 天行程
- ✅ 每天有 3-5 个活动
- ✅ 包含景点、用餐、交通等
- ✅ 有合理的时间安排
- ✅ 费用在预算范围内

### 测试 3: 使用语音输入 ✅

1. 在创建表单中切换到"语音输入"标签页
2. 点击"开始语音输入"
3. 说话：`我想去杭州旅游三天，预算五千元，喜欢自然风光和美食`
4. 点击"停止录音"
5. 点击"确认提交"
6. 切换回"表单输入"标签页
7. 验证语音内容已填充到"特殊需求"字段

**预期结果**：
- ✅ 语音识别准确
- ✅ 文本正确填充
- ✅ 可继续填写其他字段

### 测试 4: 查看计划详情 ✅

1. 在 Dashboard 的计划列表中
2. 点击任意计划卡片的"查看详情"按钮
3. 查看弹出的详情对话框

**预期结果**：
- ✅ 显示完整的计划信息
- ✅ 可折叠的日程安排
- ✅ 每个活动有详细描述
- ✅ 显示费用、时间、地点等信息
- ✅ 有实用建议和注意事项

### 测试 5: 删除计划 ✅

1. 在计划卡片上点击删除按钮（垃圾桶图标）
2. 确认删除提示
3. 验证计划从列表中消失

**预期结果**：
- ✅ 删除确认对话框出现
- ✅ 删除成功提示
- ✅ 计划从列表移除
- ✅ 数据库中记录已删除

### 测试 6: 复杂行程 ✅

1. 创建一个 5 天的行程
2. 目的地：`日本东京`
3. 预算：`15000`
4. 选择多个兴趣标签
5. 在"特殊需求"中填写详细要求

**预期结果**：
- ✅ 生成时间约 20-30 秒
- ✅ 行程内容丰富详细
- ✅ 符合所有指定要求

## 常见问题排查

### 问题 1: API 返回 401 Unauthorized

**原因**: DeepSeek API Key 无效

**解决**:
1. 检查 `.env.local` 中的 `DEEPSEEK_API_KEY`
2. 确认 API Key 是否正确
3. 重启开发服务器：`npm run dev`

### 问题 2: 数据库保存失败

**原因**: 数据库表未创建或 RLS 策略问题

**解决**:
1. 在 Supabase Dashboard 检查 `travel_plans` 表是否存在
2. 执行数据库迁移脚本
3. 检查 RLS 策略是否正确配置

### 问题 3: 生成超时

**原因**: 网络问题或行程太复杂

**解决**:
1. 检查网络连接
2. 减少行程天数（建议 ≤ 7 天）
3. 简化特殊需求描述

### 问题 4: JSON 解析失败

**原因**: AI 返回格式不符合预期

**解决**:
1. 重试生成
2. 查看浏览器控制台的详细错误
3. 如果持续失败，调整 Prompt 设置

## 测试检查清单 ✅

- [ ] API 健康检查通过
- [ ] 数据库表已创建
- [ ] RLS 策略配置正确
- [ ] 简单行程生成成功
- [ ] 复杂行程生成成功
- [ ] 语音输入正常工作
- [ ] 计划列表正常显示
- [ ] 计划详情正常查看
- [ ] 计划删除功能正常
- [ ] Toast 提示正常显示
- [ ] 表单验证正常工作
- [ ] 加载状态显示正确

## 性能基准

| 行程天数 | 预期生成时间 | 数据量 |
|---------|------------|--------|
| 2-3 天   | 8-15 秒    | ~2KB   |
| 4-5 天   | 15-25 秒   | ~4KB   |
| 6-7 天   | 25-40 秒   | ~6KB   |

## 开发工具

### 浏览器控制台

查看 AI 生成日志：
```javascript
// 打开浏览器控制台，筛选包含 "DeepSeek" 或 "AI" 的日志
```

### Supabase Dashboard

查看数据库记录：
```sql
SELECT * FROM travel_plans ORDER BY created_at DESC;
```

## 下一步

测试通过后，可以：
1. 体验完整的旅行规划流程
2. 尝试不同的旅行需求组合
3. 测试极端情况（如 1 天或 10 天行程）
4. 准备进入第五阶段：地图可视化

---

**祝测试顺利！** 🎉

如有问题，请查看：
- 配置文档：`docs/STAGE4_SETUP.md`
- 完成报告：`docs/STAGE4_COMPLETE.md`

