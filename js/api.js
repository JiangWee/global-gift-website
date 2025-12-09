// api.js - 修复后的 API 服务
class ApiService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    getAuthHeaders() {
        const headers = { 
            'Content-Type': 'application/json',
            ...HEADERS 
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // 处理请求体
        const config = {
            method: options.method || 'GET',
            headers: this.getAuthHeaders(),
            ...options
        };

        // 如果是 GET 请求，删除可能的 body
        if (config.method === 'GET' && config.body) {
            delete config.body;
        }

        try {
            console.log('API请求:', url, config);
            const response = await fetch(url, config);
            
            // 检查响应状态
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            // 尝试解析 JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return { success: true, data };
            } else {
                // 如果不是 JSON，返回文本
                const text = await response.text();
                return { success: true, data: text };
            }
        } catch (error) {
            console.error('API请求失败:', error);
            return { 
                success: false, 
                error: error.message,
                data: null 
            };
        }
    }

    // 用户认证
    async login(credentials) {
        return this.request(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async register(userData) {
        return this.request(API_CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // 产品相关
    async getProducts(params = {}) {
        let endpoint = API_CONFIG.ENDPOINTS.PRODUCTS;
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            endpoint = `${endpoint}?${queryString}`;
        }
        return this.request(endpoint);
    }

    async getProductById(id) {
        return this.request(`${API_CONFIG.ENDPOINTS.PRODUCTS}/${id}`);
    }

    // 订单相关
    async createOrder(orderData) {
        return this.request(API_CONFIG.ENDPOINTS.ORDERS, {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrders() {
        return this.request(API_CONFIG.ENDPOINTS.ORDERS);
    }
}

const apiService = new ApiService();