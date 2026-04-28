import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import * as Y from 'yjs';
import CursorOverlay from './CursorOverlay.jsx';

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

    // Observe Yjs array changes and apply to tldraw store
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

    // Listen to tldraw store changes and forward to Yjs
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

    // Cursor tracking
    const handlePointerMove = () => {
      const screen = editor.inputs.currentScreenPoint;
      onCursorMove(screen.x, screen.y);
    };
    window.addEventListener('pointermove', handlePointerMove);

    // Context menu for ACL
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

  // Apply incoming Yjs updates and other WS messages
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

      {showAclModal && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-ligma-panel border border-ligma-deepblue/40 rounded-xl p-6 w-80 shadow-2xl">
            <h3 className="text-white font-semibold mb-4">Set Permissions</h3>
            <div className="space-y-3">
              {['lead', 'contributor', 'viewer'].map(role => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm capitalize">{role}</span>
                  <select
                    className="bg-ligma-bg border border-ligma-deepblue/40 rounded px-2 py-1 text-sm text-white"
                    value={aclConfig[role]}
                    onChange={e => setAclConfig(prev => ({ ...prev, [role]: e.target.value }))}
                  >
                    <option value="read">Read</option>
                    <option value="comment">Comment</option>
                    <option value="write">Write</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAclModal(false)} className="flex-1 py-2 rounded-lg bg-gray-700 text-white text-sm">Cancel</button>
              <button onClick={saveAcl} className="flex-1 py-2 rounded-lg bg-ligma-accent text-white text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
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
