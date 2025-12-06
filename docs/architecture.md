# Technical Architecture - UniChat

## 1. System Overview
UniChat is a **Client-Side Single Page Application (SPA)** built with React. It communicates directly with the Google Gemini API for all AI-related tasks (Translation, Transcription, Synthesis). There is no custom backend; the "backend" logic is handled by the `geminiService` communicating with Google Cloud.

## 2. Technology Stack
*   **Core**: React 18, TypeScript.
*   **Build Tool**: Vite.
*   **Styling**: Tailwind CSS (Utility-first).
*   **AI SDK**: `@google/genai` (Google Gemini SDK).
*   **State**: React Context API (In-memory store for demo purposes).

## 3. Directory Structure

```
/
├── components/         # Shared UI components
│   └── Layout.tsx      # Main application wrapper (Responsive container)
├── context/            # State Management
│   └── Store.tsx       # Global store (User, Chat History, Settings)
├── docs/               # Documentation (PRD, Architecture)
├── pages/              # Route Components
│   ├── Onboarding.tsx  # User setup
│   ├── Home.tsx        # Conversation list / Inbox
│   ├── Chat.tsx        # Main messaging interface
│   └── Settings.tsx    # App configuration
├── services/           # External API Integration
│   └── geminiService.ts# Facade for Google Gemini API interactions
├── types.ts            # TypeScript Interfaces & Enums
├── App.tsx             # Main Router & Provider setup
├── index.tsx           # Entry point
└── index.html          # HTML Shell & Import Maps
```

## 4. Data Flow

### 4.1 Message Sending Pipeline
1.  **User Input**: User types text or records audio in `Chat.tsx`.
2.  **State Update**: Message added to `Store` (Context) immediately (Optimistic UI).
3.  **Bot Simulation (Demo Logic)**:
    *   App generates a "Bot Reply" representing the other user via `geminiService.generateBotReply`.
    *   This reply is in the *partner's* native language.
4.  **Translation Service**:
    *   Incoming message is sent to `geminiService.translateMessage`.
    *   Gemini returns JSON: `{ translatedText, culturalContext }`.
5.  **Voice Synthesis (Optional)**:
    *   If `Auto-Play` is on, `translatedText` is sent to `geminiService.synthesizeSpeech`.
    *   Returns a Blob URL (WAV format).
6.  **UI Render**: The Chat component updates to show the new message bubbles.

### 4.2 Audio Handling
*   **Recording**: Uses browser `MediaRecorder` API to capture `audio/webm`.
*   **Transcription**: The Blob is converted to Base64 and sent to Gemini Multimodal. Gemini returns the raw transcription string.
*   **Playback**: Raw PCM data from Gemini TTS is wrapped with a WAV header in the browser (client-side) to create a playable Audio object.

## 5. Key Components

### `Store.tsx` (State)
Acts as the single source of truth.
*   `currentUser`: The logged-in profile.
*   `conversations`: Array of chat objects containing messages.
*   `settings`: User preferences (Theme, Dual Display, etc.).

### `geminiService.ts` (Logic)
Encapsulates all AI complexity.
*   `translateMessage()`: Handles Prompt Engineering for context and tone.
*   `transcribeAudio()`: Multimodal input processing.
*   `synthesizeSpeech()`: TTS generation and binary formatting.

### `Layout.tsx` (UI)
Provides the consistent "Mobile App" frame, responsible for the glassmorphism look, dark mode background transitions, and responsive centering on desktop screens.

## 6. Security & Constraints
*   **API Key**: Currently requires `process.env.API_KEY`. In a production app, this should be proxied through a backend to prevent exposure.
*   **Persistence**: Data is currently in-memory (refreshing wipes data). Future implementation would use `localStorage` or a database (Firebase/Supabase).
