// footer.js - 通用页脚组件
function generateFooter(lang = 'zh') {
    const isChinese = lang === 'zh';
    
    return `
        <footer class="footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>${isChinese ? '关于我们' : 'About Us'}</h3>
                    <p>${isChinese ? 
                        'Gift Buy Buy 是一家专业的跨国商务礼品服务平台，致力于为客户提供高品质的礼品选择和全球配送服务。' : 
                        'Gift Buy Buy is a professional cross-border business gift service platform dedicated to providing high-quality gift selection and global delivery services.'}
                    </p>
                </div>
                <div class="footer-section">
                    <h3>${isChinese ? '联系我们' : 'Contact Us'}</h3>
                    <p>${isChinese ? '电话' : 'Phone'}: +86 188 2390 0470</p>
                    <p>${isChinese ? '微信' : 'WeChat'}: GiftBuyBuy</p>
                    <p>${isChinese ? '邮箱' : 'Email'}: service@GiftBuyBuy.com</p>
                    <p>${isChinese ? '地址' : 'Address'}: 深圳市福田区园岭街道鹏盛社区八卦岭工业区8栋451B</p>
                </div>
                <div class="footer-section">
                    <h3>${isChinese ? '关注我们' : 'Follow Us'}</h3>
                    <ul>
                        <li><a href="javascript:void(0)">${isChinese ? '微信公众号' : 'WeChat Public Account'}</a></li>
                        <li><a href="javascript:void(0)">${isChinese ? 'Instagram' : 'Instagram'}</a></li>
                        <li><a href="javascript:void(0)">${isChinese ? 'LinkedIn' : 'LinkedIn'}</a></li>
                    </ul>
                </div>
            </div>
            <div class="copyright">
                <footer style="text-align:center; padding:20px; font-size:12px; color:#666;">
                    © 2026 Gift Buy Buy. All rights reserved. |
                    <a href="https://beian.miit.gov.cn" target="_blank">粤ICP备2026018419号-1</a>
                </footer>
            </div>
        </footer>
    `;
}

// 自动在需要的地方插入页脚
function injectFooters() {
    const pages = [
        'page-home', 'page-filters', 'page-gifts', 'page-detail',
        'page-profile', 'page-orders', 'page-about', 'page-contact',
        'page-payment-result'
    ];
    
    pages.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) {
            // 检查是否已有页脚
            const existingFooter = page.querySelector('.footer');
            if (!existingFooter) {
                const container = page.querySelector('.container') || page;
                container.insertAdjacentHTML('beforeend', generateFooter(i18n.getCurrentLanguage()));
            }
        }
    });
}

// 导出函数供使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateFooter, injectFooters };
}