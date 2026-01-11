// Content script - runs on web pages to extract text
import { Readability } from '@mozilla/readability';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Widget from './Widget.jsx';

/**
 * Extract main content from current webpage
 * @returns {Promise<{title: string, text: string}>}
 */
export async function extractPageContent() {
  try {
    // Clone the document to avoid modifying the original
    const documentClone = document.cloneNode(true);

    // Use Readability to extract main content
    const reader = new Readability(documentClone, {
      debug: false,
      maxElemsToAnalyze: 1000,
      nbTopCandidates: 5,
      charThreshold: 500,
    });

    const article = reader.parse();

    if (!article) {
      // Fallback: extract from common content selectors
      return extractFallbackContent();
    }

    return {
      title: article.title || document.title,
      text: article.textContent || article.content || '',
    };
  } catch (error) {
    console.error('Error extracting content:', error);
    return extractFallbackContent();
  }
}

/**
 * Fallback content extraction if Readability fails
 */
function extractFallbackContent() {
  // Try common content selectors
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.post',
    '.entry-content',
    '#content',
    '#main-content',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return {
        title: document.title,
        text: element.innerText || element.textContent || '',
      };
    }
  }

  // Last resort: get body text
  return {
    title: document.title,
    text: document.body.innerText || document.body.textContent || '',
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    extractPageContent()
      .then((content) => {
        sendResponse({ success: true, content });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

// Inject widget CSS styles
function injectWidgetStyles() {
  if (document.getElementById('webpodcast-widget-styles')) return;

  const style = document.createElement('style');
  style.id = 'webpodcast-widget-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    #webpodcast-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      pointer-events: none;
    }
    .webpodcast-toggle-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: all 0.3s;
      pointer-events: all;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .webpodcast-toggle-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
    }
    .webpodcast-widget {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 320px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      pointer-events: all;
      animation: slideUp 0.3s ease-out;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .webpodcast-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .webpodcast-header h2 {
      font-size: 22px;
      margin: 0;
      font-weight: 700;
    }
    .webpodcast-close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
    }
    .webpodcast-close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    .webpodcast-subtitle {
      font-size: 12px;
      opacity: 0.95;
      margin: 0 0 20px 0;
    }
    .webpodcast-btn-primary {
      width: 100%;
      padding: 14px 20px;
      font-size: 15px;
      font-weight: 600;
      background: white;
      color: #667eea;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 16px;
    }
    .webpodcast-btn-primary:hover {
      transform: translateY(-2px);
      background: #f8f9fa;
    }
    .webpodcast-btn-stop {
      width: 100%;
      padding: 14px 20px;
      font-size: 15px;
      font-weight: 600;
      background: #ff4757;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
    }
    .webpodcast-btn-stop:hover {
      transform: translateY(-2px);
      background: #ff3838;
    }
    .webpodcast-processing {
      text-align: center;
      padding: 20px 0;
    }
    .webpodcast-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .webpodcast-progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }
    .webpodcast-progress-fill {
      height: 100%;
      background: white;
      transition: width 0.4s;
      border-radius: 10px;
    }
    .webpodcast-progress-text {
      font-size: 11px;
      margin-top: 8px;
      opacity: 0.9;
    }
    .webpodcast-controls {
      margin-bottom: 16px;
    }
    .webpodcast-progress-info {
      text-align: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 12px;
      border-radius: 10px;
    }
    .webpodcast-progress-info p {
      font-size: 13px;
      margin-bottom: 10px;
      font-weight: 500;
    }
    .webpodcast-settings {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.25);
    }
    .webpodcast-setting-item {
      margin-bottom: 16px;
    }
    .webpodcast-setting-item label {
      display: block;
      font-size: 13px;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .webpodcast-setting-item input[type="range"] {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 10px;
      outline: none;
      -webkit-appearance: none;
      cursor: pointer;
    }
    .webpodcast-setting-item input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    .webpodcast-footer {
      margin-top: 16px;
      text-align: center;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.3);
    }
    .webpodcast-btn-settings {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      font-weight: 500;
    }
    .webpodcast-btn-settings:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    .webpodcast-chat-container {
      max-height: 320px;
      min-height: 180px;
      height: 280px;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px;
      margin: 0 0 12px 0;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 12px;
      scroll-behavior: smooth;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
      display: block;
    }
    .webpodcast-chat-container::-webkit-scrollbar {
      width: 6px;
    }
    .webpodcast-chat-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
    .webpodcast-chat-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 10px;
    }
    .webpodcast-chat-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.4);
    }
    .webpodcast-messages-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 180px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 13px;
    }
    .webpodcast-message {
      margin-bottom: 8px;
      animation: messageSlideIn 0.3s ease-out;
      display: flex;
      width: 100%;
    }
    @keyframes messageSlideIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .webpodcast-message-speaker1 {
      justify-content: flex-start;
    }
    .webpodcast-message-speaker2 {
      justify-content: flex-end;
    }
    .webpodcast-message-bubble {
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 18px;
      word-wrap: break-word;
      overflow-wrap: break-word;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      position: relative;
      white-space: pre-wrap;
    }
    .webpodcast-message-speaker1 .webpodcast-message-bubble {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom-left-radius: 4px;
      border-top-right-radius: 18px;
      border-top-left-radius: 18px;
    }
    .webpodcast-message-speaker2 .webpodcast-message-bubble {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      border-bottom-right-radius: 4px;
      border-top-right-radius: 18px;
      border-top-left-radius: 18px;
    }
    .webpodcast-message-active .webpodcast-message-bubble {
      transform: scale(1.02);
      box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.5);
      animation: messagePulse 2s ease-in-out infinite;
    }
    @keyframes messagePulse {
      0%, 100% {
        box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      50% {
        box-shadow: 0 4px 20px rgba(255, 255, 255, 0.4), 0 2px 12px rgba(0, 0, 0, 0.25);
      }
    }
    .webpodcast-message-text {
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
      color: white;
      font-weight: 400;
      word-break: break-word;
      overflow-wrap: anywhere;
      letter-spacing: 0.01em;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    }
    .webpodcast-playing {
      margin: 16px 0;
    }
    .webpodcast-playing .webpodcast-controls {
      margin-top: 0;
      margin-bottom: 12px;
    }
    .webpodcast-playing .webpodcast-progress-info {
      margin-top: 0;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// Initialize widget
function initWidget() {
  // Check if widget already exists
  if (document.getElementById('webpodcast-widget-container')) {
    return;
  }

  // Inject styles
  injectWidgetStyles();

  // Create container for the widget
  const container = document.createElement('div');
  container.id = 'webpodcast-widget-container';
  document.body.appendChild(container);

  // Mount React app
  const root = createRoot(container);
  root.render(React.createElement(Widget));
}

// Initialize widget when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}
