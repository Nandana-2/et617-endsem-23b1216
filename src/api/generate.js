// api/generate.js
export const GENERATE_PROMPT = `You are an expert English tutor for a Class 9 Olympiad learner.
Generate a grammar question testing Simple Past vs Present Perfect.
Target Skill: {{SKILL}}, Level: {{LEVEL}}, Last Learner Mistake Tag: {{LAST_TAG}}.
M1 = "past action + visible result => present perfect".
M2 = "for/since duration with simple past for something still true".
Ensure the output matches the required JSON schema perfectly. Set source to "ai".
Do not repeat or closely paraphrase these recent questions:
{{RECENT_PROMPTS}}`;

const schema = {
  type: "OBJECT",
  properties: {
    id: { type: "STRING" },
    format: { type: "STRING", enum: ["mcq", "correct", "explain", "transform"] },
    level: { type: "INTEGER" },
    skill: { type: "STRING", enum: ["marker", "form", "meaning"] },
    prompt: { type: "STRING" },
    options: { type: "ARRAY", items: { type: "STRING" } },
    answer: { type: "STRING" },
    acceptable: { type: "ARRAY", items: { type: "STRING" } },
    traps: { type: "OBJECT" },
    modelExplanation: { type: "STRING" },
    feedback: {
      type: "OBJECT",
      properties: {
        correct: { type: "STRING" },
        M1: { type: "STRING" },
        M2: { type: "STRING" },
        other: { type: "STRING" }
      },
      required: ["correct", "M1", "M2", "other"]
    },
    source: { type: "STRING" }
  },
  required: ["id", "format", "level", "skill", "prompt", "answer", "modelExplanation", "feedback", "source"]
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { skill, level, lastTag, recentPrompts = [] } = req.body;

  const promptText = GENERATE_PROMPT
    .replace('{{SKILL}}', skill)
    .replace('{{LEVEL}}', level)
    .replace('{{LAST_TAG}}', lastTag || 'none')
    .replace('{{RECENT_PROMPTS}}', recentPrompts.join('\n'));

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
    const question = JSON.parse(resultText);

    const pLower = question.prompt.toLowerCase();
    const aLower = question.answer.toLowerCase();
    
    const pastMarkers = ['yesterday', 'ago', 'last', 'when', 'in 19', 'in 20'];
    const perfectMarkers = ['already', 'yet', 'so far', 'ever', 'never', 'since', 'just'];
    
    const hasPast = pastMarkers.some(m => pLower.includes(m));
    const hasPerfect = perfectMarkers.some(m => pLower.includes(m));
    const isPerfectAnswer = aLower.includes('have') || aLower.includes('has') || aLower.includes("'ve") || aLower.includes("'s");

    if (hasPast && isPerfectAnswer) {
      return res.status(502).json({ error: "Validation failed: Past marker requires simple past" });
    }
    if (hasPerfect && !isPerfectAnswer) {
      return res.status(502).json({ error: "Validation failed: Perfect marker requires present perfect" });
    }

    res.status(200).json(question);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}