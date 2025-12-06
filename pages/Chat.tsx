import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { Layout } from '../components/Layout';
import { translateMessage, generateBotReply, synthesizeSpeech, transcribeAudio } from '../services/geminiService';
import { ArrowLeft, Mic, Send, Volume2, Info, Languages, Loader2, StopCircle, MoreVertical, Phone, Video, Plus } from 'lucide-react';
import { Message, SUPPORTED_LANGUAGES } from '../types';

export const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, getConversation, addMessage, settings, updateSettings } = useStore();
  
  const conversation = getConversation(id || '');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Ref to track the current audio element to avoid overlapping sounds
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, isProcessing]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  if (!conversation || !currentUser) return null;

  const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id) || conversation.participants[0];

  const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const playAudio = (url: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    const audio = new Audio(url);
    currentAudioRef.current = audio;
    audio.play().catch(e => console.error("Playback failed", e));
  };

  const handleSendMessage = async (overrideText?: string, overrideAudioUrl?: string, isVoiceMessage: boolean = false) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim()) return;

    setInputText(''); 

    const userMsg: Message = {
      id: generateId(),
      senderId: currentUser.id,
      timestamp: Date.now(),
      originalText: textToSend,
      originalLanguage: currentUser.nativeLanguage,
      translatedText: textToSend, // Initially same
      audioUrl: overrideAudioUrl,
      isVoice: isVoiceMessage
    };
    addMessage(conversation.id, userMsg);

    setIsProcessing(true);

    setTimeout(async () => {
      const history = conversation.messages.map(m => ({
        role: m.senderId === currentUser.id ? 'user' : 'model',
        text: m.originalText
      }));
      history.push({ role: 'user', text: textToSend });

      const botReply = await generateBotReply(
        history, 
        otherParticipant.name, 
        otherParticipant.nativeLanguage, 
        currentUser.nativeLanguage
      );

      const translation = await translateMessage(
        botReply.originalText,
        currentUser.nativeLanguage,
        otherParticipant.nativeLanguage,
        settings.showCulturalContext
      );

      let audioUrl: string | undefined = undefined;
      // Auto-synthesize translation if setting is on OR if user sent voice (reciprocity)
      if (settings.autoPlayVoice || isVoiceMessage) {
         const audio = await synthesizeSpeech(translation.translatedText);
         if (audio) audioUrl = audio;
      }

      const botMsg: Message = {
        id: generateId(),
        senderId: otherParticipant.id,
        timestamp: Date.now(),
        originalText: botReply.originalText,
        originalLanguage: otherParticipant.nativeLanguage,
        translatedText: translation.translatedText,
        culturalContext: translation.culturalContext,
        audioUrl: audioUrl,
        isVoice: isVoiceMessage // Bot replies in same modality
      };

      addMessage(conversation.id, botMsg);
      setIsProcessing(false);
      
      if (audioUrl && (settings.autoPlayVoice || isVoiceMessage)) {
        playAudio(audioUrl);
      }

    }, 1500);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        
        setIsProcessing(true);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          const transcribedText = await transcribeAudio(base64Audio, 'audio/webm');
          
          if (transcribedText) {
            handleSendMessage(transcribedText, audioUrl, true);
          } else {
            setIsProcessing(false);
            alert("Could not transcribe audio. Please try again.");
          }
        };
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to access microphone", err);
      alert("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handlePlayAudio = async (msg: Message, type: 'original' | 'translated') => {
    // 1. Play existing audio file if available (e.g. recorded voice note)
    if (type === 'original' && msg.audioUrl && msg.isVoice) {
      playAudio(msg.audioUrl);
      return;
    }

    // 2. Play pre-synthesized audio if available (e.g. auto-generated response)
    if (type === 'translated' && msg.audioUrl && !msg.isVoice) {
      playAudio(msg.audioUrl);
      return;
    }

    // 3. Generate TTS on the fly if needed
    const textToSpeak = type === 'original' ? msg.originalText : msg.translatedText;
    if (!textToSpeak) return;

    const audio = await synthesizeSpeech(textToSpeak);
    if (audio) playAudio(audio);
  };

  return (
    <Layout className="bg-[#f0f2f5] dark:bg-slate-900 transition-colors duration-300">
      {/* Floating Modern Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 pb-2">
        <div className="glass dark:glass rounded-2xl p-2 shadow-lg shadow-slate-200/50 dark:shadow-none flex items-center gap-3 transition-colors">
          <button onClick={() => navigate('/home')} className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity">
             <div className="relative">
                 <img src={otherParticipant.avatar} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
                 <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white dark:border-slate-800 rounded-full ${otherParticipant.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
             </div>
             <div>
               <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight font-heading">{otherParticipant.name}</h2>
               <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {SUPPORTED_LANGUAGES.find(l => l.name === otherParticipant.nativeLanguage)?.flag}
                  <span>Speaks {otherParticipant.nativeLanguage}</span>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-1 pr-1">
             <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-full transition-colors">
               <Phone className="w-5 h-5" />
             </button>
             <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-full transition-colors">
               <Video className="w-5 h-5" />
             </button>
             <button 
                onClick={() => updateSettings({ showOriginal: !settings.showOriginal })}
                className={`p-2 rounded-full transition-all ${settings.showOriginal ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
             >
                <Languages className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-24 pb-4 space-y-6" ref={scrollRef}>
        {conversation.messages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.id;
          const showAvatar = !isMe && (index === 0 || conversation.messages[index-1].senderId !== msg.senderId);
          
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
              
              {!isMe && (
                <div className="w-8 flex-shrink-0">
                  {showAvatar && <img src={otherParticipant.avatar} className="w-8 h-8 rounded-full" alt="" />}
                </div>
              )}

              <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                
                <div className={`rounded-2xl p-4 shadow-sm relative group transition-all hover:shadow-md ${
                  isMe 
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm'
                }`}>
                  
                  {msg.isVoice && (
                    <div className="flex items-center gap-2 mb-2 opacity-90 border-b border-white/20 pb-2">
                       <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                          <Mic className="w-3 h-3" /> 
                       </div>
                       <span className="text-[10px] uppercase font-bold tracking-wider">Voice Note</span>
                    </div>
                  )}

                  {/* Primary Text (Translated or Original based on logic) */}
                  <div className="text-[15px] leading-relaxed font-sans" dir="auto">
                     {isMe ? msg.originalText : (msg.translatedText || msg.originalText)}
                  </div>

                  {/* Secondary Text (Original for received messages if enabled) */}
                  {(!isMe && settings.showOriginal) && (
                     <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 italic font-medium" dir="auto">
                        {msg.originalText}
                     </div>
                  )}
                  
                  {/* Message Tools */}
                  <div className={`mt-2 flex items-center gap-3 ${isMe ? 'text-teal-100' : 'text-slate-400'}`}>
                    <button 
                      onClick={() => handlePlayAudio(msg, isMe ? 'original' : 'translated')} 
                      className="hover:scale-110 active:scale-95 transition-transform opacity-80 hover:opacity-100"
                      title="Play Audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    
                    {!isMe && msg.culturalContext && (
                      <div className="group/tooltip relative">
                        <Info className="w-4 h-4 hover:text-amber-500 cursor-help transition-colors" />
                        <div className="absolute bottom-full mb-3 left-0 w-64 bg-slate-800 dark:bg-black text-white text-xs p-3 rounded-xl shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                          <span className="font-bold block mb-1 text-amber-400 uppercase tracking-wider text-[10px]">Context</span>
                          {msg.culturalContext}
                          <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 dark:bg-black rotate-45"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 font-medium">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
        
        {isProcessing && (
          <div className="flex items-start gap-2 animate-pulse pl-10">
            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
               <span className="text-xs font-medium text-slate-400">Translating & Speaking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Modern Input Area */}
      <div className="bg-white dark:bg-slate-900 p-4 pb-safe transition-colors">
        <div className={`flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-[2rem] border transition-all shadow-sm ${isRecording ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500'}`}>
          
          <button 
             className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all"
             title="Add media"
          >
            <Plus className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isRecording ? "Recording..." : `Message in ${currentUser.nativeLanguage}...`}
            disabled={isRecording}
            dir="auto"
            className="flex-1 bg-transparent focus:outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 h-full py-2 px-2 font-medium"
          />

          <button 
            className={`p-2.5 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-red-300 shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-700'}`}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
          >
            {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() && !isRecording}
            className={`p-2.5 rounded-full transition-all transform active:scale-95 ${
              inputText.trim() ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 rotate-0' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 rotate-90 scale-90 opacity-50'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Layout>
  );
};