
import '../index.css';

function formatTime(seconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function Welcome({ saved, onStart, onResume }) {
  return (
    <section className="welcome-screen screen-state">
      <div className="welcome-content">
        <span className="welcome-label">CLASS 9 · ENGLISH OLYMPIAD</span>

        <h1 className="welcome-title">
          Master English
          <span> One Tense at a Time.</span>
        </h1>

        <p className="welcome-description">
          Learn when to use the simple past and present perfect
          through smart questions, instant feedback and adaptive practice.
        </p>

        <div className="welcome-highlight">
          <span className="welcome-highlight-icon">✦</span>
          <div>
            <strong>Your personal adaptive tutor</strong>
            <p>Questions adjust to your learning level and mistakes.</p>
          </div>
        </div>

        <div className="welcome-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onStart}
          >
            Start learning
            <span aria-hidden="true"> →</span>
          </button>

          {saved && (
            <button
              type="button"
              className="secondary-button"
              onClick={onResume}
            >
              Resume (task {saved.taskIndex + 1} of 8,{' '}
              {formatTime(saved.secondsLeft)} left)
            </button>
          )}
        </div>

        <p className="welcome-note">
          <span aria-hidden="true">◷</span>
          10-minute session. Progress saves automatically.
        </p>
      </div>

      <div className="welcome-bottom">
        <span>THINK CLEARLY.</span>
        <span>WRITE ACCURATELY.</span>
        <span>EXCEL CONFIDENTLY.</span>
      </div>
    </section>
  );
}
