import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { Layout } from '../components/Layout';
import { translateMessage, generateBotReply, synthesizeSpeech } from '../services/geminiService';
import { ArrowLeft, Mic, Send, Volume2, Info, Languages, Loader2 } from 'lucide-react';
import { Message, User, SUPPORTED_LANGUAGES } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, getConversation, addMessage, settings } = useStore();
  
  const conversation = getConversation(id || '');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, isProcessing]);

  if (!conversation || !currentUser) return null;

  const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id) || conversation.participants[0];

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText(''); // Clear immediately for UX

    // 1. Add User Message (Optimistic)
    const userMsg: Message = {
      id: uuidv4(),
      senderId: currentUser.id,
      timestamp: Date.now(),
      originalText: textToSend,
      originalLanguage: currentUser.nativeLanguage,
      // User message doesn't need translation for themselves initially, but useful for group contexts
      translatedText: textToSend, 
    };
    addMessage(conversation.id, userMsg);

    setIsProcessing(true);

    // 2. Simulate Bot Reply & Translate
    // In a real app, we would emit the message via socket, and receive a reply.
    // Here we ask Gemini to pretend to be the other person.
    
    // Wait a bit for "typing" effect
    setTimeout(async () => {
      // A. Bot generates native reply
      const history = conversation.messages.map(m => ({
        role: m.senderId === currentUser.id ? 'user' : 'model',
        text: m.originalText
      }));
      // Add latest
      history.push({ role: 'user', text: textToSend });

      const botReply = await generateBotReply(
        history, 
        otherParticipant.name, 
        otherParticipant.nativeLanguage, 
        currentUser.nativeLanguage
      );

      // B. Translate Bot Reply to User's Language
      const translation = await translateMessage(
        botReply.originalText,
        currentUser.nativeLanguage,
        otherParticipant.nativeLanguage,
        settings.showCulturalContext
      );

      // C. (Optional) Synthesize Speech if auto-play is on
      let audioUrl: string | undefined = undefined;
      // Synthesize the TRANSLATED text so the user understands it aurally
      if (settings.autoPlayVoice) {
         const audio = await synthesizeSpeech(translation.translatedText);
         if (audio) audioUrl = audio;
      }

      const botMsg: Message = {
        id: uuidv4(),
        senderId: otherParticipant.id,
        timestamp: Date.now(),
        originalText: botReply.originalText,
        originalLanguage: otherParticipant.nativeLanguage,
        translatedText: translation.translatedText,
        culturalContext: translation.culturalContext,
        audioUrl: audioUrl
      };

      addMessage(conversation.id, botMsg);
      setIsProcessing(false);
      
      // Auto play audio if available
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.error("Autoplay blocked", e));
      }

    }, 1500);
  };

  const handlePlayAudio = async (msg: Message) => {
    if (msg.audioUrl) {
      new Audio(msg.audioUrl).play();
    } else if (msg.translatedText) {
      // On demand TTS
      const audio = await synthesizeSpeech(msg.translatedText);
      if (audio) new Audio(audio).play();
    }
  };

  return (
    <Layout className="bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/home')} className="text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="relative">
             <img src={otherParticipant.avatar} className="w-10 h-10 rounded-full" alt="avatar" />
             <span className="absolute -bottom-1 -right-1 text-lg leading-none filter drop-shadow-md">
                {SUPPORTED_LANGUAGES.find(l => l.name === otherParticipant.nativeLanguage)?.flag}
             </span>
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-800 leading-tight">{otherParticipant.name}</h2>
          <p className="text-xs text-slate-500">Speaks {otherParticipant.nativeLanguage}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {conversation.messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              
              {/* Message Bubble Container */}
              <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                isMe 
                  ? 'bg-teal-500 text-white rounded-br-sm' 
                  : 'bg-white border border-slate-100 rounded-bl-sm'
              }`}>
                
                {/* Translated Text (Primary for Receiver) */}
                <div className="text-[15px] font-medium leading-relaxed">
                   {isMe ? msg.originalText : msg.translatedText}
                </div>

                {/* Original Text (Secondary/Dual Mode) */}
                {(!isMe && settings.showOriginal) && (
                   <div className="mt-2 pt-2 border-t border-slate-100/30 text-xs opacity-70 italic font-light">
                      {msg.originalText}
                   </div>
                )}

                {/* Meta Controls */}
                <div className={`mt-2 flex items-center gap-3 ${isMe ? 'text-teal-100' : 'text-slate-400'}`}>
                  {/* Play Audio */}
                  <button onClick={() => handlePlayAudio(msg)} className="hover:opacity-100 opacity-70 transition-opacity">
                    <Volume2 className="w-4 h-4" />
                  </button>
                  
                  {/* Cultural Context Indicator */}
                  {!isMe && msg.culturalContext && (
                    <div className="group relative">
                      <Info className="w-4 h-4 hover:text-orange-400 cursor-help" />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-0 w-48 bg-orange-50 text-orange-800 text-xs p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-orange-100">
                        <span className="font-bold block mb-1">Cultural Context:</span>
                        {msg.culturalContext}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <span className="text-[10px] text-slate-300 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          );
        })}
        
        {isProcessing && (
          <div className="flex items-start gap-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200"></div>
            <div className="bg-slate-200 h-8 w-24 rounded-2xl"></div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-slate-100 pb-safe">
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-3xl border border-slate-200">
          
          <button 
            className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-slate-200 text-slate-500'}`}
            onMouseDown={() => setIsRecording(true)}
            onMouseUp={() => setIsRecording(false)}
            onTouchStart={() => setIsRecording(true)}
            onTouchEnd={() => setIsRecording(false)}
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isRecording ? "Listening..." : "Type in your language..."}
            className="flex-1 bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
          />

          <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim() && !isRecording}
            className={`p-2 rounded-full ${
              inputText.trim() ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Layout>
  );
};