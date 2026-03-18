// footer.js - 通用页脚组件
function generateFooter() {
    return `
        <footer class="footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>${i18n.t('footer.about.title')}</h3>
                    <p>${i18n.t('footer.about.text')}</p>
                </div>
                <div class="footer-section">
                    <h3>${i18n.t('footer.contact.title')}</h3>
                    <p>${i18n.t('contact.phone')}: +86 188 2390 0470</p>
                    <p>${i18n.t('contact.wechat')}: ${i18n.t('footer.contact.wechat')}</p>
                    <p>${i18n.t('contact.email')}: ${i18n.t('footer.contact.email')}</p>
                    <p>${i18n.t('contact.address')}: ${i18n.t('footer.contact.address')}</p>
                </div>
                <div class="footer-section">
                    <h3>${i18n.t('footer.follow.title')}</h3>
                    <ul>
                        <li><a href="javascript:void(0)">${i18n.t('footer.follow.wechat')}</a></li>
                        <li><a href="javascript:void(0)">${i18n.t('footer.follow.instagram')}</a></li>
                        <li><a href="javascript:void(0)">${i18n.t('footer.follow.linkedin')}</a></li>
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
                // 将页脚插入到页面最底部（在.container之后）
                page.insertAdjacentHTML('beforeend', generateFooter());
            }
        }
    });
}

// 导出函数供使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateFooter, injectFooters };
}