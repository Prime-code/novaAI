import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { UserProfile, AppMode } from '../types';
import { NOVA_AI_SYSTEM_INSTRUCTION } from '../constants';
import { decode, decodeAudioData, createBlob } from '../services/audioUtils';

interface VoiceChatProps {
  userProfile: UserProfile;
  appMode: AppMode;
  onFeedback: (rating: 'good' | 'bad') => void;
  onDeduct: (wordCount: number) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ userProfile, appMode, onFeedback, onDeduct }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const drawVisualizer = useCallback(() => {
    if (!canvasRef.current || !analyzerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const renderFrame = () => {
      animationRef.current = requestAnimationFrame(renderFrame);
      analyzerRef.current!.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = status === 'speaking' ? 90 : 70;
      for (let i = 0; i < bufferLength; i += 2) {
        const barHeight = (dataArray[i] / 255) * 100;
        const angle = (i * 2 * Math.PI) / bufferLength;
        ctx.beginPath();
        ctx.strokeStyle = status === 'speaking' ? '#D4AF37' : '#0070f3';
        ctx.lineWidth = 2;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };
    renderFrame();
  }, [status]);

  const stopSession = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try { session.close(); } catch (e) {}
      });
      sessionPromiseRef.current = null;
    }

    [audioContextRef.current, outputAudioContextRef.current].forEach(ctx => {
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(err => console.debug('Error closing context:', err));
      }
    });
    audioContextRef.current = null;
    outputAudioContextRef.current = null;

    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setStatus('idle');
  }, []);

  const startSession = async () => {
    try {
      const isExhausted = userProfile.credits <= 0 && userProfile.role !== 'admin' && appMode === 'paid';
      if (isExhausted) {
        setError("Institutional word limits exhausted.");
        return;
      }

      setError(null);
      setStatus('connecting');
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      
      // Ensure context is running (fixes silent initial start in some browsers)
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      audioContextRef.current = audioCtx;
      outputAudioContextRef.current = outputCtx;
      analyzerRef.current = audioCtx.createAnalyser();
      const sourceNode = audioCtx.createMediaStreamSource(stream);
      sourceNode.connect(analyzerRef.current);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.debug('Nova AI Voice Session Opened');
            setStatus('listening');
            const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            sourceNode.connect(scriptProcessor);
            scriptProcessor.connect(audioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text ?? '';
              currentOutputTranscription.current += text;
              setTranscription(currentOutputTranscription.current);
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text ?? '';
              currentInputTranscription.current += text;
            }

            if (message.serverContent?.turnComplete) {
              const totalWords = (currentOutputTranscription.current.split(/\s+/).length) + (currentInputTranscription.current.split(/\s+/).length);
              onDeduct(totalWords);
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }
            
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const s of sourcesRef.current) {
                try { s.stop(); } catch (e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error('Nova AI Voice Session Error:', e);
            let msg = 'Voice session interrupted.';
            if (e.message?.includes('429')) {
              msg = "Institutional Voice Quota Reached. Please wait a few minutes.";
            }
            setError(msg);
            stopSession();
          },
          onclose: () => {
            console.debug('Nova AI Voice Session Closed');
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: NOVA_AI_SYSTEM_INSTRUCTION + `\n\nCONTEXT: User Name: ${userProfile.name}, User Type: ${userProfile.type}.`,
          speechConfig: { 
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } 
          },
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}
        }
      });

      sessionPromiseRef.current = sessionPromise;
      drawVisualizer();
    } catch (e: any) { 
      console.error('Nova AI Voice Start error:', e);
      let msg = "Check microphone permissions and API connectivity.";
      if (e.message?.includes('429')) msg = "Quota limits reached.";
      setError(msg); 
      setStatus('idle'); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-10">
      <div className="relative flex items-center justify-center">
        <canvas ref={canvasRef} width={400} height={400} className="relative z-10 opacity-60" />
        <button 
          onClick={status === 'idle' ? startSession : stopSession} 
          className={`absolute z-20 w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-500 ${status === 'idle' ? 'glass hover:bg-white/10' : 'bg-nova-gold text-nova-navy shadow-2xl shadow-nova-gold/20 scale-110'}`}
        >
          <i className={`fas ${status === 'idle' ? 'fa-microphone text-3xl mb-2' : 'fa-stop text-3xl mb-2'}`}></i>
          <span className="text-[8px] font-black uppercase tracking-widest">{status === 'idle' ? 'Communicate' : 'Cease'}</span>
        </button>
      </div>
      <div className="text-center space-y-4 max-w-xl px-10">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-40">{status.toUpperCase()}</h3>
        {transcription && (
          <div className="glass p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-2">
            <p className="text-sm font-light italic text-white/60">"{transcription}"</p>
          </div>
        )}
        {error && (
          <div className="text-xs text-red-500 font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20 animate-pulse">
            <i className="fas fa-exclamation-triangle mr-2"></i> {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;