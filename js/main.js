// main.js - 主逻辑和初始化
document.addEventListener('DOMContentLoaded', function() {

    // 检查用户登录状态
    checkAuthStatus().then(isLoggedIn => {
        console.log('用户登录状态:', isLoggedIn ? '已登录' : '未登录');
        
        // 根据登录状态初始化页面
        if (isLoggedIn) {
            // 如果已登录，重新渲染当前页面以确保按钮状态正确
            const activePage = document.querySelector('.page.active');
            if (activePage && activePage.id === 'page-gifts') {
                renderProducts();
            }
        }
    });

    // 设置默认送达日期为7天后
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    document.getElementById('delivery-date').valueAsDate = nextWeek;
    
    // 初始化页面
    initializePage();

    // 购买表单提交
    const finalBuyBtn = document.querySelector('.final-buy-btn');
    if (finalBuyBtn) {
        finalBuyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const buyerName = document.getElementById('buyer-name').value;
            const buyerPhone = document.getElementById('buyer-phone').value;
            const recipientName = document.getElementById('recipient-name').value;
            const recipientStreet = document.getElementById('recipient-street').value;
            
            if (!buyerName || !buyerPhone || !recipientName || !recipientStreet) {
                alert('请填写完整的必填信息');
                return;
            }
            
            alert('订单提交成功！我们将尽快处理您的订单。');
            document.querySelector('.checkout-form').reset();
            updateCharCount();
        });
    }
    
    // 筛选表单处理
    const countrySelect = document.getElementById('country');
    const holidaySelect = document.getElementById('holiday');
    const deliveryDate = document.getElementById('delivery-date');
    
    if (countrySelect && holidaySelect && deliveryDate) {
        countrySelect.addEventListener('change', updateFilters);
        holidaySelect.addEventListener('change', updateFilters);
        deliveryDate.addEventListener('change', updateFilters);
    }
});

function initializePage() {
    // 添加全局加载指示器
    const loadingEl = document.createElement('div');
    loadingEl.id = 'global-loading';
    loadingEl.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <div>加载中...</div>
        </div>
    `;
    loadingEl.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 1.2rem;
    `;
    document.body.appendChild(loadingEl);
}

// 显示/隐藏全局加载
function showGlobalLoading(show) {
    const loadingEl = document.getElementById('global-loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'flex' : 'none';
    }
}

// 筛选更新
function updateFilters() {
    console.log('筛选条件已更新');
    // 这里可以添加筛选逻辑
}

window.addEventListener('load', function() {
    console.log('Gift Buy Buy网站加载完成');
    loadProducts();
});

// 模态框外部点击关闭
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    // 只有当点击模态框的背景（不是内容区域）时才关闭
    if (event.target === modal) {
        // 这里可以选择是否允许点击外部关闭
        // 根据需求，可以注释掉下面这行来禁止点击外部关闭
        // closeLoginModal();
    }
};

// 调试函数 - 在控制台运行
function debugProductLoading() {
    console.log('=== 产品加载调试 ===');
    console.log('API地址:', GOOGLE_SHEETS_API);
    console.log('产品数据:', productsData);
    console.log('页面状态:', document.readyState);
    
    // 检查容器
    const giftGrid = document.querySelector('.gift-grid');
    console.log('礼品网格:', giftGrid);
    if (giftGrid) {
        console.log('网格子元素:', giftGrid.children.length);
        console.log('网格HTML:', giftGrid.innerHTML);
    }
    
    // 检查当前活动页面
    const activePage = document.querySelector('.page.active');
    console.log('当前活动页面:', activePage ? activePage.id : '无');
    
    // 手动触发产品加载
    console.log('手动触发产品加载...');
    loadProducts();
}

// 在控制台运行 debugProductLoading() 来调试