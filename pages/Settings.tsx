import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { Layout } from '../components/Layout';
import { ArrowLeft, Languages, BookOpen, Volume2, Shield } from 'lucide-react';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, currentUser } = useStore();

  const Toggle = ({ 
    label, 
    desc, 
    value, 
    onChange, 
    icon: Icon 
  }: { 
    label: string, 
    desc: string, 
    value: boolean, 
    onChange: (v: boolean) => void,
    icon: any
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-slate-50 rounded-lg text-teal-600">
           <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{label}</h3>
          <p className="text-xs text-slate-400 max-w-[200px]">{desc}</p>
        </div>
      </div>
      <button 
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-teal-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <Layout>
      <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/home')} className="text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
      </div>

      <div className="p-6 space-y-2">
        
        {/* Profile Card */}
        <div className="bg-gradient-to-r from-teal-50 to-peach-50 p-6 rounded-3xl flex items-center gap-4 mb-8">
          <img src={currentUser?.avatar} alt="Me" className="w-16 h-16 rounded-full border-4 border-white shadow-sm" />
          <div>
            <h2 className="font-bold text-lg text-slate-800">{currentUser?.name}</h2>
            <p className="text-teal-600 text-sm bg-white/50 px-2 rounded-md inline-block">
              {currentUser?.nativeLanguage}
            </p>
          </div>
        </div>

        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Translation & AI</h3>
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50">
          <Toggle 
            label="Dual Display" 
            desc="Show both original and translated messages in chat bubbles."
            value={settings.showOriginal} 
            onChange={(v) => updateSettings({ showOriginal: v })}
            icon={Languages}
          />
          <Toggle 
            label="Cultural Context" 
            desc="AI explains idioms, slang, and emotion."
            value={settings.showCulturalContext} 
            onChange={(v) => updateSettings({ showCulturalContext: v })}
            icon={BookOpen}
          />
           <Toggle 
            label="Auto-Play Voice" 
            desc="Automatically speak incoming translations."
            value={settings.autoPlayVoice} 
            onChange={(v) => updateSettings({ autoPlayVoice: v })}
            icon={Volume2}
          />
        </div>

        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Privacy</h3>
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50">
           <div className="flex items-center gap-4 py-2 opacity-50">
             <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
               <Shield className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-slate-800">End-to-End Encryption</h3>
               <p className="text-xs text-slate-400">Always active for your safety.</p>
             </div>
           </div>
        </div>

      </div>
    </Layout>
  );
};