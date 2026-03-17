# Gift Buy Buy - 高端商务礼品平台

## 项目简介
Gift Buy Buy 是一个专业的跨国商务礼品服务平台，为客户提供高品质的礼品选择和全球配送服务。支持国内外双向送礼需求。

本地验证：
http-server -p 8000
打开浏览器访问 http://localhost:8000

开发者工具强制刷新
Ctrl + Shift + R (Windows) 

## 功能特性
- 🌍 跨国礼品配送服务
- 🎁 多样化礼品分类选择
- 📱 响应式设计，支持多设备
- 🔐 用户登录注册系统
- 🛒 完整的购物流程
- 📦 全球物流跟踪支持

## 技术栈
- 前端：HTML5, CSS3, JavaScript
- 样式：原生CSS（无框架依赖）
- 部署：Vercel/Netlify静态托管

## 项目结构

├── index.html
├── css/
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── pages.css
│   └── responsive.css
├── js/
│   ├── config.js
│   ├── api.js
│   ├── auth.js
│   ├── products.js
│   ├── navigation.js
│   ├── forms.js
│   └── main.js
└── images/
    ├── 1.png
    ├── 2.png
    ├── 3.png
    ├── 4.png
    └── background.jpg






    💳 Stripe 测试信用卡号

以下是常用的 Stripe 测试卡号，您可以在支付表单中直接使用：

成功支付测试卡号

卡号

	

品牌

	

CVC

	

到期日

	

测试场景




4242 4242 4242 4242

	

Visa

	

任意3位

	

未来日期

	

支付成功




4000 0566 5566 5556

	

Visa

	

任意3位

	

未来日期

	

支付成功




5555 5555 5555 4444

	

Mastercard

	

任意3位

	

未来日期

	

支付成功




2223 0000 4841 0010

	

Mastercard

	

任意3位

	

未来日期

	

支付成功




3782 822463 10005

	

American Express

	

任意4位

	

未来日期

	

支付成功

特定场景测试卡号

卡号

	

品牌

	

测试场景




4000 0000 0000 9995

	

Visa

	

支付失败（余额不足）




4000 0000 0000 0069

	

Visa

	

过期卡




4000 0000 0000 0127

	

Visa

	

需要3D Secure验证




4000 0000 0000 3220

	

Visa

	

需要额外验证




4000 0000 0000 0028

	

Visa

	

需要邮编验证

3D Secure 测试卡号

卡号

	

品牌

	

3D Secure状态




4000 0025 0000 3155

	

Visa

	

验证成功




4000 0027 6000 3184

	

Visa

	

验证失败




4000 0084 0000 1289

	

Visa

	

需要验证但跳过

🔧 测试环境配置
1. 确保使用测试密钥

在您的后端代码中，确保使用的是 Stripe 测试密钥（以 sk_test_开头）：

javascript
下载
复制
// 测试环境配置
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// 确保 STRIPE_SECRET_KEY 是测试密钥：sk_test_xxxx
2. 前端测试模式

如果您使用 Stripe Elements 或 Checkout：

javascript
下载
复制
// Stripe.js 初始化
const stripe = Stripe('pk_test_xxxx'); // 使用测试公钥
3. 测试 Webhook

您已经在使用的 Webhook 测试地址：

复制
https://gift-shop-backend-production.up.railway.app/api/payment/stripe/webhook
🎯 测试流程建议
步骤1：使用测试卡号支付

在您的支付页面，填写测试卡号：4242 4242 4242 4242

任意未来日期（如 12/34）

任意 CVC（如 123）

任意邮编（如 12345）

步骤2：触发不同场景

支付成功：使用 4242 4242 4242 4242

支付失败：使用 4000 0000 0000 9995

需要验证：使用 4000 0000 0000 3220

步骤3：查看测试数据

在 Stripe Dashboard
中：

切换到 Test Mode（右上角）

查看 Payments​ 页面

查看 Events​ 页面（所有 Webhook 事件）