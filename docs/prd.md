# Product Requirements Document (PRD) - UniChat

## 1. Executive Summary
**UniChat** is a real-time communication application that enables users to speak their native language while communicating with anyone globally. Unlike standard translation tools, UniChat focuses on preserving **tone**, **emotion**, and **cultural context**, effectively bridging the gap between mere translation and true understanding.

## 2. Objectives
*   **Seamless Communication**: Remove friction from cross-language chats.
*   **Cultural Bridge**: Provide context for idioms and cultural nuances, not just literal translations.
*   **Accessibility**: Support voice-first interactions and diverse scripts (e.g., Arabic RTL).
*   **Visual Appeal**: Create a high-end, modern interface that feels trustworthy and warm.

## 3. User Personas
1.  **The International Family**: Grandparents speaking one language, grandchildren speaking another. They need voice features and ease of use.
2.  **The Language Learner**: Wants to see the original text alongside the translation to learn new phrases.
3.  **The Traveler**: Needs quick text and voice translation to navigate local environments.

## 4. Functional Requirements

### 4.1 Onboarding
*   **User Profile**: User sets their Name, Native Language, and Avatar.
*   **Demo**: An animated preview showing the core value prop (Text bubbling in two languages).
*   **Output**: A persisted User object in the global store.

### 4.2 Home Screen (Inbox)
*   **Conversation List**: Display recent chats with avatars, names, timestamps, and message previews.
*   **Status Indicators**: Visual cues for Online/Offline status.
*   **Navigation**: Sidebar (Desktop) or Menu for accessing Settings and creating chats.
*   **Search**: Filter conversations by content or name.

### 4.3 Chat Interface
*   **Messaging**: Send and receive text.
*   **AI Translation**:
    *   Outgoing messages are stored in native language.
    *   Incoming messages are translated via Gemini API.
    *   Bot simulation (for demo) generates replies in the partner's native language.
*   **Voice Messaging**:
    *   Record audio (Blob).
    *   Transcribe audio using Gemini Multimodal.
    *   Translate transcription.
    *   Synthesize speech (TTS) in the recipient's language.
*   **Display Modes**: Toggle between "Translation Only" and "Dual Display" (Original + Translation).
*   **Cultural Context**: AI detects idioms and provides a tooltip explanation.

### 4.4 Settings
*   **Preferences**: Toggle Dual Display, Cultural Context, Auto-Play Voice.
*   **Theme**: Toggle Light/Dark mode.
*   **Profile**: View current user details.

## 5. Non-Functional Requirements
*   **Performance**: Audio synthesis and translation should happen within 2-3 seconds.
*   **Reliability**: Fallback to text if TTS fails.
*   **Compatibility**: responsive design for Mobile, Tablet, and Desktop.
*   **Localization**: Full RTL support for Arabic/Hebrew layouts.

## 6. AI Logic Specifications

### 6.1 Translation Model (`gemini-2.5-flash`)
*   **Prompting**: "Translate [Text] to [Target Language]. Maintain tone. If Arabic, use MSA."
*   **Output**: JSON `{ translatedText, culturalContext }`.

### 6.2 Speech-to-Text
*   **Input**: WebM/WAV Audio Blob.
*   **Prompt**: "Transcribe exactly what is said in the original language."

### 6.3 Text-to-Speech (`gemini-2.5-flash-preview-tts`)
*   **Input**: Translated Text.
*   **Config**: Voice selection (e.g., 'Puck', 'Kore').
*   **Output**: Raw PCM stream -> Converted to WAV for browser playback.

## 7. Future Roadmap
*   **Group Chats**: Real-time multi-way translation.
*   **Image Translation**: Send images and translate text within them.
*   **Live Call**: Real-time speech-to-speech stream (Gemini Live API).
