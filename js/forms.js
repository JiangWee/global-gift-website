// forms.js - 表单处理

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    // 清空表单
    document.getElementById('login-account').value = '';
    document.getElementById('login-password').value = '';
    // 新增清空用户名字段
    document.getElementById('register-username').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-phone').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-confirm').value = '';
}

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

async function login() {
    const identifier = document.getElementById('login-account').value;
    const password = document.getElementById('login-password').value;
    
    if (!identifier || !password) {
        showMessage('请输入账号和密码', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('发送登录请求:', { identifier, password });
        const result = await apiService.login({ identifier, password });
        console.log('登录API返回结果:', result);

        if (result.success) {
            // 检查数据结构
            console.log('result.data.data:', result.data.data);
            console.log('result.data.user:', result.data.user);
            console.log('result.data.accessToken:', result.data.accessToken);
            console.log('result.data.refreshToken:', result.data.refreshToken);
            
            // 修复：使用正确的字段名
            if (result.data.data.accessToken) {
                apiService.setToken(result.data.accessToken);
                console.log('Token已设置');
            } else {
                console.warn('accessToken不存在，使用token字段');
                apiService.setToken(result.data.token);
            }
            
            showMessage('登录成功！', 'success');
            closeLoginModal();
            
            // 保存用户信息并更新导航栏
            if (result.data.data.user) {
                console.log('保存用户信息:', result.data.data.user);
                updateUserInfo(result.data.data.user);
            } 
        } else {
            // 特殊处理用户不存在的提示
            showMessage(result.error, 'error');
        }
    } catch (error) {
        console.error('登录请求错误:', error);
    } finally {
        showLoading(false);
    }
}

async function register() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    if (!username || !email || !phone || !password || !confirm) {
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
    
    // 用户名验证
    if (username.length < 2 || username.length > 20) {
        showMessage('用户名长度2-20个字符', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await apiService.register({ username, email, phone, password, confirm });
        
        if (result.success) {
            showMessage('注册成功！请登录', 'success');
            switchLoginTab('login');
            
            // 注册成功后自动填充登录表单
            document.getElementById('login-account').value = username;
        } else {
            // 处理重复账号的错误提示
            if (result.message.includes('用户名') || result.message.includes('邮箱') || result.message.includes('手机号')) {
                showMessage(result.message, 'error');
            } else {
                showMessage(result.message || '注册失败', 'error');
            }
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


// 联系表单处理
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactSubmit();
        });
    }
});

function handleContactSubmit() {
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value;
    
    if (!name || !email || !subject || !message) {
        showMessage('请填写所有必填字段', 'error');
        return;
    }
    
    // 模拟发送消息（实际项目中应该调用API）
    showMessage('消息发送成功！我们会尽快回复您。', 'success');
    
    // 清空表单
    document.getElementById('contactForm').reset();
}