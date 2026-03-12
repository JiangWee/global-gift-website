// navigation.js - 导航功能

console.log('[navigation.js] loaded');

// navigation.js - 导航功能
console.log('[navigation.js] loaded');

window.addEventListener('popstate', (event) => {
    console.log('[popstate]', event.state, location.href);
    
    let pageId = null;
    let params = {};

    if (event.state) {
        // 从 state 中获取页面ID和参数
        pageId = event.state.pageId;
        params = event.state.params || {};
    } else {
        // 兜底：从 hash 解析
        const hash = location.hash.replace('#', '');
        if (hash) {
            const [pageIdPart, queryString] = hash.split('?');
            pageId = pageIdPart;
            
            // 解析查询参数
            if (queryString) {
                const urlParams = new URLSearchParams(queryString);
                for (const [key, value] of urlParams) {
                    params[key] = value;
                }
            }
        }
    }

    if (pageId && document.getElementById(pageId)) {
        // ✅ 正确传递三个参数
        goToPage(pageId, params, false);
    } else {
        // 默认显示首页
        goToPage('page-home', {}, false);
    }
});

function goToPage(pageId, params = {}, push = true) {
    console.log('🔄 跳转到页面:', pageId, '参数:', params, 'push:', push);
    
    // 参数类型保护
    if (typeof params === 'boolean') {
        // 如果第二个参数是布尔值（可能是旧的调用方式）
        push = params;
        params = {};
    }
    
    // 确保 params 是对象
    if (typeof params !== 'object' || params === null) {
        params = {};
    }
    
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
        
        // 保存参数到页面元素
        if (Object.keys(params).length > 0) {
            targetPage.dataset.routeParams = JSON.stringify(params);
        } else {
            delete targetPage.dataset.routeParams;
        }
        
        if (push) {
            // 构建包含参数的哈希
            let hash = `#${pageId}`;
            if (Object.keys(params).length > 0) {
                const queryString = new URLSearchParams(params).toString();
                hash += `?${queryString}`;
            }
            history.pushState({ pageId, params }, '', hash);
        }

        // 特殊页面处理
        if (pageId === 'page-profile') {
            renderProfilePage();
        } else if (pageId === 'page-orders') {
            renderOrdersPage();
        } else if (pageId === 'page-forgot-password') {
            switchForgotPasswordStep('step-email');
        } else if (pageId === 'page-gifts') {
            console.log('🔄 切换到商品页面，重新渲染产品列表');
            renderProducts();
        } else if (pageId === 'page-detail') {
            setTimeout(enhanceOrderForm, 200);
        } else if (pageId === 'page-payment-result') {
            if (typeof handlePaymentResultPage === 'function') {
                setTimeout(() => {
                    // 获取路由参数
                    const routeParamsStr = targetPage.dataset.routeParams;
                    const routeParams = routeParamsStr ? JSON.parse(routeParamsStr) : {};
                    
                    // 合并参数：优先使用传入的参数，其次使用路由参数
                    const finalParams = Object.keys(params).length > 0 ? params : routeParams;
                    
                    console.log('📦 传递给支付结果页的参数:', finalParams);
                    handlePaymentResultPage(finalParams);
                }, 100);
            }
        }
        
        // 更新当前页面的国际化文本
        setTimeout(() => {
            i18n.updatePageText();
        }, 100);
        
        // 滚动到顶部
        window.scrollTo(0, 0);

        // 自动添加页脚
        if (!targetPage.querySelector('.footer')) {
            targetPage.insertAdjacentHTML('beforeend', generateFooter(i18n.getCurrentLanguage()));
        }
    }
}



function setLanguage(lang) {
    // 更新按钮状态
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 使用国际化管理器设置语言
    i18n.setLanguage(lang);
    
    // 显示语言切换提示
    const message = lang === 'zh' ? '已切换到中文' : 'Language switched to English';
    showMessage(message, 'success');
}

function selectCategory(category) {
    console.log('选择了分类:', category);
    goToPage('page-gifts');
}

function viewGiftDetail(productId) {
    console.log('查看礼品详情 ID:', productId);
    
    const product = productsData.find(p => p.id === productId);
    if (!product) {
        console.error('产品不存在 ID:', productId);
        alert('产品不存在');
        return;
    }
    showProductDetail(product);
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

// navigation.js - 修改 DOMContentLoaded 部分
document.addEventListener('DOMContentLoaded', () => {
    // 增强的哈希解析函数
    function parseHashForPageId(fullHash) {
        if (!fullHash || fullHash === '#') {
            return { pageId: 'page-home', params: {} };
        }
        
        const hashWithoutPrefix = fullHash.replace('#', '');
        const [pageIdPart, queryString] = hashWithoutPrefix.split('?');
        
        let pageId = pageIdPart;
        if (!pageId || !document.getElementById(pageId)) {
            if (pageIdPart === 'payment-result') {
                pageId = 'page-payment-result';
            } else {
                return { pageId: 'page-home', params: {} };
            }
        }
        
        const params = {};
        if (queryString) {
            const urlParams = new URLSearchParams(queryString);
            for (const [key, value] of urlParams) {
                params[key] = value;
            }
        }
        return { pageId, params };
    }
    
    // 解析当前URL的哈希
    const { pageId, params } = parseHashForPageId(location.hash);
    
    console.log('[init] 解析哈希:', { hash: location.hash, pageId, params });
    
    // ✅ 关键修复：保存正确的状态
    history.replaceState({ pageId, params }, '', '#' + (location.hash.substring(1) || 'page-home'));
    
    // 跳转到解析出的页面，并传递参数
    goToPage(pageId, params, false);
});


