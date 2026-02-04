// i18n-manager.js - 国际化管理器
class I18nManager {
    constructor() {
        this.currentLang = localStorage.getItem('preferredLanguage') || 'zh';
        this.resources = I18N_RESOURCES;
        this.onLanguageChangeCallbacks = [];
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

            this.updatePageText();
            this.updateLanguageButtons();
            this.updateDirection(lang);

            this.onLanguageChangeCallbacks.forEach(cb => cb(lang));
            console.log('🔄 setLanguage after onLanguageChangeCallbacks');
        }
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