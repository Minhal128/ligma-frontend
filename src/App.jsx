import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket.js';
import Canvas from './components/Canvas.jsx';
import EventLog from './components/EventLog.jsx';
import TaskBoard from './components/TaskBoard.jsx';
import ConflictHeatmap from './components/ConflictHeatmap.jsx';
import VoiceToCanvas from './components/VoiceToCanvas.jsx';
import SessionDNAReport from './components/SessionDNAReport.jsx';
import RBACViolationFeed from './components/RBACViolationFeed.jsx';
import RoleGuard from './components/RoleGuard.jsx';

const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return `${window.location.origin}/api`;
  return 'http://localhost:4000/api';
})();

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('contributor');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const url = mode === 'login' ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
    const body = mode === 'login' ? { username, password } : { username, password, role };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      localStorage.setItem('ligma_token', data.token);
      localStorage.setItem('ligma_user', JSON.stringify(data.user));
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ligma-bg font-ui">
      <div className="w-full max-w-sm bg-ligma-panel p-8 rounded-xl border border-ligma-deepblue/30 shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-white tracking-tight">LIGMA</h1>
        <div className="flex gap-2 mb-6">
          <button className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode === 'login' ? 'bg-ligma-accent text-white' : 'bg-ligma-deepblue text-gray-300'}`} onClick={() => setMode('login')}>Log In</button>
          <button className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode === 'register' ? 'bg-ligma-accent text-white' : 'bg-ligma-deepblue text-gray-300'}`} onClick={() => setMode('register')}>Register</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input type="text" placeholder="Username" className="w-full px-4 py-3 rounded-lg bg-ligma-bg border border-ligma-deepblue/40 text-white placeholder-gray-500 focus:outline-none focus:border-ligma-accent" value={username} onChange={e => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-lg bg-ligma-bg border border-ligma-deepblue/40 text-white placeholder-gray-500 focus:outline-none focus:border-ligma-accent" value={password} onChange={e => setPassword(e.target.value)} />
          {mode === 'register' && (
            <select className="w-full px-4 py-3 rounded-lg bg-ligma-bg border border-ligma-deepblue/40 text-white focus:outline-none focus:border-ligma-accent" value={role} onChange={e => setRole(e.target.value)}>
              <option value="contributor">Contributor</option>
              <option value="lead">Lead</option>
              <option value="viewer">Viewer</option>
            </select>
          )}
          {error && <p className="text-ligma-accent text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-lg bg-ligma-accent text-white font-semibold hover:opacity-90 transition">{mode === 'login' ? 'Log In' : 'Create Account'}</button>
        </form>
      </div>
    </div>
  );
}

function RoomSelect({ token, user, onSelect }) {
  const [rooms, setRooms] = useState([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/rooms`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setRooms)
      .catch(console.error);
  }, [token]);

  const createRoom = async () => {
    setError('');
    const res = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName || 'New Room' }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setRooms(prev => [data, ...prev]);
    setNewName('');
  };

  return (
    <div className="min-h-screen bg-ligma-bg font-ui p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Rooms</h1>
          <div className="text-sm text-gray-400">@{user.username} <span className="ml-2 px-2 py-1 rounded bg-ligma-deepblue text-xs">{user.role}</span></div>
        </div>
        <div className="flex gap-3 mb-6">
          <input type="text" placeholder="Room name..." className="flex-1 px-4 py-2 rounded-lg bg-ligma-panel border border-ligma-deepblue/40 text-white placeholder-gray-500 focus:outline-none focus:border-ligma-accent" value={newName} onChange={e => setNewName(e.target.value)} />
          <button onClick={createRoom} className="px-5 py-2 rounded-lg bg-ligma-accent text-white font-semibold hover:opacity-90">Create</button>
        </div>
        {error && <p className="text-ligma-accent text-sm mb-4">{error}</p>}
        <div className="space-y-3">
          {rooms.map(room => (
            <button key={room.id} onClick={() => onSelect(room)} className="w-full text-left px-5 py-4 rounded-lg bg-ligma-panel border border-ligma-deepblue/20 hover:border-ligma-accent/50 transition flex items-center justify-between group">
              <div>
                <div className="font-semibold text-white">{room.name}</div>
                <div className="text-xs text-gray-500 mt-1">Role: {room.my_role}</div>
              </div>
              <span className="text-ligma-accent opacity-0 group-hover:opacity-100 transition text-sm font-semibold">Enter →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Workspace({ room, token, user }) {
  const { connected, sendMessage, addListener } = useWebSocket(room.id, token);
  const [showConflictMap, setShowConflictMap] = useState(false);
  const [conflicts, setConflicts] = useState(new Map());
  const [violations, setViolations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

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
      if (msg.type === 'task_created') {
        setTasks(prev => [msg.task, ...prev]);
      }
    });
  }, [addListener]);

  // Load initial tasks
  useEffect(() => {
    fetch(`${API_URL}/tasks/${room.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setTasks)
      .catch(console.error);
  }, [room.id, token]);

  const throttleRef = useRef(0);
  const handleCursorMove = (x, y) => {
    setCursorPos({ x, y });
    const now = Date.now();
    if (now - throttleRef.current > 66) {
      throttleRef.current = now;
      sendMessage({ type: 'cursor_move', room_id: room.id, x, y, user_id: user.user_id, username: user.username });
    }
  };

  return (
    <div className="h-screen flex bg-ligma-bg text-white overflow-hidden font-ui">
      {/* Left Sidebar: Event Log + RBAC Violations */}
      <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-ligma-deepblue/20 bg-ligma-panel">
        <EventLog roomId={room.id} token={token} addListener={addListener} connected={connected} />
        <RoleGuard userRole={user.role} allowed={['lead']}>
          <RBACViolationFeed roomId={room.id} token={token} violations={violations} onClear={() => setViolations([])} />
        </RoleGuard>
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 relative min-w-0">
        <Canvas
          roomId={room.id}
          token={token}
          user={user}
          sendMessage={sendMessage}
          addListener={addListener}
          onCursorMove={handleCursorMove}
        />
        <ConflictHeatmap conflicts={conflicts} visible={showConflictMap} />
        <div className="absolute bottom-4 left-4 flex items-center gap-2 z-30">
          <VoiceToCanvas
            roomId={room.id}
            userId={user.user_id}
            cursorX={cursorPos.x}
            cursorY={cursorPos.y}
            sendMessage={sendMessage}
          />
          <button
            onClick={() => setShowConflictMap(s => !s)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${showConflictMap ? 'bg-ligma-accent border-ligma-accent text-white' : 'bg-ligma-panel border-ligma-deepblue/40 text-gray-300 hover:text-white'}`}
          >
            Conflict Map {showConflictMap ? 'ON' : 'OFF'}
          </button>
          <RoleGuard userRole={user.role} allowed={['lead']}>
            <SessionDNAReport roomId={room.id} token={token} />
          </RoleGuard>
        </div>
        {!connected && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-ligma-accent/90 text-white text-sm font-semibold z-30">
            Reconnecting...
          </div>
        )}
      </div>

      {/* Right Sidebar: Task Board */}
      <div className="w-[320px] flex-shrink-0 border-l border-ligma-deepblue/20 bg-ligma-panel">
        <TaskBoard tasks={tasks} />
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('ligma_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ligma_user')); } catch { return null; }
  });
  const [room, setRoom] = useState(null);

  if (!token || !user) {
    return <AuthScreen onLogin={(t, u) => { setToken(t); setUser(u); }} />;
  }

  if (!room) {
    return <RoomSelect token={token} user={user} onSelect={r => setRoom(r)} />;
  }

  return <Workspace room={room} token={token} user={user} />;
}
