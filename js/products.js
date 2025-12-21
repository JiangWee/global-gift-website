// products.js - 产品相关功能
const GOOGLE_SHEETS_API = 'https://script.google.com/macros/s/AKfycbwscfYZ0DQuJ4H8yr6Sikt29E8sWB3SLNavLjDD3Hw8PJCq2rgmRMw_zVEg06frVgAE/exec';

let productsData = [];
let currentCategory = 'all';

async function loadProducts() {
    console.log('加载产品数据...');
    try {
        showLoading(true);
        
        const response = await fetch(GOOGLE_SHEETS_API);
        const result = await response.json();
        
        if (result.success) {
            productsData = result.data;
            renderProducts();
            console.log('产品数据加载成功，共', productsData.length, '个产品');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('加载产品数据失败:', error);
        loadBackupProducts();
    } finally {
        showLoading(false);
    }
}

function loadBackupProducts() {
    productsData = [
        {
            ID: 1,
            产品名称: "中国传统茶具套装",
            价格: 1280,
            分类: "cultural",
            图片URL: "1.png",
            描述: "精选紫砂茶具，蕴含中国传统文化，适合商务赠礼。",
            库存: 50,
            状态: "上架",
            规格: "材质：紫砂泥，套装内容：茶壶x1，茶杯x6，茶盘x1，茶匙x1",
            配送信息: "国内3-5个工作日，国际7-15个工作日"
        }
    ];
    renderProducts();
    console.log('使用备用产品数据');
}

function showLoading(show) {
    let loadingEl = document.getElementById('loading-indicator');
    
    if (show) {
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'loading-indicator';
            loadingEl.innerHTML = '<div class="loading-spinner">加载中...</div>';
            document.body.appendChild(loadingEl);
        }
        loadingEl.style.display = 'flex';
    } else if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

function renderProducts(filteredProducts = null) {
    const products = filteredProducts || productsData;
    const giftGrid = document.querySelector('.gift-grid');
    
    if (!giftGrid) return;
    
    if (products.length === 0) {
        giftGrid.innerHTML = '<div class="no-products">暂无产品</div>';
        return;
    }

    giftGrid.innerHTML = products.map(product => {
        // 为每个产品单独构建图片路径
        const localImagePath = `./images/${product.图片URL}`;
        
        return `
            <div class="gift-card" onclick="viewGiftDetail(${product.ID})">
                <div class="gift-img" style="background-image: url('${localImagePath}');"></div>
                <div class="gift-info">
                    <div class="gift-name">${product.产品名称}</div>
                    <div class="gift-price">¥ ${product.价格.toLocaleString()}</div>
                    <div class="gift-stock ${product.库存 < 10 ? 'low-stock' : ''}">
                        库存: ${product.库存}件
                        ${product.库存 < 5 ? '<span class="stock-warning">(库存紧张)</span>' : ''}
                    </div>
                    <div class="gift-desc">${product.展示页描述}</div>
                    ${product.库存 === 0 ? '<div class="out-of-stock">暂时缺货</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 渲染产品详情页
function renderProductDetail(product) {
    const container = document.getElementById('page-detail-container');
    if (!container) {
        console.error('详情页容器未找到');
        return;
    }
    
    console.log('渲染产品详情:', product.产品名称);
    console.log('礼品详情描述:', product.礼品详情描述);
    console.log('图片URL:', product.图片URL);

    // 处理规格参数 - 将换行符转换为<br>
    let descriptionHtml = '';
    if (product.产品描述) {
        // 将换行符转换为HTML的<br>标签
        descriptionHtml = product.产品描述
            .replace(/\r?\n/g, '<br>')  // 处理Windows和Unix换行符
            .split('●')
            .map(spec => spec.trim())
            .filter(spec => spec.length > 0)
            .map(spec => `<li>${spec}</li>`)
            .join('');
    }
    let specsHtml = '';
    if (product.产品规格) {
        // 将换行符转换为HTML的<br>标签
        specsHtml = product.产品规格
            .replace(/\r?\n/g, '<br>')  // 处理Windows和Unix换行符
            .split('●')
            .map(spec => spec.trim())
            .filter(spec => spec.length > 0)
            .map(spec => `<li>${spec}</li>`)
            .join('');
    }
    let shippingHtml = '';
    if (product.配送信息) {
        // 将换行符转换为HTML的<br>标签
        shippingHtml = product.配送信息
            .replace(/\r?\n/g, '<br>')  // 处理Windows和Unix换行符
            .split('●')
            .map(spec => spec.trim())
            .filter(spec => spec.length > 0)
            .map(spec => `<li>${spec}</li>`)
            .join('');
    }

    const localImagePath = `./images/${product.图片URL}`;

    // 生成详情页HTML
    container.innerHTML = `
        <div class="gift-detail">
            <div class="gift-image-large" style="background-image: url('${localImagePath}');"></div>
            <div class="gift-detail-info">
                <h2 class="detail-name">${product.产品名称}</h2>
                <div class="detail-price">¥ ${product.价格.toLocaleString()}</div>
                <p>${product.礼品详情描述}</p>
                <div class="stock-info ${product.库存 < 5 ? 'low-stock' : ''}">
                    库存: ${product.库存}件
                    ${product.库存 < 3 ? '<span class="stock-warning">(库存紧张)</span>' : ''}
                </div>
                <p>${product.描述}</p>
                <button class="buy-btn" onclick="showLogin()" ${product.库存 === 0 ? 'disabled' : ''}>
                    ${product.库存 === 0 ? '暂时缺货' : '立即购买'}
                </button>
            </div>
        </div>
        
        <div class="detail-tabs">
            <div class="tab-headers">
                <div class="tab-header active" onclick="switchTab('description')">产品描述</div>
                <div class="tab-header" onclick="switchTab('specs')">规格参数</div>
                <div class="tab-header" onclick="switchTab('shipping')">配送信息</div>
            </div>
            <div class="tab-content active" id="description">
                <h3>产品详情</h3>
                <p>${descriptionHtml}</p>
            </div>
            <div class="tab-content" id="specs">
                <h3>产品规格</h3>
                <p>${specsHtml}</p>
            </div>
            <div class="tab-content" id="shipping">
                <h3>配送说明</h3>
                <p>${shippingHtml}</p>
            </div>
        </div>
        
        <div class="checkout-form">
            <h3>填写订单信息</h3>
            <div class="form-section">
                <h4 class="form-section-title">购买者信息</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="buyer-name">姓名</label>
                        <input type="text" id="buyer-name" placeholder="购买者姓名">
                    </div>
                    <div class="form-group">
                        <label for="buyer-phone">电话</label>
                        <input type="tel" id="buyer-phone" placeholder="购买者电话">
                    </div>
                </div>
                <div class="form-group">
                    <label for="buyer-email">邮箱</label>
                    <input type="email" id="buyer-email" placeholder="购买者邮箱">
                </div>
            </div>
            
            <div class="form-section">
                <h4 class="form-section-title">收件人信息</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="recipient-name">姓名</label>
                        <input type="text" id="recipient-name" placeholder="收件人姓名">
                    </div>
                    <div class="form-group">
                        <label for="recipient-phone">电话</label>
                        <input type="tel" id="recipient-phone" placeholder="收件人电话">
                    </div>
                </div>
                <div class="form-group">
                    <label for="recipient-street">街道地址</label>
                    <input type="text" id="recipient-street" placeholder="街道地址">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="recipient-city">城市</label>
                        <input type="text" id="recipient-city" placeholder="城市">
                    </div>
                    <div class="form-group">
                        <label for="recipient-state">州/省</label>
                        <input type="text" id="recipient-state" placeholder="州/省">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="recipient-zip">邮编</label>
                        <input type="text" id="recipient-zip" placeholder="邮编">
                    </div>
                    <div class="form-group">
                        <label for="recipient-country">国家</label>
                        <select id="recipient-country">
                            <option value="china">中国</option>
                            <option value="usa">美国</option>
                            <option value="uk">英国</option>
                            <option value="germany">德国</option>
                            <option value="japan">日本</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h4 class="form-section-title">礼品卡信息</h4>
                <div class="form-group gift-card-text">
                    <label for="gift-card-text">留言内容</label>
                    <textarea id="gift-card-text" placeholder="请输入您的祝福语（最多180字）" rows="4" oninput="updateCharCount()"></textarea>
                    <div class="char-count">0/180</div>
                </div>
            </div>
            
            <button class="final-buy-btn" ${product.库存 === 0 ? 'disabled' : ''}>
                ${product.库存 === 0 ? '暂时缺货' : '立即购买'}
            </button>
        </div>
    `;
    
    // 重新绑定事件
    reBindDetailPageEvents(product);
}

// 重新绑定详情页事件
function reBindDetailPageEvents(product) {
    // 重新绑定字符计数
    const textarea = document.getElementById('gift-card-text');
    if (textarea) {
        textarea.addEventListener('input', updateCharCount);
    }
    
    // 重新绑定购买按钮
    const buyButton = document.querySelector('.final-buy-btn');
    if (buyButton && product.库存 > 0) {
        buyButton.addEventListener('click', function(e) {
            e.preventDefault();
            submitOrder(product);
        });
    }
    
    // 重新绑定标签切换
    const tabHeaders = document.querySelectorAll('.tab-header');
    tabHeaders.forEach(tab => {  // 修复语法
        tab.addEventListener('click', function() {
            const match = this.getAttribute('onclick').match(/'([^']+)'/);
            if (match) {
                switchTab(match[1]);
            }
        });
    });
}

async function submitOrder(product) {
    // 表单验证
    const buyerName = document.getElementById('buyer-name').value;
    const buyerPhone = document.getElementById('buyer-phone').value;
    const recipientName = document.getElementById('recipient-name').value;
    const recipientStreet = document.getElementById('recipient-street').value;
    
    if (!buyerName || !buyerPhone || !recipientName || !recipientStreet) {
        showMessage('请填写完整的必填信息', 'error');
        return;
    }
    
    // 检查登录状态
    if (!apiService.token) {
        showMessage('请先登录', 'error');
        showLogin();
        return;
    }
    
    // 修改订单数据格式以匹配后端
    const orderData = {
        product_id: product.ID,
        product_name: product.产品名称,
        price: product.价格,
        quantity: 1,
        buyer_info: {
            name: buyerName,
            phone: buyerPhone,
            email: document.getElementById('buyer-email').value
        },
        recipient_info: {
            name: recipientName,
            phone: document.getElementById('recipient-phone').value,
            street: recipientStreet,
            city: document.getElementById('recipient-city').value,
            state: document.getElementById('recipient-state').value,
            zip: document.getElementById('recipient-zip').value,
            country: document.getElementById('recipient-country').value
        },
        gift_message: document.getElementById('gift-card-text').value,
        delivery_date: document.getElementById('delivery-date')?.value || null
    };
    
    showLoading(true);
    
    try {
        const result = await apiService.createOrder(orderData);
        
        if (result.success) {
            showMessage(`订单提交成功！订单号: ${result.data.orderId}`, 'success');
            
            // 清空表单
            document.querySelector('.checkout-form').reset();
            updateCharCount();
            
            // 可以跳转到订单确认页面或首页
            setTimeout(() => goToPage('page-home'), 2000);
        } else {
            showMessage(result.error || '订单提交失败', 'error');
        }
    } catch (error) {
        showMessage('订单提交失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}


// 渲染个人中心页面
function renderProfilePage() {
    const container = document.getElementById('profile-container');
    if (!container) return;

    // 从localStorage获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    container.innerHTML = `
        <div class="profile-header">
            <h3 class="profile-title">个人信息</h3>
            <button class="edit-profile-btn" onclick="editProfile()">修改信息</button>
        </div>
        <div class="profile-info">
            <div class="profile-field">
                <span class="field-label">用户名</span>
                <span class="field-value">${userInfo.username || '未设置'}</span>
                <div class="field-actions">
                    <button class="edit-field-btn" onclick="editField('username')">修改</button>
                </div>
            </div>
            <div class="profile-field">
                <span class="field-label">邮箱</span>
                <span class="field-value">${userInfo.email || '未设置'}</span>
                <div class="field-actions">
                    <button class="edit-field-btn" onclick="editField('email')">修改</button>
                </div>
            </div>
            <div class="profile-field">
                <span class="field-label">手机号</span>
                <span class="field-value">${userInfo.phone || '未设置'}</span>
                <div class="field-actions">
                    <button class="edit-field-btn" onclick="editField('phone')">修改</button>
                </div>
            </div>
            <div class="profile-field">
                <span class="field-label">注册时间</span>
                <span class="field-value">${userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : '未知'}</span>
                <div class="field-actions">
                    <span style="color: #6c757d; font-size: 0.9rem;">不可修改</span>
                </div>
            </div>
        </div>
    `;
}

// 渲染订单中心页面
async function renderOrdersPage() {
    const container = document.getElementById('orders-container');
    if (!container) return;

    // 检查登录状态
    if (!apiService.token) {
        container.innerHTML = `
            <div class="no-orders">
                <div class="no-orders-icon">🔐</div>
                <div class="no-orders-message">请先登录查看订单</div>
                <button class="browse-products-btn" onclick="showLogin()">立即登录</button>
            </div>
        `;
        return;
    }

    try {
        showLoading(true);
        const result = await apiService.getOrders();
        
        console.log('📦 订单数据响应:', result); // 调试日志

        // 修正数据结构处理
        let orders = [];
        if (result.success) {
            // 处理不同的数据结构
            if (result.data && result.data.orders) {
                orders = result.data.orders; // 后端返回的数据结构
            } else if (Array.isArray(result.data)) {
                orders = result.data; // 直接是数组的情况
            } else if (Array.isArray(result)) {
                orders = result; // 直接返回数组
            }
        }

        console.log('📦 处理后的订单数据:', orders); // 调试日志
                if (orders && orders.length > 0) {
            container.innerHTML = orders.map(order => {
                // 统一字段名称处理
                const orderId = order.orderId || order.id;
                const productName = order.productName || order.product_name;
                const price = order.price || 0;
                const quantity = order.quantity || 1;
                const status = order.status || 'pending';
                const createdAt = order.createdAt || order.created_at;
                
                // 处理收件人信息
                let recipientInfo = order.recipientInfo;
                if (typeof recipientInfo === 'string') {
                    try {
                        recipientInfo = JSON.parse(recipientInfo);
                    } catch (e) {
                        recipientInfo = {};
                    }
                }
                recipientInfo = recipientInfo || {};
                
                // 处理购买者信息（如果需要）
                let buyerInfo = order.buyerInfo;
                if (typeof buyerInfo === 'string') {
                    try {
                        buyerInfo = JSON.parse(buyerInfo);
                    } catch (e) {
                        buyerInfo = {};
                    }
                }
                buyerInfo = buyerInfo || {};
                
                // 图片处理 - 使用默认图片或根据产品ID查找
                const productImage = order.productImage || getProductImage(order.productId);
                
                return `
                    <div class="order-card">
                        <div class="order-header">
                            <div class="order-info">
                                <div class="order-number">订单号: ${orderId}</div>
                                <div class="order-date">下单时间: ${new Date(createdAt).toLocaleString()}</div>
                            </div>
                            <div class="order-status ${getStatusClass(status)}">
                                ${getStatusText(status)}
                            </div>
                        </div>
                        <div class="order-content">
                            <div class="order-product-image" style="background-image: url('${productImage}')"></div>
                            <div class="order-product-info">
                                <div class="order-product-name">${productName}</div>
                                <div class="order-product-specs">
                                    <div>收件人: ${recipientInfo.name || '未设置'}</div>
                                    <div>电话: ${recipientInfo.phone || '未设置'}</div>
                                    <div>地址: ${(recipientInfo.street || '') + (recipientInfo.city ? ', ' + recipientInfo.city : '')}</div>
                                </div>
                            </div>
                            <div class="order-price">
                                <div class="order-product-price">¥ ${price.toLocaleString()}</div>
                                <div class="order-quantity">数量: ${quantity}</div>
                            </div>
                        </div>
                        <div class="order-footer">
                            <div class="order-total">实付: ¥ ${(price * quantity).toLocaleString()}</div>
                            <div class="order-actions">
                                <button class="view-order-btn" onclick="viewOrderDetail('${orderId}')">查看详情</button>
                                <button class="track-order-btn" onclick="trackOrder('${orderId}')">跟踪物流</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `
                <div class="no-orders">
                    <div class="no-orders-icon">📦</div>
                    <div class="no-orders-message">您还没有任何订单</div>
                    <button class="browse-products-btn" onclick="goToPage('page-gifts')">去选购</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('获取订单失败:', error);
        container.innerHTML = `
            <div class="no-orders">
                <div class="no-orders-icon">❌</div>
                <div class="no-orders-message">获取订单失败: ${error.message}</div>
                <button class="browse-products-btn" onclick="location.reload()">重新加载</button>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}


// 根据产品ID获取图片路径
function getProductImage(productId) {
    // 这里可以根据产品ID从产品数据中查找对应的图片
    const product = productsData.find(p => p.ID === productId);
    if (product && product.图片URL) {
        return `./images/${product.图片URL}`;
    }
    return './images/default-product.jpg'; // 默认图片
}

// 获取订单状态样式类
function getStatusClass(status) {
    const statusMap = {
        'pending': 'status-pending',
        'shipped': 'status-shipped',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
}

// 获取订单状态文本
function getStatusText(status) {
    const statusTextMap = {
        'pending': '待处理',
        'shipped': '已发货',
        'delivered': '已送达',
        'cancelled': '已取消'
    };
    return statusTextMap[status] || '待处理';
}

// 编辑个人信息
function editProfile() {
    showMessage('个人信息编辑功能开发中...', 'info');
}

// 编辑特定字段
function editField(field) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const currentValue = userInfo[field] || '';
    
    const newValue = prompt(`请输入新的${getFieldLabel(field)}:`, currentValue);
    if (newValue !== null && newValue !== currentValue) {
        showMessage(`${getFieldLabel(field)}修改成功！`, 'success');
        // 这里应该调用API更新用户信息
        // updateUserInfo({ [field]: newValue });
    }
}

// 获取字段标签
function getFieldLabel(field) {
    const labels = {
        'username': '用户名',
        'email': '邮箱',
        'phone': '手机号'
    };
    return labels[field] || field;
}

// 查看订单详情
function viewOrderDetail(orderId) {
    showMessage(`查看订单 ${orderId} 的详情功能开发中...`, 'info');
}

// 跟踪物流
function trackOrder(orderId) {
    showMessage(`跟踪订单 ${orderId} 的物流功能开发中...`, 'info');
}