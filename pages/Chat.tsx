import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { Layout } from '../components/Layout';
import { translateMessage, generateBotReply, synthesizeSpeech, transcribeAudio } from '../services/geminiService';
import { ArrowLeft, Mic, Send, Volume2, Info, Languages, Loader2, StopCircle } from 'lucide-react';
import { Message, User, SUPPORTED_LANGUAGES } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, getConversation, addMessage, settings, updateSettings } = useStore();
  
  const conversation = getConversation(id || '');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, isProcessing]);

  if (!conversation || !currentUser) return null;

  const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id) || conversation.participants[0];

  const handleSendMessage = async (overrideText?: string, overrideAudioUrl?: string, isVoiceMessage: boolean = false) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim()) return;

    setInputText(''); 

    // 1. Add User Message (Optimistic)
    const userMsg: Message = {
      id: uuidv4(),
      senderId: currentUser.id,
      timestamp: Date.now(),
      originalText: textToSend,
      originalLanguage: currentUser.nativeLanguage,
      translatedText: textToSend,
      audioUrl: overrideAudioUrl, // Original audio if available
      isVoice: isVoiceMessage
    };
    addMessage(conversation.id, userMsg);

    setIsProcessing(true);

    // 2. Simulate Bot Reply & Translate
    // Wait a bit for "typing" effect
    setTimeout(async () => {
      // A. Bot generates native reply
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

      // B. Translate Bot Reply to User's Language
      const translation = await translateMessage(
        botReply.originalText,
        currentUser.nativeLanguage,
        otherParticipant.nativeLanguage,
        settings.showCulturalContext
      );

      // C. (Optional) Synthesize Speech
      let audioUrl: string | undefined = undefined;
      // If user sent voice, OR if auto-play is on, we generate audio for the reply
      if (settings.autoPlayVoice || isVoiceMessage) {
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
        audioUrl: audioUrl,
        isVoice: isVoiceMessage // If we are replying to voice, we treat it as voice interaction
      };

      addMessage(conversation.id, botMsg);
      setIsProcessing(false);
      
      // Auto play audio if available
      if (audioUrl && (settings.autoPlayVoice || isVoiceMessage)) {
        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.error("Autoplay blocked", e));
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
        
        // Process
        setIsProcessing(true);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          // Transcribe using Gemini
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
      alert("Microphone access denied or unavailable.");
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
    if (type === 'original' && msg.audioUrl && msg.isVoice) {
      new Audio(msg.audioUrl).play();
      return;
    }

    // TTS Fallback
    const textToSpeak = type === 'original' ? msg.originalText : msg.translatedText;
    if (!textToSpeak) return;

    // If we already have a generated URL for the bot message (which is usually the translated one), use it
    if (type === 'translated' && msg.audioUrl && !msg.isVoice) {
      new Audio(msg.audioUrl).play();
      return;
    }

    // Otherwise generate on the fly
    const audio = await synthesizeSpeech(textToSpeak);
    if (audio) new Audio(audio).play();
  };

  return (
    <Layout className="bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/home')} className="text-slate-600 hover:text-teal-600 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="relative">
             <img src={otherParticipant.avatar} className="w-10 h-10 rounded-full border border-slate-100" alt="avatar" />
             <span className="absolute -bottom-1 -right-1 text-lg leading-none filter drop-shadow-md">
                {SUPPORTED_LANGUAGES.find(l => l.name === otherParticipant.nativeLanguage)?.flag}
             </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-800 leading-tight truncate">{otherParticipant.name}</h2>
          <p className="text-xs text-slate-500 truncate">Speaks {otherParticipant.nativeLanguage}</p>
        </div>
        
        {/* Toggle Translation Mode */}
        <button 
          onClick={() => updateSettings({ showOriginal: !settings.showOriginal })}
          className={`p-2 rounded-full transition-all ${settings.showOriginal ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-400'}`}
          title="Toggle Dual Display"
        >
          <Languages className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {conversation.messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              
              {/* Message Bubble */}
              <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm relative group ${
                isMe 
                  ? 'bg-teal-500 text-white rounded-br-sm' 
                  : 'bg-white border border-slate-100 rounded-bl-sm'
              }`}>
                
                {/* Voice Indicator */}
                {msg.isVoice && (
                  <div className="flex items-center gap-2 mb-2 opacity-80">
                     <Mic className="w-3 h-3" /> <span className="text-[10px] uppercase font-bold tracking-wider">Voice Message</span>
                  </div>
                )}

                {/* Primary Text (Translated for receiver, Original for sender) */}
                <div className="text-[15px] font-medium leading-relaxed">
                   {isMe ? msg.originalText : (msg.translatedText || msg.originalText)}
                </div>

                {/* Secondary Text (Original Language) */}
                {(!isMe && settings.showOriginal) && (
                   <div className="mt-2 pt-2 border-t border-slate-100/30 text-xs opacity-70 italic font-light">
                      {msg.originalText}
                   </div>
                )}

                {/* Controls */}
                <div className={`mt-2 flex items-center gap-3 ${isMe ? 'text-teal-100' : 'text-slate-400'}`}>
                  {/* Play Button */}
                  <button 
                    onClick={() => handlePlayAudio(msg, isMe ? 'original' : 'translated')} 
                    className="hover:opacity-100 opacity-70 transition-opacity flex items-center gap-1"
                  >
                    <Volume2 className="w-4 h-4" />
                    {!isMe && settings.showOriginal && <span className="text-[10px]">Translated</span>}
                  </button>
                  
                  {/* Play Original (If dual mode) */}
                  {(!isMe && settings.showOriginal) && (
                     <button 
                      onClick={() => handlePlayAudio(msg, 'original')} 
                      className="hover:opacity-100 opacity-50 transition-opacity flex items-center gap-1"
                     >
                       <Volume2 className="w-3 h-3" />
                       <span className="text-[10px]">Original</span>
                     </button>
                  )}

                  {/* Cultural Context */}
                  {!isMe && msg.culturalContext && (
                    <div className="group/tooltip relative">
                      <Info className="w-4 h-4 hover:text-orange-400 cursor-help" />
                      <div className="absolute bottom-full mb-2 left-0 w-56 bg-orange-50 text-orange-800 text-xs p-3 rounded-xl shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 border border-orange-100">
                        <span className="font-bold block mb-1 uppercase tracking-wider text-[10px] text-orange-400">Cultural Context</span>
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
            <div className="bg-slate-200 h-10 w-32 rounded-2xl rounded-bl-sm flex items-center px-4">
               <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-slate-100 pb-safe">
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-3xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-teal-100 transition-shadow">
          
          <button 
            className={`p-3 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500 text-white animate-pulse scale-105 shadow-red-200 shadow-lg' : 'bg-white text-slate-500 hover:text-teal-600'}`}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            title="Hold to Record"
          >
            {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isRecording ? "Recording... Release to send" : `Type in ${currentUser.nativeLanguage}...`}
            disabled={isRecording}
            className="flex-1 bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400 h-full py-2"
          />

          <button 
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() && !isRecording}
            className={`p-3 rounded-full transition-transform active:scale-95 ${
              inputText.trim() ? 'bg-teal-500 text-white shadow-md shadow-teal-200' : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Layout>
  );
};