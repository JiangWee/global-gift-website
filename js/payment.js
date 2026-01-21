let currentPaymentOrder = null;
let currentPaymentAmount = 0;
let selectedPaymentMethod = 'alipay';
let paymentPollingInterval = null;


function openPaymentModal(orderId) {
    console.log('打开支付弹窗，订单ID：', orderId);
    document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('pay-now-btn')) {
        const orderId = e.target.dataset.orderId;
        openPaymentModal(orderId);
    }
});


// 显示支付模态框
function showPaymentModal(orderId, price, productName) {
    const modal = document.getElementById('paymentModal');
    const modalContent = modal.querySelector('.payment-modal-content');

    if (!modal || !modalContent) {
        console.error('❌ 支付模态框元素未找到');
        return;
    }

    // 填充支付信息
    document.getElementById('payment-order-id').textContent = orderId;
    document.getElementById('payment-product-name').textContent = productName;
    document.getElementById('payment-amount').textContent = `¥ ${price.toLocaleString()}`;

    // ✅ 关键 1：显示遮罩，用 flex
    modal.style.display = 'flex';

    // ✅ 关键 2：触发动画（必须延迟一帧）
    modalContent.classList.remove('show');
    requestAnimationFrame(() => {
        modalContent.classList.add('show');
    });
}


// 隐藏支付模态框
function hidePaymentModal() {
    const modalContent = document.querySelector('.payment-modal-content');
    modalContent.classList.remove('show');
    
    setTimeout(() => {
        document.getElementById('paymentModal').style.display = 'none';
        stopPaymentPolling();
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
    resetPaymentMethodSelection();
    selectedPaymentMethod = method;
    
    const selectedElement = document.querySelector(`[data-method="${method}"]`);
    selectedElement.classList.add('selected');
    
    // 更新支付按钮文本
    const payButton = document.getElementById('payment-submit-btn');
    const methodText = method === 'alipay' ? '支付宝' : '微信支付';
    payButton.textContent = `确认${methodText}支付`;
}

// 提交支付请求
async function submitPayment() {
    if (!currentPaymentOrder || !selectedPaymentMethod) {
        showNotification('支付信息不完整', 'error');
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
        
        // 直接使用全局apiService实例
        const response = await apiService.createPayment(paymentData);
        
        if (response.success) {
            // 根据支付方式处理跳转或二维码显示
            if (selectedPaymentMethod === 'alipay') {
                // 支付宝支付 - 跳转到支付页面
                window.location.href = response.data.paymentUrl;
            } else if (selectedPaymentMethod === 'wechat') {
                // 微信支付 - 显示二维码
                showWechatQrCode(response.data.codeUrl);
            }
            
            // 开始轮询支付状态
            startPaymentPolling(currentPaymentOrder, selectedPaymentMethod);
            
        } else {
            showNotification(response.message || '支付创建失败', 'error');
        }
    } catch (error) {
        console.error('支付请求错误:', error);
        showNotification('网络错误，请重试', 'error');
    } finally {
        // 恢复按钮状态
        payButton.textContent = originalText;
        payButton.disabled = false;
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
    document.getElementById('payment-selection').style.display = 'block';
    document.getElementById('wechat-qrcode-section').style.display = 'none';
    stopPaymentPolling();
}

// 开始轮询支付状态
function startPaymentPolling(orderId, paymentMethod) {
    let pollCount = 0;
    const maxPolls = 60; // 最多轮询5分钟（5秒一次）
    
    paymentPollingInterval = setInterval(async () => {
        pollCount++;
        
        if (pollCount > maxPolls) {
            stopPaymentPolling();
            showNotification('支付超时，请检查支付状态', 'warning');
            return;
        }
        
        try {
            const response = await apiService.queryPaymentStatus(orderId, paymentMethod);
            
            if (response.success) {
                const status = response.data.status;
                
                switch (status) {
                    case 'paid':
                        stopPaymentPolling();
                        handlePaymentSuccess();
                        break;
                    case 'cancelled':
                        stopPaymentPolling();
                        showNotification('支付已取消', 'info');
                        backToPaymentSelection();
                        break;
                    case 'failed':
                        stopPaymentPolling();
                        showNotification('支付失败', 'error');
                        backToPaymentSelection();
                        break;
                    // pending 状态继续轮询
                }
            }
        } catch (error) {
            console.error('轮询支付状态错误:', error);
        }
    }, 5000); // 每5秒轮询一次
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
    // 显示成功状态
    document.getElementById('payment-selection').style.display = 'none';
    document.getElementById('wechat-qrcode-section').style.display = 'none';
    document.getElementById('payment-success-section').style.display = 'block';
    
    // 更新成功信息
    document.getElementById('success-order-id').textContent = currentPaymentOrder;
    document.getElementById('success-amount').textContent = `¥ ${currentPaymentAmount.toFixed(2)}`;
    
    // 3秒后自动关闭并跳转
    setTimeout(() => {
        hidePaymentModal();
        // 跳转到订单详情或首页
        window.location.href = `/orders/${currentPaymentOrder}`;
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

// 事件监听器初始化
function initPaymentModalEvents() {
    const modal = document.getElementById('paymentModal');
    const modalContent = modal.querySelector('.payment-modal-content');

    // 关闭 ×
    modal.querySelector('.payment-close').onclick = closePaymentModal;
    modal.querySelector('.payment-cancel').onclick = closePaymentModal;

    // 点击遮罩关闭（点内容不关）
    modal.addEventListener('click', e => {
        if (e.target === modal) {
            closePaymentModal();
        }
    });

    function closePaymentModal() {
        modalContent.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // 等动画结束
    }
}


// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initPaymentModalEvents();
    
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

// 处理支付
async function processPayment() {
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!agreeTerms) {
        showMessage('请同意支付服务协议', 'error');
        return;
    }
    
    if (!currentPaymentOrder || !currentPaymentAmount) {
        showMessage('支付信息不完整', 'error');
        return;
    }
    
    // 禁用支付按钮
    const submitBtn = document.getElementById('paymentSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = `支付中...`;
    
    try {
        // 模拟支付过程
        await simulatePaymentProcess();
        
        // 显示支付成功
        document.getElementById('paymentSuccess').style.display = 'flex';
        
        // 更新订单状态
        await updateOrderStatus(currentPaymentOrder, 'pending');
        
        showMessage('支付成功！订单状态已更新', 'success');
        
    } catch (error) {
        console.error('支付失败:', error);
        showMessage('支付失败，请重试', 'error');
        
        // 恢复支付按钮
        submitBtn.disabled = false;
        submitBtn.innerHTML = `确认支付 ¥<span id="payment-submit-amount">${currentPaymentAmount.toLocaleString()}</span>`;
    }
}

// 模拟支付过程
function simulatePaymentProcess() {
    return new Promise((resolve, reject) => {
        // 模拟网络延迟
        setTimeout(() => {
            // 模拟支付成功（90%成功率）
            if (Math.random() > 0.1) {
                resolve({
                    success: true,
                    transactionId: 'TX' + Date.now(),
                    method: selectedPaymentMethod
                });
            } else {
                reject(new Error('支付处理失败'));
            }
        }, 2000);
    });
}

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

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        // 添加关闭动画
        const modalContent = modal.querySelector('.payment-modal-content');
        if (modalContent) {
            modalContent.classList.remove('show');
        }
        
        // 延迟隐藏以便动画完成
        setTimeout(() => {
            modal.style.display = 'none';
            // 停止支付轮询
            stopPaymentPolling();
        }, 300);
    }
}

// 将函数暴露到全局
window.closePaymentModal = closePaymentModal;
window.processPayment = processPayment;
window.selectPaymentMethod = selectPaymentMethod;
window.hidePaymentModal = hidePaymentModal;
window.submitPayment = submitPayment;
window.showPaymentModal = showPaymentModal;