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
    // 确保模态框文本正确更新
    setTimeout(() => {
        i18n.updateModalText();
    }, 100);
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
        showMessage(i18n.t('login.required'), 'error');
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
            
            if (result.data.accessToken) {
                apiService.setToken(result.data.accessToken);
                console.log('Token已设置');
            } else {
                console.warn('accessToken不存在，使用token字段');
                apiService.setToken(result.data.token);
            }

            showMessage(i18n.t('login.success'), 'success');
            closeLoginModal();
            
            // 保存用户信息并更新导航栏
            if (result.data.user) {
                console.log('保存用户信息:', result.data.user);
                updateUserInfo(result.data.user);
            }
        } else {
            // 特殊处理用户不存在的提示
            showMessage(result.message || i18n.t('login.failed'), 'error');
        }
    } catch (error) {
        console.error('登录请求错误:', error);
        showMessage(error.message || i18n.t('login.network'), 'error');
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
        showMessage(i18n.t('register.required'), 'error');
        return;
    }

    if (password !== confirm) {
        showMessage(i18n.t('register.mismatch'), 'error');
        return;
    }

    if (password.length < 6) {
        showMessage(i18n.t('register.length'), 'error');
        return;
    }

    // 用户名验证
    if (username.length < 2 || username.length > 20) {
        showMessage(i18n.t('register.username.length'), 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await apiService.register({ username, email, phone, password, confirm });
        
        if (result.success) {
            showMessage(i18n.t('register.success'), 'success');
            switchLoginTab('login');

            // 注册成功后自动填充登录表单
            document.getElementById('login-account').value = username;
        } else {
            // 处理重复账号的错误提示
            if (result.message.includes('用户名') || result.message.includes('邮箱') || result.message.includes('手机号')) {
                showMessage(result.message, 'error');
            } else {
                showMessage(result.message || i18n.t('register.failed'), 'error');
            }
        }
    } catch (error) {
        showMessage(i18n.t('register.network'), 'error');
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
        showMessage(i18n.t('contact.required'), 'error');
        return;
    }

    // 模拟发送消息（实际项目中应该调用API）
    showMessage(i18n.t('contact.success'), 'success');

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
        // 切换到验证步骤时，确保重新发送按钮状态正确
        const resendBtn = document.getElementById('resend-btn');
        if (resendBtn) {
            resendBtn.disabled = false;
            resendBtn.textContent = i18n.t('forgot.verify.resend');
        }
    } else if (stepId === 'step-email') {
        // 重置到第一步时清理数据并恢复按钮状态
        stopCountdown();
        verificationCode = '';
        resetToken = '';
        enableVerificationButtons();
    }
}

// 发送验证码
async function sendVerificationCode() {
    const email = document.getElementById('forgot-email').value;
    const sendBtn = document.querySelector('#step-email .next-btn'); // 获取发送按钮
    const resendBtn = document.getElementById('resend-btn'); // 重新发送按钮

    if (!email) {
        showMessage(i18n.t('forgot.email.required'), 'error');
        return;
    }
    
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage(i18n.t('forgot.email.inputValidEmail'), 'error');
        return;
    }
    
    // 禁用按钮
    if (sendBtn) sendBtn.disabled = true;
    if (resendBtn) resendBtn.disabled = true;
    
    // 更新按钮文本（可选）
    if (sendBtn) sendBtn.textContent = i18n.t('forgot.sending');
    if (resendBtn) resendBtn.textContent = i18n.t('forgot.sending');

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
            
            if (sendBtn) sendBtn.textContent = i18n.t('forgot.verify.resend');
            if (resendBtn) resendBtn.textContent = i18n.t('forgot.verify.resend');

            showMessage(result.message || i18n.t('forgot.code.sent'), 'success');
            
            // 开发环境下显示验证码（方便测试）
            // if (result.data && result.data.verificationCode) {
            //     console.log('开发环境验证码:', result.data.verificationCode);
            // }

        } else {
            showMessage(result.message || i18n.t('forgot.send.failed'), 'error');
        }
        
    } catch (error) {
        showMessage(i18n.t('forgot.send.failed'), 'error');
        // 失败时恢复按钮状态
        enableVerificationButtons();

    } finally {
        showLoading(false);
    }
}

// 新增函数：启用验证码相关按钮
function enableVerificationButtons() {
    const sendBtn = document.querySelector('#step-email .next-btn');
    const resendBtn = document.getElementById('resend-btn');
    
    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = i18n.t('forgot.sending');
    }

    if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.textContent = i18n.t('forgot.verify.resend');
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

    // 立即禁用按钮
    resendBtn.disabled = true;
    resendBtn.textContent = i18n.t('forgot.sending');
    
    // 清除之前的验证码和计时器
    verificationCode = '';
    stopCountdown();
    
    sendVerificationCode();
}

// 验证验证码
// forms.js - 修复 verifyCode 函数
async function verifyCode() {
    const inputCode = document.getElementById('verification-code').value;
    
    console.log('🔍 verifyCode调试信息:');
    console.log('当前邮箱:', currentEmail);
    console.log('输入的验证码:', inputCode);
    
    if (!inputCode) {
        showMessage(i18n.t('forgot.code.required'), 'error');
        return;
    }

    if (inputCode.length !== 6) {
        showMessage(i18n.t('forgot.password.length'), 'error');
        return;
    }
    
    if (Date.now() > codeExpiryTime) {
        showMessage(i18n.t('forgot.code.failed'), 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await apiService.verifyForgotPasswordCode(currentEmail, inputCode);
        
        console.log('📥 完整验证响应:', response);
        console.log('🔍 响应结构分析:');
        console.log('response.data:', response.data);
        console.log('response.data.data:', response.data?.data);
        console.log('response.data.data.resetToken:', response.data?.data?.resetToken);
        
        // 关键修复：从嵌套结构中获取resetToken
        let actualResetToken = null;
        
        // 检查多层嵌套结构
        if (response.data && response.data.data && response.data.data.resetToken) {
            // 结构: { data: { data: { resetToken: "xxx" } } }
            actualResetToken = response.data.data.resetToken;
        } else if (response.data && response.data.resetToken) {
            // 结构: { data: { resetToken: "xxx" } }
            actualResetToken = response.data.resetToken;
        } else if (response.resetToken) {
            // 结构: { resetToken: "xxx" }
            actualResetToken = response.resetToken;
        }
        
        console.log('✅ 提取的resetToken:', actualResetToken);

        if (!actualResetToken) {
            console.error('❌ 无法从响应中找到resetToken，完整响应:', response);
            showMessage(i18n.t('forgot.token.resetfailed'), 'error');
            return;
        }
        
        // 保存到模块级变量
        resetToken = actualResetToken;
        console.log('✅ 重置令牌已保存:', resetToken);
        console.log('✅ resetToken类型:', typeof resetToken);
        console.log('✅ resetToken长度:', resetToken.length);
        
        // 验证令牌格式（应该是JWT格式）
        if (resetToken.split('.').length !== 3) {
            console.warn('⚠️ resetToken格式可能不是标准JWT');
        }
        
        showMessage(i18n.t('forgot.code.sent'), 'success');
        switchForgotPasswordStep('step-reset');

    } catch (error) {
        console.error('验证验证码失败:', error);
        showMessage(i18n.t('forgot.network.error'), 'error');
    } finally {
        showLoading(false);
    }
}

// 重置密码
async function resetPassword() {
    const resetBtn = document.querySelector('#step-reset .next-btn'); // 获取重置按钮
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    console.log('🔍 resetPassword调试信息:');
    console.log('当前resetToken:', resetToken);
    console.log('新密码长度:', newPassword ? newPassword.length : 0);
    
    if (!resetToken) {
        showMessage(i18n.t('forgot.token.resetfailed'), 'error');
        return;
    }
    
    if (!newPassword || !confirmPassword) {
        showMessage(i18n.t('forgot.password.required'), 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage(i18n.t('forgot.password.length'), 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage(i18n.t('forgot.password.mismatch'), 'error');
        return;
    }
    
    resetBtn.disabled = true;
    const originalText = resetBtn.textContent; // 保存原始文本以便恢复
    resetBtn.textContent = i18n.t('forgot.reset.title')

    showLoading(true);
    
    try {
        console.log('📤 发送重置密码请求:', { 
            resetTokenLength: resetToken.length,
            newPasswordLength: newPassword.length 
        });
        
        const result = await apiService.resetPasswordWithToken(resetToken, newPassword);
        
        console.log('📥 重置密码响应:', result);
        
        if (result.success) {
            showMessage(i18n.t('forgot.success.title'), 'success');
            switchForgotPasswordStep('step-complete');
            resetToken = '';
            currentEmail = '';
            stopCountdown();
        } else {
            showMessage(result.message || i18n.t('forgot.send.failed'), 'error');
            resetBtn.disabled = false;
            resetBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('密码重置失败详情:', error);
        
        // 5. 处理网络错误或服务器500错误
        if (error.validationErrors) {
            // 显示具体的验证错误
            error.validationErrors.forEach(err => {
                showMessage(err.msg, 'error');
            });
        } else if (error.message) {
            // 显示具体的错误消息
            showMessage(error.message, 'error');
        } else {
            showMessage(i18n.t('forgot.network.error'), 'error');
        }
        // 无论何种错误，最终都恢复按钮状态
        resetBtn.disabled = false;
        resetBtn.textContent = originalText;

    } finally {
        showLoading(false);
    }
}


// 显示验证错误
function showValidationErrors(errors) {
    if (!Array.isArray(errors) || errors.length === 0) {
        return;
    }
    
    // 清空之前的错误提示
    const existingMessages = document.querySelectorAll('.validation-error');
    existingMessages.forEach(msg => msg.remove());
    
    // 为每个错误创建提示
    errors.forEach(error => {
        let targetElement = null;
        
        // 根据错误字段找到对应的输入框
        switch(error.path) {
            case 'newPassword':
                targetElement = document.getElementById('new-password');
                break;
            case 'confirmPassword':
                targetElement = document.getElementById('confirm-new-password');
                break;
            case 'email':
                targetElement = document.getElementById('forgot-email') || document.getElementById('verify-email-display');
                break;
            case 'code':
                targetElement = document.getElementById('verification-code');
                break;
        }
        
        if (targetElement) {
            // 创建错误消息元素
            const errorElement = document.createElement('div');
            errorElement.className = 'validation-error';
            errorElement.style.color = '#e53e3e';
            errorElement.style.fontSize = '0.85rem';
            errorElement.style.marginTop = '5px';
            errorElement.textContent = error.msg;
            
            // 在输入框后插入错误提示
            targetElement.parentNode.appendChild(errorElement);
            
            // 高亮输入框
            targetElement.style.borderColor = '#e53e3e';
            
            // 3秒后移除错误提示
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.remove();
                }
                targetElement.style.borderColor = '';
            }, 5000);
        } else {
            // 如果没有找到对应的输入框，直接显示消息
            showMessage(error.msg, 'error');
        }
    });
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

// 在forms.js文件末尾添加调试函数
function debugForgotPassword() {
    console.log('=== 忘记密码调试信息 ===');
    console.log('currentEmail:', currentEmail);
    console.log('resetToken:', resetToken);
    console.log('resetToken长度:', resetToken ? resetToken.length : 0);
    console.log('resetToken类型:', typeof resetToken);
    console.log('codeExpiryTime:', new Date(codeExpiryTime).toLocaleString());
    console.log('当前时间:', new Date().toLocaleString());
    console.log('验证码是否过期:', Date.now() > codeExpiryTime ? '是' : '否');
    console.log('=====================');
}

// 在控制台运行 debugForgotPassword() 来查看状态

// 在页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initForgotPassword();
});