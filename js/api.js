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
    
    // 统一处理响应
    async handleResponse(response) {
        const data = await response.json();
        
        // 打印响应结构，用于调试
        console.log('🌐 API响应原始数据:', data);
        
        // 如果响应本身是嵌套的，返回内层数据
        if (data && data.data && data.data.success !== undefined) {
            return data.data;
        }
        
        return data;
    }
    
    // 修改请求方法
    async request(endpoint, options = {}) {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        
        console.log(`🌐 发送请求: ${options.method || 'GET'} ${url}`, options.body || '');
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.token ? `Bearer ${this.token}` : '',
                    ...options.headers
                }
            });
            
            const data = await response.json();
            
            console.log(`🌐 响应: ${options.method || 'GET'} ${endpoint}`, data);
            
            if (!response.ok) {
                const error = new Error(data.message || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.data = data;
                error.isHttpError = true;
                throw error;
            }
            
            return data;
            
        } catch (error) {
            console.error('请求失败:', error);
            
            // 如果是网络错误（如无法连接）
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                error.isNetworkError = true;
                error.message = '网络连接失败，请检查网络设置';
            }
            
            // 如果是HTTP错误且有错误信息
            if (error.isHttpError && error.data) {
                // 如果有具体的验证错误
                if (Array.isArray(error.data.errors)) {
                    error.validationErrors = error.data.errors;
                    error.message = error.data.errors.map(e => e.msg).join('; ');
                } else if (error.data.message) {
                    error.message = error.data.message;
                }
            }
            
            throw error;
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
    // 忘记密码 - 发送验证码
    async sendForgotPasswordCode(email) {
        return this.request(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD_SEND_CODE, {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    // 忘记密码 - 验证验证码
    async verifyForgotPasswordCode(email, code) {
        console.log('📤 发送验证码验证请求:', { email, code });
        
        const response = await this.request(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD_VERIFY_CODE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: email,
                code: code
            })
        });
        
        console.log('📥 原始验证响应:', response);
        
        // 如果后端返回的是嵌套结构，需要正确提取
        if (response && response.success && response.data) {
            // 如果response.data本身有success字段，说明是嵌套的
            if (response.data.success !== undefined) {
                return response.data; // 返回内层的data
            }
        }
        
        return response;
    }

    // 忘记密码 - 重置密码
    async resetPasswordWithToken(resetToken, newPassword) {
        return this.request(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD_RESET, {
            method: 'POST',
            body: JSON.stringify({ 
                resetToken, 
                newPassword 
            })
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