
import { test } from "node:test";
import assert from "node:assert/strict";
import { decideNext } from "./engine.js";

function makeState(overrides = {}) {
  return {
    startedAt: Date.now(),
    secondsLeft: 500,
    taskIndex: 2,
    level: 1,
    streakCorrect: 0,
    wrongByTag: {
      M1: 0,
      M2: 0,
      form: 0,
      marker: 0,
    },
    askedIds: [],
    log: [],
    ...overrides,
  };
}

// 1. HARDER: Two consecutive correct answers.
test("HARDER: increases level after two correct answers", () => {
  const state = makeState({ streakCorrect: 1 });

  const decision = decideNext(state, {
    qid: "q1",
    correct: true,
    tag: null,
  });

  assert.equal(decision.rule, "HARDER");
  assert.equal(decision.nextLevel, 2);
  assert.equal(decision.newState.level, 2);
  assert.equal(decision.newState.streakCorrect, 0);
});

// 2. ALTERNATIVE: M1 mistake triggers timeline lesson.
test("ALTERNATIVE: M1 mistake recommends timeline lesson", () => {
  const state = makeState({ streakCorrect: 1 });

  const decision = decideNext(state, {
    qid: "q2",
    correct: false,
    tag: "M1",
  });

  assert.equal(decision.rule, "ALTERNATIVE");
  assert.equal(decision.lessonId, "timeline");
  assert.equal(decision.newState.streakCorrect, 0);
  assert.equal(decision.newState.wrongByTag.M1, 1);
});

// 3. PREREQUISITE: Second form mistake triggers revision.
test("PREREQUISITE: repeated form mistakes recommend participles", () => {
  const state = makeState({
    wrongByTag: {
      M1: 0,
      M2: 0,
      form: 1,
      marker: 0,
    },
  });

  const decision = decideNext(state, {
    qid: "q3",
    correct: false,
    tag: "form",
  });

  assert.equal(decision.rule, "PREREQUISITE");
  assert.equal(decision.lessonId, "participles");
  assert.equal(decision.newState.wrongByTag.form, 2);
});

// 4. CONTINUE: First marker mistake does not trigger a lesson.
test("CONTINUE: first marker mistake allows another question", () => {
  const state = makeState();

  const decision = decideNext(state, {
    qid: "q4",
    correct: false,
    tag: "marker",
  });

  assert.equal(decision.rule, "CONTINUE");
  assert.equal(decision.lessonId, undefined);
  assert.equal(decision.newState.wrongByTag.marker, 1);
  assert.equal(decision.newState.streakCorrect, 0);
});

// Additional: Level must never exceed 3.
test("HARDER: level is capped at 3", () => {
  const state = makeState({
    level: 3,
    streakCorrect: 1,
  });

  const decision = decideNext(state, {
    qid: "q5",
    correct: true,
    tag: null,
  });

  assert.equal(decision.rule, "HARDER");
  assert.equal(decision.nextLevel, 3);
});

// Additional: Poor explanation does not build a streak.
test("Poor explanation does not count as a correct streak", () => {
  const state = makeState({
    streakCorrect: 1,
  });

  const decision = decideNext(state, {
    qid: "q6",
    correct: true,
    tag: null,
    explanationQuality: "poor",
  });

  assert.equal(decision.rule, "CONTINUE");
  assert.equal(decision.newState.streakCorrect, 0);
});

// Additional: Original state must remain unchanged.
test("decideNext does not mutate the original state", () => {
  const state = makeState({ streakCorrect: 1 });
  const originalStreak = state.streakCorrect;
  const originalLogLength = state.log.length;

  decideNext(state, {
    qid: "q7",
    correct: true,
    tag: null,
  });

  assert.equal(state.streakCorrect, originalStreak);
  assert.equal(state.log.length, originalLogLength);
});
