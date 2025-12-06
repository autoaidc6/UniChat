import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Conversation, AppSettings, Message, AVATARS } from '../types';

interface AppState {
  currentUser: User | null;
  conversations: Conversation[];
  settings: AppSettings;
  setCurrentUser: (user: User) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addMessage: (conversationId: string, message: Message) => void;
  createConversation: (participants: User[]) => string;
  getConversation: (id: string) => Conversation | undefined;
}

const StoreContext = createContext<AppState | undefined>(undefined);

// Helper for safe ID generation without external deps
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Initial Mock Data
const MOCK_USERS: User[] = [
  { id: 'u2', name: 'Aiko', avatar: AVATARS[1], nativeLanguage: 'Japanese', themeColor: 'teal', status: 'online' },
  { id: 'u3', name: 'Elena', avatar: AVATARS[2], nativeLanguage: 'Spanish', themeColor: 'peach', status: 'offline' },
  { id: 'u4', name: 'Pierre', avatar: AVATARS[3], nativeLanguage: 'French', themeColor: 'lavender', status: 'online' },
  { id: 'u5', name: 'Omar', avatar: AVATARS[4], nativeLanguage: 'Arabic', themeColor: 'teal', status: 'online' },
];

export const StoreProvider = ({ children }: { children?: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>({
    showOriginal: true,
    autoPlayVoice: false,
    showCulturalContext: true,
    theme: 'light',
  });

  // Effect to apply dark mode class to HTML element
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'c1',
      participants: [MOCK_USERS[0]], // Aiko
      messages: [
        {
          id: 'm1',
          senderId: 'u2',
          timestamp: Date.now() - 100000,
          originalText: 'こんにちは！元気ですか？',
          originalLanguage: 'Japanese',
          translatedText: 'Hello! How are you?',
          culturalContext: 'Standard friendly greeting.'
        }
      ],
      lastMessagePreview: 'Hello! How are you?',
      updatedAt: Date.now() - 100000,
      isGroup: false,
    },
    {
      id: 'c2',
      participants: [MOCK_USERS[1]], // Elena
      messages: [],
      lastMessagePreview: 'Start a new conversation',
      updatedAt: Date.now() - 200000,
      isGroup: false,
    },
    {
      id: 'c3',
      participants: [MOCK_USERS[3]], // Omar
      messages: [
        {
          id: 'm_ar_1',
          senderId: 'u5',
          timestamp: Date.now() - 50000,
          originalText: 'مرحباً، كيف حالك اليوم؟',
          originalLanguage: 'Arabic',
          translatedText: 'Hello, how are you today?',
          culturalContext: 'A common polite greeting in Arabic.'
        }
      ],
      lastMessagePreview: 'Hello, how are you today?',
      updatedAt: Date.now() - 50000,
      isGroup: false,
    }
  ]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addMessage = (conversationId: string, message: Message) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...conv.messages, message],
          lastMessagePreview: message.translatedText || message.originalText,
          updatedAt: Date.now(),
        };
      }
      return conv;
    }));
  };

  const createConversation = (participants: User[]) => {
    const newId = generateId();
    const newConv: Conversation = {
      id: newId,
      participants,
      messages: [],
      lastMessagePreview: 'New Conversation',
      updatedAt: Date.now(),
      isGroup: participants.length > 1,
      name: participants.length > 1 ? participants.map(p => p.name).join(', ') : undefined
    };
    setConversations(prev => [newConv, ...prev]);
    return newId;
  };

  const getConversation = (id: string) => conversations.find(c => c.id === id);

  return (
    <StoreContext.Provider value={{
      currentUser,
      conversations,
      settings,
      setCurrentUser,
      updateSettings,
      addMessage,
      createConversation,
      getConversation
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};