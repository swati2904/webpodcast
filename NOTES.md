# Development Notes

## Current Implementation Status

### ✅ Completed
- Chrome extension structure (Manifest V3)
- React popup UI with controls
- Content script for text extraction
- T5-small AI model integration (Transformers.js)
- Rule-based dialogue post-processing
- Background service worker
- Settings/options page
- Web Speech API TTS (temporary)

### 🚧 In Progress / TODO
- **Piper TTS Integration**: Currently using Web Speech API as temporary solution
  - Web Speech API works but voices are limited
  - Piper TTS will provide better quality and more voice options
  - Need to integrate Piper WebAssembly and voice models

### 📝 Important Notes

1. **Model Downloads**
   - T5-small model (~150-200MB) downloads on first use
   - Models are cached in browser storage
   - User will see progress indicator during download

2. **Content Script Imports**
   - Vite bundles all imports properly
   - Content scripts work with ES6 imports after build
   - Readability.js is bundled automatically

3. **TTS Current State**
   - Using Web Speech API (browser native)
   - Works but limited voice options
   - Accent selection may be limited by browser/OS
   - Piper TTS integration planned for better quality

4. **Icons**
   - Placeholder icons created
   - Need to replace with actual podcast/microphone icons
   - See ICONS.md for details

## Next Steps for Production

1. **Replace Icons**
   - Create proper 16x16, 48x48, 128x128 PNG icons
   - Use podcast/microphone theme

2. **Piper TTS Integration**
   - Research Piper TTS WebAssembly integration
   - Download voice models (2 voices, ~50MB total)
   - Implement voice loading and playback
   - Replace Web Speech API

3. **Testing**
   - Test on various websites
   - Test model loading and caching
   - Test dialogue quality
   - Test voice playback

4. **Optimization**
   - Optimize bundle size
   - Improve dialogue conversion prompts
   - Add error handling
   - Add loading states

5. **Polish**
   - Improve UI/UX
   - Add keyboard shortcuts
   - Add text highlighting during playback
   - Add export audio feature

## Architecture Decisions

### Why T5-small?
- Smallest viable model for dialogue conversion (~150-200MB)
- Text-to-text architecture perfect for this task
- Good balance of quality and size
- Works well with Transformers.js

### Why Hybrid Approach?
- AI handles complex dialogue generation
- Rules ensure natural flow and transitions
- Fallback to rules if AI fails
- Best of both worlds

### Why Web Speech API First?
- Immediate functionality
- No additional downloads
- Works out of the box
- Can upgrade to Piper TTS later

## Known Limitations

1. **Voice Quality**: Web Speech API voices may sound robotic
2. **Accent Availability**: Depends on browser/OS
3. **Model Size**: T5-small download on first use (~150-200MB)
4. **Processing Time**: AI conversion takes a few seconds
5. **Long Articles**: Very long articles may need chunking

## Future Enhancements

- [ ] Piper TTS integration
- [ ] More dialogue formats (interview, discussion, debate)
- [ ] Multiple language support
- [ ] Audio export (MP3)
- [ ] Bookmark/save position
- [ ] Text highlighting during playback
- [ ] Custom voice training
- [ ] Background playback (even when tab is closed)
