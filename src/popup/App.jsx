import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
// Note: These imports will work after build
// For development, we'll need to adjust the paths
import { convertToDialogue } from '@/ai/dialogueConverter.js';
import { getSettings, saveSettings } from '@/utils/storage.js';
import { TTSEngine } from '@/tts/ttsEngine.js';

function App() {
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
  const engineRef = useRef(null);

  useEffect(() => {
    // Initialize TTS engine
    const engine = new TTSEngine();
    engineRef.current = engine;
    setTtsEngine(engine);

    // Load settings
    const loadSettings = async () => {
      const savedSettings = await getSettings();
      setSettings(savedSettings);
      if (engineRef.current) {
        engineRef.current.setSettings(savedSettings);
      }
    };
    loadSettings();

    // Listen for settings changes (e.g., from options page)
    const handleStorageChange = (changes, areaName) => {
      if (areaName === 'sync' && changes) {
        // Check if any settings keys changed
        const settingKeys = ['accent1', 'accent2', 'speed', 'voice1', 'voice2'];
        const hasSettingChanges = Object.keys(changes).some(key => settingKeys.includes(key));
        
        if (hasSettingChanges) {
          loadSettings();
        }
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);

    // Listen for model loading progress
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'model-load-progress') {
        // Ensure progress is between 0-100
        const progress = Math.max(0, Math.min(100, message.progress * 100));
        setModelProgress(progress);
      }
    });

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  const handleConvert = async () => {
    setIsProcessing(true);
    setModelProgress(0);

    try {
      // Extract content from current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to extract content');
      }

      const { title, text } = response.content;

      if (!text || text.length < 100) {
        alert('Not enough content found on this page. Please try a different page.');
        setIsProcessing(false);
        return;
      }

      // Convert to dialogue
      const dialogueSegments = await convertToDialogue(text, title);

      if (!dialogueSegments || dialogueSegments.length === 0) {
        throw new Error('Failed to generate dialogue');
      }

      // Start playback
      setIsProcessing(false);
      setIsPlaying(true);
      setProgress({ current: 0, total: dialogueSegments.length });

      // Play dialogue
      await ttsEngine.speakDialogue(dialogueSegments, (current, total) => {
        setProgress({ current, total });
      });

      setIsPlaying(false);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
      setIsProcessing(false);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (ttsEngine) {
      ttsEngine.stop();
      setIsPlaying(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleSpeedChange = async (newSpeed) => {
    const newSettings = { ...settings, speed: newSpeed };
    setSettings(newSettings);
    await saveSettings(newSettings);
    if (ttsEngine) {
      ttsEngine.setSettings(newSettings);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>🎙️ WebPodcast</h1>
        <p className="subtitle">Convert webpage to 2-person podcast</p>
      </div>

      {isProcessing && (
        <div className="processing">
          <div className="spinner"></div>
          <p>Processing content...</p>
          {modelProgress > 0 && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, modelProgress)}%` }}
              ></div>
            </div>
          )}
          <p className="progress-text">
            {modelProgress > 0 ? `Loading AI model: ${Math.min(100, Math.round(modelProgress))}%` : 'Extracting content...'}
          </p>
        </div>
      )}

      {!isProcessing && !isPlaying && (
        <button className="btn-primary" onClick={handleConvert}>
          🎬 Start Podcast
        </button>
      )}

      {isPlaying && (
        <div className="playing">
          <div className="controls">
            <button className="btn-stop" onClick={handleStop}>
              ⏹️ Stop
            </button>
          </div>
          <div className="progress-info">
            <p>Playing: {progress.current} / {progress.total} segments</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
