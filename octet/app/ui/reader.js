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

  /* ---------- the Kokoro workers ---------- */
  // Kokoro's own threads stall inside the Windows app, so each worker runs on
  // one thread and several work side by side. Together they make the whole
  // page ahead of you, in reading order, while you listen.
  const POOL = Math.max(1, Math.min(3, Math.floor(((navigator.hardwareConcurrency || 2) - 2) / 2)));
  let wid = 0, restarts = 0;
  const waiting = new Map(), pool = [], busy = [];
  // What the voice has been doing, for the bar and for Settings' "Copy voice details".
  const LOG = [], STAGE = { text: '' };
  const vlog = text => { LOG.push(`${new Date().toISOString().slice(11, 19)} ${text}`); if (LOG.length > 120) LOG.shift(); };
  const spawn = k => {
    const slot = { w: new Worker('voice/worker.js', { type: 'module' }), ready: false };
    slot.w.postMessage({ type: 'config', threads: 1, id: 0 });
    vlog(`[${k + 1}] worker started`);
    slot.w.onmessage = ({ data }) => {
      if (data.type === 'log') {
        vlog(`[${k + 1}] ${data.text}`); STAGE.text = data.text;
        if (data.text.startsWith('model ready')) slot.ready = true;
        if (/^loading/.test(data.text) && S && S.cur && !S.paused) bar(/model/.test(data.text) ? 'Loading the voice model…' : 'Starting the voice…');
        return;
      }
      const x = waiting.get(data.id); if (!x) return;
      if (data.type === 'progress') { if (x.progress) x.progress(data); return; }
      waiting.delete(data.id); data.error ? x.fail(new Error(data.error)) : x.ok(data);
    };
    slot.w.onerror = e => {
      vlog(`[${k + 1}] worker error: ${e.message || 'unknown'}`);
      for (const [id, x] of waiting) if (x.k === k) { waiting.delete(id); x.fail(new Error(e.message || 'The voice stopped.')); }
      if (pool[k] === slot) pool[k] = null;
    };
    return slot;
  };
  const worker = k => (pool[k] || (pool[k] = spawn(k))).w;
  const ask = (msg, progress, k = 0) => new Promise((ok, fail) => { const id = ++wid; waiting.set(id, { ok, fail, progress, k }); worker(k).postMessage({ ...msg, id }); });
  // Start every worker again from nothing; sentences being made go back in the queue.
  const restart = why => {
    vlog('restarting: ' + why); restarts++;
    for (const sl of pool) if (sl) sl.w.terminate();
    pool.length = 0;
    for (const [id, x] of waiting) { waiting.delete(id); x.fail(new Error(why)); }
    busy.forEach(j => { if (j) { j.gen++; j.state = 'queued'; } }); busy.length = 0;
  };

  /* ---------- how fast this computer makes speech ---------- */
  // Seconds of speech one worker makes per second, kept as a running average.
  // Until there's a measurement, assume a modest laptop.
  // Kept for each engine: the app's runs on every core, the window's on one per worker.
  const SPEED = { native: 3, kokoro: 0.4 };
  try { Object.assign(SPEED, JSON.parse(localStorage.getItem('octet-voice-speeds') || '{}')); } catch { /* fine */ }
  const rate = (secs, ms, eng) => { SPEED[eng] = SPEED[eng] * 0.8 + (secs / (ms / 1000)) * 0.2; try { localStorage.setItem('octet-voice-speeds', JSON.stringify(SPEED)); } catch { /* fine */ } };
  const secsOf = it => it.job && it.job.state === 'done' ? it.job.secs : it.say.length * 0.068;

  /* ---------- sentences to make ---------- */
  // A job is one sentence's audio. The next one made is the first not yet
  // made from where you are, then the ones behind you, so jumping back is
  // instant too; a reply to your answer goes first.
  const job = text => { const j = { text, voice: prefs.voice, state: 'queued', gen: 0 }; j.promise = new Promise((ok, fail) => { j.ok = ok; j.fail = fail; }); j.promise.catch(() => {}); return j; };
  const extra = [];
  const nextJob = () => {
    const q = extra.find(j => j.state === 'queued'); if (q) return q;
    if (S) {
      const its = S.items, n = its.length;
      for (let d = 0; d < n; d++) { const it = its[(S.i + d) % n]; if (!it.job || it.job.voice !== prefs.voice) it.job = job(it.say); if (it.job.state === 'queued') return it.job; }
    }
    // this page is made: the pages after it, or a chapter you asked for
    const b = BG.find(j => j.state === 'queued');
    if (b) return b;
    if (S && !S.nextQueued) { S.nextQueued = true; prepare(window.OCTET_APP ? window.OCTET_APP.nextPages(S.page).slice(0, 2) : []); }
    return null;
  };
  // Pages made in the background, so they play at once when you get there.
  const BG = [], prepared = new Set();
  let bgTotal = 0;
  const prepare = async ids => {
    for (const id of ids) {
      const k = prefs.voice + '|' + id; if (prepared.has(k) || !window.OCTET_APP) continue; prepared.add(k);
      try {
        const div = document.createElement('div'); div.innerHTML = await window.OCTET_APP.pageHTML(id);
        for (const it of script(div)) { BG.push(job(it.say)); bgTotal++; }
      } catch (e) { vlog(`couldn't prepare ${id}: ${e.message || e}`); }
      pump();
    }
  };
  const bgLeft = () => BG.filter(j => j.state !== 'done' && j.state !== 'failed').length;
  // the app's voice uses every core for one sentence at a time
  const slots = () => engine() === 'native' ? 1 : POOL;
  const pump = () => {
    const eng = engine(); if (eng === 'system') return;
    for (let k = 0; k < slots(); k++) {
      if (busy[k]) continue;
      const j = nextJob(); if (!j) return;
      busy[k] = j; j.state = 'running'; j.started = performance.now(); j.k = k;
      const gen = j.gen;
      (eng === 'native' ? speakNative(j) : ask({ type: 'speak', text: j.text, voice: j.voice }, null, k))
        .then(r => { if (j.gen !== gen) return; j.state = 'done'; j.secs = r.wav.byteLength / 48000; if (r.ms) rate(j.secs, r.ms, eng); if (BG.includes(j)) { r = null; BG.splice(BG.indexOf(j), 1); } j.ok(r); }, e => { if (j.gen !== gen) return; j.state = 'failed'; j.fail(e); if (BG.includes(j)) BG.splice(BG.indexOf(j), 1); })
        .finally(() => { if (busy[k] === j) busy[k] = null; const x = extra.indexOf(j); if (x >= 0 && j.state !== 'queued') extra.splice(x, 1); pump(); });
    }
  };
  /* ---------- the native voice ---------- */
  // Kokoro run by the app itself on every core (crates/octet-api/src/voice.rs):
  // several times faster than in the window. The worker still turns text into
  // token ids; the app turns those into audio.
  const tauri = window.__TAURI__ && window.__TAURI__.core;
  const native = {
    call: cmd => tauri ? tauri.invoke('voice', { cmd }) : fetch('/voice-api/' + cmd, { method: 'POST' }).then(r => r.ok ? r.json() : null),
    say: (ids, style) => tauri ? tauri.invoke('voice_say', { ids, style, speed: 1 })
      : fetch('/voice-api/say', { method: 'POST', body: JSON.stringify({ ids, style, speed: 1 }) }).then(async r => { if (!r.ok) throw new Error((await r.json()).error); return r.arrayBuffer(); }),
  };
  let nativeBroken = false;
  const speakNative = async j => {
    const t = await ask({ type: 'tokens', text: j.text, voice: j.voice }, null, 0);
    if (t.wav) return t;
    const t0 = performance.now(), wav = await native.say(t.ids, t.style), ms = performance.now() - t0;
    vlog(`[app] said ${j.text.length} characters in ${Math.round(ms)} ms (${(wav.byteLength / 48000).toFixed(1)} s of speech)`);
    caches.open('octet-voice-audio').then(c => c.put(t.key, new Response(wav.slice(0), { headers: { 'content-type': 'audio/wav' } }))).catch(() => {});
    return { wav, ms };
  };

  // STATUS: wasm (the voice in the window), native (the app's), installed (either).
  let STATUS = null;
  const status = async () => {
    if (STATUS) return STATUS;
    const [w, n] = await Promise.all([ask({ type: 'status' }).catch(() => ({ installed: false })), native.call('status').catch(() => null)]);
    return (STATUS = { wasm: !!w.installed, native: n, installed: !!w.installed || !!(n && n.installed) });
  };
  const sleep = ms => new Promise(ok => setTimeout(ok, ms));
  const installNative = async onProgress => {
    await ask({ type: 'install', voices: VOICES.map(v => v[0]), native: true }); // the tokenizer and voices, a few MB
    let st = await native.call('install');
    while (!st.installed) {
      if (st.error) throw new Error(st.error);
      if (onProgress) onProgress({ loaded: st.loaded, total: st.total || st.bytes });
      await sleep(400); st = await native.call('status');
    }
    STATUS.native = st; STATUS.installed = true; nativeBroken = false;
  };
  const installWasm = onProgress => ask({ type: 'install', voices: VOICES.map(v => v[0]) }, onProgress)
    .then(() => { STATUS.wasm = true; STATUS.installed = true; for (let k = 0; k < POOL; k++) ask({ type: 'load' }, null, k).catch(() => {}); });
  let installing = null;
  const install = onProgress => installing = installing || status()
    .then(st => (st.native ? installNative : installWasm)(onProgress))
    .then(() => { prefs.engine = 'kokoro'; save(); })
    .finally(() => { installing = null; });
  const bigMB = () => STATUS && STATUS.native ? 163 : 115;

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

  const clauses = raw => {
    if (raw.length <= 140) return [raw];
    const out = []; let cur = '';
    for (const b of raw.split(/(?<=[;,:])\s+/)) { cur = cur ? cur + ' ' + b : b; if (cur.length >= 60) { out.push(cur); cur = ''; } }
    if (cur) { if (out.length && cur.length < 30) out[out.length - 1] += ' ' + cur; else out.push(cur); }
    return out;
  };
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
      // long sentences are said in parts, at a comma or semicolon: shorter
      // parts are made faster, so the voice starts sooner
      for (const p of clauses(raw)) out.push({ say: speakable(p), text: raw, range: r });
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
    for (const it of out) if (it.text && !it.el.matches(FIG)) it.fig = figFor(it.el, it.text);
    return out;
  };
  // A sentence that talks about a diagram brings the diagram along: one close
  // by that has a device the sentence names, or one in the same section that
  // the sentence points at ("below", "the diagram").
  const FIG = '.fig-d, .fig-f, [data-fig], .tbl, .dcon';
  const reEsc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const names = f => [...f.querySelectorAll('.nd .nm, .dv .nm')].map(x => x.textContent.trim()).filter(Boolean);
  const named = (text, n) => new RegExp(`(^|[^\\w-])${reEsc(n)}(?![\\w-])`).test(text);
  const POINT = /\b(diagram|figure|topology|below|above|shown|pictured|this table|the table|the output)\b/i;
  const figFor = (el, text) => {
    // the nearest diagram within a few blocks, over headings too, that names a device in the sentence
    const near = [];
    for (const dir of ['previousElementSibling', 'nextElementSibling']) {
      let x = el[dir], d = 0, heads = 0;
      for (; x && d < 8; d++, x = x[dir]) { if (x.classList.contains('hd')) heads++; if (x.matches(FIG)) near.push([x, d, heads]); }
    }
    near.sort((a, b) => a[1] - b[1]);
    for (const [f] of near) if (names(f).some(n => named(text, n))) return f;
    // or one in the same section the sentence points at
    const here = near.find(x => x[2] === 0);
    return here && POINT.test(text) ? here[0] : null;
  };
  const rangeOf = el => { const r = document.createRange(); r.selectNodeContents(el); return r; };

  /* ---------- playing ---------- */
  const audio = new Audio(); audio.preservesPitch = true;
  let S = null; // the reading in progress
  const hl = window.CSS && CSS.highlights && window.Highlight ? CSS.highlights : null;

  // 'native' (the app's Kokoro), 'kokoro' (the one in the window) or 'system'
  const engine = () => prefs.engine !== 'kokoro' || !STATUS ? 'system' : STATUS.native && STATUS.native.installed && !nativeBroken ? 'native' : STATUS.wasm ? 'kokoro' : 'system';
  const sysVoice = () => {
    const vs = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
    return vs.find(v => /natural|online/i.test(v.name) && /en-US/i.test(v.lang)) || vs.find(v => /natural|online/i.test(v.name)) || vs.find(v => v.default) || vs[0] || null;
  };

  let slowSaid = false;

  const show = it => {
    if (hl) { if (it && it.range) hl.set('octet-reading', new Highlight(it.range)); else hl.delete('octet-reading'); }
    lb.querySelectorAll('#course > .rd-on').forEach(x => x !== (it && it.el) && x.classList.remove('rd-on'));
    lb.querySelectorAll('#course > .rd-fig').forEach(x => x !== (it && it.fig) && x.classList.remove('rd-fig'));
    lb.querySelectorAll('#course .rd-node').forEach(x => (!it || !it.fig || !it.fig.contains(x)) && x.classList.remove('rd-node'));
    if (!it) return;
    it.el.classList.add('rd-on');
    // the diagram this sentence explains, and the devices it names
    if (it.fig) { it.fig.classList.add('rd-fig'); const names = it.fig.querySelectorAll('.nd'); names.forEach(nd => { const n = nd.querySelector('.nm'); nd.classList.toggle('rd-node', !!n && named(it.text, n.textContent.trim())); }); }
    if (lb.classList.contains('focus')) { lb.querySelectorAll('#course > .cur').forEach(x => x.classList.remove('cur')); it.el.classList.add('cur'); if (it.fig) it.fig.classList.add('cur'); }
    const sc = $('#edScroll'), box = (it.range && it.range.getClientRects().length ? it.range : it.el).getBoundingClientRect(), view = sc.getBoundingClientRect();
    const room = { top: view.top + 60, bottom: view.bottom - 110 };
    if (it.fig) {
      // keep the sentence and its diagram on screen together when they fit
      const f = it.fig.getBoundingClientRect(), top = Math.min(f.top, box.top), bottom = Math.max(f.bottom, box.bottom);
      if (bottom - top <= room.bottom - room.top) { if (top < room.top || bottom > room.bottom) sc.scrollBy({ top: top - room.top - Math.max(0, (room.bottom - room.top - (bottom - top)) / 2), behavior: reduce ? 'auto' : 'smooth' }); return; }
    }
    const tall = it.stop === 'figure' ? it.el.getBoundingClientRect() : box;
    if (tall.top < room.top || tall.bottom > room.bottom) sc.scrollBy({ top: (it.stop === 'figure' ? it.el.getBoundingClientRect().top - view.top - 70 : box.top - view.top - view.height * 0.38), behavior: reduce ? 'auto' : 'smooth' });
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
    if (!it.job || it.job.voice !== prefs.voice) it.job = job(it.say);
    if (S.items[S.i] !== it && it.job.state === 'queued' && !extra.includes(it.job)) extra.push(it.job); // a reply to your answer
    pump();
    let r = null;
    const t = setTimeout(() => S && S.cur === it && bar('Preparing the voice…'), 250), t0 = performance.now();
    // Never wait for ever. Each sentence gets time for its length, and the
    // first one a worker makes also loads the model.
    try {
      for (;;) {
        r = await Promise.race([it.job.promise.catch(e => ({ failed: e })), new Promise(ok => setTimeout(() => ok('tick'), 1500))]);
        if (r !== 'tick') break;
        if (!S || S.cur !== it) return;
        const j = it.job, sl = pool[j.k];
        if (j.state === 'running' && performance.now() - j.started > (sl && sl.ready ? 20000 : 60000) + j.text.length * 400) { r = 'late'; break; }
      }
    } finally { clearTimeout(t); }
    if (r === 'late' || (r && r.failed)) {
      const why = r === 'late' ? `no audio after ${Math.round((performance.now() - it.job.started) / 1000)} s (last: ${STAGE.text || 'nothing'})` : r.failed.message;
      if (!S || S.cur !== it) return;
      if (engine() === 'native') {
        nativeBroken = true; vlog('the app voice failed: ' + why); restart('switching to the voice in the window');
        toast(`The fast voice failed (${why}). ${STATUS.wasm ? 'Using the slower one in the window.' : 'Reading with the system voice.'} Settings can copy the details.`);
        if (it.job && it.job.state === 'failed') it.job = null; return say(it);
      }
      if (restarts < 1) { restart(why); if (it.job.state === 'failed') it.job = null; return say(it); }
      vlog('giving up: ' + why);
      prefs.engine = 'system'; save(); renderBar();
      toast(`The natural voice isn't working on this computer (${why}). Reading with the system voice; Settings can copy the details.`);
      return say(it);
    }
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

  // Read in one sweep: before playing, make enough of the page ahead that the
  // rest is ready before it's needed. Speech made per second (all workers)
  // against speech played per second decides how much head start that takes.
  const headStart = () => {
    const its = S.items; let ready = 0, i = S.i;
    for (; i < its.length && its[i].job && its[i].job.state === 'done'; i++) ready += secsOf(its[i]);
    let left = 0; for (; i < its.length; i++) left += secsOf(its[i]);
    const made = (SPEED[engine()] || 0.4) * slots(), played = prefs.speed;
    const need = made >= played ? (its[S.i].job && its[S.i].job.state === 'done' ? 0 : 1e-6) : left * (played / made - 1) * 1.1;
    return { ready, need };
  };
  const sweep = it => new Promise(ok => {
    if (engine() === 'system' || S.noWait) return ok();
    const check = () => {
      if (!S || S.cur !== it || S.paused || S.jumped) return ok();
      const { ready, need } = headStart();
      if (ready >= need && it.job && it.job.state === 'done') { S.pct = 0; bar(); return ok(); }
      const pct = S.pct = Math.max(S.pct || 0, need > 0 ? Math.min(99, Math.floor(100 * ready / need)) : 0); // only ever counts up
      bar(`Getting the page ready so it reads without stopping… ${pct}%`, 'prep');
      S.timer = setTimeout(check, 400);
    };
    S.startNow = () => { S.noWait = true; clearTimeout(S.timer); bar(); ok(); };
    check();
  });

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
      show(it); pump();
      await sweep(it); if (S !== me) return; if (S.paused) continue; if (S.jumped) { S.jumped = false; continue; }
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
      S.i++;
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
    if (noteKind === 'prep' && S.startNow) { S.startNow(); return; }
    S.paused = false; bar(); renderBar();
    const r = S.resume; S.resume = null; if (r) r();
  };
  const jump = d => {
    if (!S) return;
    const to = Math.max(0, Math.min(S.items.length - 1, S.i + d));
    halt(); if (S.skipWait) { const f = S.skipWait; S.skipWait = null; f(); }
    if (S.release) { S.resume = null; S.release(); }
    S.i = to; S.jumped = !S.paused; S.done = false;
    if (S.paused) { S.cur = S.items[to]; show(S.cur); } else { const r = S.resume; S.resume = null; if (r) r(); }
    renderBar();
  };
  const stop = () => {
    if (!S) return;
    const was = S; S = null; halt(); clearTimeout(was.timer);
    extra.length = 0;
    if (was.resume) was.resume(); if (was.skipWait) was.skipWait(); if (was.release) was.release();
    show(null); lb.querySelectorAll('.rd-on, .rd-fig, .rd-node').forEach(x => x.classList.remove('rd-on', 'rd-fig', 'rd-node'));
    const b = $('#rdBar'); if (b) b.hidden = true;
    $('#listenBtn').setAttribute('aria-pressed', 'false');
  };

  const start = async (from = 0) => {
    const course = $('#course'); if (!course) return;
    if (!prefs.engine) { offer(); return; }
    if (prefs.engine === 'kokoro') {
      await status(); if (!STATUS.installed) { prefs.engine = ''; save(); offer(); return; }
      if (engine() === 'kokoro' && STATUS.native && !offeredFast) { offeredFast = true; offer(true); return; }
    }
    stop();
    // start at the first sentence you can see, unless asked otherwise
    const items = script(course); if (!items.length) { toast('Nothing on this page to read.'); return; }
    if (from === 'view') { const top = $('#edScroll').getBoundingClientRect().top + 40; from = Math.max(0, items.findIndex(it => it.el.getBoundingClientRect().bottom > top)); }
    S = { items, i: from || 0, paused: false, page: (window.OCTET_PAGE_ID || '') };
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
  const voiceName = () => engine() !== 'system' ? (VOICES.find(v => v[0] === prefs.voice) || VOICES[0])[1] : 'System voice';
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
    else if (k === 'notnow') start('view');
  });
  const voiceMenu = a => {
    const old = $('#rdMenu'); if (old) { old.remove(); return; }
    const m = document.createElement('div'); m.id = 'rdMenu'; m.className = 'collect-menu rd-menu';
    const inst = STATUS && STATUS.installed;
    m.innerHTML = (inst ? VOICES.map(([id, name, about]) => `<button type="button" data-v="${id}" aria-pressed="${engine() !== 'system' && prefs.voice === id}">${name}<span>${about}</span></button>`).join('') : `<button type="button" data-v="get">Natural voice<span>Download, about ${bigMB()} MB</span></button>`)
      + `<button type="button" data-v="system" aria-pressed="${engine() === 'system'}">System voice<span>${esc((sysVoice() || {}).name || 'Built in')}</span></button>`
      + (inst && engine() !== 'system' && window.OCTET_APP && window.OCTET_PAGE_ID ? `<hr><button type="button" data-v="chapter">${bgLeft() ? `Preparing: ${bgTotal - bgLeft()} of ${bgTotal} sentences` : 'Prepare this chapter'}<span>${bgLeft() ? 'keeps going while you read' : 'every page, ahead of time'}</span></button>` : '');
    $('.ed').appendChild(m);
    const r = a.getBoundingClientRect(), ed = $('.ed').getBoundingClientRect();
    m.style.left = (r.left - ed.left) + 'px'; m.style.bottom = (ed.bottom - r.top + 6) + 'px';
    m.addEventListener('click', e => {
      const v = e.target.closest('[data-v]'); if (!v) return; m.remove();
      const at = S ? S.i : 0;
      if (v.dataset.v === 'get') { stop(); offer(); return; }
      if (v.dataset.v === 'chapter') { const ch = window.OCTET_APP.chapter(window.OCTET_PAGE_ID); if (ch) { prepare(ch.pages); toast(`Preparing every page of ${ch.title}. It keeps going while you read, and plays instantly once made.`); } return; }
      if (v.dataset.v === 'system') prefs.engine = 'system'; else { prefs.engine = 'kokoro'; prefs.voice = v.dataset.v; }
      save(); if (S) { stop(); start(at); } else renderBar();
    });
    setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', off); } }), 0);
  };

  // The first time: offer the natural voice, or the system voice right away.
  // `faster`: you have the voice in the window; the app's own is many times faster.
  let offeredFast = false;
  const offer = faster => {
    renderBar();
    const b = $('#rdBar'); b.classList.add('offer');
    b.innerHTML = faster
      ? `<div class="rd-offer"><b>Make the voice read without waiting?</b><span>Octet can run the voice itself, on all your processor's cores: several times faster than now. A one-time download of about ${bigMB()} MB.</span></div><button type="button" class="btn pri" data-rd="download">Download it</button><button type="button" class="btn line" data-rd="notnow">Not now</button>`
      : `<div class="rd-offer"><b>Read with a natural voice?</b><span>A one-time download of about ${bigMB()} MB. After that it works offline, on this computer's processor.</span></div><button type="button" class="btn pri" data-rd="download">Download it</button><button type="button" class="btn line" data-rd="system">Use the system voice</button>`;
    b.innerHTML += `<button type="button" class="rd-b" data-rd="close" aria-label="Close">${icon('close')}</button>`;
  };
  const download = async b => {
    b.innerHTML = `<div class="rd-offer"><b>Downloading the voice…</b><span class="rd-prog"><i style="width:0%"></i></span><span class="rd-pct">Starting</span></div><button type="button" class="btn line" data-rd="system">Use the system voice meanwhile</button>`;
    const mb = n => (n / 1048576).toFixed(0);
    await install(p => { const i = b.querySelector('.rd-prog i'), t = b.querySelector('.rd-pct'); if (i) i.style.width = (100 * p.loaded / p.total).toFixed(1) + '%'; if (t) t.textContent = `${mb(p.loaded)} of ${mb(p.total)} MB`; });
    toast('The natural voice is ready. It works offline from now on.');
    { const at = S ? S.i : 'view'; stop(); start(at); }
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
        <span class="pick-l">Voice</span><div class="pats" role="radiogroup" aria-label="Voice">${st.installed ? VOICES.map(([id, name]) => opt('voice', id, name, engine() !== 'system' && prefs.voice === id)).join('') : ''}${opt('voice', 'system', 'System voice', engine() === 'system' || !st.installed)}</div>
        <span class="pick-l">Speed</span><div class="pats" role="radiogroup" aria-label="Speed">${SPEEDS.map(s => opt('speed', s, s + '×', prefs.speed === s)).join('')}</div>
        <span class="pick-l">At a diagram</span><div class="pats" role="radiogroup" aria-label="At a diagram">${HOLDS.map(([s, l]) => opt('hold', s, s ? 'Stop ' + l : l, prefs.hold === s)).join('')}</div>
        <span class="pick-l">At a question</span><div class="pats" role="radiogroup" aria-label="At a question">${opt('ask', 1, 'Wait for my answer', prefs.ask)}${opt('ask', 0, 'Read on', !prefs.ask)}</div>
      </div>
      <div class="row">${st.installed
        ? `<span class="set-p">${engine() === 'native' || (st.native && st.native.installed) ? 'The natural voice (Kokoro) runs in Octet itself, on all your cores, offline.' : 'The natural voice (Kokoro) is downloaded and works offline.'}</span>${st.native && !st.native.installed ? `<button class="btn line" type="button" data-vs="get">Make it faster (${bigMB()} MB)</button>` : ''}<button class="btn ghost" type="button" data-vs="details">Copy voice details</button><button class="btn ghost" type="button" data-vs="remove">Remove it</button>`
        : `<span class="set-p">The natural voice (Kokoro) isn't downloaded. It's about ${bigMB()} MB, once.</span><button class="btn line" type="button" data-vs="get">Download it</button>`}</div>`;
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
    } else if (k === 'details') {
      const text = [`Octet voice details`, `isolated: ${self.crossOriginIsolated}, cores: ${navigator.hardwareConcurrency}, voice: ${engine()}${engine() === 'native' ? ' (in the app, every core)' : `, workers: ${POOL} (one thread each)`}, app voice: ${JSON.stringify(STATUS && STATUS.native)}`, navigator.userAgent, '', ...LOG].join('\n');
      try { await navigator.clipboard.writeText(text); toast('Voice details copied. Paste them to whoever is helping you.'); } catch { toast("Couldn't reach the clipboard."); }
      return;
    } else if (k === 'remove') {
      if (v.dataset.sure !== '1') { v.dataset.sure = '1'; v.textContent = 'Remove for good'; return; }
      stop(); await ask({ type: 'remove' }); await native.call('remove').catch(() => {}); STATUS = null; await status(); if (prefs.engine === 'kokoro') prefs.engine = ''; toast('The natural voice is removed. The system voice still reads.');
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
