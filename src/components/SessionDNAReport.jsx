import React, { useState } from 'react';
import { FileText, X, Download, Copy, Loader2 } from 'lucide-react';

const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return `${window.location.origin}/api`;
  return 'http://localhost:4000/api';
})();

export default function SessionDNAReport({ roomId, token }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/session-report/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReport(data);
      setOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toMarkdown = () => {
    if (!report) return '';
    return `# Session DNA Report

**Date:** ${new Date().toLocaleDateString()}  
**Duration:** ${report.sessionDuration || 'N/A'}  
**Participants:** ${(report.participants || []).length}

## Stats
- Total edits: ${report.totalEvents || 0}
- Tasks created: ${report.actionItems?.length || 0}
- Decisions made: ${(report.decisions || []).length}
- Conflicts resolved: ${(report.conflictNodes || []).length}

## Executive Summary
${report.executiveSummary || 'No summary.'}

## Key Decisions
${(report.keyDecisions || []).map(d => `- ${d}`).join('\n') || 'None'}

## Action Items
${(report.assignedTasks || []).map(t => `- [ ] ${t.task} (suggested: ${t.suggestedOwner || '?'})`).join('\n') || 'None'}

## Open Questions
${(report.openQuestions || []).map(q => `- ${q}`).join('\n') || 'None'}

## Collaboration Score
${report.collaborationScore || 0}/100

## Risk Flags
${(report.riskFlags || []).map(f => `- ⚠ ${f}`).join('\n') || 'None'}
`;
  };

  const downloadMarkdown = () => {
    const blob = new Blob([toMarkdown()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'session-report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyReport = () => {
    navigator.clipboard.writeText(toMarkdown());
  };

  return (
    <>
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border bg-ligma-panel border-ligma-deepblue/40 text-gray-300 hover:text-white transition"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        DNA Report
      </button>

      {open && report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-ligma-panel border border-ligma-deepblue/30 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-ligma-deepblue/20 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Session DNA Report</h2>
                <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString()} · {report.sessionDuration || 'N/A'} · {(report.participants || []).length} participants</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-3">
                <Stat label="Edits" value={report.totalEvents || 0} />
                <Stat label="Tasks" value={report.actionItems?.length || 0} />
                <Stat label="Decisions" value={(report.decisions || []).length} />
                <Stat label="Conflicts" value={(report.conflictNodes || []).length} />
              </div>

              {/* Executive Summary */}
              <Section title="Executive Summary">
                <p className="text-sm text-gray-300 leading-relaxed">{report.executiveSummary || 'No summary available.'}</p>
              </Section>

              {/* Key Decisions */}
              <Section title="Key Decisions">
                <ul className="space-y-1">
                  {(report.keyDecisions || []).map((d, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-ligma-accent mt-0.5">•</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Action Items */}
              <Section title="Action Items">
                <div className="space-y-2">
                  {(report.assignedTasks || []).map((t, i) => (
                    <div key={i} className="flex items-center justify-between bg-ligma-bg rounded-lg px-3 py-2 border border-ligma-deepblue/20">
                      <span className="text-sm text-white">{t.task}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-ligma-deepblue text-gray-300">{t.suggestedOwner || '?'}</span>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Open Questions */}
              <Section title="Open Questions">
                <ul className="space-y-1">
                  {(report.openQuestions || []).map((q, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">?</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Collaboration Score */}
              <Section title="Collaboration Score">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1a1a2e" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e94560" strokeWidth="3" strokeDasharray={`${report.collaborationScore || 0}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{report.collaborationScore || 0}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {report.collaborationScore >= 80 ? 'Excellent collaboration' : report.collaborationScore >= 50 ? 'Moderate collaboration' : 'Low collaboration'}
                  </div>
                </div>
              </Section>

              {/* Risk Flags */}
              {(report.riskFlags || []).length > 0 && (
                <Section title="Risk Flags">
                  <div className="flex flex-wrap gap-2">
                    {report.riskFlags.map((f, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">⚠ {f}</span>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            <div className="p-4 border-t border-ligma-deepblue/20 flex gap-2">
              <button onClick={downloadMarkdown} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ligma-deepblue text-white text-sm hover:bg-ligma-deepblue/80 transition">
                <Download size={14} /> Download Markdown
              </button>
              <button onClick={copyReport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ligma-bg border border-ligma-deepblue/30 text-gray-300 text-sm hover:text-white transition">
                <Copy size={14} /> Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-ligma-bg border border-ligma-deepblue/20 rounded-lg p-3 text-center">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
