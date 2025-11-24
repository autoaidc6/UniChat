import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Conversation, AppSettings, Message, AVATARS } from '../types';
import { v4 as uuidv4 } from 'uuid';

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

// Initial Mock Data
const MOCK_USERS: User[] = [
  { id: 'u2', name: 'Aiko', avatar: AVATARS[1], nativeLanguage: 'Japanese', themeColor: 'teal' },
  { id: 'u3', name: 'Elena', avatar: AVATARS[2], nativeLanguage: 'Spanish', themeColor: 'peach' },
  { id: 'u4', name: 'Pierre', avatar: AVATARS[3], nativeLanguage: 'French', themeColor: 'lavender' },
];

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>({
    showOriginal: true,
    autoPlayVoice: false,
    showCulturalContext: true,
    theme: 'light',
  });

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
    const newId = uuidv4();
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
