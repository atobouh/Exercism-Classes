# Interaction research: a network-lab canvas that feels like plugging in cables

Legend: [S] = backed by a fetched/searched source (linked). [K] = from background knowledge of the product, not re-verified in this pass. [P] = our proposal / suggested number to tune.

## 1. Modular-synth patching (the feel reference)

**VCV Rack** [K unless noted]
- Drag from a jack: the plug lifts out of the jack and follows the cursor; dropping on empty space discards it. Dragging from an already-occupied jack picks up the existing cable end (re-patch), so a cable is an object you move, not a "connection" you edit in a dialog.
- Each cable is drawn as a sagging curve between plug heads, with a soft drop shadow. Sag is a cheap bezier/quadratic with a control point pushed down proportional to distance, not a full physics sim. Cable ends are round plug heads with a coloured collar.
- Menu-bar settings: **Cable opacity** and **Cable tension**, both sliders, double-click resets to 50% [S: https://vcvrack.com/manual/MenuBar]. Tension = relative cable length (slack). Third-party module can drive tension/opacity 0-10V -> 0-1 [S: https://github.com/FrankBuss/FrankBussRackPlugin/blob/master/docs/shaker.md].
- Colours: each new cable cycles through a palette of ~6 hues; right-click a cable to change colour. Community uses colour key modules to encode meaning (audio vs CV) [S: https://community.vcvrack.com/t/cable-colour-key-module/16419?page=6].
- Hover dimming idea: users keep global opacity ~50% so overlapping cables sit at ~25%, hovering a module raises its cables to 50%, hovering a port raises that port's cables to 100% [S: same thread]. This is the single most useful trick for stacked cables.
- Stacking: multiple cables can share one jack (outputs fan out); plugs stack visually. Right-click a port: delete/clone cables, shows all connected cables. Shift-drag clones a cable from an output [K].
- Faceplates: real-hardware skeuomorphism (panel texture, silkscreen labels, knob shading, LEDs) is what makes jacks readable as "holes you plug into" and makes the area around a port feel finite and tactile.
- Changelog (not fetchable here, git.kx.studio blocked by proxy): https://git.kx.studio/VCVRack/Rack/raw/branch/v2/CHANGELOG.md

**Reason rack back-panel** [K]: press Tab to flip the rack; cables hang from rear jacks, auto-routed as sagging cords, with label "From/To" tooltips. Key idea: a deliberate "back view" mode where the wiring is the content. Maps well to a "patch panel / rear view" for a switch.

**Others** [K]: Bitwig Grid uses clean bezier wires with port-type colours (no physics). Cables.gl and Audulus use bezier splines with hover highlight; Audulus is touch-first with big ports. Max/MSP uses straight orthogonal-ish patch cords, famously functional but not tactile. Search found no primary-source rendering details for these.
- Useful article on the technique: https://medium.freecodecamp.org/patch-cord-design-how-to-give-your-gui-an-analog-look-d26a68f8e97b [S: surfaced in search; not fetched].
- Nord Modular lesson [S: https://ccrma.stanford.edu/mirrors/lalists/lau/2003/01/0329.html]: good cable drawing, consistent sockets, colour hints make patching simple.
- Clutter lesson [S: https://brainmodular.com/forums/viewtopic.php?p=38094]: always-visible hanging wires obstruct UI; offer "show wires when needed".

## 2. Network simulators

**Cisco Packet Tracer** [S: https://tutorials.ptnetacad.net/help/default/workspace_logical.htm, https://contenthub.netacad.com/legacy/I2PT/1.1/en/course/files/4.1.1.1%20Video%20-%20Introduction%20to%20Physical%20View.pdf]
- Two workspaces: Logical (default, topology diagram) and Physical (Intercity > city > building > wiring closet > rack). Physical view is about location and cabling; they are separately authored (floor plan added only in logical does not appear in physical, user report: https://community.cisco.com/t5/network-management/seeking-help-cisco-packet-tracer-network-design/m-p/4847261/highlight/true).
- Cable palette (lightning icon): choose cable type, click device, pick interface from a menu, click other device, pick interface. Ctrl-click a cable type locks the tool for repeated connections. "Automatically choose connection type" exists as the lightning-bolt option [K].
- Link lights on each end: green when up, amber while negotiating, red = down; click the link light to unplug [S: netacad lab doc]. This is its best tactile idea.
- Weaknesses [K/inferred]: interface picked from a text menu rather than by dropping onto a visible port; devices are generic icons so ports are invisible at the topology level; physical view is a separate, mostly decorative mode that doesn't drive logic; small, dated skin; cable ends are not objects you can grab.

**GNS3 / EVE-NG / containerlab / CML** [S: https://www.netpilot.io/blog/gns3-vs-eve-ng-vs-containerlab-2026, https://community.cisco.com/t5/cisco-modeling-labs-discussions/feature-request-custom-shapes-images-text-selecting-multiple/td-p/4656976]
- Icon + line graphs; links are straight lines between node centres; port is chosen from a popup on link creation; interface names appear as tiny text labels near ends. This is why they read as whiteboards: the node is a pictogram, ports have no physical location, links are 1px lines with no weight/slack, no state beyond a coloured dot.
- containerlab is CLI/YAML only, no native GUI (same netpilot source). CML lacks multi-select and annotations (Cisco forum).
- Takeaway: they model topology, not physicality. Our differentiator is port-level, cable-level objects with visible state.

## 3. Cable rendering on the web

- **Catenary** y = a*cosh(x/a); parabola is a fine approximation when sag is small vs span [S: https://leancrew.com/all-this/2022/03/catenaries-parabolas-and-ropes/, https://www.alanzucconi.com/2020/12/13/catenary-1]. Library that approximates catenary as quadratic curve segments for canvas: https://github.com/dulnan/catenary-curve [S].
- **Verlet rope**: nodes + distance constraints, ~10-30 segments, 3-8 constraint iterations per frame, damping 0.98-0.995 [P]. Demo: https://github.com/guerrillacontra/html5-es6-physics-rope [S]. Verlet makes cables swing when a device is dragged: the single biggest "physical" cue, but costs CPU per cable.
- **Cheap bezier sag** [P]: endpoints A,B; d=|AB|; control points = lerp positions with y += min(d*0.25, 120) * tension; as d approaches the cable length the sag goes to 0. Add a short exit stub from each plug (20-30px along the port's outward normal) before sagging so cables leave ports perpendicular to the faceplate.
- **Hybrid** (recommended) [P]: bezier at rest, run a 2-3 spring-point verlet only for the cable(s) being dragged or recently disturbed, then settle back to static bezier. Performance stays flat at hundreds of cables.
- **Layers**: draw a blurred offset shadow path (stroke #000 at 25%, blur 4-6px, offset 2-4px), then body stroke (6-8px) with a lighter 2px highlight stroke offset up-left, and plug heads (rounded rect 14x20 with latch notch for RJ45; LC for fibre) as the endpoints. The 3-stroke trick sells "rubber-jacketed cable" cheaply.
- **SVG vs canvas** [P]: SVG paths + CSS are fine to ~300 cables and give free hit-testing/hover/aria; use canvas (or SVG for ports and canvas for cables) beyond that. Batch strokes by colour; skip shadow blur when zoomed out; cull off-screen.
- Libraries: react-flow edges are SVG paths with custom edge components (bezier by default), easy to subclass for sag; tldraw arrows are bezier with bind-to-shape snapping. Both provide connect-handle hit areas worth copying; neither has physical sag [K].

## 4. Detail on demand

- **Semantic zoom** = change shape/detail/presence, not just scale [S: https://gwern.net/doc/www/infovis-wiki.net/10a85452434021cdd5dd5076dfcb2888439ecb31.html]. Microsoft guidance: keep layout and panning consistent across zoom levels [S: https://learn.microsoft.com/en-au/windows/apps/develop/ui/controls/semantic-zoom]. React Flow example swaps full node vs placeholder from zoom [S: https://v9.reactflow.dev/examples/contextual-zoom-features].
- Proposed LOD bands [P]: <0.4 icon + hostname + link-state dot; 0.4-0.9 chassis silhouette with port count and LEDs, cables as thin lines; >0.9 full faceplate with every port, labels, plugs, cable sag. Cross-fade over ~150 ms around thresholds with hysteresis (+/-0.05) to avoid flicker. Positions never move between levels.
- **Factorio alt-mode**: overlay icons for recipes/contents shown on demand; community mods limit it to the entity under the cursor/radius to reduce clutter [S: https://mods.factorio.com/mod/hover-alt-mode, https://mods.factorio.com/mod/alt-alt-mode]. Copy: hold-Alt to reveal port labels/VLANs/IPs everywhere; hover shows them for one device.
- **UniFi topology**: hover shows name/status/IP; known complaints are wrong root and glitchy multi-path layouts [S: https://unifinerds.com/unifi-topology-page-how-to-read-use-and-troubleshoot-your-network-map/, https://forums.lawrencesystems.com/t/annoying-unifi-topology-map/19199]. Copy hover cards; avoid auto-layout surprising users (let users place devices).
- **Mini Metro / Motorways, Figma, Apple** [K]: flat low-saturation canvas with a single saturated accent per meaning; animation and detail appear only for what the player touches; Figma shows dimensions/handles only on selection and uses a context-sensitive right panel. Apple: restraint, springs, material depth for overlays.
- Hover card ~300-400 ms delay in, instant out; right-click menu is per-object (port: connect, show config, disable; cable: recolour, label, replace type, unplug; device: console, power, rename); inspector panel docks right and follows selection.

## 5. Tactile feedback

- **Snap**: while dragging a plug, find ports within ~24-32px; compatible ones glow/scale 1.1 (magnetic pull: plug position lerps 30-60% toward the port centre inside the radius); incompatible ones dim and show a reason tooltip. On release, spring to seat (stiffness ~400, damping ~28, ~120-180ms) with a 1-2px overshoot push-in [P]. Apple snap behavior exposes damping for exactly this [S: https://developer.apple.com/documentation/uikit/uisnapbehavior.md].
- **Sound** (optional, off by default or very quiet) [P]: Web Audio, decode a 30-60 ms "click" once, `resume()` the context on first pointer gesture, trigger at seat time (spring crossing target), vary gain/pitch slightly with impact speed, release click ~50% gain (Apple pairs click audio with haptic and lowers the release click, 2.8 ms offset [S: https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10620708]). Rate-limit. Respect mute and reduced motion.
- **Haptics**: `navigator.vibrate(8-12)` on seat on Android only; iOS Safari lacks it [K].
- **LED link lights**: amber blink = link negotiating/STP listening-learning, solid green = forwarding, off = no link, red = err-disabled. Packet Tracer already does link lights (green when correct cable) [S: netacad lab doc]. STP 802.1D timeline: blocking/listening 15s, learning 15s (shorten in sim, ~2-4s, with a visible countdown). Activity LED flickers on traffic.
- **Cursor**: grab on plug, grabbing while dragging, crosshair/plug cursor on port in connect mode, not-allowed on incompatible ports.
- **Wrong cable feedback**: the plug refuses to seat (bounces back 4px) rather than showing a modal error.

## Top 15 design moves to copy

1. Cables are first-class draggable objects with plug heads; grab an occupied port's plug to re-patch (VCV).
2. Ports are physical holes on faceplates at fixed positions; connect by dropping on a port, never via an interface popup (fixes Packet Tracer).
3. Cables exit perpendicular to the faceplate with a short stub, then sag.
4. Sag = bezier proportional to distance and a user "slack" setting; zero sag when taut (VCV tension slider, double-click resets).
5. Three-stroke cable look: soft shadow, jacket body, thin highlight; plug shape per media type.
6. Hybrid physics: static bezier at rest, brief verlet wobble only on disturbed cables.
7. Global cable opacity ~50%; hover device raises its cables, hover port raises exactly those to 100% (VCV community pattern).
8. Cable colour encodes type/purpose (cycled palette, user-recolourable); fixed legend.
9. Magnetic snap radius ~24-32px with glow on compatible ports and dimming of incompatible ones; spring-seat with slight overshoot.
10. Link LEDs on both ends: off / amber (negotiating, STP) / green / red; activity flicker. Clicking the LED area unplugs (Packet Tracer).
11. Semantic zoom with three bands (icon, silhouette, full faceplate), hysteresis, and no layout movement between bands.
12. Alt/hold-to-reveal labels globally; hover card for one device (Factorio alt-mode, UniFi hover).
13. Per-object right-click menus plus a docked inspector that follows selection (Figma).
14. Calm canvas: low-saturation neutral background, colour reserved for state and cables (Mini Metro restraint); no auto-layout rearrangement.
15. Optional micro-click sound + short vibration at seat time; rejection = plug bounces back; cursor states grab/grabbing/not-allowed.

## Gaps
Proxy blocked git.kx.studio (VCV changelog); Bitwig/Cables.gl/Audulus/Max rendering specifics, Mini Metro, Figma and Apple items are from background knowledge. The numeric tunables marked [P] are starting points to test, not sourced values.
