
export const BANK = [
  // ==========================================
  // LEVEL 1 — FOUNDATION
  // ==========================================

  {
    id: "q01",
    format: "mcq",
    level: 1,
    skill: "marker",
    prompt: "Let's look at this sentence: 'I ___ my homework yesterday.' Which option fits best?",
    options: [
      "have completed",
      "completed",
      "has completed",
      "completing"
    ],
    answer: "completed",
    traps: {
      "have completed": "M1",
      "has completed": "form"
    },
    modelExplanation: "We use the simple past with a finished time such as 'yesterday'. The action happened at a specific time in the past.",
    feedback: {
      correct: "Great! You recognised that 'yesterday' points to a finished past time.",
      M1: "You chose the present perfect even though the sentence gives a finished past time. Look carefully at the time marker.",
      M2: "Your choice suggests you may be mixing up duration and finished past time. Check whether the sentence tells us when the action happened.",
      other: "Check the time expression and the verb form. Is the sentence about a finished past event?"
    },
    source: "bank"
  },

  {
    id: "q03",
    format: "mcq",
    level: 1,
    skill: "meaning",
    prompt: "Let's compare these sentences. Which one tells us that someone started living in Mumbai five years ago and still lives there?",
    options: [
      "I lived in Mumbai for five years.",
      "I have lived in Mumbai for five years.",
      "I live in Mumbai for five years.",
      "I had lived in Mumbai for five years."
    ],
    answer: "I have lived in Mumbai for five years.",
    traps: {
      "I lived in Mumbai for five years.": "M2",
      "I had lived in Mumbai for five years.": "form"
    },
    modelExplanation: "The present perfect connects a past starting point with the present. 'For five years' tells us the duration, and the person still lives there.",
    feedback: {
      correct: "Exactly! You understood that the situation began in the past and continues now.",
      M1: "You seem to be treating a continuing situation as a completed past event. Ask yourself whether the person still lives there.",
      M2: "You chose the simple past for a duration that continues into the present. Check the connection between past and present.",
      other: "Think about whether the person still lives in Mumbai. The verb tense should match that meaning."
    },
    source: "bank"
  },

  {
    id: "q04",
    format: "explain",
    level: 1,
    skill: "meaning",
    prompt: "Let's look at this sentence: 'I have lost my library card.' Why might the speaker use the present perfect instead of the simple past?",
    answer: "The speaker has lost the card and the result matters now. The card is still missing.",
    modelExplanation: "The present perfect connects a past action to a present result. The important point is that the card is missing now.",
    feedback: {
      correct: "Good thinking! You connected the past action with its present result.",
      M1: "You are focusing only on when the action happened. Think about what is true right now because of that action.",
      M2: "You seem to be confusing a continuing duration with a present result. Look at what has changed in the present.",
      other: "Try explaining what is happening now as a result of losing the card. That is the key idea."
    },
    source: "bank"
  },

  // ==========================================
  // LEVEL 2 — APPLICATION
  // ==========================================

  {
    id: "q05",
    format: "mcq",
    level: 2,
    skill: "marker",
    prompt: "Let's look at the time expressions. Choose the correct sentence.",
    options: [
      "She has visited Jaipur last month.",
      "She visited Jaipur last month.",
      "She has visit Jaipur last month.",
      "She have visited Jaipur last month."
    ],
    answer: "She visited Jaipur last month.",
    traps: {
      "She has visited Jaipur last month.": "M1",
      "She has visit Jaipur last month.": "form",
      "She have visited Jaipur last month.": "form"
    },
    modelExplanation: "'Last month' is a finished time in the past, so we use the simple past. The correct past form of 'visit' is 'visited'.",
    feedback: {
      correct: "Nicely done! You matched the tense to the finished time expression.",
      M1: "You selected the present perfect with a finished past-time marker. Check whether the time period is over.",
      M2: "You may be mixing up duration expressions and finished past-time expressions. Look at the word 'last'.",
      other: "Check both the time expression and the verb structure. A sentence needs the right tense and verb form."
    },
    source: "bank"
  },

  {
    id: "q07",
    format: "mcq",
    level: 2,
    skill: "meaning",
    prompt: "Let's compare the meanings. Which sentence says that Aarav finished reading the book, and that this information matters now?",
    options: [
      "Aarav read the book yesterday.",
      "Aarav has read the book.",
      "Aarav reads the book.",
      "Aarav was reading the book."
    ],
    answer: "Aarav has read the book.",
    traps: {
      "Aarav read the book yesterday.": "M1",
      "Aarav reads the book.": "form"
    },
    modelExplanation: "The present perfect tells us that Aarav has completed the action, and the result is relevant now. No finished past time is specified.",
    feedback: {
      correct: "That's right! You noticed the connection between the completed action and its present importance.",
      M1: "You chose a sentence that places the action at a specific finished time. Think about whether the speaker needs to mention when it happened.",
      M2: "You seem to be treating a completed action as a continuing situation. Focus on the result.",
      other: "Think about whether the sentence describes a habit, an ongoing action, or a completed action with present relevance."
    },
    source: "bank"
  },

  {
    id: "q08",
    format: "transform",
    level: 2,
    skill: "form",
    prompt: "Let's transform this sentence into the present perfect without changing its basic meaning: 'Meera finishes her science project.'",
    answer: "Meera has finished her science project.",
    acceptable: ["Meera has finished her science project."],
    modelExplanation: "Change 'finishes' to 'has finished'. Present perfect follows the structure has/have + past participle.",
    feedback: {
      correct: "Great transformation! You changed the verb structure while keeping the subject and meaning.",
      M1: "You seem to have changed the sentence into a finished past event rather than the requested present-perfect form.",
      M2: "You may be thinking about a continuing duration instead of transforming the verb structure. Focus on the requested tense.",
      other: "Check the structure: subject + has/have + past participle. Make sure the subject and meaning stay unchanged."
    },
    source: "bank"
  },

  {
    id: "q09",
    format: "mcq",
    level: 2,
    skill: "marker",
    prompt: "Let's check two common traps. Choose the sentence that is grammatically correct.",
    options: [
      "I have known her since 2020.",
      "I knew her since 2020.",
      "I have knew her since 2020.",
      "I know her since 2020."
    ],
    answer: "I have known her since 2020.",
    traps: {
      "I knew her since 2020.": "M2",
      "I have knew her since 2020.": "form",
      "I know her since 2020.": "M2"
    },
    modelExplanation: "'Since 2020' gives the starting point of a situation that continues now. Present perfect uses 'have known'.",
    feedback: {
      correct: "Well spotted! You recognised the continuing situation and used the correct participle.",
      M1: "You seem to be treating a situation that continues now as a completed past event. Check what 'since' tells us.",
      M2: "You used the simple present or simple past for a situation continuing from a past starting point. Think about the link to the present.",
      other: "Pay attention to both the tense and the participle. 'Know' has an irregular past participle."
    },
    source: "bank"
  },

  {
    id: "q10",
    format: "explain",
    level: 2,
    skill: "meaning",
    prompt: "Let's think about these sentences: (A) 'I finished my homework.' (B) 'I have finished my homework.' Explain one difference in their meaning or focus.",
    answer: "Sentence A presents the action as a completed past event. Sentence B connects the completed action to the present, such as the homework being done now.",
    modelExplanation: "Simple past reports a completed past event. Present perfect connects a past action with the present. Neither sentence automatically tells us the exact time.",
    feedback: {
      correct: "Good comparison! You understood that the difference is about the time perspective and connection to the present.",
      M1: "You seem to think that every completed action needs the present perfect. Consider whether the speaker is reporting a past event or highlighting its present relevance.",
      M2: "You are mixing up a continuing duration with the result of a completed action. Think about what the second sentence emphasises.",
      other: "Try comparing the speaker's focus in each sentence. Does the speaker report a past event or connect it to the present?"
    },
    source: "bank"
  },

  // ==========================================
  // LEVEL 3 — OLYMPIAD CHALLENGE
  // ==========================================

  {
    id: "q11",
    format: "mcq",
    level: 3,
    skill: "meaning",
    prompt: "Let's look carefully: 'She ___ (visit) Jaipur.' Her photographs are displayed in the school exhibition, and she is describing that experience to her classmates. Choose the best form.",
    options: [
      "visited",
      "has visited",
      "have visited",
      "was visit"
    ],
    answer: "has visited",
    traps: {
      "visited": "M1",
      "have visited": "form",
      "was visit": "form"
    },
    modelExplanation: "The sentence highlights an experience that is relevant now. There is no specific finished past time, so the present perfect is appropriate.",
    feedback: {
      correct: "Excellent! You used the context rather than searching only for a time marker.",
      M1: "You focused on the fact that the visit happened in the past but missed why the experience matters now.",
      M2: "You seem to be confusing a past experience with a continuing duration. Look at the context and its present relevance.",
      other: "Read the second sentence again. Think about the connection between the past experience and the present situation."
    },
    source: "bank"
  },

  {
    id: "q12",
    format: "correct",
    level: 3,
    skill: "form",
    prompt: "Let's test your understanding of irregular verbs. Complete the sentence: 'The scientist ___ (discover) a new species.' The discovery is now part of the school's science exhibition.",
    answer: "has discovered",
    acceptable: ["has discovered"],
    modelExplanation: "The discovery has present relevance because it is now part of the exhibition. Present perfect uses has + past participle. 'Discovered' is the past participle.",
    feedback: {
      correct: "Brilliant! You used the context and formed the present perfect correctly.",
      M1: "You focused only on the fact that the discovery happened in the past. Consider why it matters in the present.",
      M2: "You seem to be thinking about a continuing duration rather than a completed action with a present result.",
      other: "Check the subject and the participle. The subject is singular, so the helping verb must agree."
    },
    source: "bank"
  },

  {
    id: "q13",
    format: "transform",
    level: 3,
    skill: "marker",
    prompt: "Let's make this sentence express a continuing situation: 'The family lived in Chennai.' They moved there five years ago and still live there. Rewrite the sentence.",
    answer: "The family has lived in Chennai for five years.",
    acceptable: [
      "The family has lived in Chennai for five years.",
      "The family has lived in Chennai since five years ago."
    ],
    modelExplanation: "The family started living in Chennai in the past and still lives there. The present perfect connects the past starting point with the present. 'For five years' expresses the duration.",
    feedback: {
      correct: "Excellent! You understood the continuing situation and changed the tense to match it.",
      M1: "You treated the family's stay as a completed past event. But the second sentence tells us they still live there.",
      M2: "You kept the simple past even though the situation continues now. Look at the difference between a finished stay and a continuing one.",
      other: "Think about the timeline. The family started living there in the past, but the situation has not ended."
    },
    source: "bank"
  },

  {
    id: "q14",
    format: "mcq",
    level: 3,
    skill: "meaning",
    prompt: "Let's examine the context: 'The principal ___ (speak) to the students.' The students are now following the instructions given during the conversation. Which form best fits?",
    options: [
      "spoke",
      "has spoken",
      "have spoken",
      "was speaking"
    ],
    answer: "has spoken",
    traps: {
      "spoke": "M1",
      "have spoken": "form",
      "was speaking": "other"
    },
    modelExplanation: "The conversation is a completed action with a present result: the students are following the instructions. Present perfect highlights that connection.",
    feedback: {
      correct: "Great reasoning! You noticed the present result of the completed conversation.",
      M1: "You selected simple past because the conversation happened earlier. But the context highlights its effect on the students now.",
      M2: "You seem to be mixing up duration with present relevance. The key here is the result of the completed conversation.",
      other: "Look at what the students are doing now. Choose a tense that best communicates the connection with the earlier conversation."
    },
    source: "bank"
  },

  {
    id: "q15",
    format: "explain",
    level: 3,
    skill: "marker",
    prompt: "Let's examine this situation: 'Arjun worked at the library.' He joined five years ago and continues to work there. Explain why the sentence does not fully express the intended meaning.",
    answer: "The simple past makes the work sound like a completed past situation. Since Arjun still works there, the present perfect is needed to connect the past with the present.",
    modelExplanation: "Simple past normally presents the situation as finished. Present perfect can describe a situation that began in the past and continues now.",
    feedback: {
      correct: "Excellent explanation! You identified the mismatch between the tense and the continuing situation.",
      M1: "You seem to be focusing only on the earlier starting point. Remember to consider whether the situation is still true.",
      M2: "You have noticed the duration, but your explanation does not yet address why the simple past is unsuitable here.",
      other: "Think about what the simple past suggests and compare that with the information that Arjun still works there."
    },
    source: "bank"
  },

  {
    id: "q16",
    format: "transform",
    level: 3,
    skill: "form",
    prompt: "Let's try a final challenge. Rewrite the sentence in the simple past without changing the main event: 'The team has won the competition.' The competition took place last Saturday.",
    answer: "The team won the competition last Saturday.",
    acceptable: ["The team won the competition last Saturday."],
    modelExplanation: "The competition happened at a finished time in the past. We therefore use the simple past form 'won' rather than the present perfect.",
    feedback: {
      correct: "Fantastic! You recognised that a specific finished past time requires the simple past.",
      M1: "You kept the present perfect even though the new context gives a finished past time. Check whether the time period is over.",
      M2: "You seem to be confusing a continuing duration with a completed event at a specific time.",
      other: "Check the irregular past form of 'win' and make sure your new sentence follows the simple past."
    },
    source: "bank"
  }
];


// ==========================================
// QUESTION PICKER — ADAPTIVE SELECTION
// ==========================================

export function pickFromBank({
  skill,
  level,
  askedIds = [],
  askedPrompts = [],
  masteredIds = [],
  lastId = null
}) {
  const normalize = (value = "") => value.toLowerCase().trim().replace(/\s+/g, " ");
  const seenIds = new Set(askedIds);
  const seenPrompts = new Set(askedPrompts.map(normalize));

  // Never reuse a question within the current session. Mastery affects
  // adaptive decisions, but should not make the remaining pool repeat sooner.
  const pool = BANK.filter((q) =>
    !seenIds.has(q.id) && !seenPrompts.has(normalize(q.prompt))
  );

  if (!pool.length) return null;

  // Prefer both requested level and skill.
  let candidates = pool.filter(
    (q) => q.level === level && (!skill || q.skill === skill)
  );

  // If unavailable, prioritise the requested level.
  if (!candidates.length) {
    candidates = pool.filter(
      (q) => q.level === level
    );
  }

  // If the requested level is unavailable,
  // select the nearest available level.
  if (!candidates.length) {
    const gap = Math.min(
      ...pool.map((q) => Math.abs(q.level - level))
    );

    candidates = pool.filter(
      (q) => Math.abs(q.level - level) === gap
    );
  }

  // Return a random question from the final pool.
  return candidates[
    Math.floor(Math.random() * candidates.length)
  ];
}
