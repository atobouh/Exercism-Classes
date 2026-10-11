// Octet's desktop shell. The interface in `app/ui` talks to Rust through a
// single command, `api`, which hands every call to `octet_api::App`.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::Manager;

struct State(Mutex<octet_api::App>);
/// The reading voice has its own state, so making speech never holds up the rest of Octet.
struct VoiceState(Arc<octet_api::voice::Voice>);

#[tauri::command]
fn api(state: tauri::State<'_, State>, cmd: String, args: serde_json::Value) -> Result<serde_json::Value, String> {
    let mut app = state.0.lock().map_err(|_| "Octet hit an internal error. Restart it to continue.".to_string())?;
    app.call(&cmd, &args)
}

/// The voice model: `status`, `install` (downloads in the background) or `remove`.
#[tauri::command(async)]
fn voice(state: tauri::State<'_, VoiceState>, cmd: String) -> Result<serde_json::Value, String> {
    Ok(match cmd.as_str() {
        "install" => state.0.install(),
        "remove" => state.0.remove(),
        _ => state.0.status(),
    })
}

/// Token ids and a style vector in, a WAV file out, as raw bytes.
#[tauri::command(async)]
fn voice_say(state: tauri::State<'_, VoiceState>, ids: Vec<i64>, style: Vec<f32>, speed: Option<f32>) -> Result<tauri::ipc::Response, String> {
    state.0.say(&ids, &style, speed.unwrap_or(1.0)).map(tauri::ipc::Response::new)
}

/// Bundled content in an installed app, the repo's `content/` while developing.
fn content_dir(app: &tauri::App) -> PathBuf {
    let bundled = app.path().resource_dir().map(|d| d.join("content")).ok();
    match bundled {
        Some(d) if d.join("books").is_dir() => d,
        _ => PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../content"),
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let content = content_dir(app);
            let data = app.path().app_data_dir()?.join("octet.json");
            let mut state = octet_api::App::open(&content, &data)?;
            if let Ok(dir) = app.path().download_dir() {
                state.set_downloads(dir);
            }
            app.manage(State(Mutex::new(state)));
            app.manage(VoiceState(octet_api::voice::Voice::new(app.path().app_data_dir()?.join("voice"))));
            // The interface shows the window once it has drawn. If that never
            // happens, show it anyway so Octet can't start invisible.
            if let Some(win) = app.get_webview_window("main") {
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(3));
                    if !win.is_visible().unwrap_or(true) {
                        let _ = win.show();
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![api, voice, voice_say])
        .run(tauri::generate_context!())
        .expect("Octet could not start");
}
