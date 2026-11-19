/* בניית צמתים בלי innerHTML: כל טקסט נכנס כצומת טקסט. מאב-הטיפוס (visual-foundation.html).
   flat(Infinity) ומסנן ריקים - רכיב שמחזיר null או מערך בתוך מערך לא נכנס למסך (L-14). */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function icon(id, flip) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('class', 'ic' + (flip ? ' flip' : ''));
  s.setAttribute('aria-hidden', 'true');
  const u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  u.setAttribute('href', '#' + id);
  s.append(u);
  return s;
}

export const num = t => h('span', { class: 'num' }, t);
