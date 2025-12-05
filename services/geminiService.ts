import { GoogleGenAI, Type, Modality } from "@google/genai";

// Ensure API key is present
const apiKey = process.env.API_KEY;
if (typeof process !== 'undefined' && !apiKey) {
  console.error("Missing API_KEY in environment variables");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Models
const TEXT_MODEL = 'gemini-2.5-flash';
const SPEECH_MODEL = 'gemini-2.5-flash-preview-tts';

interface TranslationResult {
  translatedText: string;
  culturalContext?: string;
}

// --- Audio Helper Functions ---

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const createWavHeader = (dataLength: number, sampleRate: number, numChannels: number, bitsPerSample: number): Uint8Array => {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataLength, true);
  // WAVE identifier
  writeString(view, 8, 'WAVE');
  // fmt chunk identifier
  writeString(view, 12, 'fmt ');
  // fmt chunk length
  view.setUint32(16, 16, true);
  // Sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // Channel count
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (sampleRate * blockAlign)
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  // Block align (numChannels * bitsPerSample / 8)
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  // Bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  return new Uint8Array(header);
};

// --- Service Methods ---

/**
 * Translates text and extracts cultural context using structured JSON output.
 */
export const translateMessage = async (
  text: string,
  targetLanguage: string,
  sourceLanguage: string,
  includeCulturalContext: boolean
): Promise<TranslationResult> => {
  if (!apiKey) return { translatedText: text, culturalContext: "API Key missing" };

  const prompt = `
    Translate the following text from ${sourceLanguage} to ${targetLanguage}.
    
    Guidelines:
    1. Maintain the original tone, emotion, and nuance.
    2. If translating to Arabic, use Modern Standard Arabic (MSA) or a natural, polite dialect suitable for a chat application.
    3. Ensure correct grammar and script direction.
    ${includeCulturalContext ? '4. If there are idioms, slang, or cultural references, explain them briefly in the culturalContext field.' : ''}
    
    Text to translate: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            culturalContext: { type: Type.STRING, nullable: true },
          },
          required: ["translatedText"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText) as TranslationResult;

  } catch (error) {
    console.error("Translation error:", error);
    return { translatedText: text, culturalContext: "Translation failed." };
  }
};

/**
 * Transcribes audio blob to text.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string = 'audio/webm'): Promise<string | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: "Transcribe the spoken audio exactly as it sounds in its original language. Do not translate it. If the audio is in Arabic, transcribe it using Arabic script. Return ONLY the transcription."
          }
        ]
      }
    });

    return response.text || null;
  } catch (error) {
    console.error("Transcription error:", error);
    return null;
  }
};

/**
 * Converts text to speech using Gemini TTS and returns a WAV Blob URL.
 */
export const synthesizeSpeech = async (text: string, voiceName: string = 'Puck'): Promise<string | null> => {
  if (!apiKey || !text) return null;

  try {
    const response = await ai.models.generateContent({
      model: SPEECH_MODEL,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Convert Raw PCM (24kHz, 1 channel, 16-bit) to WAV
    const pcmData = base64ToUint8Array(base64Audio);
    const wavHeader = createWavHeader(pcmData.length, 24000, 1, 16);
    const wavBlob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });

    return URL.createObjectURL(wavBlob);

  } catch (error) {
    console.error("TTS error:", error);
    return null;
  }
};

/**
 * Simulates a reply from a conversational partner in their native language.
 */
export const generateBotReply = async (
  chatHistory: { role: string, text: string }[],
  botName: string,
  botLanguage: string,
  userLanguage: string
): Promise<{ originalText: string }> => {
  if (!apiKey) return { originalText: "..." };

  // Simple prompt to act as the character
  const prompt = `
    You are ${botName}, a friendly person speaking ${botLanguage}. 
    You are chatting with a friend who speaks ${userLanguage}.
    Reply to the last message naturally in ${botLanguage}.
    If ${botLanguage} is Arabic, use Arabic script.
    Keep it short (under 20 words).
    
    History:
    ${chatHistory.map(m => `${m.role}: ${m.text}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });
    return { originalText: response.text || "..." };
  } catch (error) {
    console.error("Bot reply generation error:", error);
    return { originalText: "..." };
  }
};
