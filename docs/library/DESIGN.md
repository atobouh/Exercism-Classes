---
name: Octet
description: A quiet personal library that holds the CCNA. Books on a shelf, a calm reader, your own notes and collections, and labs on a live network map.
colors:
  bg: "oklch(99.1% 0.002 85)"
  list: "oklch(97.9% 0.003 80)"
  side: "oklch(96% 0.005 78)"
  hover: "oklch(93.6% 0.006 78)"
  sel: "oklch(91.8% 0.008 78)"
  ink: "oklch(23% 0.01 60)"
  ink-2: "oklch(43% 0.01 60)"
  ink-3: "oklch(53% 0.009 60)"
  line: "oklch(90.5% 0.006 70)"
  line-2: "oklch(84% 0.008 70)"
  you: "oklch(45% 0.09 165)"
  you-bg: "oklch(95.6% 0.022 165)"
  mark: "oklch(91% 0.085 96)"
  pri: "oklch(24% 0.01 60)"
  on-pri: "oklch(98% 0.003 85)"
  ok: "oklch(55% 0.12 155)"
  wrong: "oklch(52% 0.16 28)"
  dot: "oklch(82% 0.006 70)"
  cloth-itn: "oklch(42% 0.07 200)"
  cloth-srwe: "oklch(37% 0.08 330)"
  cloth-ensa: "oklch(68% 0.11 82)"
  cloth-light: "oklch(96% 0.012 85)"
  cloth-dark: "oklch(25% 0.03 70)"
  night-bg: "oklch(21% 0.005 70)"
  night-list: "oklch(19.6% 0.005 70)"
  night-side: "oklch(18% 0.005 70)"
  night-ink: "oklch(92% 0.006 80)"
  night-ink-2: "oklch(73% 0.008 80)"
  night-ink-3: "oklch(63% 0.008 80)"
  night-line: "oklch(28.5% 0.006 70)"
  night-you: "oklch(77% 0.1 165)"
  night-ok: "oklch(73% 0.13 155)"
  night-wrong: "oklch(70% 0.15 28)"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "40px"
    fontWeight: 450
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  page-title:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "42px"
    fontWeight: 450
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  reading:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.66
  title:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "21px"
    fontWeight: 500
    lineHeight: 1.1
  body:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  yours:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 450
    lineHeight: 1.55
  label:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
  ios:
    fontFamily: "Spline Sans Mono, Consolas, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  key: "4px"
  control: "8px"
  button: "9px"
  card: "12px"
  window: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  page: "64px"
components:
  button-primary:
    backgroundColor: "{colors.pri}"
    textColor: "{colors.on-pri}"
    rounded: "{rounded.button}"
    padding: "9px 15px"
  button-line:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "9px 15px"
  nav-item-current:
    backgroundColor: "{colors.sel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
  your-note:
    backgroundColor: "{colors.you-bg}"
    textColor: "{colors.you}"
    typography: "{typography.yours}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  device-card:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    width: "168px"
    height: "58px"
  console:
    backgroundColor: "{colors.list}"
    textColor: "{colors.ink-2}"
    typography: "{typography.ios}"
---

# Design System: Octet

## Overview

**Creative North Star: "The Quiet Library"**

Octet feels like a personal tool you own, not a course you are enrolled in. The CCNA arrives as three cloth-bound books on your shelf. You read each page in a calm editor, mark what matters, write your own notes, and collect the pieces you want to keep. Labs open on a live map of the network that you can drag, build on and fix. It was built from the user's own picks: iA Writer, Obsidian, Bear, Are.na and Stripe Press for reading, and UniFi, Obsidian Canvas and Zed for the lab.

The surfaces are warm-neutral paper, never cream, in both a day theme and a night theme of equal care. Colour is rare. It means one of four things: a book (its cloth colour), your own words (green), something broken (red), or something working (green dot). Everything else is ink on paper.

**Key Characteristics:**
- The book and you never look alike. Course text is a serif (Newsreader). Your notes are the sans (Onest) in green.
- No dashboards, no points, no streaks. Progress is a ribbon in a book, a chapter count, a check dot.
- One job per screen. Reading uses three panes like a notes app. The lab takes the whole window.
- Mono (Spline Sans Mono) only where a device speaks: console, ports, addresses, configs.

## Colors

Warm-neutral paper and ink, with three book cloths and one colour for you.

### Primary
- **Ink** (`ink`, night `night-ink`): text, the primary button fill, the selected tab underline.
- **Your Green** (`you`, `you-bg`, night `night-you`): your notes, your answers when right, the caret, links, the selected device ring. It is yours, so it is never used for course text.

### Secondary
- **Book cloths** (`cloth-itn` teal, `cloth-srwe` plum, `cloth-ensa` ochre): book covers and the small spines in the sidebar. Text on teal and plum uses `cloth-light`; on ochre it uses `cloth-dark`.
- **Marker** (`mark`): highlights inside course text, like a real highlighter.

### Tertiary
- **Working** (`ok`): status dots, passed checks, added lines in a diff.
- **Broken** (`wrong`): the cut mark on the lab map, a failed check, a wrong answer, removed lines in a diff, console errors.

### Neutral
- **Paper** (`bg`): the page and cards.
- **List** (`list`): the page list, the canvas, the console and figure wells.
- **Side** (`side`): the sidebar.
- **Hover / Selected** (`hover`, `sel`): rows and tabs.
- **Ink 2 and 3** (`ink-2`, `ink-3`): secondary text and quiet labels. Ink 3 still meets 4.5:1 on paper.
- **Lines** (`line`, `line-2`): hairlines and control outlines.
- **Canvas dot** (`dot`): the 20px dot grid of the lab canvas.

### Named Rules
**The Four Meanings Rule.** Colour only ever means a book, you, broken, or working. Anything else is ink.

**The Yours Is Green Rule.** Anything the learner wrote or chose shows in `you`. Course material never does.

## Typography

**Display Font:** Newsreader (with Georgia)
**Body Font:** Onest (with system-ui)
**Label/Mono Font:** Spline Sans Mono (with Consolas), for device text only

**Character:** Newsreader is the voice of the book: an editorial serif with optical sizes, used for titles and for course text. Onest is the voice of the app and of the learner: friendly, clear, slightly warm.

### Hierarchy
- **Display** (450, 40px, 1.05): screen titles such as "Your library" and collection names.
- **Page title** (450, 42px, 1.06, optical size 72): the reading page title.
- **Title** (500, 21px to 22px): list heads, lab title, device name in the panel, card titles on the canvas (18px).
- **Reading** (400, 19px, 1.66, max 680px column): course text.
- **Yours** (450, 15.5px, 1.55): your notes, in `you`.
- **Body** (400, 14px, 1.5): the app default.
- **Label** (400, 12.5px to 13px): metadata, counts and hints, with tabular figures.
- **IOS** (400, 12.5px, 1.65): console, ports and diffs.

### Named Rules
**The Book Versus You Rule.** Course text is serif and ink. Your words are sans and green. The two never swap.

**The Device Voice Rule.** Mono is only for what a device prints or accepts.

## Layout

The app is a desktop window (1280 by 800 design size).
- **Library home:** 224px sidebar, then shelf of three covers (190 by 268), a continue card, a lab card and recent collection blocks.
- **Reading:** sidebar, a 300px page list, then the editor with a 680px column, 34px top and 40px side padding.
- **Collection:** a grid of blocks, three per row.
- **Review:** one centred 600px card.
- **Lab:** takes the whole window. A 54px bar (back, title, check dots, Run checks), the canvas, then a 440px device panel.

Spacing runs on 2px steps, mostly 4, 8, 12, 16, 24, 40 and 64. Text is left aligned everywhere.

## Elevation & Depth

Flat paper by default, separated by tone and hairlines. Things that float get a soft lift: book covers (inner highlight plus a long soft drop), canvas cards (`0 6px 16px -10px`), and menus and toasts (the float shadow). Nothing glows. Selection is a 2px ring in `you`.

## Shapes

Gently rounded: 4px keys, 8px controls, 9px buttons, 12px cards and canvas devices, 14px window, full pills for chips. Book covers are square on the spine side (3px) and rounded on the fore edge (6px), with a soft spine shadow.

## Components

### Buttons
- **Primary:** ink fill, paper text, 9px corners, a keycap for the shortcut. Hover lightens slightly; press scales to 0.97.
- **Line:** paper with a 1px `line-2` ring that darkens on hover.
- **Ghost and tool:** text only, `hover` fill on hover, `sel` when pressed.

### Book cover
- **Shape:** 190 by 268, cloth colour, a pattern drawn from the subject (signal rings, switching lines, routed grid), a title in Newsreader. The book you are reading carries an ochre ribbon.

### Reader
- Course text in Newsreader. Highlights use `mark`. Your notes sit under the paragraph in a `you-bg` block. Selecting text shows a dark toolbar: Highlight, Add a note, Collect. Focus mode dims every block except the current one to 22% opacity.
- Live figures and questions sit inside the text as blocks in `list` wells.

### Collections
- Blocks of three kinds: a quote (Newsreader), a command (mono), a note (green sans), a diagram. Each block shows where it came from.

### Navigation
- Sidebar rows with a 16px drawn icon, label and count. Current row on `sel`. Books show their cloth spine.

### Lab canvas (signature)
- Dotted canvas. Devices are 168 by 58 cards: icon well, name with a status dot, mono subline. Links are soft curves, port names in mono beside each end, a trunk is a double line with a "VLAN 10, 20" pill. A broken path gets a red cut mark and one sentence ("VLAN 20 stops here") that clears the moment it is fixed.
- The brief and your notes are cards on the same canvas. A floating toolbar: Move, Add device, Connect, Note. Everything drags.

### Device panel
- Tabs per open device, then the device name, then a segmented control: Console, Ports, Changes.
- **Console:** `list` ground, mono, IOS prompts and modes, caret in `you`.
- **Ports:** a table with status dots; a wrong value is shown in `wrong` with what was expected.
- **Changes:** a diff of the running config since the lab opened. Removed lines in a `wrong` tint, added lines in an `ok` tint.

## Do's and Don'ts

### Do:
- **Do** keep colour to its four meanings.
- **Do** set course text in Newsreader and the learner's words in green Onest.
- **Do** keep UI motion under 300ms with `cubic-bezier(0.23, 1, 0.32, 1)`, press at 0.97, and no animation on keyboard-triggered panels.
- **Do** show where a fault is on the map, in one plain sentence, and clear it the moment it is fixed.
- **Do** give both themes equal care, and respect reduced motion.

### Don't:
- **Don't** add points, streaks, levels, badges or confetti.
- **Don't** put a label or eyebrow above a title.
- **Don't** use a cream ground or a dark neon "hacker" look.
- **Don't** draw fake window controls.
- **Don't** use mono for anything a device does not print.
