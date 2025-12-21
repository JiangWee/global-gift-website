// config.js - 修复后的配置文件
const API_CONFIG = {
    //BASE_URL: 'https://gift-shop-backend-production.up.railway.app', // 添加 https://
    BASE_URL: 'http://localhost:3000', // 或使用模拟数据
    ENDPOINTS: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        PRODUCTS: '/api/products',
        ORDERS: '/api/orders',
        UPLOAD: '/api/upload',
        FORGOT_PASSWORD_SEND_CODE: '/api/auth/forgot-password/send-code',
        FORGOT_PASSWORD_VERIFY_CODE: '/api/auth/forgot-password/verify-code',
        FORGOT_PASSWORD_RESET: '/api/auth/forgot-password/reset'
    },
    TIMEOUT: 10000
};

// 请求头配置
const HEADERS = {
    'Content-Type': 'application/json'
};