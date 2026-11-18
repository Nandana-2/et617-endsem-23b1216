
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { decideNext } from './engine.js';
import {
  SESSION_SECONDS,
  loadSession,
  saveSession,
  clearSession,
  newSession,
} from './store.js';

import { getNextQuestion, evaluateExplanation } from './ai.js';

import Welcome from './components/Welcome.jsx';
import Task from './components/Task.jsx';
import Feedback from './components/Feedback.jsx';
import Lesson from './components/Lesson.jsx';
import Summary from './components/Summary.jsx';
import About from './components/About.jsx';
import Footer from './components/Footer.jsx';

/* -------------------------------------------------------
   ANSWER HELPERS
------------------------------------------------------- */

function normalise(text) {
  return String(text ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.!?,;:…“”‘’"'`]+$/u, '')
    .trim();
}

// Prompt normalisation intentionally does not remove punctuation.
function normalisePrompt(text) {
  return String(text ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function isPastVerb(word) {
  const value = normalise(word);

  return (
    /\b\w+ed\b/.test(value) ||
    /\b(went|saw|did|had|was|were|came|took|made|got|gave|wrote|ate|spoke|broke|chose|drove|knew|found|bought|brought|thought|left|felt|kept|lost|won|began|became|ran|said|told|sent|spent|built|heard|held|met|paid|read|slept|stood|understood|wore|cut|put|hit|set)\b/.test(
      value
    )
  );
}

function hasInvalidVerbForm(text) {
  const value = normalise(text);

  return (
    /\b(?:has|have)\s+(?:go|see|eat|write|take|give|speak|break|choose|drive|know|do|be|begin|come|run|drink|sing|swim|fall|forget|freeze|steal|throw|wear)\b/.test(
      value
    ) ||
    /\b(?:did)\s+(?:went|saw|ate|wrote|took|gave|spoke|broke|chose|drove|knew|found|bought|brought|thought|left|felt|kept|lost|won)\b/.test(
      value
    )
  );
}

function deriveErrorTag(question, answer) {
  const prompt = String(question?.prompt || '');
  const value = normalise(answer);

  const traps = question?.traps;

  if (traps) {
    if (Array.isArray(traps)) {
      const matchedTrap = traps.find((trap) => {
        if (typeof trap === 'string') {
          return normalise(trap) === value;
        }

        return (
          normalise(trap?.answer) === value ||
          normalise(trap?.value) === value
        );
      });

      if (matchedTrap) {
        return matchedTrap?.tag || 'form';
      }
    } else if (typeof traps === 'object') {
      for (const [trapAnswer, trapTag] of Object.entries(traps)) {
        if (normalise(trapAnswer) === value) {
          return typeof trapTag === 'string'
            ? trapTag
            : trapTag?.tag || 'form';
        }
      }
    }
  }

  if (/\b(for|since)\b/i.test(prompt) && isPastVerb(value)) {
    return 'M2';
  }

  const hasPastMarker =
    /\b(yesterday|ago|last)\b/i.test(prompt) ||
    /\bin\s+(?:19|20)\d{2}\b/i.test(prompt);

  const hasPerfectParticiple =
    /\b(?:has|have)\s+(?:\w+(?:ed|en)|been|gone|done|seen|written|eaten|taken|given|spoken|broken|chosen|driven|known|made|found|bought|brought|thought|left|felt|kept|lost|won)\b/i.test(
      value
    );

  if (hasPastMarker && hasPerfectParticiple) {
    return 'M1';
  }

  if (hasInvalidVerbForm(value)) {
    return 'form';
  }

  return 'marker';
}

/* -------------------------------------------------------
   DUPLICATE-QUESTION TRACKING
------------------------------------------------------- */

function uniqueValues(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function updateQuestionTracking(state, question, correct) {
  const questionId = question?.id;
  const prompt = normalisePrompt(question?.prompt);

  return {
    ...state,

    askedIds: uniqueValues([
      ...(state.askedIds ?? []),
      questionId,
    ]),

    askedPrompts: uniqueValues([
      ...(state.askedPrompts ?? []),
      prompt,
    ]),

    masteredIds: uniqueValues([
      ...(state.masteredIds ?? []),
      ...(correct && questionId ? [questionId] : []),
    ]),
  };
}

function mergeQuestionTracking(decisionState, trackedState) {
  return {
    ...decisionState,

    askedIds: uniqueValues([
      ...(trackedState.askedIds ?? []),
      ...(decisionState.askedIds ?? []),
    ]),

    askedPrompts: uniqueValues([
      ...(trackedState.askedPrompts ?? []),
      ...(decisionState.askedPrompts ?? []),
    ]),

    masteredIds: uniqueValues([
      ...(trackedState.masteredIds ?? []),
      ...(decisionState.masteredIds ?? []),
    ]),
  };
}

/* -------------------------------------------------------
   ANSWER GRADING
------------------------------------------------------- */

export function gradeAnswer(question, learnerAnswer) {
  try {
    const rawAnswer = learnerAnswer ?? '';
    let answer = rawAnswer;

    if (
      question?.format === 'mcq' &&
      typeof rawAnswer === 'number' &&
      Array.isArray(question.options)
    ) {
      answer = question.options[rawAnswer] ?? '';
    }

    if (
      question?.format === 'mcq' &&
      typeof rawAnswer === 'string' &&
      Array.isArray(question.options)
    ) {
      const numericIndex = Number(rawAnswer);

      if (
        rawAnswer.trim() !== '' &&
        Number.isInteger(numericIndex) &&
        numericIndex >= 0 &&
        numericIndex < question.options.length
      ) {
        answer = question.options[numericIndex];
      }
    }

    const learnerText = normalise(answer);

    const acceptedAnswers = [
      question?.answer,
      ...(Array.isArray(question?.acceptable)
        ? question.acceptable
        : question?.acceptable
          ? [question.acceptable]
          : []),
    ]
      .filter((item) => item !== undefined && item !== null)
      .map(normalise);

    const correct = acceptedAnswers.includes(learnerText);

    return {
      correct,
      tag: correct ? null : deriveErrorTag(question, learnerText),
      learnerAnswer: String(answer ?? ''),
      explanationQuality: null,
    };
  } catch (error) {
    console.error('Answer grading failed:', error);

    return {
      correct: false,
      tag: 'form',
      learnerAnswer: String(learnerAnswer ?? ''),
      explanationQuality: null,
    };
  }
}

/* -------------------------------------------------------
   SESSION STATE
------------------------------------------------------- */

function sessionReducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return action.session;

    case 'UPDATE_SESSION':
      return {
        ...state,
        ...action.updates,
      };

    case 'TICK':
      return {
        ...state,
        secondsLeft: Math.max(0, state.secondsLeft - 1),
      };

    default:
      return state;
  }
}

function getSkill(session) {
  const wrongByTag = session?.wrongByTag || {};
  const entries = Object.entries(wrongByTag);
  const highest = entries.sort((a, b) => b[1] - a[1])[0];

  if (!highest || highest[1] === 0) {
    return 'meaning';
  }

  if (highest[0] === 'M1' || highest[0] === 'M2') {
    return 'meaning';
  }

  if (highest[0] === 'form') {
    return 'form';
  }

  return 'marker';
}

function makeFallbackDecision(session, result, question, timeMs) {
  const tag = result?.tag || 'marker';

  const nextLogEntry = {
    qid: question?.id,
    format: question?.format,
    level: session?.level || 1,
    correct: Boolean(result?.correct),
    tag: result?.correct ? null : tag,
    rule: result?.correct ? 'CONTINUE' : 'ALTERNATIVE',
    timeMs,
  };

  const wrongByTag = {
    ...(session?.wrongByTag || {}),
  };

  if (!result?.correct) {
    wrongByTag[tag] = (wrongByTag[tag] || 0) + 1;
  }

  const newState = {
    ...session,
    wrongByTag,
    streakCorrect: result?.correct
      ? (session?.streakCorrect || 0) + 1
      : 0,
    log: [...(session?.log || []), nextLogEntry],
  };

  return {
    rule: 'CONTINUE',
    reason: 'The adaptive decision could not be completed. Continue with the current level.',
    nextLevel: session?.level || 1,
    newState,
  };
}

/* -------------------------------------------------------
   MAIN APP
------------------------------------------------------- */

export default function App() {
  const [savedSession] = useState(() => loadSession());

  const [session, dispatch] = useReducer(
    sessionReducer,
    savedSession || null
  );

  const [screen, setScreen] = useState('welcome');
  const [question, setQuestion] = useState(null);
  const [result, setResult] = useState(null);
  const [decision, setDecision] = useState(null);
  const [lessonId, setLessonId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const answerStartedAt = useRef(Date.now());
  const questionRequestId = useRef(0);

  /* -----------------------------------------------------
     SESSION SAVE
  ----------------------------------------------------- */

  useEffect(() => {
    if (session) {
      saveSession(session);
    }
  }, [session]);

  /* -----------------------------------------------------
     QUESTION LOADING
  ----------------------------------------------------- */

  const fetchQuestion = useCallback(
    async (currentSession, lastId = null) => {
      if (!currentSession) return;

      const requestId = ++questionRequestId.current;

      setLoading(true);
      setQuestion(null);
      setResult(null);
      setDecision(null);

      try {
        const skill = getSkill(currentSession);

        const nextQuestion = await getNextQuestion({
          skill,
          level: currentSession.level || 1,
          lastTag:
            currentSession.log?.[
              currentSession.log.length - 1
            ]?.tag || null,

          // Fallbacks keep older saved sessions compatible.
          askedIds: currentSession.askedIds ?? [],
          masteredIds: currentSession.masteredIds ?? [],
          askedPrompts: currentSession.askedPrompts ?? [],

          lastId,
        });

        if (requestId !== questionRequestId.current) {
          return;
        }

        if (!nextQuestion || !nextQuestion.id) {
          throw new Error('No valid question was returned.');
        }

        setQuestion(nextQuestion);
        answerStartedAt.current = Date.now();
        setScreen('task');
      } catch (error) {
        console.error('Question loading failed:', error);
        setScreen('summary');
      } finally {
        if (requestId === questionRequestId.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  /* -----------------------------------------------------
     START / RESUME / RESTART
  ----------------------------------------------------- */

  const startSession = useCallback(() => {
    clearSession();

    const freshSession = {
      ...newSession(),
      askedIds: [],
      askedPrompts: [],
      masteredIds: [],
    };

    dispatch({
      type: 'SET_SESSION',
      session: freshSession,
    });

    setResult(null);
    setDecision(null);
    setLessonId(null);

    fetchQuestion(freshSession);
  }, [fetchQuestion]);

  const resumeSession = useCallback(() => {
    const existingSession = loadSession();

    if (!existingSession) {
      startSession();
      return;
    }

    const compatibleSession = {
      ...existingSession,
      askedIds: existingSession.askedIds ?? [],
      askedPrompts: existingSession.askedPrompts ?? [],
      masteredIds: existingSession.masteredIds ?? [],
    };

    dispatch({
      type: 'SET_SESSION',
      session: compatibleSession,
    });

    const lastId =
      compatibleSession.log?.[
        compatibleSession.log.length - 1
      ]?.qid ?? null;

    fetchQuestion(compatibleSession, lastId);
  }, [fetchQuestion, startSession]);

  const restartSession = useCallback(() => {
    startSession();
  }, [startSession]);

  /* -----------------------------------------------------
     TIMER
  ----------------------------------------------------- */

  useEffect(() => {
    if (
      !session ||
      screen === 'welcome' ||
      screen === 'summary' ||
      session.secondsLeft <= 0
    ) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [session, screen]);

  useEffect(() => {
    if (session?.secondsLeft === 0 && screen !== 'summary') {
      setScreen('summary');
    }
  }, [session?.secondsLeft, screen]);

  /* -----------------------------------------------------
     SUBMIT ANSWER
  ----------------------------------------------------- */

  const submitAnswer = useCallback(
    async (learnerAnswer) => {
      if (!question || !session || loading) {
        return;
      }

      const timeMs = Math.max(
        0,
        Date.now() - answerStartedAt.current
      );

      const graded = gradeAnswer(question, learnerAnswer);

      let finalResult = {
        ...graded,
        qid: question.id,
      };

      if (question.format === 'explain') {
        try {
          const explanationResult = await evaluateExplanation({
            question,
            learnerText: String(learnerAnswer ?? ''),
          });

          finalResult = {
            ...finalResult,
            explanationQuality:
              explanationResult?.explanationQuality ??
              explanationResult?.quality ??
              explanationResult?.score ??
              null,
          };
        } catch (error) {
          console.error('Explanation evaluation failed:', error);
        }
      }

      setResult(finalResult);

      // Update all duplicate-question tracking in one place.
      // This tracked state is the state we save and pass to the engine.
      const trackedSession = updateQuestionTracking(
        session,
        question,
        finalResult.correct
      );

      // The first two tasks are diagnostic tasks.
      // They do not affect adaptive decisions, but still belong in the
      // learner's session history and summary.
      if ((session.taskIndex || 0) < 2) {
        const diagnosticState = {
          ...trackedSession,
          log: [
            ...(trackedSession.log || []),
            {
              qid: question.id,
              format: question.format,
              level: question.level || session.level || 1,
              correct: Boolean(finalResult.correct),
              tag: finalResult.correct ? null : finalResult.tag,
              rule: 'DIAGNOSTIC',
              timeMs,
            },
          ],
        };

        dispatch({
          type: 'SET_SESSION',
          session: diagnosticState,
        });

        saveSession(diagnosticState);

        setDecision({
          rule: 'CONTINUE',
          reason: 'Diagnostic task completed.',
          nextLevel: diagnosticState.level || 1,
          newState: diagnosticState,
        });

        setScreen('feedback');
        return;
      }

      // Adaptive tasks: decideNext owns the single log entry.
      try {
        const adaptiveDecision = decideNext(trackedSession, {
          ...finalResult,
          timeMs,
          format: question.format,
          level: session.level,
        });

        const validDecision =
          adaptiveDecision &&
          adaptiveDecision.newState &&
          ['HARDER', 'ALTERNATIVE', 'PREREQUISITE', 'CONTINUE'].includes(
            adaptiveDecision.rule
          );

        if (!validDecision) {
          throw new Error('Invalid decision returned by decideNext().');
        }

        // Preserve the tracking arrays even if the engine returns
        // a new state that does not include the new fields.
        const updatedState = mergeQuestionTracking(
          adaptiveDecision.newState,
          trackedSession
        );

        const finalDecision = {
          ...adaptiveDecision,
          newState: updatedState,
        };

        dispatch({
          type: 'SET_SESSION',
          session: updatedState,
        });

        saveSession(updatedState);

        setDecision(finalDecision);
        setScreen('feedback');
      } catch (error) {
        console.error('Adaptive decision failed:', error);

        const fallbackDecision = makeFallbackDecision(
          trackedSession,
          finalResult,
          question,
          timeMs
        );

        dispatch({
          type: 'SET_SESSION',
          session: fallbackDecision.newState,
        });

        saveSession(fallbackDecision.newState);

        setDecision(fallbackDecision);
        setScreen('feedback');
      }
    },
    [question, session, loading]
  );

  /* -----------------------------------------------------
     NEXT QUESTION
  ----------------------------------------------------- */

  const goNext = useCallback(() => {
    if (!session) return;

    const nextTaskIndex = (session.taskIndex || 0) + 1;

    if (nextTaskIndex >= 8 || session.secondsLeft <= 0) {
      setScreen('summary');
      return;
    }

    const nextSession = {
      ...session,
      taskIndex: nextTaskIndex,
    };

    dispatch({
      type: 'SET_SESSION',
      session: nextSession,
    });

    saveSession(nextSession);

    // Pass the question just answered as lastId.
    // fetchQuestion receives the latest tracking state.
    fetchQuestion(nextSession, question?.id ?? null);
  }, [session, question, fetchQuestion]);

  /* -----------------------------------------------------
     LESSON FLOW
  ----------------------------------------------------- */

  const handleLessonDone = useCallback(() => {
    if (!question) {
      goNext();
      return;
    }

    // Retry the SAME question object.
    // Do not call fetchQuestion() or increment taskIndex.
    setResult(null);
    setDecision(null);
    answerStartedAt.current = Date.now();
    setScreen('task');
  }, [question, goNext]);

  /* -----------------------------------------------------
     FEEDBACK NEXT / RETRY
  ----------------------------------------------------- */

  const handleFeedbackNext = useCallback(() => {
    if (
      decision?.rule === 'ALTERNATIVE' ||
      decision?.rule === 'PREREQUISITE'
    ) {
      setLessonId(decision.lessonId || null);
      setScreen('lesson');
      return;
    }

    goNext();
  }, [decision, goNext]);

  const handleRetry = useCallback(() => {
    setResult(null);
    setDecision(null);
    answerStartedAt.current = Date.now();
    setScreen('task');
  }, []);

  /* -----------------------------------------------------
     ABOUT
  ----------------------------------------------------- */

  if (showAbout) {
    return (
      <>
        <About />

        <button
          type="button"
          onClick={() => setShowAbout(false)}
        >
          Back
        </button>

        <Footer />
      </>
    );
  }

  /* -----------------------------------------------------
     WELCOME SCREEN
  ----------------------------------------------------- */

  if (screen === 'welcome') {
    return (
      <>
        <Welcome
          saved={Boolean(savedSession)}
          onStart={startSession}
          onResume={resumeSession}
          onAbout={() => setShowAbout(true)}
        />

        <Footer />
      </>
    );
  }

  /* -----------------------------------------------------
     LOADING SCREEN
  ----------------------------------------------------- */

  if (loading || (!question && screen === 'task')) {
    return (
      <>
        <main className="app-main">
          <p>Preparing your next question...</p>
        </main>

        <Footer />
      </>
    );
  }

  /* -----------------------------------------------------
     TASK SCREEN
  ----------------------------------------------------- */

  if (screen === 'task') {
    return (
      <>
        <Task
          question={question}
          secondsLeft={session?.secondsLeft ?? SESSION_SECONDS}
          taskIndex={session?.taskIndex ?? 0}
          onSubmit={submitAnswer}
        />

        <Footer />
      </>
    );
  }

  /* -----------------------------------------------------
     FEEDBACK SCREEN
  ----------------------------------------------------- */

  if (screen === 'feedback') {
    if (!question || !result || !decision) {
      return (
        <>
          <main className="app-main">
            <p>Preparing feedback...</p>

            <button type="button" onClick={goNext}>
              Continue
            </button>
          </main>

          <Footer />
        </>
      );
    }

    return (
      <>
        <Feedback
          question={question}
          result={result}
          decision={decision}
          onNext={handleFeedbackNext}
          onRetry={handleRetry}
        />

        <Footer />
      </>
    );
  }

  /* -----------------------------------------------------
     LESSON SCREEN
  ----------------------------------------------------- */

  if (screen === 'lesson') {
    return (
      <>
        <Lesson
          lessonId={lessonId}
          onDone={handleLessonDone}
        />

        <Footer />
      </>
    );
  }

  /* -----------------------------------------------------
     SUMMARY SCREEN
  ----------------------------------------------------- */

  if (screen === 'summary') {
    return (
      <>
        <Summary
          state={session}
          onRestart={restartSession}
        />

        <Footer />
      </>
    );
  }

  /* -----------------------------------------------------
     FALLBACK
  ----------------------------------------------------- */

  return (
    <>
      <main className="app-main">
        <p>Something went wrong. Please restart the session.</p>

        <button type="button" onClick={restartSession}>
          Restart
        </button>
      </main>

      <Footer />
    </>
  );
}
