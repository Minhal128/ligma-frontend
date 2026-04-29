import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Plus, Users, LogOut, Star } from 'lucide-react';

const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return `${window.location.origin}/api`;
  return 'http://localhost:4000/api';
})();

export default function RoomSelect({ token, user, onSelect }) {
  const [rooms, setRooms] = useState([]);
  const [leadDashboard, setLeadDashboard] = useState([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRooms = useCallback(() => {
    fetch(`${API_URL}/rooms`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setRooms)
      .catch(console.error);
  }, [token]);

  const fetchLeadDashboard = useCallback(() => {
    fetch(`${API_URL}/rooms/lead/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setLeadDashboard)
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchRooms();
    fetchLeadDashboard();
  }, [fetchRooms, fetchLeadDashboard]);

  useEffect(() => {
    const wsUrl = (() => {
      if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
      if (import.meta.env.PROD) return `wss://${window.location.host}/ws`;
      return 'ws://localhost:4000/ws';
    })();
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join_lobby', token }));
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'room_created') {
          fetchRooms();
        }
      } catch (e) {}
    };
    return () => {
      ws.close();
    };
  }, [token, fetchRooms]);

  const createRoom = async () => {
    if (!newName.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRooms(prev => [data, ...prev]);
      setNewName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ligma_token');
    localStorage.removeItem('ligma_user');
    window.location.reload();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neo-canvas text-neo-ink">
      <div className="pointer-events-none absolute inset-0 bg-neo-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-neo-noise opacity-5" />
      <div className="pointer-events-none absolute top-10 left-10 h-32 w-32 -rotate-12 border-4 border-black bg-neo-accent shadow-neo-md" />
      <div className="pointer-events-none absolute bottom-20 right-20 h-24 w-24 rotate-12 border-4 border-black bg-neo-muted shadow-neo-md" />

      <div className="relative z-10 mx-auto max-w-6xl p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 border-4 border-black bg-neo-white px-3 py-2 text-xs font-black uppercase tracking-[0.3em] shadow-neo-sm rotate-1">
              <Star className="size-4 stroke-[3px]" />
              Lobby
            </div>
            <div className="relative">
              <span className="neo-stroke absolute -top-1 left-1 text-5xl font-black uppercase tracking-tight md:text-7xl">
                Workspaces
              </span>
              <span className="relative text-5xl font-black uppercase tracking-tight md:text-7xl">
                Workspaces
              </span>
            </div>
            <p className="border-4 border-black bg-neo-secondary px-3 py-1 text-sm font-bold uppercase tracking-widest shadow-neo-sm -rotate-1 inline-block">
              Select or deploy a new room
            </p>
          </div>

          <div className="flex items-center border-4 border-black bg-neo-white p-2 shadow-neo-md rotate-1">
            <div className="flex flex-col items-end px-3">
              <span className="text-sm font-black uppercase tracking-wider text-neo-ink">@{user.username}</span>
              <span className="border-4 border-black bg-neo-muted px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-widest shadow-neo-sm">
                {user.role}
              </span>
            </div>
            <Button
              variant="default"
              size="icon"
              onClick={handleLogout}
              className="ml-2 h-10 w-10 flex-shrink-0 rounded-none border-4 border-black bg-neo-accent text-neo-ink shadow-neo-sm transition-transform hover:-translate-y-0.5 hover:shadow-neo-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              title="Logout"
            >
              <LogOut className="size-5 stroke-[3px]" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="border-4 border-black bg-neo-muted p-4 shadow-neo-lg -rotate-1 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Input
                type="text"
                placeholder="Enter new room name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createRoom()}
                className="h-14 flex-1 rounded-none border-4 border-black bg-neo-white text-lg font-bold text-neo-ink placeholder:text-black/40 shadow-neo-sm focus-visible:border-black focus-visible:bg-neo-secondary focus-visible:ring-0 focus-visible:shadow-neo-md"
              />
              <Button
                onClick={createRoom}
                disabled={loading || !newName.trim()}
                className="h-14 shrink-0 gap-2 rounded-none border-4 border-black bg-neo-accent px-6 text-sm font-black uppercase tracking-widest text-neo-ink shadow-neo-md transition-transform hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <Plus className="size-5 stroke-[3px]" />
                Deploy Room
              </Button>
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 border-4 border-black bg-neo-accent px-3 py-2 text-sm font-bold shadow-neo-sm"
              >
                {error}
              </motion.p>
            )}
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  onClick={() => onSelect(room)}
                  className="group relative h-full cursor-pointer border-4 border-black bg-neo-white p-6 shadow-neo-md transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-neo-xl"
                >
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div>
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <h3 className="line-clamp-2 text-2xl font-black uppercase leading-tight tracking-tight">
                          {room.name}
                        </h3>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border-4 border-black bg-neo-secondary shadow-neo-sm transition-transform group-hover:rotate-12 group-hover:bg-neo-accent">
                          <ArrowRight className="size-5 stroke-[3px]" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center border-4 border-black bg-neo-canvas p-1 shadow-neo-sm -rotate-2">
                        <Users className="size-4 stroke-[3px]" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-neo-ink/70">
                        Role:
                      </span>
                      <span className="border-4 border-black bg-neo-muted px-2 py-1 text-[0.6rem] font-black uppercase tracking-widest shadow-neo-sm rotate-1">
                        {room.my_role}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {rooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-col items-center border-4 border-black bg-neo-white p-12 text-center shadow-neo-lg rotate-1"
          >
            <div className="mb-6 flex h-24 w-24 items-center justify-center border-4 border-black bg-neo-secondary shadow-neo-md -rotate-3">
              <Users className="size-12 stroke-[3px]" />
            </div>
            <p className="text-xl font-black uppercase tracking-tight sm:text-2xl">
              No active deployments
            </p>
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-neo-ink/60">
              Deploy your first workspace above to begin
            </p>
          </motion.div>
        )}

        {user.role === 'lead' && leadDashboard.length > 0 && (
          <div className="mt-12 border-4 border-black bg-neo-white p-6 shadow-neo-lg">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Lead Dashboard</h3>
            <div className="grid gap-4">
              {leadDashboard.map((room) => {
                const todo = room.tasks.filter((t) => t.status === 'todo');
                const inProgress = room.tasks.filter((t) => t.status === 'in_progress');
                const done = room.tasks.filter((t) => t.status === 'done');
                return (
                  <div key={room.id} className="border-4 border-black bg-neo-canvas p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-black uppercase">{room.name}</h4>
                      <button onClick={() => onSelect(room)} className="border-4 border-black px-2 py-1 bg-neo-accent text-xs font-black uppercase">
                        Open
                      </button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3 text-xs">
                      <div className="border-4 border-black bg-neo-white p-2">
                        <p className="font-black uppercase mb-2">To Do ({todo.length})</p>
                        {todo.slice(0, 4).map((t) => <p key={t.id} className="font-bold truncate">{t.title}</p>)}
                      </div>
                      <div className="border-4 border-black bg-neo-white p-2">
                        <p className="font-black uppercase mb-2">In Progress ({inProgress.length})</p>
                        {inProgress.slice(0, 4).map((t) => <p key={t.id} className="font-bold truncate">{t.title}</p>)}
                      </div>
                      <div className="border-4 border-black bg-neo-white p-2">
                        <p className="font-black uppercase mb-2">Done ({done.length})</p>
                        {done.slice(0, 4).map((t) => <p key={t.id} className="font-bold truncate">{t.title}</p>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
