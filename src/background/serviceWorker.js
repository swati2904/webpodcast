// Background service worker - coordinates extension components

const OFFSCREEN_DOCUMENT_PATH = 'background/offscreen.html';

async function createOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ['AUDIO_PLAYBACK', 'BLOBS'],
    justification: 'Running AI models for podcast generation',
  });
}

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
    // Broadcast progress to content script/popup
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, request).catch(() => {});
      });
    });
  }

  if (request.type === 'generate-dialogue-request') {
    handleDialogueRequest(request.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleDialogueRequest(data) {
  await createOffscreen();
  return chrome.runtime.sendMessage({
    target: 'offscreen',
    type: 'generate-dialogue',
    data
  });
}

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

