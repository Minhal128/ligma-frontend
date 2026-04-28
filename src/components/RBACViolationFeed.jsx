import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const all = [...history, ...violations];
  const seen = new Set();
  const merged = [];
  for (const v of all) {
    const key = (v.id || v.attempted_at) + (v.user_id || '') + (v.attempted_action || '');
    if (!seen.has(key)) { seen.add(key); merged.push(v); }
  }

  return (
    <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
      <button
        onClick={() => { setExpanded(s => !s); markRead(); }}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition"
      >
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-destructive" />
          <span className="text-sm font-semibold">Security Feed</span>
          <AnimatePresence>
            {unread > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unread}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ScrollArea className="max-h-64">
              <div className="px-3 pb-3 space-y-2">
                <AnimatePresence>
                  {merged.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground py-4 text-center"
                    >
                      No violations yet
                    </motion.div>
                  ) : (
                    merged.map((v, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="glass-panel border-l-4 border-l-destructive">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-muted-foreground mb-1">
                                  {new Date(v.attempted_at || v.created_at).toLocaleTimeString([], { hour12: false })}
                                  {' • '}
                                  <span className="font-medium">@{v.username || v.user_id?.slice(0, 6)}</span>
                                </div>
                                <div className="text-sm leading-tight">
                                  attempted <span className="font-semibold text-foreground">{v.attempted_action}</span>
                                  {v.node_id && (
                                    <span className="text-muted-foreground">
                                      {' '}on <code className="text-xs">{v.node_id.slice(0, 8)}</code>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge variant="destructive" className="text-xs">BLOCKED</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
                
                {merged.length > 0 && (
                  <Button
                    onClick={onClear}
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 text-xs"
                  >
                    <Trash2 size={12} />
                    Clear Feed
                  </Button>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
