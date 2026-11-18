import { useEffect, useRef } from "react";

const C = {
  bg: "#F2F5F9", card: "#FFFFFF", ink: "#14213D", mute: "#51607A", line: "#C9D3E1",
  teal: "#0F766E", tealSoft: "#DDF3F0", green: "#18794E", greenSoft: "#E3F5EA",
  red: "#B42318", redSoft: "#FDE8E6", amber: "#B45309", amberSoft: "#FEF0DC",
  blue: "#1D4ED8", blueSoft: "#E4ECFD",
};

const RULE_INFO = {
  HARDER: "You are ready for a harder question.",
  ALTERNATIVE: "Next we try a different kind of question on the same idea.",
  PREREQUISITE: "A quick mini-lesson comes before more questions.",
  CONTINUE: "Keep going at the same level.",
};

const QUALITY = {
  good: { text: "Explanation: good", bg: C.greenSoft, fg: C.green },
  partial: { text: "Explanation: partly there", bg: C.amberSoft, fg: C.amber },
  poor: { text: "Explanation: needs work", bg: C.redSoft, fg: C.red },
};

const S = {
  outer: { background: C.bg, minHeight: "100dvh", color: C.ink,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", lineHeight: 1.45 },
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100dvh", display: "flex",
    flexDirection: "column", padding: "16px 16px 0", boxSizing: "border-box" },
  box: { borderRadius: 12, padding: 16, marginTop: 12, boxSizing: "border-box" },
  boxTitle: { fontSize: 14, fontWeight: 700, margin: "0 0 6px" },
  p: { margin: 0, fontSize: 17 },
  bar: { position: "sticky", bottom: 0, background: C.bg, borderTop: `1px solid ${C.line}`,
    padding: "12px 0 16px", marginTop: "auto", display: "grid", gap: 10 },
  primary: { width: "100%", minHeight: 56, fontSize: 18, fontWeight: 700, borderRadius: 12,
    border: "none", color: "#fff", background: C.teal, cursor: "pointer" },
  secondary: { width: "100%", minHeight: 52, fontSize: 17, fontWeight: 600, borderRadius: 12,
    border: `2px solid ${C.teal}`, color: C.teal, background: "#fff", cursor: "pointer" },
};

export default function Feedback({ question, result, decision, onNext, onRetry }) {
  const headRef = useRef(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (headRef.current) headRef.current.focus({ preventScroll: true });
  }, [question.id]);

  const ok = result.correct;
  const fb = question.feedback || {};
  const tagText = result.tag === "M1" || result.tag === "M2" ? fb[result.tag] : null;
  const feedbackText = ok ? fb.correct : tagText || fb.other || "";
  const quality = result.explanationQuality ? QUALITY[result.explanationQuality] : null;
  const nextLabel = decision.rule === "PREREQUISITE" ? "Open the mini-lesson" : "Next question";

  return (
    <div style={S.outer}>
      <div style={S.page}>
        <div role="status" style={{ ...S.box, marginTop: 0, background: ok ? C.greenSoft : C.redSoft,
          border: `2px solid ${ok ? C.green : C.red}` }}>
          <h2 ref={headRef} tabIndex={-1} style={{ margin: 0, fontSize: 24, color: ok ? C.green : C.red, outline: "none" }}>
            {ok ? "Correct" : "Not quite"}
          </h2>
          {feedbackText && <p style={{ ...S.p, marginTop: 8 }}>{feedbackText}</p>}
          {quality && (
            <span style={{ display: "inline-block", marginTop: 10, padding: "6px 10px", borderRadius: 8,
              fontSize: 14, fontWeight: 700, background: quality.bg, color: quality.fg }}>
              {quality.text}
            </span>
          )}
        </div>

        {!ok && (
          <div style={{ ...S.box, background: C.card, border: `1px solid ${C.line}` }}>
            <p style={{ ...S.boxTitle, color: C.mute }}>A correct answer</p>
            <p style={{ ...S.p, fontWeight: 600 }}>{question.answer}</p>
          </div>
        )}

        {question.modelExplanation && (
          ok ? (
            <details style={{ ...S.box, background: C.card, border: `1px solid ${C.line}` }}>
              <summary style={{ fontWeight: 700, fontSize: 16, minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer" }}>
                See the model explanation
              </summary>
              <p style={{ ...S.p, marginTop: 6 }}>{question.modelExplanation}</p>
            </details>
          ) : (
            <div style={{ ...S.box, background: C.card, border: `1px solid ${C.line}` }}>
              <p style={{ ...S.boxTitle, color: C.mute }}>Why</p>
              <p style={S.p}>{question.modelExplanation}</p>
            </div>
          )
        )}

        <div style={{ ...S.box, background: C.blueSoft, border: `2px solid ${C.blue}` }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.blue }}>
            Rule fired: {decision.rule}
          </p>
          <p style={{ margin: "4px 0 8px", fontSize: 14, color: C.mute }}>{RULE_INFO[decision.rule]}</p>
          <p style={S.p}>{decision.reason}</p>
        </div>

        <div style={{ height: 16 }} />
        <div style={S.bar}>
          <button type="button" style={S.primary} onClick={onNext}>{nextLabel}</button>
          {!ok && onRetry && (
            <button type="button" style={S.secondary} onClick={onRetry}>Try this question again</button>
          )}
        </div>
      </div>
    </div>
  );
}
