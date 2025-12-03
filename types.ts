export enum AppRoute {
  ONBOARDING = '/',
  HOME = '/home',
  CHAT = '/chat/:id',
  SETTINGS = '/settings',
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  nativeLanguage: string;
  themeColor: 'peach' | 'teal' | 'lavender';
  status?: 'online' | 'offline';
}

export interface Message {
  id: string;
  senderId: string;
  timestamp: number;
  originalText: string;
  originalLanguage: string;
  translatedText?: string;
  culturalContext?: string;
  audioUrl?: string; // For voice messages
  isVoice?: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  messages: Message[];
  lastMessagePreview: string;
  updatedAt: number;
  isGroup: boolean;
  name?: string; // For group chats
}

export interface AppSettings {
  showOriginal: boolean; // Dual display toggle
  autoPlayVoice: boolean;
  showCulturalContext: boolean;
  theme: 'light' | 'dark'; // Simplified for this demo
}

// Mock Types for UI
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
];

export const AVATARS = [
  'https://picsum.photos/id/64/200/200',
  'https://picsum.photos/id/65/200/200',
  'https://picsum.photos/id/91/200/200',
  'https://picsum.photos/id/177/200/200',
  'https://picsum.photos/id/338/200/200',
  'https://picsum.photos/id/349/200/200',
];