import { useState, useEffect } from "react";
import { SESSION_SECONDS } from "../store.js";

const C = {
  bg: "#F2F5F9", card: "#FFFFFF", ink: "#14213D", mute: "#51607A", line: "#C9D3E1",
  teal: "#0F766E", tealSoft: "#DDF3F0", amber: "#B45309", red: "#B42318",
};

const FORMAT_INFO = {
  mcq: { label: "Choose one answer", hint: "" },
  correct: { label: "Fix the sentence", hint: "Type the corrected sentence." },
  explain: { label: "Why this tense?", hint: "Explain in one or two sentences." },
  transform: { label: "Rewrite the sentence", hint: "Type your new sentence." },
};

function fmt(total) {
  const s = Math.max(0, Math.floor(total));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const S = {
  outer: { background: C.bg, minHeight: "100dvh", color: C.ink,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", lineHeight: 1.45 },
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100dvh", display: "flex",
    flexDirection: "column", padding: "12px 16px 0", boxSizing: "border-box" },
  top: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 },
  track: { height: 10, background: "#DCE3EE", borderRadius: 5, overflow: "hidden" },
  dots: { display: "flex", gap: 8, alignItems: "center", margin: "12px 0 4px" },
  meta: { color: C.mute, fontSize: 14, margin: "0 0 14px" },
  card: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 },
  label: { fontSize: 14, fontWeight: 700, color: C.teal, margin: "0 0 6px" },
  prompt: { fontSize: 20, fontWeight: 600, margin: 0, lineHeight: 1.4 },
  hint: { color: C.mute, fontSize: 14, margin: "8px 0 0" },
  bar: { position: "sticky", bottom: 0, background: C.bg, borderTop: `1px solid ${C.line}`,
    padding: "12px 0 16px", marginTop: "auto" },
  submit: { width: "100%", minHeight: 56, fontSize: 18, fontWeight: 700, borderRadius: 12,
    border: "none", color: "#fff", background: C.teal, cursor: "pointer" },
  field: { width: "100%", boxSizing: "border-box", fontSize: 18, padding: 14, minHeight: 56,
    borderRadius: 12, border: `2px solid ${C.line}`, fontFamily: "inherit", color: C.ink, background: "#fff" },
};

export default function Task({ question, secondsLeft, taskIndex, onSubmit }) {
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    setAnswer("");
    window.scrollTo(0, 0);
  }, [question.id]);

  const info = FORMAT_INFO[question.format] || FORMAT_INFO.transform;
  const pct = Math.max(0, Math.min(100, (secondsLeft / SESSION_SECONDS) * 100));
  const barColor = secondsLeft <= 60 ? C.red : secondsLeft <= 120 ? C.amber : C.teal;
  const canSubmit = answer.trim().length > 0;

  function submit(e) {
    e.preventDefault();
    if (canSubmit) onSubmit(answer.trim());
  }

  return (
    <div style={S.outer}>
      <form style={S.page} onSubmit={submit}>
        <div style={S.top}>
          <span style={{ fontSize: 14, color: C.mute }}>Time left</span>
          <strong role="timer" style={{ fontSize: 22, color: barColor, fontVariantNumeric: "tabular-nums" }}>
            {fmt(secondsLeft)}
          </strong>
        </div>
        <div style={S.track} role="progressbar" aria-valuemin={0} aria-valuemax={SESSION_SECONDS}
          aria-valuenow={Math.max(0, secondsLeft)} aria-label="Time left">
          <div style={{ width: `${pct}%`, height: "100%", background: barColor, transition: "width 1s linear" }} />
        </div>

        <div style={S.dots} aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} style={{
              width: i === taskIndex ? 18 : 12, height: i === taskIndex ? 18 : 12, borderRadius: "50%",
              boxSizing: "border-box", flex: "none",
              background: i < taskIndex ? C.teal : i === taskIndex ? C.tealSoft : "transparent",
              border: `2px solid ${i <= taskIndex ? C.teal : C.line}`,
            }} />
          ))}
        </div>
        <p style={S.meta}>Task {taskIndex + 1} of 8 · Level {question.level}</p>

        <div style={S.card}>
          <p style={S.label}>{info.label}</p>
          <p style={S.prompt}>{question.prompt}</p>
          {info.hint && <p style={S.hint}>{info.hint}</p>}
        </div>

        <div style={{ marginTop: 14 }}>
          {question.format === "mcq" && (
            <div role="radiogroup" aria-label="Answer options" style={{ display: "grid", gap: 10 }}>
              {(question.options || []).map((opt) => {
                const on = answer === opt;
                return (
                  <label key={opt} style={{
                    display: "flex", alignItems: "center", gap: 12, minHeight: 56, padding: "10px 14px",
                    borderRadius: 12, cursor: "pointer", fontSize: 18, boxSizing: "border-box",
                    background: on ? C.tealSoft : "#fff", border: `2px solid ${on ? C.teal : C.line}`,
                  }}>
                    <input type="radio" name={`mcq-${question.id}`} value={opt} checked={on}
                      onChange={() => setAnswer(opt)}
                      style={{ width: 24, height: 24, flex: "none", accentColor: C.teal, margin: 0 }} />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          )}

          {(question.format === "correct" || question.format === "transform") && (
            <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)}
              aria-label={info.label} placeholder="Type here"
              autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
              style={S.field} />
          )}

          {question.format === "explain" && (
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
              aria-label={info.label} placeholder="Because…" rows={5}
              style={{ ...S.field, resize: "vertical" }} />
          )}
        </div>

        <div style={S.bar}>
          <button type="submit" disabled={!canSubmit}
            style={{ ...S.submit, opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? "pointer" : "not-allowed" }}>
            Check my answer
          </button>
        </div>
      </form>
    </div>
  );
}
