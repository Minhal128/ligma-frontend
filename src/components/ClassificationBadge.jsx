import React from 'react';

const typeMeta = {
  action_item: { icon: '✅', label: 'Task', classes: 'bg-green-200 text-black border-green-700' },
  decision: { icon: '🔵', label: 'Decision', classes: 'bg-blue-200 text-black border-blue-700' },
  open_question: { icon: '❓', label: 'Question', classes: 'bg-yellow-200 text-black border-yellow-700' },
  reference: { icon: '📎', label: 'Reference', classes: 'bg-zinc-200 text-black border-zinc-700' },
};

export default function ClassificationBadge({ classification, isClassifying }) {
  if (isClassifying) {
    return (
      <div className="pointer-events-none absolute bottom-[6px] right-[6px]">
        <div className="h-2.5 w-2.5 rounded-full border border-black bg-white animate-pulse" title="Classifying..." />
      </div>
    );
  }

  if (!classification?.type || !typeMeta[classification.type]) return null;
  const meta = typeMeta[classification.type];
  const tooltip =
    classification.type === 'action_item'
      ? `Assignee: ${classification.assignee || 'Unassigned'} | Due: ${classification.due || 'None'}`
      : `Confidence: ${classification.confidence ?? 'n/a'}`;

  return (
    <div
      title={tooltip}
      className={`pointer-events-none absolute bottom-[6px] right-[6px] rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide opacity-90 shadow-neo-sm ${meta.classes}`}
    >
      <span className="mr-1">{meta.icon}</span>
      <span>{meta.label}</span>
    </div>
  );
}

