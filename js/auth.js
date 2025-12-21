async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('userInfo');
    
    if (token && user) {
        apiService.setToken(token);
        updateNavbarForLoggedInUser(JSON.parse(user));
        return true;
    }
    
    // 可选：验证 token 是否仍然有效
    if (token) {
        try {
            const result = await apiService.getOrders();
            if (!result.success) {
                logout();
                return false;
            }
        } catch (error) {
            console.log('Token验证失败:', error);
        }
    }
    
    // 未登录状态
    updateNavbarForLoggedOutUser();
    return false;
}

// auth.js - 更新用户状态显示功能
function updateNavbarForLoggedInUser(user) {
    const userStatusEl = document.getElementById('userStatus');
    if (!userStatusEl) return;
    // 优先显示用户名，如果没有则显示邮箱
    const displayName = user.username || user.email.split('@')[0];
    
    userStatusEl.innerHTML = `
        <div class="user-info-logged-in">
            <div class="username" onclick="toggleUserDropdown()">
                ${displayName}
            </div>
            <div class="user-dropdown" id="userDropdown">
                <a href="#" onclick="goToPage('page-profile')">个人中心</a>
                <a href="#" onclick="goToPage('page-orders')">订单中心</a>
                <a href="#" onclick="logout()">退出登录</a>
            </div>
        </div>
    `;
}
function updateNavbarForLoggedOutUser() {
    const userStatusEl = document.getElementById('userStatus');
    if (!userStatusEl) return;
    
    userStatusEl.innerHTML = `
        <div class="login-register-buttons">
            <button class="nav-btn login-nav-btn" onclick="showLogin()">登录</button>
            <button class="nav-btn register-nav-btn" onclick="goToPage('page-register')">注册</button>
        </div>
    `;
}

// 切换用户下拉菜单
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// 点击其他地方关闭下拉菜单
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown && !event.target.closest('.user-info-logged-in')) {
        dropdown.style.display = 'none';
    }
});

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    apiService.token = null;
    
    // 更新导航栏状态
    updateNavbarForLoggedOutUser();
    
    // 刷新页面以更新所有状态
    location.reload();
}

function updateUserInfo(userData) {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    updateNavbarForLoggedInUser(userData);
}

// 显示注册表单
function showRegister() {
    showLogin();
    switchLoginTab('register');
}