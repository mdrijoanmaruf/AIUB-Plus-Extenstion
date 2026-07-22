chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_NOTICES') {
    fetch('https://aiub.edu/category/notices')
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

    return true; 
  }
});
