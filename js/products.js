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
            图片URL: "https://images.unsplash.com/photo-1534452203293-494a7a73e8a3",
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

// 提交订单函数
function submitOrder(product) {
    // 表单验证
    const buyerName = document.getElementById('buyer-name').value;
    const buyerPhone = document.getElementById('buyer-phone').value;
    const recipientName = document.getElementById('recipient-name').value;
    
    if (!buyerName || !buyerPhone || !recipientName) {
        alert('请填写完整的必填信息');
        return;
    }
    
    // 实际应用中这里会有订单提交逻辑
    alert(`订单提交成功！\n产品: ${product.产品名称}\n价格: ¥${product.价格.toLocaleString()}\n我们将尽快处理您的订单。`);
    
    // 可以在这里减少库存（需要额外的API）
    console.log('订单信息:', {
        产品: product.产品名称,
        价格: product.价格,
        购买者: buyerName,
        收件人: recipientName
    });
}