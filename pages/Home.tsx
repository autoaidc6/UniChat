import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { Layout } from '../components/Layout';
import { Settings as SettingsIcon, Plus, MessageCircle } from 'lucide-react';
import { Conversation } from '../types';

export const Home: React.FC = () => {
  const { currentUser, conversations } = useStore();
  const navigate = useNavigate();

  const getChatName = (c: Conversation) => {
    if (c.isGroup) return c.name || 'Group Chat';
    // For 1on1, find the participant that isn't me
    const other = c.participants.find(p => p.id !== currentUser?.id);
    return other?.name || 'Unknown';
  };

  const getChatAvatar = (c: Conversation) => {
    if (c.isGroup) return 'https://picsum.photos/id/10/200/200'; // Generic group
    const other = c.participants.find(p => p.id !== currentUser?.id);
    return other?.avatar || '';
  };

  return (
    <Layout>
      {/* Header */}
      <div className="px-6 py-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src={currentUser?.avatar} alt="Me" className="w-10 h-10 rounded-full border border-slate-200" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Chats</h1>
            <p className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full w-fit">
              {currentUser?.nativeLanguage}
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/settings')} className="p-2 bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100">
          <SettingsIcon className="w-6 h-6" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversations.length === 0 ? (
          <div className="text-center mt-20 text-slate-400">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No conversations yet.</p>
          </div>
        ) : (
          conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => navigate(`/chat/${conv.id}`)}
              className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="relative">
                <img src={getChatAvatar(conv)} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-800 truncate">{getChatName(conv)}</h3>
                  <span className="text-xs text-slate-400">{new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-slate-500 text-sm truncate">{conv.lastMessagePreview}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-6 right-6">
        <button className="w-14 h-14 bg-teal-500 rounded-full text-white shadow-lg shadow-teal-200 flex items-center justify-center hover:bg-teal-600 transition-colors">
          <Plus className="w-8 h-8" />
        </button>
      </div>
    </Layout>
  );
};