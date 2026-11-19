/* לוג השרשרת - המסך. מבוסס על render() ו-timeline() של visual-foundation.html, על הלוג האמיתי. */
import { h, icon, num } from './h.js';
import { NEED_REASON, gates, applyFilter, missingReason } from './parse.js';
import { loadLog, LOG_SOURCE } from './data.js';

/* מושג אחד = אייקון אחד. chip: null = טקסט שקט (פעולה) */
const TYPE_LOOK = {
  'פעולה':       { ic: 'i-dot',     chip: null },
  'מחכה לירון':  { ic: 'i-clock',   chip: 'wait' },
  'ירון אישר':   { ic: 'i-check',   chip: 'ok' },
  'ירון העיר':   { ic: 'i-comment', chip: 'again' },
  'בצלאל אישר':  { ic: 'i-check',   chip: 'ok' },
  'בצלאל החזיר': { ic: 'i-return',  chip: 'again', flip: true },
};
const AV = { 'בצלאל': 'b', 'מייה': 'm', 'חירם': 'h' };
const KIND_LABEL = { waits: 'חיכתה לך', bezalel: 'החלטות בצלאל' };

const S = { phase: 'loading', log: null, error: '', kind: 'all', agent: 'all', target: null };

const flagEl = text => h('span', { class: 'flag' }, icon('i-note'), text);

/* התג בקצה השורה: סוג מוכר ← תג; אחרת ← הסימון שמחליף אותו */
function typeEl(row) {
  const t = TYPE_LOOK[row.type];
  if (row.known && t) return h('span', { class: t.chip ? 'chip ' + t.chip : 'type' }, icon(t.ic, t.flip), row.type);
  const main = row.flags.find(f => f === 'מספר עמודות' || f === 'חסר סוג' || f === 'סוג לא מוכר');
  return flagEl('שורה לא בפורמט: ' + main);
}
/* סימונים נוספים (זמן, חסר סוכן) - בשורה עצמה, לא מוסתרים */
function extraFlags(row) {
  const rest = row.flags.filter(f => f === 'זמן' || f === 'חסר סוכן');
  if (!rest.length) return null;
  return h('div', { class: 'flags' }, rest.map(f => flagEl('שורה לא בפורמט: ' + f)));
}
function reasonEl(row) {
  if (row.reason) return h('div', { class: 'reason' }, h('b', {}, 'נימוק: '), row.reason);
  if (missingReason(row)) return h('div', {}, flagEl('חסר נימוק'));
  return null;
}
const who = row => row.agent || '?';

function setStatus(t) {
  const el = document.getElementById('status');
  if (el.textContent !== t) el.textContent = t;
}
function resetFilter() { S.kind = 'all'; S.agent = 'all'; S.target = null; render(); }
function jump(n) { S.kind = 'all'; S.agent = 'all'; S.target = n; render(); }

function header(log) {
  const bar = document.getElementById('bar');
  const run = S.phase === 'ready' && log.run ? h('span', { class: 'run' }, log.run) : null;
  bar.replaceChildren(h('div', { class: 'bar-in' }, h('h1', {}, 'לוג השרשרת'), run));
}

function render() {
  const app = document.getElementById('app');
  const log = S.log;
  header(log);

  if (S.phase === 'loading') {
    return app.replaceChildren(h('div', { class: 'state', 'aria-live': 'polite' }, h('p', {}, 'קורא את הלוג...')));
  }
  if (S.phase === 'error') {
    return app.replaceChildren(h('div', { class: 'state', role: 'alert' },
      h('p', {}, h('b', {}, 'לא הצלחתי לקרוא את הלוג.'), ' ', S.error),
      h('p', {}, 'הקובץ: ', h('code', { dir: 'ltr' }, LOG_SOURCE)),
      h('button', { class: 'btn', type: 'button', onclick: start }, icon('i-retry'), 'לנסות שוב')));
  }

  const rows = log.rows;
  if (!rows.length) {
    return app.replaceChildren(h('div', { class: 'state' },
      h('p', {}, h('b', {}, 'הלוג ריק - עוד לא נרשמה שורה.')),
      h('p', {}, 'השורה הראשונה נרשמת כשבצלאל מקבל משימת שורש.')));
  }

  const kids = [];
  const last = rows[rows.length - 1];
  kids.push(h('p', { class: 'meta' },
    log.root ? h('span', {}, log.root) : null,
    h('span', {}, 'נכון ל-', num(last.stamp), ' · ', num(rows.length), ' שורות')));

  const G = gates(rows);
  for (const g of G.open) {
    kids.push(h('section', { class: 'waiting', 'aria-label': 'מחכה לך עכשיו' },
      h('span', { class: 'lbl' }, icon('i-clock'), 'מחכה לך עכשיו'),
      h('span', { class: 'what' }, 'מאז ', num(g.time), ' · ', g.what),
      h('button', { class: 'btn primary', type: 'button', onclick: () => jump(g.n) }, icon('i-down'), 'מעבר לשורה ', num(g.n))));
  }

  const nWait = rows.filter(r => r.known && r.type === 'מחכה לירון').length;
  const nBez = rows.filter(r => r.known && NEED_REASON.includes(r.type)).length;
  const agents = [...new Set(rows.map(r => r.agent).filter(Boolean))];
  const tag = (kind, label, n) => h('button', {
    class: 'tag', type: 'button', 'aria-pressed': String(S.kind === kind),
    onclick: () => { S.kind = S.kind === kind && kind !== 'all' ? 'all' : kind; S.target = null; render(); },
  }, label + ' ', '(', num(n), ')');
  kids.push(h('div', { class: 'controls' },
    tag('all', 'הכל', rows.length), tag('waits', 'חיכתה לך', nWait), tag('bezalel', 'החלטות בצלאל', nBez),
    h('label', {}, h('span', { class: 'lbl-txt' }, 'סוכן'),
      h('select', { 'aria-label': 'סינון לפי סוכן', onchange: e => { S.agent = e.target.value; S.target = null; render(); } },
        h('option', { value: 'all', selected: S.agent === 'all' }, 'כל הסוכנים'),
        agents.map(a => h('option', { value: a, selected: S.agent === a }, a))))));

  const filtered = S.kind !== 'all' || S.agent !== 'all';
  const shown = applyFilter(rows, S.kind, S.agent);
  /* אזור הכרזה קבוע מחוץ ל-#app; הלוג עצמו לא live (ux-design.md, שלב 8, נ-2) */
  setStatus(filtered ? 'מסונן: ' + shown.length + ' מתוך ' + rows.length + ' שורות' : 'מוצגות כל ' + rows.length + ' השורות');
  if (filtered) {
    const parts = [S.agent !== 'all' ? S.agent : null, KIND_LABEL[S.kind] || null].filter(Boolean);
    kids.push(h('div', { class: 'filtered' }, 'מסונן: ', parts.join(' · '), ' · ', num(shown.length), ' מתוך ', num(rows.length),
      h('button', { class: 'linkbtn', type: 'button', onclick: resetFilter }, 'הצג הכל')));
  }
  if (!shown.length) {
    kids.push(h('div', { class: 'state' },
      h('p', {}, 'אין שורות של ', S.agent !== 'all' ? S.agent : 'אף סוכן', ' בסינון הזה.'),
      h('button', { class: 'btn', type: 'button', onclick: resetFilter }, 'הצג הכל')));
    return app.replaceChildren(...kids);
  }

  kids.push(h('div', { class: 'log' }, timeline(shown, G)));
  app.replaceChildren(...kids);
  if (S.target) {
    const el = document.getElementById('r-' + S.target);
    if (el) { el.classList.add('target'); el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true }); }
  }
}

const byDay = rows => rows.reduce((m, r) => (m.has(r.date) || m.set(r.date, []), m.get(r.date).push(r), m), new Map());

function timeline(rows, G) {
  const openSet = new Set(G.open.map(g => g.n));
  const gateOf = new Map();
  for (const [gn, list] of G.ans) for (const x of list) gateOf.set(x.n, gn);
  const shownSet = new Set(rows.map(r => r.n));
  const out = [];
  for (const [d, rs] of byDay(rows)) {
    if (d) out.push(h('h2', { class: 'day' }, num(d)));
    let seg = null;
    const flush = () => { if (seg && seg.childElementCount) out.push(seg); seg = null; };
    for (const r of rs) {
      if (r.known && r.type === 'מחכה לירון') {
        flush();
        const isOpen = openSet.has(r.n);
        const g = h('section', { class: 'gate' + (isOpen ? ' is-open' : ''), id: 'r-' + r.n, tabindex: '-1', 'aria-label': 'שער, שורה ' + r.n },
          h('div', { class: 'gh' }, typeEl(r), isOpen ? h('span', { class: 'open-mark' }, 'פתוח') : null,
            h('span', { class: 'when' }, '#', num(r.n), ' · ', num(r.time), ' · ', who(r))),
          h('p', { class: 'gtxt' }, r.what), reasonEl(r), extraFlags(r));
        for (const x of (G.ans.get(r.n) || []).filter(x => shownSet.has(x.n))) {
          g.append(h('div', { class: 'ans', id: 'r-' + x.n, tabindex: '-1' },
            typeEl(x), h('span', { class: 'when' }, '#', num(x.n), ' · ', num(x.time), ' · נרשם בידי ', who(x)),
            h('span', { class: 'txt' }, x.what), reasonEl(x), extraFlags(x)));
        }
        if (isOpen) g.append(h('div', { class: 'pending' }, icon('i-clock'), 'עוד לא נרשמה תשובה של ירון'));
        out.push(g);
        continue;
      }
      /* תשובה שהשער שלה מוצג - כבר בתוך השער */
      if (gateOf.has(r.n) && shownSet.has(gateOf.get(r.n))) continue;
      if (!seg) seg = h('ol', { class: 'seg', start: r.n });
      seg.append(h('li', { class: 'ent', id: 'r-' + r.n, value: r.n, tabindex: '-1' },
        h('span', { class: 'av ' + (AV[r.agent] || 'x'), 'aria-hidden': 'true' }, who(r).slice(0, 1)),
        h('div', {},
          h('div', { class: 'l1' }, h('span', { class: 'who' }, who(r)), h('span', { class: 'when' }, num(r.time), ' · #', num(r.n)), typeEl(r)),
          h('div', { class: 'what' }, r.what), reasonEl(r), extraFlags(r))));
    }
    flush();
  }
  return out;
}

async function start() {
  S.phase = 'loading'; S.target = null; render();
  try {
    S.log = await loadLog();
    S.phase = 'ready';
  } catch (e) {
    S.phase = 'error';
    S.error = e.reason || 'שגיאה לא צפויה בקריאת הקובץ.';
  }
  render();
}

start();
