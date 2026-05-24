import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { api } from "../api";
import { useAppStore } from "../store";

export function QuickAddScreen() {
  const init = useAppStore((s) => s.init);
  const initialized = useAppStore((s) => s.initialized);
  const authToken = useAppStore((s) => s.authToken);
  const [title, setTitle] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("09:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialized) init();
  }, [init, initialized]);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  async function close() {
    await invoke("close_quick_add").catch(() => {});
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authToken) {
      setError("Giriş yapılmamış. Ana pencereden giriş yap.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.createTask({
        title,
        recurrence: "DAILY",
        timeOfDay,
      });
      await close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  return (
    <div className="h-screen p-4 flex items-center" onKeyDown={onKeyDown}>
      <form onSubmit={onSubmit} className="w-full space-y-3">
        <div className="text-xs uppercase tracking-wider text-zinc-500" data-tauri-drag-region>
          Hızlı Görev (her gün)
        </div>
        <input
          ref={titleRef}
          type="text"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Görev başlığı..."
          className="w-full h-12 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 text-lg outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-500">Saat:</label>
          <input
            type="time"
            required
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="h-9 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={close}
            className="flex-1 h-9 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm"
          >
            İptal (Esc)
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="flex-1 h-9 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "..." : "Oluştur ↵"}
          </button>
        </div>
      </form>
    </div>
  );
}
