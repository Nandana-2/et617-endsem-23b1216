// api/evaluate.js
export const EVALUATE_PROMPT = `Evaluate the learner's explanation for a Class 9 Olympiad grammar question.
Question Prompt: {{PROMPT}}
Correct Answer: {{ANSWER}}
Model Explanation: {{MODEL_EXPLANATION}}
Learner's Explanation: {{LEARNER_TEXT}}

Analyze the learner's text. Return JSON with:
1. "verdict": "good", "partial", or "poor"
2. "tag": "M1", "M2", or null (M1="past action+visible result", M2="for/since duration with simple past for something still true")
3. "hint": A brief, helpful hint for the learner. The hint MUST NOT contain the correct answer itself.`;

const schema = {
  type: "OBJECT",
  properties: {
    verdict: { type: "STRING", enum: ["good", "partial", "poor"] },
    tag: { type: "STRING" }, 
    hint: { type: "STRING" }
  },
  required: ["verdict", "hint"]
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { prompt, answer, modelExplanation, learnerText } = req.body;

  const promptText = EVALUATE_PROMPT
    .replace('{{PROMPT}}', prompt)
    .replace('{{ANSWER}}', answer)
    .replace('{{MODEL_EXPLANATION}}', modelExplanation)
    .replace('{{LEARNER_TEXT}}', learnerText);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      })
    });

    if (!response.ok) throw new Error('Gemini API Error');
    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    const evaluation = JSON.parse(resultText);

    if (evaluation.hint.toLowerCase().includes(answer.toLowerCase())) {
      return res.status(502).json({ error: "Validation failed: Hint contains the model answer" });
    }

    res.status(200).json(evaluation);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}