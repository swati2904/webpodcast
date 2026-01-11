import React, { useState, useEffect } from 'react';
import { convertToDialogue, initializeModel } from '@/ai/dialogueConverter.js';
import { getSettings, saveSettings } from '@/utils/storage.js';
import { TTSEngine } from '@/tts/ttsEngine.js';
import { extractPageContent } from './contentExtractor.js';

function Widget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [modelProgress, setModelProgress] = useState(0);
  const [settings, setSettings] = useState({
    speed: 1.0,
    accent1: 'en-US',
    accent2: 'en-IN'
  });
  const [ttsEngine, setTtsEngine] = useState(null);

  useEffect(() => {
    // Initialize TTS engine
    const engine = new TTSEngine();
    setTtsEngine(engine);

    // Load settings
    getSettings().then(savedSettings => {
      setSettings(savedSettings);
      engine.setSettings(savedSettings);
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

  const handleConvert = async () => {
    setIsProcessing(true);
    setModelProgress(0);

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

      // Play dialogue (this is async but non-blocking)
      ttsEngine.speakDialogue(dialogueSegments, (current, total) => {
        setProgress({ current, total });
      }).then(() => {
        setIsPlaying(false);
      }).catch((error) => {
        console.error('Playback error:', error);
        setIsPlaying(false);
      });
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
      setIsProcessing(false);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    // Immediate UI update for responsive feel
    setIsPlaying(false);
    setProgress({ current: 0, total: 0 });
    
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
        title="WebPodcast"
      >
        🎙️
      </button>

      {/* Widget panel */}
      {isOpen && (
        <div className="webpodcast-widget">
          <div className="webpodcast-header">
            <h2>🎙️ WebPodcast</h2>
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
          <p className="webpodcast-subtitle">Convert webpage to 2-person podcast</p>

          {isProcessing && (
            <div className="webpodcast-processing">
              <div className="webpodcast-spinner"></div>
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
              <div className="webpodcast-controls">
                <button className="webpodcast-btn-stop" onClick={handleStop}>
                  ⏹️ Stop
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

          <div className="webpodcast-settings">
            <div className="webpodcast-setting-item">
              <label>Speed: {settings.speed}x</label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="webpodcast-footer">
            <button 
              className="webpodcast-btn-settings" 
              onClick={() => chrome.runtime.openOptionsPage()}
            >
              ⚙️ Voice Settings
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Widget;
