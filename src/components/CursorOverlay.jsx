import React from 'react';

export default function CursorOverlay({ cursors }) {
  return (
    <>
      {cursors.map(c => (
        <div
          key={c.user_id}
          className="absolute z-20 pointer-events-none transition-all duration-150"
          style={{ left: c.x, top: c.y }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ transform: 'rotate(-15deg)' }}>
            <path d="M3 3L10.5 22L13.5 13.5L22 10.5L3 3Z" fill={c.color} stroke="white" strokeWidth="1.5" />
          </svg>
          <div className="ml-3 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap" style={{ backgroundColor: c.color }}>
            {c.username}
          </div>
        </div>
      ))}
    </>
  );
}
