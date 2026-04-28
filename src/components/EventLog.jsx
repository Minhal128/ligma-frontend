import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

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
    case 'node_created': return { user: u, action: 'created node', detail: p.text || 'item' };
    case 'node_created_via_voice': return { user: u, action: 'created note via voice', detail: '' };
    case 'node_moved': return { user: u, action: 'moved a node', detail: '' };
    case 'node_text_changed': return { user: u, action: 'edited a node', detail: '' };
    case 'node_deleted': return { user: u, action: 'deleted a node', detail: '' };
    case 'node_acl_changed': return { user: u, action: 'changed permissions', detail: '' };
    case 'task_created': return { user: u, action: 'created task', detail: '' };
    case 'user_joined': return { user: u, action: 'joined', detail: '' };
    case 'user_left': return { user: u, action: 'left', detail: '' };
    default: return { user: u, action: ev.event_type, detail: '' };
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

  // Aggregate spammy join/leave events
  const displayEvents = [];
  const joinEventsMap = new Map();

  events.forEach((ev) => {
    if (ev.event_type === 'user_left') return; // Remove leaving spam completely

    if (ev.event_type === 'user_joined') {
      const user = ev.username || 'anon';
      if (!joinEventsMap.has(user)) {
        const newEv = { ...ev, joinCount: 1 };
        joinEventsMap.set(user, newEv);
        displayEvents.push(newEv);
      } else {
        const existing = joinEventsMap.get(user);
        existing.joinCount += 1;
        existing.created_at = ev.created_at; // Update to latest timestamp
        // Push to bottom of log
        const idx = displayEvents.indexOf(existing);
        if (idx !== -1) displayEvents.splice(idx, 1);
        displayEvents.push(existing);
      }
    } else {
      displayEvents.push(ev);
    }
  });

  if (collapsed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-b-4 border-black p-4 flex items-center justify-between bg-neo-white"
      >
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-neo-ink stroke-[3px]" />
          <span className="text-sm font-black uppercase tracking-widest text-neo-ink">Event Log</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(false)} className="rounded-none border-4 border-transparent hover:border-black active:translate-x-[2px] active:translate-y-[2px]">
          <ChevronRight size={16} className="stroke-[3px]" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-neo-white">
      <CardHeader className="border-b-4 border-black px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-neo-ink stroke-[3px]" />
            <CardTitle className="text-lg font-black uppercase tracking-tight text-neo-ink">Event Log</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: connected ? [1, 1.1, 1] : 1,
                opacity: connected ? [0.6, 1, 0.6] : 0.3,
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className={`flex items-center gap-1 border-4 border-black px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-widest shadow-neo-sm ${connected ? 'bg-neo-secondary text-neo-ink' : 'bg-neo-muted text-neo-ink'}`}>
                <span className="w-1.5 h-1.5 bg-current" />
                {connected ? 'Live' : 'Offline'}
              </div>
            </motion.div>
            <Button variant="ghost" size="sm" onClick={() => setCollapsed(true)} className="rounded-none border-4 border-transparent hover:border-black active:translate-x-[2px] active:translate-y-[2px]">
              <ChevronDown size={16} className="stroke-[3px]" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 border-b-4 border-black">
        <div className="p-4 space-y-3 font-sans">
          <AnimatePresence initial={false}>
            {displayEvents.map((ev, i) => {
              const formatted = formatEvent(ev);
              return (
                <motion.div
                  key={ev.id || `${ev.event_type}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="border-4 border-black bg-neo-canvas p-3 shadow-neo-sm relative overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    <div className="border-4 border-black bg-neo-white px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-widest shrink-0 rotate-1 mt-0.5">
                      {timeAgo(ev.created_at)}
                    </div>
                    <div className="flex-1 min-w-0 text-sm font-bold uppercase tracking-wide leading-relaxed">
                      <span 
                        className="text-neo-ink underline decoration-black decoration-2 underline-offset-2 inline-block max-w-[120px] sm:max-w-[160px] align-bottom truncate"
                        title={`@${formatted.user}`}
                      >
                        @{formatted.user}
                      </span>
                      <span className="text-neo-ink/80 ml-1.5">
                        {formatted.action} 
                        {ev.joinCount > 1 && (
                          <span className="ml-1 text-neo-ink font-black bg-neo-secondary px-1 border-2 border-black rotate-2 inline-block">
                            ({ev.joinCount}x)
                          </span>
                        )}
                      </span>
                      {formatted.detail && (
                        <span className="bg-neo-secondary px-1 py-0.5 text-neo-ink border-2 border-black block mt-1.5 w-fit max-w-full truncate text-[10px] xl:text-xs">
                          "{formatted.detail}"
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
