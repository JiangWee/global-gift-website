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
    

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        console.log(`🌐🌐 发送请求: ${options.method || 'GET'} ${url}`, options.body || '');
        
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
            
            console.log(`🌐🌐 响应: ${options.method || 'GET'} ${endpoint}`, data);
            
            if (!response.ok) {
                const error = new Error(data.message || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.data = data;
                error.isHttpError = true;
                
                if (response.status === 401 || response.status === 403) {
                    // 如果是登录接口的认证失败，保留原始错误消息
                    if (endpoint === API_CONFIG.ENDPOINTS.LOGIN) {
                        error.isTokenExpired = false; // 登录失败，不是token过期
                        error.message = data.message || '认证失败'; // 使用后端返回的消息
                    } else {
                        // 其他接口的401/403才是token过期
                        error.isTokenExpired = true;
                        error.message = '登录已过期，请重新登录';
                    }
                }
                
                throw error;
            }
            
            return data;
            
        } catch (error) {
            console.error('请求失败:', error);
            
            // 处理 Token 过期
            if (error.isTokenExpired) {
                this.handleTokenExpired();
                // 不再抛出错误，因为已经处理了
                return { success: false, message: error.message, handled: true };
            }
            
            // 原有的其他错误处理...
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                error.isNetworkError = true;
                error.message = '网络连接失败，请检查网络设置';
            }
            
            if (error.isHttpError && error.data) {
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

    // 添加 Token 过期处理
    handleTokenExpired() {
        console.log('🔐 Token 已过期，执行退出登录流程');
        
        // 清除本地存储
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        
        // 重置 API token
        this.token = null;
        
        // 显示友好的提示
        showMessage('登录已过期，请重新登录', 'warning');
        
        // 延迟执行，避免阻塞当前操作
        setTimeout(() => {
            // 更新导航栏状态
            updateNavbarForLoggedOutUser();
            
            // 如果当前在需要登录的页面，跳转到首页
            const protectedPages = ['page-orders', 'page-profile', 'page-detail'];
            const currentPage = document.querySelector('.page.active')?.id;
            
            if (protectedPages.includes(currentPage)) {
                goToPage('page-home');
            }
            
            // 显示登录框
            showLogin();
        }, 1000);
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

    // 支付相关API
    async createPayment(paymentData) {
        return this.request('/api/payment/create', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async queryPaymentStatus(orderId, paymentMethod) {
        return this.request(`/api/payment/status?orderId=${orderId}&paymentMethod=${paymentMethod}`);
    }

    async getPaymentResult(orderId) {
        return this.request(`/api/payment/result?orderId=${orderId}`);
    }

    // 更新订单状态
    async updateOrderStatus(orderId, newStatus) {
        return this.request(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
    }
    
    
}

const apiService = new ApiService();