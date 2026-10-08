# Writing for Octet

How Octet's books are written. Every page in `octet/content/books/` follows this guide. So does the prompt that turns your own PDFs into books. The visual design is in `DESIGN.md`. This file covers the words and the page format.

## Who you are writing for

One person, at a desk, who wants to actually understand networking. They don't want to cram for a test. They may be new, but they aren't slow. Each page should leave them able to explain the idea to a friend, and to type the commands on a real switch.

The books follow the three NetAcad CCNA courses chapter for chapter, with a fourth companion book for what the courses skip. The pages are not exam drills. If a page teaches the idea properly, the exam questions take care of themselves.

## Voice

- **Plain and exact.** Short sentences, everyday words, the real technical term once it's earned. Define a term in *italics* the first time it appears: "A *VLAN* (virtual LAN) splits one switch into…".
- **Second person, present tense.** "You type `show vlan brief`." "The switch floods the frame."
- **Concrete first.** Start from something the reader can picture: a floor of PCs, a frame arriving on a port, a ping that fails. Then name the idea. Then give the rule.
- **Why before how.** Every command answers a problem the reader has just met.
- **Calm.** No hype and no exclamation marks. Don't write "simply", "just", "easy", "powerful" or "seamless". No emoji.
- **US spelling.** Sentence case for every heading and title.
- **No em dashes.** Use a comma, a colon, parentheses or a new sentence instead.
- **Original words, always.** Never copy or closely paraphrase Cisco, NetAcad or any other text. Explain everything in your own words, with your own examples. Device output and command syntax are facts and can be shown as a device prints them.

## Accuracy

Being wrong costs the reader more than leaving something out.

- **Commands** must be real Cisco IOS / IOS XE syntax as typed on the course gear: Catalyst 2960 and 9200/9300 switches, ISR 4000 routers. Show the prompt the command is typed at.
- **Output** in `console` blocks must look like the real device: column headings, spacing and wording. Shorten long output with a line `...`, but never invent fields.
- **Numbers** must be right: defaults, timers, administrative distances, port numbers, header sizes. If you aren't sure of one, leave it out rather than guess.
- **Platform differences**: when behaviour differs between IOS versions or platforms, say so in one sentence. For example, `switchport mode trunk` needs `switchport trunk encapsulation dot1q` first on some older multilayer switches.
- **Addresses** in examples use private IPv4 ranges (10/8, 172.16/12, 192.168/16) or the documentation ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24). IPv6 examples use the documentation prefix 2001:db8::/32. MAC addresses look real, like `0050.7966.6800`.

## A chapter

- A chapter has **5 to 10 pages**, read in order. File names are `01-short-name.md`, `02-…`, so their order is their reading order.
- **The first page** sets the scene: the problem this chapter solves, in a picture the reader can hold.
- **The middle pages** each teach one idea, completely.
- **The last page** ties the chapter together. Use a worked scenario, a troubleshooting walk-through, or a page of mixed questions and recall cards ("Check yourself").
- Where the course has a lab, an existing `lab` block can appear on its own page. Don't invent new lab ids. Labs are built separately.

## A page

- **500 to 1,100 words** of reading, not counting the blocks you answer.
- It opens with one or two paragraphs that say what the page is about and why it matters. Then come `##` sections.
- About **every 250 to 400 words**, give the reader something to do: a `question`, a `command`, a `recall` card or a `drill`.
- Close with **two to four `recall` cards** for the facts worth keeping.
- Show, don't describe. A comparison is a `table`. A topology is a `diagram`. A header is `fields`. Commands and their output go in a `console`.
- Callouts are seasoning. Use at most three per page, and never two in a row.

## The format

A page is a Markdown file with a TOML header between `+++` lines:

```text
+++
title = "VLAN trunks"
summary = "An access port carries one VLAN. A trunk carries all of them on the same cable."
links = ["srwe/03/01-what-a-vlan-is", "srwe/03/04-native-vlan"]
+++

A paragraph. Blank lines separate paragraphs.
```

- `title`: a short name in sentence case.
- `summary`: one sentence, shown in the chapter's page list.
- `links`: optional page ids (`book/NN/file-name`) shown as "Linked pages" at the end.
- `lab`: only on a lab's own page.

### Text

- Paragraphs are separated by a blank line.
- Inline marks: `*term*` for italics, `**strong**` (sparingly), `` `command` `` for anything typed or printed, and `[words](srwe/03/03-vlan-trunks)` for a link to another page.
- Headings: `## Section` and `### Smaller section`. Never use `#`, because the title comes from the header.
- Lists: `- item` or `1. item`. A wrapped line continues the item above it.
- Tables:

```text
| Port state | Forwards frames | Learns MACs |
| --- | --- | --- |
| Blocking | No | No |
| Forwarding | Yes | Yes |
```

Every row needs the same number of cells as the header. Write `\|` for a literal bar inside a cell.

### Fenced blocks

Fences open with three backticks or three tildes and close with the same. The word after the fence names the block.

**`console`**: what a device shows. An optional title (the device name) follows the word. Lines that begin with a prompt (`R1#`, `S1(config-if)#`, `PC1>`, `C:\>`) show the typed part in bold.

````text
```console S1
S1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      1
```
````

**`key`, `exam`, `trap`, `deeper`**: callouts holding paragraphs and `-` lists only.
- `key` ("Remember this") is the one idea to keep.
- `exam` ("On the exam") says how this is usually tested. Keep it general ("Exams like the CCNA often…"), with no exam version numbers.
- `trap` ("Watch out") is a common mistake.
- `deeper` ("Going deeper") goes beyond the course, for the curious.

````text
```trap
If you delete a VLAN, its access ports don't move to VLAN 1. They become inactive and pass no traffic until you assign them to a VLAN that exists.
```
````

**`question`**: multiple choice. `answer` counts from 0. For "choose two", `answer` is a list.

````text
```question
prompt = "The native VLAN is 1. How does a frame from VLAN 10 cross the trunk?"
options = ["Untagged", "Tagged with VLAN 10", "Tagged with VLAN 1"]
answer = 1
why = "Only native VLAN frames cross untagged, and this frame belongs to VLAN 10."
```
````

- 3 to 5 options. Every wrong option is a real misconception, never a joke.
- Vary where the right answer sits.
- Don't use "all of the above" or "none of the above".
- `why` explains the right answer and, when it helps, why the tempting wrong one is wrong. One or two sentences.
- For several answers, say so in the prompt ("Which two…?") and give `answer = [0, 3]`.

**`command`**: the reader types a command. `mode` is the prompt it's typed at. `answer` lists accepted forms, and the first is the one shown. IOS-style abbreviations (`sw mo tr`, `int g0/1`) are accepted automatically, so list only truly different valid commands.

````text
```command
prompt = "Make this port a trunk."
mode = "S1(config-if)#"
answer = ["switchport mode trunk"]
why = "A trunk carries every VLAN, tagged with 802.1Q."
```
````

**`recall`**: a flashcard. The reader answers in their head, then checks. Keep the front a real question, and keep the back short.

````text
```recall
front = "Which VLAN is the native VLAN by default?"
back = "VLAN 1."
```
````

Everything the reader answers (`question`, `command`, `recall`) becomes a spaced-review card. Write each one so it still makes sense on its own, weeks later, away from the page.

**`diagram`**: a topology. `x` and `y` are grid positions; one unit is one device's spacing. Halves are fine.

````text
```diagram
caption = "Router-on-a-stick: one trunk carries both VLANs to R1."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "VLAN 10" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "VLAN 20" },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/1" },
  { a = "PC2", b = "S1", b_label = "F0/2" },
  { a = "S1", b = "R1", a_label = "G0/1", b_label = "G0/0/1", style = "trunk" },
]
```
````

- Node kinds: `pc`, `laptop`, `server`, `printer`, `phone`, `switch`, `l3switch`, `router`, `firewall`, `ap`, `wlc`, `cloud`, `internet`, `hub`.
- Link styles: none (a plain cable), `trunk`, `serial`, `wireless`, `dashed`, `fiber`.
- `a_label` and `b_label` sit by each end (interfaces). `label` sits in the middle (a subnet).
- Keep diagrams to 7 nodes or fewer, and four columns or fewer.

**`fields`**: a header or frame, field by field. With `unit = "bits"` and `row = 32`, each `span` is a number of bits and fields wrap like an RFC diagram. With no unit, spans are relative widths and `size` says the real size.

````text
```fields
title = "Ethernet II frame"
caption = "The 46 to 1500 byte payload is the largest part by far."
fields = [
  { name = "Destination MAC", span = 3, size = "6 bytes" },
  { name = "Source MAC", span = 3, size = "6 bytes" },
  { name = "Type", span = 1, size = "2 bytes" },
  { name = "Data", span = 8, size = "46–1500 bytes" },
  { name = "FCS", span = 2, size = "4 bytes" },
]
```
````

**`drill`**: endless practice generated on the spot, never graded. Kinds: `binary`, `hex`, `mask`, `wildcard`, `subnet`, `hosts`, `ipv6`.

````text
```drill
subnet
```
````

**`figure`** and **`lab`**: the ids of a built-in figure or lab. Use only ids that already exist.

**`exam-map`**: the exam topics, each linked to the pages that teach it. Used once, in the companion book.

### Checking your work

From `octet/`, run:

```text
target/debug/octet-check content/books/srwe/03
```

It lists each page with its word count and the things to answer, then every problem with its line number. A chapter is done when it reports no problems.
