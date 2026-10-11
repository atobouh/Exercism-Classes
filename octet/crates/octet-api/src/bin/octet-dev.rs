//! Serves the interface and the same commands over HTTP, so the app can be
//! worked on in a browser: `cargo run -p octet-api --features dev-server`.

use octet_api::App;
use std::path::{Path, PathBuf};
use tiny_http::{Header, Response, Server};

/// The same policy the desktop window gets (see app/src-tauri/tauri.conf.json):
/// cross-origin isolation lets the reading voice use every processor core.
const HEADERS: [(&str, &str); 2] = [("Cross-Origin-Opener-Policy", "same-origin"), ("Cross-Origin-Embedder-Policy", "require-corp")];
const CSP: &str = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; img-src 'self' data:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://huggingface.co https://*.huggingface.co https://*.hf.co https://cdn.jsdelivr.net";

fn with_headers<R: std::io::Read>(mut r: Response<R>, page: bool) -> Response<R> {
    for (k, v) in HEADERS {
        r.add_header(Header::from_bytes(k, v).unwrap());
    }
    // the app's page gets the app's content policy; other pages (the bench demo) keep their inline scripts
    if page {
        r.add_header(Header::from_bytes("Content-Security-Policy", CSP).unwrap());
    }
    r
}

fn main() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let ui = root.join("app/ui");
    let data = std::env::var("OCTET_DATA").map(PathBuf::from).unwrap_or_else(|_| root.join("target/dev-data/octet.json"));
    let content = std::env::var("OCTET_CONTENT").map(PathBuf::from).unwrap_or_else(|_| root.join("content"));
    let mut app = App::open(&content, &data).expect("content loads");
    let port = std::env::var("PORT").unwrap_or_else(|_| "4173".into());
    let server = Server::http(format!("127.0.0.1:{port}")).expect("port is free");
    println!("Octet dev server on http://127.0.0.1:{port} (data in {})", data.display());
    let voice = octet_api::voice::Voice::new(data.parent().unwrap_or(Path::new(".")).join("voice"));
    for mut req in server.incoming_requests() {
        let url = req.url().split('?').next().unwrap_or("/").to_string();
        // the reading voice, as the desktop app's `voice` and `voice_say` commands
        if let Some(cmd) = url.strip_prefix("/voice-api/") {
            let mut body = String::new();
            let _ = req.as_reader().read_to_string(&mut body);
            let args: serde_json::Value = serde_json::from_str(&body).unwrap_or(serde_json::Value::Null);
            let json = |v: serde_json::Value, code: u16| Response::from_string(v.to_string()).with_status_code(code).with_header(Header::from_bytes("Content-Type", "application/json").unwrap());
            let _ = match cmd {
                "say" => {
                    let ids: Vec<i64> = serde_json::from_value(args["ids"].clone()).unwrap_or_default();
                    let style: Vec<f32> = serde_json::from_value(args["style"].clone()).unwrap_or_default();
                    match voice.say(&ids, &style, args["speed"].as_f64().unwrap_or(1.0) as f32) {
                        Ok(w) => req.respond(Response::from_data(w).with_header(Header::from_bytes("Content-Type", "audio/wav").unwrap())),
                        Err(e) => req.respond(json(serde_json::json!({ "error": e }), 400)),
                    }
                }
                "install" => req.respond(json(voice.install(), 200)),
                "remove" => req.respond(json(voice.remove(), 200)),
                _ => req.respond(json(voice.status(), 200)),
            };
            continue;
        }
        if let Some(cmd) = url.strip_prefix("/api/") {
            let mut body = String::new();
            let _ = req.as_reader().read_to_string(&mut body);
            let args: serde_json::Value = serde_json::from_str(&body).unwrap_or(serde_json::Value::Null);
            let (status, out) = match app.call(cmd, &args) {
                Ok(v) => (200, v.to_string()),
                Err(e) => (400, serde_json::json!({ "error": e }).to_string()),
            };
            let _ = req.respond(Response::from_string(out).with_status_code(status).with_header(Header::from_bytes("Content-Type", "application/json").unwrap()));
            continue;
        }
        let rel = if url == "/" { "index.html".to_string() } else { url.trim_start_matches('/').to_string() };
        if rel.contains("..") {
            let _ = req.respond(Response::from_string("no").with_status_code(400));
            continue;
        }
        let path = ui.join(&rel);
        match std::fs::read(&path) {
            Ok(bytes) => {
                let ct = match path.extension().and_then(|e| e.to_str()) {
                    Some("html") => "text/html; charset=utf-8",
                    Some("css") => "text/css",
                    Some("js") | Some("mjs") => "text/javascript",
                    Some("wasm") => "application/wasm",
                    Some("woff2") => "font/woff2",
                    Some("svg") => "image/svg+xml",
                    Some("png") => "image/png",
                    _ => "application/octet-stream",
                };
                let _ = req.respond(with_headers(Response::from_data(bytes).with_header(Header::from_bytes("Content-Type", ct).unwrap()), rel == "index.html"));
            }
            Err(_) => {
                let _ = req.respond(Response::from_string("not found").with_status_code(404));
            }
        }
    }
}
