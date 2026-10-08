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
  const SHORT = { itn: 'Networks', srwe: 'Switching', ensa: 'Enterprise' };
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
    $('#navBooks').innerHTML = LIB.books.map(b => `<button class="si" type="button" data-book="${b.id}"><span class="spn ${b.cloth}"></span><span>${esc(SHORT[b.id] || b.short)}</span><span class="n">${b.pages ? `${b.read}/${b.pages}` : ''}</span></button>`).join('');
    $('#navCols').innerHTML = LIB.collections.map(c => `<button class="si" type="button" data-col="${c.id}"><svg viewBox="0 0 16 16" aria-hidden="true">${COL_ICON[c.id] || COL_ICON.commands}</svg><span>${esc(c.title)}</span><span class="n">${c.count}</span></button>`).join('');
    markNav();
  };
  const markNav = (key) => {
    $$('#nav .si').forEach(b => {
      const on = (b.dataset.go && b.dataset.go === cur) || (key && (b.dataset.col === key || b.dataset.book === key));
      on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current');
    });
  };
  const show = (v, key) => {
    cur = v;
    $$('.view').forEach(x => x.classList.toggle('on', x.dataset.view === v));
    markNav(key);
    hideSel();
    const a = document.activeElement; if (!lb.contains(a) || a.offsetParent === null) lb.focus({ preventScroll: true });
  };

  /* ---------- covers ---------- */
  const PAT = {
    itn: Array.from({ length: 7 }, (_, i) => `<circle cx="150" cy="96" r="${22 + i * 20}" fill="none" stroke="currentColor" stroke-opacity=".16"/>`).join(''),
    srwe: Array.from({ length: 9 }, (_, i) => `<path d="M${-10 + i * 26} 0 V 70 L ${30 + i * 22} 150 V 300" fill="none" stroke="currentColor" stroke-opacity=".17"/>`).join(''),
    ensa: Array.from({ length: 6 }, (_, i) => `<path d="M0 ${40 + i * 24} H 200" stroke="currentColor" stroke-opacity=".14"/><path d="M${30 + i * 30} 30 V 160" stroke="currentColor" stroke-opacity=".14"/>`).join('') + '<path d="M30 160 H 90 V 88 H 150 V 40 H 200" fill="none" stroke="currentColor" stroke-opacity=".38" stroke-width="1.6"/>',
  };
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
      return `<button class="book ${b.id}${b.pages ? '' : ' locked'}" type="button" data-book="${b.id}"><span class="cover ${b.cloth}"><svg viewBox="0 0 200 292" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${PAT[b.cloth] || ''}</svg>${ribbon && ribbon.book.id === b.id ? '<span class="ribbon" aria-hidden="true"></span>' : ''}<span><span class="t">${esc(b.title)}</span><span class="v" style="display:block">${esc(b.short)}</span></span></span><span class="meta"><b>${m}</b><span>${s}</span></span></button>`;
    }).join('');
    const cont = ribbon
      ? `<div class="continue"><div><b>${esc(ribbon.page.title)}</b><span>${esc(ribbon.book.title)}, chapter ${ribbon.chapter.number}. The ribbon is where you stopped.</span></div><button class="btn pri" type="button" data-open="${esc(ribbon.page.id)}" data-block="${LIB.ribbon.block}">Continue reading <span class="k">Enter</span></button></div>`
      : firstPage ? `<div class="continue"><div><b>${esc(firstPage.title)}</b><span>${esc(firstPage.summary)}</span></div><button class="btn pri" type="button" data-open="${esc(firstPage.id)}">Start reading <span class="k">Enter</span></button></div>` : '';
    const lab = nextLab ? `<div class="continue"><div><b>${esc(nextLab.title)}</b><span>${esc(nextLab.summary)}</span></div><button class="btn line" type="button" data-lab="${esc(nextLab.lab)}">Open the lab</button></div>` : '';
    const recent = LIB.recent.length ? `<div class="lib-sec"><h2>Lately collected</h2><div class="blocks">${LIB.recent.map(piece).join('')}</div></div>` : `<div class="lib-sec"><h2>Lately collected</h2><p style="margin:0;color:var(--ink3)">Select any sentence while reading and press Collect. It lands here and in your collections.</p></div>`;
    $('#libIn').innerHTML = `<div class="lib-head"><h1>Your library</h1><p>Three books, read in order. The ribbon marks where you stopped.</p></div><div class="shelf">${shelf}</div>${cont}${lab}${recent}`;
    show('library');
  };

  const openBook = id => {
    const b = LIB.books.find(x => x.id === id); if (!b) return;
    $('#bookIn').innerHTML = `<div class="lib-head"><h1>${esc(b.title)}</h1><p>${esc(b.short)}. ${b.pages ? `${b.read} of ${b.pages} pages read.` : 'Its pages are being written. The chapters below follow the official course.'}</p></div><div class="ch-list">${b.chapters.map(c => `<button class="ch" type="button" ${c.pages.length ? `data-open="${esc(c.pages[0].id)}"` : 'disabled'}><span>${c.number}</span>${esc(c.title)}<span>${c.pages.length ? `${c.pages.filter(p => p.read).length} of ${c.pages.length} read` : ''}</span></button>`).join('')}</div>`;
    show('book', id);
  };

  /* ---------- reading ---------- */
  const inline = (text, marks) => {
    let h = esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*(.+?)\*/g, '<em>$1</em>');
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
    $('#crumbs').innerHTML = `${esc(book.title)}<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3.5 2l3 3-3 3"/></svg>${esc(chapter.title)}`;
    renderDoc(index, chapter.pages.length);
    show('reading');
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
      else if (b.type === 'question') {
        const seen = PAGE.answered.includes(i);
        h = `<div class="ask" data-b="${i}" data-q="${i}"><p>${esc(b.prompt)}</p><div class="opts">${b.options.map((o, c) => `<button class="opt" type="button" data-c="${c}">${esc(o)}</button>`).join('')}</div><p class="fb">${seen ? 'You have answered this before. It is in your review.' : ''}</p></div>`;
      } else if (b.type === 'figure') h = `<div data-b="${i}" data-fig="${esc(b.id)}">${(window.OCTET_FIGURES[b.id] || { html: () => '' }).html()}</div>`;
      else if (b.type === 'lab') {
        const lp = allPages().find(x => x.lab === b.id);
        h = `<div class="lab-block" data-b="${i}"><div><b>${esc(lp ? lp.title : 'Lab')}</b><span>${lp && lp.passed ? 'Passed. Open it again any time.' : 'Opens on a live map of the network.'}</span></div><button class="btn pri" type="button" data-lab="${esc(b.id)}">Open the lab</button></div>`;
      }
      return h + (notesBy[i] || []).map(noteHTML).join('');
    }).join('');
    const links = PAGE.links.map(l => `<button class="chip" type="button" data-open="${esc(l.id)}">${esc(l.title)}</button>`).join('');
    const loc = findPage(p.id), next = loc.chapter.pages[index + 1];
    const nextBtn = next ? (next.lab ? `<button class="btn line" type="button" data-next="${esc(next.id)}" data-lab="${esc(next.lab)}">Next: ${esc(next.title)}</button>` : `<button class="btn line" type="button" data-next="${esc(next.id)}">Next page</button>`) : `<button class="btn line" type="button" data-done>Back to the library</button>`;
    $('#doc').innerHTML = `<h1>${esc(p.meta.title)}</h1><p class="sub">Page ${index + 1} of ${count} in this chapter.${PAGE.notes.length ? ` Your notes here: ${PAGE.notes.length}.` : ''}</p><div class="course" id="course">${blocks}</div>${links ? `<div class="linked"><h3>Linked pages</h3><div class="chips">${links}</div></div>` : ''}<div class="doc-foot"><span>${esc(loc.book.title)}, chapter ${loc.chapter.number}</span>${nextBtn}</div>`;
    $$('#course [data-fig]').forEach(el => { const f = window.OCTET_FIGURES[el.dataset.fig]; if (f) f.wire(el, reduce); });
  };

  // Answer a question in the text.
  lb.addEventListener('click', safe(async e => {
    const opt = e.target.closest('.ask .opt'); if (!opt) return;
    const ask = opt.closest('.ask'), block = +ask.dataset.q;
    const r = await api('answer', { page: PAGE.page.id, block, choice: +opt.dataset.c });
    ask.querySelectorAll('.opt').forEach(o => { o.classList.remove('ok', 'no'); o.disabled = true; });
    opt.classList.add(r.correct ? 'ok' : 'no');
    if (!r.correct) ask.querySelector(`.opt[data-c="${r.answer}"]`).classList.add('ok');
    ask.querySelector('.fb').textContent = `${r.correct ? 'Right.' : 'Not quite.'} ${r.why} It comes back ${r.next.toLowerCase()}.${r.correct ? '' : ' Saved to Things I got wrong.'}`;
    refresh();
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
    card.innerHTML = `<p class="q">${esc(c.prompt)}</p><button class="reveal" type="button" id="rv"><span class="k">Space</span>Show answer</button><div class="ans" id="an" hidden><p style="margin:0;font:600 17px var(--f-ui);color:var(--ink)">${esc(c.answer)}</p><p>${esc(c.why)}</p><div class="grades">${['Again', 'Hard', 'Good', 'Easy'].map((g, i) => `<button type="button" data-g="${g.toLowerCase()}"><b>${g} <span class="k">${i + 1}</span></b><span>${esc(c.previews[i])}</span></button>`).join('')}</div></div><div class="card-meta"><span>From ${esc(c.source)}</span><span>${ci + 1} of ${DUE.length}</span></div>`;
  };
  const openReview = safe(async () => { DUE = await api('review_due'); ci = 0; renderCard(); show('review'); });
  const reveal = () => { if (revealed || ci >= DUE.length) return; revealed = true; $('#an').hidden = false; $('#rv').hidden = true; };
  const grade = safe(async g => { await api('review_grade', { id: DUE[ci].id, grade: g }); ci++; renderCard(); refresh(); });
  $('#card').addEventListener('click', e => { if (e.target.closest('#rv')) reveal(); const g = e.target.closest('[data-g]'); if (g) grade(g.dataset.g); });

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
    labw.classList.add('on'); hideSel(); setTool('move');
    renderBrief(); refreshMap(); renderPanel();
    setTimeout(() => $('#runChk').focus({ preventScroll: true }), 50);
  });
  const closeLab = async () => { labOn = false; labw.classList.remove('on'); await refresh(); if (PAGE) openPage(PAGE.page.id); else renderLibrary(); };
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
      else if (v === 'reading') { const r = LIB.ribbon || (allPages()[0] && { page: allPages()[0].id }); if (r) openPage(r.page, r.block); }
      return;
    }
    const next = t.closest('[data-next]');
    if (next) { await api('mark_read', { page: PAGE.page.id }); await refresh(); if (next.dataset.lab) openLab(next.dataset.lab); else openPage(next.dataset.next); return; }
    if (t.closest('[data-done]')) { await api('mark_read', { page: PAGE.page.id }); await refresh(); renderLibrary(); return; }
    const lab = t.closest('[data-lab]'); if (lab) { openLab(lab.dataset.lab); return; }
    const open = t.closest('[data-open]'); if (open) { openPage(open.dataset.open, open.dataset.block ? +open.dataset.block : undefined); return; }
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

  safe(async () => { await refresh(); renderLibrary(); })();
})();
