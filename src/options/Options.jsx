import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './Options.css';
import { getSettings, saveSettings } from '@/utils/storage.js';

function Options() {
  const [settings, setSettings] = useState({
    accent1: 'en-US',
    accent2: 'en-IN',
    speed: 1.0
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(savedSettings => {
      setSettings(savedSettings);
    });
  }, []);

  const handleSave = async () => {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const accents = [
    { code: 'en-US', name: 'American English' },
    { code: 'en-GB', name: 'British English' },
    { code: 'en-IN', name: 'Indian English' },
    { code: 'en-AU', name: 'Australian English' },
    { code: 'en-CA', name: 'Canadian English' }
  ];

  return (
    <div className="options">
      <div className="header">
        <h1>🎙️ WebPodcast Settings</h1>
        <p>Configure your podcast voices (one-time setup)</p>
      </div>

      <div className="settings-section">
        <h2>Voice 1 (Host/Interviewer)</h2>
        <select
          value={settings.accent1}
          onChange={(e) => setSettings({ ...settings, accent1: e.target.value })}
        >
          {accents.map(accent => (
            <option key={accent.code} value={accent.code}>
              {accent.name}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-section">
        <h2>Voice 2 (Expert/Guest)</h2>
        <select
          value={settings.accent2}
          onChange={(e) => setSettings({ ...settings, accent2: e.target.value })}
        >
          {accents.map(accent => (
            <option key={accent.code} value={accent.code}>
              {accent.name}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-section">
        <h2>Default Speed</h2>
        <div className="speed-control">
          <label>{settings.speed}x</label>
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

      <button className="btn-save" onClick={handleSave}>
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>

      <div className="info">
        <p><strong>Note:</strong> These settings are saved and will be used for all podcasts.</p>
        <p>You can change the speed during playback from the popup.</p>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Options />);
