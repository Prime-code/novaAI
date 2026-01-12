import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Message, UserProfile, AppMode } from '../types';
import { NOVA_AI_SYSTEM_INSTRUCTION } from '../constants';
import { decode, decodeAudioData } from '../services/audioUtils';

const MessageBubble: React.FC<{ msg: Message; userName: string }> = ({ msg, userName }) => (
  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
    <div className={`max-w-[85%] space-y-2`}>
      <span className="text-[8px] font-black uppercase tracking-widest opacity-30 block ml-2">
        {msg.role === 'user' ? userName : 'Nova AI'}
      </span>
      <div className={`p-6 rounded-[32px] text-sm leading-relaxed border ${
        msg.role === 'user' 
          ? 'bg-white/5 border-white/10 rounded-br-none' 
          : 'bg-nova-gold/5 border-nova-gold/10 rounded-bl-none'
      }`}>
        <div className="markdown-content"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <p className="text-[8px] font-black uppercase tracking-widest opacity-30">Sources:</p>
            {msg.sources.map((source, idx) => (
              <a 
                key={idx} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block text-[10px] text-nova-gold hover:underline truncate"
              >
                {source.title || source.uri}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

interface TextChatProps {
  userProfile: UserProfile;
  appMode: AppMode;
  onLog?: (messages: Message[]) => void;
  onDeduct: (wordCount: number) => void;
}

const TextChat: React.FC<TextChatProps> = ({ userProfile, appMode, onLog, onDeduct }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${userProfile.name}. I am Nova AI. How can I assist you today?`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const ensureAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const generateSpeech = async (text: string) => {
    try {
      setIsSpeaking(true);
      const ctx = await ensureAudioContext();
      
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch (e) {}
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(
          decode(base64Audio),
          ctx,
          24000,
          1,
        );
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        currentSourceRef.current = source;
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (err: any) {
      console.error("Nova AI TTS Error:", err);
      setIsSpeaking(false);
      if (err.message?.includes('429')) {
        console.warn("TTS Quota exceeded - silent response fallback.");
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    setError(null);
    await ensureAudioContext();

    const wordCount = input.trim().split(/\s+/).length;
    onDeduct(wordCount);
    
    const userMessage: Message = { role: 'user', content: input, timestamp: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: { 
          systemInstruction: NOVA_AI_SYSTEM_INSTRUCTION + `\nUser's name is ${userProfile.name}.`, 
          tools: [{ googleSearch: {} }] 
        }
      });

      const textOutput = response.text || "I'm processing that.";
      
      const sources: Array<{ title: string; uri: string }> = [];
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            });
          }
        });
      }

      onDeduct(textOutput.trim().split(/\s+/).length);
      const aiMessage: Message = { 
        role: 'assistant', 
        content: textOutput, 
        timestamp: Date.now(),
        sources: sources.length > 0 ? sources : undefined
      };
      
      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      if (onLog) onLog(finalMessages);

      generateSpeech(textOutput);

    } catch (e: any) {
      console.error("Nova AI Chat Error:", e);
      let errorMessage = "An error occurred. Please verify connectivity.";
      
      if (e.message?.includes('429')) {
        errorMessage = "Nova AI Quota Exceeded. The school's institutional API limits have been reached for this hour. Please wait a few minutes or contact support if the issue persists.";
      }

      setError(errorMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full px-4 overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-8 py-10 custom-scrollbar pr-4">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} msg={msg} userName={userProfile.name} />
        ))}
        {isTyping && <div className="text-[10px] font-bold text-nova-gold/40 animate-pulse ml-2">Nova AI is thinking...</div>}
        {isSpeaking && <div className="text-[10px] font-bold text-nova-gold animate-pulse ml-2"><i className="fas fa-volume-up mr-2"></i>Nova AI is speaking...</div>}
        {error && <div className="text-[10px] font-bold text-red-500/60 ml-2 italic">{error}</div>}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="pb-8 pt-4">
        <div className="glass p-2 rounded-full flex items-center border border-white/10">
          <input 
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query Nova AI..."
            className="flex-1 bg-transparent px-8 py-4 focus:outline-none text-sm text-white"
          />
          <button onClick={handleSend} disabled={isTyping} className="w-12 h-12 rounded-full bg-nova-gold text-nova-navy flex items-center justify-center transition-all hover:scale-105 active:scale-95">
            <i className="fas fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextChat;