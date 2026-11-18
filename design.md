# DESIGN.md — ET 617 End-Sem | 23B1216
Card: P4 Adaptive tutor | T7 English tenses (simple past vs present perfect) | L6 Olympiad learner | C4 10-minute sessions

## Problem
Olympiad-level ESL learners can usually form both tenses but choose the wrong one
when time markers are implicit or when "finished vs still relevant" is subtle.
Routine fill-in-the-blank drills bore them and hide these errors.
The app gives short, adaptive, reasoning-heavy practice that targets the learner's own mistakes.

## Learning outcomes
1. Explain why a given sentence needs simple past or present perfect (finished time vs link to now).
2. Correct tense errors in sentences with misleading time markers.
3. Compare two sentences and predict how their meaning differs (e.g. "I lived in Pune" vs "I have lived in Pune").

## Persona
Aarav, 14, Class 9, preparing for an English Olympiad. Strong vocabulary, fast reader,
knows verb forms. Phone/laptop, ~10 minutes between study blocks. Motivated by rank and hard problems.
Misconceptions:
- M1: "Past action + any result = present perfect" -> "I have seen him yesterday"
- M2: "Duration with for/since can use simple past" -> "I lived here for 5 years" (still lives here)

## Question formats
1. Trap MCQ  2. Error correction (type the fixed sentence)  3. Explain-why (short text)
4. Sentence transformation / write your own

## Adaptive decision rule (after every answer)
- Correct + good explanation x2 in a row  -> HARDER (subtler markers, no cue words)
- Wrong, tagged M1 or M2                  -> ALTERNATIVE EXPLANATION (timeline view, new example), then retry
- Wrong 2x on form/participle or marker recognition -> PREREQUISITE mini-lesson (irregular participles / time-marker sort)

## C4 (10-minute sessions)
8 tasks, visible countdown, progress dots, auto-save to localStorage, "Resume where you left off".

## AI plan
Vercel serverless function: generates the next question and evaluates explanations.
Output checked against JSON schema + answer-key rules; falls back to the built-in bank if the call fails (labelled).