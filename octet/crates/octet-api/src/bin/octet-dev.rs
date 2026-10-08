//! Serves the interface and the same commands over HTTP, so the app can be
//! worked on in a browser: `cargo run -p octet-api --features dev-server`.

use octet_api::App;
use std::path::{Path, PathBuf};
use tiny_http::{Header, Response, Server};

fn main() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let ui = root.join("app/ui");
    let data = std::env::var("OCTET_DATA").map(PathBuf::from).unwrap_or_else(|_| root.join("target/dev-data/octet.json"));
    let mut app = App::open(&root.join("content"), &data).expect("content loads");
    let port = std::env::var("PORT").unwrap_or_else(|_| "4173".into());
    let server = Server::http(format!("127.0.0.1:{port}")).expect("port is free");
    println!("Octet dev server on http://127.0.0.1:{port} (data in {})", data.display());
    for mut req in server.incoming_requests() {
        let url = req.url().split('?').next().unwrap_or("/").to_string();
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
                    Some("js") => "text/javascript",
                    Some("svg") => "image/svg+xml",
                    Some("png") => "image/png",
                    _ => "application/octet-stream",
                };
                let _ = req.respond(Response::from_data(bytes).with_header(Header::from_bytes("Content-Type", ct).unwrap()));
            }
            Err(_) => {
                let _ = req.respond(Response::from_string("not found").with_status_code(404));
            }
        }
    }
}
