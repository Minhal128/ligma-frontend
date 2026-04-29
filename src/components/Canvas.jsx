import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tldraw, createShapeId } from 'tldraw';
import 'tldraw/tldraw.css';
import * as Y from 'yjs';
import CursorOverlay from './CursorOverlay.jsx';
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

function CanvasContent({ roomId, token, user, sendMessage, addListener, onCursorMove }) {
  const editorRef = useRef(null);
  const ydocRef = useRef(new Y.Doc());
  const [cursors, setCursors] = useState([]);
  const [showAclModal, setShowAclModal] = useState(false);
  const [aclNodeId, setAclNodeId] = useState(null);
  const [aclConfig, setAclConfig] = useState({ lead: 'write', contributor: 'write', viewer: 'read' });
  const suppressOutRef = useRef(false);

  const onMount = useCallback((editor) => {
    editorRef.current = editor;
    const ydoc = ydocRef.current;
    const yArray = ydoc.getArray('shapes');

    // Dump existing changes if any arrived before mount
    suppressOutRef.current = true;
    yArray.toArray().forEach((changeBatch) => {
      changeBatch.forEach((change) => {
        if (!change) return;
        try {
          if (change.type === 'added' || change.type === 'updated') {
            if (editor.store.get(change.id)) {
              editor.store.updateRecord(change.record);
            } else {
              editor.store.put([change.record]);
            }
          }
          if (change.type === 'removed') {
            editor.store.remove([change.id]);
          }
        } catch {
          // ignore stale shape updates
        }
      });
    });
    suppressOutRef.current = false;

    const observeY = (event) => {
      suppressOutRef.current = true;
      event.changes.delta.forEach((d) => {
        if (d.insert) {
          d.insert.forEach((change) => {
            if (!change) return;
            try {
              if (change.type === 'added' || change.type === 'updated') {
                if (editor.store.get(change.id)) {
                  editor.store.updateRecord(change.record);
                } else {
                  editor.store.put([change.record]);
                }
              }
              if (change.type === 'removed') {
                editor.store.remove([change.id]);
              }
            } catch {
              // ignore stale shape updates
            }
          });
        }
      });
      suppressOutRef.current = false;
    };
    yArray.observe(observeY);

    const unsubscribe = editor.store.listen((entry) => {
      if (suppressOutRef.current) return;
      const changes = [];
      for (const [id, record] of Object.entries(entry.changes.added || {})) {
        changes.push({ type: 'added', id, record });
      }
      for (const [id, record] of Object.entries(entry.changes.updated || {})) {
        changes.push({ type: 'updated', id, record });
      }
      for (const id of Object.keys(entry.changes.removed || {})) {
        changes.push({ type: 'removed', id });
      }
      if (changes.length) {
        yArray.push(changes);
        const update = Y.encodeStateAsUpdate(ydoc);
        sendMessage({ type: 'yjs_update', room_id: roomId, update: arrayBufferToBase64(update) });
      }
    });

    const handlePointerMove = () => {
      const screen = editor.inputs.currentScreenPoint;
      onCursorMove(screen.x, screen.y);
    };
    window.addEventListener('pointermove', handlePointerMove);

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
      yArray.unobserve(observeY);
      unsubscribe();
      window.removeEventListener('pointermove', handlePointerMove);
      if (container) container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [roomId, sendMessage, onCursorMove]);

  useEffect(() => {
    if (!addListener) return;
    return addListener((msg) => {
      if (msg.type === 'yjs_update' && msg.update) {
        try {
          const update = base64ToUint8Array(msg.update);
          Y.applyUpdate(ydocRef.current, update);
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

  return (
    <div className="relative w-full h-full">
      <Tldraw
        onMount={onMount}
        autoFocus
        className="bg-transparent"
      />
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
