import { useEffect, useState } from 'react';

export function useAIClassification(noteId, text) {
  const [classification, setClassification] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    const cleanText = (text || '').trim();
    setClassification(null);

    if (!noteId || cleanText.length < 10) {
      setIsClassifying(false);
      return;
    }

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setIsClassifying(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsClassifying(true);
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 200,
            messages: [{
              role: 'user',
              content: `Classify this sticky note text into exactly one of these types: action_item, decision, open_question, reference.

Rules:
- action_item: someone needs to DO something (has a task, assignee, or deadline implied)
- decision: something was already decided or agreed upon
- open_question: a question that hasn't been answered yet
- reference: information, links, notes, or context with no action needed

Respond ONLY with valid JSON. No explanation. No markdown.

Format:
{"type": "action_item", "assignee": "name or null", "due": "deadline or null", "confidence": 0.95}

Text to classify: "${cleanText}"`
            }]
          }),
        });

        const data = await response.json();
        const result = JSON.parse(data?.content?.[0]?.text || '{}');
        if (result?.type) setClassification(result);
      } catch {
        // Silently ignore AI classification failures by design.
      } finally {
        setIsClassifying(false);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [noteId, text]);

  return { classification, isClassifying };
}

