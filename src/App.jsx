import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from './hooks/useWebSocket.js';
import { Users } from 'lucide-react';
import Canvas from './components/Canvas.jsx';
import EventLog from './components/EventLog.jsx';
import ConflictHeatmap from './components/ConflictHeatmap.jsx';
import VoiceToCanvas from './components/VoiceToCanvas.jsx';
import SessionDNAReport from './components/SessionDNAReport.jsx';
import RBACViolationFeed from './components/RBACViolationFeed.jsx';
import RoleGuard from './components/RoleGuard.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import RoomSelect from './components/RoomSelect.jsx';
import InviteMembers from './components/InviteMembers.jsx';

const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return `${window.location.origin}/api`;
  return 'http://localhost:4000/api';
})();

function Workspace({ room, token, user, onLogout, onBack }) {
  const { connected, sendMessage, addListener } = useWebSocket(room.id, token);
  const [showConflictMap, setShowConflictMap] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [conflicts, setConflicts] = useState(new Map());
  const [violations, setViolations] = useState([]);
  const [members, setMembers] = useState([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const effectiveRole = room.my_role || user.role;

  useEffect(() => {
    return addListener((msg) => {
      if (msg.type === 'conflict_detected') {
        setConflicts(prev => {
          const next = new Map(prev);
          const existing = next.get(msg.node_id) || { count: 0, user_a: msg.user_a, user_b: msg.user_b, lastAt: new Date() };
          next.set(msg.node_id, { count: msg.count || (existing.count + 1), user_a: msg.user_a || existing.user_a, user_b: msg.user_b || existing.user_b, lastAt: new Date() });
          return next;
        });
      }
      if (msg.type === 'security_violation') {
        setViolations(prev => [msg, ...prev]);
      }
    });
  }, [addListener]);

  useEffect(() => {
    fetch(`${API_URL}/rooms/${room.id}/members`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setMembers)
      .catch(console.error);
  }, [room.id, token]);

  const throttleRef = useRef(0);
  const lastCursorSentRef = useRef({ x: null, y: null });
  const handleCursorMove = (x, y) => {
    setCursorPos({ x, y });
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    if (lastCursorSentRef.current.x === roundedX && lastCursorSentRef.current.y === roundedY) return;
    const now = Date.now();
    if (now - throttleRef.current > 66) {
      throttleRef.current = now;
      lastCursorSentRef.current = { x: roundedX, y: roundedY };
      sendMessage({ type: 'cursor_move', room_id: room.id, x: roundedX, y: roundedY, user_id: user.user_id, username: user.username });
    }
  };

  const [activeSidebarOffset, setActiveSidebarOffset] = useState(300);
  useEffect(() => {
    const measure = () => {
      setActiveSidebarOffset(window.innerWidth < 768 ? window.innerWidth : 300);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-neo-canvas text-neo-ink overflow-hidden font-sans relative">
      <div className="pointer-events-none absolute inset-0 bg-neo-grid opacity-40 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-neo-dots opacity-15 z-0" />


      {/* Top Mobile Header (only visible on small screens) */}
      <div className="md:hidden flex items-center justify-between border-b-4 border-black bg-neo-white px-4 py-3 z-50 shadow-neo-sm relative h-[68px]">
        <div className="flex items-center gap-3">
          <div className="border-4 border-black bg-neo-accent px-2 py-1 shadow-neo-sm rotate-1">
            <h2 className="text-xl font-black uppercase tracking-tight text-neo-ink truncate max-w-[100px]">
              {room.name}
            </h2>
          </div>
          <button 
            onClick={onLogout}
            className="border-4 border-black bg-red-500 px-2 py-1 font-black uppercase text-[10px] shadow-neo-sm"
          >
            Exit
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => document.getElementById('mobile-log').classList.toggle('hidden')} className="border-4 border-black bg-neo-secondary p-2 shadow-neo-sm active:translate-y-1">
             <span className="font-bold text-xs uppercase">Log</span>
          </button>
        </div>
      </div>

      {/* Left Sidebar - Event Log */}
      <motion.div
        id="mobile-log"
        initial={{ x: -activeSidebarOffset }}
        animate={{ x: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="hidden md:flex absolute md:relative top-[68px] md:top-0 left-0 w-full md:w-80 h-[calc(100vh-68px)] md:h-screen flex-shrink-0 flex-col border-r-4 md:border-black bg-neo-white z-40 md:z-10 shadow-neo-xl md:shadow-none"
      >
        {/* Desktop Controls Header */}
        <div className="hidden md:flex items-center gap-2 p-4 border-b-4 border-black bg-neo-canvas">
          <button
            onClick={onBack}
            className="flex-1 border-4 border-black bg-neo-secondary px-3 py-1.5 font-black uppercase text-[10px] shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            Back
          </button>
          <button 
            onClick={onLogout}
            className="flex-1 border-4 border-black bg-red-500 px-3 py-1.5 font-black uppercase text-[10px] shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            Logout
          </button>
        </div>
        <EventLog roomId={room.id} token={token} addListener={addListener} connected={connected} />
        <RoleGuard userRole={effectiveRole} allowed={['lead']}>
          <RBACViolationFeed roomId={room.id} token={token} violations={violations} onClear={() => setViolations([])} />
        </RoleGuard>
      </motion.div>

      {/* Center - Canvas */}
      <div className="flex-1 relative min-w-0 min-h-0 bg-neo-canvas z-10 flex flex-col">
        {/* Room Header - Desktop */}
        <div className="hidden md:flex absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="border-4 border-black bg-neo-white px-4 py-2 shadow-neo-sm rotate-1">
              <h2 className="text-xl font-black uppercase tracking-tight text-neo-ink max-w-[200px] lg:max-w-[300px] truncate">
                {room.name}
              </h2>
            </div>
            <div className={`border-4 border-black px-3 py-1.5 font-black uppercase tracking-widest text-xs shadow-neo-sm -rotate-1 ${connected ? 'bg-neo-accent text-neo-ink' : 'bg-neo-muted text-neo-ink'}`}>
              {connected ? '● Live' : '● Offline'}
            </div>
          </div>
          <div className="border-4 border-black bg-neo-secondary px-4 py-1.5 font-black uppercase tracking-widest text-xs shadow-neo-sm rotate-1 pointer-events-auto max-w-[150px] lg:max-w-[250px] truncate" title={`@${user.username}`}>
            @{user.username}
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 border-4 border-black bg-neo-white px-3 py-1.5 font-black uppercase text-xs shadow-neo-sm -rotate-1 hover:-translate-y-0.5 hover:shadow-neo-md transition-all pointer-events-auto"
            title="Manage Room Members"
          >
            <Users className="size-4 stroke-[3px]" />
            <span className="hidden sm:inline">Members</span>
            <span className="sm:hidden">Team</span>
          </button>
        </div>

        <div className="flex-1 relative">
          <Canvas
            roomId={room.id}
            token={token}
            user={user}
            sendMessage={sendMessage}
            addListener={addListener}
            onCursorMove={handleCursorMove}
          />
          <ConflictHeatmap conflicts={conflicts} visible={showConflictMap} />
        </div>
        
        {/* Bottom Controls / Prominent Voice Feature */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-[90px] md:bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none"
        >
          <div className="flex items-end gap-4 pointer-events-auto px-4 w-full max-w-4xl justify-center xl:justify-start">
            <div className="z-40">
               {/* Make Voice Feature the centerpiece */}
               <VoiceToCanvas
                roomId={room.id}
                userId={user.user_id}
                cursorX={cursorPos.x}
                cursorY={cursorPos.y}
                sendMessage={sendMessage}
              />
            </div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
              <button
                onClick={() => setShowConflictMap(s => !s)}
                className={`h-14 px-6 rounded-none border-4 border-black text-sm font-black uppercase tracking-widest shadow-neo-md transition-transform hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none -rotate-1 ${
                  showConflictMap 
                    ? 'bg-neo-accent text-neo-ink' 
                    : 'bg-neo-white text-neo-ink'
                }`}
              >
                Conflict Map {showConflictMap ? 'ON' : 'OFF'}
              </button>
            </motion.div>
            
            <div className="hidden sm:block pointer-events-auto">
               <RoleGuard userRole={effectiveRole} allowed={['lead']}>
                 <SessionDNAReport roomId={room.id} token={token} />
               </RoleGuard>
            </div>
          </div>
        </motion.div>
        
        <AnimatePresence>
          {!connected && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-30"
            >
              <div className="border-4 border-black bg-neo-accent px-6 py-3 shadow-neo-lg rotate-1">
                <span className="text-sm font-black uppercase tracking-widest text-neo-ink">
                  Reconnecting...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Invite Members Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteMembers
            roomId={room.id}
            token={token}
            userRole={room.my_role}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('ligma_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ligma_user')); } catch { return null; }
  });
  const [room, setRoom] = useState(null);

  const [inviteAcceptedCount, setInviteAcceptedCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    
    // Check both search and hash for invite token
    const searchParams = new URLSearchParams(window.location.search);
    let inviteToken = searchParams.get('invite');
    
    if (!inviteToken && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      inviteToken = new URLSearchParams(hashQuery).get('invite');
    }

    if (!inviteToken) return;

    fetch(`${API_URL}/rooms/invites/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ token: inviteToken }),
    }).then(res => {
      if (res.ok) {
        setInviteAcceptedCount(c => c + 1);
      }
    }).finally(() => {
      // Clean up URL
      const cleanHash = window.location.hash.split('?')[0];
      window.history.replaceState({}, '', `${window.location.pathname}${cleanHash}`);
    });
  }, [token]);

  const logout = () => {
    localStorage.removeItem('ligma_token');
    localStorage.removeItem('ligma_user');
    setToken(null);
    setUser(null);
    setRoom(null);
  };

  if (!token || !user) {
    return <AuthScreen onLogin={(t, u) => { 
      localStorage.setItem('ligma_token', t);
      localStorage.setItem('ligma_user', JSON.stringify(u));
      setToken(t); 
      setUser(u); 
    }} />;
  }

  if (!room) {
    return <RoomSelect key={inviteAcceptedCount} token={token} user={user} onSelect={r => setRoom(r)} />;
  }

  return <Workspace room={room} token={token} user={user} onLogout={logout} onBack={() => setRoom(null)} />;
}
