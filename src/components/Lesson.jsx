import { useState } from "react";

const C = {
  bg: "#F2F5F9", card: "#FFFFFF", ink: "#14213D", mute: "#51607A", line: "#C9D3E1",
  teal: "#0F766E", tealSoft: "#DDF3F0", blue: "#1D4ED8", blueSoft: "#E4ECFD",
  red: "#B42318", redSoft: "#FDE8E6", green: "#18794E", greenSoft: "#E3F5EA",
};

const S = {
  outer: { background: C.bg, minHeight: "100dvh", color: C.ink,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", lineHeight: 1.45 },
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100dvh", display: "flex",
    flexDirection: "column", padding: "16px 16px 0", boxSizing: "border-box" },
  h: { fontSize: 22, margin: "0 0 4px" },
  sub: { color: C.mute, fontSize: 15, margin: "0 0 14px" },
  card: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, boxSizing: "border-box" },
  bar: { position: "sticky", bottom: 0, background: C.bg, borderTop: `1px solid ${C.line}`,
    padding: "12px 0 16px", marginTop: "auto", display: "grid", gap: 10 },
  primary: { width: "100%", minHeight: 56, fontSize: 18, fontWeight: 700, borderRadius: 12,
    border: "none", color: "#fff", background: C.teal, cursor: "pointer" },
};

/* ---------- timeline ---------- */
function Diagram({ mode }) {
  const past = mode === "past";
  return (
    <svg viewBox="0 0 340 200" role="img"
      aria-label={past
        ? "Timeline: an event in finished time, separated from NOW"
        : "Timeline: an event with an arc connecting it to NOW"}
      style={{ width: "100%", height: "auto", display: "block" }}>
      {past
        ? <rect x="16" y="72" width="206" height="72" rx="10" fill={C.blueSoft} />
        : <rect x="96" y="72" width="154" height="72" rx="10" fill={C.tealSoft} />}
      <line x1="16" y1="108" x2="250" y2="108" stroke={C.ink} strokeWidth="3" />
      <line x1="250" y1="108" x2="318" y2="108" stroke={C.ink} strokeWidth="3" strokeDasharray="6 6" />
      <polygon points="326,108 316,102 316,114" fill={C.ink} />
      <text x="24" y="98" fontSize="12" fill={C.mute}>past</text>
      <text x="296" y="98" fontSize="12" fill={C.mute}>future</text>
      <line x1="250" y1="46" x2="250" y2="152" stroke={C.red} strokeWidth="3" />
      <text x="250" y="38" textAnchor="middle" fontSize="15" fontWeight="700" fill={C.red}>NOW</text>
      {!past && <path d="M 96 100 Q 173 36 244 100" fill="none" stroke={C.teal} strokeWidth="3" />}
      {!past && <polygon points="246,102 236,96 238,106" fill={C.teal} />}
      <circle cx="96" cy="108" r="8" fill={past ? C.blue : C.teal} />
      <text x="96" y="134" textAnchor="middle" fontSize="13" fontWeight="600" fill={C.ink}>
        {past ? "yesterday" : "some time ago"}
      </text>
      <text x={past ? 119 : 173} y="176" textAnchor="middle" fontSize="15" fontWeight="700"
        fill={past ? C.blue : C.teal}>
        {past ? "finished time" : "connected to now"}
      </text>
      {past && <text x="236" y="134" fontSize="12" fill={C.mute}>gap</text>}
    </svg>
  );
}

function Timeline({ onDone }) {
  const [mode, setMode] = useState("past");
  const past = mode === "past";
  const tab = (key, text, color) => (
    <button type="button" aria-pressed={mode === key} onClick={() => setMode(key)}
      style={{ flex: 1, minHeight: 52, fontSize: 16, fontWeight: 700, borderRadius: 12, cursor: "pointer",
        border: `2px solid ${color}`, color: mode === key ? "#fff" : color,
        background: mode === key ? color : "#fff" }}>
      {text}
    </button>
  );
  return (
    <div style={S.outer}><div style={S.page}>
      <h2 style={S.h}>Finished time or connected to now?</h2>
      <p style={S.sub}>Tap each button and watch the timeline change.</p>
      <div style={S.card}><Diagram mode={mode} /></div>
      <div style={{ ...S.card, marginTop: 12, borderColor: past ? C.blue : C.teal, borderWidth: 2 }}>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          {past ? "I saw him yesterday." : "I have seen him. (He is still around.)"}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 16 }}>
          {past
            ? "Simple past: the time is finished (yesterday, last year, in 2019). It stays on the past side of NOW."
            : "Present perfect: no finished time is named, and the action still matters now (a result, an experience, or something still true)."}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 15, color: C.mute }}>
          {past
            ? "Never write: I have seen him yesterday."
            : "For something still true: I have lived here for 5 years (not: I lived here for 5 years)."}
        </p>
      </div>
      <div style={{ height: 16 }} />
      <div style={S.bar}>
        <div style={{ display: "flex", gap: 10 }}>
          {tab("past", "Finished time", C.blue)}
          {tab("perfect", "Connected to now", C.teal)}
        </div>
        <button type="button" style={S.primary} onClick={onDone}>Got it, back to the tasks</button>
      </div>
    </div></div>
  );
}

/* ---------- sorting activities ---------- */
const PARTICIPLES = {
  title: "Sort the verb forms",
  intro: "Is this the simple past, or the form we use after have/has?",
  A: "Simple past", B: "After have/has",
  items: [
    { text: "went", side: "A", why: "went is the simple past of go. After have/has we say gone." },
    { text: "seen", side: "B", why: "seen goes after have/has: I have seen. The simple past is saw." },
    { text: "wrote", side: "A", why: "wrote is the simple past. After have/has we say written." },
    { text: "taken", side: "B", why: "taken goes after have/has. The simple past is took." },
    { text: "did", side: "A", why: "did is the simple past. After have/has we say done." },
    { text: "eaten", side: "B", why: "eaten goes after have/has. The simple past is ate." },
    { text: "saw", side: "A", why: "saw is the simple past. After have/has we say seen." },
    { text: "done", side: "B", why: "done goes after have/has: I have done it." },
  ],
};

const MARKERS = {
  title: "Sort the time words",
  intro: "Which tense does this time word usually go with?",
  A: "Simple past", B: "Present perfect",
  items: [
    { text: "yesterday", side: "A", why: "Yesterday is finished time, so use the simple past." },
    { text: "just", side: "B", why: "just links a recent action to now: I have just finished." },
    { text: "in 2019", side: "A", why: "A named finished year takes the simple past." },
    { text: "already", side: "B", why: "already points to now: I have already eaten." },
    { text: "last week", side: "A", why: "last week is finished time, so use the simple past." },
    { text: "so far", side: "B", why: "so far means up to now: I have scored three goals so far." },
    { text: "three days ago", side: "A", why: "ago counts back from now to a finished moment: simple past." },
    { text: "since Monday", side: "B", why: "since starts in the past and runs to now: I have been here since Monday." },
    { text: "yet", side: "B", why: "yet looks at now: Have you finished yet?" },
    { text: "for 5 years (and still true)", side: "B", why: "A duration that continues now needs the present perfect: I have lived here for 5 years." },
  ],
};

function Sorter({ cfg, onDone }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const finished = i >= cfg.items.length;
  const item = cfg.items[i];
  const color = { A: C.blue, B: C.teal };

  function pick(side) {
    setPicked(side);
    if (side === item.side) setScore((s) => s + 1);
  }
  function next() { setPicked(null); setI((n) => n + 1); }

  const choice = (side) => (
    <button key={side} type="button" onClick={() => pick(side)}
      style={{ minHeight: 56, fontSize: 18, fontWeight: 700, borderRadius: 12, cursor: "pointer",
        border: "none", color: "#fff", background: color[side] }}>
      {cfg[side]}
    </button>
  );

  return (
    <div style={S.outer}><div style={S.page}>
      <h2 style={S.h}>{cfg.title}</h2>
      <p style={S.sub}>{cfg.intro}</p>

      {!finished ? (
        <>
          <p style={{ color: C.mute, fontSize: 14, margin: "0 0 8px" }}>
            Card {i + 1} of {cfg.items.length}
          </p>
          <div style={{ ...S.card, textAlign: "center", padding: "32px 16px" }}>
            <p style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{item.text}</p>
          </div>
          {picked && (
            <div role="status" style={{ marginTop: 12, borderRadius: 12, padding: 16,
              background: picked === item.side ? C.greenSoft : C.redSoft,
              border: `2px solid ${picked === item.side ? C.green : C.red}` }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: picked === item.side ? C.green : C.red }}>
                {picked === item.side ? "Right" : `Not quite: it goes with "${cfg[item.side]}"`}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 16 }}>{item.why}</p>
            </div>
          )}
        </>
      ) : (
        <div style={{ ...S.card, textAlign: "center", padding: "28px 16px" }}>
          <p style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>{score} / {cfg.items.length}</p>
          <p style={{ margin: "8px 0 0", fontSize: 17 }}>
            {score === cfg.items.length ? "Perfect sort. Time to use it." : "Good effort. Keep these in mind in the next task."}
          </p>
        </div>
      )}

      <div style={{ height: 16 }} />
      <div style={S.bar}>
        {finished ? (
          <button type="button" style={S.primary} onClick={onDone}>Back to the tasks</button>
        ) : picked ? (
          <button type="button" style={S.primary} onClick={next}>
            {i + 1 === cfg.items.length ? "See my score" : "Next card"}
          </button>
        ) : (
          <>{choice("A")}{choice("B")}</>
        )}
      </div>
    </div></div>
  );
}

export default function Lesson({ lessonId, onDone }) {
  if (lessonId === "timeline") return <Timeline onDone={onDone} />;
  if (lessonId === "participles") return <Sorter key="p" cfg={PARTICIPLES} onDone={onDone} />;
  if (lessonId === "markers") return <Sorter key="m" cfg={MARKERS} onDone={onDone} />;
  return (
    <div style={S.outer}><div style={S.page}>
      <h2 style={S.h}>Lesson not found</h2>
      <div style={S.bar}><button type="button" style={S.primary} onClick={onDone}>Back to the tasks</button></div>
    </div></div>
  );
}
