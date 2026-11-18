
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

// --------------------------------------------------
// Answer normalisation and grading
// --------------------------------------------------

function normalise(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?,;:…]+$/u, '')
    .replace(/[“”‘’"'`]+$/u, '')
    .trim();
}

function isPastVerb(word) {
  const irregularPast = new Set([
    'was', 'were', 'went', 'saw', 'did', 'had', 'made',
    'took', 'gave', 'came', 'ate', 'wrote', 'spoke',
    'broke', 'chose', 'drove', 'ran', 'bought', 'brought',
    'thought', 'found', 'left', 'felt', 'kept', 'knew',
    'read', 'slept', 'stood', 'told', 'heard', 'lost',
    'met', 'paid', 'sent', 'sat', 'won', 'became',
    'began', 'drank', 'swam', 'flew', 'grew',
  ]);

  return irregularPast.has(word) || /ed$/.test(word);
}

function hasInvalidVerbForm(text) {
  const words = normalise(text).split(' ');
  const invalidPatterns = [
    /\b(?:has|have|had)\s+(?:went|saw|ate|did|wrote|spoke|broke|chose|drove|ran|came|gave|took|began|drank|swam|flew)\b/,
    /\b(?:has|have|had)\s+(?:go|see|eat|do|write|speak|break|choose|drive|run|come|give|take|begin|drink|swim|fly)\b/,
    /\b(?:did|didn't|didnt)\s+(?:went|saw|ate|done|gone|wrote|spoke|broke|came|took)\b/,
    /\b(?:he|she|it)\s+(?:go|do|have|eat|see|write|watch|play|study|try)\b/,
    /\b(?:is|am|are|was|were)\s+(?:go|went|eat|ate|see|saw|write|wrote)\b/,
  ];

  if (invalidPatterns.some((pattern) => pattern.test(normalise(text)))) {
    return true;
  }

  // Detect obvious missing participles after have/has.
  const perfect = words.findIndex((word) => word === 'have' || word === 'has');
  if (perfect !== -1 && words[perfect + 1]) {
    const next = words[perfect + 1];
    const baseForms = new Set([
      'go', 'see', 'eat', 'do', 'write', 'speak',
      'take', 'give', 'come', 'run', 'break',
    ]);
    if (baseForms.has(next)) return true;
  }

  return false;
}

function deriveErrorTag(question, learnerText) {
  const answer = normalise(learnerText);

  // 1. Check explicitly defined traps first.
  if (question.traps) {
    for (const [trapText, tag] of Object.entries(question.traps)) {
      if (normalise(trapText) === answer) return tag;
    }
  }

  // 2. M2: duration with for/since but simple past.
  const hasDurationMarker = /\b(for|since)\b/i.test(question.prompt || '');
  const hasPerfect = /\b(has|have)\b/i.test(answer);
  const words = answer.split(' ');
  const hasPastVerb = words.some(isPastVerb);

  if (hasDurationMarker && !hasPerfect && hasPastVerb) {
    return 'M2';
  }

  // 3. M1: past-time marker with present perfect.
  const hasPastMarker =
    /\b(yesterday|ago|last)\b/i.test(question.prompt || '') ||
    /\bin\s+(?:19|20)\d{2}\b/i.test(question.prompt || '');

  if (hasPastMarker && /\b(has|have)\b/i.test(answer)) {
    return 'M1';
  }

  // 4. Incorrect verb construction.
  if (hasInvalidVerbForm(answer)) {
    return 'form';
  }

  // 5. Remaining marker/meaning errors.
  return 'marker';
}

/**
 * Pure, exception-safe answer grader.
 *
 * Returns: { correct: boolean, tag: null | "M1" | "M2" | "form" | "marker" }
 */
export function gradeAnswer(question, text) {
  try {
    if (!question || typeof question !== 'object') {
      return { correct: false, tag: 'marker' };
    }

    let learnerText = String(text ?? '');

    // For MCQs, accept the actual option text or its displayed index.
    if (question.format === 'mcq' && Array.isArray(question.options)) {
      const index = Number(learnerText);
      if (
        learnerText.trim() !== '' &&
        Number.isInteger(index) &&
        index >= 0 &&
        index < question.options.length
      ) {
        learnerText = question.options[index];
      }
    }

    const learnerAnswer = normalise(learnerText);

    const acceptedAnswers = [
      question.answer,
      ...(Array.isArray(question.acceptable) ? question.acceptable : []),
    ].map(normalise);

    if (acceptedAnswers.includes(learnerAnswer)) {
      return { correct: true, tag: null };
    }

    return {
      correct: false,
      tag: deriveErrorTag(question, learnerText),
    };
  } catch {
    // Malformed questions or unexpected learner input must never crash the app.
    return { correct: false, tag: 'marker' };
  }
}

// --------------------------------------------------
// Session helpers
// --------------------------------------------------

const initialSession = () => newSession();

function sessionReducer(state, action) {
  switch (action.type) {
    case 'replace':
      return action.state;

    case 'tick':
      return state.secondsLeft === action.secondsLeft
        ? state
        : { ...state, secondsLeft: action.secondsLeft };

    case 'answer':
      return action.state;

    case 'restart':
      return newSession();

    default:
      return state;
  }
}

function getSkill(state) {
  const tags = Object.entries(state.wrongByTag || {})
    .sort((a, b) => b[1] - a[1]);

  if (tags[0]?.[1] > 0) {
    if (['M1', 'M2', 'marker'].includes(tags[0][0])) return 'marker';
    if (tags[0][0] === 'form') return 'form';
  }

  return ['marker', 'form', 'meaning'][state.taskIndex % 3];
}

function makeFallbackDecision(state, result, timeMs) {
  // Used only if decideNext throws or returns an invalid result.
  // This fallback creates exactly one log entry.
  const nextState = {
    ...state,
    askedIds: [...new Set([...(state.askedIds || []), result.qid])],
    log: [
      ...(state.log || []),
      {
        qid: result.qid,
        format: result.format || 'correct',
        level: result.level || state.level,
        correct: result.correct,
        tag: result.tag,
        rule: 'CONTINUE',
        timeMs,
      },
    ],
  };

  return {
    rule: 'CONTINUE',
    reason: 'Your answer has been recorded. Let’s continue practising.',
    nextLevel: state.level,
    newState: nextState,
  };
}

// --------------------------------------------------
// Main application
// --------------------------------------------------

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [session, dispatch] = useReducer(
    sessionReducer,
    undefined,
    initialSession
  );

  const [saved, setSaved] = useState(() => Boolean(loadSession()));
  const [question, setQuestion] = useState(null);
  const [result, setResult] = useState(null);
  const [decision, setDecision] = useState(null);

  const [diagnosticIndex, setDiagnosticIndex] = useState(0);
  const [diagnosticRetry, setDiagnosticRetry] = useState(0);
  const [diagnosticScore, setDiagnosticScore] = useState(0);
  const [diagnosticQuestions, setDiagnosticQuestions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [retrying, setRetrying] = useState(false);

  const questionRequest = useRef(0);
  const answerStartedAt = useRef(0);

  const startFresh = useCallback(() => {
    clearSession();

    const fresh = newSession();
    dispatch({ type: 'replace', state: fresh });

    setSaved(false);
    setQuestion(null);
    setResult(null);
    setDecision(null);

    setDiagnosticIndex(0);
    setDiagnosticRetry(0);
    setDiagnosticScore(0);
    setDiagnosticQuestions([]);

    setRetrying(false);
    setLoadError('');
    setScreen('diagnostic');
  }, []);

  const resume = useCallback(() => {
    const restored = loadSession();

    if (!restored) {
      startFresh();
      return;
    }

    dispatch({ type: 'replace', state: restored });
    setSaved(true);

    setScreen(
      restored.taskIndex >= 8 || restored.secondsLeft <= 0
        ? 'summary'
        : 'task'
    );
  }, [startFresh]);

  // Timer.
  useEffect(() => {
    if (!['diagnostic', 'task', 'feedback', 'lesson'].includes(screen)) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      dispatch({
        type: 'tick',
        secondsLeft: Math.max(0, session.secondsLeft - 1),
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen, session.secondsLeft]);

  // Persist every session change.
  useEffect(() => {
    if (['diagnostic', 'task', 'feedback', 'lesson'].includes(screen)) {
      saveSession(session);
      setSaved(true);
    }
  }, [session, screen]);

  // Timer expiry always leads to Summary, never Welcome.
  useEffect(() => {
    if (
      session.secondsLeft <= 0 &&
      ['diagnostic', 'task', 'feedback', 'lesson'].includes(screen)
    ) {
      setScreen('summary');
    }
  }, [session.secondsLeft, screen]);

  // ------------------------------------------------
  // Question loading
  // ------------------------------------------------

  const fetchQuestion = useCallback(async ({
    skill,
    level,
    lastTag,
    askedIds,
  }) => {
    const requestId = ++questionRequest.current;

    setLoading(true);
    setLoadError('');

    try {
      const next = await getNextQuestion({
        skill,
        level,
        lastTag,
        askedIds,
      });

      if (requestId === questionRequest.current) {
        if (!next || !next.id) {
          throw new Error('The question response was invalid.');
        }

        setQuestion(next);

        // Start the answer timer when the question is displayed.
        answerStartedAt.current = Date.now();
      }
    } catch (error) {
      if (requestId === questionRequest.current) {
        setLoadError(
          error?.message || 'Could not load a question. Please try again.'
        );
      }
    } finally {
      if (requestId === questionRequest.current) {
        setLoading(false);
      }
    }
  }, []);

  // Diagnostic question loading.
  useEffect(() => {
    if (
      screen !== 'diagnostic' ||
      diagnosticQuestions[diagnosticIndex]
    ) {
      return undefined;
    }

    let cancelled = false;
    const skill = diagnosticIndex === 0 ? 'marker' : 'form';

    getNextQuestion({
      skill,
      level: 1,
      lastTag: null,
      askedIds: session.askedIds,
    })
      .then((next) => {
        if (cancelled) return;

        if (!next || !next.id) {
          throw new Error('Invalid diagnostic question.');
        }

        setDiagnosticQuestions((current) => {
          const copy = [...current];
          copy[diagnosticIndex] = next;
          return copy;
        });

        setQuestion(next);
        answerStartedAt.current = Date.now();
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(
            error?.message || 'Could not load the diagnostic question.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    screen,
    diagnosticIndex,
    diagnosticQuestions,
    session.askedIds,
    diagnosticRetry,
  ]);

  // Normal task question loading.
  useEffect(() => {
    if (
      screen === 'task' &&
      !question &&
      !loading &&
      !loadError
    ) {
      fetchQuestion({
        skill: getSkill(session),
        level: session.level,
        lastTag: result?.tag ?? null,
        askedIds: session.askedIds,
      });
    }
  }, [
    screen,
    question,
    loading,
    loadError,
    session,
    result,
    fetchQuestion,
  ]);

  // ------------------------------------------------
  // Answer submission
  // ------------------------------------------------

  const submitAnswer = useCallback(async (answerText) => {
    if (!question || loading || screen === 'feedback') return;

    // Measure from when this question was actually shown.
    const timeMs = Math.max(
      0,
      Date.now() - (answerStartedAt.current || Date.now())
    );

    try {
      // All question formats use the same deterministic grader.
      const graded = gradeAnswer(question, answerText);

      let explanationQuality;

      // AI explanation evaluation is retained for explain questions.
      if (question.format === 'explain') {
        try {
          const evaluation = await evaluateExplanation({
            question,
            learnerText: answerText,
          });

          explanationQuality = evaluation.verdict;
        } catch {
          explanationQuality = 'poor';
        }
      }

      const outcome = {
        qid: question.id,
        correct: graded.correct,
        tag: graded.tag,
        ...(explanationQuality
          ? { explanationQuality }
          : {}),
      };

      // Diagnostic answers do not consume the eight practice tasks.
      if (screen === 'diagnostic') {
        const updated = {
          ...session,
          askedIds: [
            ...new Set([
              ...(session.askedIds || []),
              question.id,
            ]),
          ],
        };

        dispatch({ type: 'answer', state: updated });
        saveSession(updated);

        if (diagnosticIndex === 0) {
          setDiagnosticScore(graded.correct ? 1 : 0);
          setDiagnosticIndex(1);
          setQuestion(null);
        } else {
          const startingLevel =
            diagnosticScore + (graded.correct ? 1 : 0) === 2
              ? 2
              : 1;

          const readyState = {
            ...updated,
            level: startingLevel,
          };

          dispatch({ type: 'answer', state: readyState });
          saveSession(readyState);

          setQuestion(null);
          setScreen('task');
        }

        return;
      }

      // Pass timeMs to the engine so its single log entry records
      // the time measured from question display.
      let nextDecision;

      try {
        nextDecision = decideNext(session, {
          ...outcome,
          timeMs,
          format: question.format,
          level: question.level,
        });

        if (
          !nextDecision ||
          !nextDecision.newState ||
          !nextDecision.rule
        ) {
          throw new Error('Invalid decision returned by engine.');
        }
      } catch {
        nextDecision = makeFallbackDecision(
          session,
          {
            ...outcome,
            format: question.format,
            level: question.level,
          },
          timeMs
        );
      }

      // IMPORTANT:
      // decideNext owns the log entry.
      // Do not append another log entry here.
      const nextState = nextDecision.newState;

      dispatch({ type: 'answer', state: nextState });
      saveSession(nextState);
      setSaved(true);

      setResult(outcome);
      setDecision(nextDecision);
      setScreen('feedback');
    } catch (error) {
      // Never reset the session or navigate to Welcome on grading errors.
      // Show safe Feedback using the current question.
      const fallbackResult = {
        qid: question.id,
        correct: false,
        tag: 'marker',
      };

      const fallbackDecision = makeFallbackDecision(
        session,
        {
          ...fallbackResult,
          format: question.format,
          level: question.level,
        },
        timeMs
      );

      dispatch({
        type: 'answer',
        state: fallbackDecision.newState,
      });

      saveSession(fallbackDecision.newState);

      setResult(fallbackResult);
      setDecision(fallbackDecision);
      setScreen('feedback');
    }
  }, [
    question,
    loading,
    screen,
    session,
    diagnosticIndex,
    diagnosticScore,
  ]);

  // ------------------------------------------------
  // Next task: increment exactly once
  // ------------------------------------------------

  const goNext = useCallback(() => {
    if (!decision || session.secondsLeft <= 0) {
      setScreen('summary');
      return;
    }

    const nextState = {
      ...session,
      taskIndex: session.taskIndex + 1,
      askedIds: [...new Set(session.askedIds || [])],
    };

    dispatch({ type: 'answer', state: nextState });
    saveSession(nextState);
    setSaved(true);

    setResult(null);
    setDecision(null);
    setRetrying(false);
    setQuestion(null);

    if (
      nextState.taskIndex >= 8 ||
      nextState.secondsLeft <= 0
    ) {
      setScreen('summary');
      return;
    }

    setScreen('task');

    // The exact same nextState is used for saving and question selection.
    fetchQuestion({
      skill: getSkill(nextState),
      level: nextState.level,
      lastTag: result?.tag ?? null,
      askedIds: nextState.askedIds,
    });
  }, [decision, session, result, fetchQuestion]);

  // ------------------------------------------------
  // Retry: never increment taskIndex
  // ------------------------------------------------

  const retryQuestion = useCallback(() => {
    if (!question) {
      setScreen('task');
      return;
    }

    setRetrying(true);
    answerStartedAt.current = Date.now();
    setScreen('task');
  }, [question]);

  const finishLesson = useCallback(() => {
    retryQuestion();
  }, [retryQuestion]);

  // ------------------------------------------------
  // Restart
  // ------------------------------------------------

  const restart = useCallback(() => {
    clearSession();
    dispatch({ type: 'restart' });

    setSaved(false);
    setQuestion(null);
    setResult(null);
    setDecision(null);

    setDiagnosticIndex(0);
    setDiagnosticQuestions([]);
    setDiagnosticScore(0);

    setLoadError('');
    setRetrying(false);
    setScreen('welcome');
  }, []);

  // ------------------------------------------------
  // Render
  // ------------------------------------------------

  return (
    <div className="app-shell">
      <main className="app-main">

        {screen === 'welcome' && (
          <Welcome
            saved={saved ? session : null}
            onStart={startFresh}
            onResume={resume}
          />
        )}

        {screen === 'diagnostic' && (
          <section className="screen-state" aria-live="polite">
            <p className="eyebrow">
              Quick diagnostic · {diagnosticIndex + 1} of 2
            </p>

            {loading || !question ? (
              <p>{loadError || 'Preparing your question…'}</p>
            ) : (
              <Task
                question={question}
                secondsLeft={session.secondsLeft}
                taskIndex={diagnosticIndex}
                onSubmit={submitAnswer}
              />
            )}

            {loadError && (
              <button
                className="text-button"
                onClick={() => {
                  setLoadError('');
                  setDiagnosticRetry((value) => value + 1);
                }}
              >
                Try loading again
              </button>
            )}
          </section>
        )}

        {screen === 'task' && (
          <section className="screen-state" aria-live="polite">
            <p className="eyebrow">
              Practice · Task {Math.min(session.taskIndex + 1, 8)} of 8
              {retrying ? ' · retry' : ''}
            </p>

            {loading || !question ? (
              <p>{loadError || 'Preparing your next question…'}</p>
            ) : (
              <Task
                question={question}
                secondsLeft={session.secondsLeft}
                taskIndex={session.taskIndex}
                onSubmit={submitAnswer}
              />
            )}

            {loadError && (
              <button
                className="text-button"
                onClick={() => {
                  setLoadError('');
                  fetchQuestion({
                    skill: getSkill(session),
                    level: session.level,
                    lastTag: result?.tag ?? null,
                    askedIds: session.askedIds,
                  });
                }}
              >
                Try again
              </button>
            )}
          </section>
        )}

        {screen === 'feedback' && (
          question && result && decision ? (
            <Feedback
              question={question}
              result={result}
              decision={decision}
              onNext={goNext}
              onRetry={() => setScreen('lesson')}
            />
          ) : (
            <section className="screen-state" aria-live="polite">
              <h2>Answer recorded</h2>
              <p>
                Your response has been recorded. You can continue
                with the next question.
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={goNext}
              >
                Next
              </button>
            </section>
          )
        )}

        {screen === 'lesson' && decision && (
          <Lesson
            lessonId={decision.lessonId}
            onDone={finishLesson}
          />
        )}

        {screen === 'summary' && (
          <Summary
            state={session}
            onRestart={restart}
          />
        )}

        {screen === 'about' && <About />}

      </main>

      <Footer />
    </div>
  );
}
