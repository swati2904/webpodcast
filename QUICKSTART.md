# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build Extension
```bash
npm run build
```

### Step 3: Load in Chrome
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist` folder

### Step 4: Use It!
1. Go to any article/news website
2. Click the extension icon
3. Click "Start Podcast"
4. Wait for AI model to download (first time only, ~150-200MB)
5. Enjoy your 2-person podcast!

## 🎯 Features

- ✅ **AI-Powered**: T5-small converts articles to natural dialogue
- ✅ **Two Voices**: Distinct voices for engaging conversation
- ✅ **100% Free**: All client-side, no server calls
- ✅ **Speed Control**: Adjust playback speed
- ✅ **Voice Selection**: Choose accents (one-time setup)

## 📋 Requirements

- Chrome/Edge browser (Manifest V3 support)
- Internet connection (for first-time model download)
- ~200-250MB storage (for cached models)

## 🎨 Customization

### Change Voices
1. Click extension icon
2. Click "⚙️ Voice Settings"
3. Select accents for Voice 1 and Voice 2
4. Save settings

### Adjust Speed
- Use the speed slider in the popup
- Settings are saved automatically

## 🐛 Troubleshooting

**Model not loading?**
- Check internet connection
- Check browser console (F12)
- Try reloading extension

**No content extracted?**
- Try a different webpage
- Article-style pages work best
- Check browser console for errors

**Voices not working?**
- Go to Settings and select different accents
- Some accents may not be available on your OS
- Try different accent combinations

## 📚 Learn More

- See `SETUP.md` for detailed setup
- See `NOTES.md` for development details
- See `README.md` for project overview

## 🎉 Enjoy!

Your hybrid AI-powered podcast extension is ready to use!
