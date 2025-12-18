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

// forms.js - 表单处理（更新版）
async function login() {
    const identifier = document.getElementById('login-account').value;
    const password = document.getElementById('login-password').value;
    
    if (!identifier || !password) {
        showMessage('请输入账号和密码', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await apiService.login({ identifier, password });
        
        if (result.success) {
            apiService.setToken(result.data.token);
            showMessage('登录成功！', 'success');
            document.getElementById('loginModal').style.display = 'none';
            updateUserStatus();
        } else {
            showMessage(result.error || '登录失败', 'error');
        }
    } catch (error) {
        showMessage('登录请求失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

async function register() {
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    if (!email || !phone || !password || !confirm) {
        showMessage('请填写所有必填字段', 'error');
        return;
    }
    
    if (password !== confirm) {
        showMessage('两次输入的密码不一致', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('密码长度至少6位', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await apiService.register({ email, phone, password, confirm });
        
        if (result.success) {
            showMessage('注册成功！请登录', 'success');
            switchLoginTab('login');
        } else {
            showMessage(result.error || '注册失败', 'error');
        }
    } catch (error) {
        showMessage('注册请求失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 显示消息提示
function showMessage(message, type = 'info') {
    // 移除现有的消息
    const existingMessage = document.querySelector('.message-toast');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `message-toast message-${type}`;
    messageEl.textContent = message;
    
    // 添加样式
    messageEl.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    const backgroundColor = type === 'success' ? '#38a169' : 
                           type === 'error' ? '#e53e3e' : 
                           type === 'warning' ? '#dd6b20' : '#3182ce';
    
    messageEl.style.background = backgroundColor;
    
    document.body.appendChild(messageEl);
    
    // 3秒后自动消失
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}

// 字符计数更新
function updateCharCount() {
    const textarea = document.getElementById('gift-card-text');
    const charCount = document.querySelector('.char-count');
    
    if (textarea && charCount) {
        const count = textarea.value.length;
        charCount.textContent = `${count}/180`;
        
        if (count > 180) {
            charCount.style.color = '#e53e3e';
        } else {
            charCount.style.color = '#999';
        }
    }
}