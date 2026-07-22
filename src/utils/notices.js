export async function scrapeNotices() {
    try {
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'FETCH_NOTICES' }, (res) => {
                resolve(res);
            });
        });
        
        if (!response || !response.success) {
            throw new Error(response ? response.error : 'No response from background script');
        }
        
        const html = response.html;
        const notices = [];
        
        const blocks = html.split('class="notification"');
        
        for (let i = 1; i < blocks.length; i++) {
            const block = blocks[i];
            
            const dateMatch = block.match(/date-custom[^>]*>[\s\S]*?(\d+)[\s\S]*?([A-Za-z]+)(?:[\s\S]*?<span[^>]*>(\d{4})<\/span>)?/i);
            if (!dateMatch) continue;
            
            const day = dateMatch[1].trim();
            const month = dateMatch[2].trim();
            const year = dateMatch[3] ? dateMatch[3].trim() : new Date().getFullYear();
            
            let title = '';
            const h2Match = block.match(/<h2[^>]*title[^>]*>([^<]+)<\/h2>/i);
            if (h2Match) {
                title = h2Match[1].trim();
            } else {
                const divMatch = block.match(/notification-text[^>]*>\s*([^<]+)/i);
                if (divMatch) {
                    title = divMatch[1].trim();
                }
            }
            title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
            
            let url = '';
            const linkMatch = block.match(/href="([^"]+)"/i);
            if (linkMatch) {
                url = linkMatch[1].trim();
            } else {
                const prevBlock = blocks[i-1];
                const outerLinkMatch = prevBlock.match(/<a\s+[^>]*href="([^"]+)"[^>]*>\s*$/i);
                if (outerLinkMatch) {
                    url = outerLinkMatch[1].trim();
                }
            }
            
            if (url.startsWith('/')) {
                url = 'https://aiub.edu' + url;
            }
            
            if (title && url) {
                notices.push({
                    title: title,
                    date: `${day} ${month} ${year}`,
                    url: url
                });
            }
        }

        return notices;
    } catch (error) {
        console.error('Error scraping notices:', error);
        return [];
    }
}
