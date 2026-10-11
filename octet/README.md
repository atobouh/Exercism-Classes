# Octet

A personal, offline CCNA desk: the courses as books on your shelf, a calm reader where you highlight and write your own notes and that can read each page aloud, collections of what you keep, spaced review, and labs on a live network map backed by a real simulator, with a simulation mode that shows every frame of a ping.

## Run it on Windows

You need two things once:

1. **Rust**: install from <https://rustup.rs> (accept the defaults, including the Visual Studio C++ build tools it offers).
2. **Tauri's command line**: open a terminal and run

   ```
   cargo install tauri-cli --version "^2" --locked
   ```

Windows 10 and 11 already include WebView2, which Tauri uses to draw the window.

Then, from this folder:

```
cd app/src-tauri
cargo tauri dev
```

The first build takes a few minutes. After that, Octet opens in its own window. Your highlights, notes, review cards and lab results are saved in `%APPDATA%\app.octet.desk\octet.json`.

To make an installer (`.msi` and `.exe`):

```
cd app/src-tauri
cargo tauri build
```

The installers land in `target/release/bundle/`.

## Work on the interface in a browser

The same Rust commands can be served over HTTP, which is handy for working on the interface:

```
cargo run -p octet-api --features dev-server
```

Then open <http://127.0.0.1:4173>. Data goes to `target/dev-data/octet.json`.

## Reading aloud

Press **Listen** above any page. Octet reads from where you are, highlights the sentence and keeps it in view. At a diagram it reads the caption and waits a few seconds (or until you press play); at a question it waits for your answer and reads what Octet says back. The bar at the bottom has play and pause, a sentence back or ahead, the speed (0.75× to 1.5×) and the voice.

The natural voice is [Kokoro](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX), run on the processor. Kokoro's own threads stall inside the Windows app, so Octet runs up to three single-thread workers side by side (fewer on a small processor); from the moment you press Listen they make the whole page, in reading order from where you are, so skipping ahead or back is instant once it's made. Before it starts, it works out how much head start your processor needs and makes that much first ("Getting the page ready… 40%"; press play to start at once), so the page then reads without stopping. While you read, the next pages are made too, and **Prepare this chapter** in the voice menu makes a whole chapter ahead of time. A sentence that explains a diagram lights the diagram up too, with the devices it names, and Focus mode keeps both in view. It isn't in the installer: the first time you press Listen, Octet offers to download it once (about 115 MB), and from then on it works offline. Every sentence it has said is kept, so a page you've heard plays instantly. Until then, or on a slow computer, the system's own voice reads instead. Settings has the voice, the speed, how long to stop at diagrams, and a button to remove the download. See `app/ui/voice/README.md`, including the one license to watch: the phonemizer inside is GPL.

## How it fits together

| Part | What it does |
| --- | --- |
| `crates/octet-sim` | The network simulator. Switches with VLANs, access ports and 802.1Q trunks; routers with subinterfaces and static routes; PCs with VPCS-style commands. An IOS-style console with abbreviations, modes, `?` help and IOS errors. Pings are worked out hop by hop, and a failure reports where and why it stopped. |
| `crates/octet-core` | The library. Loads books and pages from `content/`, keeps everything that is yours in one JSON file, and schedules review. |
| `crates/octet-api` | Every command the interface calls, behind one entry point. Used by the desktop app and the dev server. |
| `app/src-tauri` | The desktop shell. |
| `app/ui` | The interface: plain HTML, CSS and JavaScript, with the fonts bundled so nothing loads from the internet. `reader.js` reads pages aloud. |
| `app/ui/voice` | The reading voice: Kokoro in a worker, downloaded on first use. |
| `app/ui/bench` | The lab bench, a web component any page can use: devices, cables, the console, and the simulation mode. See its README. |
| `content/` | Books, pages and labs. |

The visual design is recorded in `../docs/library/DESIGN.md`.

## Writing content

A book is a folder in `content/books/` with a `book.toml` listing its chapters. Pages live in a folder per chapter (`03/` for chapter 3), one Markdown file each, in reading order:

````markdown
+++
title = "VLAN trunks"
summary = "One line shown in the page list."
links = ["srwe/03/04-native-vlan"]
+++

A paragraph. Blank lines separate paragraphs. *Emphasis*, **strong** and `show vlan brief` work.

```question
prompt = "The native VLAN is 1. How does a frame from PC-SALES cross the trunk?"
options = ["Untagged", "Tagged 10", "Tagged 1"]
answer = 1
why = "Only the native VLAN crosses untagged, and Sales is in VLAN 10."
```

```lab
srwe-03-router-on-a-stick
```
````

Every question you answer becomes a review card. A wrong answer also goes into "Things I got wrong".

A lab is a TOML file in `content/labs/`: devices with their starting configuration (real IOS commands), the cables between them, and tasks with checks (`ping`, `no_ping`, `vlan_exists`, `trunk`, `access`, `iface_up`). See `content/labs/srwe-03-router-on-a-stick.toml`.

## Tests

```
cargo test
```

This runs the simulator, the library, the commands, and a check that every link and lab in `content/` resolves.

The bench engine and the open lab have their own:

```
node app/ui/bench/test/engine.test.mjs          # the network engine, no browser
cargo build -p octet-api --features dev-server
node app/test/labs.e2e.mjs                      # the reader, the drawer, build a lab, ping, simulate, export, open it again (needs Playwright)
```

Labs you build in the Labs view are saved as `labs/<id>.json` next to your data file, and shared as `.octet-lab` files.
