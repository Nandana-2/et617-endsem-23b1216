// src/ai.js
import { pickFromBank } from './bank.js';

export const AI_GENERATE_PROMPT_REFERENCE = `(See api/generate.js for full prompt)`;
export const AI_EVALUATE_PROMPT_REFERENCE = `(See api/evaluate.js for full prompt)`;

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export async function getNextQuestion({ skill, level, lastTag, askedIds = [] }) {
  try {
    const res = await fetchWithTimeout('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill, level, lastTag })
    });
    
    if (!res.ok) throw new Error('Generation failed or invalid');
    const question = await res.json();
    
    // Treat as invalid if the ID or prompt is already in askedIds
    if (askedIds.includes(question.id) || askedIds.includes(question.prompt)) {
      throw new Error('Duplicate question generated');
    }
    
    return question;
  } catch (err) {
    console.warn("AI generation failed, falling back to bank.", err);
    return { ...pickFromBank({ skill, level, askedIds }), source: "bank" };
  }
}

export async function evaluateExplanation({ question, learnerText }) {
  try {
    const res = await fetchWithTimeout('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: question.prompt,
        answer: question.answer,
        modelExplanation: question.modelExplanation,
        learnerText
      })
    });
    
    if (!res.ok) throw new Error('Evaluation failed');
    const evaluation = await res.json();
    return { ...evaluation, source: "ai" };
  } catch (err) {
    console.warn("AI evaluation failed, using keyword fallback.", err);
    return runFallbackEvaluation(learnerText);
  }
}

function runFallbackEvaluation(text) {
  const t = text.toLowerCase();
  if (t.includes('past') && (t.includes('result') || t.includes('now'))) {
    return { verdict: "good", tag: null, hint: "Great job connecting the past to the present.", source: "fallback" };
  } else if (t.includes('for') || t.includes('since')) {
    return { verdict: "partial", tag: "M2", hint: "Check if the action is still true now when using for/since.", source: "fallback" };
  } else if (t.includes('past') || t.includes('yesterday') || t.includes('ago')) {
    return { verdict: "partial", tag: "M1", hint: "Remember that specific finished times require the simple past.", source: "fallback" };
  }
  return { verdict: "poor", tag: null, hint: "Review the rules for finished actions versus visible present results.", source: "fallback" };
}