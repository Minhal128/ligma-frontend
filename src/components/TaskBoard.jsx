import React, { useMemo, useState } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return `${window.location.origin}/api`;
  return 'http://localhost:4000/api';
})();

const columns = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function TaskBoard({ tasks, roomId, token, members, myRole, onTasksChange }) {
  const [newTitle, setNewTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [loading, setLoading] = useState(false);
  const isLead = myRole === 'lead';
  const canUpdate = myRole === 'lead' || myRole === 'contributor';
  const contributors = members.filter((m) => m.role === 'contributor');

  const grouped = useMemo(() => {
    const buckets = { todo: [], in_progress: [], done: [] };
    tasks.forEach((t) => {
      const status = t.status || 'todo';
      if (buckets[status]) buckets[status].push(t);
    });
    return buckets;
  }, [tasks]);

  const createTask = async () => {
    if (!newTitle.trim() || !isLead) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tasks/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle.trim(), assigned_to: assignee || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onTasksChange((prev) => [data, ...prev]);
      setNewTitle('');
      setAssignee('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (task, status) => {
    if (!canUpdate) return;
    try {
      const res = await fetch(`${API_URL}/tasks/${roomId}/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onTasksChange((prev) => prev.map((t) => (t.id === data.id ? { ...t, ...data } : t)));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-neo-white">
      <CardHeader className="border-b-4 border-black px-4 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black uppercase tracking-tight text-neo-ink">Task Board</CardTitle>
          <div className="border-4 border-black bg-neo-canvas px-2 py-0.5 text-sm font-black shadow-neo-sm rotate-1">{tasks.length}</div>
        </div>
        {isLead && (
          <div className="mt-4 space-y-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Create task..."
              className="w-full border-4 border-black px-2 py-2 text-sm font-bold"
            />
            <div className="flex gap-2">
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="flex-1 border-4 border-black px-2 py-2 text-xs font-bold">
                <option value="">Unassigned</option>
                {contributors.map((m) => (
                  <option key={m.id} value={m.id}>@{m.username}</option>
                ))}
              </select>
              <button onClick={createTask} disabled={loading} className="border-4 border-black px-3 py-2 bg-neo-accent text-xs font-black uppercase">
                Add
              </button>
            </div>
          </div>
        )}
      </CardHeader>
      <ScrollArea className="flex-1 border-b-4 border-black">
        <div className="p-4 grid gap-3">
          {columns.map((col) => (
            <div key={col.key} className="border-4 border-black bg-neo-canvas p-2">
              <div className="text-xs font-black uppercase mb-2">{col.label} ({grouped[col.key].length})</div>
              <div className="space-y-2">
                {grouped[col.key].map((task) => (
                  <div key={task.id} className="border-4 border-black bg-neo-white p-2">
                    <p className="text-xs font-black uppercase">{task.title || task.content}</p>
                    <p className="text-[10px] font-bold mt-1">{task.assigned_username ? `@${task.assigned_username}` : 'Unassigned'}</p>
                    {canUpdate && (
                      <div className="mt-2 flex gap-1">
                        {columns.map((s) => (
                          <button
                            key={s.key}
                            onClick={() => updateTaskStatus(task, s.key)}
                            className={`border-2 border-black px-1 py-0.5 text-[10px] font-black uppercase ${task.status === s.key ? 'bg-neo-accent' : 'bg-neo-white'}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
