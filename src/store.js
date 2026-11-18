// Session persistence for the tenses tutor.
// All localStorage access is wrapped in try/catch: storage can be blocked,
// full, or disabled (private mode), and the app must keep working without it.

export const SESSION_SECONDS = 600;
export const STORAGE_KEY = "et617_23b1216_session";
const TOTAL_TASKS = 8;

export function newSession() {
  return {
    startedAt: Date.now(),
    secondsLeft: SESSION_SECONDS,
    taskIndex: 0,
    level: 1,
    streakCorrect: 0,
    wrongByTag: { M1: 0, M2: 0, form: 0, marker: 0 },
    askedIds: [],
    log: [],
  };
}

function isNum(n) {
  return typeof n === "number" && Number.isFinite(n);
}

// Structural check so a corrupt or hand-edited value never reaches the engine.
function isValidSession(s) {
  if (!s || typeof s !== "object") return false;
  if (!isNum(s.startedAt) || !isNum(s.secondsLeft)) return false;
  if (!isNum(s.taskIndex) || s.taskIndex < 0) return false;
  if (![1, 2, 3].includes(s.level)) return false;
  if (!isNum(s.streakCorrect)) return false;
  const w = s.wrongByTag;
  if (!w || typeof w !== "object") return false;
  for (const k of ["M1", "M2", "form", "marker"]) {
    if (!isNum(w[k])) return false;
  }
  if (!Array.isArray(s.askedIds) || !Array.isArray(s.log)) return false;
  return true;
}

function isFinished(s) {
  return s.secondsLeft <= 0 || s.taskIndex >= TOTAL_TASKS;
}

export function saveSession(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// Returns the saved session, or null if missing, corrupt, or finished.
export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!isValidSession(s)) return null;
    if (isFinished(s)) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}