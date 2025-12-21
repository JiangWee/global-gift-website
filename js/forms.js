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
    // 处理特定的错误消息
    if (type === 'error') {
        // 如果是验证码相关的错误，可以特殊处理
        if (message.includes('验证码') || message.includes('验证')) {
            console.warn('验证码错误:', message);
        }
        // 如果是网络错误
        if (message.includes('网络') || message.includes('连接')) {
            console.error('网络连接错误:', message);
        }
    }

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

// 忘记密码相关功能
let verificationCode = '';
let resetToken = '';
let codeExpiryTime = 0;
let countdownInterval = null;
let currentEmail = '';

// 修改切换步骤函数，确保重置状态
function switchForgotPasswordStep(stepId) {
    // 隐藏所有步骤
    document.querySelectorAll('.forgot-password-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // 显示目标步骤
    const targetStep = document.getElementById(stepId);
    if (targetStep) {
        targetStep.classList.add('active');
    }
    
    // 特殊处理
    if (stepId === 'step-verify') {
        startCountdown();
    } else if (stepId === 'step-email') {
        // 重置到第一步时清理数据
        stopCountdown();
        verificationCode = '';
        resetToken = '';
    }
}

// 发送验证码
async function sendVerificationCode() {
    const email = document.getElementById('forgot-email').value;
    
    if (!email) {
        showMessage('请输入邮箱地址', 'error');
        return;
    }
    
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('请输入有效的邮箱地址', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await apiService.sendForgotPasswordCode(email);
        
        if (result.success) {
            // 保存当前邮箱
            currentEmail = email;
            
            // 显示验证步骤
            document.getElementById('verify-email-display').textContent = email;
            switchForgotPasswordStep('step-verify');
            
            // 设置验证码过期时间（10分钟）
            codeExpiryTime = Date.now() + 10 * 60 * 1000;
            startCountdown();
            
            showMessage(result.message || '验证码已发送到您的邮箱', 'success');
            
            // 开发环境下显示验证码（方便测试）
            if (result.data && result.data.verificationCode) {
                console.log('开发环境验证码:', result.data.verificationCode);
            }

        } else {
            showMessage(result.message || '发送验证码失败', 'error');
        }
        
    } catch (error) {
        showMessage('发送验证码失败，请稍后重试', 'error');
    } finally {
        showLoading(false);
    }
}

// 开始倒计时
function startCountdown() {
    stopCountdown(); // 清除之前的计时器
    
    const countdownEl = document.getElementById('countdown');
    const resendBtn = document.getElementById('resend-btn');
    
    function updateCountdown() {
        const now = Date.now();
        const timeLeft = codeExpiryTime - now;
        
        if (timeLeft <= 0) {
            stopCountdown();
            countdownEl.textContent = '00:00';
            countdownEl.classList.add('expired');
            resendBtn.disabled = false;
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        countdownEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// 停止倒计时
function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// 重新发送验证码（修改后）
function resendCode() {
    const resendBtn = document.getElementById('resend-btn');
    resendBtn.disabled = true;
    
    // 清除之前的验证码和计时器
    verificationCode = '';
    stopCountdown();
    
    sendVerificationCode();
}

// 验证验证码（修改后）
async function verifyCode() {
    const inputCode = document.getElementById('verification-code').value;
    
    if (!inputCode) {
        showMessage('请输入验证码', 'error');
        return;
    }
    
    if (inputCode.length !== 6) {
        showMessage('验证码必须是6位数字', 'error');
        return;
    }
    
    // 检查验证码是否过期
    if (Date.now() > codeExpiryTime) {
        showMessage('验证码已过期，请重新获取', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await apiService.verifyForgotPasswordCode(currentEmail, inputCode);
        
        if (result.success) {
            // 保存重置令牌
            resetToken = result.data.resetToken;
            console.log('重置令牌已保存:', resetToken);
            
            showMessage('验证成功', 'success');
            switchForgotPasswordStep('step-reset');
        } else {
            showMessage(result.message || '验证码错误', 'error');
        }
    } catch (error) {
        console.error('验证验证码失败:', error);
        showMessage('验证失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 重置密码（修改后）
async function resetPassword() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    const resetTokenInput = document.getElementById('reset-token');
    
    // 从隐藏字段获取令牌（如果使用隐藏字段）
    const tokenToUse = resetTokenInput ? resetTokenInput.value : resetToken;
    
    if (!tokenToUse) {
        showMessage('重置令牌无效，请重新验证', 'error');
        return;
    }
    
    if (!newPassword || !confirmPassword) {
        showMessage('请填写新密码和确认密码', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('密码长度至少6位', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('两次输入的密码不一致', 'error');
        return;
    }
    
    if (!resetToken) {
        showMessage('重置令牌无效，请重新验证', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await apiService.resetPasswordWithToken(resetToken, newPassword);
        
        if (result.success) {
            showMessage('密码重置成功！', 'success');
            
            // 显示成功页面
            switchForgotPasswordStep('step-complete');
            
            // 清理数据
            resetToken = '';
            verificationCode = '';
            currentEmail = '';
            stopCountdown();
            
        } else {
            showMessage(result.message || '密码重置失败', 'error');
        }
    } catch (error) {
        console.error('密码重置失败:', error);
        showMessage('密码重置失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 修改登录模态框中的忘记密码链接
function initForgotPassword() {
    // 确保忘记密码链接正确跳转
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.onclick = function(e) {
            e.preventDefault();
            closeLoginModal();
            goToPage('page-forgot-password');
        };
    }
}

// 在页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initForgotPassword();
});