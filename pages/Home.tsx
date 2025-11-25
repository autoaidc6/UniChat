import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { Layout } from '../components/Layout';
import { Settings as SettingsIcon, Plus, Search, MessageSquare, Users, Star, Menu } from 'lucide-react';
import { Conversation } from '../types';

export const Home: React.FC = () => {
  const { currentUser, conversations } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'groups'>('all');

  const getChatName = (c: Conversation) => {
    if (c.isGroup) return c.name || 'Group Chat';
    const other = c.participants.find(p => p.id !== currentUser?.id);
    return other?.name || 'Unknown';
  };

  const getChatAvatar = (c: Conversation) => {
    if (c.isGroup) return 'https://picsum.photos/id/10/200/200';
    const other = c.participants.find(p => p.id !== currentUser?.id);
    return other?.avatar || '';
  };

  const filteredConversations = conversations.filter(c => 
    activeTab === 'all' ? true : c.isGroup
  );

  return (
    <Layout className="flex flex-row bg-slate-900">
      
      {/* Navigation Rail (Sidebar) */}
      <div className="w-[70px] bg-slate-900 flex flex-col items-center py-8 gap-8 shrink-0 z-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <span className="text-white font-heading font-bold text-xl">U</span>
        </div>

        <nav className="flex flex-col gap-6 mt-4 w-full items-center">
          <button 
            onClick={() => setActiveTab('all')}
            className={`p-3 rounded-2xl transition-all relative group ${activeTab === 'all' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <MessageSquare className="w-6 h-6" />
            {activeTab === 'all' && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-400 rounded-r-full"></span>}
          </button>
          
          <button 
             onClick={() => setActiveTab('groups')}
             className={`p-3 rounded-2xl transition-all relative group ${activeTab === 'groups' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Users className="w-6 h-6" />
            {activeTab === 'groups' && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-400 rounded-r-full"></span>}
          </button>

          <button className="p-3 rounded-2xl text-slate-500 hover:text-slate-300 transition-colors">
            <Star className="w-6 h-6" />
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-6 items-center">
           <img src={currentUser?.avatar} alt="Me" className="w-8 h-8 rounded-full border border-slate-700 opacity-80 hover:opacity-100 transition-opacity" />
           <button onClick={() => navigate('/settings')} className="p-3 text-slate-500 hover:text-white transition-colors">
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 bg-slate-50 rounded-tl-[2.5rem] rounded-bl-[2.5rem] sm:rounded-bl-[2.5rem] overflow-hidden flex flex-col relative shadow-inner">
        
        {/* Header */}
        <div className="pt-8 px-6 pb-4 bg-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-heading font-bold text-slate-800">Inbox</h1>
              <p className="text-slate-400 text-sm font-medium">
                {conversations.length} {conversations.length === 1 ? 'Conversation' : 'Conversations'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full bg-slate-100/50 pl-12 pr-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-teal-500/50 focus:bg-white transition-all text-slate-700 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-white">
          {filteredConversations.map(conv => {
            const isActive = false; // Could be used for desktop selection
            return (
              <div 
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={`p-4 rounded-3xl transition-all cursor-pointer group flex items-start gap-4 hover:bg-slate-50 ${isActive ? 'bg-slate-50' : ''}`}
              >
                <div className="relative shrink-0">
                  <img src={getChatAvatar(conv)} alt="avatar" className="w-12 h-12 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-[3px] border-white rounded-full"></span>
                </div>
                
                <div className="flex-1 min-w-0 pt-0.5 border-b border-slate-100 pb-4 group-last:border-none group-hover:border-transparent transition-colors">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-800 truncate text-[15px]">{getChatName(conv)}</h3>
                    <span className="text-xs font-medium text-slate-400">{new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-slate-500 text-sm truncate leading-snug font-medium opacity-80">{conv.lastMessagePreview}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAB */}
        <div className="absolute bottom-6 right-6">
          <button className="w-14 h-14 bg-slate-900 rounded-full text-white shadow-xl shadow-slate-400/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

    </Layout>
  );
};