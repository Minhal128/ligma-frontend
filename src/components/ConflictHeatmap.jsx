import React, { useState } from 'react';

export default function ConflictHeatmap({ conflicts, visible }) {
  const [hovered, setHovered] = useState(null);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {Array.from(conflicts.entries()).map(([nodeId, data]) => {
        if (!data.count) return null;
        const intensity = data.count >= 6 ? 'high' : data.count >= 3 ? 'medium' : 'low';
        const size = intensity === 'high' ? 56 : intensity === 'medium' ? 44 : 32;
        const opacity = intensity === 'high' ? 0.5 : intensity === 'medium' ? 0.35 : 0.2;
        const thickness = intensity === 'high' ? 4 : intensity === 'medium' ? 3 : 2;
        const animClass = intensity === 'high' ? 'fast-pulse' : 'pulse-ring';

        return (
          <div
            key={nodeId}
            className="absolute"
            style={{
              left: 200 + (Math.abs(hashCode(nodeId)) % 600),
              top: 100 + (Math.abs(hashCode(nodeId + 'salt')) % 400),
            }}
            onMouseEnter={() => setHovered(nodeId)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className={`rounded-full ${animClass}`}
              style={{
                width: size,
                height: size,
                border: `${thickness}px solid rgba(233, 69, 96, ${opacity})`,
                boxShadow: `0 0 12px rgba(233, 69, 96, ${opacity * 0.6})`,
                marginLeft: -size / 2,
                marginTop: -size / 2,
              }}
            />
            {hovered === nodeId && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-ligma-panel border border-ligma-accent/40 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap z-30 shadow-xl pointer-events-auto">
                <div className="font-semibold text-ligma-accent">{data.count} conflicts resolved here</div>
                <div className="text-gray-400 mt-0.5">@{data.user_a?.slice(0, 6)} & @{data.user_b?.slice(0, 6)} edited simultaneously</div>
                <div className="text-gray-500 text-[10px]">{data.lastAt ? new Date(data.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
              </div>
            )}
          </div>
        );
      })}
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
