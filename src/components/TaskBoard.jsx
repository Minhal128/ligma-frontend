import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, HelpCircle, FileText, AlertTriangle, Filter } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const BADGES = {
  action_item: { 
    color: 'bg-neo-accent text-neo-ink border-black', 
    icon: AlertTriangle,
  },
  decision: { 
    color: 'bg-neo-secondary text-neo-ink border-black', 
    icon: CheckCircle2,
  },
  open_question: { 
    color: 'bg-neo-muted text-neo-ink border-black', 
    icon: HelpCircle,
  },
  reference: { 
    color: 'bg-neo-white text-neo-ink border-black', 
    icon: FileText,
  },
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
    <div className="h-full flex flex-col bg-neo-white">
      <CardHeader className="border-b-4 border-black px-4 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black uppercase tracking-tight text-neo-ink flex items-center gap-2">
            <Filter size={20} className="stroke-[3px]" />
            Task Board
          </CardTitle>
          <div className="border-4 border-black bg-neo-canvas px-2 py-0.5 text-sm font-black shadow-neo-sm rotate-1">
            {tasks.length}
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {['all', 'action_item', 'decision', 'open_question', 'reference'].map(f => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              size="sm"
              className={`rounded-none border-4 border-black px-3 py-1 text-xs font-black uppercase tracking-widest shadow-neo-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] hover:-translate-y-0.5 ${
                filter === f ? 'bg-neo-accent text-neo-ink hover:bg-neo-accent' : 'bg-neo-canvas text-neo-ink hover:bg-neo-canvas'
              }`}
            >
              {f.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 border-b-4 border-black">
        <div className="p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((task, index) => {
              const badge = BADGES[task.intent_label] || BADGES.reference;
              const Icon = badge.icon;
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  layout
                >
                  <div className="border-4 border-black bg-neo-white p-4 shadow-neo-md -rotate-1 relative overflow-visible mt-2">
                    <div className="absolute -top-3 -right-2 border-4 border-black rotate-3 shadow-neo-sm px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-widest bg-neo-canvas text-neo-ink">
                      {timeAgo(task.created_at)}
                    </div>
                    <div className="flex items-start gap-4 mt-2">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center border-4 border-black shadow-neo-sm rotate-2 ${badge.color}`}>
                        <Icon size={20} className="stroke-[3px]" />
                      </div>
                      <div className="flex-1 min-w-0 font-sans">
                        <p className="text-sm font-bold leading-relaxed mb-3 uppercase text-neo-ink">{task.content}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-widest text-neo-ink underline decoration-2 underline-offset-2">
                            @{task.author_name || 'unknown'}
                          </span>
                          <span className={`border-4 text-[10px] px-1.5 py-0.5 font-black uppercase tracking-widest -rotate-1 bg-neo-canvas text-neo-ink ${badge.color}`}>
                            {task.intent_label.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 border-4 border-black bg-neo-canvas p-6 text-center shadow-neo-md rotate-1"
            >
              <p className="text-sm font-black uppercase tracking-widest text-neo-ink">No tasks yet</p>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
