// Reading aloud. Press Listen and Octet reads the page from the top: the
// sentence being read is highlighted and kept in view. At a diagram it reads
// the caption, shows the diagram and waits a few seconds; at a question it
// reads the question and waits for your answer.
//
// Two voices: Kokoro (voice/worker.js), natural and fully offline once it is
// downloaded, and the system's own voice, which needs no download.
(() => {
  const lb = document.getElementById('lb');
  const $ = s => lb.querySelector(s);
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- settings ---------- */
  const VOICES = [
    ['af_heart', 'Heart', 'American, warm'], ['af_bella', 'Bella', 'American, bright'],
    ['am_michael', 'Michael', 'American, calm'], ['am_fenrir', 'Fenrir', 'American, deep'],
    ['bf_emma', 'Emma', 'British'], ['bm_george', 'George', 'British'],
  ];
  const SPEEDS = [0.75, 1, 1.25, 1.5];
  const HOLDS = [[3, '3 seconds'], [5, '5 seconds'], [8, '8 seconds'], [0, 'Until I press play']];
  const DEF = { engine: '', voice: 'af_heart', speed: 1, hold: 5, ask: true };
  const prefs = (() => { try { return { ...DEF, ...JSON.parse(localStorage.getItem('octet-voice') || '{}') }; } catch { return { ...DEF }; } })();
  const save = () => { try { localStorage.setItem('octet-voice', JSON.stringify(prefs)); } catch { /* private mode */ } };

  /* ---------- the Kokoro worker ---------- */
  let worker = null, wid = 0;
  const waiting = new Map();
  const kokoro = () => {
    if (!worker) {
      worker = new Worker('voice/worker.js', { type: 'module' });
      worker.onmessage = ({ data }) => { const w = waiting.get(data.id); if (!w) return; if (data.type === 'progress') { if (w.progress) w.progress(data); return; } waiting.delete(data.id); data.error ? w.fail(new Error(data.error)) : w.ok(data); };
      worker.onerror = e => { for (const w of waiting.values()) w.fail(new Error(e.message || 'The voice stopped.')); waiting.clear(); worker = null; };
    }
    return worker;
  };
  const ask = (msg, progress) => new Promise((ok, fail) => { const id = ++wid; waiting.set(id, { ok, fail, progress }); kokoro().postMessage({ ...msg, id }); });
  let STATUS = null; // { installed }
  const status = async () => (STATUS = STATUS || await ask({ type: 'status' }).catch(() => ({ installed: false })));
  let installing = null;
  const install = onProgress => installing = installing || ask({ type: 'install', voices: VOICES.map(v => v[0]) }, onProgress)
    .then(() => { STATUS = { installed: true }; prefs.engine = 'kokoro'; save(); })
    .finally(() => { installing = null; });

  /* ---------- turning a page into things to say ---------- */
  // Words that read badly as written. Letters stay letters (D H C P); a few
  // acronyms are said as words.
  const WORDS = new Set(['LAN', 'LANS', 'WAN', 'WANS', 'NAT', 'RAM', 'ROM', 'NVRAM', 'MAC', 'MACS', 'ARP', 'NIC', 'NICS', 'SOHO', 'ASCII', 'CAM', 'POST', 'PIN', 'LED', 'LEDS', 'OK', 'ASIC', 'WLAN', 'DOS', 'IOS', 'CISCO', 'FAQ', 'RADIUS', 'TACACS', 'VOIP', 'SNMP']);
  const SAY = { VLAN: 'V-LAN', VLANS: 'V-LANs', WLAN: 'W-LAN', IOS: 'I O S', NVRAM: 'N V RAM', VOIP: 'voice over I P', SNMP: 'S N M P', TACACS: 'tack-acks' };
  const IFNAME = { g: 'gigabit ', gi: 'gigabit ', gig: 'gigabit ', gigabitethernet: 'gigabit ethernet ', f: 'fast ethernet ', fa: 'fast ethernet ', fastethernet: 'fast ethernet ', s: 'serial ', se: 'serial ', serial: 'serial ', e: 'ethernet ', eth: 'ethernet ', ethernet: 'ethernet ', vlan: 'V-LAN ', te: 'ten gig ', lo: 'loopback ', loopback: 'loopback ' };
  const ipWords = ip => ip.split('.').join(' dot ');
  const speakable = t => t
    .replace(/\be\.g\.,?/gi, 'for example,').replace(/\bi\.e\.,?/gi, 'that is,').replace(/\betc\./gi, 'and so on.').replace(/\bvs\.?\b/gi, 'versus')
    .replace(/\b802\.(\d+)([A-Za-z]*)\b/g, (m, n, l) => `eight oh two dot ${n} ${l.toUpperCase().split('').join(' ')}`)
    .replace(/\b(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})\b/g, (m, ip, p) => `${ipWords(ip)} slash ${p}`)
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, ipWords)
    .replace(/(^|[\s(])\/(\d{1,2})\b/g, '$1slash $2')
    .replace(/\b(GigabitEthernet|FastEthernet|Ethernet|Serial|Loopback|Vlan|Gig|Gi|Fa|Se|Eth|Lo|Te|G|F|S|E)\s?(\d+(?:\/\d+)+|\d+)(?:\.(\d+))?\b/gi, (m, k, n, sub) => IFNAME[k.toLowerCase()] === undefined || (/^[GFSE]$/i.test(k) && !n.includes('/')) ? m : `${IFNAME[k.toLowerCase()]}${n.split('/').join(' slash ')}${sub ? ' point ' + sub : ''}`)
    .replace(/(\d+)\s?(G|M|K)bps\b/g, (m, n, u) => `${n} ${({ G: 'gigabits', M: 'megabits', K: 'kilobits' })[u]} per second`)
    .replace(/\b([A-Z]{2,7})(s?)\b/g, (m, w, s) => { const up = (w + s).toUpperCase(); if (SAY[up]) return SAY[up]; if (SAY[w]) return SAY[w] + s; if (WORDS.has(up) || WORDS.has(w)) return m; return w.split('').join(' ') + (s ? "'s" : ''); })
    .replace(/[→⟶]/g, ' to ').replace(/[←]/g, ' from ').replace(/\s*[—–]\s*/g, ', ').replace(/[*_`#>]/g, ' ')
    .replace(/\s+/g, ' ').trim();

  // Sentence ends: a stop, then space, then something that can start a sentence.
  const SPLIT = /(?<=[.!?:])["”’)]?\s+(?=["“‘(]?[A-Z0-9])/g;
  const ABBR = /\b(e\.g|i\.e|etc|vs|Fig|No|approx)\.$/i;
  // Ranges in the page for each sentence of `el`, so it can be highlighted.
  const sentences = el => {
    const nodes = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('button, .fb, .opts, .cmdline, .hint') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    let text = '';
    for (let n; (n = tw.nextNode());) { nodes.push([n, text.length]); text += n.data; }
    const cuts = [0];
    for (const m of text.matchAll(SPLIT)) if (!ABBR.test(text.slice(0, m.index + 1).trimEnd())) cuts.push(m.index + m[0].length);
    cuts.push(text.length);
    const at = off => { let i = nodes.length - 1; while (i > 0 && nodes[i][1] > off) i--; const [n, s] = nodes[i] || [el, 0]; return [n, Math.min(off - s, n.length ?? 0)]; };
    const out = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const raw = text.slice(cuts[i], cuts[i + 1]); if (!raw.trim()) continue;
      const r = document.createRange();
      try { r.setStart(...at(cuts[i] + raw.length - raw.trimStart().length)); r.setEnd(...at(cuts[i] + raw.trimEnd().length)); } catch { r.selectNodeContents(el); }
      // very long sentences are said in parts, at a semicolon or comma
      const parts = raw.length > 280 ? raw.split(/(?<=[;,])\s+/) : [raw];
      for (const p of parts) out.push({ say: speakable(p), range: r });
    }
    return out.filter(x => x.say);
  };

  const LABEL = { key: 'Remember this.', exam: 'On the exam.', trap: 'Watch out.', deeper: 'Going deeper.' };
  // Every thing to say on the page, in order. `stop` is what happens after it:
  // 'figure' waits a few seconds, 'ask' waits for an answer.
  const script = course => {
    const out = [];
    for (const el of course.children) {
      if (!el.dataset || el.dataset.b === undefined || el.classList.contains('mine')) continue;
      const add = (target, extra = {}) => sentences(target).forEach(s => out.push({ el, ...s, ...extra }));
      const said = (say, extra = {}) => out.push({ el, say: speakable(say), range: null, ...extra });
      const tag = el.tagName;
      if (tag === 'P' || el.classList.contains('hd')) add(el);
      else if (tag === 'UL' || tag === 'OL') el.querySelectorAll(':scope > li').forEach(li => add(li));
      else if (el.classList.contains('call')) { const k = [...el.classList].find(c => c.startsWith('k-')); said(LABEL[k && k.slice(2)] || 'A note.'); el.querySelectorAll(':scope > p, :scope li').forEach(x => add(x)); }
      else if (el.matches('.fig-d, .fig-f, [data-fig]')) {
        const cap = el.querySelector('figcaption, .cap span');
        if (cap && cap.textContent.trim()) sentences(cap).forEach((s, i, a) => out.push({ el, ...s, stop: i === a.length - 1 ? 'figure' : '' }));
        else said(el.matches('.fig-f') ? 'Here is the header layout.' : 'Here is a diagram.', { stop: 'figure' });
      } else if (el.classList.contains('tbl')) said('Here is a table.', { stop: 'figure' });
      else if (el.classList.contains('dcon')) said(`Here is the output of ${(el.querySelector('figcaption span') || {}).textContent || 'the device'}.`, { stop: 'figure' });
      else if (el.classList.contains('ask') || el.classList.contains('recall')) {
        const p = el.querySelector(':scope > p, .front'); if (p) sentences(p).forEach(s => out.push({ el, ...s }));
        const opts = [...el.querySelectorAll('.opt')];
        if (opts.length && !el.classList.contains('recall')) opts.forEach((o, i) => out.push({ el, say: `${'ABCDEFGH'[i]}: ${speakable(o.textContent)}`, range: rangeOf(o) }));
        if (out.length && out[out.length - 1].el === el) out[out.length - 1].stop = 'ask';
      } else if (el.classList.contains('lab-block')) said(`There's a lab here: ${el.querySelector('b').textContent}. Open it when you're ready.`);
    }
    return out;
  };
  const rangeOf = el => { const r = document.createRange(); r.selectNodeContents(el); return r; };

  /* ---------- playing ---------- */
  const audio = new Audio(); audio.preservesPitch = true;
  let S = null; // the reading in progress
  const hl = window.CSS && CSS.highlights && window.Highlight ? CSS.highlights : null;

  const engine = () => prefs.engine === 'kokoro' && STATUS && STATUS.installed ? 'kokoro' : 'system';
  const sysVoice = () => {
    const vs = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
    return vs.find(v => /natural|online/i.test(v.name) && /en-US/i.test(v.lang)) || vs.find(v => /natural|online/i.test(v.name)) || vs.find(v => v.default) || vs[0] || null;
  };

  // Ask for audio a few sentences ahead, so there are no gaps.
  const AHEAD = 6;
  let slowSaid = false;
  const want = (i, urgent) => {
    const it = S.items[i]; if (!it || it.audio || engine() !== 'kokoro') return;
    const id = wid + 1; it.req = id;
    it.audio = ask({ type: 'speak', text: it.say, voice: prefs.voice, urgent: !!urgent }).then(r => r.dropped ? null : r);
    it.audio.catch(() => {});
  };
  const prefetch = () => { for (let i = S.i; i < Math.min(S.items.length, S.i + AHEAD); i++) want(i); };
  const dropAhead = () => {
    if (!S || engine() !== 'kokoro') return;
    const ids = S.items.filter((it, i) => it.req && (i < S.i || i >= S.i + AHEAD)).map(it => { const id = it.req; it.req = 0; it.audio = null; return id; });
    if (ids.length && worker) worker.postMessage({ type: 'drop', ids });
  };

  const show = it => {
    if (hl) { if (it && it.range) hl.set('octet-reading', new Highlight(it.range)); else hl.delete('octet-reading'); }
    lb.querySelectorAll('#course > .rd-on').forEach(x => x !== (it && it.el) && x.classList.remove('rd-on'));
    if (!it) return;
    it.el.classList.add('rd-on');
    if (lb.classList.contains('focus')) { lb.querySelectorAll('#course > .cur').forEach(x => x.classList.remove('cur')); it.el.classList.add('cur'); }
    const sc = $('#edScroll'), box = (it.range && it.range.getClientRects().length ? it.range : it.el).getBoundingClientRect(), view = sc.getBoundingClientRect();
    const tall = it.stop === 'figure' ? it.el.getBoundingClientRect() : box;
    if (tall.top < view.top + 60 || tall.bottom > view.bottom - 110) sc.scrollBy({ top: (it.stop === 'figure' ? it.el.getBoundingClientRect().top - view.top - 70 : box.top - view.top - view.height * 0.38), behavior: reduce ? 'auto' : 'smooth' });
  };

  const say = async it => {
    if (engine() === 'system') {
      if (!window.speechSynthesis) throw new Error('This computer has no system voice.');
      await new Promise((ok, fail) => {
        const u = new SpeechSynthesisUtterance(it.say), v = sysVoice();
        if (v) u.voice = v; u.lang = v ? v.lang : 'en-US'; u.rate = prefs.speed;
        u.onend = ok; u.onerror = e => e.error === 'interrupted' || e.error === 'canceled' ? ok() : fail(new Error('The system voice failed: ' + e.error));
        S.cancel = () => speechSynthesis.cancel();
        speechSynthesis.speak(u);
      });
      return;
    }
    if (!it.audio) { if (S.items[S.i] === it) want(S.i, true); else { it.audio = ask({ type: 'speak', text: it.say, voice: prefs.voice, urgent: true }); it.audio.catch(() => {}); } }
    let r = null;
    const t = setTimeout(() => S && S.cur === it && bar('Preparing the voice…'), 250), t0 = performance.now();
    try { r = await it.audio; } finally { clearTimeout(t); }
    // On a slow processor the natural voice can't keep up: say so, once.
    if (S && (S.waited = (S.waited || 0) + Math.max(0, performance.now() - t0 - 250)) > 12000 && !slowSaid) { slowSaid = true; toast('This computer makes the natural voice wait between sentences. The system voice never waits: pick it with the voice button.'); }
    if (!r || !S || S.cur !== it || S.paused || S.jumped) return;
    bar();
    const url = URL.createObjectURL(new Blob([r.wav], { type: 'audio/wav' }));
    await new Promise((ok, fail) => {
      audio.src = url; audio.playbackRate = prefs.speed; audio.preservesPitch = true;
      audio.onended = ok; audio.onerror = () => fail(new Error("The voice couldn't play."));
      S.cancel = () => { audio.pause(); ok(); };
      audio.play().catch(fail);
    }).finally(() => URL.revokeObjectURL(url));
  };

  // A diagram stays on screen for a few seconds, or until you press play.
  const hold = it => new Promise(done => {
    const ok = () => { S && (S.release = null); done(); };
    S.release = ok; // pause, skip or stop ends the look early
    const what = it.el.matches('.tbl') ? 'table' : it.el.matches('.dcon') ? 'output' : 'diagram';
    if (!prefs.hold) { pause(`Look at the ${what}. Press play when you're done.`); return; }
    let left = prefs.hold;
    const tick = () => { if (!S || S.cur !== it || S.paused) return; bar(`Look at the ${what}: carrying on in ${left} s`); if (left-- <= 0) { bar(); return ok(); } S.timer = setTimeout(tick, 1000); };
    tick();
  });
  // A question waits for your answer, then reads what Octet says back.
  const answered = el => { const fb = el.querySelector('.fb'); return fb && fb.textContent.trim() ? fb.textContent.trim() : el.classList.contains('recall') && el.querySelector('[data-knew][disabled]') ? (el.querySelector('.fb') || {}).textContent : ''; };
  const wait = it => new Promise(ok => {
    if (answered(it.el) || !prefs.ask) return ok(null);
    bar(it.el.classList.contains('cmdq') ? 'Your turn: type the command, then I carry on.' : it.el.classList.contains('recall') ? 'Your turn: say it to yourself, then show the answer.' : 'Your turn: answer, then I carry on.', 'wait');
    const inp = it.el.querySelector('input'); if (inp && !inp.disabled) setTimeout(() => inp.focus({ preventScroll: true }), 50);
    const mo = new MutationObserver(() => { const a = answered(it.el); if (a) { mo.disconnect(); S.skipWait = null; ok(a); } });
    mo.observe(it.el, { subtree: true, childList: true, characterData: true, attributes: true });
    S.skipWait = () => { mo.disconnect(); ok(null); };
  });

  const run = async () => {
    const me = S;
    while (S === me && S.i < S.items.length) {
      if (S.paused) { await new Promise(ok => { S.resume = ok; }); if (S !== me) return; continue; }
      const it = S.items[S.i]; S.cur = it;
      show(it); if (engine() === 'kokoro') want(S.i, true); prefetch();
      try { await say(it); } catch (e) { stop(); toast(e.message); return; }
      if (S !== me) return;
      if (S.paused) continue; // paused mid-sentence: say it again on play
      if (S.jumped) { S.jumped = false; continue; }
      if (it.stop === 'figure') { await hold(it); if (S !== me) return; }
      if (it.stop === 'ask') {
        const fb = await wait(it); if (S !== me) return;
        if (fb) { bar(); try { S.cur = { el: it.el, say: speakable(fb) }; await say(S.cur); } catch { /* go on */ } if (S !== me) return; }
      }
      if (S.jumped) { S.jumped = false; continue; }
      S.i++; dropAhead();
    }
    if (S === me) { show(null); bar('End of the page.', 'end'); S.done = true; renderBar(); }
  };

  /* ---------- controls ---------- */
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.remove('hide'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hide'), 3200); };
  const halt = () => { if (!S) return; clearTimeout(S.timer); if (S.cancel) S.cancel(); if (window.speechSynthesis) speechSynthesis.cancel(); audio.pause(); };
  const pause = msg => { if (!S) return; S.paused = true; halt(); if (S.release) S.resume = S.release; bar(msg || 'Paused.'); renderBar(); };
  const play = () => {
    if (!S) return start();
    if (S.done) { S.done = false; S.i = 0; S.paused = false; renderBar(); run(); return; }
    if (S.skipWait) { const f = S.skipWait; S.skipWait = null; f(); }
    S.paused = false; bar(); renderBar();
    const r = S.resume; S.resume = null; if (r) r();
  };
  const jump = d => {
    if (!S) return;
    const to = Math.max(0, Math.min(S.items.length - 1, S.i + d));
    halt(); if (S.skipWait) { const f = S.skipWait; S.skipWait = null; f(); }
    if (S.release) { S.resume = null; S.release(); }
    S.i = to; S.jumped = !S.paused; S.done = false; dropAhead();
    if (S.paused) { S.cur = S.items[to]; show(S.cur); } else { const r = S.resume; S.resume = null; if (r) r(); }
    renderBar();
  };
  const stop = () => {
    if (!S) return;
    const was = S; S = null; halt(); clearTimeout(was.timer);
    if (worker) { const ids = was.items.filter(it => it.req).map(it => it.req); if (ids.length) worker.postMessage({ type: 'drop', ids }); }
    if (was.resume) was.resume(); if (was.skipWait) was.skipWait(); if (was.release) was.release();
    show(null); lb.querySelectorAll('.rd-on').forEach(x => x.classList.remove('rd-on'));
    const b = $('#rdBar'); if (b) b.hidden = true;
    $('#listenBtn').setAttribute('aria-pressed', 'false');
  };

  const start = async (from = 0) => {
    const course = $('#course'); if (!course) return;
    if (!prefs.engine) { offer(); return; }
    if (prefs.engine === 'kokoro') { await status(); if (!STATUS.installed) { prefs.engine = ''; save(); offer(); return; } }
    stop();
    // start at the first sentence you can see, unless asked otherwise
    const items = script(course); if (!items.length) { toast('Nothing on this page to read.'); return; }
    if (from === 'view') { const top = $('#edScroll').getBoundingClientRect().top + 40; from = Math.max(0, items.findIndex(it => it.el.getBoundingClientRect().bottom > top)); }
    S = { items, i: from || 0, paused: false };
    $('#listenBtn').setAttribute('aria-pressed', 'true');
    renderBar(); run();
  };

  /* ---------- the bar ---------- */
  let note = '', noteKind = '';
  const bar = (m = '', kind = '') => { note = m; noteKind = kind; const el = $('#rdBar .rd-note'); if (el) { el.textContent = m; el.dataset.kind = kind; } };
  const ICON = {
    play: '<path d="M5 3.5v9l7.5-4.5z"/>', pause: '<path d="M5 3.5v9M11 3.5v9"/>',
    back: '<path d="M4 3.5v9M12.5 3.5 6.5 8l6 4.5z"/>', fwd: '<path d="M12 3.5v9M3.5 3.5 9.5 8l-6 4.5z"/>', close: '<path d="M4 4l8 8M12 4l-8 8"/>',
  };
  const icon = k => `<svg viewBox="0 0 16 16" aria-hidden="true">${ICON[k]}</svg>`;
  const voiceName = () => engine() === 'kokoro' ? (VOICES.find(v => v[0] === prefs.voice) || VOICES[0])[1] : 'System voice';
  const renderBar = () => {
    let b = $('#rdBar');
    if (!b) { b = document.createElement('div'); b.id = 'rdBar'; b.className = 'rd-bar'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Reading aloud'); $('.ed').appendChild(b); wireBar(b); }
    b.hidden = false; b.classList.remove('offer');
    const playing = S && !S.paused && !S.done;
    b.innerHTML = `<button type="button" class="rd-b" data-rd="back" title="Back a sentence" aria-label="Back a sentence">${icon('back')}</button>`
      + `<button type="button" class="rd-b rd-main" data-rd="${playing ? 'pause' : 'play'}" title="${playing ? 'Pause' : 'Play'}" aria-label="${playing ? 'Pause' : 'Play'}">${icon(playing ? 'pause' : 'play')}</button>`
      + `<button type="button" class="rd-b" data-rd="fwd" title="Skip ahead a sentence" aria-label="Skip ahead a sentence">${icon('fwd')}</button>`
      + `<span class="rd-sep"></span><button type="button" class="rd-t" data-rd="speed" title="Reading speed">${prefs.speed}×</button>`
      + `<button type="button" class="rd-t" data-rd="voice" title="Choose the voice">${esc(voiceName())}</button>`
      + `<span class="rd-note" data-kind="${noteKind}">${esc(note)}</span>`
      + (S && S.done && hasNext() ? `<button type="button" class="rd-t rd-next" data-rd="next">Next page</button>` : '')
      + `<button type="button" class="rd-b" data-rd="close" title="Stop reading" aria-label="Stop reading">${icon('close')}</button>`;
  };
  const hasNext = () => { const n = $('.doc-foot [data-next]'); return !!(n && !n.dataset.lab); };
  let goNext = false;
  const wireBar = b => b.addEventListener('click', e => {
    const a = e.target.closest('[data-rd]'); if (!a) return;
    const k = a.dataset.rd;
    if (k === 'play') play(); else if (k === 'pause') pause();
    else if (k === 'back') jump(-1); else if (k === 'fwd') jump(1);
    else if (k === 'close') stop();
    else if (k === 'speed') { prefs.speed = SPEEDS[(SPEEDS.indexOf(prefs.speed) + 1) % SPEEDS.length]; save(); audio.playbackRate = prefs.speed; renderBar(); if (S && engine() === 'system' && !S.paused) jump(0); }
    else if (k === 'voice') voiceMenu(a);
    else if (k === 'next') { goNext = true; $('.doc-foot [data-next]').click(); }
    else if (k === 'download') { const keep = b.innerHTML; download(b).catch(err => { b.innerHTML = keep; toast("The voice didn't download: " + err.message); }); }
    else if (k === 'system') { prefs.engine = 'system'; save(); start('view'); }
  });
  const voiceMenu = a => {
    const old = $('#rdMenu'); if (old) { old.remove(); return; }
    const m = document.createElement('div'); m.id = 'rdMenu'; m.className = 'collect-menu rd-menu';
    const inst = STATUS && STATUS.installed;
    m.innerHTML = (inst ? VOICES.map(([id, name, about]) => `<button type="button" data-v="${id}" aria-pressed="${engine() === 'kokoro' && prefs.voice === id}">${name}<span>${about}</span></button>`).join('') : `<button type="button" data-v="get">Natural voice<span>Download, about 115 MB</span></button>`)
      + `<button type="button" data-v="system" aria-pressed="${engine() === 'system'}">System voice<span>${esc((sysVoice() || {}).name || 'Built in')}</span></button>`;
    $('.ed').appendChild(m);
    const r = a.getBoundingClientRect(), ed = $('.ed').getBoundingClientRect();
    m.style.left = (r.left - ed.left) + 'px'; m.style.bottom = (ed.bottom - r.top + 6) + 'px';
    m.addEventListener('click', e => {
      const v = e.target.closest('[data-v]'); if (!v) return; m.remove();
      const at = S ? S.i : 0;
      if (v.dataset.v === 'get') { stop(); offer(); return; }
      if (v.dataset.v === 'system') prefs.engine = 'system'; else { prefs.engine = 'kokoro'; prefs.voice = v.dataset.v; }
      save(); if (S) { stop(); start(at); } else renderBar();
    });
    setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', off); } }), 0);
  };

  // The first time: offer the natural voice, or the system voice right away.
  const offer = () => {
    renderBar();
    const b = $('#rdBar'); b.classList.add('offer');
    b.innerHTML = `<div class="rd-offer"><b>Read with a natural voice?</b><span>A one-time download of about 115 MB. After that it works offline, on this computer's processor.</span></div><button type="button" class="btn pri" data-rd="download">Download it</button><button type="button" class="btn line" data-rd="system">Use the system voice</button><button type="button" class="rd-b" data-rd="close" aria-label="Close">${icon('close')}</button>`;
  };
  const download = async b => {
    b.innerHTML = `<div class="rd-offer"><b>Downloading the voice…</b><span class="rd-prog"><i style="width:0%"></i></span><span class="rd-pct">Starting</span></div><button type="button" class="btn line" data-rd="system">Use the system voice meanwhile</button>`;
    const mb = n => (n / 1048576).toFixed(0);
    await install(p => { const i = b.querySelector('.rd-prog i'), t = b.querySelector('.rd-pct'); if (i) i.style.width = (100 * p.loaded / p.total).toFixed(1) + '%'; if (t) t.textContent = `${mb(p.loaded)} of ${mb(p.total)} MB`; });
    toast('The natural voice is ready. It works offline from now on.');
    if (!S || engine() === 'system') { const at = S ? S.i : 'view'; stop(); start(at); }
    renderSettings();
  };

  /* ---------- settings page ---------- */
  let setEl = null;
  const renderSettings = async el => {
    if (el) setEl = el; if (!setEl || !setEl.isConnected) return;
    const st = await status();
    const opt = (k, v, label, on) => `<button type="button" role="radio" class="pat" data-vs="${k}" data-val="${v}" aria-checked="${on}">${label}</button>`;
    setEl.innerHTML = `<h2>Reading aloud</h2><p class="set-p">Press Listen above any page. Octet reads it from where you are, highlights the sentence, stops at diagrams for a look and waits at questions for your answer.</p>
      <div class="vs-grid">
        <span class="pick-l">Voice</span><div class="pats" role="radiogroup" aria-label="Voice">${st.installed ? VOICES.map(([id, name]) => opt('voice', id, name, engine() === 'kokoro' && prefs.voice === id)).join('') : ''}${opt('voice', 'system', 'System voice', engine() === 'system' || !st.installed)}</div>
        <span class="pick-l">Speed</span><div class="pats" role="radiogroup" aria-label="Speed">${SPEEDS.map(s => opt('speed', s, s + '×', prefs.speed === s)).join('')}</div>
        <span class="pick-l">At a diagram</span><div class="pats" role="radiogroup" aria-label="At a diagram">${HOLDS.map(([s, l]) => opt('hold', s, s ? 'Stop ' + l : l, prefs.hold === s)).join('')}</div>
        <span class="pick-l">At a question</span><div class="pats" role="radiogroup" aria-label="At a question">${opt('ask', 1, 'Wait for my answer', prefs.ask)}${opt('ask', 0, 'Read on', !prefs.ask)}</div>
      </div>
      <div class="row">${st.installed
        ? `<span class="set-p">The natural voice (Kokoro) is downloaded and works offline.</span><button class="btn ghost" type="button" data-vs="remove">Remove it</button>`
        : `<span class="set-p">The natural voice (Kokoro) isn't downloaded. It's about 115 MB, once.</span><button class="btn line" type="button" data-vs="get">Download it</button>`}</div>`;
  };
  lb.addEventListener('click', async e => {
    const v = e.target.closest('[data-vs]'); if (!v || !setEl || !setEl.contains(v)) return;
    const k = v.dataset.vs, val = v.dataset.val;
    if (k === 'voice') { if (val === 'system') prefs.engine = 'system'; else { prefs.engine = 'kokoro'; prefs.voice = val; } }
    else if (k === 'speed') prefs.speed = +val;
    else if (k === 'hold') prefs.hold = +val;
    else if (k === 'ask') prefs.ask = val === '1';
    else if (k === 'get') {
      v.disabled = true; v.textContent = 'Downloading… 0%';
      try { await install(p => { v.textContent = `Downloading… ${Math.floor(100 * p.loaded / p.total)}%`; }); toast('The natural voice is ready. It works offline from now on.'); } catch (err) { toast("The voice didn't download: " + err.message); }
    } else if (k === 'remove') {
      if (v.dataset.sure !== '1') { v.dataset.sure = '1'; v.textContent = 'Remove for good'; return; }
      stop(); await ask({ type: 'remove' }); STATUS = { installed: false }; if (prefs.engine === 'kokoro') prefs.engine = ''; toast('The natural voice is removed. The system voice still reads.');
    }
    save(); renderSettings();
  });

  /* ---------- wiring ---------- */
  $('#listenBtn').addEventListener('click', () => { if (S) stop(); else start('view'); });
  // A new page stops the reading, unless "Next page" asked to carry on.
  lb.addEventListener('octet-page', () => { const go = goNext; goNext = false; stop(); if (go) start(0); });
  lb.addEventListener('octet-leave', () => stop());
  // opening a lab covers the page: stop there too
  new MutationObserver(() => { if (lb.classList.contains('lab-open')) stop(); }).observe(lb, { attributes: true, attributeFilter: ['class'] });
  if (window.speechSynthesis) speechSynthesis.getVoices(); // the list fills in the background
  status();

  window.OCTET_READER = { start, stop, settings: renderSettings, speakable, script, get state() { return S; }, prefs };
})();
