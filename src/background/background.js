// Background service worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_NOTICES') {
    fetch('https://aiub.edu/category/notices', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch notices: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(html => {
        sendResponse({ success: true, html });
      })
      .catch(error => {
        console.error('Error fetching notices in background:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep the message channel open for the async response
  }
});
