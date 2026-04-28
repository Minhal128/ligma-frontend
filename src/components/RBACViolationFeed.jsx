import React, { useState, useEffect } from 'react';
import { Shield, Trash2 } from 'lucide-react';

const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return `${window.location.origin}/api`;
  return 'http://localhost:4000/api';
})();

export default function RBACViolationFeed({ roomId, token, violations, onClear }) {
  const [unread, setUnread] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!roomId || !token) return;
    fetch(`${API_URL}/security-events/${roomId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(rows => setHistory(rows))
      .catch(console.error);
  }, [roomId, token]);

  useEffect(() => {
    setUnread(violations.length);
  }, [violations]);

  const markRead = () => setUnread(0);

  return (
    <div className="border-t border-ligma-deepblue/20 bg-ligma-panel/80">
      <button
        onClick={() => { setExpanded(s => !s); markRead(); }}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-ligma-deepblue/10 transition"
      >
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-ligma-accent" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Security Feed</span>
          {unread > 0 && (
            <span className="w-4 h-4 rounded-full bg-ligma-accent text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>
          )}
        </div>
        <span className="text-gray-500 text-xs">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="px-2 pb-2 max-h-48 overflow-y-auto space-y-1">
          {(() => {
            const all = [...history, ...violations];
            const seen = new Set();
            const merged = [];
            for (const v of all) {
              const key = (v.id || v.attempted_at) + (v.user_id || '') + (v.attempted_action || '');
              if (!seen.has(key)) { seen.add(key); merged.push(v); }
            }
            if (merged.length === 0) return <div className="text-[10px] text-gray-600 py-2 text-center">No violations yet</div>;
            return merged.map((v, i) => (
              <div
                key={i}
                className="slide-in rounded px-2 py-1.5 border-l-2 border-ligma-accent/60 bg-red-500/[0.04]"
              >
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                  <span className="text-ligma-accent font-mono">{new Date(v.attempted_at || v.created_at).toLocaleTimeString([], { hour12: false })}</span>
                  <span>@{v.username || v.user_id?.slice(0, 6)}</span>
                </div>
                <div className="text-[11px] text-gray-300 mt-0.5 leading-tight">
                  attempted <span className="text-white font-semibold">{v.attempted_action}</span>
                  {v.node_id ? <span> on <span className="font-mono text-gray-400">{v.node_id.slice(0, 8)}</span></span> : null}
                  {' '}— <span className="text-ligma-accent font-semibold">BLOCKED</span>
                </div>
              </div>
            ));
          })()}
          {(history.length > 0 || violations.length > 0) && (
            <button
              onClick={onClear}
              className="w-full mt-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] text-gray-500 hover:text-gray-300 transition"
            >
              <Trash2 size={10} /> Clear Feed
            </button>
          )}
        </div>
      )}
    </div>
  );
}
