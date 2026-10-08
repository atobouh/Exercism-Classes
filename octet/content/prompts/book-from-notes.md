You are turning my class material (the PDF or notes I've attached) into a book for Octet, my offline study app. Octet shows the book on a shelf, with a calm reader, questions I answer, and spaced review. Your answer will be pasted straight into Octet. Octet reads it exactly as written, so follow the format below precisely.

# What to write

- **Teach, don't summarise.** Write each page so someone who missed the class could learn it from the page alone. Explain *why* before *how*. Use concrete examples. Define each term in *italics* the first time it appears.
- **Stay faithful to my material.** Follow its chapters and order, and keep every fact, command and number it teaches. Where it is thin or unclear, explain more, but don't add topics it doesn't cover. If you correct something that looks wrong in the material, say so in a `trap` callout.
- **Use your own words.** Don't copy long passages. Device output and command syntax can be shown exactly as a device prints them.
- **Be exact.** If you're unsure of a command, default or number, leave it out rather than guess.
- **Voice:** plain, calm, second person ("you type…"), present tense, sentence-case headings. No hype, no emoji, no exclamation marks, no em dashes.
- **Size:** each chapter has 4 to 10 pages. Each page has 400 to 1,000 words, organised under `##` headings. About every 300 words, add something to answer (`question`, `command` or `recall`). End each page with two to four `recall` cards.

# The format

The whole answer is plain text in this shape. Put all of it in a single code block that opens with ``` and closes with ```. Inside the book, every fenced block uses `~~~` (three tildes), never backticks, so the outer code block stays intact.

The text starts with a `=== book ===` section, then one `=== page CHAPTER NAME ===` section per page.

```
=== book ===
id = "networking-notes"
title = "Networking notes"
short = "My class, term 1"
cloth = "navy"
pattern = "waves"
about = "One line about what this book covers."

[[chapter]]
number = 1
title = "How a switch decides"

[[chapter]]
number = 2
title = "VLANs"

=== page 1 01-the-mac-address-table ===
+++
title = "The MAC address table"
summary = "One sentence shown in the chapter's page list."
+++

A first paragraph that says what this page is about and why it matters.

## A section heading

More paragraphs. Blank lines separate paragraphs.

=== page 1 02-flooding ===
+++
title = "Flooding"
summary = "..."
+++

...
```

Rules for the book section:
- `id`: lowercase letters, digits and dashes only. It names the book; keep it the same in every answer for this book.
- `title` and `short`: the book's name, and a short line under it (the course or term).
- `cloth`: one of `teal`, `plum`, `ochre`, `navy`, `moss`, `brick`, `slate`, `linen`, `graphite`, `rose`. `pattern`: one of `rings`, `traces`, `grid`, `bits`, `waves`, `stripes`, `dots`, `plain`. Pick ones that suit the subject; I can change them in Octet.
- List every chapter you write pages for, numbered from 1 in the material's order.

Rules for pages:
- The section line is `=== page ` + chapter number + space + page name + ` ===`. The page name is two digits, a dash, then a few lowercase words joined by dashes: `01-the-mac-address-table`. Pages read in the order of their names.
- Each page starts with its header between two `+++` lines: `title` and `summary`, written as TOML strings in double quotes. Write `\"` for a double quote inside them.
- Never use a single `#` heading. Use `##` and `###`.

# What a page can hold

Text:
- `*term*` gives italics, `**strong**` gives bold (use it sparingly), `` `command` `` marks anything typed or printed.
- `- item` and `1. item` make lists.
- Tables use `|` like this, and every row has the same number of cells:

```
| Prefix | Mask | Usable hosts |
| --- | --- | --- |
| /24 | 255.255.255.0 | 254 |
```

Fenced blocks, each opened and closed with `~~~`:

Device output. The word after `console` is the device name. Show the prompt on each typed line:
```
~~~console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.10.1    YES manual up                    up
~~~
```

Callouts. Each holds paragraphs and `-` lists only:
- `key` is the one idea to keep.
- `exam` says how this is usually tested.
- `trap` is a common mistake.
- `deeper` goes beyond the material.

Use at most three per page.
```
~~~trap
A host can't use the network address or the broadcast address.
~~~
```

A multiple-choice question. Options count from 0. Each wrong option should be a real misconception. `why` explains the answer.
```
~~~question
prompt = "Which mask is a /26?"
options = ["255.255.255.0", "255.255.255.192", "255.255.255.224"]
answer = 1
why = "26 one-bits end two bits into the last octet: 128 + 64 = 192."
~~~
```
For more than one right answer, ask "Which two…?" and write `answer = [0, 2]`.

Type the command. `mode` is the prompt. `answer` lists the accepted commands, and the first is shown when the reader gets it wrong. Abbreviations are accepted automatically.
```
~~~command
prompt = "Save the running configuration so it survives a reload."
mode = "R1#"
answer = ["copy running-config startup-config"]
why = "The startup configuration is what the router loads when it boots."
~~~
```

A recall card. The reader answers in their head, then checks:
```
~~~recall
front = "How many usable hosts does a /27 have?"
back = "30. Five host bits: 2^5 − 2."
~~~
```

A network diagram. `x` and `y` are grid positions, one unit per device. Use 7 nodes or fewer.
- Kinds: `pc`, `laptop`, `server`, `printer`, `phone`, `switch`, `l3switch`, `router`, `firewall`, `ap`, `wlc`, `cloud`, `internet`, `hub`.
- Link `style` is optional: `trunk`, `serial`, `wireless`, `dashed` or `fiber`.
- `a_label` and `b_label` label each end; `label` sits in the middle.
```
~~~diagram
caption = "Two PCs on one switch, with R1 as their gateway."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.1.10" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "192.168.1.11" },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/1" },
  { a = "PC2", b = "S1", b_label = "F0/2" },
  { a = "S1", b = "R1", a_label = "G0/1", b_label = "G0/0/0" },
]
~~~
```

A header or frame, field by field:
- With `unit = "bits"` and `row = 32`, each `span` is a number of bits, and fields mustn't cross the end of a row.
- With no unit, spans are relative widths and `size` gives the real size.
```
~~~fields
title = "TCP ports"
unit = "bits"
row = 32
fields = [{ name = "Source port", span = 16 }, { name = "Destination port", span = 16 }]
~~~
```

Endless practice, generated by Octet. Write one of `binary`, `hex`, `mask`, `wildcard`, `subnet`, `hosts` or `ipv6`:
```
~~~drill
subnet
~~~
```

Inside TOML values (questions, cards, diagrams), write text on one line in double quotes. For a backslash, write `\\`.

# Long material

If the material is long, write only the chapters I ask for in each answer. Start with chapter 1. When I say "next chapter", send a complete answer again with the same book section, listing **only** the new chapter under `[[chapter]]`, plus that chapter's pages. Octet adds each answer to the same book, and a chapter sent again replaces the earlier version of it.

# Before you answer

Check your work against these rules:
- Every `=== page N name ===` uses a chapter number listed in the book section.
- Every page starts with a `+++` header that has a `title`.
- Every fenced block opens and closes with `~~~`.
- Every `answer` index exists among its options.
- The whole answer is one code block.

If Octet finds a problem, I'll paste its message back to you; fix it and send the whole text again.

Now write the book from the attached material, starting with chapter 1.
