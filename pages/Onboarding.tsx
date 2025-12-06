import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { Layout } from '../components/Layout';
import { AVATARS, SUPPORTED_LANGUAGES, User } from '../types';
import { ArrowRight, Globe, Sparkles } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { setCurrentUser } = useStore();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [selectedLang, setSelectedLang] = useState(SUPPORTED_LANGUAGES[0].name);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  // Animation State
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 6); // Increased steps for Arabic
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    if (!name.trim()) return;
    
    // Simple random ID
    const newId = Math.random().toString(36).substring(2, 15);
    
    const newUser: User = {
      id: newId,
      name,
      avatar: selectedAvatar,
      nativeLanguage: selectedLang,
      themeColor: 'teal',
      status: 'online'
    };
    
    setCurrentUser(newUser);
    navigate('/home');
  };

  return (
    <Layout className="bg-gradient-to-br from-teal-50 via-white to-peach-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <div className="flex-1 flex flex-col p-8 justify-center min-h-screen">
        
        {/* Animated Header */}
        <div className="text-center mb-8">
          <div className="relative mx-auto w-64 h-32 mb-6">
             {/* Left Bubble */}
             <div className={`absolute left-0 top-0 transition-all duration-700 transform ${demoStep % 2 === 0 ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}`}>
                <div className="bg-teal-500 text-white p-3 rounded-2xl rounded-bl-none text-sm font-bold shadow-lg" dir="auto">
                   {demoStep === 0 ? "Hello friend!" : demoStep === 2 ? "¡Hola amigo!" : "أهلاً صديقي!"}
                </div>
                <div className="text-xs text-teal-600 dark:text-teal-400 font-bold mt-1 text-left pl-1">
                   {demoStep === 0 ? "🇺🇸 English" : demoStep === 2 ? "🇪🇸 Spanish" : "🇸🇦 Arabic"}
                </div>
             </div>

             {/* Right Bubble */}
             <div className={`absolute right-0 bottom-0 transition-all duration-700 transform ${demoStep % 2 !== 0 ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}`}>
                <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 p-3 rounded-2xl rounded-br-none text-sm font-bold shadow-md" dir="auto">
                   {demoStep === 1 ? "Hello!" : demoStep === 3 ? "Konnichiwa!" : "Ahlan!"}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1 text-right pr-1">
                   {demoStep === 1 ? "🇺🇸 English" : demoStep === 3 ? "🇯🇵 Japanese" : "🇸🇦 Arabic"}
                </div>
             </div>
          </div>

          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight">UniChat</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">One World. Many Voices.</p>
        </div>

        {/* Form */}
        <div className="space-y-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/50 dark:border-slate-700/50 transition-colors">
          
          {/* Name Input */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-2">Display Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-700 border-none focus:ring-2 focus:ring-teal-400 text-slate-800 dark:text-slate-100 font-bold placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-2">I speak...</label>
            <select 
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-700 border-none focus:ring-2 focus:ring-teal-400 appearance-none font-medium text-slate-800 dark:text-slate-100"
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
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-2">Avatar</label>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {AVATARS.map((url) => (
                <button
                  key={url}
                  onClick={() => setSelectedAvatar(url)}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === url ? 'border-teal-500 scale-110 shadow-lg' : 'border-transparent opacity-60 grayscale hover:grayscale-0'
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
          className={`mt-8 w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-lg shadow-xl shadow-teal-100 dark:shadow-none transition-all transform active:scale-95 ${
            name.trim() ? 'bg-teal-500 hover:bg-teal-600' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
          }`}
        >
          Start Chatting <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center mt-6 flex justify-center items-center gap-2 text-slate-400 dark:text-slate-500">
           <Sparkles className="w-4 h-4 text-peach-400" />
           <span className="text-xs font-medium">Powered by Gemini AI</span>
        </div>

      </div>
    </Layout>
  );
};