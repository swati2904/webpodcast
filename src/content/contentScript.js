// Content script - runs on web pages to extract text
// Readability will be bundled by Vite
import { Readability } from '@mozilla/readability';

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
      charThreshold: 500
    });
    
    const article = reader.parse();
    
    if (!article) {
      // Fallback: extract from common content selectors
      return extractFallbackContent();
    }
    
    return {
      title: article.title || document.title,
      text: article.textContent || article.content || ''
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
    '#main-content'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return {
        title: document.title,
        text: element.innerText || element.textContent || ''
      };
    }
  }
  
  // Last resort: get body text
  return {
    title: document.title,
    text: document.body.innerText || document.body.textContent || ''
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    extractPageContent().then(content => {
      sendResponse({ success: true, content });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
});
