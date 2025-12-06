import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { Layout } from '../components/Layout';
import { ArrowLeft, Languages, BookOpen, Volume2, Shield, Moon, Bell } from 'lucide-react';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, currentUser } = useStore();

  const Toggle = ({ 
    label, 
    desc, 
    value, 
    onChange, 
    icon: Icon,
    color = "text-teal-500"
  }: { 
    label: string, 
    desc: string, 
    value: boolean, 
    onChange: (v: boolean) => void,
    icon: any,
    color?: string
  }) => (
    <div className="flex items-center justify-between py-5 border-b border-slate-50 dark:border-slate-700 last:border-0">
      <div className="flex items-start gap-4">
        <div className={`p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl ${color}`}>
           <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">{label}</h3>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-400 max-w-[200px] mt-0.5">{desc}</p>
        </div>
      </div>
      <button 
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <Layout className="dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-900 px-6 pt-8 pb-4 flex items-center gap-4 z-20 transition-colors">
        <button onClick={() => navigate('/home')} className="p-2 -ml-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-heading font-bold text-slate-800 dark:text-white">Settings</h1>
      </div>

      <div className="p-6 pt-2 space-y-8 flex-1 overflow-y-auto bg-white dark:bg-slate-900 transition-colors">
        
        {/* Profile Card */}
        <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-[2rem] flex items-center gap-5 shadow-xl shadow-slate-200 dark:shadow-none">
          <div className="relative">
             <img src={currentUser?.avatar} alt="Me" className="w-16 h-16 rounded-full border-4 border-slate-800 shadow-sm" />
             <div className="absolute bottom-0 right-0 p-1 bg-teal-500 rounded-full border-2 border-slate-800"></div>
          </div>
          <div>
            <h2 className="font-bold text-xl text-white font-heading">{currentUser?.name}</h2>
            <p className="text-slate-400 text-sm font-medium">Native Language</p>
            <p className="text-teal-400 font-bold text-sm mt-0.5 flex items-center gap-1">
              {currentUser?.nativeLanguage}
            </p>
          </div>
        </div>

        <div>
           <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 ml-2">Preferences</h3>
           <div className="bg-white dark:bg-slate-800 rounded-3xl p-1 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
             <div className="px-4">
              <Toggle 
                label="Dual Display" 
                desc="Show original and translated text."
                value={settings.showOriginal} 
                onChange={(v) => updateSettings({ showOriginal: v })}
                icon={Languages}
                color="text-indigo-500"
              />
              <Toggle 
                label="Cultural Context" 
                desc="AI explanations for idioms."
                value={settings.showCulturalContext} 
                onChange={(v) => updateSettings({ showCulturalContext: v })}
                icon={BookOpen}
                color="text-amber-500"
              />
               <Toggle 
                label="Auto-Play Voice" 
                desc="Speak incoming translations."
                value={settings.autoPlayVoice} 
                onChange={(v) => updateSettings({ autoPlayVoice: v })}
                icon={Volume2}
                color="text-teal-500"
              />
            </div>
           </div>
        </div>

        <div>
           <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 ml-2">App Settings</h3>
           <div className="bg-white dark:bg-slate-800 rounded-3xl p-1 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
             <div className="px-4">
              <Toggle 
                label="Dark Mode" 
                desc="Easier on the eyes."
                value={settings.theme === 'dark'} 
                onChange={(v) => updateSettings({ theme: v ? 'dark' : 'light' })}
                icon={Moon}
                color="text-violet-500"
              />
               <Toggle 
                label="Notifications" 
                desc="Messages and groups."
                value={true} 
                onChange={() => {}}
                icon={Bell}
                color="text-pink-500"
              />
            </div>
           </div>
        </div>

        <div className="text-center pt-8 pb-4 opacity-50">
           <div className="flex justify-center items-center gap-2 mb-2">
             <Shield className="w-4 h-4 text-slate-400" />
             <span className="text-xs font-bold text-slate-500">Secure & Encrypted</span>
           </div>
           <p className="text-[10px] text-slate-400">UniChat v1.0.2 • Built with Gemini</p>
        </div>

      </div>
    </Layout>
  );
};