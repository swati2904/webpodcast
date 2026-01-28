import React, { useState, useEffect, useRef } from 'react';
import { convertToDialogue, initializeModel } from '@/ai/dialogueConverter.js';
import { getSettings, saveSettings } from '@/utils/storage.js';
import { TTSEngine } from '@/tts/ttsEngine.js';
import { extractPageContent } from './contentExtractor.js';

// Memoized Message component for performance
const Message = React.memo(({ message, isActive }) => {
  const isSpeaker1 = message.speaker === 'speaker1';
  
  return (
    <div 
      className={`webpodcast-message ${isSpeaker1 ? 'webpodcast-message-speaker1' : 'webpodcast-message-speaker2'} ${isActive ? 'webpodcast-message-active' : ''}`}
    >
      <div className="webpodcast-message-bubble">
        <div className="webpodcast-message-text">{message.text}</div>
      </div>
    </div>
  );
});

Message.displayName = 'Message';

// MessageList component with auto-scroll
const MessageList = React.memo(({ messages, activeMessageId, scrollContainerRef }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && scrollContainerRef.current) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages, activeMessageId, scrollContainerRef]);

  if (messages.length === 0) {
    return (
      <div className="webpodcast-messages-empty">
        <p>Conversation will appear here...</p>
      </div>
    );
  }

  return (
    <>
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          isActive={message.id === activeMessageId}
        />
      ))}
      <div ref={messagesEndRef} />
    </>
  );
});

MessageList.displayName = 'MessageList';

function Widget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [modelProgress, setModelProgress] = useState(0);
  const [messages, setMessages] = useState([]);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [settings, setSettings] = useState({
    speed: 1.0,
    accent1: 'en-US',
    accent2: 'en-IN',
    theme: 'dark'
  });
  const [saved, setSaved] = useState(false);
  const [ttsEngine, setTtsEngine] = useState(null);
  const scrollContainerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Initialize TTS engine
    const engine = new TTSEngine();
    setTtsEngine(engine);

    // Find container element for theme
    containerRef.current = document.getElementById('webpodcast-widget-container');

    // Load settings
    getSettings().then(savedSettings => {
      const loadedSettings = {
        speed: savedSettings.speed || 1.0,
        accent1: savedSettings.accent1 || 'en-US',
        accent2: savedSettings.accent2 || 'en-IN',
        theme: savedSettings.theme || 'dark'
      };
      setSettings(loadedSettings);
      engine.setSettings(loadedSettings);
      
      // Apply theme to container
      if (containerRef.current) {
        containerRef.current.setAttribute('data-theme', loadedSettings.theme);
      }
    });

    // Listen for model loading progress
    const messageListener = (message) => {
      if (message.type === 'model-load-progress') {
        // Ensure progress is between 0-100
        const progress = Math.max(0, Math.min(100, message.progress * 100));
        setModelProgress(progress);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    // Preload model in background when widget opens (non-blocking)
    // This makes the first conversion much faster
    initializeModel().catch(() => {
      // Silently fail - model will load when convertToDialogue is called
    });

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      if (engine) {
        engine.stop();
      }
    };
  }, []);

  // Update theme when settings change
  useEffect(() => {
    if (containerRef.current && settings.theme) {
      containerRef.current.setAttribute('data-theme', settings.theme);
    }
  }, [settings.theme]);

  const handleConvert = async () => {
    setIsProcessing(true);
    setModelProgress(0);
    // Clear messages for new conversation
    setMessages([]);
    setActiveMessageId(null);

    try {
      // Extract content directly since we're in the content script context
      // This is fast (Readability is optimized)
      const content = await extractPageContent();

      if (!content || !content.text || content.text.length < 100) {
        alert('Not enough content found on this page. Please try a different page.');
        setIsProcessing(false);
        return;
      }

      const { title, text } = content;

      // Convert to dialogue (model should be preloaded, so this is faster)
      const dialogueSegments = await convertToDialogue(text, title);

      if (!dialogueSegments || dialogueSegments.length === 0) {
        throw new Error('Failed to generate dialogue');
      }

      // Start playback immediately
      setIsProcessing(false);
      setIsPlaying(true);
      setProgress({ current: 0, total: dialogueSegments.length });

      // Callback when segment starts - add message to UI
      const onSegmentStart = (index, segment) => {
        const messageId = `msg-${index}-${Date.now()}`;
        const newMessage = {
          id: messageId,
          speaker: segment.speaker,
          text: segment.text,
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, newMessage]);
        setActiveMessageId(messageId);
      };

      // Callback when segment ends - remove active state
      const onSegmentEnd = (index, segment) => {
        setActiveMessageId(null);
      };

      // Play dialogue (this is async but non-blocking)
      ttsEngine.speakDialogue(
        dialogueSegments,
        (current, total) => {
          setProgress({ current, total });
        },
        onSegmentStart,
        onSegmentEnd
      ).then(() => {
        setIsPlaying(false);
        setActiveMessageId(null);
      }).catch((error) => {
        console.error('Playback error:', error);
        setIsPlaying(false);
        setActiveMessageId(null);
      });
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
      setIsProcessing(false);
      setIsPlaying(false);
      setActiveMessageId(null);
    }
  };

  const handleStop = () => {
    // Immediate UI update for responsive feel
    setIsPlaying(false);
    setProgress({ current: 0, total: 0 });
    setActiveMessageId(null);
    
    // Stop TTS engine (synchronous, fast)
    if (ttsEngine) {
      ttsEngine.stop();
    }
  };

  const handleSpeedChange = async (newSpeed) => {
    const newSettings = { ...settings, speed: newSpeed };
    setSettings(newSettings);
    await saveSettings(newSettings);
    if (ttsEngine) {
      ttsEngine.setSettings(newSettings);
      // If currently playing, restart current segment with new speed for immediate effect
      if (isPlaying) {
        // Note: Web Speech API doesn't allow changing rate mid-utterance
        // New speed will apply to the next segment automatically
        // This is the expected behavior
      }
    }
  };

  return (
    <>
      {/* Floating button */}
      <button 
        className="webpodcast-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="WebPodify"
      >
        🎙️
      </button>

      {/* Widget panel */}
      {isOpen && (
        <div className={`webpodcast-widget ${(isProcessing || isPlaying || showSettings) ? 'webpodcast-widget-expanded' : 'webpodcast-widget-collapsed'}`}>
          {!showSettings ? (
            <>
              <div className="webpodcast-header">
                <h2>🎙️ WebPodify</h2>
                <div className="webpodcast-header-actions">
                  <button 
                    className="webpodcast-settings-icon-btn"
                    onClick={() => setShowSettings(true)}
                    title="Voice Settings"
                  >
                    ⚙️
                  </button>
                  <button 
                    className="webpodcast-close-btn"
                    onClick={() => {
                      // Stop any playback before closing
                      if (ttsEngine && isPlaying) {
                        ttsEngine.stop();
                      }
                      setIsOpen(false);
                    }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="webpodcast-subtitle">Convert webpage to 2-person podcast</p>

              {isProcessing && (
                <div className="webpodcast-processing">
                  <div className="webpodcast-spinner-container">
                    <div className="webpodcast-spinner"></div>
                    <div className="webpodcast-spinner-text">
                      {Math.round(modelProgress)}%
                    </div>
                  </div>
                  <p>Processing content...</p>
                  {modelProgress > 0 && (
                    <div className="webpodcast-progress-bar">
                      <div 
                        className="webpodcast-progress-fill" 
                        style={{ width: `${Math.min(100, modelProgress)}%` }}
                      ></div>
                    </div>
                  )}
                  <p className="webpodcast-progress-text">
                    {modelProgress > 0 ? `Loading AI model: ${Math.min(100, Math.round(modelProgress))}%` : 'Extracting content...'}
                  </p>
                </div>
              )}

              {!isProcessing && !isPlaying && (
                <button className="webpodcast-btn-primary" onClick={handleConvert}>
                  🎬 Start Podcast
                </button>
              )}

              {isPlaying && (
                <div className="webpodcast-playing">
                  {/* Chat container */}
                  <div className="webpodcast-chat-container" ref={scrollContainerRef}>
                    <MessageList 
                      messages={messages}
                      activeMessageId={activeMessageId}
                      scrollContainerRef={scrollContainerRef}
                    />
                  </div>

                  <div className="webpodcast-controls">
                    <button className="webpodcast-btn-stop" onClick={handleStop}>
                      ⏹️ Stop
                    </button>
                    <button 
                      className="webpodcast-btn-download" 
                      onClick={() => {
                        // Create a blob from messages and download as text for now
                        // (Full audio download would require concatenating buffers)
                        const content = messages.map(m => `${m.speaker === 'speaker1' ? 'Alex' : 'Sam'}: ${m.text}`).join('\n\n');
                        const blob = new Blob([content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'podcast-script.txt';
                        a.click();
                      }}
                      title="Download Script"
                    >
                      📥 Script
                    </button>
                  </div>
                  <div className="webpodcast-progress-info">
                    <p>Playing: {progress.current} / {progress.total} segments</p>
                    <div className="webpodcast-progress-bar">
                      <div 
                        className="webpodcast-progress-fill" 
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="webpodcast-header">
                <h2>⚙️ Voice Settings</h2>
                <button 
                  className="webpodcast-close-btn"
                  onClick={() => setShowSettings(false)}
                  title="Back"
                >
                  ✕
                </button>
              </div>
              <p className="webpodcast-subtitle">Configure your podcast voices</p>

              <div className="webpodcast-settings">
                <div className="webpodcast-setting-toggle">
                  <label>Night Mode</label>
                  <div
                    className={`webpodcast-toggle-switch ${settings.theme === 'dark' ? 'active' : ''}`}
                    onClick={async () => {
                      const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
                      const newSettings = { ...settings, theme: newTheme };
                      setSettings(newSettings);
                      // Save theme immediately for instant feedback
                      await saveSettings(newSettings);
                      // Update container theme
                      if (containerRef.current) {
                        containerRef.current.setAttribute('data-theme', newTheme);
                      }
                    }}
                  />
                </div>
                <div className="webpodcast-setting-item">
                  <label>Voice 1 (Host):</label>
                  <select
                    value={settings.accent1}
                    onChange={(e) => setSettings({ ...settings, accent1: e.target.value })}
                  >
                    <option value="en-US">American English</option>
                    <option value="en-GB">British English</option>
                    <option value="en-IN">Indian English</option>
                    <option value="en-AU">Australian English</option>
                    <option value="en-CA">Canadian English</option>
                  </select>
                </div>
                <div className="webpodcast-setting-item">
                  <label>Voice 2 (Guest):</label>
                  <select
                    value={settings.accent2}
                    onChange={(e) => setSettings({ ...settings, accent2: e.target.value })}
                  >
                    <option value="en-US">American English</option>
                    <option value="en-GB">British English</option>
                    <option value="en-IN">Indian English</option>
                    <option value="en-AU">Australian English</option>
                    <option value="en-CA">Canadian English</option>
                  </select>
                </div>
                <div className="webpodcast-setting-item">
                  <label>Speed: {settings.speed}x</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.speed}
                    onChange={(e) => setSettings({ ...settings, speed: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="webpodcast-footer">
                <button 
                  className="webpodcast-btn-primary" 
                  onClick={async () => {
                    await saveSettings(settings);
                    if (ttsEngine) {
                      ttsEngine.setSettings(settings);
                    }
                    setSaved(true);
                    setTimeout(() => {
                      setSaved(false);
                      setShowSettings(false);
                    }, 1000);
                  }}
                >
                  {saved ? '✓ Saved!' : 'Save Settings'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default Widget;
