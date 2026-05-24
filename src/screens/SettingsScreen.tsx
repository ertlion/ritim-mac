import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";

export function SettingsScreen() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const baseUrl = useAppStore((s) => s.baseUrl);
  const setBase = useAppStore((s) => s.setBaseUrl);
  const logout = useAppStore((s) => s.logout);
  const [editingUrl, setEditingUrl] = useState(baseUrl);
  const [saved, setSaved] = useState(false);

  async function saveUrl() {
    await setBase(editingUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex items-center justify-between pl-[78px] pr-4 h-12 border-b border-zinc-200 dark:border-zinc-800 select-none" data-tauri-drag-region>
        <button onClick={() => navigate(-1)} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          ← Geri
        </button>
        <span className="font-semibold">Ayarlar</span>
        <span className="w-12"></span>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider text-zinc-500">Hesap</h2>
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Email</span>
              <span>{user?.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">İsim</span>
              <span>{user?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Saat dilimi</span>
              <span>{user?.timezone || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Telegram</span>
              <span>{user?.telegramConnected ? "✓ Bağlı" : "Bağlı değil"}</span>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider text-zinc-500">Sunucu URL</h2>
          <div className="flex gap-2">
            <input
              type="url"
              value={editingUrl}
              onChange={(e) => setEditingUrl(e.target.value)}
              className="flex-1 h-9 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 text-sm font-mono"
            />
            <button
              onClick={saveUrl}
              className="h-9 px-3 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm"
            >
              {saved ? "✓" : "Kaydet"}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Self-hosted Ritim sunucun varsa burada değiştirebilirsin.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider text-zinc-500">Kısayollar</h2>
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Hızlı görev</span>
              <kbd className="text-xs font-mono">⌘ ⇧ T</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Menü bar tıkla</span>
              <span className="text-xs">Pencereyi aç/kapa</span>
            </div>
          </div>
        </section>

        <button
          onClick={logout}
          className="w-full h-10 rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
        >
          Çıkış yap
        </button>
      </div>
    </div>
  );
}
