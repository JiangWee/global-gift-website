// i18n-manager.js - 国际化管理器
class I18nManager {
    constructor() {
        this.currentLang = localStorage.getItem('preferredLanguage') || 'zh';
        this.resources = I18N_RESOURCES;
        this.onLanguageChangeCallbacks = [];
        
        // 🔥 新增：货币配置
        this.currencyConfig = {
            'zh': {
                code: 'CNY',
                symbol: '¥',
                exchangeRate: 1, // 基准为人民币
                decimalPlaces: 2,
                thousandsSeparator: ',',
                decimalSeparator: '.',
                position: 'before' // 符号位置: before/after
            },
            'en': {
                code: 'USD',
                symbol: '$',
                exchangeRate: 0.14, // 假设 1 CNY = 0.14 USD，请根据实际汇率调整
                decimalPlaces: 2,
                thousandsSeparator: ',',
                decimalSeparator: '.',
                position: 'before'
            }
        };
        
        this.currentCurrency = this.currencyConfig[this.currentLang];
    }

    formatOrderPrice(order) {
        // 优先使用订单创建时的 display_price
        if (order.displayPrice) {
            return this.formatFixedPrice(order.displayPrice, order.currency);
        }
        
        // 备用：根据订单创建时的汇率计算
        if (order.currency === 'USD' && order.exchangeRate) {
            const usdPrice = order.price * order.exchangeRate;
            return this.formatFixedPrice(usdPrice, 'USD');
        }
        
        // 默认显示人民币
        return this.formatFixedPrice(order.price, 'CNY');
    }

    formatFixedPrice(amount, currency) {
        // 1. 尝试通过货币代码直接获取配置
        let config = this.getCurrencyConfigByCode(currency);
        
        if (!config) {
            console.warn(`⚠️ 未找到货币 ${currency} 的配置，使用当前货币配置`);
            // 2. 如果找不到，使用当前货币配置
            config = this.currentCurrency;
        }
        
        if (!config) {
            console.error(`❌ 无法获取货币配置，使用默认配置`);
            // 3. 终极fallback
            config = {
                decimalPlaces: 2,
                symbol: currency === 'USD' ? '$' : '¥',
                position: 'before'
            };
        }
        
        const formatted = amount.toFixed(config.decimalPlaces);
        
        if (config.position === 'before') {
            return `${config.symbol} ${formatted}`;
        } else {
            return `${formatted} ${config.symbol}`;
        }
    }

    getCurrencyConfigByCode(currencyCode) {
        // 检查所有货币配置，找到匹配的
        for (const lang in this.currencyConfig) {
            const config = this.currencyConfig[lang];
            if (config.code === currencyCode) {
                return config;
            }
        }
        
        // 如果没有找到，创建一个默认配置
        if (currencyCode === 'USD') {
            return {
                code: 'USD',
                symbol: '$',
                exchangeRate: 0.14,
                decimalPlaces: 2,
                thousandsSeparator: ',',
                decimalSeparator: '.',
                position: 'before'
            };
        } else if (currencyCode === 'CNY') {
            return {
                code: 'CNY',
                symbol: '¥',
                exchangeRate: 1.0,
                decimalPlaces: 2,
                thousandsSeparator: ',',
                decimalSeparator: '.',
                position: 'before'
            };
        }
        
        return null;
    }

    onLanguageChange(callback) {
        if (typeof callback === 'function') {
            this.onLanguageChangeCallbacks.push(callback);
        }
    }

    // 设置语言
    setLanguage(lang) {
        if (this.resources[lang]) {
            this.currentLang = lang;
            localStorage.setItem('preferredLanguage', lang);
            
            // 🔥 新增：更新货币设置
            this.currentCurrency = this.currencyConfig[lang];
            
            this.updatePageText();
            this.updateLanguageButtons();
            this.updateDirection(lang);
            
            // 🔥 新增：触发货币更新回调
            this.onLanguageChangeCallbacks.forEach(cb => cb(lang));
            console.log('🔄 语言和货币已切换至:', lang, this.currentCurrency.code);
        }
    }

        // 🔥 新增：格式化货币金额
    formatPrice(priceInCny) {
        const currency = this.currentCurrency;
        const convertedPrice = priceInCny * currency.exchangeRate;
        
        // 格式化为字符串
        let formatted = convertedPrice.toFixed(currency.decimalPlaces);
        
        // 千位分隔符
        if (currency.thousandsSeparator) {
            const parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
            formatted = parts.join(currency.decimalSeparator);
        }
        
        // 添加货币符号
        if (currency.position === 'before') {
            return `${currency.symbol} ${formatted}`;
        } else {
            return `${formatted} ${currency.symbol}`;
        }
    }
    
    // 🔥 新增：获取原始金额（用于后端传递）
    getOriginalAmount(displayPrice) {
        const currency = this.currentCurrency;
        // 移除货币符号和千位分隔符
        let numericString = displayPrice
            .replace(new RegExp(`[${currency.symbol}\\s]`, 'g'), '')
            .replace(new RegExp(currency.thousandsSeparator, 'g'), '');
        
        const amount = parseFloat(numericString);
        // 转换回人民币（后端基准）
        return amount / currency.exchangeRate;
    }
    
    // 🔥 新增：获取当前货币代码
    getCurrentCurrencyCode() {
        return this.currentCurrency.code;
    }

    // 获取翻译文本
    t(key, params = {}) {
        let text = this.resources[this.currentLang][key] || 
                  this.resources['zh'][key] || 
                  key;
        
        // 替换参数
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
        
        return text;
    }

    // 更新页面文本
    updatePageText() {
        // 更新所有带有 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        });

        // 更新所有带有 data-i18n-title 属性的元素
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // 更新动态内容
        this.updateDynamicContent();
    }

    // 更新动态内容
    updateDynamicContent() {
        // 更新导航栏用户状态
        this.updateNavbarText();
        
        // 更新产品相关文本
        this.updateProductsText();
        
        // 更新订单相关文本
        this.updateOrdersText();
        
        // 更新模态框文本
        this.updateModalText();
    }

    // 更新导航栏文本
    updateNavbarText() {
        const userStatus = document.getElementById('userStatus');
        if (userStatus) {
            // 这里可以根据登录状态更新导航栏文本
            const isLoggedIn = !!apiService.token;
            if (isLoggedIn) {
                // 更新已登录状态的文本
                const username = document.querySelector('.username');
                if (username && username.getAttribute('data-i18n')) {
                    username.textContent = this.t(username.getAttribute('data-i18n'));
                }
            }
        }
    }

    // 更新产品相关文本
    updateProductsText() {
        // 更新产品页面标题
        const pageTitle = document.querySelector('.page-title');
        const pageSubtitle = document.querySelector('.page-subtitle');
        
        if (pageTitle && pageTitle.getAttribute('data-i18n')) {
            const key = pageTitle.getAttribute('data-i18n');
            pageTitle.textContent = this.t(key);
        }
        
        if (pageSubtitle && pageSubtitle.getAttribute('data-i18n')) {
            const key = pageSubtitle.getAttribute('data-i18n');
            pageSubtitle.textContent = this.t(key);
        }
    }

    // 更新订单相关文本
    updateOrdersText() {
        // 更新订单状态文本
        document.querySelectorAll('.order-status').forEach(statusEl => {
            const status = statusEl.getAttribute('data-status');
            if (status) {
                statusEl.textContent = this.getStatusText(status);
            }
        });
    }

    // 更新模态框文本
    updateModalText() {
        // 更新登录模态框
        this.updateLoginModalText();
        
        // 更新支付模态框
        this.updatePaymentModalText();
    }

    // 更新登录模态框文本
    updateLoginModalText() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal && loginModal.style.display !== 'none') {
            // 更新登录表单文本
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = this.t(key);
                    } else {
                        el.textContent = this.t(key);
                    }
                }
            });
        }
    }

    // 更新支付模态框文本
    updatePaymentModalText() {
        const paymentModal = document.getElementById('paymentModal');
        if (paymentModal && paymentModal.style.display !== 'none') {
            // 更新支付相关文本
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key) {
                    el.textContent = this.t(key);
                }
            });
        }
    }

    // 获取订单状态文本
    getStatusText(status) {
        const statusMap = {
            'unpaid': this.currentLang === 'zh' ? '未支付' : 'Unpaid',
            'pending': this.currentLang === 'zh' ? '待处理' : 'Pending',
            'shipped': this.currentLang === 'zh' ? '已发货' : 'Shipped',
            'delivered': this.currentLang === 'zh' ? '已送达' : 'Delivered',
            'cancelled': this.currentLang === 'zh' ? '已取消' : 'Cancelled'
        };
        return statusMap[status] || status;
    }

    // 更新语言按钮状态
    updateLanguageButtons() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick').includes(`'${this.currentLang}'`)) {
                btn.classList.add('active');
            }
        });
    }

    // 更新文本方向（RTL支持）
    updateDirection(lang) {
        if (lang === 'ar' || lang === 'he') {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }
    }

    // 获取当前语言
    getCurrentLanguage() {
        return this.currentLang;
    }

    // 更新页面文本（增强版）
    updatePageText() {
        // 更新所有带有 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        });

        // 更新所有带有 data-i18n-placeholder 属性的元素
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const text = this.t(key);
            element.placeholder = text;
        });

        // 更新所有带有 data-i18n-title 属性的元素
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // 更新动态内容
        this.updateDynamicContent();
    }

    // 更新忘记密码页面的动态内容
    updateForgotPasswordText() {
        // 更新验证步骤的邮箱显示
        const verifyEmailDisplay = document.getElementById('verify-email-display-text');
        if (verifyEmailDisplay) {
            const email = document.getElementById('forgot-email')?.value || '';
            const subtitle = this.t('forgot.verify.subtitle', { email: email });
            verifyEmailDisplay.textContent = subtitle;
        }
    }

    // 更新动态内容（增强版）
    updateDynamicContent() {
        // 更新导航栏用户状态
        this.updateNavbarText();

        // 更新产品相关文本
        this.updateProductsText();

        // 更新订单相关文本
        this.updateOrdersText();

        // 更新模态框文本
        this.updateModalText();

        // 更新忘记密码页面文本
        this.updateForgotPasswordText();

        // 🔥 新增：更新产品列表和订单列表的动态内容
        this.updateDynamicLists();
    }

    // 🔥 新增：更新动态列表内容
    updateDynamicLists() {
        // 重新渲染产品列表（如果在产品页面）
        if (document.getElementById('page-gifts')?.classList.contains('active')) {
            console.log('🔄 语言切换：重新渲染产品列表');
            if (typeof renderProducts === 'function') {
                renderProducts();
            }
        }

        // 重新渲染订单列表（如果在订单页面）
        if (document.getElementById('page-orders')?.classList.contains('active')) {
            console.log('🔄 语言切换：重新渲染订单列表');
            if (typeof renderOrdersPage === 'function') {
                renderOrdersPage();
            }
        }

        // 重新渲染产品详情（如果在详情页）
        if (document.getElementById('page-detail')?.classList.contains('active')) {
            console.log('🔄 语言切换：重新渲染产品详情');
            if (typeof currentProduct !== 'undefined' && typeof renderProductDetail === 'function') {
                renderProductDetail(currentProduct);
            }
        }

        // 重新渲染个人中心（如果在个人中心页）
        if (document.getElementById('page-profile')?.classList.contains('active')) {
            console.log('🔄 语言切换：重新渲染个人中心');
            if (typeof renderProfilePage === 'function') {
                renderProfilePage();
            }
        }
    }

    // 更新模态框文本（增强版）
    updateModalText() {
        // 更新登录模态框
        this.updateLoginModalText();
        
        // 更新支付模态框
        this.updatePaymentModalText();
        
        // 更新忘记密码模态框
        this.updateForgotPasswordModalText();
    }

    // 更新忘记密码模态框文本
    updateForgotPasswordModalText() {
        const forgotPasswordPage = document.getElementById('page-forgot-password');
        if (forgotPasswordPage && forgotPasswordPage.classList.contains('active')) {
            // 更新忘记密码页面的文本
            this.updateForgotPasswordText();
        }
    }

    // 初始化
    init() {
        this.updateLanguageButtons();
        this.updatePageText();
    }
}

// 创建全局实例
const i18n = new I18nManager();