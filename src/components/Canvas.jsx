import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tldraw, createShapeId } from 'tldraw';
import 'tldraw/tldraw.css';
import * as Y from 'yjs';
import CursorOverlay from './CursorOverlay.jsx';
import ClassificationBadge from './ClassificationBadge.jsx';
import { useAIClassification } from '../hooks/useAIClassification.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return `${window.location.origin}/api`;
  return 'http://localhost:4000/api';
})();

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function StickyClassificationOverlayItem({ note, onClassification }) {
  const { classification, isClassifying } = useAIClassification(note.id, note.text);

  useEffect(() => {
    if (classification) onClassification(note.id, classification);
  }, [classification, note.id, onClassification]);

  return (
    <div style={{ position: 'absolute', left: note.left, top: note.top, width: note.width, height: note.height, pointerEvents: 'none' }}>
      <ClassificationBadge classification={classification || note.aiTag || null} isClassifying={isClassifying} />
    </div>
  );
}

function CanvasContent({ roomId, token, user, sendMessage, addListener, onCursorMove }) {
  const editorRef = useRef(null);
  const ydocRef = useRef(new Y.Doc());
  const [cursors, setCursors] = useState([]);
  const [showAclModal, setShowAclModal] = useState(false);
  const [aclNodeId, setAclNodeId] = useState(null);
  const [aclConfig, setAclConfig] = useState({ lead: 'write', contributor: 'write', viewer: 'read' });
  const [stickyNotesForAI, setStickyNotesForAI] = useState([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const hasAnthropicKey = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY);

  const onMount = useCallback((editor) => {
    editorRef.current = editor;
    const ydoc = ydocRef.current;
    const yMap = ydoc.getMap('store');

    // Initial sync from Yjs to Tldraw
    const initialRecords = [];
    yMap.forEach((record) => {
      // Sync everything EXCEPT strictly local session state
      if (record && !record.id.startsWith('instance') && !record.id.startsWith('camera') && !record.id.startsWith('pointer')) {
        initialRecords.push(record);
      }
    });
    if (initialRecords.length > 0) {
      editor.store.mergeRemoteChanges(() => {
        editor.store.put(initialRecords);
      });
    }

    // Monitor Yjs changes (Incoming)
    const observeY = (event) => {
      // If the change came from our own local Tldraw sync, ignore it to avoid loops
      if (event.transaction.origin === 'local-sync') return;
      
      const toPut = [];
      const toRemove = [];
      
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add' || change.action === 'update') {
          const record = yMap.get(key);
          // Sync everything EXCEPT strictly local session state
          if (record && !record.id.startsWith('instance') && !record.id.startsWith('camera') && !record.id.startsWith('pointer')) {
            toPut.push(record);
          }
        } else if (change.action === 'delete') {
          if (!key.startsWith('instance') && !key.startsWith('camera') && !key.startsWith('pointer')) {
            toRemove.push(key);
          }
        }
      });

      if (toPut.length > 0 || toRemove.length > 0) {
        editor.store.mergeRemoteChanges(() => {
          if (toPut.length > 0) editor.store.put(toPut);
          if (toRemove.length > 0) editor.store.remove(toRemove);
        });
      }
    };
    yMap.observe(observeY);

    // Sync Tldraw changes to Yjs (Outgoing)
    const unsubscribe = editor.store.listen((entry) => {
      // If this change came from our own observeY (mergeRemoteChanges), ignore it
      if (entry.source === 'remote') return;
      
      ydoc.transact(() => {
        // Sync everything EXCEPT strictly local session state
        for (const record of Object.values(entry.changes.added)) {
          if (!record.id.startsWith('instance') && !record.id.startsWith('camera') && !record.id.startsWith('pointer')) {
            yMap.set(record.id, record);
          }
        }
        
        Object.entries(entry.changes.updated).forEach(([id, [from, to]]) => {
          if (!id.startsWith('instance') && !id.startsWith('camera') && !id.startsWith('pointer')) {
            yMap.set(id, to);
          }
        });
        
        for (const id of Object.keys(entry.changes.removed)) {
          if (!id.startsWith('instance') && !id.startsWith('camera') && !id.startsWith('pointer')) {
            yMap.delete(id);
          }
        }
      }, 'local-sync');
    });

    // Listen for Yjs updates to send to server (Incremental)
    const onYUpdate = (update, origin) => {
      // Only send updates that originated locally
      if (origin === 'remote') return;
      sendMessage({ type: 'yjs_update', room_id: roomId, update: arrayBufferToBase64(update) });
    };
    ydoc.on('update', onYUpdate);

    const handlePointerMove = () => {
      const screen = editor.inputs.currentScreenPoint;
      onCursorMove(screen.x, screen.y);
    };
    window.addEventListener('pointermove', handlePointerMove);

    const refreshStickyNotes = () => {
      const shapes = editor.getCurrentPageShapes();
      const notes = shapes
        .filter((shape) => (shape.type === 'note' || shape.type === 'geo') && shape?.props?.text)
        .map((shape) => {
          const bounds = editor.getShapePageBounds(shape);
          if (!bounds) return null;
          const topLeft = editor.pageToScreen({ x: bounds.minX, y: bounds.minY });
          const bottomRight = editor.pageToScreen({ x: bounds.maxX, y: bounds.maxY });
          return {
            id: shape.id,
            text: shape.props.text || '',
            aiTag: shape.props.aiTag || null,
            left: Math.min(topLeft.x, bottomRight.x),
            top: Math.min(topLeft.y, bottomRight.y),
            width: Math.max(40, Math.abs(bottomRight.x - topLeft.x)),
            height: Math.max(40, Math.abs(bottomRight.y - topLeft.y)),
          };
        })
        .filter(Boolean);
      setStickyNotesForAI(notes);
    };
    refreshStickyNotes();
    const unlistenStore = editor.store.listen(() => refreshStickyNotes(), { source: 'all' });
    window.addEventListener('resize', refreshStickyNotes);

    const handleContextMenu = (e) => {
      e.preventDefault();
      const hovered = editor.getHoveredShapes ? editor.getHoveredShapes() : new Set();
      if (hovered.size > 0) {
        const shape = Array.from(hovered)[0];
        setAclNodeId(shape.id);
        setAclConfig({ lead: 'write', contributor: 'write', viewer: 'read' });
        setShowAclModal(true);
      }
    };
    const container = document.querySelector('.tl-canvas');
    if (container) container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      yMap.unobserve(observeY);
      ydoc.off('update', onYUpdate);
      unsubscribe();
      unlistenStore?.();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', refreshStickyNotes);
      if (container) container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [roomId, sendMessage, onCursorMove]);


  useEffect(() => {
    if (!addListener) return;
    return addListener((msg) => {
      if (msg.type === 'yjs_update' && msg.update) {
        try {
          const update = base64ToUint8Array(msg.update);
          // Yjs observer (observeY) handles the store update automatically
          Y.applyUpdate(ydocRef.current, update, 'remote');
        } catch (e) {
          console.error('Yjs apply error', e);
        }
      }
      if (msg.type === 'canvas_agent_actions' && editorRef.current) {
        const editor = editorRef.current;
        msg.actions.forEach(act => {
          if (act.type === 'create') {
            const id = createShapeId();
            editor.createShape({
              id,
              type: act.shape === 'note' ? 'note' : 'geo',
              x: act.x || 400,
              y: act.y || 400,
              props: {
                text: act.content || '',
                color: act.color || 'blue',
                ...(act.shape === 'geo' ? { geo: act.props?.geo || 'rectangle' } : {})
              }
            });
            // Select the new shape so subsequent "write" commands work
            editor.select(id);
          }
          else if (act.type === 'modify') {
            // Find target shape by description
            const allShapes = editor.getCurrentPageShapes();
            const selectedShapes = editor.getSelectedShapes();
            const targetDesc = act.target?.toLowerCase();
            
            let target = null;
            if (targetDesc) {
              target = allShapes.find(s => {
                const textMatch = s.props.text?.toLowerCase().includes(targetDesc);
                const typeMatch = targetDesc.includes(s.type) || (targetDesc.includes('box') && s.props.geo === 'rectangle');
                const colorMatch = targetDesc.includes(s.props.color);
                return textMatch || (typeMatch && colorMatch) || typeMatch;
              });
            } else if (selectedShapes.length > 0) {
              target = selectedShapes[0];
            }

            if (target) {
              editor.updateShape({
                id: target.id,
                props: {
                  ...target.props,
                  ...(act.content ? { text: act.content } : {}),
                  ...(act.color ? { color: act.color } : {})
                }
              });
            }
          }
          else if (act.type === 'delete') {
            const allShapes = editor.getCurrentPageShapes();
            const selectedShapes = editor.getSelectedShapes();
            const targetDesc = act.target?.toLowerCase();
            
            let target = null;
            if (targetDesc) {
              target = allShapes.find(s => s.props.text?.toLowerCase().includes(targetDesc));
            } else if (selectedShapes.length > 0) {
              target = selectedShapes[0];
            }
            
            if (target) editor.deleteShape(target.id);
          }
        });
      }
      if (msg.type === 'cursor_update') {
        setCursors(prev => {
          const others = prev.filter(c => c.user_id !== msg.user_id);
          return [...others, { user_id: msg.user_id, x: msg.x, y: msg.y, color: msg.color, username: msg.username }];
        });
      }
    });
  }, [addListener]);

  const saveAcl = () => {
    sendMessage({
      type: 'node_acl_set',
      room_id: roomId,
      node_id: aclNodeId,
      acl: aclConfig,
    });
    setShowAclModal(false);
  };

  const persistClassification = useCallback((shapeId, classification) => {
    if (!editorRef.current || !classification?.type) return;
    const editor = editorRef.current;
    const shape = editor.getShape(shapeId);
    if (!shape?.props) return;

    const current = shape.props.aiTag;
    if (current && current.type === classification.type && current.confidence === classification.confidence) return;

    editor.updateShape({
      id: shapeId,
      type: shape.type,
      props: {
        ...shape.props,
        aiTag: classification,
      },
    });
  }, []);

  const taggedCount = stickyNotesForAI.filter((n) => n.aiTag).length;

  return (
    <div className="relative w-full h-full">
      <Tldraw
        onMount={onMount}
        autoFocus
        className="bg-transparent"
      />
      <button
        type="button"
        onClick={() => setShowAIPanel((s) => !s)}
        className={`absolute bottom-20 right-4 z-30 border-4 border-black px-3 py-2 text-[10px] font-black uppercase tracking-widest shadow-neo-sm ${
          hasAnthropicKey ? 'bg-neo-secondary text-black' : 'bg-neo-accent text-black'
        }`}
      >
        AI {hasAnthropicKey ? `${taggedCount}/${stickyNotesForAI.length}` : 'OFF'}
      </button>
      {showAIPanel && (
        <div className="absolute bottom-36 right-4 z-30 w-64 border-4 border-black bg-neo-white p-3 shadow-neo-lg">
          <p className="text-xs font-black uppercase tracking-widest">AI Classification</p>
          <p className="mt-2 text-[10px] font-bold uppercase">
            {hasAnthropicKey ? 'Claude active (2s debounce after typing)' : 'Set VITE_ANTHROPIC_API_KEY in frontend env'}
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase">Tagged Notes: {taggedCount}/{stickyNotesForAI.length}</p>
          <div className="mt-2 text-[10px] font-bold uppercase space-y-1">
            <p>✅ Task</p>
            <p>🔵 Decision</p>
            <p>❓ Question</p>
            <p>📎 Reference</p>
          </div>
        </div>
      )}
      {stickyNotesForAI.map((note) => (
        <StickyClassificationOverlayItem key={note.id} note={note} onClassification={persistClassification} />
      ))}
      <CursorOverlay cursors={cursors} />

      <AnimatePresence>
        {showAclModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAclModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="glass-panel w-96 shadow-2xl border-primary/30">
                <CardHeader>
                  <CardTitle>Set Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['lead', 'contributor', 'viewer'].map(role => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{role}</span>
                      <Select
                        value={aclConfig[role]}
                        onValueChange={value => setAclConfig(prev => ({ ...prev, [role]: value }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="comment">Comment</SelectItem>
                          <SelectItem value="write">Write</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAclModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={saveAcl} className="flex-1">
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Canvas({ roomId, token, user, sendMessage, addListener, onCursorMove }) {
  return (
    <div className="w-full h-full">
      <CanvasContent
        roomId={roomId}
        token={token}
        user={user}
        sendMessage={sendMessage}
        addListener={addListener}
        onCursorMove={onCursorMove}
      />
    </div>
  );
}
