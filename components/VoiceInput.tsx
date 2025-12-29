
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, AlertCircle, Loader2 } from 'lucide-react';
import { Language } from '../types';

interface VoiceInputProps {
  language: Language;
  onUpdate: (text: string) => void;
  value: string;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ language, onUpdate, value, className = "" }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>(""); 

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        baseTextRef.current = value;
      };

      recognition.onresult = (event: any) => {
        let sessionTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
             sessionTranscript += event.results[i][0].transcript;
        }
        
        // Add a space if base text is not empty and doesn't end in whitespace
        const spacer = (baseTextRef.current && !/\s$/.test(baseTextRef.current)) ? ' ' : '';
        onUpdate(baseTextRef.current + spacer + sessionTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
            setError("Mic denied");
        } else {
            setError("Error");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
        setError("Not supported");
    }

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, [language]); 

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      baseTextRef.current = value; 
      recognitionRef.current.start();
    }
  };

  if (error === "Not supported") return null;

  return (
    <button
      onClick={toggleListening}
      className={`p-2 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm ${
        isListening 
          ? 'bg-red-500/90 text-white animate-pulse ring-2 ring-red-400 ring-offset-2 ring-offset-slate-900' 
          : 'bg-slate-800/80 text-primary-400 hover:bg-primary-600 hover:text-white border border-slate-700'
      } ${className}`}
      title={isListening ? "Stop Recording" : "Start Voice Input"}
    >
      {isListening ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
      {error && (
          <span className="absolute -top-8 right-0 bg-red-900/90 text-red-100 text-xs px-2 py-1 rounded border border-red-700 whitespace-nowrap flex items-center gap-1">
             <AlertCircle size={10} /> {error}
          </span>
      )}
    </button>
  );
};
