// forms.js - 表单处理
function showLogin() {
    document.getElementById('loginModal').style.display = 'flex';
}

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

function login() {
    const account = document.getElementById('login-account').value;
    const password = document.getElementById('login-password').value;
    
    if (!account || !password) {
        alert('请输入账号和密码');
        return;
    }
    
    console.log('登录信息:', { account, password });
    alert('登录成功！');
    document.getElementById('loginModal').style.display = 'none';
}

function register() {
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
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
    
    console.log('注册信息:', { email, phone, password });
    alert('注册成功！');
    document.getElementById('loginModal').style.display = 'none';
}

function updateCharCount() {
    const textarea = document.getElementById('gift-card-text');
    const count = textarea.value.length;
    document.querySelector('.char-count').textContent = `${count}/180`;
    
    if (count > 180) {
        textarea.value = textarea.value.substring(0, 180);
        document.querySelector('.char-count').textContent = '180/180';
    }
}

function updateFilters() {
    const country = document.getElementById('country').value;
    const holiday = document.getElementById('holiday').value;
    const deliveryDate = document.getElementById('delivery-date').value;
    
    console.log('筛选条件更新:', { country, holiday, deliveryDate });
}