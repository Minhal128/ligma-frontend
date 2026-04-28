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
  const reconnectTimeoutRef = useRef(null);
  const messageQueueRef = useRef([]);

  const connect = useCallback(() => {
    if (!roomId || !token) return;
    
    // Clear existing connection if any
    if (wsRef.current) {
      const oldWs = wsRef.current;
      oldWs.onopen = null;
      oldWs.onmessage = null;
      oldWs.onclose = null;
      oldWs.onerror = null;
      oldWs.close();
    }

    console.log(`[WS] Connecting to ${WS_URL}...`);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      setConnected(true);
      ws.send(JSON.stringify({ type: 'join_room', room_id: roomId, token }));
      
      // Flush message queue
      if (messageQueueRef.current.length > 0) {
        console.log(`[WS] Flushing ${messageQueueRef.current.length} queued messages`);
        messageQueueRef.current.forEach(msg => ws.send(JSON.stringify(msg)));
        messageQueueRef.current = [];
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        listenersRef.current.forEach(cb => cb(msg));
      } catch {
        // ignore non-JSON
      }
    };

    ws.onclose = (event) => {
      console.log('[WS] Disconnected', event.code, event.reason);
      setConnected(false);
      // Reconnect after 3 seconds if not a clean close
      if (event.code !== 1000) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Error', err);
    };
  }, [roomId, token]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnection on unmount
        wsRef.current.close(1000, 'Unmounting');
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.log('[WS] Queueing message (socket not ready)', msg.type);
      messageQueueRef.current.push(msg);
    }
  }, []);

  const addListener = useCallback((cb) => {
    listenersRef.current.add(cb);
    return () => listenersRef.current.delete(cb);
  }, []);

  return { connected, sendMessage, addListener };
}
