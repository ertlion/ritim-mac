use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Listener, Manager, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[tauri::command]
fn show_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn hide_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn open_quick_add(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("quick-add") {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }
    WebviewWindowBuilder::new(&app, "quick-add", WebviewUrl::App("index.html#/quick-add".into()))
        .title("Hızlı Görev")
        .inner_size(480.0, 280.0)
        .resizable(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .center()
        .visible(true)
        .focused(true)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn close_quick_add(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("quick-add") {
        win.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_tray_badge(app: AppHandle, count: u32) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let title = if count == 0 {
            None
        } else {
            Some(format!(" {}", count))
        };
        tray.set_title(title.as_deref()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let modifiers = Modifiers::SUPER | Modifiers::SHIFT;
                        let combo = Shortcut::new(Some(modifiers), Code::KeyT);
                        if shortcut == &combo {
                            let _ = open_quick_add(app.clone());
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            let app_handle = app.handle().clone();

            let show_item = MenuItem::with_id(app, "show", "Pencereyi Aç", true, None::<&str>)?;
            let quick_add_item =
                MenuItem::with_id(app, "quick-add", "Hızlı Görev (⌘⇧T)", true, None::<&str>)?;
            let separator1 = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit", "Çıkış", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[&show_item, &quick_add_item, &separator1, &quit_item],
            )?;

            let app_handle_for_menu = app_handle.clone();
            let app_handle_for_tray = app_handle.clone();
            TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .icon_as_template(true)
                .tooltip("Ritim — Görev Hatırlatıcı")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |_, event| match event.id.as_ref() {
                    "show" => {
                        let _ = show_main_window(app_handle_for_menu.clone());
                    }
                    "quick-add" => {
                        let _ = open_quick_add(app_handle_for_menu.clone());
                    }
                    "quit" => {
                        app_handle_for_menu.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(win) = app_handle_for_tray.get_webview_window("main") {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Register global shortcut ⌘⇧T
            let combo = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyT);
            let _ = app.global_shortcut().register(combo);

            // Hide main window on close (only hide, don't quit)
            if let Some(main_win) = app.get_webview_window("main") {
                let main_clone = main_win.clone();
                main_win.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = main_clone.hide();
                    }
                });
            }

            // Re-emit notification action events to frontend
            let emit_handle = app_handle.clone();
            app.listen("notification-action", move |event| {
                let _ = emit_handle.emit("notification-action", event.payload().to_string());
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_main_window,
            hide_main_window,
            open_quick_add,
            close_quick_add,
            set_tray_badge,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
