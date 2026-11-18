import { useEffect, useRef, useState } from "react";

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