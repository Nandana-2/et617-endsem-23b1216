import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { decideNext } from './engine.js';
import { SESSION_SECONDS, loadSession, saveSession, clearSession, newSession } from './store.js';
import { getNextQuestion, evaluateExplanation } from './ai.js';

// These presentation components are supplied by the component implementation task.
import Welcome from './components/Welcome.jsx';
import Task from './components/Task.jsx';
import Feedback from './components/Feedback.jsx';
import Lesson from './components/Lesson.jsx';
import Summary from './components/Summary.jsx';
import About from './components/About.jsx';
import Footer from './components/Footer.jsx';

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
  // Rotate through the three assessed skills while prioritising recurring errors.
  const tags = Object.entries(state.wrongByTag || {}).sort((a, b) => b[1] - a[1]);
  if (tags[0]?.[1] > 0) {
    if (tags[0][0] === 'M1' || tags[0][0] === 'M2' || tags[0][0] === 'marker') return 'marker';
    if (tags[0][0] === 'form') return 'form';
  }
  return ['marker', 'form', 'meaning'][state.taskIndex % 3];
}

function normalise(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');
}

function isAnswerCorrect(question, answerText) {
  const answer = normalise(answerText);
  const accepted = [question.answer, ...(question.acceptable || [])].map(normalise);
  if (accepted.includes(answer)) return true;
  // MCQ components may submit either the option text or its displayed index.
  if (question.format === 'mcq' && /^\d+$/.test(answer)) {
    return normalise(question.options?.[Number(answer)]) === normalise(question.answer);
  }
  return false;
}

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [session, dispatch] = useReducer(sessionReducer, undefined, initialSession);
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
    setScreen(restored.taskIndex >= 8 || restored.secondsLeft <= 0 ? 'summary' : 'task');
  }, [startFresh]);

  // Keep the remaining time durable, including when the learner refreshes mid-task.
  useEffect(() => {
    if (!['diagnostic', 'task', 'feedback', 'lesson'].includes(screen)) return undefined;
    const timer = window.setInterval(() => {
      dispatch({ type: 'tick', secondsLeft: Math.max(0, session.secondsLeft - 1) });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, session.secondsLeft]);

  useEffect(() => {
    if (['diagnostic', 'task', 'feedback', 'lesson'].includes(screen)) {
      saveSession(session);
      setSaved(true);
    }
  }, [session, screen]);

  useEffect(() => {
    if (session.secondsLeft <= 0 && ['diagnostic', 'task', 'feedback', 'lesson'].includes(screen)) {
      setScreen('summary');
    }
  }, [session.secondsLeft, screen]);

  const fetchQuestion = useCallback(async ({ skill, level, lastTag, askedIds }) => {
    const requestId = ++questionRequest.current;
    setLoading(true);
    setLoadError('');
    try {
      const next = await getNextQuestion({ skill, level, lastTag, askedIds });
      if (requestId === questionRequest.current) {
        setQuestion(next);
        answerStartedAt.current = Date.now();
      }
    } catch (error) {
      if (requestId === questionRequest.current) {
        setLoadError(error?.message || 'Could not load a question. Please try again.');
      }
    } finally {
      if (requestId === questionRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (screen !== 'diagnostic' || diagnosticQuestions[diagnosticIndex]) return;
    let cancelled = false;
    const skill = diagnosticIndex === 0 ? 'marker' : 'form';
    getNextQuestion({ skill, level: 1, lastTag: null, askedIds: session.askedIds })
      .then((next) => {
        if (!cancelled) {
          setDiagnosticQuestions((current) => {
            const copy = [...current];
            copy[diagnosticIndex] = next;
            return copy;
          });
          setQuestion(next);
          answerStartedAt.current = Date.now();
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error?.message || 'Could not load the diagnostic question.');
      });
    return () => { cancelled = true; };
  }, [screen, diagnosticIndex, diagnosticQuestions, session.askedIds, diagnosticRetry]);

  useEffect(() => {
    if (screen === 'task' && !question && !loading && !loadError) {
      fetchQuestion({
        skill: getSkill(session),
        level: session.level,
        lastTag: result?.tag ?? null,
        askedIds: session.askedIds,
      });
    }
  }, [screen, question, loading, loadError, session, result, fetchQuestion]);

  const submitAnswer = useCallback(async (answerText) => {
    if (!question || loading || screen === 'feedback') return;
    const timeMs = Math.max(0, Date.now() - (answerStartedAt.current || Date.now()));
    let correct;
    let tag = null;
    let explanationQuality;

    if (question.format === 'explain') {
      const evaluation = await evaluateExplanation({ question, learnerText: answerText });
      explanationQuality = evaluation.verdict;
      correct = evaluation.verdict === 'good';
      tag = evaluation.tag;
    } else {
      correct = isAnswerCorrect(question, answerText);
      if (!correct) {
        tag = question.traps?.[answerText] || question.traps?.[String(answerText)] || null;
        if (!tag && question.format === 'mcq' && question.options) {
          const selected = question.options.find((option) => normalise(option) === normalise(answerText));
          tag = selected ? question.traps?.[selected] || null : null;
        }
        if (!tag) tag = null;
      }
    }

    const outcome = { qid: question.id, correct, tag, ...(explanationQuality ? { explanationQuality } : {}) };

    // Diagnostic answers inform the learner's starting level but do not consume one
    // of the eight adaptive practice tasks.
    if (screen === 'diagnostic') {
      const nextAsked = [...new Set([...(session.askedIds || []), question.id])];
      const updated = { ...session, askedIds: nextAsked };
      dispatch({ type: 'answer', state: updated });
      saveSession(updated);
      if (diagnosticIndex === 0) {
        setDiagnosticScore(correct ? 1 : 0);
        setDiagnosticIndex(1);
        setQuestion(null);
      } else {
        const startingLevel = diagnosticScore + (correct ? 1 : 0) === 2 ? 2 : 1;
        const readyState = { ...updated, level: startingLevel };
        dispatch({ type: 'answer', state: readyState });
        saveSession(readyState);
        setQuestion(null);
        setScreen('task');
      }
      return;
    }

    const decisionResult = decideNext(session, outcome);
    const nextState = {
      ...decisionResult.newState,
      askedIds: [...new Set([...(decisionResult.newState.askedIds || []), question.id])],
      log: [
        ...(decisionResult.newState.log || []),
        { qid: question.id, format: question.format, level: question.level, correct, tag, rule: decisionResult.rule, timeMs },
      ],
    };
    dispatch({ type: 'answer', state: nextState });
    saveSession(nextState);
    setResult(outcome);
    setDecision({ ...decisionResult, newState: nextState });
    setScreen('feedback');
  }, [question, loading, screen, session, diagnosticIndex, diagnosticScore]);

  const goNext = useCallback(() => {
    if (!decision || session.taskIndex >= 8 || session.secondsLeft <= 0) {
      setScreen('summary');
      return;
    }
    setQuestion(null);
    setResult(null);
    setDecision(null);
    setRetrying(false);
    setScreen('task');
  }, [decision, session.taskIndex, session.secondsLeft]);

  const retryQuestion = useCallback(() => {
    setRetrying(true);
    answerStartedAt.current = Date.now();
    setScreen('task');
  }, []);

  const finishLesson = useCallback(() => {
    // Lesson completion returns to the same question for a deliberate retry.
    retryQuestion();
  }, [retryQuestion]);

  const restart = useCallback(() => {
    clearSession();
    dispatch({ type: 'restart' });
    setSaved(false);
    setQuestion(null);
    setResult(null);
    setDecision(null);
    setDiagnosticIndex(0);
    setDiagnosticQuestions([]);
    setScreen('welcome');
  }, []);

  const showLesson = screen === 'lesson';

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
            <p className="eyebrow">Quick diagnostic · {diagnosticIndex + 1} of 2</p>
            {loading || !question ? <p>{loadError || 'Preparing your question…'}</p> : (
              <Task
                question={question}
                secondsLeft={session.secondsLeft}
                taskIndex={diagnosticIndex}
                onSubmit={submitAnswer}
              />
            )}
            {loadError && <button className="text-button" onClick={() => { setLoadError(''); setDiagnosticRetry((value) => value + 1); }}>Try loading again</button>}
          </section>
        )}

        {screen === 'task' && (
          <section className="screen-state" aria-live="polite">
            <p className="eyebrow">Practice · Task {Math.min(session.taskIndex + 1, 8)} of 8{retrying ? ' · retry' : ''}</p>
            {loading || !question ? <p>{loadError || 'Preparing your next question…'}</p> : (
              <Task
                question={question}
                secondsLeft={session.secondsLeft}
                taskIndex={session.taskIndex}
                onSubmit={submitAnswer}
              />
            )}
            {loadError && <button className="text-button" onClick={() => { setLoadError(''); fetchQuestion({ skill: getSkill(session), level: session.level, lastTag: result?.tag ?? null, askedIds: session.askedIds }); }}>Try again</button>}
          </section>
        )}

        {screen === 'feedback' && question && result && decision && (
          <Feedback
            question={question}
            result={result}
            decision={decision}
            onNext={goNext}
            onRetry={() => setScreen('lesson')}
          />
        )}

        {showLesson && decision && (
          <Lesson lessonId={decision.lessonId} onDone={finishLesson} />
        )}

        {screen === 'summary' && <Summary state={session} onRestart={restart} />}

        {screen === 'about' && <About />}
      </main>
      <Footer />
    </div>
  );
}
