import { GoogleGenAI, Type, Modality } from "@google/genai";

// Ensure API key is present
const apiKey = process.env.API_KEY;
if (!apiKey) {
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

/**
 * Translates text and extracts cultural context using structured JSON output.
 */
export const translateMessage = async (
  text: string,
  targetLanguage: string,
  sourceLanguage: string,
  includeCulturalContext: boolean
): Promise<TranslationResult> => {
  if (!apiKey) return { translatedText: "API Key Missing" };

  const prompt = `
    Translate the following text from ${sourceLanguage} to ${targetLanguage}.
    Maintain the tone, emotion, and nuance.
    ${includeCulturalContext ? 'If there are idioms, slang, or cultural references, explain them briefly in the culturalContext field.' : ''}
    
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
            text: "Transcribe this audio exactly as spoken. Do not translate it yet. Return only the transcription text."
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
 * Converts text to speech using Gemini TTS.
 */
export const synthesizeSpeech = async (text: string, voiceName: string = 'Puck'): Promise<string | null> => {
  if (!apiKey) return null;

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

    return `data:audio/mp3;base64,${base64Audio}`;

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