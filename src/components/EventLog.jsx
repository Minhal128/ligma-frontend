import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return `${window.location.origin}/api`;
  return 'http://localhost:4000/api';
})();

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}min ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

function formatEvent(ev) {
  const p = ev.payload || {};
  const u = ev.username || 'anon';
  switch (ev.event_type) {
    case 'node_created': return `@${u} created node '${p.text || 'item'}'`;
    case 'node_created_via_voice': return `@${u} created note via voice`;
    case 'node_moved': return `@${u} moved a node`;
    case 'node_text_changed': return `@${u} edited a node`;
    case 'node_deleted': return `@${u} deleted a node`;
    case 'node_acl_changed': return `@${u} changed permissions`;
    case 'task_created': return `@${u} created task`;
    case 'user_joined': return `@${u} joined`;
    case 'user_left': return `@${u} left`;
    default: return `@${u} ${ev.event_type}`;
  }
}

export default function EventLog({ roomId, token, addListener, connected }) {
  const [events, setEvents] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/events/${roomId}?limit=50`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(rows => setEvents(rows.reverse()))
      .catch(console.error);
  }, [roomId, token]);

  useEffect(() => {
    if (!addListener) return;
    return addListener((msg) => {
      if (msg.type === 'event_log_entry' && msg.event) {
        setEvents(prev => [...prev, msg.event]);
      }
      if (msg.type === 'missed_events') {
        setEvents(prev => [...prev, ...(msg.events || [])]);
      }
    });
  }, [addListener]);

  useEffect(() => {
    if (!collapsed && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, collapsed]);

  if (collapsed) {
    return (
      <div className="border-b border-ligma-deepblue/20 p-3 flex items-center justify-between bg-ligma-panel">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Event Log</span>
        <button onClick={() => setCollapsed(false)} className="text-gray-400 hover:text-white"><ChevronRight size={16} /></button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="p-3 flex items-center justify-between border-b border-ligma-deepblue/20 bg-ligma-panel/60">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Event Log</span>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-ligma-accent'}`} />
          <button onClick={() => setCollapsed(true)} className="text-gray-400 hover:text-white"><ChevronDown size={16} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
        {events.map((ev, i) => (
          <div key={ev.id || i} className="text-gray-300 leading-relaxed">
            <span className="text-gray-500 mr-1">[{timeAgo(ev.created_at)}]</span>
            {formatEvent(ev)}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
