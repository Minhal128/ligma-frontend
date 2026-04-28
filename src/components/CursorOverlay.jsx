import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CursorOverlay({ cursors }) {
  return (
    <AnimatePresence>
      {cursors.map(c => (
        <motion.div
          key={c.user_id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute z-20 pointer-events-none"
          style={{ left: c.x, top: c.y }}
        >
          <motion.div
            animate={{ rotate: [-15, -10, -15] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M3 3L10.5 22L13.5 13.5L22 10.5L3 3Z" 
                fill={c.color} 
                stroke="white" 
                strokeWidth="1.5"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
              />
            </svg>
          </motion.div>
          <motion.div
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="ml-3 mt-1 px-2 py-1 rounded-md text-[10px] font-semibold text-white whitespace-nowrap shadow-lg"
            style={{ 
              backgroundColor: c.color,
              boxShadow: `0 0 10px ${c.color}40`
            }}
          >
            {c.username}
          </motion.div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
