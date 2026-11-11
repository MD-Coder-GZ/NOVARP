/*!
 * NOVA RP — поиск по правилам (search.js)
 * Подключение: одна строка перед </body> в index.html:
 *   <script src="search.js" defer></script>
 * Движок работает с текущей разметкой: #search, #content, article > h2 + div.body.
 * Пока поиск не используется, страница остаётся полностью статичной.
 */
(function () {
  'use strict';

  var input = document.getElementById('search');
  var content = document.getElementById('content');
  if (!input || !content) return;

  var controls = document.getElementById('controls');
  var clearBtn = document.getElementById('clear');
  var printBtn = document.getElementById('print');
  var nav = document.querySelector('aside nav');
  var note = document.querySelector('aside p.small');

  /* ---------- утилиты ---------- */

  function esc(s) {
    return s.replace(/[&<>]/g, function (c) {
      return { '&': '&', '<': '<', '>': '>' }[c];
    });
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function norm(s) { return s.toLowerCase().replace(/ё/g, 'е'); }

  var style = document.createElement('style');
  style.textContent = [
    '.search-stats{font-size:13px;color:#bcb5a8;margin:2px 0 14px}',
    '.search-stats b{color:#d5b77a}',
    'mark{background:#d5b77a55;color:#fff;border-radius:3px;padding:0 1px}',
    'nav a .cnt{float:right;font-size:12px;color:#d5b77a}',
    'nav a.is-dim{opacity:.35}',
    '.pt{border-left:2px solid #d5b77a30;margin:0 0 14px;padding:2px 0 2px 14px;white-space:pre-wrap;overflow-wrap:anywhere;color:#d9d2c7}',
    '.pt-hit{border-left-color:#d5b77a}',
    '.show-all{background:none;border:none;color:#d5b77a;font-size:13px;text-decoration:underline;cursor:pointer;padding:4px 0;display:inline}'
  ].join('');
  document.head.appendChild(style);

  /* ---------- индекс разделов и пунктов ---------- */

  var INDEX = [];
  var built = false;
  var POINT_RE = /^([1-9](?:\.\d{1,3}){0,2})[.)]?\s/;

  function buildIndex() {
    if (built) return;
    built = true;
    var arts = content.querySelectorAll('article');
    Array.prototype.forEach.call(arts, function (art) {
      var bodyEl = art.querySelector('.body');
      if (!bodyEl) return;
      var groups = [], cur = null;
      bodyEl.textContent.split(/\n\s*\n/).forEach(function (p) {
        p = p.trim();
        if (!p) return;
        var m = p.match(POINT_RE);
        if (m) {
          cur = { num: m[1], text: p };
          groups.push(cur);
        } else if (cur) {
          cur.text += '\n\n' + p;
        } else {
          cur = { num: null, text: p };
          groups.push(cur);
        }
      });
      groups.forEach(function (g) { g.norm = norm(g.text); });
      var h2 = art.querySelector('h2');
      INDEX.push({
        id: art.id,
        title: h2 ? h2.textContent : art.id,
        tnorm: h2 ? norm(h2.textContent) : '',
        el: art,
        bodyEl: bodyEl,
        origHTML: bodyEl.innerHTML,
        groups: groups
      });
    });
  }

  /* ---------- подсветка ---------- */

  var re = null;

  function hl(text) {
    if (!re) return esc(text);
    var parts = text.split(re), out = '';
    for (var i = 0; i < parts.length; i++) {
      out += (i % 2) ? '<mark>' + esc(parts[i]) + '</mark>' : esc(parts[i]);
    }
    return out;
  }

  /* ---------- поиск ---------- */

  function parsePointQuery(q) {
    var m = q.replace(/^\s*(?:п\.|пункт)\s*/i, '').match(/^(\d{1,2}(?:\.\d{1,3}){0,2})\.?\??$/);
    return (m && m[1].indexOf('.') > -1) ? m[1] : null;
  }

  function searchPoint(num) {
    var hits = [];
    INDEX.forEach(function (sec, si) {
      sec.groups.forEach(function (g, gi) {
        if (g.num === num) hits.push([si, gi]);
        else if (g.num && g.num.indexOf(num + '.') === 0) hits.push([si, gi]);
      });
    });
    return hits.length ? hits : null;
  }

  function searchWords(q) {
    var tokens = norm(q).split(/[\s,;.]+/).filter(Boolean);
    if (!tokens.length) return null;
    var alts = tokens.map(function (t) {
      return escRe(t.replace(/ё/g, 'е')).replace(/е/g, '[её]');
    });
    re = new RegExp('(' + alts.join('|') + ')', 'gi');
    return INDEX.map(function (sec) {
      var matched = [];
      sec.groups.forEach(function (g, gi) {
        if (tokens.every(function (t) { return g.norm.indexOf(t) > -1; })) matched.push(gi);
      });
      return {
        matched: matched,
        titleHit: tokens.every(function (t) { return sec.tnorm.indexOf(t) > -1; })
      };
    });
  }

  /* ---------- отрисовка ---------- */

  var statsEl = null;

  function stats(html) {
    if (!statsEl) {
      statsEl = document.createElement('p');
      statsEl.className = 'search-stats';
      input.parentNode.insertBefore(statsEl, input.nextSibling);
    }
    statsEl.innerHTML = html;
  }

  function restoreBody(sec) { sec.bodyEl.innerHTML = sec.origHTML; }

  function renderGroups(sec, gis) {
    var frag = document.createDocumentFragment();
    gis.forEach(function (gi) {
      var g = sec.groups[gi];
      var d = document.createElement('div');
      d.className = 'pt pt-hit';
      if (g.num) {
        d.innerHTML =
          '<span style="color:#d5b77a;font-weight:600">' + esc(g.num) + ' </span>' +
          hl(g.text.replace(new RegExp('^' + escRe(g.num) + '[.)]?\\s*'), ''));
      } else {
        d.innerHTML = hl(g.text);
      }
      frag.appendChild(d);
    });
    if (gis.length < sec.groups.length) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'show-all';
      b.textContent = 'Показать раздел целиком (скрыто: ' + (sec.groups.length - gis.length) + ')';
      b.addEventListener('click', function () {
        restoreBody(sec);
        sec.el.hidden = false;
        setBadge(sec, null);
      });
      frag.appendChild(b);
    }
    sec.bodyEl.innerHTML = '';
    sec.bodyEl.appendChild(frag);
    sec.el.hidden = false;
  }

  function setBadge(sec, n) {
    if (!nav) return;
    var link = nav.querySelector('a[href="#' + sec.id + '"]');
    if (!link) return;
    var c = link.querySelector('.cnt');
    if (n === null) {
      link.classList.remove('is-dim');
      if (c) c.remove();
      return;
    }
    link.classList.toggle('is-dim', !n);
    if (n) {
      if (!c) { c = document.createElement('span'); c.className = 'cnt'; link.appendChild(c); }
      c.textContent = n === true ? '★' : n;
    } else if (c) c.remove();
  }

  /* ---------- запуск и сброс ---------- */

  var wasEmpty = true;

  function run() {
    buildIndex();
    var v = input.value.trim();
    if (!v) { reset(); return; }

    var secHits = 0, ptHits = 0, firstEl = null;
    var point = parsePointQuery(v);
    var hits = point ? searchPoint(point) : null;

    if (hits) {
      re = new RegExp('(' + escRe(point) + ')', 'g');
      var map = {};
      hits.forEach(function (h) { (map[h[0]] = map[h[0]] || []).push(h[1]); });
      INDEX.forEach(function (sec, si) {
        var gis = map[si];
        if (!gis) { sec.el.hidden = true; setBadge(sec, 0); return; }
        secHits++;
        ptHits += gis.length;
        renderGroups(sec, gis);
        setBadge(sec, gis.length);
        if (!firstEl) firstEl = sec.el;
      });
      stats('Пункт <b>' + esc(point) + '</b>: совпадений — <b>' + ptHits + '</b>, разделов — <b>' + secHits + '</b>');
    } else {
      var res = searchWords(v);
      if (!res) { reset(); return; }
      INDEX.forEach(function (sec, si) {
        var r = res[si];
        if (!r.matched.length && !r.titleHit) { sec.el.hidden = true; setBadge(sec, 0); return; }
        secHits++;
        if (r.matched.length) {
          ptHits += r.matched.length;
          renderGroups(sec, r.matched);
          setBadge(sec, r.matched.length);
        } else {
          restoreBody(sec);
          sec.el.hidden = false;
          setBadge(sec, true);
        }
        if (!firstEl) firstEl = sec.el;
      });
      if (!secHits) {
        stats('Ничего не найдено — попробуйте другое слово или номер пункта (например <b>4.15</b>).');
      } else {
        stats('Совпадений: <b>' + ptHits + '</b> · разделов: <b>' + secHits + '</b>' + (ptHits ? '' : ' (по названию раздела)'));
      }
    }

    if (wasEmpty && firstEl) firstEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    wasEmpty = false;
    syncUrl(v);
  }

  function reset() {
    buildIndex();
    INDEX.forEach(function (sec) {
      restoreBody(sec);
      sec.el.hidden = false;
      setBadge(sec, null);
    });
    if (statsEl) statsEl.textContent = '';
    wasEmpty = true;
    syncUrl('');
  }

  function syncUrl(v) {
    try {
      var s = v ? '?q=' + encodeURIComponent(v) : '';
      history.replaceState(null, '', location.pathname + s + location.hash);
    } catch (e) { /* file:// и старые браузеры */ }
  }

  /* ---------- события ---------- */

  input.placeholder = 'Слово или номер пункта (например 4.15) · Ctrl+K';
  if (note) note.textContent = 'Поиск по всем разделам: по словам и по номерам пунктов (например 4.15). Совпадения подсвечиваются, разделы без совпадений скрываются.';
  if (controls) controls.hidden = false;
  if (clearBtn) clearBtn.addEventListener('click', function () { input.value = ''; reset(); input.focus(); });
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  var timer = null;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(run, 160);
  });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault(); input.focus(); input.select();
    } else if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault(); input.focus();
    } else if (e.key === 'Escape' && document.activeElement === input) {
      input.value = ''; reset(); input.blur();
    }
  });

  var m = location.search.match(/[?&]q=([^&]*)/);
  if (m) {
    input.value = decodeURIComponent(m[1].replace(/\+/g, '%20'));
    run();
  }
})();
