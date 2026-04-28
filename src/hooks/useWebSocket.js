import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = (() => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (import.meta.env.PROD) return `wss://${window.location.host}/ws`;
  return 'ws://localhost:4000/ws';
})();

export function useWebSocket(roomId, token) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Set());

  useEffect(() => {
    if (!roomId || !token) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'join_room', room_id: roomId, token }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        listenersRef.current.forEach(cb => cb(msg));
      } catch {
        // ignore non-JSON
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WS error', err);
    };

    return () => {
      ws.close();
    };
  }, [roomId, token]);

  const sendMessage = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const addListener = useCallback((cb) => {
    listenersRef.current.add(cb);
    return () => listenersRef.current.delete(cb);
  }, []);

  return { connected, sendMessage, addListener };
}
