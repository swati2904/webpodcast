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
    '[role="article"]',
    '.post',
    '.entry',
    '.content',
    'main',
    '.main-content',
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

  // Last resort: use body text
  return {
    title: document.title,
    text: document.body.innerText || document.body.textContent || '',
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'extract-content') {
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

let widgetRoot = null;

// Inject widget CSS styles
function injectWidgetStyles() {
  if (document.getElementById('webpodcast-widget-styles')) return;

  const style = document.createElement('style');
  style.id = 'webpodcast-widget-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    /* CSS Variables for Theming */
    #webpodcast-widget-container {
      --wp-bg-primary: #ffffff;
      --wp-bg-secondary: #f8fafc;
      --wp-bg-tertiary: #f1f5f9;
      --wp-text-primary: #1e293b;
      --wp-text-secondary: #64748b;
      --wp-text-tertiary: #94a3b8;
      --wp-border: #e2e8f0;
      --wp-border-hover: #cbd5e1;
      --wp-accent: #4f46e5;
      --wp-accent-hover: #4338ca;
      --wp-accent-light: #eef2ff;
      --wp-success: #10b981;
      --wp-danger: #ef4444;
      --wp-danger-hover: #dc2626;
      --wp-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --wp-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --wp-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --wp-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    
    #webpodcast-widget-container[data-theme="dark"] {
      --wp-bg-primary: #1e293b;
      --wp-bg-secondary: #0f172a;
      --wp-bg-tertiary: #1e293b;
      --wp-text-primary: #f1f5f9;
      --wp-text-secondary: #cbd5e1;
      --wp-text-tertiary: #94a3b8;
      --wp-border: #334155;
      --wp-border-hover: #475569;
      --wp-accent: #6366f1;
      --wp-accent-hover: #818cf8;
      --wp-accent-light: #312e81;
      --wp-success: #22c55e;
      --wp-danger: #f87171;
      --wp-danger-hover: #ef4444;
      --wp-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
      --wp-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
      --wp-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
      --wp-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
    }
    
    #webpodcast-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      pointer-events: none;
    }
    
    .webpodcast-toggle-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      box-shadow: var(--wp-shadow-lg);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: all;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .webpodcast-toggle-btn:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: var(--wp-shadow-xl);
      background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
    }
    
    .webpodcast-widget {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 414px; /* Increased by 15% from 360px base */
      padding: 24px;
      background: var(--wp-bg-primary);
      color: var(--wp-text-primary);
      border-radius: 20px;
      border: 1px solid var(--wp-border);
      box-shadow: var(--wp-shadow-xl);
      pointer-events: all;
      animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      overflow: hidden; /* Disable scrolling on main container */
      transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .webpodcast-widget-collapsed {
      height: auto;
    }

    .webpodcast-widget-expanded {
      height: 600px; /* Fixed height */
      max-height: calc(100vh - 120px);
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .webpodcast-header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .webpodcast-header h2 {
      font-size: 20px;
      margin: 0;
      font-weight: 600;
      color: var(--wp-text-primary);
      letter-spacing: -0.02em;
    }
    
    .webpodcast-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .webpodcast-settings-icon-btn {
      background: transparent;
      border: none;
      color: var(--wp-text-secondary);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      padding: 0;
      line-height: 1;
    }
    
    .webpodcast-settings-icon-btn:hover {
      background: var(--wp-bg-tertiary);
      color: var(--wp-text-primary);
    }
    
    .webpodcast-close-btn {
      background: var(--wp-bg-tertiary);
      border: 1px solid var(--wp-border);
      color: var(--wp-text-secondary);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      padding: 0;
      line-height: 1;
    }
    
    .webpodcast-close-btn:hover {
      background: var(--wp-bg-secondary);
      border-color: var(--wp-border-hover);
      color: var(--wp-text-primary);
    }
    
    .webpodcast-subtitle {
      flex-shrink: 0;
      font-size: 13px;
      color: var(--wp-text-secondary);
      margin: 0 0 24px 0;
      font-weight: 400;
    }
    
    .webpodcast-btn-primary {
      width: 100%;
      padding: 14px 20px;
      font-size: 15px;
      font-weight: 500;
      background: var(--wp-accent);
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
      margin-bottom: 16px;
      letter-spacing: -0.01em;
    }
    
    .webpodcast-btn-primary:hover {
      background: var(--wp-accent-hover);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
      transform: translateY(-1px);
    }
    
    .webpodcast-btn-primary:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(79, 70, 229, 0.25);
    }
    
    .webpodcast-btn-play-pause {
      flex: 1;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      
      /* Dark Mode (Default) */
      background: rgba(129, 140, 248, 0.1);
      color: #a5b4fc;
      border: 1px solid rgba(165, 180, 252, 0.2);
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.1);
    }

    .webpodcast-btn-play-pause:hover {
      background: rgba(129, 140, 248, 0.2);
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
      transform: translateY(-1px);
    }

    .webpodcast-btn-play-pause .webpodcast-icon {
      font-size: 16px;
    }

    #webpodcast-widget-container[data-theme="light"] .webpodcast-btn-play-pause {
      background: #ffffff;
      color: #4f46e5;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    #webpodcast-widget-container[data-theme="light"] .webpodcast-btn-play-pause:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .webpodcast-btn-download {
      flex: 2;
      padding: 12px 20px;
      font-size: 15px;
      font-weight: 500;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      /* Dark Mode (Default) */
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .webpodcast-btn-download:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    #webpodcast-widget-container[data-theme="light"] .webpodcast-btn-download {
      background: #f8fafc;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    #webpodcast-widget-container[data-theme="light"] .webpodcast-btn-download:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    
    .webpodcast-processing {
      text-align: center;
      padding: 32px 0;
    }

    .webpodcast-spinner-container {
      position: relative;
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .webpodcast-spinner {
      width: 100%;
      height: 100%;
      border: 3px solid var(--wp-border);
      border-top-color: var(--wp-accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .webpodcast-spinner-text {
      position: absolute;
      font-size: 13px;
      font-weight: 700;
      color: var(--wp-text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .webpodcast-progress-bar {
      width: 100%;
      height: 6px;
      background: var(--wp-bg-tertiary);
      border-radius: 10px;
      overflow: hidden;
      margin: 12px 0;
    }
    
    .webpodcast-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--wp-accent) 0%, #7c3aed 100%);
      transition: width 0.4s ease;
      border-radius: 10px;
    }
    
    .webpodcast-progress-text {
      font-size: 12px;
      margin-top: 8px;
      color: var(--wp-text-secondary);
      font-weight: 400;
    }
    
    .webpodcast-controls {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .webpodcast-progress-info {
      text-align: center;
      background: rgba(255, 255, 255, 0.08);
      padding: 14px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 0;
    }
    
    .webpodcast-progress-info p {
      font-size: 13px;
      margin-bottom: 10px;
      font-weight: 500;
      color: var(--wp-text-primary);
    }
    
    .webpodcast-settings {
      flex: 1;
      overflow-y: auto;
      margin-top: 0;
    }
    
    .webpodcast-setting-item {
      margin-bottom: 20px;
    }
    
    .webpodcast-setting-item:last-child {
      margin-bottom: 0;
    }
    
    .webpodcast-setting-item label {
      display: block;
      font-size: 13px;
      margin-bottom: 10px;
      font-weight: 500;
      color: var(--wp-text-primary);
      letter-spacing: -0.01em;
    }
    
    .webpodcast-setting-item input[type="range"] {
      width: 100%;
      height: 6px;
      background: var(--wp-bg-tertiary);
      border-radius: 10px;
      outline: none;
      -webkit-appearance: none;
      cursor: pointer;
    }
    
    #webpodcast-widget-container[data-theme="dark"] .webpodcast-setting-item input[type="range"] {
      background: #475569;
    }
    
    .webpodcast-setting-item input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      background: var(--wp-accent);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: var(--wp-shadow-sm);
      transition: all 0.2s ease;
    }
    
    #webpodcast-widget-container[data-theme="dark"] .webpodcast-setting-item input[type="range"]::-webkit-slider-thumb {
      background: #818cf8;
      box-shadow: 0 2px 8px rgba(129, 140, 248, 0.4);
    }
    
    .webpodcast-setting-item input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: var(--wp-shadow-md);
    }
    
    .webpodcast-setting-item select {
      width: 100%;
      padding: 12px 14px;
      font-size: 14px;
      background: var(--wp-bg-primary);
      border: 1px solid var(--wp-border);
      border-radius: 10px;
      color: var(--wp-text-primary);
      cursor: pointer;
      outline: none;
      transition: all 0.2s ease;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      padding-right: 40px;
      font-weight: 400;
    }
    
    #webpodcast-widget-container[data-theme="dark"] .webpodcast-setting-item select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    }
    
    .webpodcast-setting-item select:hover {
      border-color: var(--wp-border-hover);
    }
    
    .webpodcast-setting-item select:focus {
      border-color: var(--wp-accent);
      box-shadow: 0 0 0 3px var(--wp-accent-light);
    }
    
    .webpodcast-setting-item select option {
      background: var(--wp-bg-primary);
      color: var(--wp-text-primary);
      padding: 8px;
    }
    
    .webpodcast-setting-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--wp-border);
      margin-bottom: 20px;
    }
    
    .webpodcast-setting-toggle:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
    }
    
    .webpodcast-setting-toggle label {
      font-size: 14px;
      font-weight: 500;
      color: var(--wp-text-primary);
      margin: 0;
      cursor: pointer;
      flex: 1;
    }
    
    .webpodcast-toggle-switch {
      position: relative;
      width: 48px;
      height: 26px;
      background: var(--wp-border);
      border-radius: 13px;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    
    .webpodcast-toggle-switch.active {
      background: var(--wp-accent);
    }
    
    .webpodcast-toggle-switch::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s ease;
      box-shadow: var(--wp-shadow-sm);
    }
    
    .webpodcast-toggle-switch.active::after {
      transform: translateX(22px);
    }
    
    .webpodcast-footer {
      flex-shrink: 0;
      margin-top: 24px;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid var(--wp-border);
    }
    
    .webpodcast-btn-settings {
      background: var(--wp-bg-secondary);
      color: var(--wp-text-primary);
      border: 1px solid var(--wp-border);
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 100%;
      font-weight: 500;
      letter-spacing: -0.01em;
    }
    
    .webpodcast-btn-settings:hover {
      background: var(--wp-bg-tertiary);
      border-color: var(--wp-border-hover);
    }
    
    .webpodcast-chat-container {
      flex: 1;
      min-height: 0; /* Important for flex child to be able to scroll */
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px;
      margin: 0 0 16px 0;
      background: var(--wp-bg-secondary);
      border-radius: 14px;
      scroll-behavior: smooth;
      border: 1px solid var(--wp-border);
      display: block;
    }
    
    .webpodcast-chat-container::-webkit-scrollbar {
      width: 6px;
    }
    
    .webpodcast-chat-container::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .webpodcast-chat-container::-webkit-scrollbar-thumb {
      background: var(--wp-border);
      border-radius: 3px;
    }
    
    .webpodcast-chat-container::-webkit-scrollbar-thumb:hover {
      background: var(--wp-border-hover);
    }
    
    .webpodcast-messages-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--wp-text-tertiary);
      font-size: 13px;
    }
    
    .webpodcast-message {
      margin-bottom: 12px;
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
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      word-wrap: break-word;
      overflow-wrap: break-word;
      box-shadow: var(--wp-shadow-sm);
      transition: all 0.3s ease;
      position: relative;
      white-space: pre-wrap;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .webpodcast-message-speaker1 .webpodcast-message-bubble {
      background: rgba(0, 150, 255, 0.2);
      border-color: rgba(0, 150, 255, 0.3);
      color: var(--wp-text-primary);
      border-bottom-left-radius: 4px;
    }
    
    .webpodcast-message-speaker2 .webpodcast-message-bubble {
      background: rgba(150, 0, 255, 0.2);
      border-color: rgba(150, 0, 255, 0.3);
      color: var(--wp-text-primary);
      border-bottom-right-radius: 4px;
    }
    
    .webpodcast-message-active .webpodcast-message-bubble {
      transform: scale(1.02);
      box-shadow: var(--wp-shadow-md);
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .webpodcast-message-text {
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
      color: var(--wp-text-primary);
      font-weight: 400;
      word-break: break-word;
      overflow-wrap: anywhere;
      letter-spacing: 0.01em;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    
    .webpodcast-playing {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0; /* Enable inner scrolling */
      margin: 16px 0;
    }
    
    .webpodcast-playing .webpodcast-controls {
      flex-shrink: 0;
      margin-top: 0;
      margin-bottom: 12px;
      display: flex;
      gap: 12px;
    }
    
    .webpodcast-playing .webpodcast-progress-info {
      flex-shrink: 0;
      margin-top: 0;
      background: rgba(255, 255, 255, 0.08);
      padding: 14px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.1);
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
  widgetRoot = createRoot(container);
  widgetRoot.render(React.createElement(Widget));
}

function removeWidget() {
  if (widgetRoot) {
    widgetRoot.unmount();
    widgetRoot = null;
  }
  const container = document.getElementById('webpodcast-widget-container');
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
  const style = document.getElementById('webpodcast-widget-styles');
  if (style && style.parentNode) {
    style.parentNode.removeChild(style);
  }
}

function ensureWidgetEnabled(enabled) {
  if (enabled) {
    initWidget();
    return;
  }
  removeWidget();
}

// Initialize widget when DOM is ready
const startWithSetting = () => {
  chrome.storage.sync.get({ widgetEnabled: true }, (result) => {
    ensureWidgetEnabled(result.widgetEnabled ?? true);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startWithSetting);
} else {
  startWithSetting();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'toggle-widget') {
    ensureWidgetEnabled(message.enabled ?? true);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.widgetEnabled) {
    ensureWidgetEnabled(changes.widgetEnabled.newValue ?? true);
  }
});
