import { useRef, useState, useCallback, useEffect } from 'react';

export function useVoiceRecognition(onTranscript) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [supported] = useState(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });

  const latestInterim = useRef('');
  const onTranscriptRef = useRef(onTranscript);

  // Keep the ref up to date to avoid stale closures
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        // If we have an interim transcript but no final yet, trigger it now
        if (latestInterim.current && onTranscriptRef.current) {
          onTranscriptRef.current(latestInterim.current.trim());
          latestInterim.current = '';
        }
      } catch (e) {
        console.error('Error stopping recognition', e);
      }
    }
    setListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setListening(true);
      setTranscript('');
      setInterimTranscript('');
      latestInterim.current = '';
    };

    rec.onend = () => {
      // If the browser stopped it automatically (e.g. silence), 
      // try to capture any remaining interim text
      if (latestInterim.current && onTranscriptRef.current) {
        onTranscriptRef.current(latestInterim.current.trim());
        latestInterim.current = '';
      }
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
      
      if (final && onTranscriptRef.current) {
        setTranscript(prev => prev + final);
        onTranscriptRef.current(final.trim());
      }
      
      setInterimTranscript(interim);
      latestInterim.current = interim;
    };

    rec.onerror = (e) => {
      console.error('Speech recognition error', e);
      setListening(false);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.error('Failed to start recognition', err);
      setListening(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  return { listening, transcript, interimTranscript, startListening, stopListening, supported };
}
