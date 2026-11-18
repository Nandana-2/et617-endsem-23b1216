import { useEffect, useRef, useState } from "react";

export const SESSION_SECONDS = 10 * 60;
const SESSION_KEY = "adaptive-english-tenses-session";

export function loadSession() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SESSION_KEY));
    if (!saved || typeof saved !== "object") return null;

    // Older saved sessions may not include these fields.
    return {
      ...saved,
      taskIndex: Number.isFinite(saved.taskIndex) ? saved.taskIndex : 0,
      secondsLeft: Number.isFinite(saved.secondsLeft)
        ? Math.max(0, saved.secondsLeft)
        : SESSION_SECONDS,
    };
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // The session can continue for this visit if storage is unavailable.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
}

export function newSession() {
  return {
    level: 1,
    taskIndex: 0,
    secondsLeft: SESSION_SECONDS,
    log: [],
    wrongByTag: {},
    streakCorrect: 0,
  };
}

// Counts down from initialSeconds, one tick per second.
// - Pauses while the tab is hidden (no ticks, no catch-up on return).
// - Calls onEnd exactly once when it reaches 0.
// - Returns the seconds left so the parent can save them.
export function useCountdown(initialSeconds, onEnd) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const remaining = useRef(initialSeconds);
  const ended = useRef(initialSeconds <= 0);
  const onEndRef = useRef(onEnd);

  // Always call the latest onEnd without restarting the timer.
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (ended.current) {
      if (initialSeconds <= 0) onEndRef.current?.();
      return undefined;
    }

    let id = null;

    const tick = () => {
      remaining.current = Math.max(0, remaining.current - 1);
      setSecondsLeft(remaining.current);
      if (remaining.current <= 0) {
        stop();
        if (!ended.current) {
          ended.current = true;
          onEndRef.current?.();
        }
      }
    };

    const start = () => {
      if (id === null && !ended.current) id = setInterval(tick, 1000);
    };

    const stop = () => {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // initialSeconds is intentionally read once: the countdown owns the value afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return secondsLeft;
}

export default useCountdown;
