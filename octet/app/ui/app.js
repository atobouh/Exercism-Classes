// Octet's interface. Every piece of data comes from the Rust side through
// `api(command, args)`: Tauri's invoke in the desktop app, or HTTP when the
// dev server runs it in a browser.
(() => {
  const lb = document.getElementById('lb');
  const $ = s => lb.querySelector(s), $$ = s => [...lb.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const api = async (cmd, args = {}) => {
    if (window.__TAURI__) return window.__TAURI__.core.invoke('api', { cmd, args });
    const r = await fetch('/api/' + cmd, { method: 'POST', body: JSON.stringify(args) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'request failed');
    return j;
  };
  const safe = fn => async (...a) => { try { return await fn(...a); } catch (e) { toast(String(e.message || e)); } };

  let tT;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.remove('hide'); clearTimeout(tT); tT = setTimeout(() => t.classList.add('hide'), 2800); };

  /* ---------- theme ---------- */
  const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
  const setTheme = t => { lb.dataset.theme = t; $$('.theme button').forEach(b => b.setAttribute('aria-pressed', b.dataset.th === t)); store.set('octet-theme', t); };
  setTheme(store.get('octet-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $$('.theme button').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.th)));

  /* ---------- library data ---------- */
  let LIB = null, cur = 'library', PAGE = null;
  const SHORT = { itn: 'Networks', srwe: 'Switching', ensa: 'Enterprise', exam: 'The exam' };
  const COL_ICON = {
    commands: '<path d="M3.5 5l3 3-3 3M8.5 11.5h4"/>',
    wrong: '<circle cx="8" cy="8" r="5.5"/><path d="M8 5.2v3.3M8 10.8v.1"/>',
    diagrams: '<rect x="2.5" y="3" width="4" height="3.5" rx="1"/><rect x="9.5" y="9.5" width="4" height="3.5" rx="1"/><path d="M6.5 4.8h2.5v4.7"/>',
  };
  const findPage = id => {
    for (const b of LIB.books) for (const c of b.chapters) { const i = c.pages.findIndex(p => p.id === id); if (i >= 0) return { book: b, chapter: c, index: i, page: c.pages[i] }; }
    return null;
  };
  const allPages = () => LIB.books.flatMap(b => b.chapters.flatMap(c => c.pages));

  const refresh = async () => { LIB = await api('library'); renderNav(); };
  const renderNav = () => {
    $('#dueN').textContent = LIB.due || '';
    $('#navBooks').innerHTML = LIB.books.map(b => `<button class="si" type="button" data-book="${b.id}"><span class="spn c-${esc(b.cloth)}"></span><span>${esc(SHORT[b.id] || b.short)}</span><span class="n">${b.pages ? `${b.read}/${b.pages}` : ''}</span></button>`).join('');
    $('#navCols').innerHTML = LIB.collections.map(c => `<button class="si" type="button" data-col="${c.id}"><svg viewBox="0 0 16 16" aria-hidden="true">${COL_ICON[c.id] || COL_ICON.commands}</svg><span>${esc(c.title)}</span><span class="n">${c.count}</span></button>`).join('');
    markNav();
  };
  const markNav = (key) => {
    $$('.side .si').forEach(b => {
      const on = (b.dataset.go && b.dataset.go === cur) || (key && (b.dataset.col === key || b.dataset.book === key));
      on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current');
    });
  };
  const where = (...parts) => { $('#tbWhere').innerHTML = parts.filter(Boolean).map((p, i, a) => i === a.length - 1 ? `<b>${esc(p)}</b>` : `<span>${esc(p)}</span><span class="sep">/</span>`).join(''); };
  const show = (v, key) => {
    cur = v;
    if (v !== 'reading' && lb.classList.contains('focus')) setFocus(false);
    if (v === 'library') where('Library');
    else if (v === 'review') where('Review');
    $$('.view').forEach(x => x.classList.toggle('on', x.dataset.view === v));
    markNav(key);
    hideSel();
    const a = document.activeElement; if (!lb.contains(a) || a.offsetParent === null) lb.focus({ preventScroll: true });
  };

  /* ---------- covers ---------- */
  const PAT = {
    rings: Array.from({ length: 7 }, (_, i) => `<circle cx="150" cy="96" r="${22 + i * 20}" fill="none" stroke="currentColor" stroke-opacity=".16"/>`).join(''),
    traces: Array.from({ length: 9 }, (_, i) => `<path d="M${-10 + i * 26} 0 V 70 L ${30 + i * 22} 150 V 300" fill="none" stroke="currentColor" stroke-opacity=".17"/>`).join(''),
    grid: Array.from({ length: 6 }, (_, i) => `<path d="M0 ${40 + i * 24} H 200" stroke="currentColor" stroke-opacity=".14"/><path d="M${30 + i * 30} 30 V 160" stroke="currentColor" stroke-opacity=".14"/>`).join('') + '<path d="M30 160 H 90 V 88 H 150 V 40 H 200" fill="none" stroke="currentColor" stroke-opacity=".38" stroke-width="1.6"/>',
    // Rows of bits, a few of them set.
    bits: Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => `<rect x="${44 + c * 16}" y="${34 + r * 16}" width="9" height="9" rx="1.5" fill="currentColor" fill-opacity="${(r * 7 + c * 3 + r * c) % 5 < 2 ? '.34' : '.1'}"/>`).join('')).join(''),
    waves: Array.from({ length: 9 }, (_, i) => `<path d="M-10 ${30 + i * 18} C 40 ${10 + i * 18}, 80 ${50 + i * 18}, 130 ${30 + i * 18} S 200 ${10 + i * 18}, 230 ${30 + i * 18}" fill="none" stroke="currentColor" stroke-opacity=".15"/>`).join(''),
    stripes: Array.from({ length: 4 }, (_, i) => `<rect x="0" y="${26 + i * 14}" width="200" height="${i === 1 ? 6 : 2}" fill="currentColor" fill-opacity=".18"/>`).join(''),
    dots: Array.from({ length: 9 }, (_, r) => Array.from({ length: 11 }, (_, c) => `<circle cx="${14 + c * 18 + (r % 2) * 9}" cy="${20 + r * 18}" r="1.7" fill="currentColor" fill-opacity=".2"/>`).join('')).join(''),
    plain: '',
  };
  const coverSVG = pattern => `<svg viewBox="0 0 200 292" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${PAT[pattern] || ''}</svg>`;
  const DIA = '<svg viewBox="0 0 200 70" aria-hidden="true"><line x1="44" y1="22" x2="84" y2="35"/><line x1="44" y1="50" x2="84" y2="37"/><line x1="122" y1="36" x2="156" y2="36" stroke-width="3"/><rect x="6" y="12" width="38" height="20" rx="4"/><rect x="6" y="40" width="38" height="20" rx="4"/><rect x="84" y="26" width="38" height="20" rx="4"/><rect x="156" y="26" width="38" height="20" rx="4"/></svg>';
  const piece = p => `<div class="blk">${p.kind === 'command' ? `<div class="bc">${esc(p.text)}</div>` : p.kind === 'note' ? `<div class="bm">${esc(p.text)}</div>` : p.kind === 'diagram' ? DIA : `<div class="bt">${esc(p.text)}</div>`}<span class="src">From ${esc(p.source)}</span></div>`;

  /* ---------- library view ---------- */
  const renderLibrary = () => {
    const ribbon = LIB.ribbon && findPage(LIB.ribbon.page);
    const firstPage = allPages()[0];
    const nextLab = allPages().find(p => p.lab && !p.passed);
    const bookState = b => {
      if (!b.pages) return ['Not written yet', 'Pages arrive as the roadmap grows'];
      if (b.read === b.pages) return ['Read', `${b.pages} pages`];
      if (ribbon && ribbon.book.id === b.id) return ['Reading', `Chapter ${ribbon.chapter.number} of ${b.chapters.length}`];
      return ['Not opened yet', `${b.pages} pages so far`];
    };
    const shelf = LIB.books.map(b => {
      const [m, s] = bookState(b);
      return `<button class="book${b.pages ? '' : ' locked'}" type="button" data-book="${esc(b.id)}"><span class="cover c-${esc(b.cloth)}">${coverSVG(b.pattern)}${ribbon && ribbon.book.id === b.id ? '<span class="ribbon" aria-hidden="true"></span>' : ''}<span><span class="t">${esc(b.title)}</span><span class="v" style="display:block">${esc(b.short)}</span></span></span><span class="meta"><b>${m}</b><span>${s}</span></span></button>`;
    }).join('');
    const cont = ribbon
      ? `<div class="continue"><div><b>${esc(ribbon.page.title)}</b><span>${esc(ribbon.book.title)}, chapter ${ribbon.chapter.number}. The ribbon is where you stopped.</span></div><button class="btn pri" type="button" data-open="${esc(ribbon.page.id)}" data-block="${LIB.ribbon.block}">Continue reading <span class="k">Enter</span></button></div>`
      : firstPage ? `<div class="continue"><div><b>${esc(firstPage.title)}</b><span>${esc(firstPage.summary)}</span></div><button class="btn pri" type="button" data-open="${esc(firstPage.id)}">Start reading <span class="k">Enter</span></button></div>` : '';
    const lab = nextLab ? `<div class="continue"><div><b>${esc(nextLab.title)}</b><span>${esc(nextLab.summary)}</span></div><button class="btn line" type="button" data-lab="${esc(nextLab.lab)}">Open the lab</button></div>` : '';
    const recent = LIB.recent.length ? `<div class="lib-sec"><h2>Lately collected</h2><div class="blocks">${LIB.recent.map(piece).join('')}</div></div>` : `<div class="lib-sec"><h2>Lately collected</h2><p style="margin:0;color:var(--ink3)">Select any sentence while reading and press Collect. It lands here and in your collections.</p></div>`;
    $('#libIn').innerHTML = `<div class="lib-head"><h1>Your library</h1><p>${LIB.books.length === 4 ? 'Four' : LIB.books.length} books. The three courses read in order; the exam book ties them to the test. The ribbon marks where you stopped.</p></div><div class="shelf">${shelf}</div>${cont}${lab}${recent}`;
    show('library');
  };

  const openBook = id => {
    const b = LIB.books.find(x => x.id === id); if (!b) return;
    $('#bookIn').innerHTML = `<div class="lib-head"><h1>${esc(b.title)}</h1><p>${esc(b.short)}. ${b.about ? esc(b.about) + ' ' : ''}${b.pages ? `${b.read} of ${b.pages} pages read.` : 'Its pages are being written.'}</p></div><div class="ch-list">${b.chapters.map(c => `<button class="ch" type="button" ${c.pages.length ? `data-open="${esc(c.pages[0].id)}"` : 'disabled'}><span>${c.number}</span>${esc(c.title)}<span>${c.pages.length ? `${c.pages.filter(p => p.read).length} of ${c.pages.length} read` : ''}</span></button>`).join('')}</div>`;
    show('book', id);
    where('Library', b.title);
  };

  /* ---------- reading ---------- */
  const inline = (text, marks) => {
    let h = esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\(([a-z0-9-]+\/\d+\/[a-z0-9-]+)\)/g, '<a class="xref" href="#" data-open="$2">$1</a>');
    for (const m of marks) { const e = esc(m); if (e && h.includes(e)) h = h.replace(e, `<mark>${e}</mark>`); }
    return h;
  };
  const ago = t => { const d = Math.floor((Date.now() / 1000 - t) / 86400); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`; };
  const noteHTML = n => `<div class="mine" data-note="${n.id}"><textarea rows="1" aria-label="Your note">${esc(n.text)}</textarea><span class="when">Your note, ${ago(n.created)}${n.quote ? `, on "${esc(n.quote.length > 48 ? n.quote.slice(0, n.quote.lastIndexOf(' ', 48)) + '...' : n.quote)}"` : ''}</span></div>`;

  const openPage = safe(async (id, block) => {
    PAGE = await api('page', { id });
    const loc = findPage(id);
    const { book, chapter, index } = loc;
    $('#chTitle').textContent = chapter.title;
    $('#chSub').textContent = `Chapter ${chapter.number} of ${book.title}`;
    $('#items').innerHTML = chapter.pages.map(p => `<button class="it${p.read || p.id === id ? '' : ' unread'}${p.lab ? ' lab-it' : ''}" type="button" ${p.lab ? `data-lab="${esc(p.lab)}"` : `data-open="${esc(p.id)}"`} aria-current="${p.id === id}"><b>${esc(p.title)}<i>${p.lab ? (p.passed ? 'passed' : 'open lab') : p.id === id ? 'reading' : p.read ? 'read' : 'not read'}</i></b><p>${esc(p.summary)}</p>${p.notes ? `<span class="yours">${p.notes} note${p.notes > 1 ? 's' : ''} of yours</span>` : ''}</button>`).join('');
    renderDoc(index, chapter.pages.length);
    show('reading');
    where(book.title, chapter.title, PAGE.page.meta.title);
    $('#edScroll').scrollTop = 0;
    if (block) { const el = $(`#course [data-b="${block}"]`); if (el) el.scrollIntoView({ block: 'center' }); }
    api('set_ribbon', { page: id, block: block || 0 }).catch(() => {});
  });

  const renderDoc = (index, count) => {
    const p = PAGE.page, notesBy = {};
    PAGE.notes.forEach(n => (notesBy[n.after_block] = notesBy[n.after_block] || []).push(n));
    const blocks = p.blocks.map((b, i) => {
      let h = '';
      if (b.type === 'text') h = `<p data-b="${i}">${inline(b.text, PAGE.highlights.filter(x => x.block === i).map(x => x.text))}</p>`;
      else if (b.type === 'figure') h = `<div data-b="${i}" data-fig="${esc(b.id)}">${(window.OCTET_FIGURES[b.id] || { html: () => '' }).html()}</div>`;
      else if (b.type === 'lab') {
        const lp = allPages().find(x => x.lab === b.id);
        h = `<div class="lab-block" data-b="${i}"><div><b>${esc(lp ? lp.title : 'Lab')}</b><span>${lp && lp.passed ? 'Passed. Open it again any time.' : 'Opens on a live map of the network.'}</span></div><button class="btn pri" type="button" data-lab="${esc(b.id)}">Open the lab</button></div>`;
      }
      else h = window.OCTET_BLOCKS.render(b, i, { inline, answered: PAGE.answered.includes(i) });
      return h + (notesBy[i] || []).map(noteHTML).join('');
    }).join('');
    const links = PAGE.links.map(l => `<button class="chip" type="button" data-open="${esc(l.id)}">${esc(l.title)}</button>`).join('');
    const loc = findPage(p.id), next = loc.chapter.pages[index + 1];
    const nextBtn = next ? (next.lab ? `<button class="btn line" type="button" data-next="${esc(next.id)}" data-lab="${esc(next.lab)}">Next: ${esc(next.title)}</button>` : `<button class="btn line" type="button" data-next="${esc(next.id)}">Next page</button>`) : `<button class="btn line" type="button" data-done>Back to the library</button>`;
    $('#doc').innerHTML = `<h1>${esc(p.meta.title)}</h1><p class="sub">Page ${index + 1} of ${count} in this chapter.${PAGE.notes.length ? ` Your notes here: ${PAGE.notes.length}.` : ''}</p><div class="course" id="course">${blocks}</div>${links ? `<div class="linked"><h3>Linked pages</h3><div class="chips">${links}</div></div>` : ''}<div class="doc-foot"><span>${esc(loc.book.title)}, chapter ${loc.chapter.number}</span>${nextBtn}</div>`;
    $$('#course [data-fig]').forEach(el => { const f = window.OCTET_FIGURES[el.dataset.fig]; if (f) f.wire(el, reduce); });
    window.OCTET_BLOCKS.wire($('#course'), { api });
  };

  // Answer something in the text. Every answer becomes a review card.
  const said = (box, r) => {
    box.querySelector('.fb').textContent = `${r.correct ? 'Right.' : 'Not quite.'}${r.why ? ' ' + r.why : ''} It comes back ${r.next.toLowerCase()}.${r.correct ? '' : ' Saved to Things I got wrong.'}`;
    refresh();
  };
  lb.addEventListener('click', safe(async e => {
    const opt = e.target.closest('.ask .opt'), check = e.target.closest('.ask [data-check]');
    const knew = e.target.closest('.recall [data-knew]'), showR = e.target.closest('.recall [data-recall]');
    if (showR) { const r = showR.closest('.recall'); showR.hidden = true; r.querySelector('.back').hidden = false; return; }
    if (knew) {
      const box = knew.closest('.recall'), r = await api('answer', { page: PAGE.page.id, block: +box.dataset.q, knew: knew.dataset.knew === '1' });
      box.querySelectorAll('[data-knew]').forEach(o => { o.disabled = true; o.classList.toggle('ok', o === knew && r.correct); o.classList.toggle('no', o === knew && !r.correct); });
      return said(box, r);
    }
    if (!opt && !check) return;
    const ask = (opt || check).closest('.ask'), block = +ask.dataset.q, multi = +ask.dataset.multi || 0;
    if (opt && multi) {
      if (opt.disabled) return;
      opt.classList.toggle('picked');
      ask.querySelector('[data-check]').disabled = ask.querySelectorAll('.opt.picked').length !== multi;
      return;
    }
    const picked = multi ? [...ask.querySelectorAll('.opt.picked')].map(o => +o.dataset.c) : [+opt.dataset.c];
    const r = await api('answer', multi ? { page: PAGE.page.id, block, choices: picked } : { page: PAGE.page.id, block, choice: picked[0] });
    const right = [].concat(r.answer);
    ask.querySelectorAll('.opt').forEach(o => {
      const c = +o.dataset.c; o.disabled = true; o.classList.remove('ok', 'no', 'picked');
      if (right.includes(c)) o.classList.add('ok'); else if (picked.includes(c)) o.classList.add('no');
    });
    if (check) check.hidden = true;
    said(ask, r);
  }));
  lb.addEventListener('keydown', safe(async e => {
    const inp = e.target.closest && e.target.closest('.cmdq input');
    if (!inp || e.key !== 'Enter' || !inp.value.trim() || inp.disabled) return;
    e.preventDefault();
    const box = inp.closest('.cmdq'), r = await api('answer', { page: PAGE.page.id, block: +box.dataset.q, text: inp.value });
    inp.disabled = true; box.classList.add(r.correct ? 'good' : 'bad');
    if (!r.correct) box.querySelector('.fb').insertAdjacentHTML('beforebegin', `<p class="cmd-ans"><span>The command is</span> <code>${esc(r.answer)}</code></p>`);
    said(box, r);
  }));
  // Keep a block of device output in Show commands.
  lb.addEventListener('click', safe(async e => {
    const k = e.target.closest('[data-keep]'); if (!k) return;
    const b = PAGE.page.blocks[+k.dataset.keep];
    await api('collect', { collection: 'commands', kind: 'command', text: b.lines.join('\n'), source: PAGE.page.meta.title });
    k.textContent = 'Collected'; k.disabled = true; refresh();
  }));

  // Notes save when you leave them.
  lb.addEventListener('focusout', safe(async e => {
    const ta = e.target.closest('.mine textarea'); if (!ta) return;
    const box = ta.closest('.mine'), text = ta.value.trim();
    if (box.dataset.note) { await api('edit_note', { id: +box.dataset.note, text }); if (!text) box.remove(); }
    else if (text) { const n = await api('add_note', { page: PAGE.page.id, after_block: +box.dataset.after, quote: box.dataset.quote || '', text }); box.dataset.note = n.id; }
    else box.remove();
    refresh();
  }));

  /* selection: highlight, note, collect */
  const selbar = $('#selbar'), menu = $('#colMenu'), ed = $('.ed');
  let range = null, selBlock = null;
  const hideSel = () => { selbar.classList.remove('on'); menu.hidden = true; };
  ed.addEventListener('mouseup', e => {
    if (e.target.closest('.selbar, .collect-menu')) return;
    setTimeout(() => {
      const sel = window.getSelection();
      const p = sel.anchorNode && sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest('#course p[data-b]');
      if (!sel.rangeCount || sel.isCollapsed || !p || !p.contains(sel.focusNode)) return hideSel();
      range = sel.getRangeAt(0).cloneRange(); selBlock = +p.dataset.b;
      const r = range.getBoundingClientRect(), a = ed.getBoundingClientRect();
      selbar.style.left = (r.left + r.width / 2 - a.left) + 'px'; selbar.style.top = (r.top - a.top - 8) + 'px';
      selbar.classList.add('on'); menu.hidden = true;
    }, 0);
  });
  $('#edScroll').addEventListener('scroll', hideSel);
  selbar.addEventListener('click', safe(async e => {
    const b = e.target.closest('[data-act]'); if (!b || !range) return;
    const text = range.toString().trim(); if (!text) return hideSel();
    if (b.dataset.act === 'mark') {
      if (range.startContainer !== range.endContainer) { toast('Highlight within one sentence at a time.'); return hideSel(); }
      const m = document.createElement('mark'); range.surroundContents(m);
      window.getSelection().removeAllRanges(); hideSel();
      await api('highlight', { page: PAGE.page.id, block: selBlock, text });
    } else if (b.dataset.act === 'note') {
      window.getSelection().removeAllRanges(); hideSel();
      const p = $(`#course p[data-b="${selBlock}"]`);
      let after = p; while (after.nextElementSibling && after.nextElementSibling.classList.contains('mine')) after = after.nextElementSibling;
      const n = document.createElement('div'); n.className = 'mine'; n.dataset.after = selBlock; n.dataset.quote = text;
      n.innerHTML = `<textarea rows="1" aria-label="Your note" placeholder="In your own words"></textarea><span class="when">Your note, on "${esc(text.length > 48 ? text.slice(0, text.lastIndexOf(' ', 48)) + '...' : text)}"</span>`;
      after.after(n); n.querySelector('textarea').focus({ preventScroll: true });
    } else {
      const r = selbar.getBoundingClientRect(), a = ed.getBoundingClientRect();
      menu.innerHTML = LIB.collections.filter(c => c.id !== 'diagrams').map(c => `<button type="button" data-into="${c.id}">${esc(c.title)}<span>${c.count}</span></button>`).join('');
      menu.style.left = (r.left - a.left) + 'px'; menu.style.top = (r.bottom - a.top + 6) + 'px'; menu.hidden = false;
    }
  }));
  menu.addEventListener('click', safe(async e => {
    const b = e.target.closest('[data-into]'); if (!b || !range) return;
    const text = range.toString().trim(), into = b.dataset.into;
    await api('collect', { collection: into, kind: into === 'commands' ? 'command' : 'quote', text, source: PAGE.page.meta.title });
    window.getSelection().removeAllRanges(); hideSel();
    await refresh();
    toast(`Collected into ${LIB.collections.find(c => c.id === into).title}`);
  }));

  /* focus mode */
  const setFocus = on => {
    lb.classList.toggle('focus', on); $('#focusBtn').setAttribute('aria-pressed', on);
    const c = $('#course'); if (on && c && !c.querySelector('.cur') && c.children[0]) c.children[0].classList.add('cur');
  };
  $('#focusBtn').addEventListener('click', () => setFocus(!lb.classList.contains('focus')));
  lb.addEventListener('click', e => { const el = e.target.closest('#course > *'); if (!el) return; $$('#course > .cur').forEach(x => x.classList.remove('cur')); el.classList.add('cur'); });

  /* ---------- collections ---------- */
  const openCollection = safe(async id => {
    const c = await api('collection', { id });
    $('#colTitle').textContent = c.title;
    $('#colSub').textContent = c.pieces.length ? `${c.pieces.length} piece${c.pieces.length > 1 ? 's' : ''}, collected while reading and reviewing.` : 'Nothing here yet.';
    $('#colBlocks').innerHTML = c.pieces.length ? c.pieces.slice().reverse().map(piece).join('') : `<p style="margin:0;color:var(--ink3);grid-column:1/-1">${id === 'wrong' ? 'Questions you get wrong land here on their own, with the right answer.' : 'Select a sentence or a command while reading, then press Collect.'}</p>`;
    show('collection', id);
    where('Collections', c.title);
  });

  /* ---------- review ---------- */
  let DUE = [], ci = 0, revealed = false;
  const renderCard = () => {
    const card = $('#card');
    if (ci >= DUE.length) {
      card.innerHTML = DUE.length
        ? `<p class="q">That's all for now.</p><p style="margin:0;color:var(--ink2)">Everything you reviewed comes back when you are about to forget it.</p><button class="btn pri" type="button" data-go="library" style="justify-self:start">Back to the library</button>`
        : `<p class="q">Nothing to review right now.</p><p style="margin:0;color:var(--ink2)">Questions you answer while reading come back here just before you would forget them.</p><button class="btn line" type="button" data-go="library" style="justify-self:start">Back to the library</button>`;
      return;
    }
    const c = DUE[ci]; revealed = false;
    const typed = c.kind === 'command'
      ? `<label class="cmdline rv-cmd"><span class="pr">${esc(c.mode || '#')}</span><input id="rvIn" type="text" spellcheck="false" autocomplete="off" aria-label="Type the command" placeholder="Type it, then Enter"></label>`
      : '';
    const ansText = c.kind === 'command' ? `<code class="rv-code">${esc(c.answer)}</code>` : esc(c.answer);
    card.innerHTML = `<p class="q">${esc(c.prompt)}</p>${typed}<p class="rv-mark" id="rvMark" hidden></p><button class="reveal" type="button" id="rv"><span class="k">${c.kind === 'command' ? 'Enter' : 'Space'}</span>${c.kind === 'command' ? 'Check' : 'Show answer'}</button><div class="ans" id="an" hidden><p style="margin:0;font:600 17px var(--f-ui);color:var(--ink)">${ansText}</p>${c.why ? `<p>${esc(c.why)}</p>` : ''}<div class="grades">${['Again', 'Hard', 'Good', 'Easy'].map((g, i) => `<button type="button" data-g="${g.toLowerCase()}"><b>${g} <span class="k">${i + 1}</span></b><span>${esc(c.previews[i])}</span></button>`).join('')}</div></div><div class="card-meta"><span>From ${esc(c.source)}</span><span>${ci + 1} of ${DUE.length}</span></div>`;
  };
  const openReview = safe(async () => { DUE = await api('review_due'); ci = 0; renderCard(); show('review'); const i = $('#rvIn'); if (i) i.focus(); });
  const reveal = safe(async () => {
    if (revealed || ci >= DUE.length) return;
    const c = DUE[ci], i = $('#rvIn');
    if (c.kind === 'command' && i && i.value.trim()) {
      const r = await api('check_command', { id: c.id, text: i.value });
      const m = $('#rvMark'); m.hidden = false; m.className = 'rv-mark ' + (r.correct ? 'good' : 'bad');
      m.textContent = r.correct ? 'Right. Grade how easily it came.' : 'Not that. Compare with the answer below.';
      i.disabled = true;
    }
    revealed = true; $('#an').hidden = false; $('#rv').hidden = true; lb.focus({ preventScroll: true });
  });
  const grade = safe(async g => { await api('review_grade', { id: DUE[ci].id, grade: g }); ci++; renderCard(); refresh(); const i = $('#rvIn'); if (i) i.focus(); });
  $('#card').addEventListener('keydown', e => { if (e.target.id === 'rvIn' && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); reveal(); } });
  $('#card').addEventListener('click', e => { if (e.target.closest('#rv')) reveal(); const g = e.target.closest('[data-g]'); if (g) grade(g.dataset.g); });

  /* ---------- settings ---------- */
  const CLOTHS = ['teal', 'plum', 'ochre', 'navy', 'moss', 'brick', 'slate', 'linen', 'graphite', 'rose'];
  const PATTERNS = ['rings', 'traces', 'grid', 'bits', 'waves', 'stripes', 'dots', 'plain'];
  const cap = w => w[0].toUpperCase() + w.slice(1);
  let CHECK = null, PICK = null, recover = null;
  const miniCover = (b, cls = '') => `<span class="cover mini c-${esc(b.cloth)} ${cls}">${coverSVG(b.pattern)}<span><span class="t">${esc(b.title)}</span></span></span>`;
  const coverPicker = (cloth, pattern) => `<div class="pick"><span class="pick-l">Cloth</span><div class="swatches" role="radiogroup" aria-label="Cloth">${CLOTHS.map(c => `<button type="button" role="radio" class="sw c-${c}" data-cloth="${c}" aria-checked="${c === cloth}" title="${cap(c)}"></button>`).join('')}</div><span class="pick-l">Pattern</span><div class="pats" role="radiogroup" aria-label="Pattern">${PATTERNS.map(x => `<button type="button" role="radio" class="pat" data-pattern="${x}" aria-checked="${x === pattern}">${cap(x)}</button>`).join('')}</div></div>`;
  const renderCheck = () => {
    const out = $('#bkOut'); if (!out) return;
    if (!CHECK) { out.innerHTML = ''; return; }
    if (!CHECK.ok) {
      out.innerHTML = `<div class="bk-res bad"><b>Octet can't read it yet</b><ul>${CHECK.problems.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p>Paste these back to the assistant and ask it to fix them, or fix them in the box above.</p><button class="btn line" type="button" data-set="copy-problems">Copy the problems</button></div>`;
      return;
    }
    const c = CHECK, b = { title: c.title, cloth: PICK.cloth, pattern: PICK.pattern };
    out.innerHTML = `<div class="bk-res"><div class="bk-prev">${miniCover(b, 'big')}</div><div class="bk-info"><b>${esc(c.title)}</b><span>${esc(c.short)}. ${c.chapters.length} chapter${c.chapters.length === 1 ? '' : 's'}, ${c.pages} page${c.pages === 1 ? '' : 's'}, ${c.asks} thing${c.asks === 1 ? '' : 's'} to answer.</span><ol class="bk-chs">${c.chapters.map(ch => `<li><span>${ch.number}</span>${esc(ch.title)}<i>${ch.pages} page${ch.pages === 1 ? '' : 's'}</i></li>`).join('')}</ol>${coverPicker(PICK.cloth, PICK.pattern)}<div class="bk-go"><button class="btn pri" type="button" data-set="import">${c.updates ? `Add to ${esc(c.updates)}` : 'Put it on my shelf'}</button>${c.updates ? `<span>${c.shipped ? 'Your chapters sit on top of the shipped ones. You can undo them any time.' : 'The chapters in this text replace the same chapters in your book. The others stay.'}</span>` : ''}</div></div></div>`;
  };
  const renderSettings = about => {
    $('#setIn').innerHTML = `<div class="lib-head"><h1>Settings</h1><p>Everything Octet keeps is on this computer.</p></div>
      <section class="set-sec"><h2>Add a book of your own</h2><p class="set-p">Turn your class PDFs into a book on your shelf, with the same reader, highlights, questions and review as the others. An assistant reads the PDF and writes the pages in Octet's format. You paste its answer here.</p>
        <ol class="steps">
          <li><div><b>Copy the prompt</b><span>It tells the assistant exactly how Octet's pages are written.</span><div class="row"><button class="btn line" type="button" data-set="copy-prompt">Copy the prompt</button><button class="btn ghost" type="button" data-set="show-prompt">Read it first</button></div><pre class="prompt" id="promptText" hidden></pre></div></li>
          <li><div><b>Give it your PDF</b><span>Open Claude, or another assistant that reads PDFs. Attach your PDF and paste the prompt. For a long PDF, ask for one chapter at a time; each answer adds that chapter to the same book.</span></div></li>
          <li><div><b>Paste the answer</b><span>Paste the assistant's whole answer, then check it. Nothing is added until you say so.</span><textarea id="bkText" spellcheck="false" placeholder="=== book ===&#10;id = &quot;my-notes&quot;&#10;title = &quot;…&quot;"></textarea><div class="row"><button class="btn pri" type="button" data-set="check">Check it</button><button class="btn ghost" type="button" data-set="clear">Clear</button></div></div></li>
        </ol>
        <div id="bkOut"></div>
      </section>
      <section class="set-sec"><h2>Books on your shelf</h2><p class="set-p">Any book can grow. Copy it as text, give it to an assistant with your notes or a newer PDF, and paste the answer above. Your chapters replace the same chapters; everything else stays.</p><div class="mybooks">${LIB.books.map(b => `<div class="mybook" data-id="${esc(b.id)}">${miniCover(b)}<div class="mb-t"><b>${esc(b.title)}</b><span>${b.yours ? 'Added by you' : b.changed ? 'Ships with Octet, with your changes' : 'Ships with Octet'}. ${b.pages} page${b.pages === 1 ? '' : 's'}${b.read ? `, ${b.read} read` : ''}.</span></div><div class="row"><button class="btn ghost" type="button" data-set="recover">Change the cover</button><button class="btn ghost" type="button" data-set="export">Copy as text</button>${b.yours ? '<button class="btn ghost danger" type="button" data-set="remove">Remove</button>' : b.changed ? '<button class="btn ghost danger" type="button" data-set="remove">Undo my changes</button>' : ''}</div>${recover === b.id ? `<div class="mb-pick">${coverPicker(b.cloth, b.pattern)}</div>` : ''}</div>`).join('')}</div>${(LIB.broken || []).length ? `<div class="bk-res bad"><b>Some of your books couldn't be read</b><ul>${LIB.broken.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}</section>
      <section class="set-sec"><h2>Where your things are</h2><dl class="where"><dt>Highlights, notes, review and labs</dt><dd>${esc(about.data)}</dd><dt>Books you added</dt><dd>${esc(about.books)}</dd><dt>Version</dt><dd>Octet ${esc(about.version)}</dd></dl></section>`;
    renderCheck();
  };
  let ABOUT = null;
  const openSettings = safe(async () => { ABOUT = ABOUT || await api('about'); renderSettings(ABOUT); show('settings'); where('Settings'); });
  const copy = async (text, said) => { try { await navigator.clipboard.writeText(text); toast(said); } catch { toast("Couldn't reach the clipboard."); } };
  $('#setIn').addEventListener('click', safe(async e => {
    const sw = e.target.closest('[data-cloth]'), pt = e.target.closest('[data-pattern]');
    const mb = e.target.closest('.mybook');
    if ((sw || pt) && mb) {
      const b = LIB.books.find(x => x.id === mb.dataset.id);
      await api('book_cover', { id: b.id, cloth: sw ? sw.dataset.cloth : b.cloth, pattern: pt ? pt.dataset.pattern : b.pattern });
      await refresh(); renderSettings(ABOUT); return;
    }
    if (sw || pt) { if (sw) PICK.cloth = sw.dataset.cloth; if (pt) PICK.pattern = pt.dataset.pattern; renderCheck(); return; }
    const a = e.target.closest('[data-set]'); if (!a) return;
    const act = a.dataset.set;
    if (act === 'copy-prompt') copy(await api('book_prompt'), 'Prompt copied. Paste it into your assistant with your PDF.');
    else if (act === 'show-prompt') { const pre = $('#promptText'); if (pre.hidden) pre.textContent = await api('book_prompt'); pre.hidden = !pre.hidden; a.textContent = pre.hidden ? 'Read it first' : 'Hide it'; }
    else if (act === 'clear') { $('#bkText').value = ''; CHECK = null; renderCheck(); }
    else if (act === 'check') {
      const text = $('#bkText').value; if (!text.trim()) { toast('Paste the answer first.'); return; }
      CHECK = await api('book_check', { text }); if (CHECK.ok) PICK = { cloth: CHECK.cloth, pattern: CHECK.pattern };
      renderCheck(); $('#bkOut').scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    } else if (act === 'copy-problems') copy('Octet could not read the book yet. Please fix these and send the whole book again:\n' + CHECK.problems.map(x => '- ' + x).join('\n'), 'Problems copied.');
    else if (act === 'import') {
      const r = await api('book_import', { text: $('#bkText').value, cloth: PICK.cloth, pattern: PICK.pattern });
      const title = CHECK.updates || CHECK.title;
      $('#bkText').value = ''; CHECK = null; await refresh(); renderSettings(ABOUT); toast(`${title} is on your shelf.`);
      void r;
    } else if (act === 'recover') { recover = recover === mb.dataset.id ? null : mb.dataset.id; renderSettings(ABOUT); }
    else if (act === 'export') copy(await api('book_export', { id: mb.dataset.id }), 'The whole book is copied as text.');
    else if (act === 'remove') {
      const b = LIB.books.find(x => x.id === mb.dataset.id), was = a.textContent;
      if (a.dataset.sure !== '1') { a.dataset.sure = '1'; a.textContent = b.yours ? 'Remove for good' : 'Undo them for good'; setTimeout(() => { if (a.isConnected) { a.dataset.sure = ''; a.textContent = was; } }, 4000); return; }
      await api('book_remove', { id: b.id }); await refresh(); renderSettings(ABOUT);
      toast(b.yours ? `${b.title} is off your shelf. Your notes on it stay saved.` : `${b.title} is back to the shipped pages.`);
    }
  }));

  /* ---------- hiding the sidebars ---------- */
  const panes = { side: store.get('octet-side') !== 'hidden', list: store.get('octet-list') !== 'hidden' };
  const setPane = (k, on) => {
    panes[k] = on; lb.classList.toggle('no-' + k, !on); store.set('octet-' + k, on ? 'shown' : 'hidden');
    const b = k === 'side' ? $('#tbSide') : $('#listBtn');
    if (b) { b.setAttribute('aria-pressed', String(!on)); b.title = (on ? 'Hide ' : 'Show ') + (k === 'side' ? 'the sidebar (Ctrl B)' : 'the page list (Ctrl Shift B)'); }
  };
  setPane('side', panes.side); setPane('list', panes.list);
  $('#tbSide').addEventListener('click', () => setPane('side', !panes.side));
  $('#listBtn').addEventListener('click', () => setPane('list', !panes.list));
  document.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'b' || labOn) return;
    e.preventDefault();
    if (e.shiftKey) setPane('list', !panes.list); else setPane('side', !panes.side);
  });

  /* ---------- lab ---------- */
  const labw = $('#labw'), cv = $('#cv'), cvLinks = $('#cvLinks');
  let LAB = null, labOn = false, curDev = null, pane = 'console', openTabs = [], tool = 'move', pendingA = null, ranChecks = false;
  const HIST = {}, CMDS = {};
  const W = 168, H = 58;
  const SHORTS = [['GigabitEthernet', 'Gi'], ['FastEthernet', 'Fa'], ['Ethernet', 'Et'], ['Loopback', 'Lo'], ['Vlan', 'Vl']];
  const shortName = n => { for (const [l, s] of SHORTS) if (n.startsWith(l)) return s + n.slice(l.length); return n; };
  const ICON = {
    pc: '<svg viewBox="0 0 20 20"><rect x="2.5" y="3.5" width="15" height="10" rx="1.8"/><path d="M7 17h6M10 13.5V17"/></svg>',
    switch: '<svg viewBox="0 0 20 20"><rect x="2" y="5.5" width="16" height="9" rx="2"/><path d="M5 10h1.5M8.5 10H10M12.5 10H14"/></svg>',
    router: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"/><path d="M10 5.5v9M5.5 10h9M7.5 7.5L10 5.5l2.5 2M7.5 12.5l2.5 2 2.5-2"/></svg>',
  };
  const dev = n => LAB.view.devices.find(d => d.name === n);

  const renderCards = () => {
    cv.querySelectorAll('.dcard').forEach(x => x.remove());
    for (const d of LAB.view.devices) {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'dcard' + (d.name === curDev ? ' sel' : ''); el.dataset.dev = d.name;
      el.style.left = d.x + 'px'; el.style.top = d.y + 'px';
      el.innerHTML = `<span class="ic">${ICON[d.kind]}</span><span><b>${esc(d.name)}<i class="${d.status === 'ok' ? '' : d.status}"></i></b><span class="sb">${esc(d.subtitle)}</span></span>`;
      cv.insertBefore(el, cv.querySelector('.cvtools'));
    }
  };
  const inside = (pt, d, pad = 8) => pt.x > d.x - pad && pt.x < d.x + W + pad && pt.y > d.y - pad && pt.y < d.y + H + pad;
  const renderLinks = () => {
    const NS = 'http://www.w3.org/2000/svg';
    cvLinks.innerHTML = '';
    const f = LAB.view.fault, fPort = f && f.iface ? shortName(f.iface.split('.')[0]) : null;
    for (const l of LAB.view.links) {
      const A = dev(l.a), B = dev(l.b); if (!A || !B) continue;
      const ax = A.x + W / 2, ay = A.y + H / 2, bx = B.x + W / 2, by = B.y + H / 2;
      const vert = Math.abs(by - ay) > Math.abs(bx - ax), dx = (bx - ax) / 2, dy = (by - ay) / 2;
      const d = vert ? `M${ax} ${ay} C ${ax} ${ay + dy}, ${bx} ${by - dy}, ${bx} ${by}` : `M${ax} ${ay} C ${ax + dx} ${ay}, ${bx - dx} ${by}, ${bx} ${by}`;
      const mk = cls => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', cls); cvLinks.appendChild(p); return p; };
      const path = mk('lnk' + (l.trunk ? ' trunk' : '') + (l.up ? '' : ' new')); if (l.trunk) mk('lnk trunk-in');
      const len = path.getTotalLength();
      let sA = 0; while (sA < len && inside(path.getPointAtLength(sA), A)) sA += 3;
      let sB = len; while (sB > 0 && inside(path.getPointAtLength(sB), B)) sB -= 3;
      const label = (t, at, side) => {
        const p = path.getPointAtLength(at), tx = document.createElementNS(NS, 'text'), left = vert && side < -4;
        tx.setAttribute('class', 'plab'); tx.setAttribute('x', vert ? p.x + (left ? -10 : 10) : p.x); tx.setAttribute('y', vert ? p.y + 4 : p.y - 9);
        tx.setAttribute('text-anchor', vert ? (left ? 'end' : 'start') : 'middle'); tx.textContent = t; cvLinks.appendChild(tx);
      };
      label(l.a_port, Math.min(sA + 22, len / 2), bx - ax); label(l.b_port, Math.max(sB - 22, len / 2), ax - bx);
      if (l.trunk && l.vlans.length) {
        const m = path.getPointAtLength(len / 2), text = `VLAN ${l.vlans.join(', ')}`, w = 16 + text.length * 6.4;
        const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'vpill');
        g.setAttribute('transform', vert ? `translate(${m.x - w / 2 - 16} ${m.y})` : `translate(${m.x} ${m.y + 22})`);
        g.innerHTML = `<rect x="${-w / 2}" y="-11" width="${w}" height="22" rx="11"/><text x="0" y="4" text-anchor="middle">${esc(text)}</text>`; cvLinks.appendChild(g);
      }
      const atA = f && fPort && l.a === f.device && l.a_port === fPort, atB = f && fPort && l.b === f.device && l.b_port === fPort;
      if (atA || atB) {
        const c = path.getPointAtLength(atA ? Math.min(sA + 52, len / 2 - 10) : Math.max(sB - 52, len / 2 + 10));
        const x = document.createElementNS(NS, 'g'); x.setAttribute('class', 'cutx'); x.setAttribute('transform', `translate(${c.x} ${c.y})`);
        x.innerHTML = vert ? '<circle r="10"/><path d="M-4 -4l8 8M4 -4l-8 8"/><text x="18" y="5">Traffic stops here</text>' : '<circle r="10"/><path d="M-4 -4l8 8M4 -4l-8 8"/><text x="0" y="-20" text-anchor="middle">Traffic stops here</text>';
        cvLinks.appendChild(x);
      }
    }
  };
  const renderBrief = () => {
    const tasks = LAB.tasks;
    $('#brief').innerHTML = tasks.map((t, i) => {
      const open = !t.pass, first = open && tasks.findIndex(x => !x.pass) === i;
      return `<div class="task${open ? ' open' : ''}"><span class="st"></span><div>${first ? `<b>${esc(t.text)}</b>` : esc(t.text)}${first && t.detail ? `<small>${esc(t.detail)}</small>` : ''}${first && ranChecks ? `<small>${esc(t.message)}.</small>` : ''}</div></div>`;
    }).join('') + (tasks.some(t => !t.pass && t.hint) ? `<button class="lk" type="button" id="hintBtn">Show a hint</button>` : '');
    $('#chkDots').innerHTML = tasks.map(t => `<i class="${t.pass ? '' : 'bad'}"></i>`).join('');
    $('#chkText').textContent = `${tasks.filter(t => t.pass).length} of ${tasks.length} checks`;
  };
  lb.addEventListener('click', e => {
    if (e.target.id !== 'hintBtn') return;
    const t = LAB.tasks.find(x => !x.pass && x.hint);
    e.target.outerHTML = `<small style="color:var(--ink2)">${esc(t ? t.hint : '')}</small>`;
  });
  const refreshMap = () => { renderCards(); renderLinks(); };

  const renderPanel = safe(async () => {
    if (!curDev || !dev(curDev)) curDev = LAB.view.devices[0].name;
    $('#lpTabs').innerHTML = openTabs.map(t => `<button type="button" role="tab" data-tab="${esc(t)}" aria-selected="${t === curDev}">${esc(t)}</button>`).join('');
    $('#lpName').textContent = curDev; $('#lpSub').textContent = dev(curDev).subtitle;
    $$('#lpSeg button').forEach(b => b.setAttribute('aria-selected', b.dataset.pane === pane));
    const body = $('#lpBody');
    if (pane === 'console') {
      const h = HIST[curDev] || (HIST[curDev] = []);
      body.innerHTML = `<div class="con">${h.map(x => `<div class="c">${esc(x.prompt)}${esc(x.line)}</div>${x.out ? `<div class="${x.err ? 'e' : ''}">${esc(x.out)}</div>` : ''}`).join('')}<div class="con-line"><span class="c">${esc(LAB.prompts[curDev] || '')}</span><input id="conIn" aria-label="${esc(curDev)} console" spellcheck="false" autocomplete="off"></div></div>`;
      body.scrollTop = body.scrollHeight;
    } else if (pane === 'ports') {
      const rows = await api('lab_ports', { device: curDev });
      body.innerHTML = rows.length ? `<table class="ports"><thead><tr><th>Port</th><th>Carries</th><th>Address</th></tr></thead><tbody>${rows.map(r => `<tr><td class="m"><span class="sd${r.warn ? ' warn' : ''}${r.up ? '' : ' off'}"></span>${esc(r.port)}</td><td class="${r.warn ? 'w' : ''}">${esc(r.carries)}</td><td class="m">${esc(r.address)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty-note">Nothing is cabled or configured yet. Connect it on the canvas, then set it up in its console.</p>';
    } else {
      const lines = await api('lab_changes', { device: curDev });
      body.innerHTML = lines.length ? `<div class="diff"><div class="hd">Compared with when you opened the lab</div>${lines.map(l => `<div class="${l.change === 'add' ? 'add' : l.change === 'del' ? 'del' : ''}">${esc(l.text)}</div>`).join('')}</div>` : '<p class="empty-note">No changes yet. Everything you configure on this device shows up here, line by line.</p>';
    }
  });
  const openDev = n => { curDev = n; if (!openTabs.includes(n)) openTabs.push(n); if (openTabs.length > 5) openTabs.shift(); cv.querySelectorAll('.dcard').forEach(x => x.classList.toggle('sel', x.dataset.dev === n)); renderPanel(); };
  $('#lpTabs').addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) openDev(t.dataset.tab); });
  $('#lpSeg').addEventListener('click', e => { const b = e.target.closest('[data-pane]'); if (b) { pane = b.dataset.pane; renderPanel(); } });
  $('#lpBody').addEventListener('keydown', safe(async e => {
    if (e.target.id !== 'conIn') return;
    const hist = CMDS[curDev] || (CMDS[curDev] = { list: [], at: 0 });
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      hist.at = Math.max(0, Math.min(hist.list.length, hist.at + (e.key === 'ArrowUp' ? -1 : 1)));
      e.target.value = hist.list[hist.at] || '';
      return;
    }
    if (e.key !== 'Enter' || e.ctrlKey || e.metaKey) return;
    e.stopPropagation();
    const line = e.target.value;
    if (line.trim()) { hist.list.push(line); hist.at = hist.list.length; }
    const r = await api('lab_exec', { device: curDev, line });
    (HIST[curDev] = HIST[curDev] || []).push({ prompt: r.result.prompt, line, out: r.result.output.text, err: r.result.output.error });
    LAB.prompts[curDev] = r.result.next_prompt;
    LAB.view = r.view;
    refreshMap(); await renderPanel(); $('#conIn').focus();
  }));

  /* canvas: drag, select, add, connect, note */
  let drag = null;
  const setTool = t => {
    tool = t; $$('.cvtools [data-tool]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === t)); $('#addMenu').hidden = t !== 'add';
    if (t !== 'connect') { pendingA = null; cv.querySelectorAll('.pending').forEach(x => x.classList.remove('pending')); }
    $('#cvHint').textContent = t === 'connect' ? 'Click one device, then another, to cable them.' : t === 'add' ? 'Pick what to add.' : 'Drag anything. Click a device to open it.';
  };
  $('.cvtools').addEventListener('click', e => {
    const b = e.target.closest('[data-tool]'); if (!b) return;
    if (b.dataset.tool === 'note') { addNote(); setTool('move'); return; }
    setTool(tool === b.dataset.tool && b.dataset.tool !== 'move' ? 'move' : b.dataset.tool);
  });
  $('#addMenu').addEventListener('click', safe(async e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const r = await api('lab_add', { kind: b.dataset.add, x: Math.max(320, cv.clientWidth - 220), y: 200 });
    LAB.view = r.view; LAB.prompts[r.name] = r.prompt; setTool('move'); refreshMap(); openDev(r.name);
    toast(`Added ${r.name}. Use Connect to cable it.`);
  }));
  cv.addEventListener('pointerdown', e => {
    const card = e.target.closest('.dcard'), head = e.target.closest('[data-drag]');
    if (!card && !head) return;
    const el = card || document.getElementById(head.dataset.drag);
    const r = el.getBoundingClientRect(), c = cv.getBoundingClientRect();
    el.style.left = (r.left - c.left) + 'px'; el.style.top = (r.top - c.top) + 'px'; el.style.bottom = 'auto';
    drag = { el, card: !!card, sx: e.clientX, sy: e.clientY, ox: r.left - c.left, oy: r.top - c.top, moved: false };
    el.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true; drag.el.classList.add('dragging');
    const nx = Math.max(8, Math.min(cv.clientWidth - drag.el.offsetWidth - 8, drag.ox + dx)), ny = Math.max(8, Math.min(cv.clientHeight - drag.el.offsetHeight - 8, drag.oy + dy));
    drag.el.style.left = nx + 'px'; drag.el.style.top = ny + 'px';
    if (drag.card) { const d = dev(drag.el.dataset.dev); d.x = nx; d.y = ny; renderLinks(); }
  });
  cv.addEventListener('pointerup', safe(async () => {
    if (!drag) return; const d = drag; drag = null; d.el.classList.remove('dragging');
    if (!d.card) return;
    const n = d.el.dataset.dev;
    if (d.moved) { const v = dev(n); await api('lab_move', { device: n, x: v.x, y: v.y }); return; }
    if (tool === 'connect') {
      if (!pendingA) { pendingA = n; d.el.classList.add('pending'); return; }
      if (pendingA !== n) { const r = await api('lab_connect', { a: pendingA, b: n }); LAB.view = r.view; toast(`Cabled ${pendingA} ${r.link.a_port} to ${n} ${r.link.b_port}.`); }
      setTool('move'); refreshMap(); return;
    }
    openDev(n);
  }));
  const addNote = () => {
    const id = 'note' + Date.now(), el = document.createElement('section'); el.className = 'ncard mine-card'; el.id = id; el.style.left = '300px'; el.style.top = '40px';
    el.innerHTML = `<header data-drag="${id}">Note</header><div class="nb"><textarea aria-label="Note" placeholder="Anything you want to remember"></textarea></div>`;
    cv.insertBefore(el, cv.querySelector('.cvtools')); el.querySelector('textarea').focus({ preventScroll: true });
  };

  const runChecks = safe(async () => {
    const r = await api('lab_checks', { notes: $('#labNotes').value });
    ranChecks = true; LAB.tasks = r.tasks; LAB.view = r.view; renderBrief(); refreshMap();
    if (r.passed) { toast('All checks pass. The lab is marked passed in your chapter.'); refresh(); }
    else { const t = r.tasks.find(x => !x.pass); toast(t ? t.message : 'Not yet.'); }
  });
  $('#runChk').addEventListener('click', runChecks);
  const openLab = safe(async id => {
    const st = await api('lab_open', { id });
    LAB = st; ranChecks = false; labOn = true;
    for (const k of Object.keys(HIST)) delete HIST[k];
    openTabs = LAB.view.devices.filter(d => d.kind !== 'pc').map(d => d.name).concat(LAB.view.devices.filter(d => d.kind === 'pc').slice(-1).map(d => d.name));
    curDev = (LAB.view.devices.find(d => d.kind === 'router') || LAB.view.devices[0]).name;
    pane = 'console';
    $('#labTitle').textContent = LAB.view.title; $('#labSub').textContent = LAB.summary;
    labw.classList.add('on'); lb.classList.add('lab-open'); hideSel(); setTool('move');
    where('Lab', LAB.view.title);
    renderBrief(); refreshMap(); renderPanel();
    setTimeout(() => $('#runChk').focus({ preventScroll: true }), 50);
  });
  const closeLab = async () => { labOn = false; labw.classList.remove('on'); lb.classList.remove('lab-open'); closeCtx(); await refresh(); if (PAGE) openPage(PAGE.page.id); else renderLibrary(); };
  $('#labBack').addEventListener('click', closeLab);
  labw.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); runChecks(); return; }
    if (e.key === 'Escape') { e.stopPropagation(); setTool('move'); }
  });

  /* ---------- navigation ---------- */
  lb.addEventListener('click', safe(async e => {
    const t = e.target;
    const go = t.closest('[data-go]');
    if (go) {
      const v = go.dataset.go;
      if (v === 'library') { await refresh(); renderLibrary(); }
      else if (v === 'review') openReview();
      else if (v === 'settings') openSettings();
      else if (v === 'reading') { const r = LIB.ribbon || (allPages()[0] && { page: allPages()[0].id }); if (r) openPage(r.page, r.block); }
      return;
    }
    const next = t.closest('[data-next]');
    if (next) { await api('mark_read', { page: PAGE.page.id }); await refresh(); if (next.dataset.lab) openLab(next.dataset.lab); else openPage(next.dataset.next); return; }
    if (t.closest('[data-done]')) { await api('mark_read', { page: PAGE.page.id }); await refresh(); renderLibrary(); return; }
    const lab = t.closest('[data-lab]'); if (lab) { openLab(lab.dataset.lab); return; }
    const open = t.closest('[data-open]'); if (open) { e.preventDefault(); openPage(open.dataset.open, open.dataset.block ? +open.dataset.block : undefined); return; }
    const book = t.closest('[data-book]'); if (book) { openBook(book.dataset.book); return; }
    const col = t.closest('[data-col]'); if (col) openCollection(col.dataset.col);
  }));

  lb.addEventListener('keydown', e => {
    if (labOn || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if ((e.ctrlKey || e.metaKey) && e.key === '.') { e.preventDefault(); if (cur === 'reading') setFocus(!lb.classList.contains('focus')); return; }
    if (e.key === 'Escape') { hideSel(); setFocus(false); }
    if (cur === 'library' && e.key === 'Enter' && e.target === lb) { const b = $('#libIn .continue .btn.pri'); if (b) b.click(); }
    if (cur === 'review') {
      if (e.key === ' ') { e.preventDefault(); reveal(); }
      else if (revealed && /^[1-4]$/.test(e.key)) grade(['again', 'hard', 'good', 'easy'][+e.key - 1]);
    }
  });

  /* ---------- the window itself ---------- */
  const tauriWin = window.__TAURI__ && window.__TAURI__.window ? window.__TAURI__.window.getCurrentWindow() : null;
  if (tauriWin) {
    $('#tbCtl').hidden = false;
    const syncMax = async () => lb.classList.toggle('maxed', await tauriWin.isMaximized());
    $('#tbCtl').addEventListener('click', e => {
      const b = e.target.closest('[data-win]'); if (!b) return;
      if (b.dataset.win === 'min') tauriWin.minimize();
      else if (b.dataset.win === 'max') tauriWin.toggleMaximize().then(syncMax);
      else tauriWin.close();
    });
    tauriWin.onResized(syncMax); syncMax();
    tauriWin.onFocusChanged(({ payload }) => lb.classList.toggle('blurred', !payload));
  }

  // Our own right-click menu instead of the browser's.
  let ctx = null;
  const closeCtx = () => { if (ctx) { ctx.remove(); ctx = null; } };
  const openCtx = (x, y, items) => {
    closeCtx();
    ctx = document.createElement('div'); ctx.className = 'ctx'; ctx.setAttribute('role', 'menu');
    ctx.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : `<button type="button" role="menuitem" data-i="${i}" ${it.off ? 'disabled' : ''}>${esc(it.label)}${it.key ? `<span>${esc(it.key)}</span>` : ''}</button>`).join('');
    lb.appendChild(ctx);
    const r = ctx.getBoundingClientRect();
    ctx.style.left = Math.min(x, innerWidth - r.width - 8) + 'px'; ctx.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
    ctx.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b || b.disabled) return; const it = items[+b.dataset.i]; closeCtx(); it.run(); });
  };
  document.addEventListener('contextmenu', e => {
    e.preventDefault();
    const field = e.target.closest('input, textarea');
    const sel = window.getSelection(), text = sel && !sel.isCollapsed ? sel.toString() : '';
    const items = [];
    if (field) {
      items.push({ label: 'Cut', key: 'Ctrl X', off: field.selectionStart === field.selectionEnd, run: () => document.execCommand('cut') });
      items.push({ label: 'Copy', key: 'Ctrl C', off: field.selectionStart === field.selectionEnd, run: () => document.execCommand('copy') });
      items.push({ label: 'Paste', key: 'Ctrl V', run: async () => { try { const t = await navigator.clipboard.readText(); field.setRangeText(t, field.selectionStart, field.selectionEnd, 'end'); } catch { toast('Use Ctrl V to paste here.'); } } });
      items.push('-', { label: 'Select all', key: 'Ctrl A', run: () => field.select() });
    } else if (text && cur === 'reading' && e.target.closest('#course p[data-b]')) {
      items.push({ label: 'Highlight', run: () => selbar.querySelector('[data-act="mark"]').click() });
      items.push({ label: 'Add a note', run: () => selbar.querySelector('[data-act="note"]').click() });
      items.push({ label: 'Collect', run: () => selbar.querySelector('[data-act="collect"]').click() });
      items.push('-', { label: 'Copy', key: 'Ctrl C', run: () => navigator.clipboard.writeText(text).catch(() => document.execCommand('copy')) });
    } else if (text) {
      items.push({ label: 'Copy', key: 'Ctrl C', run: () => navigator.clipboard.writeText(text).catch(() => document.execCommand('copy')) });
    } else {
      items.push({ label: 'Library', run: () => lb.querySelector('[data-go="library"]').click() });
      items.push({ label: 'Reading now', run: () => lb.querySelector('[data-go="reading"]').click() });
      items.push({ label: 'Review', run: () => lb.querySelector('[data-go="review"]').click() });
      items.push('-', { label: panes.side ? 'Hide the sidebar' : 'Show the sidebar', key: 'Ctrl B', run: () => setPane('side', !panes.side) });
      if (cur === 'reading') items.push({ label: panes.list ? 'Hide the page list' : 'Show the page list', key: 'Ctrl Shift B', run: () => setPane('list', !panes.list) });
      items.push({ label: 'Settings', run: () => openSettings() });
      items.push('-', { label: lb.dataset.theme === 'dark' ? 'Light theme' : 'Dark theme', run: () => setTheme(lb.dataset.theme === 'dark' ? 'light' : 'dark') });
    }
    openCtx(e.clientX, e.clientY, items);
  });
  document.addEventListener('pointerdown', e => { if (ctx && !e.target.closest('.ctx')) closeCtx(); }, true);
  window.addEventListener('blur', closeCtx);

  // This is an app, not a web page: no reload, print, find bar or view source.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCtx();
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (e.key === 'F5' || e.key === 'F3' || e.key === 'F7' || (mod && ['r', 'p', 'u', 'f', 'g', 'j', 's', 'o', 'n', 'h'].includes(k)) || (mod && e.shiftKey && ['i', 'c'].includes(k)) || (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))) e.preventDefault();
  }, true);
  document.addEventListener('dragstart', e => { if (!e.target.closest || !e.target.closest('#course')) e.preventDefault(); });
  window.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });

  safe(async () => {
    await refresh(); renderLibrary();
    // The window stays hidden until the first screen is drawn, so it never flashes white.
    if (tauriWin) requestAnimationFrame(() => tauriWin.show());
  })();
})();
