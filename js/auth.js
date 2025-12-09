// auth.js - 修复后的用户认证状态管理
async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('userInfo');
    
    if (token && user) {
        apiService.setToken(token);
        updateUIForLoggedInUser(JSON.parse(user));
        return true;
    }
    
    // 可选：验证 token 是否仍然有效
    if (token) {
        try {
            const result = await apiService.getOrders(); // 用一个简单的API测试token
            if (!result.success) {
                // token 无效，清除本地存储
                logout();
                return false;
            }
        } catch (error) {
            console.log('Token验证失败:', error);
        }
    }
    
    return false;
}

function updateUIForLoggedInUser(user) {
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer) return;

    // 移除现有的用户信息元素
    const existingUserInfo = document.querySelector('.user-info');
    if (existingUserInfo) {
        existingUserInfo.remove();
    }

    // 创建用户信息元素
    const userInfoEl = document.createElement('div');
    userInfoEl.className = 'user-info';
    userInfoEl.innerHTML = `
        <span>欢迎，${user.name || user.email || user.account}</span>
        <button onclick="logout()" class="logout-btn">退出</button>
    `;
    
    // 插入到导航栏
    const languageSelector = document.querySelector('.language-selector');
    if (languageSelector) {
        navContainer.insertBefore(userInfoEl, languageSelector);
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    apiService.token = null;
    
    // 刷新页面
    location.reload();
}

function updateUserInfo(userData) {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    updateUIForLoggedInUser(userData);
}