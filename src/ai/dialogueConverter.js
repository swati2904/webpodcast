// AI-powered dialogue conversion using T5-small model
import { pipeline } from '@xenova/transformers';

let generator = null;
let isModelLoading = false;

/**
 * Initialize the T5-small model (lazy loading)
 * Preload this in the background for faster first use
 * @returns {Promise}
 */
export async function initializeModel() {
  if (generator) {
    return generator;
  }

  if (isModelLoading) {
    // Wait for existing load
    while (isModelLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return generator;
  }

  isModelLoading = true;

  try {
    // Load T5-small model (quantized, ~150-200MB)
    // Model will be downloaded and cached on first use
    generator = await pipeline('text2text-generation', 'Xenova/t5-small', {
      quantized: true,
      progress_callback: (progress) => {
        // Send progress updates to UI
        if (progress.status === 'progress') {
          // Normalize progress to 0-1 range (handle both decimal and percentage formats)
          let normalizedProgress = progress.progress || 0;
          if (normalizedProgress > 1) {
            normalizedProgress = normalizedProgress / 100; // Convert percentage to decimal
          }
          // Clamp to 0-1 range
          normalizedProgress = Math.max(0, Math.min(1, normalizedProgress));

          chrome.runtime.sendMessage({
            type: 'model-load-progress',
            progress: normalizedProgress,
          });
        }
      },
    });

    isModelLoading = false;
    return generator;
  } catch (error) {
    isModelLoading = false;
    console.error('Error loading model:', error);
    throw error;
  }
}

/**
 * Convert article text to dialogue format using AI + rules
 * @param {string} articleText - The article content
 * @param {string} title - Article title
 * @returns {Promise<Array>} Array of dialogue segments
 */
export async function convertToDialogue(articleText, title) {
  try {
    // Request dialogue generation from background (which uses offscreen)
    const response = await chrome.runtime.sendMessage({
      type: 'generate-dialogue-request',
      data: { text: articleText, title }
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to generate dialogue via offscreen');
    }

    const generatedText = response.data;
    
    // Parse the generated text into segments
    const aiDialogue = parseAIDialogue(generatedText);

    // Enhance with rule-based post-processing
    const enhancedDialogue = enhanceDialogue(aiDialogue, 0, 1);

    return enhancedDialogue;
  } catch (error) {
    console.error('Error converting to dialogue:', error);
    // Fallback to rule-based conversion
    return ruleBasedConversion(articleText, title);
  }
}

/**
 * Create prompt for T5-small to convert text to dialogue
 */
function createDialoguePrompt(text, isFirst, title) {
  if (isFirst) {
    return `Convert this article into a natural conversation between two people (Host and Expert) discussing the topic. Make it engaging and podcast-style. Start with an introduction.

Title: ${title}

Article: ${text}

Conversation:`;
  }

  return `Continue the conversation about this topic:

${text}

Conversation:`;
}

/**
 * Parse AI-generated dialogue into structured format
 */
function parseAIDialogue(text) {
  const segments = [];
  const lines = text.split('\n').filter((line) => line.trim());

  let currentSpeaker = 'speaker1';
  let currentText = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect speaker changes with various patterns
    const hostPattern =
      /^(Alex|Host|Speaker 1|Person A|Interviewer|Question|Q)[:：\s-]/i;
    const expertPattern =
      /^(Sam|Expert|Speaker 2|Person B|Interviewee|Answer|A)[:：\s-]/i;

    if (hostPattern.test(trimmed)) {
      if (currentText) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim() });
      }
      currentSpeaker = 'speaker1';
      currentText = trimmed.replace(hostPattern, '').trim();
    } else if (expertPattern.test(trimmed)) {
      if (currentText) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim() });
      }
      currentSpeaker = 'speaker2';
      currentText = trimmed.replace(expertPattern, '').trim();
    } else if (trimmed.includes(':')) {
      // Handle cases where AI might use other names but with a colon
      const parts = trimmed.split(':');
      const name = parts[0].trim().toLowerCase();
      if (currentText) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim() });
      }
      // Alternate based on previous speaker if name is unknown
      currentSpeaker = currentSpeaker === 'speaker1' ? 'speaker2' : 'speaker1';
      currentText = parts.slice(1).join(':').trim();
    } else {
      // Continue current speaker's text
      currentText += (currentText ? ' ' : '') + trimmed;
    }
  }

  if (currentText) {
    segments.push({ speaker: currentSpeaker, text: currentText.trim() });
  }

  // Ensure we have alternating speakers
  if (segments.length > 0) {
    // If all segments are same speaker, alternate them
    const allSameSpeaker = segments.every(
      (s) => s.speaker === segments[0].speaker
    );
    if (allSameSpeaker && segments.length > 1) {
      segments.forEach((seg, idx) => {
        seg.speaker = idx % 2 === 0 ? 'speaker1' : 'speaker2';
      });
    }
    return segments;
  }

  // Fallback: split text and alternate
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  return sentences.map((sentence, idx) => ({
    speaker: idx % 2 === 0 ? 'speaker1' : 'speaker2',
    text: sentence.trim() + '.',
  }));
}

/**
 * Enhance dialogue with rule-based post-processing
 */
function enhanceDialogue(segments, chunkIndex, totalChunks) {
  const enhanced = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Add natural transitions
    if (i === 0 && chunkIndex === 0) {
      // First segment - add introduction
      enhanced.push({
        speaker: 'speaker1',
        text: `Today we're discussing: ${segment.text.substring(0, 100)}...`,
      });
    }

    // Ensure speaker alternation
    if (
      enhanced.length > 0 &&
      enhanced[enhanced.length - 1].speaker === segment.speaker
    ) {
      // Add transition phrase
      const transitions = {
        speaker1: ["That's interesting.", 'Tell me more about that.', 'I see.'],
        speaker2: ['Well,', 'You know,', 'Actually,'],
      };
      const transition =
        transitions[segment.speaker]?.[
          Math.floor(Math.random() * transitions[segment.speaker].length)
        ] || '';
      enhanced.push({
        speaker: segment.speaker === 'speaker1' ? 'speaker2' : 'speaker1',
        text: transition,
      });
    }

    enhanced.push(segment);
  }

  return enhanced;
}

/**
 * Split text into manageable chunks
 */
function splitIntoChunks(text, maxWords) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }

  return chunks;
}

/**
 * Fallback: Rule-based conversion if AI fails
 */
function ruleBasedConversion(articleText, title) {
  // Split into sentences for better dialogue flow
  const sentences = articleText
    .replace(/\n\n+/g, ' ')
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20); // Filter out very short sentences

  if (sentences.length === 0) {
    // Fallback to paragraphs if sentence splitting fails
    const paragraphs = articleText
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 50);

    return createDialogueFromParagraphs(paragraphs, title);
  }

  const segments = [];

  // Introduction
  segments.push({
    speaker: 'speaker1',
    text: `Today we're discussing ${title}. Let me tell you about it.`,
  });

  // Alternate sentences between speakers for natural conversation
  sentences.forEach((sentence, index) => {
    // Alternate: speaker1, speaker2, speaker1, speaker2...
    const speaker = index % 2 === 0 ? 'speaker2' : 'speaker1';

    // Add natural transitions
    if (index > 0 && index % 4 === 0) {
      // Every 4 sentences, add a question/comment
      segments.push({
        speaker: 'speaker1',
        text: "That's interesting. Tell me more.",
      });
    }

    segments.push({
      speaker,
      text: sentence + '.',
    });
  });

  // Ensure we have at least 2 segments with different speakers
  if (segments.length < 2) {
    return createDialogueFromParagraphs(
      articleText.split(/\n\n+/).filter((p) => p.trim().length > 50),
      title
    );
  }

  return segments;
}

/**
 * Create dialogue from paragraphs (fallback method)
 */
function createDialogueFromParagraphs(paragraphs, title) {
  const segments = [];

  segments.push({
    speaker: 'speaker1',
    text: `Let's talk about ${title}.`,
  });

  paragraphs.forEach((para, index) => {
    const speaker = index % 2 === 0 ? 'speaker2' : 'speaker1';

    if (speaker === 'speaker1' && index > 0) {
      segments.push({
        speaker: 'speaker1',
        text: 'What do you think about that?',
      });
    }

    segments.push({
      speaker,
      text: para.trim(),
    });
  });

  return segments;
}
