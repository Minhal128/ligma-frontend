import { useEffect, useState } from 'react';

const OPENAI_API_KEY_PLACEHOLDER = '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';

export function useAIClassification(noteId, text, enabled = true) {
  const [classification, setClassification] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    const cleanText = (text || '').trim();
    setClassification(null);

    if (!enabled || !noteId || cleanText.length < 10) {
      setIsClassifying(false);
      return;
    }

    const openAiKey = import.meta.env.VITE_OPENAI_API_KEY || OPENAI_API_KEY_PLACEHOLDER;
    const hasOpenAI = openAiKey && openAiKey !== OPENAI_API_KEY_PLACEHOLDER;
    if (!hasOpenAI) {
      setIsClassifying(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsClassifying(true);
      try {
        const prompt = `Classify this sticky note text into exactly one of these types: action_item, decision, open_question, reference.

Rules:
- action_item: someone needs to DO something (has a task, assignee, or deadline implied)
- decision: something was already decided or agreed upon
- open_question: a question that hasn't been answered yet
- reference: information, links, notes, or context with no action needed

Respond ONLY with valid JSON. No explanation. No markdown.

Format:
{"type": "action_item", "assignee": "name or null", "due": "deadline or null", "confidence": 0.95}

Text to classify: "${cleanText}"`;

        let result = null;

        if (hasOpenAI) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openAiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              response_format: { type: 'json_object' },
              messages: [{ role: 'user', content: prompt }],
            }),
          });
          const data = await response.json();
          result = JSON.parse(data?.choices?.[0]?.message?.content || '{}');
        }

        if (result?.type) setClassification(result);
      } catch {
        // Silently ignore AI classification failures by design.
      } finally {
        setIsClassifying(false);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [noteId, text, enabled]);

  return { classification, isClassifying };
}

