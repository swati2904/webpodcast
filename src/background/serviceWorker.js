// Background service worker - coordinates extension components

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'extract-content') {
    // Forward to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'extractContent' },
          (response) => {
            sendResponse(response);
          }
        );
      }
    });
    return true; // Keep channel open
  }

  if (request.type === 'model-load-progress') {
    // Broadcast progress to popup
    chrome.runtime.sendMessage(request).catch(() => {
      // Popup might not be open, ignore error
    });
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.set({
    voice1: 'default',
    voice2: 'default',
    speed: 1.0,
    accent1: 'en-US',
    accent2: 'en-IN',
  });
});
