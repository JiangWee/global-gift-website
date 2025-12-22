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

    // 登录后重新渲染当前页面，更新按钮状态
    refreshCurrentPageForLogin();

}

// 添加页面刷新函数
function refreshCurrentPageForLogin() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    const pageId = activePage.id;
    
    switch(pageId) {
        case 'page-gifts':
            // 重新渲染产品列表
            renderProducts();
            break;
        case 'page-detail':
            // 重新渲染产品详情
            const currentProduct = getCurrentProduct(); // 需要实现这个函数
            if (currentProduct) {
                renderProductDetail(currentProduct);
            }
            break;
        // 可以添加其他页面的刷新逻辑
    }
}

// 添加获取当前产品的辅助函数
function getCurrentProduct() {
    // 这里需要根据当前页面状态获取产品信息
    // 简单实现：从URL参数或全局变量获取
    // 暂时返回null，实际项目中需要根据具体逻辑实现
    return null;
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