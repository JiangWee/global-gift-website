// navigation.js - 导航功能
function goToPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
        
        // 特殊页面处理
        if (pageId === 'page-profile') {
            renderProfilePage();
        } else if (pageId === 'page-orders') {
            renderOrdersPage();
        } else if (pageId === 'page-forgot-password') {
            switchForgotPasswordStep('step-email');
        } else if (pageId === 'page-gifts') {
            // 🔥 关键修复：切换到商品页面时重新渲染
            console.log('🔄 切换到商品页面，重新渲染产品列表');
            renderProducts();
        } else if (pageId === 'page-detail') {
            setTimeout(enhanceOrderForm, 200);
        }
        
        // 滚动到顶部
        window.scrollTo(0, 0);
    }
}



function setLanguage(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (lang === 'en') {
        alert('Language switched to English');
    } else {
        alert('已切换到中文');
    }
}

function selectCategory(category) {
    console.log('选择了分类:', category);
    goToPage('page-gifts');
}

function viewGiftDetail(productId) {
    console.log('查看礼品详情 ID:', productId);
    
    const product = productsData.find(p => p.ID === productId);
    if (!product) {
        console.error('产品不存在 ID:', productId);
        alert('产品不存在');
        return;
    }
    
    renderProductDetail(product);
    goToPage('page-detail');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-header').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}