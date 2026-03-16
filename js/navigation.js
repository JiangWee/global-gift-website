// navigation.js - 导航功能

console.log('[navigation.js] loaded');

// navigation.js - 导航功能
console.log('[navigation.js] loaded');

// navigation.js - 修改 popstate 事件处理器
window.addEventListener('popstate', (event) => {
    console.log('[popstate] 事件状态:', event.state, '当前URL:', location.href, '当前哈希:', location.hash);
    
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

    // 只有当能够解析出有效页面ID时才进行跳转
    if (pageId && document.getElementById(pageId)) {
        console.log('[popstate] 跳转到解析出的页面:', pageId, '参数:', params);
        goToPage(pageId, params, false);
    } else if (!pageId) {
        // 如果无法解析出页面ID，检查当前是否有活动页面
        const activePage = document.querySelector('.page.active');
        if (!activePage) {
            // 没有活动页面，才跳转到首页
            console.log('[popstate] 无活动页面，跳转到首页');
            goToPage('page-home', {}, false);
        } else {
            // 有活动页面，保持当前页面
            console.log('[popstate] 保持当前活动页面:', activePage.id);
        }
    } else {
        console.error('[popstate] 页面不存在:', pageId);
        // 页面不存在，跳转到首页
        goToPage('page-home', {}, false);
    }
});


function goToPage(pageId, params = {}, push = true) {
    console.log('🔄 跳转到页面:', pageId, '参数:', params, 'push:', push, '当前时间:', Date.now());
    
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
    
    // 🆕 新增：检查是否有 show=register 参数
    if (params.show === 'register') {
        console.log('🔍 检测到注册参数，显示注册模态框');
        // 延迟执行以确保页面切换完成
        setTimeout(() => {
            showRegister();
        }, 100);
        
        // 从参数中移除 show 字段，避免重复触发
        const { show, ...restParams } = params;
        params = restParams;
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
            console.log('📝 pushState 哈希:', hash);
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
    
    // 🔥 修改：显示包含货币信息的提示
    const currencySymbol = i18n.currentCurrency.symbol;
    const currencyCode = i18n.currentCurrency.code;
    
    const message = lang === 'zh' 
        ? `已切换到中文，货币：${currencySymbol} (${currencyCode})`
        : `Language switched to English, Currency: ${currencySymbol} (${currencyCode})`;

    showMessage(message, 'success');

        // 重新加载产品以更新价格显示
    setTimeout(() => {
        if (document.querySelector('.page.active')?.id === 'page-gifts') {
            renderProducts();
        }
        if (document.querySelector('.page.active')?.id === 'page-orders') {
            renderOrdersPage();
        }
    }, 300);
    
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


window.addEventListener('popstate', (event) => {
    console.log('[popstate] 事件状态:', event.state, '当前URL:', location.href, '当前哈希:', location.hash);
    
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

    // 情况1: 能解析出有效页面ID，且该页面存在
    if (pageId && document.getElementById(pageId)) {
        console.log('[popstate] 跳转到解析出的页面:', pageId, '参数:', params);
        goToPage(pageId, params, false);
        return; // 处理完成，退出
    } 
    
    // 情况2: 无法解析出页面ID
    if (!pageId) {
        const activePage = document.querySelector('.page.active');
        if (!activePage) {
            // 没有活动页面，跳转到首页
            console.log('[popstate] 无活动页面，跳转到首页');
            goToPage('page-home', {}, false);
        } else {
            // 有活动页面，保持当前状态，什么都不做
            console.log('[popstate] 保持当前活动页面:', activePage.id);
        }
        return; // 处理完成，无论是否跳转，都退出函数
    }
    
    // 情况3: 解析出了页面ID，但该页面元素不存在
    console.error('[popstate] 页面不存在:', pageId);
    goToPage('page-home', {}, false);
});


