// 支付相关功能
let currentPaymentOrder = null;
let currentPaymentAmount = 0;
let selectedPaymentMethod = 'alipay';

// 显示支付模态框
function showPaymentModal(orderId, amount) {
    currentPaymentOrder = orderId;
    currentPaymentAmount = amount;
    
    // 更新支付信息
    document.getElementById('payment-order-id').textContent = orderId;
    document.getElementById('payment-amount').textContent = `¥ ${amount.toLocaleString()}`;
    document.getElementById('payment-submit-amount').textContent = amount.toLocaleString();
    
    // 显示模态框
    document.getElementById('paymentModal').style.display = 'flex';
    
    // 重置选择状态
    resetPaymentMethodSelection();
    selectedPaymentMethod = 'alipay';
    
    // 添加支付方式选择事件
    attachPaymentMethodEvents();
}

// 关闭支付模态框
function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    currentPaymentOrder = null;
    currentPaymentAmount = 0;
}

// 关闭支付成功提示
function closePaymentSuccess() {
    document.getElementById('paymentSuccess').style.display = 'none';
    closePaymentModal();
    
    // 刷新订单页面
    if (document.querySelector('.page.active').id === 'page-orders') {
        renderOrdersPage();
    }
}

// 重置支付方式选择
function resetPaymentMethodSelection() {
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('active');
    });
    document.querySelector('.payment-method[data-method="alipay"]').classList.add('active');
}

// 绑定支付方式选择事件
function attachPaymentMethodEvents() {
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            selectedPaymentMethod = this.getAttribute('data-method');
        });
    });
}

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