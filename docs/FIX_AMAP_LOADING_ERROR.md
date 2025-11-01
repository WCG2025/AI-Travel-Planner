# 修复：高德地图加载失败

## 🐛 问题描述

错误信息：
```
高德地图 API 加载失败：AMap 对象未定义
```

这个错误表示高德地图的 JavaScript 文件虽然加载了，但 `AMap` 全局对象没有正确创建。

---

## 🔍 可能的原因

### 1. API Key 未配置或错误 ⚠️

**最常见的原因！**

**检查方法**：
```bash
# 查看 .env.local 文件
cat .env.local | grep AMAP_KEY
```

**正确配置**：
```env
NEXT_PUBLIC_AMAP_KEY=你的高德地图API_Key
```

**注意事项**：
- ✅ 必须使用 `NEXT_PUBLIC_` 前缀
- ✅ Key 不要有引号
- ✅ 重启开发服务器后生效

---

### 2. API Key 无效或未启用

**症状**：
- API Key 已配置
- 控制台显示 Key 前 8 位
- 但 AMap 对象仍未定义

**排查步骤**：

#### A. 检查 API Key 是否有效

1. 登录 [高德开放平台](https://console.amap.com/)
2. 进入"应用管理" → "我的应用"
3. 找到您的应用，查看 Key 状态
4. 确认状态为"正常"而非"已停用"

#### B. 检查 Key 类型

**高德地图有多种类型的 Key**，确保您申请的是：
- ✅ **Web端（JS API）** Key
- ❌ 不是 Web 服务 API Key
- ❌ 不是 Android/iOS Key

#### C. 重新申请 Key（如果需要）

如果 Key 类型不对，需要重新申请：

1. 进入"应用管理"
2. 点击"创建新应用"
3. 填写应用信息：
   - 应用名称：`AI-Travel-Planner`
   - 应用类型：Web端
4. 添加 Key：
   - 服务平台：**Web端（JS API）**
   - Key 名称：`web-key`
5. 复制新的 Key

---

### 3. 域名白名单限制

**症状**：
- Key 是正确的
- 在高德官网测试正常
- 但在您的项目中加载失败

**原因**：高德地图的 Web Key 需要绑定域名白名单。

**解决方法**：

1. 登录 [高德开放平台](https://console.amap.com/)
2. 进入"应用管理" → 找到您的应用
3. 点击 Key 后的"设置"
4. 在"白名单"中添加：
   ```
   localhost
   127.0.0.1
   你的生产域名（如有）
   ```
5. 保存设置
6. 等待 5-10 分钟生效

**注意**：开发环境建议添加 `localhost` 和 `127.0.0.1`

---

### 4. 网络或防火墙问题

**症状**：
- 控制台显示网络错误
- 无法访问 `webapi.amap.com`

**排查方法**：

#### A. 检查网络连接

在浏览器控制台运行：
```javascript
fetch('https://webapi.amap.com/maps?v=2.0&key=test')
  .then(r => console.log('✅ 可以访问高德地图 API'))
  .catch(e => console.error('❌ 无法访问:', e));
```

#### B. 检查防火墙/代理

- 确认防火墙没有阻止 `webapi.amap.com`
- 如果使用代理，确保配置正确
- 尝试关闭 VPN/代理

#### C. 检查浏览器扩展

- 某些广告拦截器可能阻止地图 API
- 尝试在无痕模式下测试

---

### 5. API 配额已用完

**症状**：
- 之前能用，突然不能用了
- 控制台可能显示配额错误

**检查方法**：

1. 登录 [高德开放平台](https://console.amap.com/)
2. 进入"控制台" → "数据统计"
3. 查看今日调用量
4. 确认是否超过配额

**解决方法**：
- 等待第二天配额重置
- 升级为付费版本
- 申请增加免费配额

---

## ✅ 解决方案步骤

### 第一步：检查环境配置

1. 打开 `.env.local` 文件
2. 确认有这一行：
   ```env
   NEXT_PUBLIC_AMAP_KEY=你的实际Key
   ```
3. 确认没有拼写错误（`AMAP` 不是 `AMAP_KEY`）

### 第二步：验证 API Key

在浏览器中访问（替换YOUR_KEY）：
```
https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY
```

如果返回 JavaScript 代码，说明 Key 有效。  
如果返回错误信息，说明 Key 无效。

### 第三步：重启开发服务器

**非常重要！** `.env.local` 的修改需要重启服务器：

```bash
# 停止当前服务器（Ctrl + C）

# 重新启动
npm run dev
```

### 第四步：清除浏览器缓存

1. 打开浏览器开发者工具（F12）
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

### 第五步：查看详细日志

打开浏览器控制台，应该看到：

**成功的日志**：
```
🗺️ 开始加载高德地图 API...
📝 API Key: 12345678...
📍 加载地址: https://webapi.amap.com/maps?...
✅ 高德地图 API 加载成功
📦 AMap 版本: 2.0
```

**失败的日志**：
```
🗺️ 开始加载高德地图 API...
📝 API Key: 未配置
❌ 高德地图 API 加载失败：AMap 对象未定义
```

---

## 🧪 测试方法

### 方法 1：使用测试页面

创建 `src/app/test-map/page.tsx`：

```tsx
'use client';

import { useEffect, useState } from 'react';
import { loadAMap } from '@/lib/map/amap-loader';

export default function TestMapPage() {
  const [status, setStatus] = useState('未加载');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_AMAP_KEY;
    
    if (!apiKey) {
      setStatus('失败');
      setError('API Key 未配置');
      return;
    }

    setStatus('加载中...');
    
    loadAMap({ key: apiKey })
      .then((amap) => {
        setStatus('成功');
        console.log('✅ AMap 加载成功:', amap);
      })
      .catch((err) => {
        setStatus('失败');
        setError(err.message);
        console.error('❌ AMap 加载失败:', err);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">高德地图加载测试</h1>
      
      <div className="space-y-4">
        <div>
          <strong>API Key 配置：</strong>
          {process.env.NEXT_PUBLIC_AMAP_KEY ? (
            <span className="text-green-600">✅ 已配置（{process.env.NEXT_PUBLIC_AMAP_KEY.substring(0, 8)}...）</span>
          ) : (
            <span className="text-red-600">❌ 未配置</span>
          )}
        </div>
        
        <div>
          <strong>加载状态：</strong>
          <span className={
            status === '成功' ? 'text-green-600' :
            status === '失败' ? 'text-red-600' :
            'text-yellow-600'
          }>
            {status}
          </span>
        </div>
        
        {error && (
          <div className="text-red-600">
            <strong>错误信息：</strong>
            <pre className="mt-2 p-4 bg-red-50 rounded">{error}</pre>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p>查看浏览器控制台以获取详细日志。</p>
        </div>
      </div>
    </div>
  );
}
```

访问 `http://localhost:3000/test-map` 进行测试。

### 方法 2：控制台直接测试

在浏览器控制台运行：

```javascript
// 检查环境变量
console.log('NEXT_PUBLIC_AMAP_KEY:', 
  process.env.NEXT_PUBLIC_AMAP_KEY ? 
  process.env.NEXT_PUBLIC_AMAP_KEY.substring(0, 8) + '...' : 
  '未配置'
);

// 手动加载地图
const script = document.createElement('script');
script.src = 'https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY';
script.onload = () => console.log('AMap:', window.AMap);
script.onerror = () => console.error('加载失败');
document.head.appendChild(script);
```

---

## 📋 完整检查清单

- [ ] `.env.local` 文件存在
- [ ] `NEXT_PUBLIC_AMAP_KEY` 已配置
- [ ] API Key 拼写正确（前缀是 `NEXT_PUBLIC_`）
- [ ] API Key 是 Web端（JS API）类型
- [ ] API Key 状态为"正常"
- [ ] 域名已添加到白名单（localhost）
- [ ] 已重启开发服务器
- [ ] 已清除浏览器缓存
- [ ] 网络连接正常
- [ ] 无防火墙阻止
- [ ] 浏览器控制台无其他错误

---

## 🆘 仍然无法解决？

### 选项 1：使用临时测试 Key

高德地图提供了测试 Key（有限制）：

```env
# 仅用于测试，不要在生产环境使用
NEXT_PUBLIC_AMAP_KEY=你申请的开发者Key
```

### 选项 2：联系高德技术支持

1. 访问 [高德开放平台帮助中心](https://lbs.amap.com/faq/)
2. 提交工单
3. 提供：
   - 应用 ID
   - Key 信息
   - 错误截图
   - 控制台日志

### 选项 3：查看高德地图状态

访问 [高德地图服务状态](https://lbs.amap.com/) 确认服务是否正常。

---

## 📞 常见问题 FAQ

### Q: 我的 Key 在高德官方示例中能用，为什么在我的项目中不行？

**A**: 检查域名白名单。官方示例使用的是高德自己的域名，您的项目域名需要单独添加。

### Q: 本地开发可以，部署后就不行了？

**A**: 检查生产环境的域名是否添加到白名单，确认环境变量正确配置。

### Q: 报错"INVALID_USER_KEY"？

**A**: Key 无效或未启用，请在控制台检查 Key 状态。

### Q: 报错"DAILY_QUERY_OVER_LIMIT"？

**A**: 今日配额已用完，等待第二天重置或升级套餐。

---

**修复完成后，刷新页面并检查控制台日志！** 🗺️✨

