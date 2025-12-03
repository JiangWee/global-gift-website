// 页面导航功能
function goToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
}

// 语言设置
function setLanguage(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 在实际应用中，这里会根据选择的语言加载对应的语言包
    if (lang === 'en') {
        alert('Language switched to English');
        // 这里可以添加英文内容切换逻辑
    } else {
        alert('已切换到中文');
        // 这里可以添加中文内容切换逻辑
    }
}

// 分类选择
function selectCategory(category) {
    // 这里可以添加分类筛选逻辑
    console.log('选择了分类:', category);
    goToPage('page-gifts');
}

// 查看礼品详情
function viewGiftDetail(id) {
    // 这里可以添加根据ID加载不同礼品详情的逻辑
    console.log('查看礼品详情 ID:', id);
    goToPage('page-detail');
}

// 标签切换
function switchTab(tabId) {
    document.querySelectorAll('.tab-header').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// 显示登录模态框
function showLogin() {
    document.getElementById('loginModal').style.display = 'flex';
}

// 切换登录/注册标签
function switchLoginTab(tab) {
    document.querySelectorAll('.login-tab').forEach(t => {
        t.classList.remove('active');
    });
    document.querySelectorAll('.login-form').forEach(form => {
        form.classList.remove('active');
    });
    
    if (tab === 'login') {
        document.querySelector('.login-tab:first-child').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelector('.login-tab:last-child').classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

// 登录功能
function login() {
    const account = document.getElementById('login-account').value;
    const password = document.getElementById('login-password').value;
    
    // 简单的表单验证
    if (!account || !password) {
        alert('请输入账号和密码');
        return;
    }
    
    // 实际应用中这里会有登录验证逻辑
    console.log('登录信息:', { account, password });
    alert('登录成功！');
    document.getElementById('loginModal').style.display = 'none';
}

// 注册功能
function register() {
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    // 表单验证
    if (!email || !phone || !password || !confirm) {
        alert('请填写所有必填字段');
        return;
    }
    
    if (password !== confirm) {
        alert('两次输入的密码不一致');
        return;
    }
    
    if (password.length < 6) {
        alert('密码长度至少6位');
        return;
    }
    
    // 实际应用中这里会有注册逻辑
    console.log('注册信息:', { email, phone, password });
    alert('注册成功！');
    document.getElementById('loginModal').style.display = 'none';
}

// 更新字符计数
function updateCharCount() {
    const textarea = document.getElementById('gift-card-text');
    const count = textarea.value.length;
    document.querySelector('.char-count').textContent = `${count}/180`;
    
    // 限制最大字符数
    if (count > 180) {
        textarea.value = textarea.value.substring(0, 180);
        document.querySelector('.char-count').textContent = '180/180';
    }
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// 表单提交处理
document.addEventListener('DOMContentLoaded', function() {
    // 设置默认送达日期为7天后
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    document.getElementById('delivery-date').valueAsDate = nextWeek;
    
    // 购买表单提交
    const finalBuyBtn = document.querySelector('.final-buy-btn');
    if (finalBuyBtn) {
        finalBuyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 表单验证
            const buyerName = document.getElementById('buyer-name').value;
            const buyerPhone = document.getElementById('buyer-phone').value;
            const recipientName = document.getElementById('recipient-name').value;
            const recipientStreet = document.getElementById('recipient-street').value;
            
            if (!buyerName || !buyerPhone || !recipientName || !recipientStreet) {
                alert('请填写完整的必填信息');
                return;
            }
            
            // 实际应用中这里会有订单提交逻辑
            alert('订单提交成功！我们将尽快处理您的订单。');
            
            // 清空表单
            document.querySelector('.checkout-form').reset();
            updateCharCount();
        });
    }
    
    // 筛选表单处理
    const countrySelect = document.getElementById('country');
    const holidaySelect = document.getElementById('holiday');
    const deliveryDate = document.getElementById('delivery-date');
    
    if (countrySelect && holidaySelect && deliveryDate) {
        // 可以添加筛选逻辑
        countrySelect.addEventListener('change', updateFilters);
        holidaySelect.addEventListener('change', updateFilters);
        deliveryDate.addEventListener('change', updateFilters);
    }
});

// 筛选更新函数
function updateFilters() {
    const country = document.getElementById('country').value;
    const holiday = document.getElementById('holiday').value;
    const deliveryDate = document.getElementById('delivery-date').value;
    
    console.log('筛选条件更新:', { country, holiday, deliveryDate });
    
    // 实际应用中这里可以根据筛选条件更新礼品列表
}

// 页面加载完成后的初始化
window.addEventListener('load', function() {
    console.log('Global Gift网站加载完成');
    
    // 可以添加更多的初始化逻辑
    // 比如检查用户登录状态、加载用户数据等
});

// 响应式导航菜单（移动端）
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// 添加窗口调整大小时的响应式处理
window.addEventListener('resize', function() {
    // 可以添加响应式布局的调整逻辑
});
