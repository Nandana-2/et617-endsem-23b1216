const C = {
  bg: "#F2F5F9", card: "#FFFFFF", ink: "#14213D", mute: "#51607A", line: "#C9D3E1",
  teal: "#0F766E", tealSoft: "#DDF3F0", green: "#18794E", red: "#B42318", amber: "#B45309",
};

const TAGS = {
  M1: { name: "Finished time, visible result",
    tip: "You used the present perfect for an action with a finished time (like yesterday). Finished time means simple past." },
  M2: { name: "Duration that is still true",
    tip: "You used the simple past with for/since when the situation continues now. Use the present perfect." },
  form: { name: "Verb form", tip: "Revise the past participles: seen, gone, written, taken." },
  marker: { name: "Time words", tip: "Revise which time words go with which tense: yesterday, ago, just, already, since." },
};

const FORMAT_NAME = { mcq: "Choose", correct: "Fix", explain: "Explain", transform: "Rewrite" };

const S = {
  outer: { background: C.bg, minHeight: "100dvh", color: C.ink,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", lineHeight: 1.45 },
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100dvh", display: "flex",
    flexDirection: "column", padding: "16px 16px 0", boxSizing: "border-box" },
  card: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16,
    marginTop: 12, boxSizing: "border-box" },
  h3: { fontSize: 18, margin: "0 0 10px" },
  th: { textAlign: "left", fontSize: 13, color: C.mute, padding: "6px 8px", borderBottom: `2px solid ${C.line}`, whiteSpace: "nowrap" },
  td: { padding: "10px 8px", fontSize: 15, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" },
  bar: { position: "sticky", bottom: 0, background: C.bg, borderTop: `1px solid ${C.line}`,
    padding: "12px 0 16px", marginTop: "auto" },
  primary: { width: "100%", minHeight: 56, fontSize: 18, fontWeight: 700, borderRadius: 12,
    border: "none", color: "#fff", background: C.teal, cursor: "pointer" },
};

function fmt(total) {
  const s = Math.max(0, Math.floor(total));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Summary({ state, onRestart }) {
  const log = (state.log || []).filter((l) => l && l.qid);
  const wrong = state.wrongByTag || { M1: 0, M2: 0, form: 0, marker: 0 };
  const right = log.filter((l) => l.correct).length;
  const total = log.length;
  const pct = total ? Math.round((right / total) * 100) : 0;
  const used = 600 - (state.secondsLeft ?? 0);
  const maxWrong = Math.max(1, ...Object.keys(TAGS).map((k) => wrong[k] || 0));
  const topTag = Object.keys(TAGS).reduce((a, k) => ((wrong[k] || 0) > (wrong[a] || 0) ? k : a), "M1");
  const hasMistakes = (wrong[topTag] || 0) > 0;
  const allCorrect = total > 0 && log.every((l) => l.correct);
  const message = pct >= 80 ? "Strong work." : pct >= 50 ? "Good progress." : "A solid start. Practice makes this stick.";

  return (
    <div style={S.outer}><div style={S.page}>
      <h2 style={{ fontSize: 22, margin: "0 0 4px" }}>Your session summary</h2>
      <p style={{ color: C.mute, fontSize: 15, margin: 0 }}>Time used: {fmt(used)}</p>

      <div style={{ ...S.card, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 40, fontWeight: 800 }}>{right} / {total}</p>
        <p style={{ margin: "4px 0 0", fontSize: 17 }}>{pct}% correct. {message}</p>
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>Mistake types</h3>
        {Object.keys(TAGS).map((k) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
              <span>{TAGS[k].name}</span>
              <strong>{wrong[k] || 0}</strong>
            </div>
            <div style={{ height: 10, background: "#DCE3EE", borderRadius: 5, overflow: "hidden", marginTop: 4 }}>
              <div style={{ width: `${((wrong[k] || 0) / maxWrong) * 100}%`, height: "100%", background: C.red }} />
            </div>
          </div>
        ))}
        <p style={{ margin: "4px 0 0", fontSize: 16, background: C.tealSoft, borderRadius: 8, padding: 12 }}>
          {allCorrect
            ? "No mistakes logged. Nice and clean."
            : hasMistakes
              ? `Focus next: ${TAGS[topTag].tip}`
              : total > 0
                ? "Look back at the wrong answers in the task log below."
                : "Answer a few tasks to see your focus areas."}
        </p>
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>Task log</h3>
        {total === 0 ? (
          <p style={{ margin: 0, color: C.mute }}>No tasks were answered this time.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 420 }}>
              <thead>
                <tr>
                  <th style={S.th}>#</th><th style={S.th}>Task</th><th style={S.th}>Result</th>
                  <th style={S.th}>Mistake</th><th style={S.th}>Rule</th><th style={S.th}>Time</th>
                </tr>
              </thead>
              <tbody>
                {log.map((l, i) => (
                  <tr key={`${l.qid}-${i}`}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={S.td}>{FORMAT_NAME[l.format] || l.format} · L{l.level}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: l.correct ? C.green : C.red }}>
                      {l.correct ? "Right" : "Wrong"}
                    </td>
                    <td style={S.td}>{l.tag ? (TAGS[l.tag]?.name || l.tag) : "none"}</td>
                    <td style={S.td}>{l.rule || "none"}</td>
                    <td style={S.td}>{(l.timeMs / 1000).toFixed(1)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ height: 16 }} />
      <div style={S.bar}>
        <button type="button" style={S.primary} onClick={onRestart}>Start a new session</button>
      </div>
    </div></div>
  );
}
