// Text-to-Speech engine using Web Speech API (temporary)
// TODO: Integrate Piper TTS for better quality

/**
 * TTS Engine using Web Speech API
 * This is a temporary implementation. Piper TTS will be integrated later.
 */
export class TTSEngine {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.currentUtterance = null;
    this.isPlaying = false;
    this.queue = [];
    this.currentIndex = 0;
    this.settings = {
      voice1: null,
      voice2: null,
      speed: 1.0,
    };

    this.loadVoices();

    // Reload voices when they become available
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  /**
   * Load available voices
   */
  loadVoices() {
    this.voices = this.synthesis.getVoices();
  }

  /**
   * Set TTS settings
   */
  async setSettings(settings) {
    this.settings = { ...this.settings, ...settings };

    // Find distinct voices by language/accent
    if (settings.accent1 && settings.accent2) {
      const { voice1, voice2 } = this.getDistinctVoices(
        settings.accent1,
        settings.accent2
      );
      this.settings.voice1 = voice1;
      this.settings.voice2 = voice2;
    } else {
      if (settings.accent1) {
        this.settings.voice1 = this.findVoice(settings.accent1);
      }
      if (settings.accent2) {
        this.settings.voice2 = this.findVoice(settings.accent2);
      }
    }
  }

  /**
   * Find voice by language/accent
   */
  findVoice(lang) {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }

    // Try to find voice matching language exactly
    let voice = this.voices.find((v) => v.lang === lang);

    // Try to find voice matching language prefix
    if (!voice) {
      voice = this.voices.find((v) => v.lang.startsWith(lang));
    }

    // Fallback to any voice with that language code
    if (!voice) {
      const langCode = lang.split('-')[0];
      voice = this.voices.find((v) => v.lang.startsWith(langCode));
    }

    // Final fallback - try to get different voices for speaker1 and speaker2
    if (!voice) {
      voice = this.voices.find((v) => v.default) || this.voices[0];
    }

    return voice;
  }

  /**
   * Get distinct voices for two speakers
   */
  getDistinctVoices(lang1, lang2) {
    const voice1 = this.findVoice(lang1);
    let voice2 = this.findVoice(lang2);

    // Ensure voices are different
    if (voice1 && voice2 && voice1.name === voice2.name) {
      // Find a different voice
      voice2 =
        this.voices.find(
          (v) =>
            v.lang.startsWith(lang2.split('-')[0]) && v.name !== voice1.name
        ) ||
        this.voices.find((v) => v.name !== voice1.name) ||
        voice2;
    }

    return { voice1, voice2 };
  }

  /**
   * Speak dialogue segments
   * @param {Array} segments - Dialogue segments to speak
   * @param {Function} onProgress - Progress callback (current, total)
   * @param {Function} onSegmentStart - Called when a segment starts (index, segment)
   * @param {Function} onSegmentEnd - Called when a segment ends (index, segment)
   */
  async speakDialogue(segments, onProgress, onSegmentStart, onSegmentEnd) {
    this.queue = segments;
    this.isPlaying = true;
    this.currentIndex = 0;

    try {
      for (let i = 0; i < segments.length; i++) {
        if (!this.isPlaying) {
          // Stopped by user
          break;
        }

        this.currentIndex = i;
        const segment = segments[i];
        const voice =
          segment.speaker === 'speaker1'
            ? this.settings.voice1
            : this.settings.voice2;

        // Add small pause between speakers for natural flow
        if (i > 0 && segments[i - 1].speaker !== segment.speaker) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // Call onSegmentStart before speaking
        if (onSegmentStart && this.isPlaying) {
          onSegmentStart(i, segment);
        }

        await this.speak(segment.text, voice, this.settings.speed);

        // Call onSegmentEnd after speaking completes
        if (onSegmentEnd && this.isPlaying) {
          onSegmentEnd(i, segment);
        }

        if (onProgress && this.isPlaying) {
          onProgress(i + 1, segments.length);
        }
      }
    } catch (error) {
      console.error('Error during playback:', error);
    } finally {
      this.isPlaying = false;
      this.currentIndex = 0;
    }
  }

  /**
   * Speak a single text
   */
  speak(text, voice, speed = 1.0) {
    return new Promise((resolve, reject) => {
      // Check if stopped before starting
      if (!this.isPlaying) {
        resolve();
        return;
      }

      // Cancel any current speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.rate = speed;
      utterance.pitch = voice && voice.name.includes('Female') ? 1.1 : 0.9; // Slight pitch difference
      utterance.volume = 1.0;

      // Handle completion
      utterance.onend = () => {
        if (this.isPlaying) {
          resolve();
        }
      };

      utterance.onerror = (error) => {
        // Ignore 'interrupted' errors - they're expected when stopping
        if (error.error !== 'interrupted') {
          console.error('Speech error:', error);
        }
        // Always resolve - don't reject on errors, especially interruptions
        resolve();
      };

      // Check again before speaking
      if (!this.isPlaying) {
        resolve();
        return;
      }

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Pause playback
   */
  pause() {
    if (this.isPlaying) {
      this.isPlaying = false;
      try {
        this.synthesis.pause();
      } catch (error) {
        // If pause fails, just cancel
        this.synthesis.cancel();
      }
    }
  }

  /**
   * Resume playback
   */
  resume() {
    this.isPlaying = true;
    this.synthesis.resume();
  }

  /**
   * Stop playback - immediate response
   */
  stop() {
    // Set flag first to prevent new utterances
    this.isPlaying = false;
    this.queue = [];
    this.currentIndex = 0;
    
    try {
      // Cancel all speech immediately (synchronous)
      this.synthesis.cancel();
      this.currentUtterance = null;
    } catch (error) {
      // Ignore errors - cancel is best effort
    }
  }

  /**
   * Check if playing
   */
  getPlaying() {
    return this.isPlaying;
  }
}
