// main.js - 主逻辑和初始化
document.addEventListener('DOMContentLoaded', function() {
    // 设置默认送达日期为7天后
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    document.getElementById('delivery-date').valueAsDate = nextWeek;
    
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

window.addEventListener('load', function() {
    console.log('Gift Buy Buy网站加载完成');
    loadProducts();
});

// 模态框外部点击关闭
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        modal.style.display = 'none';
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