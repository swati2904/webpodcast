import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

let generator = null;
let ttsModel = null;
let isModelLoading = false;

// Listen for messages from the service worker
window.addEventListener('message', async (event) => {
    // We'll use chrome.runtime.onMessage instead for cleaner communication
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== 'offscreen') return;

    const handleMessage = async () => {
        console.log('Offscreen received message:', message.type);
        try {
            switch (message.type) {
                case 'generate-dialogue':
                    const dialogue = await handleGenerateDialogue(message.data);
                    sendResponse({ success: true, data: dialogue });
                    break;
                case 'generate-tts':
                    const audioData = await handleGenerateTTS(message.data);
                    sendResponse({ success: true, data: audioData });
                    break;
                case 'init-models':
                    await initModels();
                    sendResponse({ success: true });
                    break;
                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Offscreen error processing message:', message.type, error);
            sendResponse({ success: false, error: error.message || String(error) });
        }
    };

    handleMessage();
    return true; // Keep channel open
});

async function initModels() {
    if (generator) return;
    
    if (isModelLoading) {
        while (isModelLoading) {
            await new Promise(r => setTimeout(r, 100));
        }
        return;
    }

    isModelLoading = true;
    console.log('Loading AI model in offscreen...');
    try {
        generator = await pipeline('text2text-generation', 'Xenova/Qwen2.5-0.5B-Instruct', {
            progress_callback: (progress) => {
                chrome.runtime.sendMessage({
                    type: 'model-load-progress',
                    model: 'qwen',
                    progress: progress.progress
                });
            }
        });
        console.log('AI model loaded successfully');
    } catch (error) {
        console.error('Failed to load AI model:', error);
        throw error;
    } finally {
        isModelLoading = false;
    }
}

async function handleGenerateDialogue({ text, title }) {
    await initModels();
    
    const prompt = `Convert this article into a natural conversation between two people (Alex and Sam) discussing the topic. Make it engaging and podcast-style.
Title: ${title}
Article: ${text}
Conversation:`;

    const result = await generator(prompt, {
        max_new_tokens: 500,
        temperature: 0.7,
        do_sample: true,
    });

    return result[0].generated_text;
}

async function handleGenerateTTS({ text, speaker, voice, speed }) {
    if (!ttsModel) {
        // Kokoro is very large, using SpeechT5 as a more lightweight alternative for now
        // or we can use the Web Speech API if we want to keep it "Free & Client-Side" without huge downloads
        // However, the requirement says "Use Transformers.js with SpeechT5 or Kokoro TTS"
        ttsModel = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
            quantized: true,
            progress_callback: (progress) => {
                chrome.runtime.sendMessage({
                    type: 'model-load-progress',
                    model: 'tts',
                    progress: progress.progress
                });
            }
        });
    }

    // SpeechT5 requires a speaker embedding. Xenova provides some defaults.
    const speaker_embeddings = speaker === 'speaker1' 
        ? 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings_female.bin'
        : 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings_male.bin';

    const result = await ttsModel(text, { speaker_embeddings });
    
    // result.audio is a Float32Array
    // We need to convert it to a format that can be sent back or played
    return {
        audio: Array.from(result.audio),
        sampling_rate: result.sampling_rate
    };
}
