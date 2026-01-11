# WebPodcast - Chrome Extension

Convert any webpage into a 2-person podcast-style conversation using AI, entirely client-side and 100% free.

## Features

- 🤖 **AI-Powered Dialogue**: Uses T5-small model to convert articles into natural conversations
- 🎙️ **Two-Voice Narration**: Two distinct voices for engaging podcast-style experience
- ⚡ **100% Client-Side**: No server calls, all processing happens in your browser
- 🎚️ **Speed Control**: Adjust playback speed
- 🎭 **Voice Selection**: Choose different accents (one-time setup)
- 💾 **Smart Caching**: Models are cached locally after first download

## Tech Stack

- **React** - UI framework
- **Transformers.js** - Client-side AI (T5-small model)
- **Piper TTS** - High-quality text-to-speech
- **Readability.js** - Content extraction
- **Chrome Extension Manifest V3**

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

```bash
npm run dev
```

## Project Structure

```
webpodcast/
├── src/
│   ├── popup/          # React popup UI
│   ├── content/        # Content script for text extraction
│   ├── background/     # Service worker
│   ├── ai/             # AI dialogue conversion
│   ├── tts/            # Text-to-speech engine
│   ├── utils/          # Utilities
│   └── options/         # Settings page
├── public/             # Static assets
└── dist/               # Built extension
```

## How It Works

1. **Text Extraction**: Extracts main content from webpage using Readability.js
2. **AI Conversion**: T5-small model converts text to dialogue format
3. **Rule-Based Enhancement**: Adds natural transitions and formatting
4. **Two-Voice TTS**: Piper TTS reads dialogue with two distinct voices
5. **Playback**: User controls playback through popup UI

## Model Sizes

- **T5-small**: ~150-200MB (downloaded on first use, cached)
- **Piper TTS (2 voices)**: ~50MB (downloaded on first use, cached)
- **Extension core**: ~5-10MB

## License

MIT
