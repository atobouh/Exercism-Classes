# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Rust core with a desktop shell (Tauri), chosen by the user for speed ("Rust, no lag fast"). The UI is rendered in a webview, so it is recorded as web. The current artifact is a static HTML prototype (`docs/octet/index.html`).

## Users

One self-taught learner preparing for CCNA 1 to 3 (Cisco NetAcad ITN, SRWE, ENSA) and the 200-301 exam. Wants real skills, not only the certificate. Uses a Windows desktop for sessions of 30 to 60 minutes, by day or in the evening.

## Product Purpose

A personal, offline CCNA desk. Each session teaches one concept on a live simulated network, practises what is fading through spaced review, and ends on a lab fixed in a real IOS-style console. Success means the learner can configure and troubleshoot what the exam covers, and well past it.

## Positioning

A private, local tool built around one learner's whole course map, with its own built-in network simulator, not limited to exam scope. Progress is drawn in the T568B colour code the learner already uses on real cables.

## Operating Context

- Courses: ITN (17 modules), SRWE (16), ENSA (14), plus a "Beyond" track (OSPFv3, multi-area OSPF, EIGRP, eBGP basics, real IOS images).
- Sessions follow Learn, Practice, Lab. Review uses four grades (Again, Hard, Good, Easy).
- Labs run on a built-in simulator. A GNS3 bridge for real appliances is a later phase, through the GNS3 REST API behind a device abstraction.
- Exercise forge: per-level exercises drafted through ChatGPT, Claude, DeepSeek, any API key, or a copy-paste prompt, in two modes: this level only, or cumulative.

## Capabilities and Constraints

- Offline and local. Data stays on this computer.
- 17-level roadmap with one example exercise per level, written by Claude.
- IOS console with abbreviations (`conf t`, `int g0/0/1.20`, `sh run`), command modes, `?` help and IOS-style errors.
- Undecided: how GNS3 images are sourced (the user does not yet know which images are installed).

## Brand Commitments

- Name: Octet.
- The bar is the user's own apps, Telva and Notic: every detail intentional, premium across the whole experience, like software from a small boutique company.
- Red lines, stated by the user: nothing gamified, not too much reading, no busy screens.
- Light and dark get equal care. The scene varies.

## Evidence on Hand

- Real NetAcad module titles for ITN, SRWE and ENSA (v7).
- No user progress data exists. Every progress figure in the prototype is sample data and is labelled as such.
- No testimonials, metrics or third-party claims. Don't invent any.

## Product Principles

1. Touch before text: two short paragraphs, then something to click, strip, send or fix.
2. One job per screen, at most three areas.
3. Progress is honest: wires fade back to striped when recall drops, and there are no points or streaks.
4. Real IOS behaviour wherever a device speaks.
5. Fast and offline first. Nothing waits on a network.

## Accessibility & Inclusion

Keyboard-first: Ctrl K search, Enter to start, Space to show an answer, 1 to 4 to grade, Ctrl Enter to run checks. Text contrast at least 4.5:1 in both themes, and reduced motion respected.
