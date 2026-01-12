// Utility functions for Chrome storage

/**
 * Get user settings
 */
export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        voice1: 'default',
        voice2: 'default',
        speed: 1.0,
        accent1: 'en-US',
        accent2: 'en-IN',
        theme: 'dark',
      },
      (settings) => {
        resolve(settings);
      }
    );
  });
}

/**
 * Save user settings
 */
export async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

/**
 * Clear cached models (if needed)
 */
export async function clearCache() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      resolve();
    });
  });
}
