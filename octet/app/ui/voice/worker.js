// Octet's reading voice: Kokoro, run in a worker so the page never stutters.
//
// Messages in (each with an `id`, answered by a message with the same `id`):
//   { type: 'status' }                     -> { installed, bytes }
//   { type: 'install', voices }            -> progress messages, then { ok }
//   { type: 'speak', text, voice, urgent } -> { wav } (an ArrayBuffer), from the cache when it can;
//                                            urgent ones go to the front of the queue
//   { type: 'drop', ids }                  forget queued speak requests nobody needs any more
//   { type: 'remove' }                     -> { ok } after deleting the model and every saved sentence
//   { type: 'config', threads }            how many threads to use; 1 is the safe fallback
//   { type: 'tokens', text, voice }        -> { wav } from the cache, or { ids, style, key } for the native voice
//   { type: 'install', voices, native }    with native, only the tokenizer and voices (the app downloads the model)
//
// It also sends { type: 'log', text } as it goes, so the page can say what
// it's doing and Settings can copy the details.
//
// Everything downloaded lives in the app's own cache storage, so after the
// first download the voice works with no internet at all.

import { KokoroTTS, transformersEnv as env, phonemize, AutoTokenizer, loadVoice } from './kokoro.web.js';

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const HF = `https://huggingface.co/${MODEL}/resolve/main/`;
const FILES = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model_quantized.onnx'];
const WASM = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.wasm';
const VOICE = v => `${HF}voices/${v}.bin`;
// The caches: Transformers.js and kokoro-js look in theirs by these names.
const MODEL_CACHE = 'transformers-cache', VOICE_CACHE = 'kokoro-voices', RUNTIME_CACHE = 'octet-voice', AUDIO_CACHE = 'octet-voice-audio';
const AUDIO_KEEP = 8000; // sentences kept (a few chapters); the oldest go first

env.allowLocalModels = false;
env.useBrowserCache = true;

const post = (id, msg, transfer) => self.postMessage({ id, ...msg }, transfer || []);
const log = text => self.postMessage({ type: 'log', text });
self.addEventListener('error', e => log('error: ' + (e.message || e)));
self.addEventListener('unhandledrejection', e => log('unhandled: ' + ((e.reason && e.reason.message) || e.reason)));
let THREADS = 1; // Kokoro's threads stall in WebView2; the reader runs several one-thread workers instead

async function cached(cache, url) { try { return await (await caches.open(cache)).match(url); } catch { return undefined; } }
async function installed() {
  for (const f of FILES) if (!(await cached(MODEL_CACHE, HF + f))) return false;
  return !!(await cached(RUNTIME_CACHE, WASM));
}

// Download one file into a cache, reporting bytes as they arrive.
async function fetchInto(cache, url, onBytes) {
  if (await cached(cache, url)) return 0;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url.split('/').pop()}: ${r.status}`);
  const total = +r.headers.get('content-length') || 0, reader = r.body.getReader(), parts = [];
  let got = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); got += value.length; onBytes(value.length, total); }
  const blob = new Blob(parts);
  await (await caches.open(cache)).put(url, new Response(blob, { headers: { 'content-type': r.headers.get('content-type') || 'application/octet-stream', 'content-length': String(blob.size) } }));
  return got;
}

// Sizes, so the progress bar is honest before every file has started.
const SIZES = { 'onnx/model_quantized.onnx': 92361116, [WASM]: 21596019 };
async function install(id, voices, native) {
  const jobs = native
    ? [...FILES.filter(f => !f.endsWith('.onnx')).map(f => [MODEL_CACHE, HF + f, 4000]), ...voices.map(v => [VOICE_CACHE, VOICE(v), 522240])]
    : [...FILES.map(f => [MODEL_CACHE, HF + f, SIZES[f] || 4000]), [RUNTIME_CACHE, WASM, SIZES[WASM]], ...voices.map(v => [VOICE_CACHE, VOICE(v), 522240])];
  const total = jobs.reduce((s, j) => s + j[2], 0);
  let done = 0, last = 0;
  for (const [cache, url, size] of jobs) {
    let mine = 0;
    await fetchInto(cache, url, n => { mine += n; done += n; const now = Date.now(); if (now - last > 120) { last = now; post(id, { type: 'progress', loaded: done, total }); } });
    done += Math.max(0, size - mine); // already cached, or the size was a guess
  }
  post(id, { type: 'progress', loaded: total, total });
}

let tts = null, loading = null;
async function model() {
  if (tts) return tts;
  if (!loading) loading = (async () => {
    const t0 = performance.now();
    log('loading the runtime');
    const wasm = await cached(RUNTIME_CACHE, WASM);
    if (!wasm) throw new Error('The voice is not downloaded yet.');
    const onnx = env.backends.onnx.wasm;
    onnx.wasmPaths = { mjs: new URL('ort-wasm-simd-threaded.jsep.mjs', import.meta.url).href };
    onnx.wasmBinary = await wasm.arrayBuffer();
    // Threads need the page to be cross-origin isolated; Octet's window is.
    onnx.numThreads = THREADS || (self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) : 1);
    log(`loading the model (${onnx.numThreads} thread${onnx.numThreads > 1 ? 's' : ''}, isolated: ${self.crossOriginIsolated}, cores: ${navigator.hardwareConcurrency})`);
    tts = await KokoroTTS.from_pretrained(MODEL, { dtype: 'q8', device: 'wasm' });
    log(`model ready in ${Math.round(performance.now() - t0)} ms`);
    return tts;
  })().catch(e => { loading = null; throw e; });
  return loading;
}

/* ---------- audio ---------- */
// A sentence's audio is kept under a made-up URL: the voice and a hash of the text.
async function key(voice, text) {
  const h = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return `https://octet.local/voice/${voice}/${[...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('')}.wav`;
}
function wav(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) { const s = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return buf;
}
let saved = 0;
async function keep(url, buf) {
  try {
    const c = await caches.open(AUDIO_CACHE);
    await c.put(url, new Response(buf, { headers: { 'content-type': 'audio/wav' } }));
    if (++saved % 100 === 0) { const ks = await c.keys(); if (ks.length > AUDIO_KEEP) for (const k of ks.slice(0, ks.length - AUDIO_KEEP)) await c.delete(k); }
  } catch (e) { console.warn('Octet could not keep a sentence', e); } // the sentence still plays
}
async function speak(text, voice) {
  const url = await key(voice, text), hit = await cached(AUDIO_CACHE, url);
  if (hit) return { wav: await hit.arrayBuffer(), cached: true };
  const t = await model(), t0 = performance.now(), a = await t.generate(text, { voice });
  if (!a.audio.length) throw new Error('no audio');
  log(`said ${text.length} characters in ${Math.round(performance.now() - t0)} ms (${(a.audio.length / a.sampling_rate).toFixed(1)} s of speech)`);
  const buf = wav(a.audio, a.sampling_rate);
  await keep(url, buf.slice(0));
  return { wav: buf, cached: false, ms: performance.now() - t0 };
}

/* ---------- for the native voice ---------- */
// Text to phonemes to token ids, and the voice's style for that length: what
// the app's own Kokoro (on every core) needs. The same steps as kokoro-js's
// generate(), without running the model here.
let tok = null;
async function tokens(text, voice) {
  const url = await key(voice, text), hit = await cached(AUDIO_CACHE, url);
  if (hit) return { wav: await hit.arrayBuffer(), cached: true };
  tok = tok || await AutoTokenizer.from_pretrained(MODEL);
  const { input_ids } = tok(await phonemize(text, voice[0]), { truncation: true });
  const ids = Array.from(input_ids.data, Number);
  const v = await loadVoice(voice), at = 256 * Math.min(Math.max(ids.length - 2, 0), 509);
  return { ids, style: Array.from(v.slice(at, at + 256)), key: url };
}

/* ---------- one sentence at a time, in the order asked ---------- */
const queue = []; let busy = false;
async function pump() {
  if (busy) return; busy = true;
  while (queue.length) {
    const { id, text, voice } = queue.shift();
    try { const r = await speak(text, voice); post(id, r, [r.wav]); } catch (e) { log('failed: ' + (e.message || e)); post(id, { error: String(e.message || e) }); }
  }
  busy = false;
}

self.onmessage = async ({ data: m }) => {
  const { id } = m;
  try {
    if (m.type === 'status') post(id, { installed: await installed(), threads: self.crossOriginIsolated });
    else if (m.type === 'install') { await install(id, m.voices || [], !!m.native); post(id, { ok: true }); }
    else if (m.type === 'tokens') post(id, await tokens(m.text, m.voice));
    else if (m.type === 'load') { await model(); post(id, { ok: true }); }
    else if (m.type === 'config') { THREADS = m.threads || 0; post(id, { ok: true }); }
    else if (m.type === 'speak') { if (m.urgent) queue.unshift(m); else queue.push(m); pump(); }
    else if (m.type === 'drop') { const ids = new Set(m.ids); for (let i = queue.length - 1; i >= 0; i--) if (ids.has(queue[i].id)) { post(queue[i].id, { dropped: true }); queue.splice(i, 1); } }
    else if (m.type === 'remove') { tts = null; loading = null; for (const c of [MODEL_CACHE, VOICE_CACHE, RUNTIME_CACHE, AUDIO_CACHE]) await caches.delete(c); post(id, { ok: true }); }
  } catch (e) { post(id, { error: String(e.message || e) }); }
};
