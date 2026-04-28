import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';

export function useYjs(roomId) {
  const docRef = useRef(null);
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    docRef.current = ydoc;
    setDoc(ydoc);
    return () => {
      ydoc.destroy();
    };
  }, [roomId]);

  const encodeUpdate = useCallback((ydoc) => {
    return Y.encodeStateAsUpdate(ydoc);
  }, []);

  const applyUpdate = useCallback((update) => {
    if (docRef.current) {
      Y.applyUpdate(docRef.current, new Uint8Array(update));
    }
  }, []);

  return { doc, encodeUpdate, applyUpdate, docRef };
}
