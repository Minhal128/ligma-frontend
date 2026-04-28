import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition.js';

export default function VoiceToCanvas({ roomId, userId, cursorX, cursorY, sendMessage }) {
  // Move hook calls to the very top
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleTranscript = useCallback((text) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    const x = cursorX || 400;
    const y = cursorY || 300;
    
    console.log('[VoiceToCanvas] Sending voice_node_create:', { text, x, y });
    sendMessage({
      type: 'voice_node_create',
      room_id: roomId,
      text,
      x,
      y,
      user_id: userId,
    });

    // Brief loading state for "Planning" feedback
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  }, [roomId, userId, cursorX, cursorY, sendMessage]);

  const { listening, interimTranscript, startListening, stopListening, supported } = useVoiceRecognition(handleTranscript);

  if (!supported) return null;

  const handleToggle = (e) => {
    e.preventDefault();
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative group">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <button
          onClick={handleToggle}
          className={`h-16 min-w-[200px] px-8 flex items-center justify-center gap-3 border-4 border-black text-sm font-black uppercase tracking-widest shadow-neo-lg transition-all select-none ${
            listening 
              ? 'bg-neo-accent text-neo-ink translate-x-[2px] translate-y-[2px] shadow-none' 
              : isProcessing
                ? 'bg-neo-muted text-neo-ink cursor-wait'
                : 'bg-neo-secondary text-neo-ink hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000]'
          }`}
        >
          {isProcessing ? (
            <Loader2 size={24} className="stroke-[3px] animate-spin" />
          ) : listening ? (
            <Mic size={24} className="stroke-[3px] shrink-0 animate-pulse" />
          ) : (
            <MicOff size={24} className="stroke-[3px] shrink-0" />
          )}
          
          <span className="whitespace-nowrap">
            {isProcessing ? 'Planning...' : listening ? 'Listening...' : 'Voice Note'}
          </span>
        </button>
      </motion.div>
      
      <AnimatePresence>
        {listening && interimTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full mb-6 left-0 min-w-[200px] max-w-xs border-4 border-black bg-neo-white p-4 text-xs font-bold uppercase tracking-wider shadow-neo-md rotate-1 z-50"
          >
            <div className="flex items-center gap-2 mb-2 text-neo-accent">
              <div className="w-2 h-2 rounded-full bg-neo-accent animate-ping" />
              <span>Capturing...</span>
            </div>
            <p className="leading-tight text-neo-ink">{interimTranscript}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
