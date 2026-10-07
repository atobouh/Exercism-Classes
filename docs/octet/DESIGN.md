---
name: Octet
description: A personal, offline CCNA desk where progress, networks and state are drawn as wires in the T568B colour code.
colors:
  jacket: "oklch(46% 0.115 248)"
  jacket-deep: "oklch(30% 0.075 248)"
  jacket-selected: "oklch(53% 0.12 248)"
  pair-orange: "oklch(69% 0.16 52)"
  pair-green: "oklch(60% 0.14 148)"
  pair-blue: "oklch(54% 0.14 255)"
  pair-brown: "oklch(47% 0.07 50)"
  conductor-white: "oklch(98.5% 0.003 250)"
  cut: "oklch(57% 0.19 27)"
  green-ink: "oklch(50% 0.13 148)"
  day-ground: "oklch(97.2% 0.004 250)"
  day-sheet: "oklch(99.5% 0.002 250)"
  day-sunk: "oklch(95% 0.006 250)"
  day-ink: "oklch(25% 0.02 255)"
  day-ink-2: "oklch(44% 0.018 255)"
  day-ink-3: "oklch(53% 0.016 255)"
  day-line: "oklch(90.5% 0.008 250)"
  day-line-2: "oklch(83% 0.012 250)"
  night-ground: "oklch(18.5% 0.018 252)"
  night-sheet: "oklch(22.5% 0.02 252)"
  night-sunk: "oklch(16.5% 0.017 252)"
  night-ink: "oklch(94% 0.008 250)"
  night-ink-2: "oklch(74% 0.02 250)"
  night-ink-3: "oklch(63% 0.02 250)"
  night-primary: "oklch(72% 0.11 250)"
  console-ground: "oklch(22% 0.02 255)"
  console-ink: "oklch(90% 0.01 250)"
typography:
  display:
    fontFamily: "Funnel Display, Segoe UI Variable Display, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Funnel Display, Segoe UI Variable Display, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  question:
    fontFamily: "Funnel Display, Segoe UI Variable Display, system-ui, sans-serif"
    fontSize: "25px"
    fontWeight: 500
    lineHeight: 1.32
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Funnel Sans, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Funnel Sans, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  reading:
    fontFamily: "Funnel Sans, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.62
  label:
    fontFamily: "Funnel Sans, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
  ios:
    fontFamily: "Azeret Mono, Cascadia Mono, Consolas, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  wire: "2px"
  wire-end: "5px"
  key: "4px"
  control: "8px"
  button: "9px"
  panel: "12px"
  window: "14px"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  page: "72px"
components:
  button-primary:
    backgroundColor: "{colors.jacket}"
    textColor: "{colors.conductor-white}"
    rounded: "{rounded.button}"
    padding: "10px 16px"
  button-primary-dark:
    backgroundColor: "{colors.night-primary}"
    textColor: "{colors.night-ground}"
    rounded: "{rounded.button}"
    padding: "10px 16px"
  button-line:
    backgroundColor: "{colors.day-sheet}"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.button}"
    padding: "10px 16px"
  nav-item:
    textColor: "{colors.conductor-white}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  nav-item-current:
    backgroundColor: "{colors.jacket-selected}"
    textColor: "{colors.conductor-white}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  console:
    backgroundColor: "{colors.console-ground}"
    textColor: "{colors.console-ink}"
    typography: "{typography.ios}"
---

# Design System: Octet

## Overview

**Creative North Star: "The Colour Code"**

Octet takes one thing from networking and uses it everywhere: the colour code on the eight conductors inside every Ethernet cable. Course progress, network links, session steps and failed checks are all drawn as wires, in colours a network engineer already reads without thinking. Everything else is a quiet, standard desktop app. Navigation sits on the left, the work sits in the middle, and controls behave the way good desktop software behaves.

The shell rail is Cat6 jacket blue, the colour of the patch cables in every lab. In the dark theme it deepens instead of disappearing. Screens are calm: one job per screen, at most three areas, two short paragraphs before something to touch. There is no gamification: no points, no streaks, no mascots, no confetti.

Light and dark are equal citizens. The theme follows the system until the learner chooses one.

**Key Characteristics:**
- Progress drawn as wires: solid means mastered, white with a coloured stripe means learning or fading, hollow means not started.
- The four T568B pairs name the four tracks: orange for CCNA 1, green for CCNA 2, blue for CCNA 3, brown for Beyond.
- One signature interaction: click a cable to strip its jacket and see the VLAN conductors inside. A failed check shows as a cut conductor that closes when fixed.
- No label ever sits above a title.

## Colors

The palette is a cable cross-section: one blue jacket around four coloured pairs and their white partners, on cool, slightly blue-tinted neutrals.

### Primary
- **Cat6 Jacket Blue** (`jacket`): the shell rail, the primary button, the session cord on Today, and the cable jackets in lesson and lab drawings. It is one material wherever it appears, so the shell literally is the cable.
- **Deep Jacket** (`jacket-deep`): the rail in the dark theme.
- **Selected Jacket** (`jacket-selected`): the current nav item and the pressed theme toggle on the rail.

### Secondary
- **Pair Orange** (`pair-orange`): CCNA 1, Introduction to Networks. Also the 802.1Q tag in the lesson animation.
- **Pair Green** (`pair-green`): CCNA 2, Switching, Routing and Wireless. Also passed checks. As text it uses **Green Ink** (`green-ink`) to hold 4.5:1.
- **Pair Blue** (`pair-blue`): CCNA 3, Enterprise Networking, Security and Automation. Also the focus ring.
- **Pair Brown** (`pair-brown`): Beyond, the material past the exam.
- **Conductor White** (`conductor-white`): the white half of each striped conductor, and text on the jacket.

### Tertiary
- **Cut Red** (`cut`): only for a broken link (the cut mark on a conductor) and wrong answers or console errors. Never decorative.

### Neutral
- **Day Ground / Sheet / Sunk** (`day-ground`, `day-sheet`, `day-sunk`): the page, raised surfaces (search, option buttons, grade buttons), and recessed wells (quick check, hint box).
- **Day Ink 1 to 3** (`day-ink`, `day-ink-2`, `day-ink-3`): titles and reading text, secondary text, and quiet labels. Ink 3 still clears 4.5:1 on the ground and on sunk wells.
- **Day Line 1 and 2** (`day-line`, `day-line-2`): hairline dividers, and outlines for controls and hollow wires.
- **Night set** (`night-*`): the same roles, tinted toward the jacket hue. Dark mode is never pure black.
- **Console** (`console-ground`, `console-ink`): the console stays dark in both themes, because devices print on dark terminals.

### Named Rules
**The One Material Rule.** Jacket blue is one material. The rail, the primary button, the session cord and every drawn cable jacket use the same blue, never a near-miss.

**The Pair Rule.** A pair colour always means its course. Orange is never used to mean warning, and green only means a pass because CCNA 2 owns green in the lab where it appears.

**The Cut Rule.** Red appears only where something is broken, and it disappears the moment the fix lands.

## Typography

**Display Font:** Funnel Display (with Segoe UI Variable Display, system-ui)
**Body Font:** Funnel Sans (with Segoe UI Variable Text, system-ui)
**Label/Mono Font:** Azeret Mono (with Cascadia Mono, Consolas), for IOS text only

**Character:** Funnel Display and Funnel Sans are one family split into two voices: a slightly flared display cut for titles and numerals, and a calm text cut for everything you read and click. Azeret Mono appears only where a device prints text.

### Hierarchy
- **Display** (500, 40px, 1.05): one per screen, such as "Your session is ready".
- **Headline** (500, 32px, 1.1): lesson titles. Lab titles use the same face at 24px.
- **Question** (500, 25px, 1.32): the review card prompt, set in display for presence while it is read.
- **Title** (600, 17px): plan steps and block titles. Course block titles use Funnel Display 600 at 18px.
- **Reading** (400, 15.5px, 1.62, max 60ch): lesson prose.
- **Body** (400, 14px, 1.5): the app default.
- **Label** (400 to 500, 12.5px): metadata, legends, counts. Numerals use tabular figures.
- **IOS** (Azeret Mono 400, 12.5px, 1.6): the console, port names, IP addresses, and command answers on review cards (18px, 500).

### Named Rules
**The Device Voice Rule.** Mono is the voice of a device. Configs, ports, addresses and console output are mono. Keycaps, module numbers, counts and UI labels never are.

**The No Kicker Rule.** No label sits above a title. Dates go in the title bar, context goes in a line under the title, and step progress goes in the footer.

**The Roman Rule.** Titles are never italic. Emphasis comes from weight.

## Layout

The app is a fixed desktop window: a 228px jacket-blue rail, then a main column with a 48px title bar. The title bar holds the date, or the session cord during a session, on the left, with search centred. Content screens use generous 40 to 72px insets with left-aligned text.

- **Today:** title and one-line summary, a three-step plan joined by a cord, one primary button, then the four course wires full width.
- **Lesson:** two panes. Reading on the left (500px), the live network figure on the right.
- **Review:** one centred 620px card.
- **Lab:** a header with check wires and Run checks, a task column (290px), a dotted canvas, and a 214px console docked under the canvas.

Spacing runs on a 2px sub-grid (2, 4, 6, 8, 10, 12, 16, 20, 24, 30, 40, 72), common in dense desktop UI. The presentation page scales the 1280 by 800 window to fit and never scrolls sideways. On phones it says plainly that Octet is a desktop app.

## Elevation & Depth

Octet is flat by default and layered by tone: ground, sheet (raised) and sunk (recessed). Shadows are reserved for things that float above the work.

### Shadow Vocabulary
- **Float** (`0 1px 2px` at 6% plus `0 8px 24px -12px` at 18%, in tinted ink): the search palette and the toast.
- **Window** (a 1px edge ring plus `0 40px 80px -40px`): only the app window on the presentation page.

### Named Rules
**The No Halo Rule.** Nothing glows. State is drawn with a ring, a fill or a wire, never a zero-offset coloured glow.

## Shapes

Wires are short rounded segments: 2px inner corners, with 5px caps at each end of the run, separated by 3px gaps, like conductors laid side by side. Controls use 8 to 9px corners, panels and devices 12px, and the window 14px. The RJ45 plug drawn on plan steps is a rounded body with four pins and a latch. The logo is an RJ45 pinout: eight vertical conductors in T568B order, striped and solid.

## Components

### Buttons
- **Shape:** gently rounded (9px).
- **Primary:** jacket blue with conductor-white text (night: light jacket with night-ground text), 10px by 16px, weight 600. A keycap inside shows the shortcut.
- **Hover / Focus / Active:** hover moves one step lighter. Focus shows a 2px pair-blue ring with a 2px offset, or conductor white on the rail. Active scales to 0.97 over 160ms with a strong ease-out.
- **Line:** a sheet fill with a 1px line-2 inset ring that darkens to ink 3 on hover.
- **Quiet:** text only, with a sunk fill on hover.
- **Link:** jacket-blue text that underlines on hover with a 3px offset.
- **Disabled:** 45% opacity plus a not-allowed cursor.

### The Wire (signature)
- **Segments:** one per module, flexing to fill the row. 10 to 12px tall on Today, 8px in the course view, 6px in the lesson stepper.
- **States:** solid pair colour (mastered). Conductor white with a lengthwise pair-colour stripe across the middle 40% (learning, or fading back from mastered). Transparent with a 1.25px line-2 ring (not started).
- **Tooltips:** course, module and state. The first tooltip waits 450ms, and later ones show instantly.

### Cables and the strip interaction (signature)
- **Jacket:** a 12px jacket-blue stroke with round caps, thickening to 14px on hover.
- **Strip:** clicking animates the jacket's stroke-dashoffset away over 280ms with ease-out, revealing 4px conductors (one per VLAN, offset by 3.5px on trunks) and their labels.
- **Cut:** a cut-red ring with a cross, plus a short sentence on where traffic stops. When the fix lands, a green bridge segment fades in over 300ms and the cut fades out.

### Navigation
- **Rail items:** a 22px icon column, label, and optional count. Text is rail-ink-2 at rest and conductor white on hover or when current. The current item sits on Selected Jacket. Icons are drawn SVG with a 1.6px stroke and round joins.
- **Jacket print:** the rail's right edge carries a vertical cable-jacket legend ("OCTET CAT6 UTP 4PR 23AWG T568B 0041 M") at 20% opacity, in Funnel Sans 600 at 8.5px with 0.24em tracking.

### Review card
- **Order:** the question, then Show answer (Space), then the answer in mono with a one-line why, then four grade buttons (1 to 4, each showing its next interval). The source and card count sit at the bottom.

### Console
- **Style:** always dark, in Azeret Mono. Device tabs (R1, S1, PC-ENG) are set in Funnel Sans, with a pair-blue underline on the current tab. The caret is pair blue. Errors use Cut Red with the IOS caret marker.

## Do's and Don'ts

### Do:
- **Do** draw any new progress, link or state as a wire in its pair colour before reaching for a bar, ring or badge.
- **Do** keep jacket blue identical across rail, primary button and drawn cables (The One Material Rule).
- **Do** keep lessons to two short paragraphs, then something to touch.
- **Do** use mono only for device text (The Device Voice Rule).
- **Do** keep UI motion under 300ms with `cubic-bezier(0.23, 1, 0.32, 1)`, and never animate keyboard-triggered actions such as opening search.
- **Do** respect reduced motion: transitions collapse to a 150ms opacity fade.

### Don't:
- **Don't** add points, streaks, levels, mascots or celebration effects. The user ruled out gamification.
- **Don't** put a label, date or breadcrumb above a title (The No Kicker Rule).
- **Don't** use a pair colour for anything except its course or its conductor (The Pair Rule).
- **Don't** draw fake window controls or OS chrome. The real shell supplies them.
- **Don't** fill a screen with more than three areas. The user ruled out busy screens.
