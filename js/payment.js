// payment.js
let currentPaymentOrder = null;
let currentPaymentAmount = 0;
let selectedPaymentMethod = 'alipay';
let paymentPollingInterval = null;
// let availablePaymentMethods = ['alipay', 'wechat']; // 初始支持的方式
let availablePaymentMethods = ['alipay']; // 原来是 ['alipay', 'wechat']
let stripe = null; // Stripe实例

let isProcessingPayment = false;
let currentPaymentIntentId = null; // 添加这个，用于跟踪当前支付的Intent ID
let stripeElements = null;
let stripePaymentElement = null;

function openPaymentModal(orderId) {
    console.log('打开支付弹窗，订单ID：', orderId);
    document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}


// initPaymentMethodSelection 函数
function initPaymentMethodSelection() {
    const paymentMethods = document.querySelectorAll('.payment-method-item');
    
    // 移除所有选中状态
    paymentMethods.forEach(item => {
        item.classList.remove('selected');
    });
    
    // 不再自动选中任何支付方式
    // 让用户手动选择
    
    // 更新支付按钮文本
    updatePaymentButtonText();
}


let isModalShowing = false;

async function showPaymentModal(orderId, price, productName) {
    console.log('🔄 显示支付模态框，先强制重置所有支付状态');
    
    // 🔥 强制重置所有支付状态
    forceResetPaymentState();
    
    if (isModalShowing) {
        console.log('🔄 支付模态框已在显示中，更新内容...');
    }
    
    console.log('🔍 显示支付模态框前，检查按钮状态');
    debugButtonState('stripe-confirm-btn');

    console.log('💰 显示支付模态框:', { orderId, price, productName });
    
    isModalShowing = true;
    
    const modal = document.getElementById('paymentModal');
    const modalContent = modal.querySelector('.payment-modal-content');

    if (!modal || !modalContent) {
        console.error('❌ 支付模态框元素未找到');
        isModalShowing = false;
        return;
    }

    // 🔥 每次显示都重置状态
    resetPaymentModalState();
    
    // 🔥 确保只更新当前订单
    currentPaymentOrder = orderId;
    currentPaymentAmount = price;
    
    try {
        await getRecommendedPaymentMethod();
    } catch (error) {
        console.error('获取支付方式失败:', error);
        availablePaymentMethods = ['alipay'];
        updatePaymentMethodsUI();
    }

    // 填充支付信息
    document.getElementById('payment-order-id').textContent = orderId;
    document.getElementById('payment-product-name').textContent = productName;
    
    // 🔥 修复支付金额显示
    let formattedAmount = '';
    if (i18n.currentCurrency.code === 'USD') {
        formattedAmount = `$${price.toFixed(2)}`;
    } else {
        formattedAmount = `¥${price.toFixed(2)}`;
    }

    console.log('💰 支付金额显示:', { 
        original: price, 
        formatted: formattedAmount,
        currency: i18n.currentCurrency.code 
    });

    document.getElementById('payment-amount').textContent = formattedAmount;
    
    // 初始化支付方式选择状态
    initPaymentMethodSelection();
    
    // 显示模态框
    modal.style.display = 'flex';
    modalContent.classList.remove('show');
    requestAnimationFrame(() => {
        modalContent.classList.add('show');
    });
    
    console.log('✅ 支付模态框显示完成，当前订单:', currentPaymentOrder);
}

function forceResetPaymentState() {
    console.log('🔄 强制重置支付状态');
    
    // 1. 停止所有轮询
    stopPaymentPolling();
    
    // 2. 重置处理标志
    if (typeof paymentState !== 'undefined' && paymentState.isProcessing) {
        paymentState.isProcessing = false;
    }
    
    // 3. 重置全局变量
    isProcessingPayment = false;
    currentPaymentOrder = null;
    currentPaymentAmount = 0;
    selectedPaymentMethod = '';
    
    // 4. 🔥 关键修复：彻底重置Stripe确认按钮
    const confirmButton = document.getElementById('stripe-confirm-btn');
    if (confirmButton) {
        console.log('🔧 重置Stripe确认按钮状态');
        
        // 方法A：使用setTimeout确保DOM已更新
        setTimeout(() => {
            // 重置按钮HTML到初始状态
            confirmButton.innerHTML = '确认银行卡支付';
            confirmButton.disabled = false;
            
            // 移除所有事件监听器（通过克隆替换）
            const newButton = confirmButton.cloneNode(true);
            confirmButton.parentNode.replaceChild(newButton, confirmButton);
            
            console.log('✅ Stripe确认按钮已完全重置');
        }, 0);
    }
    
    // 5. 清理Stripe Elements
    const stripeElementContainer = document.getElementById('stripe-payment-element');
    if (stripeElementContainer) {
        stripeElementContainer.innerHTML = '';
    }
    
    // 6. 恢复界面状态
    document.getElementById('payment-selection').style.display = 'block';
    document.getElementById('wechat-qrcode-section').style.display = 'none';
    
    const stripeSection = document.getElementById('stripe-payment-section');
    if (stripeSection) {
        stripeSection.style.display = 'none';
    }
    
    // 7. 恢复主支付按钮状态
    const payButton = document.getElementById('payment-submit-btn');
    if (payButton) {
        payButton.disabled = false;
        payButton.textContent = '请选择支付方式';
    }
    
    console.log('✅ 支付状态强制重置完成');
}


// 🔥 新增：获取推荐支付方式的函数
async function getRecommendedPaymentMethod() {
    try {
        console.log('🌍 获取支付方式列表...');
        const response = await apiService.getRecommendedPayment();
        
        if (response.success && response.data) {
            const recommendation = response.data;
            
            // 不设置默认支付方式
            selectedPaymentMethod = ''; // 清空默认选择
            
            // 设置所有支付方式都可用
            availablePaymentMethods = recommendation.availableMethods;
            
            console.log('✅ 支付方式列表获取成功:', {
                availableMethods: availablePaymentMethods,
                defaultMethod: '无（用户手动选择）'
            });
            
            // 更新UI显示所有支付方式
            updatePaymentMethodsUI();
            
            return recommendation;
        } else {
            throw new Error('获取支付方式失败');
        }
    } catch (error) {
        console.error('❌ 获取支付方式失败:', error);
        // 失败时使用默认设置
        selectedPaymentMethod = '';
        // availablePaymentMethods = ['alipay', 'wechat', 'stripe'];
        availablePaymentMethods = ['alipay', 'stripe'];
        updatePaymentMethodsUI();
        return null;
    }
}

// 🔥 新增：更新支付方式UI的函数
function updatePaymentMethodsUI() {
    const paymentMethods = document.querySelectorAll('.payment-method-item');
    
    paymentMethods.forEach(item => {
        const method = item.getAttribute('data-method');
        
        if (availablePaymentMethods.includes(method)) {
            // 支付方式可用：显示并启用
            item.style.display = 'flex';
            item.style.opacity = '1';
            item.style.pointerEvents = 'auto';
            
            // 移除不可用提示
            const existingTip = item.querySelector('.method-tip');
            if (existingTip) existingTip.remove();
            
        } else {
            // 理论上不会进入这里，因为所有方式都可用
            item.style.display = 'none';
        }
    });
    
    // 不再设置默认选中
    // initPaymentMethodSelection(); // 注释掉这行
}

// 修改后的 resetPaymentModalState 函数
function resetPaymentModalState() {
    console.log('🔄 重置支付模态框状态');
    
    // 1. 重置全局变量
    currentPaymentOrder = null;
    currentPaymentAmount = 0;
    selectedPaymentMethod = ''; // 清空选中
    // availablePaymentMethods = ['alipay', 'wechat', 'stripe'];
    availablePaymentMethods = ['alipay', 'stripe'];
    stripe = null;
    stripeElements = null;
    stripePaymentElement = null;
    currentPaymentIntentId = null;

    // 2. 停止可能的轮询
    stopPaymentPolling();
    
    resetPaymentProcessingFlag();

    // 3. 重置界面显示状态
    const paymentSelection = document.getElementById('payment-selection');
    const wechatSection = document.getElementById('wechat-qrcode-section');
    const stripeSection = document.getElementById('stripe-payment-section');
    const successSection = document.getElementById('payment-success-section');
    
    if (paymentSelection) {
        paymentSelection.style.display = 'block';
    }
    if (wechatSection) {
        wechatSection.style.display = 'none';
        const qrContainer = document.getElementById('wechat-qrcode');
        if (qrContainer) qrContainer.innerHTML = '';
    }
    if (stripeSection) {
        stripeSection.style.display = 'none';
        const element = document.getElementById('stripe-payment-element');
        if (element) element.innerHTML = '';
    }
    if (successSection) {
        successSection.style.display = 'none';
        document.getElementById('success-order-id').textContent = '';
        document.getElementById('success-amount').textContent = '';
    }
    
    // 4. 重置支付方式选择状态
    document.querySelectorAll('.payment-method-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 5. 重置按钮状态
    const payButton = document.getElementById('payment-submit-btn');
    if (payButton) {
        payButton.disabled = true;
        payButton.textContent = '请选择支付方式';
        payButton.style.opacity = '0.6';
        payButton.style.cursor = 'not-allowed';
    }
}

function hidePaymentModal() {
    console.log('❌ 关闭支付模态框');
    
    const modal = document.getElementById('paymentModal');
    const modalContent = modal.querySelector('.payment-modal-content');
    
    if (!modal || !modalContent) return;
    
    modalContent.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
        
        resetPaymentModalState();
        stopPaymentPolling();
        localStorage.removeItem('paymentPollInfo');
        
        isModalShowing = false;
        // 🔥 关闭模态框时重置处理标志
        resetPaymentProcessingFlag();
    }, 300);
}

// 重置支付方式选择状态
function resetPaymentMethodSelection() {
    document.querySelectorAll('.payment-method-item').forEach(item => {
        item.classList.remove('selected');
    });
}

// 选择支付方式
function selectPaymentMethod(method) {
    // 检查支付方式是否可用
    if (!availablePaymentMethods.includes(method)) {
        showNotification(`当前不支持${method === 'alipay' ? '支付宝' : method === 'wechat' ? '微信支付' : 'Stripe'}`, 'warning');
        return;
    }
    
    // 移除所有选中状态
    document.querySelectorAll('.payment-method-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 设置选中状态
    const selectedElement = document.querySelector(`[data-method="${method}"]`);
    if (selectedElement) {
        selectedElement.classList.add('selected');
    }
    
    selectedPaymentMethod = method;
    
    // 更新支付按钮文本
    updatePaymentButtonText();
}

// 更新支付按钮文本
function updatePaymentButtonText() {
    const payButton = document.getElementById('payment-submit-btn');
    if (!payButton) return;
    
    if (!selectedPaymentMethod) {
        // 如果用户还没有选择支付方式
        payButton.textContent = '请选择支付方式';
        payButton.disabled = true;
        payButton.style.opacity = '0.6';
        payButton.style.cursor = 'not-allowed';
    } else {
        let methodText = '支付';
        switch(selectedPaymentMethod) {
            case 'alipay':
                methodText = '支付宝';
                break;
            case 'wechat':
                methodText = '微信';
                break;
            case 'stripe':
                methodText = '银行卡';
                break;
        }
        
        payButton.textContent = `确认${methodText}支付`;
        payButton.disabled = false;
        payButton.style.opacity = '1';
        payButton.style.cursor = 'pointer';
    }
}

// 提交支付请求
async function submitPayment() {
    console.log('💰 提交支付请求，订单:', currentPaymentOrder, '方式:', selectedPaymentMethod);
    
    // 检查金额是否满足Stripe最低要求
    if (selectedPaymentMethod === 'stripe' && currentPaymentAmount < 0.5) {
        showNotification('支付金额不能低于0.5元（等值外币）', 'error');
        return;
    }

    // 检查用户是否选择了支付方式
    if (!selectedPaymentMethod) {
        showNotification('请先选择支付方式', 'error');
        return;
    }
    
    if (!currentPaymentOrder) {
        showNotification('支付信息不完整', 'error');
        return;
    }
    
    // 🔥 新增：防止重复提交
    if (isProcessingPayment) {
        console.log('⏳ 支付已在处理中，跳过重复提交');
        return;
    }
    isProcessingPayment = true;

    // 检查支付方式是否可用
    if (!availablePaymentMethods.includes(selectedPaymentMethod)) {
        showNotification(`当前不支持${selectedPaymentMethod === 'alipay' ? '支付宝' : selectedPaymentMethod === 'wechat' ? '微信支付' : 'Stripe'}`, 'warning');
        return;
    }
    
    // 显示加载状态
    const payButton = document.getElementById('payment-submit-btn');
    const originalText = payButton.textContent;
    payButton.innerHTML = '<i class="loading-spinner"></i> 支付处理中...';
    payButton.disabled = true;
    
    try {
        const paymentData = {
            orderId: currentPaymentOrder,
            paymentMethod: selectedPaymentMethod
        };
        
        // 调用支付接口
        const response = await apiService.createPayment(paymentData);
        
        if (response.success) {
            const paymentIntentId = response.data.paymentIntentId;

            // 根据支付方式处理跳转
            if (selectedPaymentMethod === 'alipay') {
                window.location.href = response.data.paymentUrl;
            } else if (selectedPaymentMethod === 'wechat') {
                showWechatQrCode(response.data.codeUrl);
            } else if (selectedPaymentMethod === 'stripe') {
                await handleStripePayment(response.data.clientSecret, 
                    paymentIntentId);
            }
            
            // 🔥 传递 paymentIntentId
            startPaymentPolling(
                currentPaymentOrder, 
                selectedPaymentMethod, 
                paymentIntentId
            );
        } else {
            showNotification(response.message || '支付创建失败', 'error');
        }
    } catch (error) {
        console.error('支付请求错误:', error);
        showNotification('网络错误，请重试', 'error');
        // 🔥 支付失败，重置标志
        resetPaymentProcessingFlag();
    } finally {
        // 恢复按钮状态
        payButton.textContent = originalText;
        payButton.disabled = false;
    }
}

// 添加重置支付处理标志的函数
function resetPaymentProcessingFlag() {
    console.log('🔄 重置支付处理标志');
    isProcessingPayment = false;
    currentPaymentIntentId = null;
}

// 🔥 新增：初始化Stripe
function initStripe() {
    return new Promise((resolve, reject) => {
        // 1. 如果已经初始化，直接返回
        if (stripe) {
            console.log('✅ Stripe 已初始化，直接使用');
            resolve(stripe);
            return;
        }
        
        // 2. 如果 Stripe.js 未加载，先加载
        if (typeof Stripe === 'undefined') {
            console.log('📦 开始加载 Stripe.js...');
            
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            
            script.onload = () => {
                console.log('✅ Stripe.js 加载成功，开始获取密钥');
                
                loadStripeKey()
                    .then(() => {
                        console.log('✅ Stripe 初始化完成');
                        resolve(stripe);
                    })
                    .catch(error => {
                        console.error('❌ 加载Stripe密钥失败:', error);
                        reject(error);
                    });
            };
            
            script.onerror = (error) => {
                console.error('❌ 加载 Stripe.js 失败:', error);
                reject(new Error('加载 Stripe.js 失败'));
            };
            
            document.head.appendChild(script);
        } else {
            // 3. 如果 Stripe.js 已加载，直接获取密钥
            console.log('🔄 Stripe.js 已加载，直接获取密钥');
            loadStripeKey()
                .then(() => {
                    console.log('✅ Stripe 初始化完成');
                    resolve(stripe);
                })
                .catch(error => {
                    console.error('❌ 加载Stripe密钥失败:', error);
                    reject(error);
                });
        }
    });
}

// 加载Stripe密钥
async function loadStripeKey() {
    return new Promise((resolve, reject) => {
        const baseUrl = API_CONFIG.BASE_URL || 'https://gift-shop-backend-production.up.railway.app';
        
        console.log('🔑 从后端获取 Stripe 密钥:', `${baseUrl}/api/payment/stripe/config`);
        
        fetch(`${baseUrl}/api/payment/stripe/config`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('🔑 获取到 Stripe 配置:', { 
                    success: data.success, 
                    hasKey: !!data.publishableKey 
                });
                
                if (data.success && data.publishableKey) {
                    stripe = Stripe(data.publishableKey);
                    console.log('✅ Stripe实例初始化成功');
                    resolve(stripe);
                } else {
                    console.error('获取Stripe密钥失败，后端返回:', data);
                    reject(new Error('获取Stripe密钥失败'));
                }
            })
            .catch(error => {
                console.error('加载Stripe密钥失败:', error);
                reject(error);
            });
    });
}


// 添加调试函数
function debugButtonState(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) {
        console.log(`❌ 按钮 ${buttonId} 未找到`);
        return;
    }
    
    console.log(`🔍 按钮 ${buttonId} 状态:`, {
        innerHTML: button.innerHTML,
        textContent: button.textContent,
        disabled: button.disabled,
        className: button.className,
        outerHTML: button.outerHTML.substring(0, 200) + '...'
    });
}

async function handleStripePayment(clientSecret, paymentIntentId) {
    console.log('💳 处理Stripe支付:', { clientSecret, paymentIntentId });
    
    // 🔥 修复1：确保stripe实例已初始化
    if (!stripe) {
        try {
            console.log('🔄 Stripe未初始化，开始初始化...');
            await initStripe();
            
            if (!stripe) {
                throw new Error('Stripe初始化后仍然为null');
            }
        } catch (error) {
            console.error('❌ Stripe初始化失败:', error);
            showNotification('支付服务初始化失败，请刷新页面重试', 'error');
            return;
        }
    }
    
    // 显示Stripe支付界面
    document.getElementById('payment-selection').style.display = 'none';
    document.getElementById('wechat-qrcode-section').style.display = 'none';
    
    const stripeSection = document.getElementById('stripe-payment-section');
    if (stripeSection) {
        stripeSection.style.display = 'block';
        
        // 🔥 修复2：清除旧的Stripe元素
        const elementContainer = document.getElementById('stripe-payment-element');
        if (elementContainer) {
            elementContainer.innerHTML = '';
        }
        
        const options = {
            clientSecret: clientSecret,
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#635bff',
                    colorBackground: '#ffffff',
                }
            }
        };
        
        // 创建新的Stripe Elements实例
        const elements = stripe.elements(options);
        const paymentElement = elements.create('payment');
        paymentElement.mount('#stripe-payment-element');
        
        // 🔥 修复3：重置确认按钮状态
        const confirmButton = document.getElementById('stripe-confirm-btn');
        if (confirmButton) {
            // 确保按钮是初始状态
            confirmButton.innerHTML = '确认银行卡支付';
            confirmButton.disabled = false;
            
            console.log('🔧 Stripe确认按钮初始化完成');
            
            // 添加调试信息
            confirmButton.onclick = async () => {
                console.log('🔄 Stripe支付按钮被点击，开始验证...');
                
                // 立即显示加载状态
                confirmButton.innerHTML = '<i class="loading-spinner"></i> 处理中...';
                confirmButton.disabled = true;
                
                try {
                    // 1. 验证表单
                    const { error: submitError } = await elements.submit();
                    
                    if (submitError) {
                        console.error('❌ 表单验证失败:', submitError);
                        showNotification(`支付信息错误: ${submitError.message}`, 'error');
                        // 🔥 验证失败时重置按钮
                        confirmButton.innerHTML = '确认银行卡支付';
                        confirmButton.disabled = false;
                        return;
                    }
                    
                    console.log('✅ 表单验证通过，开始支付确认');
                    
                    // 2. 确认支付
                    const { error } = await stripe.confirmPayment({
                        elements: elements,
                        clientSecret: clientSecret,
                        confirmParams: {
                            return_url: `${window.location.origin}/payment/success?orderId=${currentPaymentOrder}&paymentMethod=stripe`,
                        },
                        redirect: 'if_required'
                    });

                    if (error) {
                        console.error('❌ Stripe支付失败:', error);
                        showNotification(`支付失败: ${error.message}`, 'error');
                        // 🔥 支付失败时重置按钮
                        confirmButton.innerHTML = '重新尝试支付';
                        confirmButton.disabled = false;
                    } else {
                        console.log('✅ 支付确认请求已发送');
                        showNotification('支付处理中，请稍候...', 'info');
                        // 🔥 注意：这里不重置按钮，保持"处理中..."状态
                    }
                } catch (error) {
                    console.error('❌ 支付流程异常:', error);
                    showNotification('支付流程异常，请重试', 'error');
                    // 🔥 异常时重置按钮
                    confirmButton.innerHTML = '确认银行卡支付';
                    confirmButton.disabled = false;
                }
            };
        }
        
        // 设置返回按钮
        const backButton = document.getElementById('stripe-back-btn');
        if (backButton) {
            backButton.onclick = () => {
                console.log('↩️ 返回支付选择');
                backToPaymentSelection();
            };
        }
    }
}


// 显示微信支付二维码
function showWechatQrCode(qrCodeUrl) {
    // 隐藏支付选择界面，显示二维码界面
    document.getElementById('payment-selection').style.display = 'none';
    document.getElementById('wechat-qrcode-section').style.display = 'block';
    
    // 生成或显示二维码
    const qrCodeContainer = document.getElementById('wechat-qrcode');
    qrCodeContainer.innerHTML = '';
    
    // 使用二维码生成库或图片显示
    if (window.QRCode) {
        new QRCode(qrCodeContainer, {
            text: qrCodeUrl,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        // 备用方案：显示跳转链接
        qrCodeContainer.innerHTML = `
            <p>请使用微信扫描二维码支付</p>
            <p>或 <a href="${qrCodeUrl}" target="_blank">点击这里</a> 在微信中打开</p>
        `;
    }
}

// 返回支付方式选择
function backToPaymentSelection() {
    console.log('↩️ 返回支付方式选择');
    
    document.getElementById('payment-selection').style.display = 'block';
    document.getElementById('wechat-qrcode-section').style.display = 'none';
    
    const stripeSection = document.getElementById('stripe-payment-section');
    if (stripeSection) {
        stripeSection.style.display = 'none';
        const element = document.getElementById('stripe-payment-element');
        if (element) element.innerHTML = '';
    }
    
    stopPaymentPolling();
    // 🔥 返回时重置标志
    resetPaymentProcessingFlag();
}

// 开始轮询支付状态
function startPaymentPolling(orderId, paymentMethod, paymentIntentId = null) {
    console.log('🔁 开始支付状态轮询:', { orderId, paymentMethod, paymentIntentId });
    
    // 停止可能存在的旧轮询
    stopPaymentPolling();
    
    const pollInfo = {
        orderId,
        paymentMethod,
        paymentIntentId,
        startTime: Date.now(),
        pollCount: 0
    };
    localStorage.setItem('paymentPollInfo', JSON.stringify(pollInfo));

    let pollCount = 0;
    const maxPolls = 60;
    
    paymentPollingInterval = setInterval(async () => {
        pollCount++;
        
        if (pollCount > maxPolls) {
            console.log('⏰ 支付轮询超时');
            stopPaymentPolling();
            showNotification('支付超时，请检查支付状态', 'warning');
            // 🔥 超时，重置标志
            resetPaymentProcessingFlag();
            
            if (paymentMethod === 'stripe') {
                backToPaymentSelection();
            }
            return;
        }
        
        try {
            const response = await apiService.queryPaymentStatus(
                orderId, 
                paymentMethod, 
                paymentIntentId
            );
            
            if (response.success) {
                const status = response.data.status;
                console.log(`🔄 支付状态: ${status} (轮询 ${pollCount}/${maxPolls})`);
                
                switch (status) {
                    case 'paid':
                    case 'succeeded':
                        stopPaymentPolling();
                        handlePaymentSuccess();
                        // 🔥 支付成功，重置标志
                        resetPaymentProcessingFlag();
                        break;
                    case 'cancelled':
                    case 'canceled':
                        stopPaymentPolling();
                        showNotification('支付已取消', 'info');
                        backToPaymentSelection();
                        // 🔥 支付取消，重置标志
                        resetPaymentProcessingFlag();
                        break;
                    case 'failed':
                        stopPaymentPolling();
                        showNotification('支付失败', 'error');
                        backToPaymentSelection();
                        // 🔥 支付失败，重置标志
                        resetPaymentProcessingFlag();
                        break;
                    // 其他状态继续轮询
                }
            } else {
                console.log('❌ 支付状态查询失败:', response.message);
            }
        } catch (error) {
            console.error('轮询支付状态错误:', error);
            // 🔥 轮询异常，重置标志
            resetPaymentProcessingFlag();
        }
    }, 5000);
}
// 页面加载时检查是否有未完成的支付轮询
function checkPendingPaymentOnLoad() {
    const pollInfo = localStorage.getItem('paymentPollInfo');
    if (pollInfo) {
        const { orderId, paymentMethod, startTime } = JSON.parse(pollInfo);
        
        // 如果开始时间在30分钟内，继续轮询
        if (Date.now() - startTime < 30 * 60 * 1000) {
            console.log('🔄 恢复支付轮询:', orderId);
            startPaymentPolling(orderId, paymentMethod);
        } else {
            // 超时，清理
            localStorage.removeItem('paymentPollInfo');
        }
    }
}

// 停止轮询支付状态
function stopPaymentPolling() {
    if (paymentPollingInterval) {
        clearInterval(paymentPollingInterval);
        paymentPollingInterval = null;
    }
}

// 处理支付成功
function handlePaymentSuccess() {
    console.log('🎉 处理支付成功，订单:', currentPaymentOrder, '金额:', currentPaymentAmount);
    
    // 显示成功状态
    document.getElementById('payment-selection').style.display = 'none';
    document.getElementById('wechat-qrcode-section').style.display = 'none';
    
    const successSection = document.getElementById('payment-success-section');
    if (successSection) {
        successSection.style.display = 'block';
        
        // 🔥 确保显示正确的订单信息
        document.getElementById('success-order-id').textContent = currentPaymentOrder || '';
        document.getElementById('success-amount').textContent = `¥ ${(currentPaymentAmount || 0).toFixed(2)}`;
    }
    
    setTimeout(() => {
        hidePaymentModal();
        
        // 跳转到订单页面
        goToPage('page-orders');
        
        // 保存最后支付的订单
        if (currentPaymentOrder) {
            localStorage.setItem('lastPaidOrder', currentPaymentOrder);
        }
    }, 3000);
}

// 显示通知消息
function showNotification(message, type = 'info') {
    // 简单的通知实现，可以替换为更完整的通知组件
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#f56565' : type === 'success' ? '#48bb78' : '#4299e1'};
        color: white;
        border-radius: 4px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// payment.js - 修改 initPaymentModalEvents
let paymentModalEventsInitialized = false;

function initPaymentModalEvents() {
    if (paymentModalEventsInitialized) {
        console.log('🔄 支付模态框事件已初始化，跳过');
        return;
    }
    
    console.log('🔧 初始化支付模态框事件');
    
    const modal = document.getElementById('paymentModal');
    if (!modal) return;
    
    // 🔥 关键修复：先移除所有事件监听器
    const newModal = modal.cloneNode(true);
    modal.parentNode.replaceChild(newModal, modal);
    
    // 重新获取引用
    const freshModal = document.getElementById('paymentModal');
    
    // 重新绑定事件
    const closeBtn = freshModal.querySelector('.payment-close');
    const cancelBtn = freshModal.querySelector('.payment-cancel');
    const submitBtn = document.getElementById('payment-submit-btn');
    const backBtn = document.getElementById('payment-back-btn');
    const successBtn = document.getElementById('payment-success-btn');
    
    if (closeBtn) {
        closeBtn.onclick = hidePaymentModal;
    }
    if (cancelBtn) {
        cancelBtn.onclick = hidePaymentModal;
    }
    
    // 点击遮罩关闭
    freshModal.onclick = function(e) {
        if (e.target === freshModal) {
            hidePaymentModal();
        }
    };
    
    // 支付方式选择事件
    document.querySelectorAll('.payment-method-item').forEach(item => {
        item.onclick = function() {
            const method = this.getAttribute('data-method');
            selectPaymentMethod(method);
        };
    });
    
    // 支付提交按钮
    if (submitBtn) {
        submitBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            submitPayment();
        };
    }
    
    // 返回按钮
    if (backBtn) {
        backBtn.onclick = backToPaymentSelection;
    }
    
    // 成功按钮
    if (successBtn) {
        successBtn.onclick = function() {
            hidePaymentModal();
            goToPage('page-orders');
        };
    }
    
    paymentModalEventsInitialized = true;
}


// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initPaymentModalEvents();
    
    // 🔥 新增：预加载Stripe
    if (availablePaymentMethods.includes('stripe')) {
        initStripe();
    }
    
    // 检查URL参数，自动打开支付模态框
    const urlParams = new URLSearchParams(window.location.search);
    const autoPay = urlParams.get('autoPay');
    
    if (autoPay === 'true') {
        const orderId = urlParams.get('orderId');
        const amount = parseFloat(urlParams.get('amount'));
        const product = urlParams.get('product');
        
        if (orderId && amount) {
            setTimeout(() => {
                showPaymentModal(orderId, amount, product || '商品');
            }, 1000);
        }
    }
});


// 添加CSS动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .payment-modal-content {
        transform: translateY(-50px);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .payment-modal-content.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);


// 更新订单状态
async function updateOrderStatus(orderId, newStatus) {
    try {
        // 这里应该调用API更新订单状态
        // const result = await apiService.updateOrderStatus(orderId, newStatus);
        
        // 模拟API调用
        console.log(`更新订单 ${orderId} 状态为: ${newStatus}`);
        
        // 前端模拟更新（实际项目中应该调用后端API）
        updateOrderStatusLocally(orderId, newStatus);
        
    } catch (error) {
        console.error('更新订单状态失败:', error);
        // 即使API失败，也尝试前端更新
        updateOrderStatusLocally(orderId, newStatus);
    }
}

// 前端本地更新订单状态
function updateOrderStatusLocally(orderId, newStatus) {
    // 更新订单卡片显示
    const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
    if (orderCard) {
        const statusElement = orderCard.querySelector('.order-status');
        const actionsElement = orderCard.querySelector('.order-actions');
        
        if (statusElement) {
            statusElement.textContent = getStatusText(newStatus);
            statusElement.className = `order-status ${getStatusClass(newStatus)}`;
        }
        
        if (actionsElement && newStatus === 'pending') {
            actionsElement.innerHTML = `
                <button class="view-order-btn" onclick="viewOrderDetail('${orderId}')">查看详情</button>
                <button class="track-order-btn" onclick="trackOrder('${orderId}')">跟踪物流</button>
            `;
        }
    }
}

// 点击模态框外部关闭
document.addEventListener('click', function(event) {
    const modal = document.getElementById('paymentModal');
    if (event.target === modal) {
        closePaymentModal();
    }
});

async function handlePaymentResultPage(params = {}) {
    console.log('🔍 进入支付结果处理页面，接收到的参数:', params);
    
    const container = document.getElementById('payment-result-container');
    if (!container) {
        console.error('❌ 找不到支付结果容器');
        return;
    }
    
    // 优先从传入的参数中获取 orderId
    let orderId = params.orderId;
    
    // 如果参数中没有，再尝试从当前浏览器地址栏的哈希中解析
    if (!orderId && window.location.hash.includes('?')) {
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
        orderId = hashParams.get('orderId');
    }
    
    // // 1. 从URL中获取订单号
    // const urlParams = new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf('?') + 1));
    // const orderId = urlParams.get('orderId');
    
    if (!orderId) {
        container.innerHTML = `
            <div class="payment-result-message error">
                <h3>⚠️ 无效的请求</h3>
                <p>未找到订单号，请从订单中心重新发起支付查询。</p>
                <button class="btn-primary" onclick="goToPage('page-orders')">查看我的订单</button>
            </div>
        `;
        return;
    }
    
    // 2. 显示加载状态
    container.innerHTML = `
        <div class="payment-result-loading">
            <div class="spinner"></div>
            <p>正在查询订单 ${orderId} 的支付状态，请稍候...</p>
        </div>
    `;
    
    try {
        // 3. 调用后端API查询支付状态
        const response = await apiService.queryPaymentStatus(orderId, 'alipay'); // 默认alipay，可根据需要调整
        
        console.log('📄 支付状态查询结果:', response);
        
        if (response.success && response.data && response.data.status === 'paid') {
            // 支付成功
            container.innerHTML = `
                <div class="payment-result-message success">
                    <div class="success-icon">✅</div>
                    <h3>🎉 支付成功！</h3>
                    <p>订单 <strong>${orderId}</strong> 已支付完成。</p>
                    ${response.data.tradeNo ? `<p>支付宝交易号：${response.data.tradeNo}</p>` : ''}
                    ${response.data.amount ? `<p>支付金额：¥ ${response.data.amount.toFixed(2)}</p>` : ''}
                    <div class="action-buttons">
                        <button class="btn-primary" onclick="goToPage('page-orders')">查看订单详情</button>
                        <button class="btn-secondary" onclick="goToPage('page-gifts')">继续选购</button>
                    </div>
                    <p class="hint">页面将在 <span id="countdown">5</span> 秒后自动跳转到订单中心...</p>
                </div>
            `;
            
            // 倒计时自动跳转
            let count = 5;
            const countdownEl = document.getElementById('countdown');
            const countdownInterval = setInterval(() => {
                count--;
                if (countdownEl) countdownEl.textContent = count;
                if (count <= 0) {
                    clearInterval(countdownInterval);
                    goToPage('page-orders');
                }
            }, 1000);
            
        } else {
            // 支付未完成或其他状态
            const message = response.message || '支付状态未确认';
            const status = response.data?.status || 'unknown';
            
            container.innerHTML = `
                <div class="payment-result-message ${status === 'pending' ? 'warning' : 'error'}">
                    <h3>${status === 'pending' ? '⏳ 支付处理中' : '⚠️ 支付未完成'}</h3>
                    <p>订单 ${orderId} 状态：${message}</p>
                    <p>如果已完成支付，请稍等片刻再刷新此页面，或前往订单中心查看最新状态。</p>
                    <div class="action-buttons">
                        <button class="btn-primary" onclick="checkPaymentAgain('${orderId}')">重新查询</button>
                        <button class="btn-secondary" onclick="goToPage('page-orders')">返回订单中心</button>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ 查询支付状态失败:', error);
        container.innerHTML = `
            <div class="payment-result-message error">
                <h3>❌ 查询失败</h3>
                <p>网络异常或服务器错误，无法获取订单状态。</p>
                <p>错误信息：${error.message}</p>
                <div class="action-buttons">
                    <!-- 将重试调用改为带参数的 handlePaymentResultPage(params) -->
                    <button class="btn-primary" onclick="handlePaymentResultPage(${JSON.stringify(params)})">重试</button>
                    <button class="btn-secondary" onclick="goToPage('page-home')">返回首页</button>
                </div>
            </div>
        `;
    }
}

// 辅助函数：重新查询
async function checkPaymentAgain(orderId) {
    const container = document.getElementById('payment-result-container');
    if (!container) return;
    
    container.innerHTML = `<div class="spinner"></div><p>重新查询中...</p>`;
    
    // 延迟一秒后重新查询，避免频繁请求
    setTimeout(async () => {
        await handlePaymentResultPage();
    }, 1000);
}

// 将函数暴露到全局
window.closePaymentModal = closePaymentModal;
window.selectPaymentMethod = selectPaymentMethod;
window.hidePaymentModal = hidePaymentModal;
window.submitPayment = submitPayment;
window.showPaymentModal = showPaymentModal;