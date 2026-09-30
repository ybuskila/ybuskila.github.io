// אתר הפורטפוליו - תפריט, חיפוש, סינון (אישי), הפעלה ובדיקת מערכת (אישי).
// כל תוכן שמגיע מנתונים, מהמשתמש או מתהליך - textContent בלבד, לעולם לא innerHTML.
(function () {
  'use strict';
  var root = document.body.getAttribute('data-root') || '';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  // --- "פרויקטים ▾"
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('projmenu');
  function setMenu(open, focusFirst) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open && focusFirst) menu.querySelector('a').focus();
  }
  menuBtn.addEventListener('click', function () { setMenu(menu.hidden, false); });
  menuBtn.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setMenu(true, true); }
  });
  menu.addEventListener('keydown', function (e) {
    var links = Array.prototype.slice.call(menu.querySelectorAll('a'));
    var i = links.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
    else if (e.key === 'Escape') { setMenu(false); menuBtn.focus(); }
  });
  menu.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('click', function (e) {
    if (!menu.hidden && !e.target.closest('.menu')) setMenu(false);
  });

  // --- חיפוש: שם (עברית ואנגלית) · תפקיד · סוג · מטרה
  var box = document.querySelector('.search');
  var input = document.getElementById('q');
  var list = document.getElementById('results');
  var count = document.getElementById('results-count');
  var toggle = document.querySelector('.search-toggle');
  var active = -1, hits = [];

  function norm(s) { return (s || '').toLowerCase(); }
  function search(q) {
    var n = norm(q.trim());
    if (!n) return [];
    return (window.SEARCH_INDEX || []).filter(function (it) {
      return [it.name, it.id.replace(/-/g, ' '), it.id, it.role, it.kind, it.purpose].some(function (f) {
        return norm(f).indexOf(n) >= 0;
      });
    }).slice(0, 8);
  }
  function go(item) { window.location.href = root + item.id + '/'; }
  function select(i) {
    var items = list.querySelectorAll('[role="option"]');
    active = i;
    Array.prototype.forEach.call(items, function (li, k) { li.setAttribute('aria-selected', String(k === i)); });
    if (items[i]) input.setAttribute('aria-activedescendant', items[i].id);
    else input.removeAttribute('aria-activedescendant');
  }
  function render() {
    var q = input.value;
    hits = search(q);
    list.textContent = '';
    active = -1;
    input.removeAttribute('aria-activedescendant');
    if (!q.trim()) {
      list.hidden = true; input.setAttribute('aria-expanded', 'false'); count.textContent = '';
      return;
    }
    hits.forEach(function (it, i) {
      var li = el('li'); li.id = 'opt-' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', 'false');
      var name = el('div', null, it.name + (it.role ? ' · ' + it.role : ''));
      if (it.hidden) { var f = el('span', 'flag', 'מוסתר'); name.appendChild(f); }
      li.appendChild(name);
      li.appendChild(el('div', 't', it.kind + (it.purpose ? ' · ' + it.purpose.slice(0, 60) + (it.purpose.length > 60 ? '…' : '') : '')));
      li.addEventListener('mousedown', function (e) { e.preventDefault(); go(it); });
      list.appendChild(li);
    });
    if (!hits.length) {
      var none = el('li', 'none');
      none.appendChild(document.createTextNode('לא נמצא "' + q.trim() + '". '));
      var a = el('a', null, 'כל הפרויקטים ←'); a.href = root + 'projects/';
      none.appendChild(a);
      list.appendChild(none);
    }
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    count.textContent = hits.length ? hits.length + ' תוצאות' : 'לא נמצא';
  }
  function closeSearch(clear) {
    if (clear) input.value = '';
    list.hidden = true; input.setAttribute('aria-expanded', 'false');
    if (clear && box.classList.contains('open')) { box.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
  }
  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' && hits.length) { e.preventDefault(); select((active + 1) % hits.length); }
    else if (e.key === 'ArrowUp' && hits.length) { e.preventDefault(); select((active - 1 + hits.length) % hits.length); }
    else if (e.key === 'Enter' && hits.length) { e.preventDefault(); go(hits[active >= 0 ? active : 0]); }
    else if (e.key === 'Escape') { e.preventDefault(); closeSearch(true); }
  });
  input.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement !== input) list.hidden = true; }, 150); });
  input.addEventListener('focus', function () { if (input.value.trim()) render(); });
  toggle.addEventListener('click', function () {
    var open = !box.classList.contains('open');
    box.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) input.focus(); else closeSearch(true);
  });

})();
