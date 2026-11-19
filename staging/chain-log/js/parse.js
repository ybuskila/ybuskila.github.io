/* קריאת log.md - פונקציות טהורות, בלי DOM, כדי שאפשר לבדוק אותן ב-node.
   הצורה שהדף מניח: handoff-chain-log.md, סעיף 2ב. */

export const TYPES = ['פעולה', 'מחכה לירון', 'ירון אישר', 'ירון העיר', 'בצלאל אישר', 'בצלאל החזיר'];
export const NEED_REASON = ['בצלאל אישר', 'בצלאל החזיר'];
export const WAIT_GROUP = ['מחכה לירון', 'ירון אישר', 'ירון העיר'];
const ANSWERS = ['ירון אישר', 'ירון העיר'];

const TIME_RE = /^(\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2})$/;
const HEADER_RE = /^\|\s*זמן\s*\|/;
const SEPARATOR_RE = /^\|[\s:|-]+$/;

/* "\|" בתוך תא הוא התו עצמו, לא גבול תא */
function cells(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map(c => c.replace(/\\\|/g, '|').trim());
}

export function parseLog(text) {
  const lines = String(text).replace(/^﻿/, '').split(/\r?\n/);
  const out = { run: null, root: null, hasTable: false, rows: [] };

  const first = lines.find(l => l.trim() !== '');
  if (first && first.startsWith('# ')) {
    const i = first.indexOf(' - ');
    if (i !== -1) out.run = first.slice(i + 3).trim() || null;
  }
  const rootLine = lines.find(l => /^>\s*שורש:/.test(l));
  if (rootLine) out.root = rootLine.replace(/^>\s*/, '').trim();

  const h = lines.findIndex(l => HEADER_RE.test(l.trim()));
  if (h === -1 || !SEPARATOR_RE.test((lines[h + 1] || '').trim())) return out;
  out.hasTable = true;

  let lastDate = '';
  for (const line of lines.slice(h + 2)) {
    if (!line.trim().startsWith('|')) continue;
    const n = out.rows.length + 1;
    const c = cells(line);
    const flags = [];
    if (c.length !== 5) {
      const m = TIME_RE.exec(c[0] || '');
      if (m) lastDate = m[1];
      out.rows.push({ n, date: m ? m[1] : lastDate, time: m ? m[2] : (c[0] || ''), stamp: c[0] || '',
        agent: c[1] || '', what: line.trim(), type: '', reason: '', known: false, flags: ['מספר עמודות'] });
      continue;
    }
    const [stamp, agent, what, type, reason] = c;
    const m = TIME_RE.exec(stamp);
    if (m) lastDate = m[1]; else flags.push('זמן');
    if (!agent) flags.push('חסר סוכן');
    const known = TYPES.includes(type);
    if (!type) flags.push('חסר סוג'); else if (!known) flags.push('סוג לא מוכר');
    out.rows.push({ n, date: m ? m[1] : lastDate, time: m ? m[2] : stamp, stamp, agent, what, type, reason, known, flags });
  }
  return out;
}

/* שער פתוח: "מחכה לירון" שאחריה עוד לא נרשמה "ירון אישר" / "ירון העיר".
   כל תשובה סוגרת את השער הפתוח האחרון שלפניה. תשובה בלי שער פתוח - רשומה רגילה. */
export function gates(rows) {
  const ans = new Map(), stack = [];
  for (const r of rows) {
    if (!r.known) continue;
    if (r.type === 'מחכה לירון') { stack.push(r); ans.set(r.n, []); }
    else if (ANSWERS.includes(r.type) && stack.length) ans.get(stack.pop().n).push(r);
  }
  return { open: stack, ans };
}

export function applyFilter(rows, kind, agent) {
  return rows.filter(r =>
    (agent === 'all' || r.agent === agent) &&
    (kind === 'all' || (kind === 'waits' ? WAIT_GROUP.includes(r.type) : NEED_REASON.includes(r.type))));
}

export const missingReason = r => r.known && NEED_REASON.includes(r.type) && !r.reason;
