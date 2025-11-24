import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { Layout } from '../components/Layout';
import { AVATARS, SUPPORTED_LANGUAGES, User } from '../types';
import { ArrowRight, Globe, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const Onboarding: React.FC = () => {
  const { setCurrentUser } = useStore();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [selectedLang, setSelectedLang] = useState(SUPPORTED_LANGUAGES[0].name);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const handleStart = () => {
    if (!name.trim()) return;
    
    const newUser: User = {
      id: uuidv4(),
      name,
      avatar: selectedAvatar,
      nativeLanguage: selectedLang,
      themeColor: 'teal',
    };
    
    setCurrentUser(newUser);
    navigate('/home');
  };

  return (
    <Layout className="bg-gradient-to-br from-teal-50 to-peach-50">
      <div className="flex-1 flex flex-col p-8 justify-center">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="bg-white p-4 rounded-full w-20 h-20 mx-auto mb-6 shadow-soft flex items-center justify-center">
             <Globe className="w-10 h-10 text-teal-500" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">UniChat</h1>
          <p className="text-slate-500 font-medium">One World. Many Voices.</p>
        </div>

        {/* Form */}
        <div className="space-y-6 bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-sm">
          
          {/* Name Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">What should we call you?</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full p-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 text-lg"
            />
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Your Native Language</label>
            <select 
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 appearance-none"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.name}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Pick an Avatar</label>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {AVATARS.map((url) => (
                <button
                  key={url}
                  onClick={() => setSelectedAvatar(url)}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === url ? 'border-teal-500 scale-110 shadow-md' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={url} alt="avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button 
          onClick={handleStart}
          disabled={!name.trim()}
          className={`mt-10 w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-lg shadow-lg transition-all ${
            name.trim() ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-200' : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          Start Chatting <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Sparkles className="w-3 h-3 inline mr-1" />
          AI-Powered Real-time Translation
        </p>

      </div>
    </Layout>
  );
};