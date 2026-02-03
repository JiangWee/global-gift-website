// products.js - 产品相关功能
// const GOOGLE_SHEETS_API = 'https://script.google.com/macros/s/AKfycbwscfYZ0DQuJ4H8yr6Sikt29E8sWB3SLNavLjDD3Hw8PJCq2rgmRMw_zVEg06frVgAE/exec';
// gift-shop-sync-production.up.railway.app

const PRODUCTS_API = 'https://gift-shop-sync-production.up.railway.app/api/products';
const IMAGE_BASE_URL = 'https://img.giftbuybuy.com/products';

let productsData = [];
let currentCategory = 'all';
let currentProduct = null;


async function loadProducts() {
    console.log('加载产品数据...');
    try {
        showLoading(true);

        const response = await fetch(PRODUCTS_API);
        const result = await response.json();

        if (result.success) {
            productsData = result.data;
            renderProducts();
            console.log('产品数据加载成功，共', productsData.length, '个产品');
        } else {
            throw new Error(result.message || '加载失败');
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
            id: 1,
            name: "中国传统茶具套装",
            category: "cultural",
            price: 1280,
            image_url: "https://img.giftbuybuy.com/products/1.png",
            stock: 50,
            status: "上架",
            display_desc: "精选紫砂茶具，蕴含中国传统文化，适合商务赠礼。",
            product_specs: "材质：紫砂泥，茶壶x1，茶杯x6",
            shipping_info: "国内3-5个工作日，国际7-15个工作日"
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

    const isLoggedIn = !!apiService.token;

    if (products.length === 0) {
        giftGrid.innerHTML = '<div class="no-products">暂无产品</div>';
        return;
    }

    giftGrid.innerHTML = products.map(product => {
        const imageUrl = `${IMAGE_BASE_URL}/${product.image_url}`;
        console.log('renderProducts imageUrl:', imageUrl);
        const onClickHandler = isLoggedIn
            ? `viewGiftDetail(${product.id})`
            : `showLogin()`;

        return `
            <div class="gift-card" onclick="${onClickHandler}">
                <div class="gift-img" style="background-image: url('${imageUrl}');"></div>
                <div class="gift-info">
                <div class="gift-name">${product.name}</div>
                <div class="gift-price">¥ ${product.price.toLocaleString()}</div>
                <div class="gift-stock ${product.stock < 10 ? 'low-stock' : ''}">
                    库存: ${product.stock}件
                    ${product.stock < 5 ? '<span class="stock-warning">(库存紧张)</span>' : ''}
                </div>
                <div class="gift-desc">${product.display_desc || ''}</div>
                ${product.stock === 0 ? '<div class="out-of-stock">暂时缺货</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function checkLoginForPurchase() {
    if (!apiService.token) {
        showMessage('请先登录后再进行购买', 'warning');
        showLogin();
        return false;
    }
    return true;
}

// 修改 viewGiftDetail 函数
function viewGiftDetail(productId) {
    console.log('🎯 进入详情页，产品ID:', productId);
    
    // 检查登录状态
    if (!checkLoginForPurchase()) {
        return;
    }
    
    const product = productsData.find(p => p.id == productId);
    console.log('🎯 查找到的产品对象:', product);
    
    if (!product) {
        console.error('❌ 未找到产品，ID:', productId);
        showMessage('产品不存在', 'error');
        return;
    }
    
    renderProductDetail(product);
    goToPage('page-detail');
    
    // 确保传递正确的产品对象
    reBindDetailPageEvents(product);
}

// 渲染产品详情页
function renderProductDetail(product) {
    currentProduct = product; // 存储当前产品
    console.log('📝 存储当前产品:', currentProduct);
    
    const container = document.getElementById('page-detail-container');
    if (!container) {
        console.error('详情页容器未找到');
        return;
    }
    
    // 检查用户登录状态
    const isLoggedIn = !!apiService.token;
    
    const imageUrl = `${IMAGE_BASE_URL}/${product.image_url}`;

    console.log('🎨 渲染产品详情:', product.name);
    console.log('🔍 产品属性检查 - ID:', product.id, '名称:', product.name, '价格:', product.price);
    console.log('图片URL:', imageUrl);

    // 处理规格参数 - 将换行符转换为<br>
    let descriptionHtml = '';
    if (product.product_desc) {
        // 将换行符转换为HTML的<br>标签
        descriptionHtml = product.product_desc
            .replace(/\r?\n/g, '<br>')  // 处理Windows和Unix换行符
            .split('●')
            .map(spec => spec.trim())
            .filter(spec => spec.length > 0)
            .map(spec => `<li>${spec}</li>`)
            .join('');
    }
    let specsHtml = '';
    if (product.product_specs) {
        // 将换行符转换为HTML的<br>标签
        specsHtml = product.product_specs
            .replace(/\r?\n/g, '<br>')  // 处理Windows和Unix换行符
            .split('●')
            .map(spec => spec.trim())
            .filter(spec => spec.length > 0)
            .map(spec => `<li>${spec}</li>`)
            .join('');
    }
    let shippingHtml = '';
    if (product.shipping_info) {
        // 将换行符转换为HTML的<br>标签
        shippingHtml = product.shipping_info
            .replace(/\r?\n/g, '<br>')  // 处理Windows和Unix换行符
            .split('●')
            .map(spec => spec.trim())
            .filter(spec => spec.length > 0)
            .map(spec => `<li>${spec}</li>`)
            .join('');
    }

    // 修改购买按钮逻辑 - 根据登录状态显示不同的按钮
    const buyButtonHTML = isLoggedIn 
        ? `<button class="buy-btn" onclick="submitOrder(${product.id})" ${product.stock  === 0 ? 'disabled' : ''}>
             ${product.stock === 0 ? '暂时缺货' : '立即购买'}
           </button>`
        : `<button class="buy-btn" onclick="showLogin()" ${product.stock  === 0 ? 'disabled' : ''}>
             ${product.stock === 0 ? '暂时缺货' : '立即购买'}
           </button>`;

    // 在生成详情页HTML时使用新的按钮逻辑
    container.innerHTML = `
        <div class="gift-detail">
            <div class="gift-image-large" style="background-image: url('${imageUrl}');"></div>
            <div class="gift-detail-info">
                <h2 class="detail-name">${product.name}</h2>
                <div class="detail-price">¥ ${product.price.toLocaleString()}</div>
                <p>${product.gift_detail_desc}</p>
                <div class="stock-info ${product.stock < 5 ? 'low-stock' : ''}">
                    库存: ${product.stock}件
                    ${product.stock < 3 ? '<span class="stock-warning">(库存紧张)</span>' : ''}
                </div>
                ${buyButtonHTML}
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
            
            <button class="final-buy-btn" ${product.stock === 0 ? 'disabled' : ''}>
                ${product.stock === 0 ? '暂时缺货' : '立即购买'}
            </button>
        </div>
    `;
    
    // 重新绑定事件
    reBindDetailPageEvents(product);
}

// 修改 reBindDetailPageEvents 函数
function reBindDetailPageEvents(product) {
    console.log('🎯 重新绑定详情页事件，产品对象:', product);
    console.log('🎯 产品ID:', product?.id);
    
    // 重新绑定字符计数
    const textarea = document.getElementById('gift-card-text');
    if (textarea) {
        textarea.addEventListener('input', updateCharCount);
    }
    
    // 重新绑定购买按钮 - 使用闭包确保传递正确的产品对象
    const buyButton = document.querySelector('.final-buy-btn');
    if (buyButton) {
        // 移除旧的事件监听器
        const newButton = buyButton.cloneNode(true);
        buyButton.parentNode.replaceChild(newButton, buyButton);
        
        // 使用闭包捕获当前产品对象
        (function(currentProduct) {
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🛒 点击购买按钮，当前产品:', currentProduct);
                
                if (!currentProduct || !currentProduct.ID) {
                    console.error('❌ 产品对象无效:', currentProduct);
                    showMessage('产品信息异常，请刷新页面重试', 'error');
                    return;
                }
                
                // 验证库存
                if (currentProduct.库存 === 0) {
                    showMessage('该产品暂时缺货', 'error');
                    return;
                }
                
                submitOrder(currentProduct);
            });
        })(product); // 立即执行函数，传递当前产品对象
    }
    
    // 重新绑定标签切换
    const tabHeaders = document.querySelectorAll('.tab-header');
    tabHeaders.forEach(tab => {
        tab.addEventListener('click', function() {
            const match = this.getAttribute('onclick')?.match(/'([^']+)'/);
            if (match) {
                switchTab(match[1]);
            }
        });
    });

    // 增强表单功能
    setTimeout(() => {
        enhanceOrderForm();
    }, 100);
}

async function submitOrder(product) {
    console.log('🛒 开始提交订单，接收的产品参数:', product);
    
    // 容错处理：如果参数不是对象，尝试使用全局的 currentProduct
    if (typeof product !== 'object' || product === null) {
        console.warn('⚠️ 参数不是产品对象，尝试使用全局 currentProduct');
        product = currentProduct;
    }
    
    // 详细调试产品对象
    console.log('🔍🔍 完整产品对象:', product);
    console.log('🔍🔍 产品所有属性:', Object.keys(product || {}));
    
    if (!product || typeof product !== 'object') {
        console.error('❌ 产品信息缺失或格式错误:', product);
        showMessage('产品信息异常，请重新选择产品', 'error');
        return;
    }
    
    // 使用安全的产品信息获取函数
    const productInfo = getProductInfo(product);
    if (!productInfo || !productInfo.id) {
        console.error('❌ 无法获取产品信息:', productInfo);
        showMessage('无法获取产品信息，请重试', 'error');
        return;
    }
    
    console.log('✅ 产品信息验证通过:', productInfo);
    
    // 表单验证
    const buyerName = document.getElementById('buyer-name')?.value;
    const buyerPhone = document.getElementById('buyer-phone')?.value;
    const recipientName = document.getElementById('recipient-name')?.value;
    const recipientStreet = document.getElementById('recipient-street')?.value;
    
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
    
    // 构建订单数据
    const orderData = {
        product_id: productInfo.id,
        product_name: productInfo.name,
        price: productInfo.price,
        quantity: 1,
        status_front: 'unpaid', // 新增：设置初始状态为未支付
        buyer_info: {
            name: buyerName,
            phone: buyerPhone,
            email: document.getElementById('buyer-email')?.value || ''
        },
        recipient_info: {
            name: recipientName,
            phone: document.getElementById('recipient-phone')?.value || '',
            street: recipientStreet,
            city: document.getElementById('recipient-city')?.value || '',
            state: document.getElementById('recipient-state')?.value || '',
            zip: document.getElementById('recipient-zip')?.value || '',
            country: document.getElementById('recipient-country')?.value || 'china'
        },
        gift_message: document.getElementById('gift-card-text')?.value || '',
        delivery_date: document.getElementById('delivery-date')?.value || null
    };
    
    console.log('📤 提交的订单数据:', orderData);
    
        // 验证必要字段
    if (!orderData.product_id || !orderData.product_name || orderData.price <= 0) {
        showMessage('产品信息不完整，请重新选择产品', 'error');
        return;
    }

    showLoading(true);
    
    try {
        const result = await apiService.createOrder(orderData);
        
        console.log('📥📥 订单创建响应:', result);
        
        if (result.success) {
            showMessage(`订单提交成功！订单号: ${result.data.orderId}`, 'success');
            
            // ✅ 移除了表单重置代码，保留用户填写的信息
            console.log('✅ 订单提交成功，表单信息已保留');
            
            // 跳转到订单确认页面
            setTimeout(() => {
                console.log('🔄 跳转到订单页面...');
                goToPage('page-orders');
                
                // 延迟刷新订单列表
                setTimeout(() => {
                    try {
                        renderOrdersPage();
                    } catch (error) {
                        console.error('❌ 刷新订单列表失败:', error);
                    }
                }, 500);
            }, 2000);
        } else {
            showMessage(result.message || '订单提交失败', 'error');
        }
    } catch (error) {
        console.error('❌❌ 订单提交错误详情:', error);
        
        // 更详细的错误处理
        if (error.isNetworkError) {
            showMessage('网络连接失败，请检查网络设置', 'error');
        } else if (error.validationErrors) {
            // 显示具体的验证错误
            error.validationErrors.forEach(err => {
                showMessage(err.msg, 'error');
            });
        } else if (error.message) {
            showMessage(error.message, 'error');
        } else {
            showMessage('订单提交失败，请稍后重试', 'error');
        }
    } finally {
        showLoading(false);
    }
}

// 增强表单功能
function enhanceOrderForm() {
    const checkoutForm = document.querySelector('.checkout-form');
    if (!checkoutForm) return;
    
    // 检查是否已经添加过清空按钮
    if (checkoutForm.querySelector('.clear-form-btn')) {
        return;
    }
    
    // 创建清空按钮
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'clear-form-btn';
    clearButton.innerHTML = '🗑️ 清空表单';
    clearButton.style.cssText = `
        background: #f56565;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-left: 10px;
        font-size: 14px;
    `;
    
    clearButton.onclick = function() {
        if (confirm('确定要清空所有表单信息吗？这将删除所有已填写的内容。')) {
            checkoutForm.reset();
            updateCharCount();
            showMessage('表单已清空', 'info');
        }
    };
    
    // 在购买按钮旁边添加清空按钮
    const formActions = checkoutForm.querySelector('.form-actions');
    if (formActions) {
        formActions.appendChild(clearButton);
    } else {
        // 如果没有form-actions容器，直接放在购买按钮后面
        const buyButton = checkoutForm.querySelector('.final-buy-btn');
        if (buyButton) {
            buyButton.parentNode.insertBefore(clearButton, buyButton.nextSibling);
        }
    }
}

// 安全的产品信息获取函数
function getProductInfo(product) {
    if (!product || typeof product !== 'object') {
        console.error('❌ 无效的产品对象:', product);
        return null;
    }
    
    // 尝试多种可能的属性名
    const productInfo = {
        id: product.id,
        name: product.name,
        price: product.price
    };
    
    console.log('🔍 提取的产品信息:', productInfo);
    
    // 验证必要字段
    if (!productInfo.id || !productInfo.name || productInfo.price <= 0) {
        console.error('❌ 产品信息不完整:', productInfo);
        return null;
    }
    
    return productInfo;
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
                console.log('🎯 order.productImage:', order.productImage);
                const productImage = order.productImage || getProductImage(order.productId);
                const orderActions = order.status === 'unpaid' 
                    ? `
                        <div class="order-actions">
                            <button class="pay-now-btn">立即支付</button>
                            <button class="view-order-btn" onclick="viewOrderDetail('${orderId}')">查看详情</button>
                        </div>
                    `
                    : `...`;
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
                            ${orderActions}
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

    console.log('📦 订单列表渲染完成，初始化支付按钮');
    setTimeout(() => {
        initPaymentButtonEvents();
        refreshPaymentButtons();
    }, 100);
}


// 根据产品ID获取图片路径
function getProductImage(productId) {
    // 这里可以根据产品ID从产品数据中查找对应的图片
    const product = productsData.find(p => p.id == productId);
    console.log('🎯 查找到的产品对象:', product);
    console.log('🎯 全局的产品信息:', productsData);
    console.log('🎯 productId:', productId);
    const imageUrl = `${IMAGE_BASE_URL}/${product.image_url}`;
    console.log('🎯 product.图片URL:', imageUrl);
    if (product && imageUrl) {
        return imageUrl;
    }
    return './images/default-product.jpg'; // 默认图片
}

// 获取订单状态样式类
function getStatusClass(status) {
    const statusMap = {
        'unpaid': 'status-unpaid',
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
        'unpaid': '未支付',
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

// 在 products.js 文件末尾添加
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('pay-now-btn')) {
        e.preventDefault();
        
        // 获取订单信息
        const orderCard = e.target.closest('.order-card');
        const orderId = orderCard.querySelector('.order-number').textContent.replace('订单号: ', '');
        const priceText = orderCard.querySelector('.order-product-price').textContent.replace('¥ ', '');
        const price = parseFloat(priceText.replace(/,/g, ''));
        const productName = orderCard.querySelector('.order-product-name').textContent;
        
        // 检查支付函数是否存在
        if (typeof showPaymentModal === 'function') {
            showPaymentModal(orderId, price, productName);
        } else {
            console.error('showPaymentModal 函数未定义');
            showMessage('支付功能暂不可用，请稍后重试', 'error');
        }
    }
});



// 查看订单详情
function viewOrderDetail(orderId) {
    showMessage(`查看订单 ${orderId} 的详情功能开发中...`, 'info');
}

// 跟踪物流
function trackOrder(orderId) {
    showMessage(`跟踪订单 ${orderId} 的物流功能开发中...`, 'info');
}


// 修复支付按钮事件绑定
function initPaymentButtonEvents() {
    console.log('🔄 初始化支付按钮事件');
    
    // 移除旧的事件监听器（避免重复绑定）
    document.removeEventListener('click', handlePaymentButtonClick);
    
    // 添加新的事件监听器
    document.addEventListener('click', handlePaymentButtonClick);
}

function handlePaymentButtonClick(e) {
    if (e.target.classList.contains('pay-now-btn') || 
        e.target.closest('.pay-now-btn')) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('💰 支付按钮被点击');
        
        let payButton = e.target;
        if (!payButton.classList.contains('pay-now-btn')) {
            payButton = e.target.closest('.pay-now-btn');
        }
        
        const orderCard = payButton.closest('.order-card');
        if (!orderCard) {
            console.error('❌ 未找到订单卡片');
            showMessage('订单信息异常，请刷新页面重试', 'error');
            return;
        }
        
        // 获取订单信息
        const orderNumberElement = orderCard.querySelector('.order-number');
        const priceElement = orderCard.querySelector('.order-product-price');
        const productNameElement = orderCard.querySelector('.order-product-name');
        
        if (!orderNumberElement || !priceElement || !productNameElement) {
            console.error('❌ 订单信息元素缺失');
            showMessage('订单信息不完整，无法支付', 'error');
            return;
        }
        
        const orderId = orderNumberElement.textContent.replace('订单号: ', '').trim();
        const priceText = priceElement.textContent.replace('¥ ', '').replace(/,/g, '');
        const price = parseFloat(priceText);
        const productName = productNameElement.textContent.trim();
        
        console.log('📦 支付信息:', { orderId, price, productName });
        
        if (!orderId || isNaN(price) || price <= 0) {
            console.error('❌ 订单信息格式错误');
            showMessage('订单信息格式错误，请刷新页面', 'error');
            return;
        }
        
        // 显示支付模态框
        showPaymentModal(orderId, price, productName);
    }
}

// 在页面加载时初始化支付功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 初始化支付功能');
    initPaymentButtonEvents();
    
    // 确保支付模态框事件已绑定
    setTimeout(initPaymentModalEvents, 1000);
});

// 在渲染订单页面后重新绑定事件
function refreshPaymentButtons() {
    console.log('🔄 刷新支付按钮事件绑定');
    setTimeout(initPaymentButtonEvents, 100);
}