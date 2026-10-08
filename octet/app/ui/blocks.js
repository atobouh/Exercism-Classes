// The parts of a page beyond plain paragraphs: device output, callouts,
// the three kinds of thing to answer, network diagrams, header layouts,
// practice drills and the exam map. `render` returns HTML for one block;
// `wire` brings the interactive ones to life once they're on the page.
(() => {
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const NUM = ['', 'one', 'two', 'three', 'four', 'five'];
  const CALL = { key: 'Remember this', exam: 'On the exam', trap: 'Watch out', deeper: 'Going deeper' };

  /* ---------- device output ---------- */
  const PROMPT = /^([A-Za-z][\w.-]*(?:\([\w./-]+\))?[#>]|C:\\>|\$)(\s?)(.*)$/;
  const conLine = l => {
    const m = l.match(PROMPT);
    if (!m) return esc(l) || ' ';
    return `<span class="pr">${esc(m[1])}</span>${m[2]}<b>${esc(m[3])}</b>`;
  };

  /* ---------- diagrams ---------- */
  const GLYPH = {
    router: '<circle cx="8" cy="8" r="6.2"/><path d="M4.6 6.4h5.2M8.4 4.9l1.5 1.5-1.5 1.5M11.4 9.6H6.2M7.6 8.1 6.1 9.6l1.5 1.5"/>',
    switch: '<rect x="1.5" y="4" width="13" height="8" rx="1.6"/><path d="M4.2 6.9h6.6M9.4 5.6l1.4 1.3-1.4 1.3M11.8 9.4H5.2M6.6 8.1 5.2 9.4l1.4 1.3"/>',
    l3switch: '<rect x="1.5" y="4" width="13" height="8" rx="1.6"/><path d="M4.2 6.9h6.6M9.4 5.6l1.4 1.3-1.4 1.3M11.8 9.4H5.2M6.6 8.1 5.2 9.4l1.4 1.3"/><circle cx="8" cy="1.9" r=".9"/>',
    pc: '<rect x="2" y="2.5" width="12" height="8.2" rx="1.2"/><path d="M6 13.6h4M8 10.7v2.9"/>',
    laptop: '<rect x="3" y="3" width="10" height="7" rx="1"/><path d="M1.4 12.6h13.2"/>',
    server: '<rect x="3.2" y="1.5" width="9.6" height="13" rx="1.4"/><path d="M5.6 4.8h4.8M5.6 7.8h4.8M5.6 10.8h1.8"/>',
    printer: '<path d="M4.6 6V2h6.8v4"/><rect x="2" y="6" width="12" height="5.4" rx="1"/><path d="M4.6 9.8v4.2h6.8V9.8"/>',
    phone: '<rect x="5" y="1.5" width="6" height="13" rx="1.4"/><path d="M7.4 12.4h1.2"/>',
    firewall: '<rect x="1.5" y="3" width="13" height="10" rx="1"/><path d="M1.5 6.3h13M1.5 9.7h13M6 3v3.3M10 6.3v3.4M6 9.7V13"/>',
    ap: '<circle cx="8" cy="11.4" r="1.4"/><path d="M5 8.4a4.3 4.3 0 0 1 6 0M2.8 6a7.4 7.4 0 0 1 10.4 0"/>',
    wlc: '<rect x="1.5" y="8" width="13" height="5.5" rx="1.2"/><path d="M5.6 5.4a3.4 3.4 0 0 1 4.8 0M3.8 3.4a6 6 0 0 1 8.4 0M4.4 10.8h1M7 10.8h1"/>',
    cloud: '<path d="M4.6 12.6a3 3 0 0 1-.4-6 4 4 0 0 1 7.7-1.1 2.9 2.9 0 0 1 .6 7.1z"/>',
    internet: '<circle cx="8" cy="8" r="6.2"/><path d="M1.8 8h12.4M8 1.8c-3.2 3.6-3.2 8.8 0 12.4M8 1.8c3.2 3.6 3.2 8.8 0 12.4"/>',
    hub: '<rect x="1.5" y="5" width="13" height="6" rx="1.4"/><path d="M4.5 8h.1M8 8h.1M11.5 8h.1"/>',
  };
  const UX = 200, UY = 104, W = 104, H = 40;
  const diagram = d => {
    const xs = d.nodes.map(n => n.x), ys = d.nodes.map(n => n.y);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const pos = n => ({ x: (n.x - minx) * UX + W / 2 + 14, y: (n.y - miny) * UY + H / 2 + 14 });
    const P = Object.fromEntries(d.nodes.map(n => [n.id, pos(n)]));
    const vw = (maxx - minx) * UX + W + 28, labelled = d.nodes.some(n => n.label), vh = (maxy - miny) * UY + H + 28 + (labelled ? 16 : 0);
    const tag = (x, y, t, cls) => t ? `<text x="${x}" y="${y}" class="${cls}" text-anchor="middle" dominant-baseline="middle">${esc(t)}</text>` : '';
    const links = (d.links || []).map(l => {
      const a = P[l.a], b = P[l.b], at = f => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
      // Interface labels sit just outside each device, along the cable.
      const edge = (from, to) => { const dx = to.x - from.x, dy = to.y - from.y, f = Math.min((W / 2 + 26) / (Math.abs(dx) || 1e-6), (H / 2 + 13) / (Math.abs(dy) || 1e-6), 0.42); return { x: from.x + dx * f, y: from.y + dy * f }; };
      const ea = edge(a, b), eb = edge(b, a), m = at(0.5);
      const zig = l.style === 'serial' ? `<path class="zig" d="M${m.x - nx * 7 - (b.x - a.x) / len * 4} ${m.y - ny * 7 - (b.y - a.y) / len * 4} L${m.x + nx * 5} ${m.y + ny * 5} L${m.x - nx * 5} ${m.y - ny * 5} L${m.x + nx * 7 + (b.x - a.x) / len * 4} ${m.y + ny * 7 + (b.y - a.y) / len * 4}"/>` : '';
      return `<g class="ln ${esc(l.style || '')}"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>${zig}${tag(ea.x, ea.y, l.a_label, 'il')}${tag(eb.x, eb.y, l.b_label, 'il')}${tag(m.x + nx * 13, m.y + ny * 13, l.label, 'ml')}</g>`;
    }).join('');
    const nodes = d.nodes.map(n => {
      const p = P[n.id];
      return `<g class="nd ${esc(n.kind)}" transform="translate(${p.x - W / 2} ${p.y - H / 2})"><rect width="${W}" height="${H}" rx="9"/><svg x="11" y="${H / 2 - 9}" width="18" height="18" viewBox="0 0 16 16" class="gl">${GLYPH[n.kind] || ''}</svg><text x="36" y="${H / 2}" dominant-baseline="middle" class="nm">${esc(n.id)}</text>${n.label ? `<text x="${W / 2}" y="${H + 14}" text-anchor="middle" class="lab">${esc(n.label)}</text>` : ''}</g>`;
    }).join('');
    return `<svg class="dg" viewBox="0 0 ${vw} ${vh}" style="max-width:${vw}px" role="img" aria-label="${esc(d.caption || 'Network diagram')}">${links}${nodes}</svg>`;
  };

  /* ---------- header layouts ---------- */
  const fields = f => {
    const unit = f.unit, row = f.row || f.fields.reduce((s, x) => s + x.span, 0);
    const size = x => x.size || (unit === 'bits' ? `${x.span} bit${x.span > 1 ? 's' : ''}` : unit === 'bytes' ? `${x.span} byte${x.span > 1 ? 's' : ''}` : '');
    const ruler = f.row && unit === 'bits' ? `<div class="fl-rule" style="grid-template-columns:repeat(${row},1fr)">${Array.from({ length: row }, (_, i) => `<span>${i % 8 === 0 || i === row - 1 ? i : ''}</span>`).join('')}</div>` : '';
    const cells = f.fields.map(x => `<div class="fc" style="grid-column:span ${x.span}"><b>${esc(x.name)}</b>${size(x) ? `<span>${esc(size(x))}</span>` : ''}</div>`).join('');
    return `${f.title ? `<p class="fl-t">${esc(f.title)}</p>` : ''}${ruler}<div class="fl-grid" style="grid-template-columns:repeat(${row},minmax(0,1fr))">${cells}</div>`;
  };

  /* ---------- drills ---------- */
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[rnd(0, a.length - 1)];
  const ip2n = s => s.split('.').reduce((n, o) => n * 256 + +o, 0);
  const n2ip = n => [24, 16, 8, 0].map(s => Math.floor(n / 2 ** s) % 256).join('.');
  const maskN = p => p === 0 ? 0 : (2 ** 32 - 2 ** (32 - p));
  const bin8 = n => n.toString(2).padStart(8, '0');
  const norm = s => s.trim().toLowerCase().replace(/\s+/g, '');
  const v6short = groups => {
    // RFC 5952: drop leading zeros, squash the longest run of two or more zero groups.
    const g = groups.map(x => parseInt(x, 16).toString(16));
    let best = [-1, 0], i = 0;
    while (i < 8) { if (g[i] === '0') { let j = i; while (j < 8 && g[j] === '0') j++; if (j - i > best[1] && j - i > 1) best = [i, j - i]; i = j; } else i++; }
    if (best[0] < 0) return g.join(':');
    return g.slice(0, best[0]).join(':') + '::' + g.slice(best[0] + best[1]).join(':');
  };
  const DRILL = {
    binary: { title: 'Binary', make: () => {
      const n = rnd(0, 255);
      return Math.random() < 0.5
        ? { q: `Write ${n} as eight binary digits.`, a: [bin8(n)], show: `${n} = ${[128, 64, 32, 16, 8, 4, 2, 1].filter(v => n & v).join(' + ') || '0'}, so ${bin8(n)}.` }
        : { q: `What is ${bin8(n)} in decimal?`, a: [String(n)], show: `Add the place values that hold a 1: ${[128, 64, 32, 16, 8, 4, 2, 1].filter(v => n & v).join(' + ') || '0'} = ${n}.` };
    } },
    hex: { title: 'Hexadecimal', make: () => {
      const n = rnd(0, 255), h = n.toString(16).toUpperCase().padStart(2, '0');
      const k = rnd(0, 2);
      if (k === 0) return { q: `Write ${n} in hexadecimal.`, a: [h, h.toLowerCase(), '0x' + h.toLowerCase()], show: `${n} ÷ 16 = ${n >> 4} remainder ${n & 15}, so ${h}.` };
      if (k === 1) return { q: `What is 0x${h} in decimal?`, a: [String(n)], show: `${parseInt(h[0], 16)} × 16 + ${parseInt(h[1], 16)} = ${n}.` };
      const d = rnd(0, 15); return { q: `Write the hex digit ${d.toString(16).toUpperCase()} as four binary digits.`, a: [d.toString(2).padStart(4, '0')], show: `${d.toString(16).toUpperCase()} is ${d}: ${[8, 4, 2, 1].filter(v => d & v).join(' + ') || '0'}, so ${d.toString(2).padStart(4, '0')}.` };
    } },
    mask: { title: 'Masks', make: () => {
      const p = rnd(8, 30), m = n2ip(maskN(p));
      return Math.random() < 0.5
        ? { q: `Write /${p} as a dotted subnet mask.`, a: [m], show: `${p} ones, then zeros: ${m}.` }
        : { q: `What prefix length is ${m}?`, a: [String(p), '/' + p], show: `Count the 1 bits: ${m.split('.').map(o => bin8(+o)).join('.')} has ${p}.` };
    } },
    wildcard: { title: 'Wildcard masks', make: () => {
      const p = rnd(8, 30), m = n2ip(maskN(p)), w = n2ip(2 ** 32 - 1 - maskN(p));
      return Math.random() < 0.5
        ? { q: `What wildcard mask matches the same addresses as ${m}?`, a: [w], show: `Take each octet from 255: ${m.split('.').map(o => `255 − ${o} = ${255 - o}`).join(', ')}.` }
        : { q: `What wildcard mask goes with a /${p} network in an ACL or OSPF network statement?`, a: [w], show: `The mask is ${m}; 255.255.255.255 minus the mask is ${w}.` };
    } },
    subnet: { title: 'Subnetting', make: () => {
      const p = pick([16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 27, 28, 28, 29, 29, 30]);
      const first = pick([10, 172, 192]);
      const base = first === 10 ? [10, rnd(0, 255)] : first === 172 ? [172, rnd(16, 31)] : [192, 168];
      const addr = ip2n([...base, rnd(0, 255), rnd(1, 254)].join('.'));
      const size = 2 ** (32 - p), net = Math.floor(addr / size) * size, bc = net + size - 1;
      const ipS = n2ip(addr) + '/' + p;
      const oct = Math.floor((p - 1) / 8), blk = 2 ** ((8 - p % 8) % 8), ob = oct === 3 ? 'fourth' : oct === 2 ? 'third' : 'second';
      const why = `/${p} moves in blocks of ${blk === 1 ? 256 : blk} in the ${ob} octet, so ${n2ip(addr)} sits in ${n2ip(net)} to ${n2ip(bc)}.`;
      const k = rnd(0, 3);
      if (k === 0) return { q: `What is the network address of ${ipS}?`, a: [n2ip(net), n2ip(net) + '/' + p], show: why };
      if (k === 1) return { q: `What is the broadcast address of ${ipS}?`, a: [n2ip(bc)], show: why };
      if (k === 2) return { q: `What is the first usable host in ${ipS}'s subnet?`, a: [n2ip(net + 1)], show: why + ` The first host is one above the network: ${n2ip(net + 1)}.` };
      return { q: `What is the last usable host in ${ipS}'s subnet?`, a: [n2ip(bc - 1)], show: why + ` The last host is one below the broadcast: ${n2ip(bc - 1)}.` };
    } },
    hosts: { title: 'Hosts and prefixes', make: () => {
      if (Math.random() < 0.5) { const p = rnd(16, 30); const h = 2 ** (32 - p) - 2; return { q: `How many usable host addresses does a /${p} have?`, a: [String(h)], show: `${32 - p} host bits: 2^${32 - p} − 2 = ${h}. The two you lose are the network and broadcast addresses.` }; }
      const need = pick([2, 5, 12, 20, 28, 30, 31, 50, 60, 62, 64, 100, 120, 126, 200, 250, 500, 1000]);
      let b = 2; while (2 ** b - 2 < need) b++;
      return { q: `What is the longest prefix (smallest subnet) that holds ${need} hosts?`, a: [String(32 - b), '/' + (32 - b)], show: `${b} host bits give ${2 ** b - 2} hosts${b > 2 ? `, and ${b - 1} would give only ${2 ** (b - 1) - 2}` : ''}. 32 − ${b} = /${32 - b}.` };
    } },
    ipv6: { title: 'IPv6 addresses', make: () => {
      const groups = Array.from({ length: 8 }, () => Math.random() < 0.45 ? '0000' : rnd(0, 0xffff).toString(16).padStart(4, '0').replace(/^[0-9a-f]{1,2}/, m => Math.random() < 0.4 ? '0'.repeat(m.length) : m));
      groups[0] = pick(['2001', 'fe80', '2001', '2600', 'fd00', '2001']);
      if (groups[0] === '2001') groups[1] = '0db8';
      const full = groups.join(':'), short = v6short(groups);
      return Math.random() < 0.6
        ? { q: `Write ${full} in its shortest form.`, a: [short], show: `Drop leading zeros in each group, then replace the longest run of all-zero groups with :: (only once): ${short}.` }
        : { q: `Write ${short} in full, all eight groups of four digits.`, a: [full], show: `:: stands for as many 0000 groups as it takes to make eight: ${full}.` };
    } },
  };

  /* ---------- rendering ---------- */
  const render = (b, i, ctx) => {
    const { inline, answered, marks } = ctx;
    switch (b.type) {
      case 'heading': return `<h${b.level} class="hd" data-b="${i}">${inline(b.text, [])}</h${b.level}>`;
      case 'list': { const t = b.ordered ? 'ol' : 'ul'; return `<${t} data-b="${i}">${b.items.map(x => `<li>${inline(x, [])}</li>`).join('')}</${t}>`; }
      case 'table': return `<div class="tbl" data-b="${i}"><table><thead><tr>${b.head.map(h => `<th>${inline(h, [])}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${inline(c, [])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'console': return `<figure class="dcon" data-b="${i}"><figcaption><span>${esc(b.title || 'Console')}</span><button type="button" class="dcon-keep" data-keep="${i}">Collect</button></figcaption><pre>${b.lines.map(conLine).join('\n')}</pre></figure>`;
      case 'callout': return `<aside class="call k-${esc(b.kind)}" data-b="${i}"><b class="call-h">${CALL[b.kind] || ''}</b>${b.blocks.map(x => x.type === 'list' ? `<ul>${x.items.map(y => `<li>${inline(y, [])}</li>`).join('')}</ul>` : x.type === 'text' ? `<p>${inline(x.text, [])}</p>` : x.type === 'heading' ? `<p><strong>${inline(x.text, [])}</strong></p>` : '').join('')}</aside>`;
      case 'question': {
        const multi = Array.isArray(b.answer), n = multi ? b.answer.length : 1;
        const hint = multi && !/choose/i.test(b.prompt) ? ` <span class="hint">Choose ${NUM[n] || n}.</span>` : '';
        return `<div class="ask" data-b="${i}" data-q="${i}"${multi ? ` data-multi="${n}"` : ''}><p>${inline(b.prompt, [])}${hint}</p><div class="opts">${b.options.map((o, c) => `<button class="opt" type="button" data-c="${c}">${inline(o, [])}</button>`).join('')}</div>${multi ? '<button class="btn line chk" type="button" data-check disabled>Check</button>' : ''}<p class="fb">${answered ? 'You have answered this before. It is in your review.' : ''}</p></div>`;
      }
      case 'command': return `<div class="ask cmdq" data-b="${i}" data-q="${i}" data-kind="command"><p>${inline(b.prompt, [])}</p><label class="cmdline"><span class="pr">${esc(b.mode || '#')}</span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Type the command" placeholder="Type the command, then Enter"></label><p class="fb">${answered ? 'You have answered this before. It is in your review.' : ''}</p></div>`;
      case 'recall': return `<div class="recall" data-b="${i}" data-q="${i}" data-kind="recall"><p class="front">${inline(b.front, [])}</p><button class="btn line" type="button" data-recall>Show the answer</button><div class="back" hidden><p>${inline(b.back, [])}</p><div class="opts"><button class="opt" type="button" data-knew="1">I knew it</button><button class="opt" type="button" data-knew="0">Not yet</button></div></div><p class="fb">${answered ? 'This card is in your review.' : ''}</p></div>`;
      case 'diagram': return `<figure class="fig-d" data-b="${i}">${diagram(b)}${b.caption ? `<figcaption>${inline(b.caption, [])}</figcaption>` : ''}</figure>`;
      case 'fields': return `<figure class="fig-f" data-b="${i}">${fields(b)}${b.caption ? `<figcaption>${inline(b.caption, [])}</figcaption>` : ''}</figure>`;
      case 'drill': { const d = DRILL[b.kind]; return `<div class="drill" data-b="${i}" data-drill="${esc(b.kind)}"><div class="dr-h"><b>Practice: ${esc(d ? d.title : b.kind)}</b><span class="dr-s">As many as you like. Nothing here is graded.</span></div><p class="dr-q"></p><label class="cmdline"><input type="text" spellcheck="false" autocomplete="off" aria-label="Your answer" placeholder="Your answer, then Enter"></label><div class="dr-f"><p class="fb"></p><button type="button" class="btn ghost" data-dr-show>Show me</button><button type="button" class="btn line" data-dr-next>Next</button></div></div>`; }
      case 'exammap': return `<div class="exmap" data-b="${i}" data-exmap><p class="fb">Loading the exam topics…</p></div>`;
      default: return '';
    }
  };

  /* ---------- wiring ---------- */
  const wireDrill = el => {
    const d = DRILL[el.dataset.drill]; if (!d) return;
    const q = el.querySelector('.dr-q'), inp = el.querySelector('input'), fb = el.querySelector('.fb'), st = el.querySelector('.dr-s');
    let cur = null, streak = 0, done = false;
    const next = () => { cur = d.make(); done = false; q.textContent = cur.q; inp.value = ''; inp.disabled = false; fb.textContent = ''; fb.className = 'fb'; };
    const check = () => {
      if (done) return next();
      if (!inp.value.trim()) return;
      const ok = cur.a.some(a => norm(a) === norm(inp.value));
      done = true; streak = ok ? streak + 1 : 0;
      fb.className = 'fb ' + (ok ? 'good' : 'bad');
      fb.textContent = ok ? `Right. ${cur.show}` : `Not quite: it's ${cur.a[0]}. ${cur.show}`;
      st.textContent = streak > 1 ? `${streak} in a row.` : 'As many as you like. Nothing here is graded.';
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    el.querySelector('[data-dr-next]').addEventListener('click', () => { next(); inp.focus(); });
    el.querySelector('[data-dr-show]').addEventListener('click', () => { if (!done) { done = true; streak = 0; fb.className = 'fb'; fb.textContent = `It's ${cur.a[0]}. ${cur.show}`; } });
    next();
  };

  const wireExamMap = async (el, ctx, exam) => {
    try {
      const m = await ctx.api('exam_map', exam ? { exam } : {});
      if (!m.domains.length) { el.innerHTML = '<p class="fb">No exam topic lists are installed.</p>'; return; }
      const all = m.domains.flatMap(d => d.topics), covered = all.filter(t => t.pages.length);
      const pick = m.exams.length > 1 ? `<div class="ex-pick" role="radiogroup" aria-label="Exam">${m.exams.map(x => `<button type="button" role="radio" class="pat" data-exam="${esc(x.id)}" aria-checked="${x.id === m.id}">${esc(x.exam)}</button>`).join('')}</div>` : '';
      el.innerHTML = `${pick}<p class="ex-sum">${esc(m.exam)}${m.valid ? ` (${esc(m.valid)})` : ''}: ${covered.length} of ${all.length} topics are taught somewhere on your shelf. Each one links to its pages.</p>` + m.domains.map(d => {
        const ps = d.topics.flatMap(t => t.pages), rd = ps.filter(p => p.read).length;
        return `<section class="ex-d"><header><b>${esc(d.id)}. ${esc(d.title)}</b><span>${d.weight}% of the exam${ps.length ? `, ${rd} of ${ps.length} pages read` : ''}</span></header>${d.topics.map(t => `<div class="ex-t"><span class="ex-id">${esc(t.id)}</span><div><p>${esc(t.title)}</p>${t.pages.length ? `<div class="chips">${t.pages.map(p => `<button class="chip${p.read ? ' read' : ''}" type="button" data-open="${esc(p.id)}">${esc(p.title)}<i>${esc(p.book)}</i></button>`).join('')}</div>` : '<p class="ex-none">Not taught on your shelf yet.</p>'}</div></div>`).join('')}</section>`;
      }).join('');
      el.querySelectorAll('[data-exam]').forEach(b => b.addEventListener('click', () => wireExamMap(el, ctx, b.dataset.exam)));
    } catch (e) { el.innerHTML = `<p class="fb">The exam map couldn't load: ${esc(e.message || e)}</p>`; }
  };

  const wire = (root, ctx) => {
    root.querySelectorAll('[data-drill]').forEach(wireDrill);
    root.querySelectorAll('[data-exmap]').forEach(el => wireExamMap(el, ctx));
  };

  window.OCTET_BLOCKS = { render, wire, conLine, diagram };
})();
