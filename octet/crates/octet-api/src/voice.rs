//! The reading voice, run natively: Kokoro on ONNX Runtime, on every core.
//!
//! In the window's WebAssembly, Kokoro makes speech slower than it plays;
//! here it is several times faster. The interface still turns text into
//! phonemes and token ids (voice/worker.js); this turns those into audio.
//!
//! The model is downloaded once, the first time it's asked for, next to the
//! user's data, and loaded on the first sentence.

use ort::session::Session;
use ort::value::Tensor;
use serde::Serialize;
use serde_json::{json, Value};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub const MODEL_URL: &str = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model_fp16.onnx";
pub const MODEL_BYTES: u64 = 163_234_740;
const FILE: &str = "kokoro-82m-v1.0-fp16.onnx";
const RATE: u32 = 24_000;

#[derive(Default, Clone, Serialize)]
struct Progress {
    downloading: bool,
    loaded: u64,
    total: u64,
    error: Option<String>,
}

pub struct Voice {
    dir: PathBuf,
    session: Mutex<Option<Session>>,
    progress: Arc<Mutex<Progress>>,
}

impl Voice {
    pub fn new(dir: PathBuf) -> Arc<Self> {
        Arc::new(Voice { dir, session: Mutex::new(None), progress: Arc::default() })
    }

    fn model(&self) -> PathBuf {
        self.dir.join(FILE)
    }

    pub fn status(&self) -> Value {
        let p = self.progress.lock().map(|p| p.clone()).unwrap_or_default();
        json!({ "installed": self.model().is_file(), "downloading": p.downloading, "loaded": p.loaded, "total": p.total, "error": p.error, "bytes": MODEL_BYTES })
    }

    /// Starts the download in the background; poll `status` for progress.
    pub fn install(self: &Arc<Self>) -> Value {
        {
            let mut p = self.progress.lock().unwrap();
            if self.model().is_file() || p.downloading {
                drop(p);
                return self.status();
            }
            *p = Progress { downloading: true, loaded: 0, total: MODEL_BYTES, error: None };
        }
        let me = self.clone();
        std::thread::spawn(move || {
            let r = me.download();
            let mut p = me.progress.lock().unwrap();
            p.downloading = false;
            if let Err(e) = r {
                p.error = Some(e);
            }
        });
        self.status()
    }

    fn download(&self) -> Result<(), String> {
        std::fs::create_dir_all(&self.dir).map_err(|e| e.to_string())?;
        let part = self.dir.join(format!("{FILE}.part"));
        let agent = ureq::AgentBuilder::new().try_proxy_from_env(true).build();
        let resp = agent.get(MODEL_URL).call().map_err(|e| format!("download: {e}"))?;
        let total = resp.header("content-length").and_then(|v| v.parse().ok()).unwrap_or(MODEL_BYTES);
        self.progress.lock().unwrap().total = total;
        let mut body = resp.into_reader();
        let mut out = std::fs::File::create(&part).map_err(|e| e.to_string())?;
        let mut buf = vec![0u8; 1 << 16];
        let mut got = 0u64;
        loop {
            let n = body.read(&mut buf).map_err(|e| format!("download: {e}"))?;
            if n == 0 {
                break;
            }
            out.write_all(&buf[..n]).map_err(|e| e.to_string())?;
            got += n as u64;
            self.progress.lock().unwrap().loaded = got;
        }
        out.flush().map_err(|e| e.to_string())?;
        drop(out);
        if got != total {
            let _ = std::fs::remove_file(&part);
            return Err(format!("download stopped at {got} of {total} bytes"));
        }
        std::fs::rename(&part, self.model()).map_err(|e| e.to_string())
    }

    pub fn remove(&self) -> Value {
        *self.session.lock().unwrap() = None;
        let _ = std::fs::remove_file(self.model());
        self.status()
    }

    /// Token ids and the voice's style vector in, a WAV file out.
    pub fn say(&self, ids: &[i64], style: &[f32], speed: f32) -> Result<Vec<u8>, String> {
        if style.len() != 256 {
            return Err("a style is 256 numbers".into());
        }
        let mut guard = self.session.lock().map_err(|_| "the voice is busy after an error".to_string())?;
        if guard.is_none() {
            if !self.model().is_file() {
                return Err("the voice model isn't downloaded".into());
            }
            let s = Session::builder().and_then(|mut b| b.commit_from_file(self.model())).map_err(|e| format!("loading the voice: {e}"))?;
            *guard = Some(s);
        }
        let session = guard.as_mut().unwrap();
        let err = |e: ort::Error| format!("making speech: {e}");
        let outputs = session
            .run(ort::inputs![
                "input_ids" => Tensor::from_array(([1usize, ids.len()], ids.to_vec())).map_err(err)?,
                "style" => Tensor::from_array(([1usize, 256], style.to_vec())).map_err(err)?,
                "speed" => Tensor::from_array(([1usize], vec![speed])).map_err(err)?,
            ])
            .map_err(err)?;
        let (_, samples) = outputs[0].try_extract_tensor::<f32>().map_err(err)?;
        Ok(wav(samples))
    }
}

/// 16-bit mono WAV at Kokoro's 24 kHz.
pub fn wav(samples: &[f32]) -> Vec<u8> {
    let data = (samples.len() * 2) as u32;
    let mut out = Vec::with_capacity(44 + data as usize);
    out.extend_from_slice(b"RIFF");
    out.extend_from_slice(&(36 + data).to_le_bytes());
    out.extend_from_slice(b"WAVEfmt ");
    out.extend_from_slice(&16u32.to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&RATE.to_le_bytes());
    out.extend_from_slice(&(RATE * 2).to_le_bytes());
    out.extend_from_slice(&2u16.to_le_bytes());
    out.extend_from_slice(&16u16.to_le_bytes());
    out.extend_from_slice(b"data");
    out.extend_from_slice(&data.to_le_bytes());
    for s in samples {
        out.extend_from_slice(&((s.clamp(-1.0, 1.0) * 32767.0) as i16).to_le_bytes());
    }
    out
}

#[cfg(test)]
mod tests {
    #[test]
    fn wav_header_and_length() {
        let w = super::wav(&[0.0, 1.0, -1.0]);
        assert_eq!(&w[0..4], b"RIFF");
        assert_eq!(w.len(), 44 + 6);
        assert_eq!(i16::from_le_bytes([w[46], w[47]]), 32767);
    }
}
