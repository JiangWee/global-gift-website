// navigation.js - 导航功能
function goToPage(pageId) {
    console.log('尝试跳转到页面:', pageId);
    
    const targetPage = document.getElementById(pageId);
    
    if (!targetPage) {
        console.error('页面不存在:', pageId);
        return;
    }
    
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    targetPage.classList.add('active');
    window.scrollTo(0, 0);
    
    console.log('成功跳转到:', pageId);
    
    if (pageId === 'page-gifts') {
        loadProducts();
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