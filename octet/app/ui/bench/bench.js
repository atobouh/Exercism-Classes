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
import { CABLES, CATALOG, MODULES, SFPS } from './catalog.js';
import { drawDevice, DEFS, GLYPH } from './faceplate.js';

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
.tgrp { display: grid; gap: 1px; }
.tgrp > div { display: flex; gap: 2px; }
.tg { font: 500 10.5px var(--b-ui); color: var(--b-ink3); padding: 0 8px; letter-spacing: .02em; }
.tsep { width: 1px; background: var(--b-line); margin: 4px 4px; flex: 0 0 auto; }
.cable { border: 0; background: transparent; color: var(--b-ink2); border-radius: 9px; padding: 4px 9px 4px 5px; display: grid; grid-template-columns: 26px auto; gap: 2px 6px; align-items: center; cursor: pointer; text-align: left; font: inherit; transition: background-color 120ms ease, transform 160ms var(--b-ease); }
.cable:hover { background: var(--b-hover); color: var(--b-ink); }
.cable:active { transform: scale(0.97); }
.cable[aria-pressed="true"] { background: var(--b-sel); color: var(--b-ink); }
.cable svg { width: 26px; height: 22px; }
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
.pcset .ipmode { grid-column: 1 / -1; display: flex; gap: 4px; align-items: center; }
.pcset .ipmode button { background: transparent; color: var(--b-ink2); font-weight: 500; box-shadow: inset 0 0 0 1px var(--b-line); padding: 4px 10px; }
.pcset .ipmode button[aria-checked="true"] { background: var(--b-ink); color: var(--b-bench); box-shadow: none; }
.pcset .ipst, .pcset .wst { font-size: 11.5px; color: var(--b-ink3); margin-left: 6px; }
.pcset .wifi { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; gap: 8px; align-items: end; }
.pcset .wifi[hidden] { display: none; }
.pcset .wifi .wst { grid-column: 1 / -1; margin: 0; }
.pcset input[readonly] { color: var(--b-ink3); box-shadow: inset 0 0 0 1px var(--b-line); }
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
.sim { left: 50%; bottom: 16px; transform: translateX(-50%); width: min(820px, calc(100% - 32px)); z-index: 6; display: grid; gap: 8px; padding: 8px 10px 10px; }
.sim[hidden], .tray[hidden] { display: none; }
:host(.simming) .toast { bottom: 280px; }
:host([layout="docked"]) .sim { left: calc(var(--b-pane-w) + (100% - var(--b-pane-w)) / 2); width: min(820px, calc(100% - var(--b-pane-w) - 32px)); }
:host([layout="docked"]) .brief.min ~ .sim { left: 50%; width: min(820px, calc(100% - 32px)); }
.s-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.s-top label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--b-ink3); }
.s-top .s-tol[hidden] { display: none; }
.s-top select, .s-top input { border: 0; border-radius: 7px; background: var(--b-bench); color: var(--b-ink); font: 400 13px var(--b-ui); padding: 6px 8px; outline: none; box-shadow: inset 0 0 0 1px var(--b-line); }
.s-top input { width: 150px; font-family: var(--b-mono); font-size: 12.5px; }
.s-top select:focus, .s-top input:focus { box-shadow: inset 0 0 0 1.5px var(--b-you); }
.s-top .wbtn { padding: 7px 12px; }
.s-top .tb[disabled] { opacity: .4; cursor: default; }
.s-play { min-width: 34px; justify-content: center; font-size: 11px; }
.s-speed { display: inline-flex; }
.s-speed .tb { padding: 0 8px; }
.s-speed .tb[aria-checked="true"] { background: var(--b-sel); color: var(--b-ink); }
.s-x { margin-left: auto; }
.s-body { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 8px; height: 168px; }
.s-ev { margin: 0; padding: 0; list-style: none; overflow-y: auto; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--b-line); }
.s-ev li { display: grid; grid-template-columns: 22px 62px minmax(0, 1fr); gap: 6px; padding: 5px 8px; font-size: 12.5px; line-height: 1.4; color: var(--b-ink2); cursor: pointer; border-bottom: 1px solid var(--b-line); }
.s-ev li:hover { background: var(--b-hover); }
.s-ev li.sel { background: var(--b-sel); color: var(--b-ink); }
.s-ev li.fail { color: var(--b-broken); font-weight: 500; }
.s-ev li.ok { color: var(--b-ok); font-weight: 500; }
.s-ev li.s-hint { display: block; cursor: default; color: var(--b-ink3); border: 0; }
.s-ev li.s-hint:hover { background: none; }
.s-t { font: 500 11px var(--b-mono); color: var(--b-ink3); padding-top: 1px; font-variant-numeric: tabular-nums; }
.s-d { font-weight: 600; color: var(--b-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.s-x2 i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 6px; vertical-align: 0; }
.s-ev code, .s-pdu code { font: 400 11.5px var(--b-mono); }
.s-pdu { overflow-y: auto; border-radius: 8px; padding: 6px 10px; box-shadow: inset 0 0 0 1px var(--b-line); font-size: 12px; }
.s-pdu h4 { margin: 6px 0 2px; font: 600 11.5px var(--b-ui); color: var(--b-ink); }
.s-pdu dl { margin: 0; display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 1px 8px; }
.s-pdu dt { color: var(--b-ink3); }
.s-pdu dd { margin: 0; font-family: var(--b-mono); font-size: 11.5px; color: var(--b-ink2); overflow-wrap: anywhere; }
.s-pdu p { margin: 4px 0; color: var(--b-ink2); }
.s-pdu .s-on { font-weight: 500; color: var(--b-ink); }
.s-hint { color: var(--b-ink3); }
.s-key { display: flex; gap: 14px; font-size: 11.5px; color: var(--b-ink3); padding: 0 2px; }
.s-key i { display: inline-block; width: 10px; height: 7px; border-radius: 2px; margin-right: 5px; }
.s-key i.x { width: 9px; height: 9px; border-radius: 50%; background: var(--b-broken); }
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
.drawer h2 { margin: 10px 2px 2px; font: 500 11.5px var(--b-ui); color: var(--b-ink3); display: flex; justify-content: space-between; }
.drawer h2 span { font-variant-numeric: tabular-nums; }
.dwlist { display: grid; gap: 6px; align-content: start; }
.dwlist h2:first-child { margin-top: 0; }
.dwtools { display: grid; gap: 8px; position: sticky; top: -12px; z-index: 1; margin: -12px -14px 0; padding: 12px 14px 8px; background: var(--b-pop); border-bottom: 1px solid var(--b-line); }
:host([layout="docked"]) .dwtools { background: var(--b-pane); }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip { border: 0; background: transparent; color: var(--b-ink2); font: 500 12px var(--b-ui); padding: 4px 9px; border-radius: 99px; cursor: pointer; box-shadow: inset 0 0 0 1px var(--b-line); }
.chip:hover { color: var(--b-ink); background: var(--b-hover); }
.chip[aria-checked="true"] { background: var(--b-ink); color: var(--b-bench); box-shadow: none; }
.dwrow { display: flex; gap: 6px; }
.dwq { flex: 1; min-width: 0; border: 0; border-radius: 7px; background: var(--b-bench); color: var(--b-ink); font: 400 13px var(--b-ui); padding: 6px 8px; outline: none; box-shadow: inset 0 0 0 1px var(--b-line); }
.dwq:focus { box-shadow: inset 0 0 0 1.5px var(--b-you); }
.dwc { border: 0; border-radius: 7px; background: transparent; color: var(--b-ink2); font: 500 12px var(--b-ui); padding: 0 9px; cursor: pointer; box-shadow: inset 0 0 0 1px var(--b-line); }
.dwc:hover { color: var(--b-ink); }
.dwc[aria-pressed="true"] { background: var(--b-sel); color: var(--b-ink); box-shadow: none; }
.drawer .none { padding: 8px 2px; }
.drawer.compact .dv { grid-template-columns: 24px minmax(0, 1fr); gap: 0 10px; padding: 6px 8px; align-items: center; }
.drawer.compact .dv svg.gl { width: 24px; height: 24px; grid-row: span 2; fill: none; stroke: var(--b-ink2); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.drawer.compact .dv span { font-size: 11px; }
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

// One colour per kind of traffic in the simulation.
const SIMC = { arp: 'oklch(80% 0.14 80)', 'arp-reply': 'oklch(80% 0.14 80)', icmp: 'oklch(68% 0.14 250)', reply: 'oklch(72% 0.15 155)', dhcp: 'oklch(66% 0.17 305)' };
const SIM_STEP = 900; // ms per step at 1×

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
  <button class="tb" type="button" data-t="sim" aria-pressed="false" title="Simulation: watch a ping move, frame by frame">Simulation</button>
  <button class="tb" type="button" data-t="sound" aria-pressed="true">Sound</button>
</div>
<div class="panel tray" role="toolbar" aria-label="Cables"></div>
<section class="panel sim" aria-label="Simulation" hidden>
  <form class="s-top"><select class="s-kind" aria-label="What to send"><option value="ping">Ping</option><option value="dhcp">DHCP: get an address</option></select><label>From<select class="s-from" aria-label="From"></select></label><label class="s-tol">To<input class="s-to" list="s-ips" placeholder="an IP address" spellcheck="false" autocomplete="off" aria-label="To"></label><datalist id="s-ips"></datalist><button class="wbtn main" type="submit">Send</button>
    <span class="sep"></span><button class="tb s-play" type="button" aria-label="Play" title="Play or pause" disabled></button><button class="tb s-step" type="button" title="One step" disabled>Step</button>
    <span class="s-speed" role="radiogroup" aria-label="Speed"><button class="tb" type="button" role="radio" data-sp="0.5" aria-checked="false">½×</button><button class="tb" type="button" role="radio" data-sp="1" aria-checked="true">1×</button><button class="tb" type="button" role="radio" data-sp="2" aria-checked="false">2×</button></span>
    <button class="tb s-x" type="button" aria-label="Close the simulation" title="Close">✕</button></form>
  <div class="s-body"><ol class="s-ev" aria-live="polite"></ol><div class="s-pdu"></div></div>
  <div class="s-key"><span><i style="background:${SIMC.arp}"></i>ARP</span><span><i style="background:${SIMC.icmp}"></i>Echo request</span><span><i style="background:${SIMC.reply}"></i>Echo reply</span><span><i style="background:${SIMC.dhcp}"></i>DHCP</span><span><i class="x"></i>Where it stops</span></div>
</section>
<aside class="panel con" aria-label="Console"><div class="tabs" role="tablist"></div><div class="via"><span class="vtext"></span><button type="button" class="cclose">Close</button></div>
  <div class="cbody"><form class="pcset" hidden><div class="ipmode" role="radiogroup" aria-label="How it gets an address"><button type="button" role="radio" data-ipm="static" aria-checked="true">Static</button><button type="button" role="radio" data-ipm="dhcp" aria-checked="false">DHCP</button><span class="ipst"></span></div><label>IPv4 address<input name="ip" spellcheck="false" autocomplete="off"></label><label>Subnet mask<input name="mask" spellcheck="false" autocomplete="off"></label><label>Default gateway<input name="gw" spellcheck="false" autocomplete="off"></label><button type="submit">Apply</button><div class="wifi" hidden><label><span class="wl">SSID</span><input name="ssid" spellcheck="false" autocomplete="off"></label><label>WPA2 key<input name="key" type="password" autocomplete="off"></label><button type="button" data-wifi>Connect</button><span class="wst"></span></div></form><div class="term"><pre class="out" aria-live="polite"></pre><label class="line"><span class="prompt"></span><input class="cin" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Command"></label></div></div></aside>
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
  dhcp: { name: 'Got an address by DHCP', f: ['device'], dev: ['pc'], get: c => ({ device: c.device || c }), put: v => ({ device: v.device }), say: v => `Get ${v.device} an address from DHCP.` },
  wifi: { name: 'Joined the Wi-Fi', f: ['device'], dev: ['pc'], get: c => ({ device: c.device || c }), put: v => ({ device: v.device }), say: v => `Connect ${v.device} to the wireless network.` },
  ospf: { name: 'OSPF neighbor is up', f: ['device'], dev: ['router', 'switch'], get: c => ({ device: c.device }), put: v => ({ device: v.device, neighbors: 1 }), say: v => `Bring up an OSPF neighbor on ${v.device}.` },
  nat: { name: 'NAT is translating', f: ['device'], dev: ['router'], get: c => ({ device: c.device }), put: v => ({ device: v.device }), say: v => `Make ${v.device} translate inside addresses with NAT.` },
  blocked: { name: 'Ping blocked by an ACL', f: ['device', 'to'], get: c => ({ device: c.from, to: c.to }), put: v => ({ from: v.device, to: v.to }), say: v => `Stop ${v.device} from pinging ${v.to || '…'} with an access list.` },
  reach: { name: 'Can reach an address', f: ['device', 'to'], get: c => ({ device: c.from, to: c.to }), put: v => ({ from: v.device, to: v.to }), say: v => `Make ${v.to || '…'} reachable from ${v.device}.` },
};
const FIELD = { device: 'Device', iface: 'Interface', port: 'Port', to: 'To', toport: 'Port (any)', ip: 'Address', mask: 'Mask', gateway: 'Gateway', vlans: 'VLANs', up: 'Up' };
// The drawer's chips: which models each one shows.
const CHIPS = [
  ['all', 'All', () => true],
  ['router', 'Routers', m => m.kind === 'router' && m.group !== 'security'],
  ['switch', 'Switches', m => m.kind === 'switch'],
  ['l3', 'Layer 3', m => m.kind === 'switch' && !!m.l3],
  ['hub', 'Hubs', m => m.kind === 'hub'],
  ['pc', 'End devices', m => m.kind === 'pc' && m.series !== 'Wireless'],
  ['wireless', 'Wireless', m => m.kind === 'ap' || m.series === 'Wireless' || m.nic === 'Wireless0'],
  ['security', 'Security', m => m.group === 'security'],
];
const GROUPS = [['router', 'Routers'], ['switch', 'Switches'], ['hub', 'Hubs'], ['pc', 'End devices'], ['ap', 'Wireless'], ['wireless', 'Wireless'], ['security', 'Security'], ['wan', 'WAN']];
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
    this.dw = { chip: 'all', q: '', compact: false };
    this.raf = 0; this.passedOnce = false; this.hints = false; this.said = new WeakMap();
  }
  connectedCallback() {
    this.board = this.$('svg.board'); this.cam = this.$('.cam'); this.devsG = this.$('.devs'); this.canvas = this.$('canvas'); this.ctx = this.canvas.getContext('2d');
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this);
    this.wire(); this.wireBuild(); this.wireSim();
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
    this.sim = null; if (this.simOn) { this.simFill(); this.simRender(); }
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
    const padT = dock ? 64 : 80, padB = this.simOn ? 290 : 110, padL = dock ? (briefOn ? this.paneW('--b-pane-w') + 24 : 24) : W > 900 ? 360 : 24, padR = 24;
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
    // Wi-Fi: a dashed line from each client to the access point it joined
    for (const { client, ap } of this.net.wireless ? this.net.wireless() : []) {
      const a = this.net.device(client), b = this.net.device(ap);
      ctx.save(); ctx.strokeStyle = 'oklch(70% 0.12 230 / .7)'; ctx.lineWidth = 1.6 / Math.max(v.z, 0.5); ctx.setLineDash([6 / v.z, 6 / v.z]); ctx.lineDashOffset = -performance.now() / 60;
      ctx.beginPath(); ctx.moveTo(a.x + a.m.w / 2, a.y + a.m.h / 2); ctx.lineTo(b.x + b.m.w / 2, b.y + b.m.h / 2); ctx.stroke(); ctx.restore();
    }
    const far = v.z < 0.55, { dev: hd, cable: hc } = this.hover;
    for (const c of this.net.cables) {
      const k = CABLES[c.type], col = k.color, p = this.rope(c).pts;
      ctx.globalAlpha = !hd && !hc ? 1 : (c === hc || (hd && [c.a, c.b].some(x => x && x.dev === hd))) ? 1 : 0.32;
      if (far) {
        if (!c.a || !c.b) continue;
        const da = this.net.device(c.a.dev), db = this.net.device(c.b.dev);
        ctx.beginPath(); ctx.moveTo(da.x + da.m.w / 2, da.y + da.m.h / 2); ctx.lineTo(db.x + db.m.w / 2, db.y + db.m.h / 2);
        ctx.lineWidth = 2.4 / v.z; ctx.strokeStyle = col; ctx.setLineDash(CABLES[c.type].console ? [4 / v.z, 5 / v.z] : []); ctx.stroke(); ctx.setLineDash([]);
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
    const w = port ? port.w - 2 : (c.type === 'serial' ? 24 : CABLES[c.type].fiber ? 20 : 18), h = port ? port.h - 2 : 13;
    const rr = (x0, y0, w0, h0, rad) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x0, y0, w0, h0, rad); else ctx.rect(x0, y0, w0, h0); };
    ctx.save();
    if (c.type === 'serial') {
      ctx.fillStyle = 'oklch(30% 0.01 260)'; ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = .6;
      rr(x - w / 2 - 3, y - h / 2 - 1, w + 6, h + 4, 2); ctx.fill(); ctx.stroke();
      const isDce = c.dce ? (c[e] && c.dce.dev === c[e].dev && c.dce.port === c[e].port) : e === 'a';
      if (isDce) { ctx.fillStyle = 'oklch(85% 0.01 250)'; ctx.font = '600 5.2px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DCE', x, y + 2); }
    } else if (c.type === 'usb') {
      ctx.fillStyle = 'oklch(30% 0.01 260)'; rr(x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 6, 1.4); ctx.fill();
    } else if (CABLES[c.type].fiber) {
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
    this.simAdvance(dt);
    this.stepRopes(); this.drawWires(); this.drawSim();
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
    const od = this.open && this.net.device(this.open);
    if (od && (od.kind === 'pc' || od.kind === 'ap') && !this.$('.pcset').hidden && !this.$('.pcset').contains(this.shadowRoot.activeElement)) this.fillPC(od);
    clearTimeout(this.saveT);
    this.saveT = setTimeout(() => this.dispatchEvent(new CustomEvent('bench-change', { bubbles: true, composed: true, detail: { lab: this.lab && this.lab.id, state: this.snapshot(), mode: this.mode } })), 400);
  }

  /* ---------- build mode ---------- */
  renderBuild() {
    const br = this.$('.brief');
    if (!this.building) return;
    br.classList.remove('min');
    // the drawer: a row of chips, a search box and the models grouped by series
    const dw = this.dw;
    this.$('.drawer').innerHTML = `<div class="dwtools"><div class="chips" role="radiogroup" aria-label="Kind of device">${CHIPS.map(([k, name]) => `<button class="chip" type="button" role="radio" data-chip="${k}" aria-checked="${k === dw.chip}">${name}</button>`).join('')}</div><div class="dwrow"><input class="dwq" type="search" placeholder="Search, like 2960 or ISR" value="${esc(dw.q)}" spellcheck="false" autocomplete="off" aria-label="Search devices"><button class="dwc" type="button" aria-pressed="${dw.compact}" title="Compact list: small icons instead of faceplates">Compact</button></div></div><div class="dwlist"></div><p>Right-click a device on the board to rename, copy or delete it.</p>`;
    this.renderDrawer();
    this.renderWriter();
  }
  renderDrawer() {
    const dw = this.dw, list = this.$('.dwlist'); if (!list) return;
    this.$('.drawer').classList.toggle('compact', dw.compact);
    const words = dw.q.toLowerCase().split(/\s+/).filter(Boolean);
    const chip = CHIPS.find(([k]) => k === dw.chip)[2];
    const hay = (id, m) => [id, m.name, m.platform, m.series, m.kind, m.l3 ? 'layer 3 l3 multilayer' : '', (GROUPS.find(([k]) => k === (m.group || m.kind)) || [])[1]].join(' ').toLowerCase();
    const models = Object.entries(CATALOG).filter(([id, m]) => chip(m) && words.every(w => hay(id, m).includes(w)));
    // by series, in catalog order; a model with no series goes under its kind
    const groups = new Map();
    for (const [id, m] of models) { const g = m.series || (GROUPS.find(([k]) => k === (m.group || m.kind)) || [, 'Other'])[1]; if (!groups.has(g)) groups.set(g, []); groups.get(g).push([id, m]); }
    list.innerHTML = groups.size ? [...groups].map(([name, ms]) => `<h2>${esc(name)}<span>${ms.length}</span></h2>` + ms.map(([id, m]) => `<button class="dv" type="button" data-model="${esc(id)}" title="Drag onto the board, or click">${dw.compact ? `<svg class="gl" viewBox="0 0 32 32" aria-hidden="true">${GLYPH[m.glyph] || GLYPH[m.kind] || GLYPH.pc}</svg>` : `<svg viewBox="-4 -4 ${m.w + 8} ${m.h + 8}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>`}<b>${esc(m.name)}</b><span>${esc(m.platform || m.kind)}</span></button>`).join('')).join('')
      : `<p class="none">Nothing matches “${esc(dw.q)}”${dw.chip !== 'all' ? ' here. Try All' : ''}.</p>`;
    if (!dw.compact) list.querySelectorAll('.dv').forEach(b => { const m = CATALOG[b.dataset.model]; drawDevice(b.querySelector('svg'), { id: '', hostname: '', m, kind: m.kind }); });
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
        const names = !d ? [] : k === 'iface' ? Object.keys(d.ifs) : d.m.ports.filter(p => !['decor', 'con', 'com', 'usb', 'usbcon'].includes(p.type)).map(p => p.key);
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
    // the drawer's chips, search and compact switch
    this.$('.drawer').addEventListener('click', e => {
      const c = e.target.closest('[data-chip]'), k = e.target.closest('.dwc');
      if (c) { this.dw.chip = c.dataset.chip; this.$$('[data-chip]').forEach(x => x.setAttribute('aria-checked', x === c)); this.renderDrawer(); }
      if (k) { this.dw.compact = !this.dw.compact; k.setAttribute('aria-pressed', this.dw.compact); this.renderDrawer(); }
    });
    this.$('.drawer').addEventListener('input', e => { if (e.target.classList.contains('dwq')) { this.dw.q = e.target.value; this.renderDrawer(); } });
    this.$('.drawer').addEventListener('keydown', e => { if (e.target.classList.contains('dwq') && e.key === 'Enter') { const first = this.$('.dwlist .dv'); if (first) this.addFromDrawer(first.dataset.model); } });
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

  /* ---------- simulation ---------- */
  // A ping, slowed down: envelopes travel the real cables, one step at a
  // time, and a red ✕ marks where it stops and why. The engine works out the
  // whole trip first (net.simulate); this only plays it back.
  simToggle(on = !this.simOn) {
    this.simOn = on;
    this.$('[data-t="sim"]').setAttribute('aria-pressed', on);
    this.$('.sim').hidden = !on; this.$('.tray').hidden = on;
    this.classList.toggle('simming', on);
    requestAnimationFrame(() => this.fit());
    if (on) { this.simFill(); this.simRender(); setTimeout(() => this.$('.s-to').focus(), 30); } else { this.simCommit(); this.sim = null; }
  }
  simFill() {
    const addrs = this.net.addresses(), from = this.$('.s-from'), keep = from.value;
    const dhcp = this.$('.s-kind').value === 'dhcp';
    this.$('.s-tol').hidden = dhcp;
    const senders = dhcp ? this.net.devices.filter(d => d.kind === 'pc') : this.net.devices.filter(d => this.net.addresses().some(a => a.dev === d.id));
    from.innerHTML = senders.map(d => `<option value="${esc(d.id)}">${esc(d.hostname)}</option>`).join('') || `<option value="">${dhcp ? 'No end device on the bench' : 'No device has an address yet'}</option>`;
    if (senders.some(d => d.id === keep)) from.value = keep;
    else { const pc = senders.find(d => d.kind === 'pc'); if (pc) from.value = pc.id; }
    this.$('#s-ips').innerHTML = addrs.map(a => `<option value="${esc(a.ip)}">${esc(this.net.device(a.dev).hostname)} ${esc(short(a.n))}</option>`).join('');
  }
  simSend(from, to, kind = 'ping') {
    this.simCommit();
    if (!from) return this.toast(kind === 'dhcp' ? 'Put a PC on the bench first.' : 'Give a device an IP address first: it needs one to send a ping.');
    if (kind === 'ping' && !to) return this.toast('Type the address to ping, or pick one from the list.');
    const tr = kind === 'dhcp' ? this.net.simulateDhcp(from) : this.net.simulate(from, to);
    this.sim = { tr, from, to, kind, t: 0, playing: true, sel: -1, shown: -1, done: false, speed: this.sim ? this.sim.speed : (this.simSpeed || 1) };
    this.$('.s-play').disabled = this.$('.s-step').disabled = false;
    this.simRender();
  }
  // The real ping happens once the trip has been shown: ARP and MAC tables fill, tasks see it.
  simCommit() { const s = this.sim; if (!s || s.done) return; s.done = true; if (s.kind === 'dhcp') { if (s.tr.ok) this.net.setPC(s.from, { dhcp: true }); } else this.net.ping(s.from, s.to); }
  simAdvance(dt) {
    const s = this.sim; if (!s || !s.playing) return;
    s.t = Math.min(s.tr.steps, s.t + dt * s.speed / SIM_STEP);
    if (s.t >= s.tr.steps) { s.playing = false; this.simCommit(); }
    if (Math.floor(s.t) !== s.shown || !s.playing) this.simRender();
  }
  simStep() { const s = this.sim; if (!s) return; s.playing = false; s.t = Math.min(s.tr.steps, Math.floor(s.t + 1e-6) + 1); if (s.t >= s.tr.steps) this.simCommit(); this.simRender(); }
  simRender() {
    const s = this.sim, list = this.$('.s-ev'), play = this.$('.s-play');
    play.textContent = s && s.playing ? '❚❚' : '▶'; play.setAttribute('aria-label', s && s.playing ? 'Pause' : 'Play');
    if (!s) { list.innerHTML = '<li class="s-hint">Choose who sends and the address to ping, then Send. Each step moves every frame one cable.</li>'; this.$('.s-pdu').innerHTML = ''; return; }
    const now = Math.floor(s.t + 1e-6); s.shown = now;
    const evs = s.tr.events.map((e, i) => ({ ...e, i })).filter(e => e.step <= now).sort((a, b) => a.step - b.step || a.i - b.i);
    list.innerHTML = evs.map(e => `<li class="${e.kind === 'fail' ? 'fail' : e.kind === 'done' ? 'ok' : ''}${e.i === s.sel ? ' sel' : ''}" data-ev="${e.i}"><span class="s-t">${e.step}</span><span class="s-d">${esc(this.net.device(e.dev) ? this.net.device(e.dev).hostname : e.dev)}</span><span class="s-x2"><i style="background:${e.kind === 'fail' ? 'var(--b-broken)' : SIMC[e.kind] || 'var(--b-ink3)'}"></i>${md(e.text)}</span></li>`).join('') || '<li class="s-hint">Sending…</li>';
    const sel = list.querySelector('.sel') || list.lastElementChild; if (sel) sel.scrollIntoView({ block: 'nearest' });
    this.simPdu();
  }
  simPdu() {
    const s = this.sim, box = this.$('.s-pdu');
    const ev = s.sel >= 0 ? s.tr.events[s.sel] : null;
    let f = ev && ev.frame >= 0 ? s.tr.frames[ev.frame] : null;
    if (!f && ev) f = s.tr.frames.find(x => x.step === ev.step && (x.from.dev === ev.dev || x.to.dev === ev.dev)) || s.tr.frames.find(x => x.step === ev.step);
    if (!f) { const now = Math.min(Math.floor(s.t), s.tr.steps - 1); f = s.tr.frames.find(x => x.step === now); }
    if (!f) { box.innerHTML = s.tr.fail ? `<h4>Stopped</h4><p>${md(s.tr.fail.reason)}</p>` : '<p class="s-hint">Click a step to open its frame.</p>'; return; }
    const p = f.pdu, row = (k, v) => `<dt>${k}</dt><dd>${esc(v)}</dd>`, dn = x => `${this.net.device(x.dev).hostname} ${short(x.n)}`;
    let h = `<p class="s-on">${esc(dn(f.from))} → ${esc(dn(f.to))}</p><h4>Ethernet II</h4><dl>${row('Destination', p.eth.dst + (p.eth.dst === 'ffff.ffff.ffff' ? ' (broadcast)' : ''))}${row('Source', p.eth.src)}${row('Type', p.eth.type === 'ARP' ? 'ARP (0x0806)' : 'IPv4 (0x0800)')}</dl>`;
    h += p.eth.vlan ? `<h4>802.1Q tag</h4><dl>${row('VLAN', p.eth.vlan)}${row('Why', 'this cable is a trunk')}</dl>` : '';
    if (p.arp) h += `<h4>ARP ${p.arp.op}</h4><dl>${row('Sender', `${p.arp.senderIp}, ${p.arp.senderMac}`)}${row('Target', `${p.arp.targetIp}, ${p.arp.op === 'request' ? 'unknown' : p.arp.targetMac}`)}</dl>`;
    if (p.ip) h += `<h4>IPv4</h4><dl>${row('Source', p.ip.src)}${row('Destination', p.ip.dst)}${row('TTL', p.ip.ttl)}${row('Protocol', p.udp ? 'UDP (17)' : 'ICMP (1)')}</dl>`;
    if (p.icmp) h += `<h4>ICMP</h4><dl>${row('Type', p.icmp.type)}</dl>`;
    if (p.udp) h += `<h4>UDP</h4><dl>${row('Ports', `${p.udp.sport} → ${p.udp.dport}`)}</dl>`;
    if (p.dhcp) h += `<h4>DHCP ${esc(p.dhcp.op)}</h4><dl>${p.dhcp.client ? row('Client', p.dhcp.client) : ''}${p.dhcp.yiaddr ? row('Your address', `${p.dhcp.yiaddr}/${maskLen(p.dhcp.mask)}`) : ''}${p.dhcp.requested ? row('Requested', p.dhcp.requested) : ''}${p.dhcp.router ? row('Router', p.dhcp.router) : ''}${p.dhcp.dns ? row('DNS', p.dhcp.dns) : ''}${p.dhcp.giaddr ? row('Relay (giaddr)', p.dhcp.giaddr) : ''}${p.dhcp.server ? row('Server', p.dhcp.server) : ''}</dl>`;
    box.innerHTML = h;
  }
  // Where a frame is now: along the cable's rope, or straight when zoomed out.
  simPos(f, k) {
    const c = this.net.cables.find(x => x.id === f.cable);
    if ((!c && String(f.cable).startsWith('w:')) || this.view.z < 0.55) {
      const A = this.net.device(f.from.dev), B = this.net.device(f.to.dev);
      const a = { x: A.x + A.m.w / 2, y: A.y + A.m.h / 2 }, b = { x: B.x + B.m.w / 2, y: B.y + B.m.h / 2 };
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    if (!c || !c.a || !c.b) return null;
    const fwd = c.a.dev === f.from.dev && this.net.portOf(c.a).iface === f.from.n;
    const p = this.rope(c).pts, seg = []; let total = 0;
    for (let i = 0; i < N - 1; i++) { const l = Math.hypot(p[i + 1].x - p[i].x, p[i + 1].y - p[i].y); seg.push(l); total += l; }
    let want = (fwd ? k : 1 - k) * total;
    for (let i = 0; i < N - 1; i++) { if (want <= seg[i] || i === N - 2) { const u = seg[i] ? Math.min(1, want / seg[i]) : 0; return { x: p[i].x + (p[i + 1].x - p[i].x) * u, y: p[i].y + (p[i + 1].y - p[i].y) * u }; } want -= seg[i]; }
    return null;
  }
  drawSim() {
    const s = this.sim; if (!s) return;
    const ctx = this.ctx, z = this.view.z, k = Math.max(1, 0.9 / z), now = Math.floor(s.t + 1e-6), u = s.t - now;
    if (s.t < s.tr.steps) for (const f of s.tr.frames) {
      if (f.step !== now) continue;
      const e = 1 - Math.pow(1 - u, 2.2), pos = this.simPos(f, s.playing ? e : Math.max(0.5, e)); if (!pos) continue;
      const w = 18 * k, h = 12 * k, x = pos.x - w / 2, y = pos.y - h / 2 - 10 * k;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 6 * k; ctx.shadowOffsetY = 2 * k;
      ctx.fillStyle = SIMC[f.kind] || '#999'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 2.5 * k); else ctx.rect(x, y, w, h); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(x + 2 * k, y + 2 * k); ctx.lineTo(x + w / 2, y + h * 0.58); ctx.lineTo(x + w - 2 * k, y + 2 * k); ctx.stroke();
      if (f.pdu.eth.vlan) { ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.font = `600 ${7.5 * k}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(String(f.pdu.eth.vlan), x + w / 2, y + h + 8 * k); }
      ctx.restore();
    }
    const fl = s.tr.fail;
    if (fl && s.t >= fl.step + (s.tr.frames.some(f => f.step === fl.step) ? 0.999 : 0)) {
      let pos = null;
      const c = fl.cable && this.net.cables.find(x => x.id === fl.cable);
      if (c && c.a && c.b) { const p = this.rope(c).pts; pos = p[Math.floor(N / 2)]; }
      else { const d = this.net.device(fl.dev); if (d) pos = { x: d.x + d.m.w / 2, y: d.y + d.m.h / 2 }; }
      if (pos) {
        const r = 11 * k; ctx.save();
        ctx.fillStyle = getComputedStyle(this).getPropertyValue('--b-broken') || 'red';
        ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2 * k; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(pos.x - r * .42, pos.y - r * .42); ctx.lineTo(pos.x + r * .42, pos.y + r * .42); ctx.moveTo(pos.x + r * .42, pos.y - r * .42); ctx.lineTo(pos.x - r * .42, pos.y + r * .42); ctx.stroke();
        const text = fl.reason.length > 70 ? fl.reason.slice(0, fl.reason.lastIndexOf(' ', 68)) + '…' : fl.reason;
        ctx.font = `500 ${11.5 * k}px ${getComputedStyle(this).getPropertyValue('--b-ui') || 'sans-serif'}`; ctx.textAlign = 'left';
        const tw = ctx.measureText(text.replace(/`/g, '')).width, bx = pos.x + r + 6 * k, by = pos.y - 11 * k;
        ctx.fillStyle = getComputedStyle(this).getPropertyValue('--b-pop') || '#fff'; ctx.strokeStyle = ctx.fillStyle;
        ctx.globalAlpha = .94; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, tw + 16 * k, 22 * k, 6 * k); else ctx.rect(bx, by, tw + 16 * k, 22 * k); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = getComputedStyle(this).getPropertyValue('--b-broken') || 'red'; ctx.fillText(text.replace(/`/g, ''), bx + 8 * k, by + 15 * k);
        ctx.restore();
      }
    }
  }
  wireSim() {
    const p = this.$('.sim');
    p.querySelector('.s-top').addEventListener('submit', e => { e.preventDefault(); this.simSend(this.$('.s-from').value, this.$('.s-kind').value === 'dhcp' ? '' : this.$('.s-to').value.trim(), this.$('.s-kind').value); });
    this.$('.s-kind').addEventListener('change', () => this.simFill());
    this.$('.s-from').addEventListener('focus', () => this.simFill());
    this.$('.s-to').addEventListener('focus', () => this.simFill());
    p.addEventListener('click', e => {
      const b = e.target.closest('button, [data-ev]'); if (!b) return;
      const s = this.sim;
      if (b.classList.contains('s-x')) return this.simToggle(false);
      if (b.classList.contains('s-play') && s) { if (s.t >= s.tr.steps) { s.t = 0; s.sel = -1; } s.playing = !s.playing; this.simRender(); }
      else if (b.classList.contains('s-step') && s) this.simStep();
      else if (b.dataset.sp) { this.simSpeed = +b.dataset.sp; if (s) s.speed = this.simSpeed; p.querySelectorAll('[data-sp]').forEach(x => x.setAttribute('aria-checked', x === b)); }
      else if (b.dataset.ev !== undefined && s) { const ev = s.tr.events[+b.dataset.ev]; s.sel = +b.dataset.ev; s.playing = false; s.t = Math.min(s.tr.steps, ev.step + (ev.frame >= 0 ? 0.5 : 0)); this.simRender(); }
    });
    p.addEventListener('keydown', e => e.stopPropagation()); // typing an address isn't a bench shortcut
  }

  /* ---------- tray ---------- */
  renderTray() {
    const icon = (k, c) => `<svg viewBox="0 0 34 28" aria-hidden="true"><path d="M3 22c6-16 18 6 22-10" fill="none" stroke="${c.color}" stroke-width="${Math.min(4, c.w)}" stroke-linecap="round"/><rect x="${k === 'serial' ? 22 : 23}" y="3" width="${k === 'serial' ? 11 : 8}" height="${k === 'fiber' ? 7 : 9}" rx="1.4" fill="${['straight', 'cross', 'console'].includes(k) ? 'rgba(214,226,240,.55)' : k === 'fiber' ? c.color : 'oklch(35% 0.01 260)'}"/></svg>`;
    // one section per kind of cable: Copper, Fiber, Console, Serial
    const groups = new Map();
    for (const [k, c] of Object.entries(CABLES)) { const g = c.group || 'Other'; if (!groups.has(g)) groups.set(g, []); groups.get(g).push([k, c]); }
    this.$('.tray').innerHTML = [...groups].map(([g, cs]) => `<div class="tgrp" role="group" aria-label="${esc(g)}"><span class="tg">${esc(g)}</span><div>${cs.map(([k, c]) => `<button class="cable" type="button" data-cable="${k}" aria-pressed="${k === this.armed}" title="${esc(c.name)}: ${esc(c.hint)}">${icon(k, c)}<b>${esc(c.short || c.name)}</b></button>`).join('')}</div></div>`).join('<span class="tsep"></span>');
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
      else if (CABLES[c.type].fiber && !this.net.ifStatus(c.a.dev, pa.iface)[0].startsWith('up') && [[da, c.a], [db, c.b]].some(([d, e]) => (SFPS[d.sfp[e.port]] || {}).fiber !== CABLES[c.type].fiber)) this.toast(`No link: ${CABLES[c.type].name.toLowerCase()} needs a ${CABLES[c.type].fiber === 'mmf' ? '1000BASE-SX' : '1000BASE-LX/LH'} transceiver at both ends.`);
      else if (CABLES[c.type].console) this.toast(`Console cable in. Double-click ${da.kind === 'pc' ? db.hostname : da.hostname} to open its console from ${da.kind === 'pc' ? da.id : db.id}.`);
      else if (c.type === 'serial') this.toast(`${this.net.device(c.dce.dev).hostname} has the DCE end. It needs a clock rate before the line protocol comes up.`);
      else if ([[da, pa], [db, pb]].some(([d, p]) => d.kind === 'switch' && p.type === 'eth' && !d.ifs[p.iface].portfast)) setTimeout(() => this.toast('Amber on the switch port: spanning tree listens for 15 seconds, then learns for 15, before it forwards.'), 900);
    }
    return true;
  }
  reject(type, end, why) {
    const p = this.net.portOf(end); if (!p) return;
    const names = { eth: 'an Ethernet (RJ45) port', sfp: 'an SFP transceiver', serial: 'a smart serial port', con: 'an RJ45 CONSOLE port', com: "a PC's COM1 port", usb: "a computer's USB port", usbcon: 'a USB mini-B console port' };
    if (why === 'nosfp') return this.toast('That SFP cage is empty. Right-click it to insert a transceiver first.');
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
      else if (t === 'sim') this.simToggle();
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
      if (this.net.device(this.open).dhcp) return;
      try { this.net.setPC(this.open, { ip: f.get('ip').trim(), mask: f.get('mask').trim(), gateway: f.get('gw').trim() }); this.toast(`${this.open} now has ${f.get('ip').trim() || 'no address'}.`); } catch (err) { this.toast(err.message); }
      this.fillPC(this.net.device(this.open));
    });
    this.$('.pcset').addEventListener('click', e => {
      const m = e.target.closest('[data-ipm]'), w = e.target.closest('[data-wifi]'), d = this.open && this.net.device(this.open);
      if (!d) return;
      if (m && m.dataset.ipm === 'dhcp') { const r = this.net.setPC(d.id, { dhcp: true }); this.toast(r && r.ip ? `${d.hostname} got ${r.ip} from ${r.server.hostname}${r.relay ? ` (relayed by ${r.via.hostname})` : ''}.` : r && r.full ? `The DHCP pool ${r.full} on ${r.server.hostname} has no free address.` : `No DHCP server answered. ${d.hostname} gave itself ${this.net.device(d.id).ip}, a link-local address.`); }
      else if (m) { d.dhcp = false; d.apipa = false; this.changed(); }
      else if (w) {
        const form = this.$('.pcset');
        try { const ap = this.net.setWifi(d.id, { ssid: form.ssid.value, key: form.key.value }); this.toast(d.kind === 'ap' ? `${d.hostname} broadcasts "${form.ssid.value.trim()}".` : ap ? `${d.hostname} joined ${ap.hostname}.` : `No access point broadcasts "${form.ssid.value.trim()}" with that key.`); } catch (err) { this.toast(err.message); }
      }
      if (m || w) this.fillPC(this.net.device(d.id));
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
    if (p.type === 'usb' || p.type === 'usbcon') return `<h3>${p.type === 'usbcon' ? 'USB console port' : 'USB port'}<i>${p.type === 'usbcon' ? 'mini-B' : 'type A'}</i></h3><dl><dt>Cable</dt><dd>${lk ? (lk.o ? 'USB console to ' + esc(net.device(lk.o.dev).hostname) : 'one end free') : 'nothing plugged in'}</dd></dl><p>${p.type === 'usbcon' ? 'A USB cable from a computer reaches the command line here, like the RJ45 console.' : 'Plug the computer end of a USB console cable here.'}</p>`;
    if (p.type === 'con' || p.type === 'com') return `<h3>${p.type === 'con' ? 'Console port' : 'COM1 serial port'}<i>${p.type === 'con' ? 'RJ45' : 'DB-9'}</i></h3><dl><dt>Cable</dt><dd>${lk ? (lk.o ? 'console to ' + esc(net.device(lk.o.dev).hostname) : 'console, one end free') : 'nothing plugged in'}</dd></dl><p>${p.type === 'con' ? 'A rollover console cable from a PC reaches the command line before the device has any address.' : 'Plug the PC end of a console cable here.'}</p>`;
    const rows = [], st = net.stpState(d.id, p.iface);
    let led = 'off', txt = 'Off: no link';
    if (!d.power) txt = 'Off: the device is powered off';
    else if (f.phys && f.medium === p.type) { if (d.kind === 'switch' && st !== 'forwarding') { led = 'amber'; txt = `Amber: spanning tree is ${st} (${Math.max(0, Math.ceil((30000 - (net.clock - f.upSince)) / 1000))} s to forwarding)`; } else { led = 'green'; txt = 'Green: link up, forwarding'; } }
    else if (f.shutdown) txt = 'Off: administratively down';
    else if (lk && lk.o && f.medium && f.medium !== p.type) txt = 'Off: the SFP side of this combo port is in use';
    rows.push(['Light', `<span class="dot ${led}"></span>${txt}`]);
    if (p.type === 'sfp') rows.push(['Transceiver', d.sfp[p.key] ? `${d.sfp[p.key]}, ${SFPS[d.sfp[p.key]].name} (${SFPS[d.sfp[p.key]].about})` : 'none: the cage is empty']);
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
    const tip = d.kind === 'hub' ? 'A hub repeats every frame out of every other port. It has no console and nothing to configure.' : d.kind === 'pc' ? 'Double-click for its command prompt and network settings.' : via ? `Double-click to open the console from ${via}.` : 'Needs a console cable from a PC before you can type into it.';
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
      if (p.type === 'sfp') {
        const t = d.sfp[p.key];
        if (t) items.push({ label: `Remove the ${t}`, k: c ? 'unplug first' : '', off: !!c, run: () => this.swap(d, () => net.removeSfp(d.id, p.key)) });
        else for (const [id, x] of Object.entries(SFPS)) items.push({ label: `Insert a ${id}`, k: x.name, run: () => this.swap(d, () => net.insertSfp(d.id, p.key, id), `${id} in. ${x.about[0].toUpperCase() + x.about.slice(1)}.`) });
      }
      if (f && d.kind !== 'pc' && d.kind !== 'hub') {
        items.push({ label: f.shutdown ? 'Bring up (no shutdown)' : 'Shut down', run: () => { this.silent(d, ['interface ' + p.iface, f.shutdown ? 'no shutdown' : 'shutdown']); } });
        items.push({ label: `show interfaces ${short(p.iface)}`, off: !net.consoleFrom(d.id), run: () => { this.openConsole(d.id); this.priv(d.id, `show interfaces ${short(p.iface)}`); } });
      }
      return this.showMenu(e, items);
    }
    if (this.hover.cable) { const c = this.hover.cable; return this.showMenu(e, [{ h: CABLES[c.type].name }, { label: 'Unplug both ends', run: () => net.remove(c) }]); }
    const slotEl = t.closest && t.closest('.slot');
    if (slotEl) {
      const d = net.device(slotEl.dataset.dev), s = d.m.slots.find(x => x.id === slotEl.dataset.slot), mod = d.modules[s.id];
      const items = [{ h: `${d.hostname} ${s.name}` }];
      if (mod) items.push({ label: `Remove the ${mod}`, k: d.power ? 'switch it off first' : '', off: d.power, run: () => this.swap(d, () => net.removeModule(d.id, s.id)) });
      else for (const m of s.takes) items.push({ label: `Insert a ${m}`, k: d.power ? 'switch it off first' : MODULES[m].about, off: d.power, run: () => this.swap(d, () => net.insertModule(d.id, s.id, m), `${m} in. Switch ${d.hostname} on: its new ports come up with it.`) });
      if (d.power) items.push('-', { label: `Power ${d.hostname} off`, run: () => this.pressButton(d.id, 'power') });
      return this.showMenu(e, items);
    }
    if (devEl) {
      const d = net.device(devEl.dataset.dev), via = net.consoleFrom(d.id);
      if (d.kind === 'hub') {
        const items = [{ h: d.hostname }, { label: d.power ? 'Power off' : 'Power on', run: () => this.pressButton(d.id, 'power') }];
        if (this.building) items.push('-', { label: 'Rename…', run: () => this.askName(e, d) }, { label: 'Delete', k: 'and its cables', run: () => this.deleteDev(d) });
        return this.showMenu(e, items);
      }
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
  // A card or transceiver went in or out: the faceplate changes with it.
  swap(d, fn, said) { try { fn(); } catch (err) { return this.toast(err.message); } this.redraw(d); this.click(); if (said) this.toast(said); }
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
    if (this.net.device(id).kind === 'hub') return this.toast('A hub has no console. It only repeats bits, so there is nothing to configure.');
    const d = this.net.device(id), via = d.kind === 'pc' || d.kind === 'ap' ? id : this.net.consoleFrom(id) || (this.building && 'the builder');
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
    const d = this.open && this.net.device(this.open), ap = d && d.kind === 'ap', pc = d && (d.kind === 'pc' || ap);
    this.$('.vtext').textContent = !d ? '' : ap ? `${d.hostname} · settings` : pc ? `${d.id} · Command Prompt` : this.net.consoleFrom(d.id) ? `${d.hostname} · console from ${this.net.consoleFrom(d.id)}, 9600 baud` : this.building ? `${d.hostname} · building, so no console cable needed` : `${d.hostname} · console`;
    const form = this.$('.pcset'); form.hidden = !pc;
    if (pc) this.fillPC(d);
  }
  // An end device's address (typed, or from DHCP) and, for Wi-Fi and access points, the network it uses.
  fillPC(d) {
    const form = this.$('.pcset'), wifi = d.kind === 'ap' || d.m.ports.some(p => p.type === 'radio');
    form.querySelectorAll('[data-ipm]').forEach(b => b.setAttribute('aria-checked', String((b.dataset.ipm === 'dhcp') === !!d.dhcp)));
    form.ip.value = d.ip || ''; form.mask.value = d.mask || ''; form.gw.value = d.pcgw || '';
    for (const k of ['ip', 'mask', 'gw']) form[k].readOnly = !!d.dhcp;
    form.querySelector('.ipst').textContent = d.dhcp ? (d.apipa ? 'No DHCP server answered: it gave itself a 169.254 address.' : d.ip ? `From DHCP${d.dns ? `, DNS ${d.dns}` : ''}` : 'Asking for an address…') : '';
    form.querySelector('.wifi').hidden = !wifi;
    if (wifi) {
      form.querySelector('.wl').textContent = d.kind === 'ap' ? 'SSID to broadcast' : 'Wi-Fi network (SSID)';
      if (document.activeElement !== this && !this.shadowRoot.activeElement?.closest('.wifi')) { form.ssid.value = (d.wifi || {}).ssid || ''; form.key.value = (d.wifi || {}).key || ''; }
      form.querySelector('[data-wifi]').textContent = d.kind === 'ap' ? 'Save' : 'Connect';
      const ap = d.kind === 'ap' ? null : this.net.apFor(d.id);
      form.querySelector('.wst').textContent = d.kind === 'ap' ? ((d.wifi || {}).ssid ? `Broadcasting "${d.wifi.ssid}"${d.wifi.key ? ', WPA2' : ', open'}. Clients join with the same SSID and key.` : 'Not broadcasting: give it an SSID.') : ap ? `Connected to ${ap.hostname} ("${d.wifi.ssid}").` : (d.wifi || {}).ssid ? `No access point broadcasts "${d.wifi.ssid}" with that key.` : 'Not connected.';
    }
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
