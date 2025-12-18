// config.js - 修复后的配置文件
const API_CONFIG = {
    //BASE_URL: 'https://gift-shop-backend-production.up.railway.app', // 添加 https://
    BASE_URL: 'http://localhost:3000', // 或使用模拟数据
    ENDPOINTS: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        PRODUCTS: '/api/products',
        ORDERS: '/api/orders',
        UPLOAD: '/api/upload'
    },
    TIMEOUT: 10000
};

// 请求头配置
const HEADERS = {
    'Content-Type': 'application/json'
};