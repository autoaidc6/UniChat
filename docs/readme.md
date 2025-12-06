# UniChat – One World. Many Voices.

**UniChat** is a warm, inclusive, and modern multilingual communication platform designed to break down language barriers. By leveraging Google's **Gemini 2.5 Flash** and **Multimodal** capabilities, UniChat allows users to communicate naturally in their native language—via text or voice—while the recipient understands everything in theirs, complete with emotional nuance and cultural context.

## 🚀 Key Features

*   **Real-Time Translation**: Instant translation between supported languages (English, Spanish, French, Japanese, Arabic, etc.).
*   **Voice-to-Voice Translation**: Record a message in your language; the recipient hears it synthesized in theirs.
*   **Dual Display Mode**: Toggle to see both the original message and the translation for language learning.
*   **Cultural Context AI**: Tap on messages to understand idioms, slang, or cultural references explained by Gemini.
*   **Right-to-Left (RTL) Support**: Full support for Arabic and other RTL scripts.
*   **Dark Mode**: A beautiful, high-contrast dark theme for comfortable night usage.
*   **Modern UI**: Glassmorphism, smooth animations, and a professional dashboard aesthetic.

## 🛠 Tech Stack

*   **Frontend Framework**: React 18 (Vite)
*   **Styling**: Tailwind CSS (Custom color palette: Peach, Teal, Lavender, Slate)
*   **AI Engine**: Google Gemini API (`@google/genai` SDK)
    *   *Text Generation*: `gemini-2.5-flash`
    *   *Speech-to-Text*: Multimodal capabilities
    *   *Text-to-Speech*: `gemini-2.5-flash-preview-tts`
*   **State Management**: React Context API
*   **Routing**: React Router DOM v6
*   **Icons**: Lucide React
*   **Fonts**: Inter (UI), Nunito (Headings), Noto Sans Arabic (International support)

## 📦 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/unichat.git
    cd unichat
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    *   Ensure your environment has access to a Google Gemini API Key.
    *   The app expects `process.env.API_KEY` to be available (or injected via your deployment platform/bundler).

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

5.  **Build for Production**:
    ```bash
    npm run build
    ```

## 📂 Project Structure

*   `/components`: Reusable UI components (Layout, etc.).
*   `/context`: Global state management (User, Conversations, Settings).
*   `/pages`: Main application screens (Onboarding, Home, Chat, Settings).
*   `/services`: API integration layer for Google GenAI.
*   `/docs`: Project documentation.

## 🎨 Design Philosophy

UniChat aims for a "Family-Oriented yet Professional" look. We use soft, welcoming colors (Teal/Peach) paired with a robust Slate scale for contrast. The UI emphasizes clarity, employing floating headers, gradient bubbles, and distinct visual hierarchies to separate "My Language" from "Their Language."

## 📄 License

MIT License
