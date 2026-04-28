import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Download, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={generate}
          disabled={loading}
          variant="secondary"
          size="sm"
          className="gap-2 glass-panel"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          DNA Report
        </Button>
      </motion.div>

      <AnimatePresence>
        {open && report && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh]"
            >
              <Card className="glass-panel shadow-2xl border-primary/30">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl gradient-text">Session DNA Report</CardTitle>
                      <CardDescription className="mt-2">
                        {new Date().toLocaleDateString()} · {report.sessionDuration || 'N/A'} · {(report.participants || []).length} participants
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                      <X size={20} />
                    </Button>
                  </div>
                </CardHeader>

                <ScrollArea className="max-h-[calc(90vh-200px)]">
                  <CardContent className="p-6 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4">
                      <StatCard label="Edits" value={report.totalEvents || 0} />
                      <StatCard label="Tasks" value={report.actionItems?.length || 0} />
                      <StatCard label="Decisions" value={(report.decisions || []).length} />
                      <StatCard label="Conflicts" value={(report.conflictNodes || []).length} />
                    </div>

                    <Separator />

                    {/* Executive Summary */}
                    <Section title="Executive Summary">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {report.executiveSummary || 'No summary available.'}
                      </p>
                    </Section>

                    {/* Key Decisions */}
                    <Section title="Key Decisions">
                      <div className="space-y-2">
                        {(report.keyDecisions || []).map((d, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-primary mt-0.5">•</span>
                            <span>{d}</span>
                          </motion.div>
                        ))}
                      </div>
                    </Section>

                    {/* Action Items */}
                    <Section title="Action Items">
                      <div className="space-y-2">
                        {(report.assignedTasks || []).map((t, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Card className="glass-panel">
                              <CardContent className="p-3 flex items-center justify-between">
                                <span className="text-sm">{t.task}</span>
                                <Badge variant="secondary">{t.suggestedOwner || '?'}</Badge>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </Section>

                    {/* Open Questions */}
                    <Section title="Open Questions">
                      <div className="space-y-2">
                        {(report.openQuestions || []).map((q, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-yellow-400 mt-0.5">?</span>
                            <span>{q}</span>
                          </motion.div>
                        ))}
                      </div>
                    </Section>

                    {/* Collaboration Score */}
                    <Section title="Collaboration Score">
                      <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24">
                          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                            <circle
                              cx="18"
                              cy="18"
                              r="15.9155"
                              fill="none"
                              stroke="hsl(var(--primary))"
                              strokeWidth="3"
                              strokeDasharray={`${report.collaborationScore || 0}, 100`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold gradient-text">{report.collaborationScore || 0}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {report.collaborationScore >= 80 ? 'Excellent collaboration' : report.collaborationScore >= 50 ? 'Moderate collaboration' : 'Low collaboration'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Based on team interaction patterns
                          </p>
                        </div>
                      </div>
                    </Section>

                    {/* Risk Flags */}
                    {(report.riskFlags || []).length > 0 && (
                      <Section title="Risk Flags">
                        <div className="flex flex-wrap gap-2">
                          {report.riskFlags.map((f, i) => (
                            <Badge key={i} variant="destructive" className="gap-1">
                              ⚠ {f}
                            </Badge>
                          ))}
                        </div>
                      </Section>
                    )}
                  </CardContent>
                </ScrollArea>

                <div className="p-4 border-t border-border/50 flex gap-2">
                  <Button onClick={downloadMarkdown} className="gap-2">
                    <Download size={16} /> Download Markdown
                  </Button>
                  <Button onClick={copyReport} variant="outline" className="gap-2">
                    <Copy size={16} /> Copy
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card className="glass-panel text-center">
      <CardContent className="p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="text-3xl font-bold gradient-text"
        >
          {value}
        </motion.div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2">{label}</p>
      </CardContent>
    </Card>
  );
}
