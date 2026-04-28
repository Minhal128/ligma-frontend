import { useRef, useState, useCallback } from 'react';

export function useVoiceRecognition(onTranscript) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [supported, setSupported] = useState(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onstart = () => {
      setListening(true);
      setTranscript('');
      setInterimTranscript('');
    };
    rec.onend = () => {
      setListening(false);
    };
    rec.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) {
        setTranscript(prev => prev + final);
        if (onTranscript) onTranscript(final.trim());
      }
      setInterimTranscript(interim);
    };
    rec.onerror = (e) => {
      console.error('Speech recognition error', e);
      setListening(false);
    };
    recognitionRef.current = rec;
    rec.start();
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
    setInterimTranscript('');
  }, []);

  return { listening, transcript, interimTranscript, startListening, stopListening, supported };
}
