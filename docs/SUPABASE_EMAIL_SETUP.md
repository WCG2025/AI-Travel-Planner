# Supabase 邮箱注册配置指南

## 问题：注册时报错 "email signups are disabled"

这是因为 Supabase 项目默认禁用了邮箱注册功能，需要手动启用。

## 解决步骤

### 步骤 1：启用邮箱注册

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 **Authentication**（认证）
4. 点击 **Providers**（提供商）选项卡
5. 找到 **Email** 部分
6. 确保 **Enable Email provider** 开关是 **开启** 状态 ✅

### 步骤 2：禁用邮箱验证（开发环境）

在同一页面中：

1. 找到 **Email** 部分的详细配置
2. **取消勾选** 或 **关闭** 以下选项：
   - ❌ **Confirm email**（确认邮箱）
   - ✅ 确保此选项是 **关闭/未勾选** 状态

### 步骤 3：配置邮件设置（可选）

如果你想要启用邮箱验证（生产环境推荐），需要配置 SMTP：

1. 在 **Authentication** > **Settings** 中
2. 找到 **SMTP Settings**
3. 配置你的邮件服务器（或使用 Supabase 的默认服务）

**开发环境建议**：关闭邮箱验证，方便测试
**生产环境建议**：启用邮箱验证，提高安全性

### 步骤 4：检查配置

确保以下设置正确：

```
Authentication > Providers > Email
├── ✅ Enable Email provider: ON
├── ❌ Confirm email: OFF (开发环境)
└── ✅ Enable email signups: ON
```

### 步骤 5：保存并测试

1. 点击页面底部的 **Save** 按钮
2. 返回你的应用 http://localhost:3000/signup
3. 尝试注册新用户

## 验证配置是否成功

### 测试注册流程

1. 访问 http://localhost:3000/signup
2. 填写表单：
   - 姓名：测试用户
   - 邮箱：test@example.com
   - 密码：123456（至少6位）
3. 点击"注册"按钮

### 预期结果

- ✅ 显示注册成功提示
- ✅ 自动跳转到登录页
- ✅ 可以直接登录（无需验证邮箱）

### 如果仍然报错

#### 错误 1：email signups are disabled
**原因**：Email provider 未启用
**解决**：确保 "Enable Email provider" 开关是开启状态

#### 错误 2：Email rate limit exceeded
**原因**：短时间内注册太多次
**解决**：等待几分钟后重试，或使用不同的邮箱

#### 错误 3：Invalid email
**原因**：邮箱格式不正确
**解决**：使用有效的邮箱格式（例如：user@example.com）

## 生产环境配置建议

当项目上线时，应该：

1. ✅ **启用** Confirm email（邮箱验证）
2. ✅ 配置自定义 SMTP 服务器
3. ✅ 自定义邮件模板（品牌化）
4. ✅ 设置邮件发送频率限制
5. ✅ 启用 reCAPTCHA（防止机器人注册）

## 其他认证选项

Supabase 还支持其他登录方式：

### 社交登录
- Google OAuth
- GitHub OAuth
- Facebook Login
- 等等...

### 配置方法
在 **Authentication** > **Providers** 中启用相应的社交登录选项

## 常见问题

### Q: 用户注册后在哪里查看？
A: Supabase Dashboard > Authentication > Users

### Q: 如何手动验证用户邮箱？
A: 在 Users 列表中，点击用户，手动修改 `email_confirmed_at` 字段

### Q: 如何删除测试用户？
A: 在 Users 列表中，点击用户右侧的删除按钮

### Q: 如何重置用户密码？
A: 用户可以在登录页点击"忘记密码"链接

## 安全建议

⚠️ **重要提示**：

- 开发环境可以关闭邮箱验证，方便测试
- 生产环境务必开启邮箱验证，保护用户账户安全
- 定期检查 Supabase 的安全设置
- 使用强密码策略
- 启用双因素认证（2FA）

## 参考链接

- [Supabase 认证文档](https://supabase.com/docs/guides/auth)
- [邮箱认证配置](https://supabase.com/docs/guides/auth/auth-email)
- [SMTP 配置指南](https://supabase.com/docs/guides/auth/auth-smtp)

---

**配置完成后，请重新测试注册功能！** 🎉

