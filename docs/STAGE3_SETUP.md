# 第三阶段：语音输入功能 - 配置指南

## 📋 概述

第三阶段主要实现科大讯飞语音识别功能，包括：
- 科大讯飞 Web API 集成
- 语音录制与实时识别
- 语音转文字功能
- 语音输入 UI 组件
- 错误处理与降级方案

---

## 🔧 前置条件

在开始第三阶段之前，请确保：

- ✅ 第二阶段已完成（用户认证系统）
- ✅ 项目能正常运行（`npm run dev`）
- ✅ Supabase 配置正确
- ✅ 用户可以正常登录

---

## 🎯 第三阶段需要完成的功能

### 1. 语音识别核心功能
- 科大讯飞 WebSocket API 集成
- 实时语音转文字（流式识别）
- 音频录制与编码
- 语音识别结果处理

### 2. UI 组件开发
- 语音录制按钮
- 录音动画效果
- 实时识别结果展示
- 语音权限请求提示

### 3. 错误处理
- 麦克风权限检测
- 网络异常处理
- API 配额限制提示
- 降级到文字输入方案

---

## 📝 步骤 1：申请科大讯飞 API

### 1.1 注册账号

1. 访问 [科大讯飞开放平台](https://www.xfyun.cn/)
2. 点击右上角"注册/登录"
3. 完成账号注册（推荐使用手机号注册）
4. 完成实名认证（个人认证即可）

### 1.2 创建应用

1. 登录后，点击控制台
2. 选择"语音听写（流式版）"产品
3. 点击"创建新应用"
4. 填写应用信息：
   - **应用名称**: AI Travel Planner
   - **应用平台**: Web
   - **应用简介**: AI 旅行规划助手
5. 提交并等待审核（通常几分钟内通过）

### 1.3 获取 API 凭证

应用创建成功后：

1. 在控制台找到你的应用
2. 点击应用名称进入详情页
3. 记录以下信息：
   - **APPID**: `xxxxxxxx`
   - **APISecret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **APIKey**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 1.4 查看免费配额

科大讯飞提供免费额度：
- **语音听写**: 500 万字符/年（每日 5000 次请求）
- 足够开发和测试使用

---

## ⚙️ 步骤 2：配置环境变量

编辑项目根目录的 `.env.local` 文件，添加科大讯飞配置：

```env
# Supabase 配置（已有）
NEXT_PUBLIC_SUPABASE_URL=https://你的项目id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_public_key

# 科大讯飞配置（新增）
NEXT_PUBLIC_XFYUN_APP_ID=你的APPID
NEXT_PUBLIC_XFYUN_API_KEY=你的APIKey
NEXT_PUBLIC_XFYUN_API_SECRET=你的APISecret

# DeepSeek API（暂时留空）
DEEPSEEK_API_KEY=
NEXT_PUBLIC_DEEPSEEK_API_ENDPOINT=https://api.deepseek.com

# 高德地图（暂时留空）
NEXT_PUBLIC_AMAP_KEY=
NEXT_PUBLIC_AMAP_SECRET=
```

**重要提醒**：
- 环境变量以 `NEXT_PUBLIC_` 开头的可以在浏览器端访问
- 不要将 `.env.local` 文件提交到 Git
- 确保 `.env.local` 已在 `.gitignore` 中

---

## 📦 步骤 3：安装依赖包

运行以下命令安装所需依赖：

```bash
# 语音处理相关
npm install js-base64 crypto-js

# UI 组件
npx shadcn@latest add badge alert
```

### 依赖说明

| 包名 | 用途 | 版本 |
|------|------|------|
| `js-base64` | Base64 编码/解码 | ^3.7.x |
| `crypto-js` | 加密算法（HMAC-SHA256） | ^4.2.x |

---

## 📁 步骤 4：文件结构

第三阶段创建的文件：

```
src/
├── lib/voice/
│   ├── xfyun-client.ts        # 科大讯飞 WebSocket 客户端
│   ├── audio-recorder.ts      # 音频录制封装
│   └── voice-config.ts        # 语音识别配置
├── hooks/
│   └── use-voice-recognition.ts   # 语音识别 Hook
├── components/features/voice/
│   ├── voice-button.tsx       # 语音按钮组件
│   ├── voice-input.tsx        # 语音输入组件
│   └── voice-test-section.tsx # 语音测试区域
├── components/ui/
│   ├── badge.tsx              # Badge 组件（shadcn）
│   └── alert.tsx              # Alert 组件（shadcn）
└── types/
    └── voice.types.ts         # 语音相关类型定义
```

---

## 🛠️ 步骤 5：核心技术说明

### 科大讯飞 WebSocket 鉴权

科大讯飞使用 HMAC-SHA256 签名算法进行鉴权：

1. 生成签名原文：`host: xxx\ndate: xxx\nGET /v2/iat HTTP/1.1`
2. 使用 APISecret 对签名原文进行 HMAC-SHA256 加密
3. 将结果进行 Base64 编码
4. 拼接成 authorization 参数

**实现文件**: `src/lib/voice/xfyun-client.ts`

### 音频录制与处理

1. **获取麦克风权限**: `navigator.mediaDevices.getUserMedia()`
2. **创建音频上下文**: `AudioContext` (采样率 16000Hz)
3. **实时处理音频**: `ScriptProcessorNode`
4. **格式转换**: Float32Array → Int16Array (PCM)

**实现文件**: `src/lib/voice/audio-recorder.ts`

### WebSocket 数据格式

发送音频帧：
```json
{
  "common": { "app_id": "xxx" },
  "business": {
    "language": "zh_cn",
    "accent": "mandarin",
    "domain": "iat"
  },
  "data": {
    "status": 1,  // 0:首帧 1:中间帧 2:尾帧
    "format": "audio/L16;rate=16000",
    "encoding": "raw",
    "audio": "base64编码的音频数据"
  }
}
```

接收识别结果：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "status": 1,  // 1:中间结果 2:最终结果
    "result": {
      "ws": [
        { "cw": [{ "w": "文字" }] }
      ]
    }
  }
}
```

---

## 🧪 步骤 6：测试语音功能

### 6.1 启动开发服务器

```bash
npm run dev
```

### 6.2 访问测试页面

1. 打开浏览器访问 http://localhost:3000
2. 登录您的账号
3. 进入 Dashboard 页面
4. 找到"🎤 语音识别测试"卡片

### 6.3 测试流程

1. **点击"开始语音输入"**
   - 首次使用会请求麦克风权限，点击"允许"
   - 等待连接 WebSocket（状态变为"正在听..."）

2. **开始说话**
   - 对着麦克风清晰地说话
   - 例如："我想去北京旅游三天，预算一万元"
   - 观察识别结果是否实时显示

3. **点击"停止录音"**
   - 查看完整的识别结果
   - 结果会显示在"最新识别结果"区域
   - 同时会保存到历史记录中

### 6.4 检查控制台日志

打开浏览器开发者工具（F12），查看控制台：

**成功的日志应该包含**：
```
=== 开始语音识别流程 ===
检查环境变量配置:
- APPID: 已配置 ✓
- APIKey: 已配置 ✓
- APISecret: 已配置 ✓
创建科大讯飞客户端...
连接 WebSocket...
✅ WebSocket 连接成功
请求麦克风权限...
✅ 麦克风权限已获取
开始录音...
✅ 录音已启动
发送音频数据，大小: 8192 字节
收到识别结果: {...}
解析文本: 我想 是否最终结果: false
...
=== 停止语音识别 ===
```

---

## 🐛 常见问题

### 问题 1：WebSocket 连接失败

**症状**：控制台显示"❌ WebSocket 连接错误"

**检查清单**：
- [ ] `.env.local` 文件是否存在
- [ ] 环境变量是否正确填写（APPID, APIKey, APISecret）
- [ ] 开发服务器是否重启（修改环境变量后必须重启）
- [ ] 科大讯飞账号是否正常
- [ ] API Key 是否有效

**解决方案**：
```bash
# 1. 检查环境变量
cat .env.local

# 2. 重启开发服务器
# 停止当前服务器（Ctrl+C）
npm run dev
```

### 问题 2：无法获取麦克风权限

**症状**：提示"麦克风权限被拒绝"

**原因**：
- 用户拒绝了权限请求
- 浏览器设置中禁用了麦克风
- 非 HTTPS 环境（生产环境）

**解决方案**：

**Chrome**：
1. 点击地址栏左侧的锁图标或感叹号
2. 点击"网站设置"
3. 找到"麦克风"设置
4. 选择"允许"
5. 刷新页面

**Firefox**：
1. 点击地址栏左侧的图标
2. 点击"暂时允许"或"始终允许"旁边的 × 
3. 重新加载页面并允许权限

**Edge**：与 Chrome 相同

### 问题 3：识别结果不准确

**原因**：
- 环境噪音过大
- 说话不清晰
- 麦克风质量差
- 距离麦克风太远

**优化建议**：
1. 在安静的环境中测试
2. 说话清晰，语速适中
3. 使用质量较好的麦克风或耳机
4. 保持与麦克风 15-30cm 的距离
5. 说普通话（当前配置为 mandarin）

### 问题 4：没有识别结果

**检查步骤**：

1. **查看控制台**
   - 是否有错误信息？
   - 是否显示"发送音频数据"？
   - 是否显示"收到识别结果"？

2. **检查麦克风**
   - 打开系统设置检查麦克风是否工作
   - 尝试在其他应用中使用麦克风
   - 确认选择了正确的麦克风设备

3. **检查网络**
   - WebSocket 连接是否稳定？
   - 网络延迟是否过高？

4. **检查 API**
   - 科大讯飞账号是否正常？
   - 是否超出配额限制？
   - API Key 是否过期？

### 问题 5：识别延迟过高

**原因**：
- 网络延迟
- 音频数据包太小或太大
- 服务器负载高

**优化方案**：
1. 调整音频帧大小（在 `audio-recorder.ts` 中）
2. 检查网络连接质量
3. 选择离您更近的服务器区域

---

## 📊 API 使用说明

### 免费配额

- **语音听写**: 500 万字符/年
- **每日限制**: 5000 次请求
- **并发限制**: 2 路

### 配额查看

1. 登录科大讯飞控制台
2. 进入"我的应用"
3. 查看应用详情中的"用量统计"

### 超出配额

如果提示超出配额：
1. 检查是否还有免费额度
2. 考虑升级到付费版本
3. 优化使用频率（添加限流）

---

## 🎯 集成到实际功能

### 在创建旅行计划表单中使用

```typescript
import { VoiceInput } from '@/components/features/voice/voice-input';

function CreatePlanForm() {
  const [destination, setDestination] = useState('');
  
  return (
    <div>
      <Input
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="目的地"
      />
      
      {/* 添加语音输入 */}
      <VoiceInput onResult={setDestination} />
    </div>
  );
}
```

### 仅使用语音按钮

```typescript
import { useVoiceRecognition } from '@/hooks/use-voice-recognition';
import { VoiceButton } from '@/components/features/voice/voice-button';

function MyComponent() {
  const { status, text, startRecognition, stopRecognition } = useVoiceRecognition();
  
  return (
    <VoiceButton
      status={status}
      onStart={startRecognition}
      onStop={stopRecognition}
    />
  );
}
```

---

## 💡 最佳实践

### 1. 用户体验

- ✅ 提供清晰的状态反馈
- ✅ 显示麦克风权限说明
- ✅ 提供文字输入作为备选方案
- ✅ 限制录音时长（避免浪费配额）

### 2. 错误处理

- ✅ 捕获所有可能的错误
- ✅ 提供友好的错误提示
- ✅ 自动清理资源
- ✅ 支持重试机制

### 3. 性能优化

- ✅ 及时关闭 WebSocket 连接
- ✅ 停止录音后释放麦克风
- ✅ 避免内存泄漏
- ✅ 防抖和节流

### 4. 安全性

- ✅ 不在前端存储敏感信息
- ✅ 使用环境变量管理 API Key
- ✅ 在生产环境使用 HTTPS

---

## 🎊 总结

第三阶段配置完成后，您将拥有：

- ✅ 完整的语音识别功能
- ✅ 实时语音转文字
- ✅ 美观的语音 UI 组件
- ✅ 完善的错误处理
- ✅ 详细的调试日志

**技术栈**：
- 科大讯飞语音听写 API（流式版）
- Web Audio API
- WebSocket
- React Hooks
- TypeScript

**API 地址**：
- WebSocket: `wss://iat-api.xfyun.cn/v2/iat`

---

**恭喜！** 准备好开始第三阶段的开发了！🚀

如有问题，请查看：
- 科大讯飞官方文档：https://www.xfyun.cn/doc/asr/voicedictation/API.html
- 项目完成报告：`docs/STAGE3_COMPLETE.md`

---

**文档版本**: v1.0  
**更新日期**: 2025-10-30  
**适用阶段**: 第三阶段 - 语音输入功能

