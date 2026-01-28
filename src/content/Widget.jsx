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
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [targetProgress, setTargetProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [tempDialogue, setTempDialogue] = useState(null);
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

  // Smooth progress animation loop
  useEffect(() => {
    let animationFrame;
    if (isProcessing && displayProgress < targetProgress) {
      const animate = () => {
        setDisplayProgress(prev => {
          if (prev < targetProgress) {
            // Speed up the closer we get to the target, but keep it smooth
            const diff = targetProgress - prev;
            const step = Math.max(0.1, diff * 0.1);
            return prev + step;
          }
          return prev;
        });
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isProcessing, targetProgress, displayProgress]);

  // Handle transition to main screen only after 100% is reached
  useEffect(() => {
    if (isProcessing && displayProgress >= 99.9 && isComplete) {
      setDisplayProgress(100);
      const timeout = setTimeout(() => {
        setIsProcessing(false);
        setIsPlaying(true);
        setIsComplete(false);
        
        // Start playback if we have dialogue
        if (tempDialogue) {
          startPlayback(tempDialogue);
          setTempDialogue(null);
        }
      }, 800); // 800ms delay to show the 100% / Ready state
      return () => clearTimeout(timeout);
    }
  }, [displayProgress, isComplete, isProcessing, tempDialogue]);

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
        // Map 0-100% model loading to 10-90% range for UI
        const realProgress = Math.max(0, Math.min(100, message.progress * 100));
        const uiTarget = 10 + (realProgress * 0.8);
        setTargetProgress(prev => Math.max(prev, uiTarget));
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    // Preload model in background when widget opens (non-blocking)
    initializeModel().catch(() => {});

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      if (engine) engine.stop();
    };
  }, []);

  // Update theme when settings change
  useEffect(() => {
    if (containerRef.current && settings.theme) {
      containerRef.current.setAttribute('data-theme', settings.theme);
    }
  }, [settings.theme]);

  const startPlayback = (dialogueSegments) => {
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
  };

  const handleConvert = async () => {
    setIsProcessing(true);
    setTargetProgress(0);
    setDisplayProgress(0);
    setIsComplete(false);
    setIsPaused(false);
    setTempDialogue(null);
    setMessages([]);
    setActiveMessageId(null);

    // Extraction progress (0-10%)
    setTargetProgress(10);

    try {
      // Extract content
      const content = await extractPageContent();
      
      if (!content || !content.text || content.text.length < 100) {
        alert('Not enough content found on this page. Please try a different page.');
        setIsProcessing(false);
        return;
      }

      // Start the heavy work
      const dialogueSegments = await convertToDialogue(content.text, content.title);
      
      if (!dialogueSegments || dialogueSegments.length === 0) {
        throw new Error('Failed to generate dialogue');
      }

      // Store results and set target to 100
      setTempDialogue(dialogueSegments);
      setTargetProgress(100);
      setIsComplete(true);

    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleTogglePlay = () => {
    if (isPaused) {
      setIsPaused(false);
      if (ttsEngine) ttsEngine.resume();
    } else {
      setIsPaused(true);
      if (ttsEngine) ttsEngine.pause();
    }
  };

  const handleStop = () => {
    // Immediate UI update for responsive feel
    setIsPlaying(false);
    setIsPaused(false);
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
                      handleStop();
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
                      {Math.round(displayProgress)}%
                    </div>
                  </div>
                  <p>Processing content...</p>
                  <div className="webpodcast-progress-bar">
                    <div 
                      className="webpodcast-progress-fill" 
                      style={{ width: `${displayProgress}%` }}
                    ></div>
                  </div>
                  <p className="webpodcast-progress-text">
                    {displayProgress < 10 && 'Extracting page content...'}
                    {displayProgress >= 10 && displayProgress < 90 && 'Loading AI models...'}
                    {displayProgress >= 90 && displayProgress < 100 && 'AI is thinking... Generating your podcast'}
                    {displayProgress >= 100 && 'Ready!'}
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
                    <button className="webpodcast-btn-play-pause" onClick={handleTogglePlay}>
                      <span className="webpodcast-icon">{isPaused ? '▶' : 'Ⅱ'}</span>
                      {isPaused ? 'Resume' : 'Pause'}
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
