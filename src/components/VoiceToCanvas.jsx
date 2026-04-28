import React, { useState, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition.js';

export default function VoiceToCanvas({ roomId, userId, cursorX, cursorY, sendMessage }) {
  const [glowNodes, setGlowNodes] = useState([]);

  const handleTranscript = useCallback((text) => {
    if (!text.trim()) return;
    const x = cursorX || 400;
    const y = cursorY || 300;
    sendMessage({
      type: 'voice_node_create',
      room_id: roomId,
      text,
      x,
      y,
      user_id: userId,
    });
    const tempId = Date.now();
    setGlowNodes(prev => [...prev, tempId]);
    setTimeout(() => {
      setGlowNodes(prev => prev.filter(id => id !== tempId));
    }, 2000);
  }, [roomId, userId, cursorX, cursorY, sendMessage]);

  const { listening, interimTranscript, startListening, stopListening, supported } = useVoiceRecognition(handleTranscript);

  if (!supported) return null;

  return (
    <div className="relative">
      <button
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onMouseLeave={stopListening}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition select-none ${
          listening ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-ligma-panel border-ligma-deepblue/40 text-gray-300 hover:text-white'
        }`}
      >
        {listening ? <Mic size={14} /> : <MicOff size={14} />}
        {listening ? 'Listening...' : 'Voice'}
      </button>
      {listening && interimTranscript && (
        <div className="absolute bottom-full mb-2 left-0 bg-ligma-panel border border-ligma-deepblue/40 rounded-lg px-3 py-2 text-xs text-gray-300 whitespace-nowrap z-40 shadow-xl">
          {interimTranscript}
        </div>
      )}
    </div>
  );
}
