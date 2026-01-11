// Inline CSS for widget - content scripts need CSS injected directly
export const widgetStyles = `
#webpodcast-widget-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  transition: all 0.2s ease;
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

.webpodcast-playing {
  margin: 16px 0;
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
`;

// Inject styles into the page
export function injectStyles() {
  if (document.getElementById('webpodcast-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'webpodcast-styles';
  style.textContent = widgetStyles;
  (document.head || document.documentElement).appendChild(style);
}
