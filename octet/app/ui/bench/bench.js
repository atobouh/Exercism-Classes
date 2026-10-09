// <octet-bench>: the lab bench as a web component. Drop it on any page.
//
//   <script type="module" src="bench/index.js"></script>
//   <octet-bench></octet-bench>
//   <script type="module">
//     const bench = document.querySelector('octet-bench')
//     bench.load(lab, { state })                  // a lab object, and maybe a saved state
//     bench.addEventListener('bench-passed', e => ...)  // every task done
//     bench.addEventListener('bench-change', e => save(e.detail.state))
//   </script>
//
// Attributes: `back` (a label for a back button, fires bench-back),
// `labels` (show every port name), `fast` (start the clock at ten times),
// `mode="build"` (the lab builder: a device drawer and a task writer).

import { createNetwork, maskLen, short } from './engine.js';
import { CABLES, CATALOG } from './catalog.js';
import { drawDevice, DEFS } from './faceplate.js';

const LIGHT = `--b-bench: oklch(99.1% 0.002 85); --b-pane: oklch(97.9% 0.003 80); --b-pop: oklch(99.4% 0.002 85); --b-dot: oklch(84% 0.006 70);
  --b-line: oklch(90.5% 0.006 70); --b-hover: oklch(93.6% 0.006 78); --b-sel: oklch(91.8% 0.008 78); --b-term: oklch(97.9% 0.003 80);
  --b-ink: oklch(23% 0.01 60); --b-ink2: oklch(43% 0.01 60); --b-ink3: oklch(53% 0.009 60);
  --b-you: oklch(45% 0.09 165); --b-on-you: oklch(98% 0.003 85); --b-broken: oklch(52% 0.16 28); --b-log: oklch(50% 0.1 70); --b-ok: oklch(50% 0.12 155);
  --b-shadow: 0 1px 2px oklch(25% 0.02 60 / 0.06), 0 12px 32px -14px oklch(25% 0.02 60 / 0.25); color-scheme: light;`;

const CSS = `
/* Colours come in two themes, warm neutrals like Octet's own. Set
   theme="light", "dark" or "auto" on the element, or override any --b-*
   variable from the page: custom properties reach inside. The device
   colours (metal, silk, LEDs) are the same in both, like real gear. */
:host { --b-bench: oklch(21% 0.005 70); --b-pane: oklch(19.6% 0.005 70); --b-pop: oklch(23.5% 0.006 70); --b-dot: oklch(31% 0.006 70);
  --b-line: oklch(28.5% 0.006 70); --b-edge: var(--b-line); --b-hover: oklch(26% 0.006 70); --b-sel: oklch(28.5% 0.007 70); --b-term: oklch(19.6% 0.005 70);
  --b-ink: oklch(92% 0.006 80); --b-ink2: oklch(73% 0.008 80); --b-ink3: oklch(63% 0.008 80);
  --b-you: oklch(77% 0.1 165); --b-on-you: oklch(20% 0.005 70); --b-broken: oklch(70% 0.15 28); --b-log: oklch(78% 0.08 75); --b-ok: oklch(73% 0.13 155);
  --b-shadow: 0 1px 2px oklch(5% 0.01 70 / 0.4), 0 14px 34px -14px oklch(5% 0.01 70 / 0.7);
  --b-edge2: oklch(42% 0.008 255); --b-metal-hi: oklch(36% 0.008 255); --b-metal: oklch(29% 0.008 255); --b-metal-lo: oklch(23% 0.008 255); --b-recess: oklch(13% 0.004 255); --b-silk: oklch(76% 0.01 250); --b-silk-hi: oklch(92% 0.006 250); --b-gold: oklch(70% 0.11 85);
  --b-led-off: oklch(26% 0.006 250); --b-led-green: oklch(80% 0.17 150); --b-led-amber: oklch(80% 0.15 70); --b-console: oklch(84% 0.06 215);
  --b-ui: var(--f-ui, "Onest", system-ui, sans-serif); --b-mono: var(--f-ios, "Spline Sans Mono", ui-monospace, Consolas, monospace); --b-book: var(--f-book, "Newsreader", Georgia, serif);
  --b-ease: cubic-bezier(0.23, 1, 0.32, 1); --b-pane-w: 300px; --b-con-w: 440px;
  display: block; position: relative; overflow: hidden; background: var(--b-bench); color: var(--b-ink); font: 400 14px/1.5 var(--b-ui); color-scheme: dark; user-select: none; -webkit-user-select: none; contain: strict; }
:host([theme="light"]) { ${LIGHT} }
@media (prefers-color-scheme: light) { :host([theme="auto"]) { ${LIGHT} } }
* { box-sizing: border-box; }
svg.board { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
svg.board.panning { cursor: grabbing; }
canvas { position: absolute; inset: 0; pointer-events: none; }
:host(.hand) svg.board { cursor: crosshair; }
.dev .body { cursor: grab; }
.dev.dragging .body { cursor: grabbing; }
.silk { font: 500 7.2px var(--b-ui); fill: var(--b-silk); letter-spacing: .04em; }
.silk.big { font: 600 9px var(--b-ui); letter-spacing: .06em; }
.silk.name { font: 600 11px var(--b-ui); fill: var(--b-silk-hi); }
.tagname { font: 600 12.5px var(--b-ui); fill: var(--b-ink2); }
.plab { font: 500 6.4px var(--b-mono); fill: var(--b-ink3); opacity: 0; transition: opacity 160ms ease; }
.labels .plab { opacity: 1; }
.port { cursor: pointer; }
.port.decor { cursor: default; }
.port .hl { fill: none; stroke: var(--b-you); stroke-width: 1.4; opacity: 0; transition: opacity 120ms ease; }
.port:not(.decor):hover .hl { opacity: .9; }
.port.fits .hl { opacity: .75; stroke-dasharray: 2 2; }
.port.fits.hot .hl { opacity: 1; stroke-dasharray: none; stroke-width: 2; }
.dim-other .port:not(.fits) { opacity: .35; }
.btn { cursor: pointer; }
.btn .cap { transition: fill 120ms ease; }
.btn:hover .cap { fill: var(--b-metal-hi); }
.btn:active .cap { fill: var(--b-recess); }
.led { transition: fill 120ms ease; }
.led.green { fill: var(--b-led-green); filter: drop-shadow(0 0 2.5px oklch(80% 0.17 150 / .8)); }
.led.amber { fill: var(--b-led-amber); filter: drop-shadow(0 0 2.5px oklch(80% 0.15 70 / .8)); }
.led.blink { animation: blink 1s steps(2, jump-none) infinite; }
.led.fastblink { animation: blink .35s steps(2, jump-none) infinite; }
.led.act { animation: act 90ms steps(2, jump-none) 6; }
@keyframes blink { 50% { opacity: .25; } }
@keyframes act { 50% { opacity: .2; } }
.token { opacity: 0; pointer-events: none; transition: opacity 180ms ease; }
.face { transition: opacity 180ms ease; }
.far .token { opacity: 1; pointer-events: auto; }
.far .face { opacity: 0; pointer-events: none; }
.token .tk-bg { fill: var(--b-pop); stroke: var(--b-line); }
.token .g * { fill: none; stroke: var(--b-ink); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.token .g circle { fill: var(--b-ink); stroke: none; }
.token text { font: 600 12px var(--b-ui); fill: var(--b-ink); }
.off .face .body, .off .face .port { filter: saturate(.4) brightness(.8); }

.panel { position: absolute; background: var(--b-pop); border: 1px solid var(--b-line); border-radius: 12px; box-shadow: var(--b-shadow); }
.brief { left: 16px; top: 16px; width: 330px; max-width: calc(100% - 32px); padding: 14px 16px 12px; display: grid; gap: 10px; z-index: 5; }
.brief header { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.brief h1 { margin: 0; font: 450 21px/1.15 var(--b-book); letter-spacing: -0.01em; }
.brief .count { font-size: 12px; color: var(--b-ink3); white-space: nowrap; font-variant-numeric: tabular-nums; }
.brief .sum { margin: 0; font-size: 13px; color: var(--b-ink2); }
.brief ol { margin: 0; padding: 0; list-style: none; display: grid; gap: 7px; counter-reset: t; }
.brief li { counter-increment: t; display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 8px; font-size: 13px; color: var(--b-ink2); line-height: 1.45; }
.brief li::before { content: counter(t); width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center; font: 600 10.5px var(--b-ui); box-shadow: inset 0 0 0 1px var(--b-line); color: var(--b-ink3); margin-top: 1px; }
.brief li.done { color: var(--b-ink3); }
.brief li.done::before { content: "✓"; background: var(--b-you); color: var(--b-on-you); box-shadow: none; }
.brief li.next { color: var(--b-ink); }
.brief li .hint { display: block; margin-top: 4px; color: var(--b-ink3); font-size: 12.5px; }
.brief code { font: 400 12px var(--b-mono); color: var(--b-ink); }
.brief .row { display: flex; gap: 14px; }
.brief .more { border: 0; background: none; color: var(--b-ink3); font: inherit; font-size: 12.5px; padding: 0; text-align: left; cursor: pointer; }
.brief .more:hover { color: var(--b-ink); }
.brief.min ol, .brief.min .sum, .brief.min .hintbtn { display: none; }
.tools { right: 16px; top: 16px; display: flex; gap: 2px; padding: 4px; z-index: 5; }
.tb { border: 0; background: transparent; color: var(--b-ink2); font: 500 12.5px var(--b-ui); height: 30px; min-width: 30px; padding: 0 10px; border-radius: 9px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.tb:hover { background: var(--b-hover); color: var(--b-ink); }
.tb[aria-pressed="true"] { background: var(--b-sel); color: var(--b-ink); }
.tb .k { font: 500 10.5px var(--b-ui); color: var(--b-ink3); }
.tb.zoom { font-variant-numeric: tabular-nums; min-width: 54px; justify-content: center; }
.sep { width: 1px; background: var(--b-line); margin: 5px 3px; }
.tray { left: 50%; bottom: 16px; transform: translateX(-50%); display: flex; gap: 4px; padding: 6px; max-width: calc(100% - 32px); overflow-x: auto; z-index: 5; }
.cable { border: 0; background: transparent; color: var(--b-ink2); border-radius: 10px; padding: 6px 12px 7px 8px; display: grid; grid-template-columns: 34px auto; gap: 2px 8px; align-items: center; cursor: pointer; text-align: left; font: inherit; transition: background-color 120ms ease, transform 160ms var(--b-ease); }
.cable:hover { background: var(--b-hover); color: var(--b-ink); }
.cable:active { transform: scale(0.97); }
.cable[aria-pressed="true"] { background: var(--b-sel); color: var(--b-ink); }
.cable svg { grid-row: span 2; width: 34px; height: 28px; }
.cable b { font-weight: 600; font-size: 12.5px; white-space: nowrap; }
.cable span { font-size: 11px; color: var(--b-ink3); white-space: nowrap; }
.card { z-index: 30; pointer-events: none; min-width: 210px; max-width: 290px; padding: 11px 13px; opacity: 0; transform: translateY(4px); transition: opacity 120ms ease, transform 160ms var(--b-ease); }
.card.on { opacity: 1; transform: none; }
.card h3 { margin: 0 0 6px; font: 600 13px var(--b-ui); display: flex; justify-content: space-between; gap: 10px; }
.card h3 i { font: 400 11.5px var(--b-mono); color: var(--b-ink3); font-style: normal; }
.card dl { margin: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 3px 12px; font-size: 12.5px; }
.card dt { color: var(--b-ink3); }
.card dd { margin: 0; color: var(--b-ink); }
.card dd.mono { font: 400 11.5px/1.6 var(--b-mono); }
.card p { margin: 8px 0 0; font-size: 12px; color: var(--b-ink2); line-height: 1.45; }
.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; vertical-align: 1px; background: var(--b-led-off); }
.dot.green { background: var(--b-led-green); } .dot.amber { background: var(--b-led-amber); }
.menu { z-index: 40; min-width: 200px; padding: 5px; display: grid; }
.menu[hidden] { display: none; }
.menu button { border: 0; background: transparent; color: var(--b-ink); font: 450 13px var(--b-ui); text-align: left; padding: 7px 10px; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; gap: 18px; }
.menu button:hover { background: var(--b-hover); }
.menu button[disabled] { color: var(--b-ink3); cursor: default; background: none; }
.menu button span { color: var(--b-ink3); font-size: 11.5px; }
.menu hr { border: 0; border-top: 1px solid var(--b-line); margin: 4px 6px; }
.menu .h { font: 500 11px var(--b-ui); color: var(--b-ink3); padding: 6px 10px 2px; }
.toast { left: 50%; bottom: 92px; transform: translate(-50%, 8px); padding: 10px 14px; max-width: min(520px, calc(100% - 32px)); font-size: 13px; opacity: 0; pointer-events: none; transition: opacity 160ms ease, transform 200ms var(--b-ease); z-index: 35; }
.toast.on { opacity: 1; transform: translate(-50%, 0); }
.con { right: 16px; top: 62px; bottom: 16px; width: 470px; max-width: calc(100% - 32px); display: grid; grid-template-rows: auto auto minmax(0, 1fr); overflow: hidden; transform: translateX(calc(100% + 24px)); transition: transform 260ms var(--b-ease); z-index: 20; }
.con.on { transform: none; }
.tabs { display: flex; gap: 2px; padding: 6px 6px 0; overflow-x: auto; }
.tab { border: 0; background: transparent; color: var(--b-ink3); font: 500 12.5px var(--b-ui); padding: 7px 10px; border-radius: 8px 8px 0 0; cursor: pointer; white-space: nowrap; display: flex; gap: 8px; align-items: center; }
.tab[aria-selected="true"] { background: var(--b-term); color: var(--b-ink); }
.tab .x { opacity: .5; font-size: 14px; line-height: 1; }
.tab .x:hover { opacity: 1; }
.via { padding: 7px 14px; font-size: 11.5px; color: var(--b-ink3); background: var(--b-term); display: flex; justify-content: space-between; gap: 10px; }
.via button { border: 0; background: none; color: var(--b-ink3); font: inherit; cursor: pointer; padding: 0; }
.via button:hover { color: var(--b-ink); }
.cbody { display: grid; grid-template-rows: auto minmax(0, 1fr); min-height: 0; background: var(--b-term); }
.term { overflow: auto; min-height: 0; padding: 8px 14px 14px; cursor: text; user-select: text; -webkit-user-select: text; }
pre.out { margin: 0; font: 400 12.5px/1.6 var(--b-mono); color: var(--b-ink2); white-space: pre; }
.out .cmd { color: var(--b-ink); } .out .log { color: var(--b-log); } .out .err { color: var(--b-broken); } .out .ok { color: var(--b-ok); }
.out .tip { display: block; white-space: normal; margin: 4px 0 2px; padding: 1px 0 1px 10px; border-left: 2px solid var(--b-you); font: 400 12.5px/1.5 var(--b-ui); color: var(--b-ink2); }
.out .tip b { font-weight: 600; color: var(--b-ink); }
.out .tip code { font: 400 12px var(--b-mono); color: var(--b-ink); }
.line { display: flex; font: 400 12.5px/1.6 var(--b-mono); align-items: baseline; }
.prompt { color: var(--b-ink); white-space: pre; }
.line input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: var(--b-ink); font: inherit; caret-color: var(--b-you); padding: 0; }
.line input:focus-visible { outline: none; }
.pcset { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; gap: 8px; padding: 10px 14px; background: var(--b-term); border-bottom: 1px solid var(--b-line); align-items: end; }
.pcset[hidden] { display: none; }
.pcset label { display: grid; gap: 3px; font-size: 11px; color: var(--b-ink3); min-width: 0; }
.pcset input { width: 100%; min-width: 0; border: 0; border-radius: 7px; background: var(--b-bench); color: var(--b-ink); font: 400 12.5px var(--b-mono); padding: 6px 8px; outline: none; box-shadow: inset 0 0 0 1px var(--b-line); }
.pcset input:focus { box-shadow: inset 0 0 0 1.5px var(--b-you); }
.pcset button { border: 0; border-radius: 7px; background: var(--b-ink); color: var(--b-bench); font: 600 12px var(--b-ui); padding: 7px 11px; cursor: pointer; }
/* layout="docked": the brief and the console become panes beside the
   board, the tools a bar along its top. For apps; the default floats. */
.tb.brieftb { display: none; }
:host([layout="docked"]) .tb.brieftb { display: inline-flex; }
:host([layout="docked"]) .tb.brieftb svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; }
:host([layout="docked"]) .brief { left: 0; top: 0; bottom: 0; width: var(--b-pane-w); max-width: none; overflow: hidden; grid-template-columns: minmax(0, 1fr); border: 0; border-right: 1px solid var(--b-line); border-radius: 0; box-shadow: none; background: var(--b-pane); padding: 0; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: 0; align-content: start; }
:host([layout="docked"]) .brief header { display: grid; gap: 2px; padding: 20px 20px 12px; border-bottom: 1px solid var(--b-line); }
:host([layout="docked"]) .brief h1 { font: 500 22px/1.15 var(--b-book); }
:host([layout="docked"]) .brief .count { font-size: 12.5px; white-space: normal; }
:host([layout="docked"]) .brief > .body { overflow-y: auto; padding: 14px 20px; display: grid; gap: 14px; align-content: start; }
:host([layout="docked"]) .brief .sum { font-size: 13.5px; line-height: 1.5; }
:host([layout="docked"]) .brief ol { gap: 2px; margin: 0 -8px; }
:host([layout="docked"]) .brief li { padding: 8px; border-radius: 9px; font-size: 13.5px; }
:host([layout="docked"]) .brief li.next { background: var(--b-sel); }
:host([layout="docked"]) .brief .row { padding: 12px 20px 16px; border-top: 1px solid var(--b-line); }
:host([layout="docked"]) .brief .minbtn { display: none; }
:host([layout="docked"]) .brief.min { display: none; }
:host([layout="docked"]) .tools { top: 0; left: var(--b-pane-w); right: 0; height: 48px; padding: 0 16px 0 12px; border: 0; border-radius: 0; box-shadow: none; background: var(--b-bench); align-items: center; gap: 4px; }
:host([layout="docked"]) .brief.min ~ .tools { left: 0; }
:host([layout="docked"]) .tools .back { margin-right: auto; }
:host([layout="docked"]) .tools .back-sep { display: none; }
:host([layout="docked"]) .tb { font-size: 13px; font-weight: 400; border-radius: 7px; }
:host([layout="docked"]) .tray { left: calc(var(--b-pane-w) + (100% - var(--b-pane-w)) / 2); }
:host([layout="docked"]) .brief.min ~ .tray { left: 50%; }
:host([layout="docked"]) .toast { left: calc(var(--b-pane-w) + (100% - var(--b-pane-w)) / 2); }
:host([layout="docked"]) .con { top: 0; right: 0; bottom: 0; width: var(--b-con-w); border: 0; border-left: 1px solid var(--b-line); border-radius: 0; box-shadow: none; background: var(--b-pane); }
:host([layout="docked"]) .con .tabs { padding: 8px 8px 0; }
:focus-visible { outline: 2px solid var(--b-you); outline-offset: 2px; }
/* mode="build": the brief becomes the builder, with a device drawer and a
   task writer. mode="try" is you playing your own lab. */
.btabs, .drawer, .writer, .tb.edit { display: none; }
:host([mode="build"]) .btabs { display: flex; gap: 2px; padding: 0 0 2px; }
:host([mode="build"]) .brief > .body, :host([mode="build"]) .brief > .row { display: none; }
:host([mode="build"]) .brief[data-tab="devices"] .drawer, :host([mode="build"]) .brief[data-tab="brief"] .writer { display: grid; }
:host([mode="try"]) .tb.edit { display: inline-flex; }
:host([layout="docked"][mode="build"]) .brief { grid-template-rows: auto auto minmax(0, 1fr); }
:host([layout="docked"][mode="build"]) .btabs { padding: 8px 12px; border-bottom: 1px solid var(--b-line); }
:host(:not([layout="docked"])[mode="build"]) .drawer, :host(:not([layout="docked"])[mode="build"]) .writer { max-height: calc(100vh - 200px); }
.btab { border: 0; background: transparent; color: var(--b-ink3); font: 500 12.5px var(--b-ui); padding: 6px 10px; border-radius: 8px; cursor: pointer; }
.btab:hover { color: var(--b-ink); }
.btab[aria-selected="true"] { background: var(--b-sel); color: var(--b-ink); }
.drawer, .writer { overflow-y: auto; align-content: start; gap: 6px; padding: 12px 14px 16px; min-height: 0; }
.drawer h2 { margin: 10px 2px 2px; font: 500 11.5px var(--b-ui); color: var(--b-ink3); }
.drawer h2:first-child { margin-top: 0; }
.dv { border: 0; background: transparent; color: var(--b-ink); font: inherit; text-align: left; border-radius: 10px; padding: 8px; display: grid; gap: 4px; cursor: grab; touch-action: none; transition: background-color 120ms ease; }
.dv:hover { background: var(--b-hover); }
.dv svg { width: 100%; height: 44px; pointer-events: none; }
.dv b { font: 500 12.5px var(--b-ui); }
.dv span { font-size: 11.5px; color: var(--b-ink3); }
.drawer p, .writer p { margin: 0; font-size: 12.5px; color: var(--b-ink3); line-height: 1.45; }
.ghost { position: absolute; z-index: 50; pointer-events: none; padding: 6px 10px; font: 500 12.5px var(--b-ui); transform: translate(-50%, -50%); }
.fld { display: grid; gap: 4px; font-size: 11.5px; color: var(--b-ink3); }
.writer input, .writer textarea, .writer select { width: 100%; min-width: 0; border: 0; border-radius: 7px; background: var(--b-bench); color: var(--b-ink); font: 400 13px var(--b-ui); padding: 6px 8px; outline: none; box-shadow: inset 0 0 0 1px var(--b-line); resize: vertical; }
.writer select { padding: 5px 6px; font-size: 12.5px; }
.writer input:focus, .writer textarea:focus, .writer select:focus { box-shadow: inset 0 0 0 1.5px var(--b-you); }
.writer input.mono { font: 400 12.5px var(--b-mono); }
.writer h2 { margin: 8px 0 0; font: 500 11.5px var(--b-ui); color: var(--b-ink3); }
.task { display: grid; gap: 6px; padding: 10px; border-radius: 10px; box-shadow: inset 0 0 0 1px var(--b-line); }
.trow { display: flex; gap: 6px; align-items: center; }
.trow > * { flex: 1; }
.trow .num { flex: 0 0 18px; font: 600 11px var(--b-ui); color: var(--b-ink3); }
.trow .del { flex: 0 0 auto; border: 0; background: none; color: var(--b-ink3); font-size: 16px; cursor: pointer; padding: 0 4px; }
.trow .del:hover { color: var(--b-broken); }
.trow label { display: flex; gap: 6px; align-items: center; font-size: 12px; color: var(--b-ink2); flex: 0 0 auto; }
.trow label input { width: auto; box-shadow: none; }
.task .st { font-size: 11.5px; color: var(--b-ink3); }
.task .st.ok { color: var(--b-ok); }
.wbtn { border: 0; border-radius: 8px; background: var(--b-sel); color: var(--b-ink); font: 500 12.5px var(--b-ui); padding: 8px 10px; cursor: pointer; text-align: left; }
.wbtn:hover { background: var(--b-hover); }
.wbtn.main { background: var(--b-ink); color: var(--b-bench); }
.menu form { display: flex; gap: 6px; padding: 4px; }
.menu input { width: 140px; border: 0; border-radius: 7px; background: var(--b-bench); color: var(--b-ink); font: 400 13px var(--b-ui); padding: 6px 8px; outline: none; box-shadow: inset 0 0 0 1.5px var(--b-you); }
@media (prefers-reduced-motion: reduce) { * { transition-duration: 1ms !important; animation-duration: 1ms !important; } }
`;

const HTML = `
<svg class="board" aria-label="Lab bench"><defs>${DEFS}</defs>
  <rect class="grid" x="-6000" y="-6000" width="12000" height="12000" fill="url(#b-dots)"/>
  <g class="cam"><g class="devs"></g></g></svg>
<canvas></canvas>
<section class="panel brief" aria-label="The brief" data-tab="devices"><header><h1></h1><span class="count"></span></header><nav class="btabs" role="tablist"><button class="btab" type="button" role="tab" data-btab="devices" aria-selected="true">Devices</button><button class="btab" type="button" role="tab" data-btab="brief" aria-selected="false">Brief</button></nav><div class="drawer"></div><div class="writer"></div><div class="body"><p class="sum"></p><ol></ol></div><div class="row"><button class="more hintbtn" type="button">Show a hint</button><button class="more minbtn" type="button">Hide the brief</button></div></section>
<div class="panel tools" role="toolbar" aria-label="Bench tools">
  <button class="tb brieftb" type="button" data-t="brief" aria-pressed="true" title="Show or hide the brief"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M3 8h10M3 11.5h6"/></svg>Brief</button><button class="tb back" type="button" hidden></button><button class="tb edit" type="button" data-t="edit">← Back to building</button><span class="sep back-sep" hidden></span>
  <button class="tb" type="button" data-t="zout" aria-label="Zoom out">−</button><button class="tb zoom" type="button" data-t="fit" title="Fit everything">100%</button><button class="tb" type="button" data-t="zin" aria-label="Zoom in">+</button>
  <span class="sep"></span>
  <button class="tb" type="button" data-t="labels" aria-pressed="false" title="Show every port name">Labels <span class="k">Alt</span></button>
  <button class="tb" type="button" data-t="fast" aria-pressed="false" title="Run the clock ten times faster, so spanning tree finishes in 3 seconds">Time ×10</button>
  <button class="tb" type="button" data-t="sound" aria-pressed="true">Sound</button>
</div>
<div class="panel tray" role="toolbar" aria-label="Cables"></div>
<aside class="panel con" aria-label="Console"><div class="tabs" role="tablist"></div><div class="via"><span class="vtext"></span><button type="button" class="cclose">Close</button></div>
  <div class="cbody"><form class="pcset" hidden><label>IPv4 address<input name="ip" spellcheck="false" autocomplete="off"></label><label>Subnet mask<input name="mask" spellcheck="false" autocomplete="off"></label><label>Default gateway<input name="gw" spellcheck="false" autocomplete="off"></label><button type="submit">Apply</button></form><div class="term"><pre class="out" aria-live="polite"></pre><label class="line"><span class="prompt"></span><input class="cin" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Command"></label></div></div></aside>
<div class="panel card" role="status"></div>
<div class="panel menu" role="menu" hidden></div>
<div class="panel toast" role="status"></div>`;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const md = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const N = 22;

/* ---------- the task writer ---------- */
// Each check the engine grades, as menus: `f` lists the fields, `dev` which
// kinds of device the first menu offers. `get` and `put` turn a check into
// those fields and back. `say` writes the task for you until you write your own.
const ROUTED = ['router', 'switch'];
const KINDS = {
  console: { name: 'Opens a console', f: ['device'], dev: ROUTED, get: c => ({ device: c }), put: v => v.device, say: v => `Open ${v.device}'s console from a PC.` },
  address: { name: 'Interface has an address', f: ['device', 'iface', 'ip', 'mask', 'up'], dev: ROUTED, get: c => c, put: v => ({ device: v.device, iface: v.iface, ip: v.ip, mask: v.mask, up: !!v.up }), say: v => `Give ${v.device} ${short(v.iface || '')} the address ${v.ip || '…'}${v.mask ? '/' + maskLen(v.mask) : ''}${v.up ? ', and bring it up' : ''}.` },
  pc: { name: 'PC is set up', f: ['device', 'ip', 'mask', 'gateway'], dev: ['pc'], get: c => c, put: v => ({ device: v.device, ip: v.ip, mask: v.mask, ...(v.gateway ? { gateway: v.gateway } : {}) }), say: v => `Set ${v.device} to ${v.ip || '…'}${v.mask ? '/' + maskLen(v.mask) : ''}${v.gateway ? `, gateway ${v.gateway}` : ''}.` },
  cabled: { name: 'Port is cabled to', f: ['device', 'port', 'to'], get: c => { const [e, to] = (c && c[0]) || []; const [device, port] = (e || '').split(/\s+/); return { device, port, to }; }, put: v => [[`${v.device} ${v.port || ''}`.trim(), v.to]], say: v => `Cable ${v.device} ${v.port || ''} to ${v.to || '…'}.` },
  link: { name: 'Link between two ports', f: ['device', 'port', 'to', 'toport'], get: c => { const [device, port] = (c.a || '').split(/\s+/), [to, toport] = (c.b || '').split(/\s+/); return { device, port, to, toport }; }, put: v => ({ a: `${v.device} ${v.port || ''}`.trim(), b: `${v.to || ''} ${v.toport || ''}`.trim() }), say: v => `Link ${v.device} ${v.port || ''} to ${v.to || '…'}${v.toport ? ' ' + v.toport : ''}.` },
  vlan: { name: 'VLANs exist', f: ['device', 'vlans'], dev: ['switch'], get: c => ({ device: c.device, vlans: [].concat(c.vlans || c.id || []).join(', ') }), put: v => ({ device: v.device, vlans: String(v.vlans || '').split(/[\s,]+/).filter(Boolean).map(Number).filter(n => n > 0 && n < 4095) }), say: v => `Create VLAN ${v.vlans || '…'} on ${v.device}.` },
  trunk: { name: 'Trunk is up', f: ['device', 'iface'], dev: ['switch'], get: c => c, put: v => ({ device: v.device, iface: v.iface }), say: v => `Make ${v.device} ${short(v.iface || '')} a working trunk.` },
  pinged: { name: 'Ping succeeds', f: ['device', 'to'], get: c => ({ device: c.from, to: c.to }), put: v => ({ from: v.device, to: v.to }), say: v => `Ping ${v.to || '…'} from ${v.device}.` },
  tried: { name: 'Ping was tried', f: ['device', 'to'], get: c => ({ device: c.from, to: c.to }), put: v => ({ from: v.device, to: v.to }), say: v => `Try a ping to ${v.to || '…'} from ${v.device}.` },
  reach: { name: 'Can reach an address', f: ['device', 'to'], get: c => ({ device: c.from, to: c.to }), put: v => ({ from: v.device, to: v.to }), say: v => `Make ${v.to || '…'} reachable from ${v.device}.` },
};
const FIELD = { device: 'Device', iface: 'Interface', port: 'Port', to: 'To', toport: 'Port (any)', ip: 'Address', mask: 'Mask', gateway: 'Gateway', vlans: 'VLANs', up: 'Up' };
const GROUPS = [['router', 'Routers'], ['switch', 'Switches'], ['pc', 'End devices'], ['wireless', 'Wireless'], ['wan', 'WAN']];
// A task naming `from` now names `to`: device ids, and "DEV PORT" ends.
const renamed = (x, from, to) => typeof x === 'string' ? (x === from ? to : x.startsWith(from + ' ') ? to + x.slice(from.length) : x) : Array.isArray(x) ? x.map(y => renamed(y, from, to)) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, renamed(v, from, to)])) : x;

export class OctetBench extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style>${HTML}`;
    this.$ = s => root.querySelector(s);
    this.$$ = s => [...root.querySelectorAll(s)];
    this.view = { x: 0, y: 0, z: 1 };
    this.ropes = new Map();
    this.hand = null; this.armed = 'straight'; this.speed = 1; this.sound = true; this.labelsOn = false;
    this.tabs = []; this.open = null; this.hover = { dev: null, cable: null };
    this.raf = 0; this.passedOnce = false; this.hints = false; this.said = new WeakMap();
  }
  connectedCallback() {
    this.board = this.$('svg.board'); this.cam = this.$('.cam'); this.devsG = this.$('.devs'); this.canvas = this.$('canvas'); this.ctx = this.canvas.getContext('2d');
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this);
    this.wire(); this.wireBuild();
    if (this.hasAttribute('back')) { const b = this.$('.back'); b.hidden = false; this.$('.back-sep').hidden = false; b.textContent = '← ' + this.getAttribute('back'); }
    if (this.hasAttribute('labels')) this.labelsOn = true;
    if (this.hasAttribute('fast')) this.setSpeed(10);
    this.last = performance.now();
    const frame = t => { this.frame(t); this.raf = requestAnimationFrame(frame); };
    this.raf = requestAnimationFrame(frame);
  }
  disconnectedCallback() { cancelAnimationFrame(this.raf); this.ro && this.ro.disconnect(); }

  get docked() { return this.getAttribute('layout') === 'docked'; }
  get mode() { return this.getAttribute('mode') || 'play'; }
  get building() { return this.mode === 'build'; }
  static get observedAttributes() { return ['context', 'mode', 'back']; }
  attributeChangedCallback(name) {
    if (name === 'back' && this.board) { const b = this.$('.back'), on = this.hasAttribute('back'); b.hidden = !on; this.$('.back-sep').hidden = !on; b.textContent = '← ' + (this.getAttribute('back') || ''); }
    if (!this.net) return; if (name === 'mode') this.renderBuild(); this.renderBrief();
  }

  /* ---------- public API ---------- */
  load(lab, { state } = {}) {
    this.lab = lab;
    this.net = createNetwork(lab);
    if (state) this.net.restore(state);
    this.devsG.innerHTML = ''; this.ropes.clear(); this.tabs = []; this.open = null; this.$('.con').classList.remove('on');
    for (const d of this.net.devices) drawDevice(this.devsG, d);
    this.net.on('say', id => { if (id === this.open) this.renderOut(); });
    this.net.on('change', () => this.changed());
    this.$('.brief h1').textContent = lab.title || 'Lab';
    this.$('.brief .sum').textContent = lab.summary || '';
    this.$('.brief .sum').hidden = !lab.summary;
    this.renderTray();
    if (!lab.tasks && !lab.task) lab.task = [];
    this.renderBuild();
    this.passedOnce = !!(state && state.passed);
    requestAnimationFrame(() => { this.resize(); this.fit(); this.renderBrief(); });
    if (this.building && !this.net.devices.length) setTimeout(() => this.toast('Take a device from the drawer: drag it onto the board, or click it.'), 600);
    else if (!state) setTimeout(() => this.toast('Drag from any port to start a cable. Right-click anything for more. Scroll to zoom.'), 2200);
    return this.net;
  }
  paneW(v) { return parseFloat(getComputedStyle(this).getPropertyValue(v)) || 300; }
  snapshot() { const s = this.net.snapshot(); s.passed = this.passedOnce; return s; }
  fit() {
    const ds = this.net ? this.net.devices : []; if (!ds.length) return;
    const xs = ds.flatMap(d => [d.x - 20, d.x + d.m.w + 20]), ys = ds.flatMap(d => [d.y - 30, d.y + d.m.h + 20]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const W = this.clientWidth, H = this.clientHeight, dock = this.docked, briefOn = !this.$('.brief').classList.contains('min');
    const padT = dock ? 64 : 80, padB = 110, padL = dock ? (briefOn ? this.paneW('--b-pane-w') + 24 : 24) : W > 900 ? 360 : 24, padR = 24;
    const z = Math.max(0.3, Math.min((W - padL - padR) / (maxx - minx), (H - padT - padB) / (maxy - miny), 1.25));
    this.view = { z, x: padL + (W - padL - padR - (maxx - minx) * z) / 2 - minx * z, y: padT + (H - padT - padB - (maxy - miny) * z) / 2 - miny * z };
    this.applyView();
  }

  /* ---------- view ---------- */
  resize() { const dpr = devicePixelRatio || 1; this.canvas.width = this.clientWidth * dpr; this.canvas.height = this.clientHeight * dpr; this.canvas.style.width = this.clientWidth + 'px'; this.canvas.style.height = this.clientHeight + 'px'; }
  applyView() {
    const v = this.view;
    this.cam.setAttribute('transform', `translate(${v.x} ${v.y}) scale(${v.z})`);
    this.$('.grid').setAttribute('transform', `translate(${v.x % (24 * v.z)} ${v.y % (24 * v.z)}) scale(${v.z})`);
    this.board.classList.toggle('far', v.z < 0.55);
    this.board.classList.toggle('labels', this.labelsOn || this.alt || v.z > 1.6);
    if (this.net) this.net.devices.forEach(d => this.place(d));
    this.$('[data-t="fit"]').textContent = Math.round(v.z * 100) + '%';
  }
  place(d) { d.g.setAttribute('transform', `translate(${d.x} ${d.y})`); d.token.setAttribute('transform', `translate(${d.m.w / 2} ${d.m.h / 2}) scale(${Math.min(2.6, 0.85 / this.view.z)})`); }
  toWorld(cx, cy) { const r = this.getBoundingClientRect(); return { x: (cx - r.left - this.view.x) / this.view.z, y: (cy - r.top - this.view.y) / this.view.z }; }
  zoomAt(f, cx, cy) { const r = this.getBoundingClientRect(), sx = cx - r.left, sy = cy - r.top, w = this.toWorld(cx, cy), z = Math.min(3, Math.max(0.25, this.view.z * f)); this.view = { z, x: sx - w.x * z, y: sy - w.y * z }; this.applyView(); }

  /* ---------- cables ---------- */
  anchor(end) { const d = this.net.device(end.dev), p = this.net.portOf(end); return { x: d.x + p.x + p.w / 2, y: d.y + p.y + p.h / 2 }; }
  endPos(c, e) { return c[e] ? this.anchor(c[e]) : (this.hand && this.hand.cable === c ? this.hand.free : this.anchor(c[e === 'a' ? 'b' : 'a'])); }
  rope(c) {
    let r = this.ropes.get(c.id);
    if (!r) { const A = c.a ? this.anchor(c.a) : this.endPos(c, 'a'); r = { pts: Array.from({ length: N }, (_, i) => ({ x: A.x, y: A.y + i * 2, px: A.x, py: A.y + i * 2 })), seat: {} }; this.ropes.set(c.id, r); }
    return r;
  }
  stepRopes() {
    for (const c of this.net.cables) {
      const r = this.rope(c), p = r.pts, A = this.endPos(c, 'a'), B = this.endPos(c, 'b');
      const dist = Math.hypot(B.x - A.x, B.y - A.y), total = Math.max(dist * 1.04, dist + 70 + Math.min(dist * 0.08, 60)), seg = total / (N - 1);
      for (let i = 1; i < N - 1; i++) { const q = p[i], vx = (q.x - q.px) * 0.97, vy = (q.y - q.py) * 0.97; q.px = q.x; q.py = q.y; q.x += vx; q.y += vy + 0.55; }
      p[0].x = A.x; p[0].y = A.y; p[N - 1].x = B.x; p[N - 1].y = B.y;
      p[1].x = A.x; p[1].y = A.y + 7; p[N - 2].x = B.x; p[N - 2].y = B.y + 7;
      for (let k = 0; k < 18; k++) for (let i = 0; i < N - 1; i++) {
        const a = p[i], b = p[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, diff = (d - seg) / d / 2;
        const fa = i <= 1 ? 0 : 1, fb = i + 1 >= N - 2 ? 0 : 1, s = fa + fb || 1;
        a.x += dx * diff * fa * 2 / s; a.y += dy * diff * fa * 2 / s; b.x -= dx * diff * fb * 2 / s; b.y -= dy * diff * fb * 2 / s;
      }
    }
    for (const id of [...this.ropes.keys()]) if (!this.net.cables.some(c => c.id === id)) this.ropes.delete(id);
  }
  drawWires() {
    const ctx = this.ctx, dpr = devicePixelRatio || 1, v = this.view;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(dpr * v.z, 0, 0, dpr * v.z, dpr * v.x, dpr * v.y);
    const far = v.z < 0.55, { dev: hd, cable: hc } = this.hover;
    for (const c of this.net.cables) {
      const k = CABLES[c.type], col = k.color, p = this.rope(c).pts;
      ctx.globalAlpha = !hd && !hc ? 1 : (c === hc || (hd && [c.a, c.b].some(x => x && x.dev === hd))) ? 1 : 0.32;
      if (far) {
        if (!c.a || !c.b) continue;
        const da = this.net.device(c.a.dev), db = this.net.device(c.b.dev);
        ctx.beginPath(); ctx.moveTo(da.x + da.m.w / 2, da.y + da.m.h / 2); ctx.lineTo(db.x + db.m.w / 2, db.y + db.m.h / 2);
        ctx.lineWidth = 2.4 / v.z; ctx.strokeStyle = col; ctx.setLineDash(c.type === 'console' ? [4 / v.z, 5 / v.z] : []); ctx.stroke(); ctx.setLineDash([]);
        continue;
      }
      const path = () => { ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); for (let i = 1; i < N - 1; i++) ctx.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2); ctx.lineTo(p[N - 1].x, p[N - 1].y); };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.save(); ctx.translate(0, 3.5); path(); ctx.strokeStyle = 'rgba(0,0,0,.38)'; ctx.lineWidth = k.w + 2.4; ctx.stroke(); ctx.restore();
      path(); ctx.strokeStyle = col; ctx.lineWidth = k.w; ctx.stroke();
      ctx.save(); ctx.translate(-0.5, -0.9); path(); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = Math.max(0.9, k.w * 0.26); ctx.stroke(); ctx.restore();
      for (const e of ['a', 'b']) this.plug(c, e, col);
    }
    ctx.globalAlpha = 1;
  }
  plug(c, e, col) {
    const ctx = this.ctx, pos = this.endPos(c, e), port = c[e] ? this.net.portOf(c[e]) : null, r = this.rope(c);
    let { x, y } = pos;
    if (r.seat[e]) { const t = Math.min(1, (performance.now() - r.seat[e]) / 260); y += (1 - t) * Math.sin(t * 9) * 5; }
    const w = port ? port.w - 2 : (c.type === 'serial' ? 24 : c.type === 'fiber' ? 20 : 18), h = port ? port.h - 2 : 13;
    const rr = (x0, y0, w0, h0, rad) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x0, y0, w0, h0, rad); else ctx.rect(x0, y0, w0, h0); };
    ctx.save();
    if (c.type === 'serial') {
      ctx.fillStyle = 'oklch(30% 0.01 260)'; ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = .6;
      rr(x - w / 2 - 3, y - h / 2 - 1, w + 6, h + 4, 2); ctx.fill(); ctx.stroke();
      const isDce = c.dce ? (c[e] && c.dce.dev === c[e].dev && c.dce.port === c[e].port) : e === 'a';
      if (isDce) { ctx.fillStyle = 'oklch(85% 0.01 250)'; ctx.font = '600 5.2px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DCE', x, y + 2); }
    } else if (c.type === 'fiber') {
      ctx.fillStyle = 'oklch(70% 0.03 220 / .9)'; rr(x - w / 2, y - h / 2, w, h, 1.5); ctx.fill();
      ctx.fillStyle = col; rr(x - w / 2 + 2, y - 2, w / 2 - 3, h / 2 + 4, 1); ctx.fill(); rr(x + 1, y - 2, w / 2 - 3, h / 2 + 4, 1); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(214,226,240,.34)'; ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = .5;
      rr(x - w / 2, y - h / 2, w, h, 1.4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'oklch(72% 0.11 85 / .8)'; for (let i = 0; i < 8; i++) ctx.fillRect(x - w / 2 + 2.5 + i * ((w - 5) / 8), y - h / 2 + 1.5, 0.9, 3);
      ctx.fillStyle = col; rr(x - w / 2 + 2, y + h / 2 - 1, w - 4, 7, 2); ctx.fill();
    }
    ctx.restore();
  }
  distToCable(c, w) { let best = 1e9; const p = this.rope(c).pts; for (let i = 0; i < N - 1; i++) { const a = p[i], b = p[i + 1], dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1; let t = ((w.x - a.x) * dx + (w.y - a.y) * dy) / l2; t = Math.max(0, Math.min(1, t)); best = Math.min(best, Math.hypot(a.x + t * dx - w.x, a.y + t * dy - w.y)); } return best; }

  /* ---------- lights ---------- */
  paint() {
    const net = this.net, t = net.clock;
    // devices added or removed through bench.net directly
    for (const d of net.devices) if (!d.g || !d.g.isConnected) { drawDevice(this.devsG, d); this.place(d); }
    for (const g of [...this.devsG.children]) if (!net.device(g.dataset.dev) || net.device(g.dataset.dev).g !== g) g.remove();
    for (const d of net.devices) {
      const on = net.isOn(d.id), booting = d.power && !on;
      d.g.classList.toggle('off', !d.power);
      d.g.querySelectorAll('[data-light]').forEach(l => {
        const k = l.dataset.light; let c = 'off', bl = '';
        if (!d.power) c = 'off';
        else if (k === 'PWR') c = 'green';
        else if (k === 'SYS' || k === 'SYST') { c = booting ? 'amber' : 'green'; bl = booting ? 'blink' : ''; }
        else if (k === 'ACT') c = Object.values(d.ifs).some(f => f.act > t) ? 'green' : 'off';
        else if (['STAT', 'DUPLX', 'SPEED'].includes(k)) c = on && d.ledMode === k.toLowerCase() ? 'green' : 'off';
        l.classList.toggle('green', c === 'green'); l.classList.toggle('amber', c === 'amber'); l.classList.toggle('blink', bl === 'blink');
      });
      for (const p of d.m.ports) {
        const le = d.portEls[p.key]; if (!le) continue;
        const f = d.ifs[p.iface]; let c = 'off', fast = false;
        if (f && f.phys && f.medium === p.type && d.power) {
          if (d.kind === 'switch' && d.ledMode === 'duplx') c = 'green';
          else if (d.kind === 'switch' && d.ledMode === 'speed') { c = 'green'; fast = p.iface.startsWith('Gig'); }
          else c = d.kind === 'switch' && !net.forwarding(d.id, p.iface) ? 'amber' : 'green';
        }
        le.classList.toggle('green', c === 'green'); le.classList.toggle('amber', c === 'amber'); le.classList.toggle('fastblink', fast);
        if (f && f.act > t && c === 'green' && !le.classList.contains('act')) { le.classList.add('act'); setTimeout(() => le.classList.remove('act'), 560); }
      }
      if (d.kind === 'pc' && d.screenIp) d.screenIp.textContent = d.ip ? `${d.ip}/${maskLen(d.mask || '0.0.0.0')}` : 'no address';
      if (d.tag.textContent !== d.hostname) { d.tag.textContent = d.hostname; d.tokenText.textContent = d.hostname; }
    }
  }
  frame(t) {
    if (!this.net) return;
    const dt = Math.min(100, t - this.last); this.last = t;
    this.net.tick(dt * this.speed);
    if (!this.lastPaint || t - this.lastPaint > 120) { this.paint(); this.lastPaint = t; }
    this.stepRopes(); this.drawWires();
  }

  /* ---------- brief and events ---------- */
  renderBrief() {
    if (!this.net) return;
    const ts = this.net.tasks(); let next = -1;
    this.$('.brief ol').innerHTML = ts.map((t, i) => { if (!t.done && next < 0) next = i; return `<li class="${t.done ? 'done' : ''}${i === next ? ' next' : ''}"><span>${md(t.text)}${this.hints && i === next && t.hint ? `<span class="hint">${md(t.hint)}</span>` : ''}</span></li>`; }).join('');
    const n = ts.filter(t => t.done).length;
    const ctx = this.getAttribute('context');
    this.$('.brief .count').textContent = (ctx && this.docked ? ctx + '. ' : '') + (ts.length && n === ts.length ? 'All done' : this.docked ? `${n} of ${ts.length} done` : `${n} of ${ts.length}`);
    this.$('.hintbtn').hidden = next < 0 || !ts[next].hint;
    this.$('.hintbtn').textContent = this.hints ? 'Hide the hint' : 'Show a hint';
    this.$$('.task').forEach((el, i) => { const st = el.querySelector('.st'); if (st && ts[i]) { st.textContent = ts[i].done ? 'Done on the board now' : 'Not done on the board yet'; st.classList.toggle('ok', ts[i].done); } });
    if (this.building) return ts;
    if (ts.length && n === ts.length && !this.passedOnce) { this.passedOnce = true; this.toast('Every task is done. The lab is passed.'); this.dispatchEvent(new CustomEvent('bench-passed', { bubbles: true, composed: true, detail: { lab: this.lab.id, tasks: ts, mode: this.mode } })); }
    return ts;
  }
  changed() {
    this.renderBrief();
    clearTimeout(this.saveT);
    this.saveT = setTimeout(() => this.dispatchEvent(new CustomEvent('bench-change', { bubbles: true, composed: true, detail: { lab: this.lab && this.lab.id, state: this.snapshot(), mode: this.mode } })), 400);
  }

  /* ---------- build mode ---------- */
  renderBuild() {
    const br = this.$('.brief');
    if (!this.building) return;
    br.classList.remove('min');
    // the drawer: every model, drawn by the same renderer as the board
    const groups = GROUPS.map(([k, name]) => [name, Object.entries(CATALOG).filter(([, m]) => (m.group || m.kind) === k)]).filter(([, ms]) => ms.length);
    this.$('.drawer').innerHTML = groups.map(([name, ms]) => `<h2>${name}</h2>` + ms.map(([id, m]) => `<button class="dv" type="button" data-model="${esc(id)}" title="Drag onto the board, or click"><svg viewBox="-4 -4 ${m.w + 8} ${m.h + 8}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg><b>${esc(m.name)}</b><span>${esc(m.platform || m.kind)}</span></button>`).join('')).join('') + '<p>Right-click a device on the board to rename, copy or delete it.</p>';
    this.$$('.dv').forEach(b => { const m = CATALOG[b.dataset.model]; drawDevice(b.querySelector('svg'), { id: '', hostname: '', m, kind: m.kind }); });
    this.renderWriter();
  }
  addFromDrawer(model, cx, cy) {
    const m = CATALOG[model], r = this.getBoundingClientRect(), left = this.docked ? this.paneW('--b-pane-w') : 0;
    let w;
    // A click stacks it under what's there, like a rack, with PCs side by
    // side. On an empty board it goes in the middle.
    const ds = this.net.devices, last = cx === undefined && ds[ds.length - 1];
    if (last && last.kind === 'pc' && m.kind === 'pc') w = { x: last.x + last.m.w + 50 + m.w / 2, y: last.y + m.h / 2 };
    else if (last) { const minx = Math.min(...ds.map(d => d.x)), maxx = Math.max(...ds.map(d => d.x + d.m.w)); w = { x: (minx + maxx) / 2, y: Math.max(...ds.map(d => d.y + d.m.h)) + 80 + m.h / 2 }; }
    else if (cx === undefined) w = this.toWorld(r.left + left + (r.width - left) / 2, r.top + r.height / 2);
    else w = this.toWorld(cx, cy);
    let d; try { d = this.net.addDevice({ model, x: Math.round(w.x - m.w / 2), y: Math.round(w.y - m.h / 2) }); } catch (err) { return this.toast(err.message); }
    this.drawNew(d);
    const sx = (d.x + m.w) * this.view.z + this.view.x;
    const sy = (d.y + m.h) * this.view.z + this.view.y;
    if (sx > this.clientWidth - 24 || sy > this.clientHeight - 100 || d.x * this.view.z + this.view.x < left) this.fit();
    this.toast(`${d.id} is on the bench. It boots, then its lights come on. Right-click it to rename it.`);
  }
  drawNew(d) { drawDevice(this.devsG, d); this.place(d); this.paint(); this.renderWriter(); }
  redraw(d) { d.g.remove(); this.drawNew(d); }
  renameDev(d, to) {
    const from = d.id; to = to.trim();
    if (!to || to === from) return;
    try { this.net.renameDevice(from, to); } catch (err) { return this.toast(err.message); }
    const list = this.taskList(); list.forEach((t, i) => { list[i] = { ...t, check: renamed(t.check, from, to) }; });
    this.tabs = this.tabs.map(x => x === from ? to : x); if (this.open === from) this.open = to;
    this.redraw(d); this.renderTabs(); this.edited();
  }
  deleteDev(d) {
    this.net.removeDevice(d.id); d.g.remove();
    this.tabs = this.tabs.filter(x => x !== d.id); if (this.open === d.id) { this.open = this.tabs[this.tabs.length - 1] || null; if (!this.open) this.$('.con').classList.remove('on'); }
    this.renderTabs(); this.renderOut(); this.renderWriter();
    this.toast(`${d.id} is off the bench, with its cables.`);
  }
  taskList() { const l = this.lab; return l.tasks || (l.task = l.task || []); }
  edited() {
    this.renderBrief();
    clearTimeout(this.editT);
    this.editT = setTimeout(() => this.dispatchEvent(new CustomEvent('bench-edit', { bubbles: true, composed: true, detail: { lab: this.lab.id, title: this.lab.title || '', summary: this.lab.summary || '', task: this.taskList() } })), 400);
  }
  renderWriter() {
    if (!this.building || !this.net) return;
    const w = this.$('.writer'), devs = this.net.devices, lab = this.lab;
    const opt = (v, label, sel) => `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(label)}</option>`;
    const field = (k, v, kind) => {
      const val = v[k] || '';
      if (k === 'device' || k === 'to' && kind !== 'pinged' && kind !== 'tried' && kind !== 'reach') {
        const kinds = k === 'device' && KINDS[kind].dev, ds = devs.filter(d => !kinds || kinds.includes(d.kind));
        const ids = ds.map(d => d.id); if (val && !ids.includes(val)) ids.unshift(val);
        return `<select data-v="${k}" aria-label="${FIELD[k]}">${opt('', FIELD[k] + '…', val)}${ids.map(id => opt(id, id, val)).join('')}</select>`;
      }
      if (k === 'iface' || k === 'port' || k === 'toport') {
        const d = this.net.device(k === 'toport' ? v.to : v.device);
        const names = !d ? [] : k === 'iface' ? Object.keys(d.ifs) : d.m.ports.filter(p => !['decor', 'con', 'com'].includes(p.type)).map(p => p.key);
        if (val && !names.includes(val)) names.unshift(val);
        return `<select data-v="${k}" aria-label="${FIELD[k]}">${opt('', FIELD[k] + '…', val)}${names.map(n => opt(n, k === 'iface' ? short(n) : n, val)).join('')}</select>`;
      }
      if (k === 'up') return `<label><input type="checkbox" data-v="up"${v.up ? ' checked' : ''}> up</label>`;
      return `<input class="mono" data-v="${k}" value="${esc(val)}" placeholder="${FIELD[k]}" spellcheck="false" autocomplete="off" aria-label="${FIELD[k]}">`;
    };
    const tasks = this.taskList().map((t, i) => {
      const kind = Object.keys(t.check || {})[0] || 'pinged', K = KINDS[kind] || KINDS.pinged, v = K.get((t.check || {})[kind] || {}) || {};
      const rows = []; for (let j = 0; j < K.f.length; j += 2) rows.push(`<div class="trow">${K.f.slice(j, j + 2).map(k => field(k, v, kind)).join('')}</div>`);
      return `<div class="task" data-i="${i}"><div class="trow"><span class="num">${i + 1}</span><select data-k="kind" aria-label="Check">${Object.entries(KINDS).map(([k, x]) => opt(k, x.name, kind)).join('')}</select><button class="del" type="button" data-del aria-label="Delete task">×</button></div>${rows.join('')}<input data-k="text" value="${esc(t.text || '')}" placeholder="What the student does" aria-label="Task"><input data-k="hint" value="${esc(t.hint || '')}" placeholder="A hint, if they ask (optional)" aria-label="Hint"><span class="st"></span></div>`;
    }).join('');
    w.innerHTML = `<label class="fld">Title<input data-f="title" value="${esc(lab.title || '')}"></label><label class="fld">Summary<textarea data-f="summary" rows="3" placeholder="What the student starts with, and what they're after">${esc(lab.summary || '')}</textarea></label>
      <h2>Tasks</h2>${tasks || '<p>No tasks yet. A lab with no tasks is a sandbox.</p>'}<button class="wbtn" type="button" data-act="add">Add a task</button>
      <h2>Starting point</h2><p>Build the network a student starts with, broken if you like, then mark it.</p><button class="wbtn" type="button" data-act="start">Use this as the starting point</button><button class="wbtn main" type="button" data-act="try">Try it as a student</button>`;
    this.renderBrief();
  }
  wireBuild() {
    this.$('.btabs').addEventListener('click', e => { const b = e.target.closest('[data-btab]'); if (!b) return; this.$('.brief').dataset.tab = b.dataset.btab; this.$$('.btab').forEach(x => x.setAttribute('aria-selected', x === b)); });
    // the drawer: click to add, or drag onto the board
    this.$('.drawer').addEventListener('pointerdown', e => {
      const b = e.target.closest('.dv'); if (!b || e.button !== 0) return;
      e.preventDefault();
      const model = b.dataset.model, sx = e.clientX, sy = e.clientY, host = this.getBoundingClientRect();
      let ghost = null;
      const move = ev => {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        if (!ghost) { ghost = document.createElement('div'); ghost.className = 'panel ghost'; ghost.textContent = CATALOG[model].name; this.shadowRoot.appendChild(ghost); }
        ghost.style.left = ev.clientX - host.left + 'px'; ghost.style.top = ev.clientY - host.top + 'px';
      };
      const up = ev => {
        removeEventListener('pointermove', move); removeEventListener('pointerup', up);
        if (!ghost) return this.addFromDrawer(model);
        ghost.remove();
        const over = this.shadowRoot.elementFromPoint ? this.shadowRoot.elementFromPoint(ev.clientX, ev.clientY) : null;
        if (over && (over === this.board || this.board.contains(over))) this.addFromDrawer(model, ev.clientX, ev.clientY);
      };
      addEventListener('pointermove', move); addEventListener('pointerup', up);
    });
    // the writer
    const w = this.$('.writer');
    const at = e => { const el = e.target.closest('.task'); return el ? [+el.dataset.i, el] : [-1, null]; };
    const valuesOf = el => { const v = {}; el.querySelectorAll('[data-v]').forEach(x => { v[x.dataset.v] = x.type === 'checkbox' ? x.checked : x.value.trim(); }); return v; };
    const update = (e, rerender) => {
      const f = e.target.dataset.f;
      if (f) { this.lab[f] = e.target.value; if (f === 'title') this.$('.brief h1').textContent = e.target.value || 'Lab'; return this.edited(); }
      const [i, el] = at(e); if (i < 0) return;
      const list = this.taskList(), t = list[i], k = e.target.dataset.k;
      if (k === 'text') { t.text = e.target.value; this.said.delete(t); return this.edited(); }
      if (k === 'hint') { t.hint = e.target.value; if (!t.hint) delete t.hint; return this.edited(); }
      const kind = k === 'kind' ? e.target.value : Object.keys(t.check || {})[0];
      const v = k === 'kind' ? { device: valuesOf(el).device } : valuesOf(el);
      const next = { ...t, check: { [kind]: KINDS[kind].put(v) } };
      const auto = !t.text || this.said.get(t) === t.text;
      if (auto) { next.text = KINDS[kind].say(v); this.said.set(next, next.text); el.querySelector('[data-k="text"]').value = next.text; }
      list[i] = next;
      if (rerender) this.renderWriter();
      this.edited();
    };
    w.addEventListener('input', e => { if (e.target.tagName !== 'SELECT' && e.target.type !== 'checkbox') update(e, false); });
    w.addEventListener('change', e => { if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox') update(e, true); });
    w.addEventListener('click', e => {
      if (e.target.closest('[data-del]')) { const [i] = at(e); this.taskList().splice(i, 1); this.renderWriter(); return this.edited(); }
      const act = e.target.closest('[data-act]'); if (!act) return;
      if (act.dataset.act === 'add') {
        const first = this.net.devices.find(d => d.kind === 'pc'), t = { text: '', check: { pinged: { from: first ? first.id : '', to: '' } } };
        t.text = KINDS.pinged.say({ device: t.check.pinged.from || '…' }); this.said.set(t, t.text);
        this.taskList().push(t); this.renderWriter(); this.edited();
        const last = this.$$('.task').pop(); if (last) { last.scrollIntoView({ block: 'nearest' }); last.querySelector('select').focus(); }
      }
      if (act.dataset.act === 'start') this.markStart();
      if (act.dataset.act === 'try') this.tryIt();
    });
  }
  // The board as a student first sees it: no consoles opened, no pings yet.
  startState() { const s = this.snapshot(); return { ...s, opened: [], pinged: [], tried: [], passed: false }; }
  markStart() {
    this.lab.start = this.startState();
    this.dispatchEvent(new CustomEvent('bench-start', { bubbles: true, composed: true, detail: { lab: this.lab.id, state: this.lab.start } }));
    this.toast('Marked. A student starts from the board exactly as it is now.');
  }
  tryIt() {
    clearTimeout(this.saveT);
    this.dispatchEvent(new CustomEvent('bench-change', { bubbles: true, composed: true, detail: { lab: this.lab.id, state: this.snapshot(), mode: 'build' } }));
    this.built = this.snapshot();
    this.setAttribute('mode', 'try');
    this.load(this.lab, { state: this.lab.start || { ...this.built, opened: [], pinged: [], tried: [], passed: false } });
    this.toast('This is your lab as a student sees it. Nothing you do here changes it.');
  }
  backToBuilding() {
    this.setAttribute('mode', 'build');
    this.load(this.lab, { state: this.built });
  }

  /* ---------- tray ---------- */
  renderTray() {
    this.$('.tray').innerHTML = Object.entries(CABLES).map(([k, c]) => `<button class="cable" type="button" data-cable="${k}" aria-pressed="${k === this.armed}"><svg viewBox="0 0 34 28" aria-hidden="true"><path d="M3 22c6-16 18 6 22-10" fill="none" stroke="${c.color}" stroke-width="${Math.min(4, c.w)}" stroke-linecap="round"/><rect x="${k === 'serial' ? 22 : 23}" y="3" width="${k === 'serial' ? 11 : 8}" height="${k === 'fiber' ? 7 : 9}" rx="1.4" fill="${['straight', 'cross', 'console'].includes(k) ? 'rgba(214,226,240,.55)' : k === 'fiber' ? c.color : 'oklch(35% 0.01 260)'}"/></svg><b>${c.name}</b><span>${c.hint}</span></button>`).join('');
  }
  arm(k) { this.armed = k; this.$$('.cable').forEach(x => x.setAttribute('aria-pressed', x.dataset.cable === k)); }

  /* ---------- interaction ---------- */
  portFromEvent(e) { const t = e.composedPath ? e.composedPath()[0] : e.target; const pg = t.closest && t.closest('.port:not(.decor)'); return pg ? { dev: pg.dataset.dev, port: pg.dataset.port, el: pg } : null; }
  targetOf(e) { return e.composedPath ? e.composedPath()[0] : e.target; }
  markFits() {
    this.$$('.port').forEach(pg => pg.classList.remove('fits', 'hot'));
    this.board.classList.toggle('dim-other', !!this.hand);
    this.shadowRoot.host.classList.toggle('hand', !!this.hand);
    if (!this.hand) return;
    const c = this.hand.cable, other = c[this.hand.end === 'a' ? 'b' : 'a'];
    this.$$('.port:not(.decor)').forEach(pg => { const end = { dev: pg.dataset.dev, port: pg.dataset.port }; if (!this.net.canPlug(c.type, end, other)) pg.classList.add('fits'); });
  }
  seat(c, e, end) {
    try { this.net.attach(c, e, end); } catch (err) { this.reject(c.type, end, err.message); return false; }
    this.rope(c).seat[e] = performance.now(); this.click();
    this.hand = null; this.markFits();
    if (c.a && c.b) {
      const da = this.net.device(c.a.dev), db = this.net.device(c.b.dev), pa = this.net.portOf(c.a), pb = this.net.portOf(c.b);
      if (c.type === 'cross' && da.kind !== db.kind) this.toast('Crossover between unlike devices: these ports have Auto-MDIX, so it still links. Older gear needs straight-through here.');
      else if (c.type === 'straight' && da.kind === db.kind) this.toast('Straight-through between like devices: Auto-MDIX swaps the pairs for you. On older gear this needs a crossover.');
      else if (c.type === 'console') this.toast(`Console cable in. Double-click ${da.kind === 'pc' ? db.hostname : da.hostname} to open its console from ${da.kind === 'pc' ? da.id : db.id}.`);
      else if (c.type === 'serial') this.toast(`${this.net.device(c.dce.dev).hostname} has the DCE end. It needs a clock rate before the line protocol comes up.`);
      else if ([[da, pa], [db, pb]].some(([d, p]) => d.kind === 'switch' && p.type === 'eth' && !d.ifs[p.iface].portfast)) setTimeout(() => this.toast('Amber on the switch port: spanning tree listens for 15 seconds, then learns for 15, before it forwards.'), 900);
    }
    return true;
  }
  reject(type, end, why) {
    const p = this.net.portOf(end); if (!p) return;
    const names = { eth: 'an Ethernet (RJ45) port', sfp: 'an SFP cage', serial: 'a smart serial port', con: 'a CONSOLE port', com: "a PC's COM1 port" };
    if (why === 'taken') return this.toast('That port already has a cable. Grab its plug to move it.');
    if (why === 'same') return this.toast('Both ends on the same device would just make a loop.');
    this.toast(`A ${CABLES[type].name.toLowerCase()} cable doesn't fit ${names[p.type] || 'that port'}. It goes into ${CABLES[type].fits.map(w => names[w]).join(' or ')}.`);
    if (this.hand) this.rope(this.hand.cable).pts.forEach(q => { q.px = q.x + (Math.random() - .5) * 6; });
  }
  dropHand() { if (!this.hand) return; const c = this.hand.cable; if (!c.a || !c.b) this.net.remove(c); this.hand = null; this.markFits(); }
  wire() {
    const board = this.board;
    let drag = null, downAt = null, lastDown = null;
    board.addEventListener('pointerdown', e => {
      if (e.button !== 0 || !this.net) return;
      this.closeMenu();
      const t = this.targetOf(e), pt = this.portFromEvent(e), devEl = t.closest && t.closest('.dev'), btn = t.closest && t.closest('.btn');
      downAt = { x: e.clientX, y: e.clientY };
      if (btn && !this.hand) { this.pressButton(devEl.dataset.dev, btn.dataset.button); return; }
      if (this.hand) {
        if (pt) this.seat(this.hand.cable, this.hand.end, { dev: pt.dev, port: pt.port });
        else this.dropHand();
        return;
      }
      if (pt) {
        const c = this.net.occupied(pt);
        if (c) { const end = c.a && c.a.dev === pt.dev && c.a.port === pt.port ? 'a' : 'b'; this.hand = { cable: c, end, free: this.toWorld(e.clientX, e.clientY) }; this.net.detach(c, end); this.markFits(); drag = { kind: 'plug' }; return; }
        if (!this.net.fits(this.armed, pt)) { const k = Object.keys(CABLES).find(k => this.net.fits(k, pt)); if (!k) return; this.arm(k); }
        let c2; try { c2 = this.net.plug(this.armed, { dev: pt.dev, port: pt.port }, null); } catch (err) { this.reject(this.armed, pt, err.message); return; }
        this.rope(c2).seat.a = performance.now(); this.click();
        this.hand = { cable: c2, end: 'b', free: this.toWorld(e.clientX, e.clientY) }; this.markFits(); drag = { kind: 'plug' };
        return;
      }
      if (devEl) {
        const now = performance.now();
        if (lastDown && lastDown.dev === devEl.dataset.dev && now - lastDown.t < 380) { lastDown = null; this.openConsole(devEl.dataset.dev); return; }
        lastDown = { dev: devEl.dataset.dev, t: now };
        const d = this.net.device(devEl.dataset.dev), w = this.toWorld(e.clientX, e.clientY);
        drag = { kind: 'dev', d, ox: w.x - d.x, oy: w.y - d.y }; this.devsG.appendChild(d.g); d.g.classList.add('dragging'); board.setPointerCapture(e.pointerId);
        return;
      }
      drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: this.view.x, vy: this.view.y }; board.classList.add('panning'); board.setPointerCapture(e.pointerId);
    });
    this.addEventListener('pointermove', e => {
      if (!this.net) return;
      const w = this.toWorld(e.clientX, e.clientY);
      if (this.hand) {
        this.hand.free = w; this.hand.snap = null;
        const pt = this.portFromEvent(e); this.$$('.port.hot').forEach(x => x.classList.remove('hot'));
        if (pt && pt.el.classList.contains('fits')) { pt.el.classList.add('hot'); this.hand.free = this.anchor(pt); this.hand.snap = pt; }
        else {
          let best = null, bd = 30 / this.view.z;
          this.$$('.port.fits').forEach(pg => { const a = this.anchor({ dev: pg.dataset.dev, port: pg.dataset.port }), dd = Math.hypot(a.x - w.x, a.y - w.y); if (dd < bd) { bd = dd; best = { pg, a }; } });
          if (best) { best.pg.classList.add('hot'); this.hand.free = { x: w.x + (best.a.x - w.x) * 0.6, y: w.y + (best.a.y - w.y) * 0.6 }; this.hand.snap = { dev: best.pg.dataset.dev, port: best.pg.dataset.port }; }
        }
      }
      if (drag && drag.kind === 'dev') { drag.d.x = Math.round(w.x - drag.ox); drag.d.y = Math.round(w.y - drag.oy); this.place(drag.d); drag.moved = true; }
      else if (drag && drag.kind === 'pan') { this.view.x = drag.vx + e.clientX - drag.sx; this.view.y = drag.vy + e.clientY - drag.sy; this.applyView(); }
      this.hoverInfo(e);
    });
    this.addEventListener('pointerup', e => {
      if (drag && drag.kind === 'plug' && this.hand) {
        const moved = downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6;
        const pt = this.portFromEvent(e) || this.hand.snap;
        if (moved && pt) this.seat(this.hand.cable, this.hand.end, { dev: pt.dev, port: pt.port });
      }
      if (drag && drag.d) { drag.d.g.classList.remove('dragging'); if (drag.moved) this.changed(); }
      board.classList.remove('panning'); drag = null;
    });
    board.addEventListener('wheel', e => { e.preventDefault(); if (e.shiftKey) { this.view.x -= e.deltaY; this.applyView(); return; } this.zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY); }, { passive: false });
    board.addEventListener('contextmenu', e => this.context(e));
    this.addEventListener('keydown', e => {
      const t = this.targetOf(e); if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      if (e.key === 'Escape') { this.dropHand(); this.closeMenu(); }
      if (e.key === 'Alt') { e.preventDefault(); this.alt = true; this.applyView(); }
      if (e.key === '+' || e.key === '=') this.zoomAt(1.2, ...this.center());
      if (e.key === '-') this.zoomAt(1 / 1.2, ...this.center());
      if (e.key === '0') this.fit();
    });
    this.addEventListener('keyup', e => { if (e.key === 'Alt') { this.alt = false; this.applyView(); } });
    this.tabIndex = 0;
    this.shadowRoot.addEventListener('pointerdown', e => { if (!this.targetOf(e).closest('.menu')) this.closeMenu(); }, true);
    // toolbar
    this.$('.tools').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('back')) return this.dispatchEvent(new CustomEvent('bench-back', { bubbles: true, composed: true }));
      if (b.dataset.t === 'edit') return this.backToBuilding();
      const t = b.dataset.t;
      if (t === 'zin') this.zoomAt(1.25, ...this.center()); else if (t === 'zout') this.zoomAt(0.8, ...this.center()); else if (t === 'fit') this.fit();
      else if (t === 'labels') { this.labelsOn = !this.labelsOn; b.setAttribute('aria-pressed', this.labelsOn); this.applyView(); }
      else if (t === 'fast') { this.setSpeed(this.speed === 1 ? 10 : 1); this.toast(this.speed === 1 ? 'Real time. Spanning tree takes 30 seconds again.' : 'Ten times faster. Spanning tree now finishes in 3 seconds.'); }
      else if (t === 'sound') { this.sound = !this.sound; b.setAttribute('aria-pressed', this.sound); }
      else if (t === 'brief') { const br = this.$('.brief'); br.classList.toggle('min'); b.setAttribute('aria-pressed', !br.classList.contains('min')); }
    });
    this.$('.tray').addEventListener('click', e => { const b = e.target.closest('[data-cable]'); if (!b) return; this.arm(b.dataset.cable); this.toast(`${CABLES[this.armed].name}: drag from a port to another port, or click one port and then the other.`); });
    this.$('.minbtn').addEventListener('click', () => { const br = this.$('.brief'); br.classList.toggle('min'); this.$('.minbtn').textContent = br.classList.contains('min') ? 'Show the brief' : 'Hide the brief'; });
    this.$('.term').addEventListener('click', () => { if (!String(this.shadowRoot.getSelection ? this.shadowRoot.getSelection() : getSelection())) this.$('.cin').focus(); });
    this.$('.hintbtn').addEventListener('click', () => { this.hints = !this.hints; this.renderBrief(); });
    // console
    this.$('.tabs').addEventListener('click', e => {
      const x = e.target.closest('[data-close]'); if (x) { this.tabs = this.tabs.filter(t => t !== x.dataset.close); this.open = this.tabs[this.tabs.length - 1] || null; if (!this.open) this.$('.con').classList.remove('on'); this.renderTabs(); this.renderOut(); return; }
      const t = e.target.closest('[data-tab]'); if (t) { this.open = t.dataset.tab; this.renderTabs(); this.renderOut(); this.$('.cin').focus(); }
    });
    this.$('.cclose').addEventListener('click', () => this.$('.con').classList.remove('on'));
    this.$('.cin').addEventListener('keydown', e => this.consoleKey(e));
    this.$('.pcset').addEventListener('submit', e => {
      e.preventDefault(); const f = new FormData(e.target);
      try { this.net.setPC(this.open, { ip: f.get('ip').trim(), mask: f.get('mask').trim(), gateway: f.get('gw').trim() }); this.toast(`${this.open} now has ${f.get('ip').trim() || 'no address'}.`); } catch (err) { this.toast(err.message); }
    });
  }
  center() { const r = this.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  setSpeed(s) { this.speed = s; this.$('[data-t="fast"]').setAttribute('aria-pressed', s !== 1); }
  pressButton(devId, id) {
    const d = this.net.device(devId); this.click();
    if (id === 'power') { this.net.setPower(devId, !d.power); this.toast(d.power ? `${d.hostname} is booting. Its lights go amber, then green.` : `${d.hostname} is off. Every link to it goes down.`); }
    if (id === 'mode') { const order = ['stat', 'duplx', 'speed']; d.ledMode = order[(order.indexOf(d.ledMode) + 1) % 3]; this.paint(); this.toast({ stat: 'Port lights show status: green is forwarding, amber is spanning tree waiting.', duplx: 'Port lights show duplex: green is full duplex, off is half.', speed: 'Port lights show speed: green is 100 Mb/s, blinking is 1000 Mb/s.' }[d.ledMode]); }
  }

  /* ---------- hover ---------- */
  hoverInfo(e) {
    const card = this.$('.card'), t = this.targetOf(e);
    if (!this.board.contains(t)) { card.classList.remove('on'); this.hover = { dev: null, cable: null }; return; }
    const pt = this.portFromEvent(e), devEl = t.closest && t.closest('.dev'), btn = t.closest && t.closest('.btn');
    let html = '', hc = null;
    if (!pt && !devEl && !this.hand && this.view.z >= 0.55) { const w = this.toWorld(e.clientX, e.clientY); let bd = 8 / this.view.z; for (const c of this.net.cables) { const dd = this.distToCable(c, w); if (dd < bd) { bd = dd; hc = c; } } }
    this.hover = { dev: devEl ? devEl.dataset.dev : null, cable: hc };
    if (btn) html = `<h3>${btn.dataset.button === 'power' ? 'Power' : 'Mode'}<i>button</i></h3><p>${btn.dataset.button === 'power' ? 'Press to switch the device off or on. It boots before its links come up.' : 'Press to choose what the port lights show: status, duplex or speed.'}</p>`;
    else if (pt) html = this.portCard(pt);
    else if (hc) html = this.cableCard(hc);
    else if (devEl && !this.hand) html = this.devCard(this.net.device(devEl.dataset.dev));
    if (!html) { card.classList.remove('on'); return; }
    card.innerHTML = html; card.classList.add('on');
    const host = this.getBoundingClientRect(), r = card.getBoundingClientRect();
    let x = e.clientX - host.left + 18, y = e.clientY - host.top + 18;
    if (x + r.width > host.width - 12) x = e.clientX - host.left - r.width - 18;
    if (y + r.height > host.height - 12) y = e.clientY - host.top - r.height - 18;
    card.style.left = x + 'px'; card.style.top = y + 'px';
  }
  linkOf(devId, p) { const c = this.net.cables.find(c => [c.a, c.b].some(x => x && x.dev === devId && x.port === p.key)); if (!c) return null; const o = c.a && c.a.dev === devId && c.a.port === p.key ? c.b : c.a; return { c, o }; }
  portCard(pt) {
    const net = this.net, d = net.device(pt.dev), p = net.portOf(pt), f = d.ifs[p.iface], lk = this.linkOf(d.id, p);
    if (p.type === 'con' || p.type === 'com') return `<h3>${p.type === 'con' ? 'Console port' : 'COM1 serial port'}<i>${p.type === 'con' ? 'RJ45' : 'DB-9'}</i></h3><dl><dt>Cable</dt><dd>${lk ? (lk.o ? 'console to ' + esc(net.device(lk.o.dev).hostname) : 'console, one end free') : 'nothing plugged in'}</dd></dl><p>${p.type === 'con' ? 'A rollover console cable from a PC reaches the command line before the device has any address.' : 'Plug the PC end of a console cable here.'}</p>`;
    const rows = [], st = net.stpState(d.id, p.iface);
    let led = 'off', txt = 'Off: no link';
    if (!d.power) txt = 'Off: the device is powered off';
    else if (f.phys && f.medium === p.type) { if (d.kind === 'switch' && st !== 'forwarding') { led = 'amber'; txt = `Amber: spanning tree is ${st} (${Math.max(0, Math.ceil((30000 - (net.clock - f.upSince)) / 1000))} s to forwarding)`; } else { led = 'green'; txt = 'Green: link up, forwarding'; } }
    else if (f.shutdown) txt = 'Off: administratively down';
    else if (lk && lk.o && f.medium && f.medium !== p.type) txt = 'Off: the SFP side of this combo port is in use';
    rows.push(['Light', `<span class="dot ${led}"></span>${txt}`]);
    rows.push(['Cable', lk ? (lk.o ? `${CABLES[lk.c.type].name.toLowerCase()} to ${esc(net.device(lk.o.dev).hostname)} ${esc(short(net.portOf(lk.o).iface))}` : 'one end free') : 'nothing plugged in']);
    if (d.kind === 'switch') rows.push(['Mode', f.mode === 'trunk' ? `trunk, native VLAN ${f.native}` : `access, VLAN ${f.vlan}${f.portfast ? ', PortFast' : ''}`]);
    if (d.kind === 'router') { const subs = Object.entries(d.ifs).filter(([, g]) => g.sub && g.parent === p.iface); if (subs.length) rows.push(['Subinterfaces', subs.map(([n, g]) => `.${n.split('.')[1]} VLAN ${g.encap || '?'}${g.ip ? ' ' + g.ip : ''}`).join('<br>')]); }
    if (f.ip) rows.push(['Address', `${f.ip}/${maskLen(f.mask)}`]);
    if (d.kind === 'pc') rows.push(['Address', d.ip ? `${d.ip}/${maskLen(d.mask || '0.0.0.0')}` : 'none set']);
    if (p.iface.startsWith('Serial')) { const pe = net.peerOf(d.id, p.iface); if (pe) rows.push(['Clocking', pe.cable.dce && pe.cable.dce.dev === d.id ? (f.clock ? `DCE, ${f.clock} bit/s` : 'DCE, no clock rate set') : 'DTE']); }
    const [s1, s2] = d.kind === 'pc' ? [f.phys ? 'up' : 'down', f.proto ? 'up' : 'down'] : net.ifStatus(d.id, p.iface);
    rows.push(['Status', `${s1}, protocol ${s2}`]);
    return `<h3>${esc(d.kind === 'pc' ? 'Network adapter' : p.iface)}<i>${esc(d.hostname)}</i></h3><dl>${rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>`;
  }
  devCard(d) {
    const via = this.net.consoleFrom(d.id), ups = Object.values(d.ifs).filter(f => f.proto && !f.svi && !f.sub).length;
    const rows = [['Model', d.m.name], ['Power', d.power ? (this.net.isOn(d.id) ? 'on' : 'booting') : 'off'], ['Links up', String(ups)]];
    if (d.kind === 'pc') rows.push(['Address', d.ip ? `${d.ip}/${maskLen(d.mask || '0.0.0.0')}` : 'none'], ['Gateway', d.pcgw || 'none']);
    const tip = d.kind === 'pc' ? 'Double-click for its command prompt and network settings.' : via ? `Double-click to open the console from ${via}.` : 'Needs a console cable from a PC before you can type into it.';
    return `<h3>${esc(d.hostname)}<i>${d.kind}</i></h3><dl>${rows.map(r => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl><p>${tip} Right-click for more.</p>`;
  }
  cableCard(c) { const ends = [c.a, c.b].map(x => x ? `${this.net.device(x.dev).hostname} ${x.port}` : 'free'); return `<h3>${CABLES[c.type].name}<i>cable</i></h3><dl><dt>From</dt><dd class="mono">${esc(ends[0])}</dd><dt>To</dt><dd class="mono">${esc(ends[1])}</dd></dl><p>Grab a plug to move it. Right-click to unplug.</p>`; }

  /* ---------- right-click ---------- */
  closeMenu() { this.$('.menu').hidden = true; }
  showMenu(e, items) {
    const menu = this.$('.menu'), host = this.getBoundingClientRect();
    menu.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : it.h ? `<div class="h">${esc(it.h)}</div>` : `<button type="button" role="menuitem" data-i="${i}" ${it.off ? 'disabled' : ''}>${esc(it.label)}${it.k ? `<span>${esc(it.k)}</span>` : ''}</button>`).join('');
    menu.hidden = false; const r = menu.getBoundingClientRect();
    menu.style.left = Math.min(e.clientX - host.left, host.width - r.width - 8) + 'px'; menu.style.top = Math.min(e.clientY - host.top, host.height - r.height - 8) + 'px';
    menu.onclick = ev => { const b = ev.target.closest('[data-i]'); if (!b || b.disabled) return; this.closeMenu(); items[+b.dataset.i].run(); };
  }
  context(e) {
    e.preventDefault(); this.$('.card').classList.remove('on');
    const net = this.net; if (!net) return;
    const t = this.targetOf(e), pt = this.portFromEvent(e), devEl = t.closest && t.closest('.dev');
    if (pt) {
      const d = net.device(pt.dev), p = net.portOf(pt), c = net.occupied(pt), f = d.ifs[p.iface];
      const items = [{ h: `${d.hostname} ${p.iface === 'console' ? 'CONSOLE' : p.iface === 'com' ? 'COM1' : p.iface}` }];
      if (c) items.push({ label: 'Unplug the cable', run: () => net.remove(c) });
      if (f && d.kind !== 'pc') {
        items.push({ label: f.shutdown ? 'Bring up (no shutdown)' : 'Shut down', run: () => { this.silent(d, ['interface ' + p.iface, f.shutdown ? 'no shutdown' : 'shutdown']); } });
        items.push({ label: `show interfaces ${short(p.iface)}`, off: !net.consoleFrom(d.id), run: () => { this.openConsole(d.id); this.priv(d.id, `show interfaces ${short(p.iface)}`); } });
      }
      return this.showMenu(e, items);
    }
    if (this.hover.cable) { const c = this.hover.cable; return this.showMenu(e, [{ h: CABLES[c.type].name }, { label: 'Unplug both ends', run: () => net.remove(c) }]); }
    if (devEl) {
      const d = net.device(devEl.dataset.dev), via = net.consoleFrom(d.id);
      const reach = via || this.building;
      const items = [{ h: d.hostname }, { label: d.kind === 'pc' ? 'Open command prompt' : 'Open console', k: 'double-click', off: !reach && d.kind !== 'pc', run: () => this.openConsole(d.id) }];
      if (d.kind !== 'pc') items.push({ label: 'show running-config', off: !reach, run: () => { this.openConsole(d.id); this.priv(d.id, 'show running-config'); } }, { label: 'show ip interface brief', off: !reach, run: () => { this.openConsole(d.id); this.priv(d.id, 'show ip interface brief'); } });
      items.push('-', { label: d.power ? 'Power off' : 'Power on', run: () => this.pressButton(d.id, 'power') });
      if (d.kind !== 'pc') items.push({ label: 'Restart', run: () => net.powerCycle(d.id) });
      if (this.building) items.push('-', { label: 'Rename…', run: () => this.askName(e, d) }, { label: 'Duplicate', run: () => { const c = net.copyDevice(d.id); this.drawNew(c); this.toast(`${c.id} is a copy of ${d.id}, settings and all.`); } }, { label: 'Delete', k: 'and its cables', run: () => this.deleteDev(d) });
      return this.showMenu(e, items);
    }
    this.showMenu(e, [{ label: 'Fit everything', k: '0', run: () => this.fit() }, { label: this.labelsOn ? 'Hide port names' : 'Show port names', k: 'Alt', run: () => this.$('[data-t="labels"]').click() }]);
  }
  askName(e, d) {
    this.showMenu(e, [{ h: `Rename ${d.id}` }]);
    const menu = this.$('.menu'), f = document.createElement('form');
    f.innerHTML = `<input value="${esc(d.id)}" maxlength="24" spellcheck="false" aria-label="New name"><button type="submit">Rename</button>`;
    menu.appendChild(f); menu.onclick = null;
    const inp = f.querySelector('input'); inp.focus(); inp.select();
    f.addEventListener('submit', ev => { ev.preventDefault(); this.closeMenu(); this.renameDev(d, inp.value); });
    inp.addEventListener('keydown', ev => { if (ev.key === 'Escape') this.closeMenu(); ev.stopPropagation(); });
  }
  priv(id, cmd) { const s = this.net.session(id); if (s.mode === 'user') this.net.exec(id, 'enable'); if (!['user', 'priv'].includes(s.mode)) this.net.exec(id, 'do ' + cmd); else this.net.exec(id, cmd); this.renderOut(); }
  silent(d, lines) { const s = this.net.session(d.id), was = { mode: s.mode, ifc: s.ifc }; s.mode = 'conf'; const keep = s.lines.length; lines.forEach(l => this.net.exec(d.id, l)); s.lines.length = keep; Object.assign(s, was); }

  /* ---------- console ---------- */
  openConsole(id) {
    const d = this.net.device(id), via = d.kind === 'pc' ? id : this.net.consoleFrom(id) || (this.building && 'the builder');
    if (!via) return this.toast(`Plug a console cable from a PC's COM1 port into ${d.hostname}'s CONSOLE port first. That's how you reach a device with no address yet.`);
    if (!this.tabs.includes(id)) {
      this.tabs.push(id);
      const s = this.net.session(id);
      if (!s.lines.length) s.lines.push(d.kind === 'pc' ? { text: 'Microsoft Windows [Version 10.0.22631]\n(c) Microsoft Corporation. All rights reserved.\n', cls: '' } : { text: '\n\nPress RETURN to get started!\n', cls: '' });
    }
    this.net.markOpened(id);
    this.open = id; this.renderTabs(); this.renderOut();
    const con = this.$('.con');
    if (!con.classList.contains('on')) {
      const room = this.clientWidth - (this.docked ? this.paneW('--b-con-w') : Math.min(470, this.clientWidth - 32)) - 40;
      const edge = Math.max(...this.net.devices.map(x => (x.x + x.m.w) * this.view.z + this.view.x));
      if (edge > room) { this.view.x -= Math.min(edge - room, Math.max(0, Math.min(...this.net.devices.map(x => x.x * this.view.z + this.view.x)) - 360)); this.applyView(); }
    }
    con.classList.add('on'); setTimeout(() => this.$('.cin').focus(), 60);
  }
  renderTabs() {
    this.$('.tabs').innerHTML = this.tabs.map(id => `<button class="tab" type="button" role="tab" data-tab="${id}" aria-selected="${id === this.open}">${esc(this.net.device(id).hostname)}<span class="x" data-close="${id}" aria-label="Close">×</span></button>`).join('');
    const d = this.open && this.net.device(this.open), pc = d && d.kind === 'pc';
    this.$('.vtext').textContent = !d ? '' : pc ? `${d.id} · Command Prompt` : this.net.consoleFrom(d.id) ? `${d.hostname} · console from ${this.net.consoleFrom(d.id)}, 9600 baud` : this.building ? `${d.hostname} · building, so no console cable needed` : `${d.hostname} · console`;
    const form = this.$('.pcset'); form.hidden = !pc;
    if (pc) { form.ip.value = d.ip; form.mask.value = d.mask; form.gw.value = d.pcgw; }
  }
  renderOut() {
    if (!this.open) return;
    const out = this.$('.out');
    out.innerHTML = this.net.session(this.open).lines.map(l => `<span class="${l.cls}">${l.cls === 'tip' ? md(l.text) : esc(l.text)}</span>`).join('\n');
    const term = this.$('.term'); term.scrollTop = term.scrollHeight;
    this.$('.prompt').textContent = this.net.prompt(this.open);
  }
  consoleKey(e) {
    const id = this.open; if (!id) return;
    const inp = this.$('.cin'), d = this.net.device(id), s = this.net.session(id);
    s.hi = s.hi === undefined ? s.hist.length : s.hi;
    if (e.key === 'Enter') { const v = inp.value; inp.value = ''; this.net.exec(id, v); s.hi = s.hist.length; this.renderOut(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (s.hi > 0) { s.hi--; inp.value = s.hist[s.hi]; } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (s.hi < s.hist.length) { s.hi++; inp.value = s.hist[s.hi] || ''; } }
    else if (e.key === '?' && d.kind !== 'pc') { e.preventDefault(); s.lines.push({ text: this.net.prompt(id) + inp.value + '?', cls: 'cmd' }, { text: this.net.help(id, inp.value).text, cls: '' }); this.renderOut(); }
    else if (e.key === 'Tab' && d.kind !== 'pc') { e.preventDefault(); const ws = inp.value.split(/\s+/), last = ws[ws.length - 1].toLowerCase(); if (!last) return; const opts = this.net.help(id, inp.value).list.filter(o => o.startsWith(last)); if (opts.length === 1) { ws[ws.length - 1] = opts[0]; inp.value = ws.join(' ') + ' '; } }
    else if (e.key === 'z' && e.ctrlKey && d.kind !== 'pc') { e.preventDefault(); if (!['user', 'priv'].includes(s.mode)) { s.lines.push({ text: this.net.prompt(id) + '^Z', cls: 'cmd' }); s.mode = 'priv'; this.renderOut(); } }
    e.stopPropagation();
  }

  /* ---------- feedback ---------- */
  toast(m) { const t = this.$('.toast'); t.textContent = m; t.classList.add('on'); clearTimeout(this.tT); this.tT = setTimeout(() => t.classList.remove('on'), Math.max(2600, m.length * 55)); }
  click() {
    if (!this.sound) return;
    try {
      const ac = this.ac = this.ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime, len = Math.floor(ac.sampleRate * 0.03), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
      const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 1.4; g.gain.value = 0.22;
      src.connect(bp).connect(g).connect(ac.destination); src.start(t);
      const o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.05); og.gain.setValueAtTime(0.12, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.06); o.connect(og).connect(ac.destination); o.start(t); o.stop(t + 0.07);
    } catch { /* no audio here */ }
  }
}

if (!customElements.get('octet-bench')) customElements.define('octet-bench', OctetBench);
