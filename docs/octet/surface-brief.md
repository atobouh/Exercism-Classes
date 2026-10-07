# Octet surface brief: desktop app shell and core screens

Scope: the Octet desktop app (Today, Course, Lesson, Lab, Review, command bar). Mode: Operate.
Audience: one self-taught learner preparing CCNA 1 to 3 (ITN, SRWE, ENSA) on a Windows desktop, sessions of 30 to 60 minutes, day or evening.
Job: start tonight's session in one click; learn a concept on a live network; fix a lab; review what is fading.
Constraints: both themes with equal care; no gamification (no XP, mascots, confetti, streak guilt); little reading per step; calm, uncluttered screens.

## Direction contract

THESIS: Progress, networks and state are all drawn as wires, using the colour codes network engineers already know. Refuses the category default of a dark neon "cyber" dashboard or a gamified course path.

OWN-WORLD: Cat6 jacket blue owns the shell rail. Course colours are the four T568B pairs: ITN orange, SRWE green, ENSA blue, Beyond brown. A white wire with a thin coloured stripe means learning (built as a lengthwise stripe, not a helix: diagonal bars read too close to the user's own app Telva, and real T568B white conductors also ship with lengthwise stripes); a solid wire means mastered; a hollow wire means not started. Logo is an RJ45 pinout of eight conductors. Funnel Display for screen titles and numerals, Funnel Sans for everything else, Azeret Mono only for IOS text and addresses.

STORY: the learner opens the app, sees one ready session and the state of their cable, starts, reads a short step, strips a cable to see VLANs inside it, fixes the lab in a real console, and watches the cut wire close.

FIRST VIEWPORT: jacket-blue rail left with the pinout mark and four nav items. Main area: date line, the title "Your session is ready", a three-step patch-cord row (Learn, Practice, Lab) with durations, one primary button. Below, the four course wires full width with module segments.

FORM: own-world, direction 1 of 3 (Octet, chosen by the user over Rack and RFC). Seed: user-selected, no roll.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Signature interaction: click any cable to strip its jacket and see the VLAN conductors inside (one conductor on an access link, several on a trunk). A failed check shows as a cut conductor that closes when fixed.

## Finish record

- Finish review: run in-thread. The harness had no reviewer subagent, so the build thread stepped out and ran `reference/degraded/finish-reviewer.md` itself, against captures in `.impeccable/review/` (desktop 1440 light, mobile 390 dark).
- Review disposition: fix. There were eight material findings: the rail drifted to navy, labels sat above titles, mono leaked outside IOS text, window controls were drawn, small text and green text failed contrast, the notes section was broken, the weekday was hardcoded, and there were missing hover states, default scrollbars and a glow halo.
- Verdict after fixes: seven of eight resolved. One remains open: FORM has no concept-roll seed key, because the Impeccable launcher was never run and the user picked the direction directly. That gap is in the process, not on screen. It cannot be honestly corroborated after the fact.
- Recomputed disposition: fix (open item: seed key only).
- Rasters: none ship. Every visual is CSS or inline SVG authored in `index.html`, so there is no raster provenance to carry.
- DESIGN.md and PRODUCT.md written after the review, from the shipped build.
