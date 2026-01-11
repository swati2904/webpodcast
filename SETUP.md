# Setup Instructions

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Extension**
   ```bash
   npm run build
   ```

3. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

4. **First Use**
   - Click the extension icon on any webpage
   - Click "Start Podcast"
   - On first run, the T5-small AI model will download (~150-200MB)
   - This happens once and is cached locally
   - You'll see a progress indicator during download

## Development

For development with hot reload:

```bash
npm run dev
```

Note: Chrome extensions need to be reloaded manually after changes.

## Project Structure

```
webpodcast/
├── src/
│   ├── popup/          # React popup UI
│   ├── content/        # Content script (text extraction)
│   ├── background/     # Service worker
│   ├── ai/             # AI dialogue conversion (T5-small)
│   ├── tts/            # Text-to-speech engine
│   ├── utils/          # Utilities
│   └── options/         # Settings page
├── public/             # Static assets (icons)
├── dist/               # Built extension (after npm run build)
└── manifest.json       # Extension configuration
```

## How It Works

1. **Text Extraction**: Content script uses Readability.js to extract main content
2. **AI Conversion**: T5-small model converts text to dialogue format
3. **Rule-Based Enhancement**: Adds natural transitions and formatting
4. **TTS Playback**: Web Speech API reads dialogue with two voices
5. **User Controls**: Play/pause, speed control, voice selection

## Model Downloads

- **T5-small**: Downloads automatically on first use (~150-200MB)
- Models are cached in browser storage
- No internet required after first download

## Troubleshooting

### Model not loading?
- Check internet connection (needed for first download)
- Check browser console for errors
- Try reloading the extension

### Voices not working?
- Go to Settings (⚙️ icon in popup)
- Select different accents
- Save settings

### Content not extracting?
- Some pages may not work well
- Try pages with article-style content
- Check browser console for errors

## Next Steps (Future Enhancements)

- [ ] Integrate Piper TTS for better voice quality
- [ ] Add more dialogue formats (interview, discussion, etc.)
- [ ] Support for more languages
- [ ] Export audio as MP3
- [ ] Bookmark/save position
