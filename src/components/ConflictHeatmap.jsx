import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConflictHeatmap({ conflicts, visible }) {
  const [hovered, setHovered] = useState(null);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      <AnimatePresence>
        {Array.from(conflicts.entries()).map(([nodeId, data]) => {
          if (!data.count) return null;
          const intensity = data.count >= 6 ? 'high' : data.count >= 3 ? 'medium' : 'low';
          const size = intensity === 'high' ? 64 : intensity === 'medium' ? 48 : 36;
          const color = intensity === 'high' 
            ? 'rgba(239, 68, 68, 0.6)' 
            : intensity === 'medium' 
            ? 'rgba(251, 146, 60, 0.5)' 
            : 'rgba(250, 204, 21, 0.4)';

          return (
            <motion.div
              key={nodeId}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute"
              style={{
                left: 200 + (Math.abs(hashCode(nodeId)) % 600),
                top: 100 + (Math.abs(hashCode(nodeId + 'salt')) % 400),
              }}
              onMouseEnter={() => setHovered(nodeId)}
              onMouseLeave={() => setHovered(null)}
            >
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{
                  duration: intensity === 'high' ? 1 : 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="rounded-full"
                style={{
                  width: size,
                  height: size,
                  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                  boxShadow: `0 0 ${size}px ${color}`,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                }}
              />
              
              <AnimatePresence>
                {hovered === nodeId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-panel rounded-lg px-4 py-3 text-xs whitespace-nowrap z-30 shadow-xl pointer-events-auto border border-primary/30"
                  >
                    <div className="font-semibold text-destructive mb-1">
                      {data.count} conflicts resolved
                    </div>
                    <div className="text-muted-foreground">
                      @{data.user_a?.slice(0, 6)} & @{data.user_b?.slice(0, 6)} edited simultaneously
                    </div>
                    {data.lastAt && (
                      <div className="text-muted-foreground text-[10px] mt-1">
                        {new Date(data.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
