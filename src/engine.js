
const MAX_LEVEL = 3;

export function decideNext(state, result) {
  // Copy nested state to avoid mutating the original session.
  const newState = {
    ...state,
    wrongByTag: { ...state.wrongByTag },
    askedIds: [...state.askedIds],
    log: [...state.log],
  };

  let rule = "CONTINUE";
  let reason = "Let's try another question.";
  let lessonId;
  let nextLevel = state.level;

  const { correct, tag, explanationQuality } = result;

  if (correct && explanationQuality !== "poor") {
    // Build a streak only when the answer and explanation are acceptable.
    newState.streakCorrect += 1;

    if (newState.streakCorrect >= 2) {
      rule = "HARDER";
      nextLevel = Math.min(MAX_LEVEL, state.level + 1);
      newState.level = nextLevel;
      newState.streakCorrect = 0;

      reason =
        "You've answered two questions correctly in a row. Let's try a harder level!";
    } else {
      reason = "Correct! Keep going to build your streak.";
    }
  } else {
    // A wrong answer or a poor explanation breaks the streak.
    newState.streakCorrect = 0;

    if (!correct && tag) {
      newState.wrongByTag[tag] += 1;

      if (tag === "M1" || tag === "M2") {
        rule = "ALTERNATIVE";
        lessonId = "timeline";

        reason =
          tag === "M1"
            ? "You used simple past for an action with a present result. Let's revisit the timeline."
            : "You used simple past with a duration describing something still true. Let's revisit the timeline.";
      } else if (
        (tag === "form" || tag === "marker") &&
        newState.wrongByTag[tag] >= 2
      ) {
        rule = "PREREQUISITE";
        lessonId = tag === "form" ? "participles" : "markers";

        reason =
          tag === "form"
            ? "You've made mistakes with past participle forms more than once. Let's revise participles."
            : "You've made mistakes identifying tense markers more than once. Let's revise the markers.";
      } else if (tag === "form") {
        reason =
          "You made a mistake with the verb form. Let's practise past participles a little more.";
      } else if (tag === "marker") {
        reason =
          "You missed an important tense marker. Let's practise recognising these clues.";
      }
    } else if (correct && explanationQuality === "poor") {
      reason =
        "Your answer is correct, but your explanation needs more work. Let's practise the rule once more.";
    } else {
      reason = "Not quite. Let's try another question and review the rule.";
    }
  }

  // Append exactly one log entry for this attempt.
  newState.log.push({
    qid: result.qid,
    format: result.format,
    level: state.level,
    correct,
    tag: correct ? null : tag,
    rule,
    timeMs: result.timeMs,
  });

  return {
    rule,
    reason,
    nextLevel,
    ...(lessonId ? { lessonId } : {}),
    newState,
  };
}
