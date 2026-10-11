# Octet's reading voice

The voice normally runs natively, in the app itself (`crates/octet-api/src/voice.rs`, ONNX Runtime on every core, model `onnx/model_fp16.onnx`, about 163 MB, downloaded once). This folder holds what the window needs for that: the phonemizer and tokenizer, which turn text into token ids. It also holds the older in-window voice, used only when the native one can't run.

Octet reads its pages aloud with **Kokoro**, an 82-million-parameter
text-to-speech model that runs on the processor, inside the app, with no
graphics card and no internet once it is downloaded.

| File | What it is |
| --- | --- |
| `worker.js` | Runs Kokoro in a background worker, on one thread (its multi-threaded mode stalls in WebView2; the reader runs several workers instead): downloads it once, keeps it in the app's cache, turns sentences into audio and keeps that audio too, so a page you've heard plays instantly the next time. |
| `kokoro.web.js` | [kokoro-js](https://www.npmjs.com/package/kokoro-js) 1.2.1. It bundles Transformers.js and the phonemizer. One change: the last line also exports Transformers.js's settings (`transformersEnv`), the phonemizer (`phonemize`), the tokenizer class (`AutoTokenizer`) and the voice loader (`loadVoice`), so the worker can prepare token ids for the native voice. |
| `ort-wasm-simd-threaded.jsep.mjs` | The ONNX Runtime loader that goes with it (from `@huggingface/transformers` 3.5.1). Kept here so its threads load from the app itself. |

Only these ship with Octet. The first time you press **Listen** and choose
the natural voice, Octet downloads, once:

- the model, `onnx-community/Kokoro-82M-v1.0-ONNX` (`onnx/model_quantized.onnx`, about 92 MB, Apache-2.0),
- the ONNX Runtime WebAssembly, `ort-wasm-simd-threaded.jsep.wasm` (about 22 MB, MIT),
- the voices you can pick (about 0.5 MB each).

Until then, and on any computer where the download isn't wanted, Octet reads
with the system's own voice.

## Licenses

- kokoro-js and the Kokoro model: Apache-2.0 (`LICENSE-kokoro-js.txt`).
- ONNX Runtime: MIT. Transformers.js: Apache-2.0.
- **The phonemizer inside `kokoro.web.js` is a WebAssembly build of
  espeak-ng, which is GPL-3.0.** That is fine for personal use. Before Octet
  is sold or distributed under other terms, replace the phonemizer (for
  example with a permissively licensed dictionary and rules) or ship Octet
  under the GPL.
