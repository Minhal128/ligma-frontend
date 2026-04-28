import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, FileText, AlertTriangle } from 'lucide-react';

const BADGES = {
  action_item: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
  decision: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle2 },
  open_question: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: HelpCircle },
  reference: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: FileText },
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}min ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

export default function TaskBoard({ tasks }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.intent_label === filter);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-ligma-deepblue/20 bg-ligma-panel/60">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Task Board</h2>
        <div className="flex gap-2 mt-2 flex-wrap">
          {['all', 'action_item', 'decision', 'open_question', 'reference'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded text-[10px] font-semibold uppercase border transition ${filter === f ? 'bg-ligma-deepblue text-white border-ligma-deepblue' : 'bg-transparent text-gray-400 border-ligma-deepblue/30 hover:text-white'}`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.map(task => {
          const badge = BADGES[task.intent_label] || BADGES.reference;
          const Icon = badge.icon;
          return (
            <div key={task.id} className="bg-ligma-bg border border-ligma-deepblue/20 rounded-lg p-3 hover:border-ligma-accent/30 transition cursor-pointer group">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm text-white leading-snug">{task.content}</div>
                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase flex items-center gap-1 whitespace-nowrap ${badge.color}`}><Icon size={10} /> {task.intent_label.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
                <span>@{task.author_name || 'unknown'}</span>
                <span>{timeAgo(task.created_at)}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-gray-600 text-xs py-8">No tasks yet</div>
        )}
      </div>
    </div>
  );
}
