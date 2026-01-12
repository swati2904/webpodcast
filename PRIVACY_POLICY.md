# Privacy Policy for WebPodcast Chrome Extension

**Last Updated**: [Date]

## Overview

WebPodcast ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how the WebPodcast Chrome Extension ("Extension") handles information.

## Key Principle: Zero Data Collection

**WebPodcast processes all data locally in your browser. We do not collect, store, transmit, or have access to any of your personal information or browsing data.**

## How WebPodcast Works

### 100% Client-Side Processing

- **Text Extraction**: The extension extracts article content directly from the webpage you're viewing. This happens entirely in your browser.
- **AI Processing**: The T5-small AI model runs locally in your browser using Transformers.js. The model is downloaded once and cached locally.
- **Text-to-Speech**: Audio synthesis happens using your browser's Web Speech API. No audio data leaves your device.
- **Storage**: Settings (voice preferences, playback speed) are stored locally in Chrome's storage API. This data never leaves your device.

### No Server Communication

- WebPodcast does not send any data to external servers.
- The only network activity is the one-time download of the AI model (~150-200MB) from Hugging Face CDN when you first use the extension.
- After the initial download, the extension can work entirely offline (if the webpage content is already loaded).

## What Data We Don't Collect

We do **NOT** collect:
- ❌ Personal information (name, email, etc.)
- ❌ Browsing history
- ❌ Article content you convert
- ❌ Audio recordings
- ❌ Usage statistics
- ❌ Device information
- ❌ Location data
- ❌ Any other personal data

## Third-Party Services

### Hugging Face CDN
- **Purpose**: Downloads the T5-small AI model files
- **Data**: Only model files are downloaded (standard ML model files, no personal data)
- **Privacy**: Model files are cached locally after download
- **Note**: This is a standard CDN service, similar to downloading a JavaScript library

### Chrome Web Store
- If you install WebPodcast from Chrome Web Store, Google's standard privacy policies apply to the installation process. We do not receive any information about who installs the extension.

## Local Storage

The extension stores the following data **locally on your device only**:
- Voice accent preferences (e.g., "en-US", "en-GB")
- Playback speed settings
- Theme preference (dark/light mode)

**This data never leaves your device** and is only accessible to the extension.

## Permissions Explained

### ActiveTab
- **Why**: To extract article content from the current tab
- **Usage**: Only when you click "Start Podcast"
- **Scope**: Only the currently active tab

### Storage
- **Why**: To save your voice preferences and settings
- **Usage**: Stores settings locally in Chrome's storage API
- **Scope**: Local only, never synced or transmitted

### Scripting
- **Why**: To inject content scripts for text extraction
- **Usage**: Only on pages where you activate the extension
- **Scope**: Content extraction only

### Host Permissions (<all_urls>)
- **Why**: To work on any webpage you visit
- **Usage**: Extracts content only when you explicitly start a podcast
- **Scope**: Read-only content extraction, no data transmission

## Cookies and Tracking

- WebPodcast does not use cookies
- WebPodcast does not use tracking technologies
- WebPodcast does not integrate with analytics services

## Children's Privacy

WebPodcast does not knowingly collect information from children. Since we don't collect any information, this is not applicable, but we want to be clear: the extension is safe for users of all ages.

## Changes to This Privacy Policy

We may update this Privacy Policy occasionally. The "Last Updated" date at the top will reflect any changes. We encourage you to review this policy periodically.

## Your Rights

Since we don't collect any data, there's no data to access, delete, or modify. However, you can:
- **Uninstall**: Remove the extension at any time through Chrome's extension settings
- **Clear Local Data**: Clear Chrome's local storage if you want to reset settings
- **Review Source Code**: WebPodcast is open source (if you've made it open source)

## Contact

If you have questions about this Privacy Policy, please contact us through:
- GitHub Issues: [Your GitHub repo URL]/issues
- Email: [Your email if you want to provide one]

## Summary

**In plain language**: WebPodcast works entirely on your computer. It reads the webpage you're viewing, processes it with AI that runs in your browser, and creates audio that plays locally. Nothing leaves your device. We don't know what you're reading, we don't know you're using the extension, and we don't collect any information about you.

---

**This privacy policy can be hosted on:**
- GitHub Pages (free)
- Your landing page website
- GitHub repo (as a file, then link to raw content)

**For Chrome Web Store**: Provide the full URL where this policy is hosted.
