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

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  return Math.abs(hash).toString(36);
};

export async function getNextQuestion({ skill, level, lastTag, askedIds = [], masteredIds = [], askedPrompts = [], lastId = null }) {
  try {
    const recentPrompts = askedPrompts.slice(-5);
    const res = await fetchWithTimeout('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill, level, lastTag, recentPrompts })
    });
    
    if (!res.ok) throw new Error('Generation failed or invalid');
    const question = await res.json();
    
    const normalizedPrompt = question.prompt.toLowerCase().trim().replace(/\s+/g, ' ');
    const newId = "ai-" + hashString(normalizedPrompt);

    const isDuplicatePrompt = askedPrompts.some(p => p.toLowerCase().trim().replace(/\s+/g, ' ') === normalizedPrompt);
    if (askedIds.includes(question.id) || askedIds.includes(newId) || isDuplicatePrompt) {
      throw new Error('Duplicate question generated');
    }
    
    question.id = newId;
    return question;
  } catch (err) {
    console.warn("AI generation failed, falling back to bank.", err);
    const bankQuestion = pickFromBank({
      skill,
      level,
      askedIds,
      askedPrompts,
      masteredIds,
      lastId,
    });
    if (!bankQuestion) {
      throw new Error('No unseen questions remain in the question bank.');
    }
    return { ...bankQuestion, source: "bank" };
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
