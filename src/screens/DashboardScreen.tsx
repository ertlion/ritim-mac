import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, Instance, Task } from "../api";
import { useAppStore } from "../store";
import { invoke } from "@tauri-apps/api/core";

const RECUR_LABEL: Record<string, string> = {
  DAILY: "Her gün",
  WEEKLY: "Haftalık",
  MONTHLY: "Aylık",
  ONCE: "Tek sefer",
};

function fmtTime(iso: string | null, tz: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
}

export function DashboardScreen() {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [tasksRes, instRes] = await Promise.all([
        api.listTasks(),
        api.listInstances(50),
      ]);
      setTasks(tasksRes.tasks);
      setInstances(instRes.instances);

      const pending = instRes.instances.filter(
        (i) => i.status === "PENDING" || i.status === "SENT" || i.status === "SNOOZED",
      ).length;
      invoke("set_tray_badge", { count: pending }).catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  async function act(instId: string, action: "done" | "skip" | "snooze", minutes?: number) {
    setActingId(instId);
    try {
      await api.actionInstance(instId, action, minutes);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActingId(null);
    }
  }

  const tz = user?.timezone || "Europe/Istanbul";
  const pendingInstances = instances.filter(
    (i) => i.status === "PENDING" || i.status === "SENT" || i.status === "SNOOZED",
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex items-center justify-between px-4 h-12 border-b border-zinc-200 dark:border-zinc-800 select-none" data-tauri-drag-region>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Ritim</span>
          {user && <span className="text-xs text-zinc-500">{user.email}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/new")}
            className="h-7 px-2.5 text-xs rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            title="⌘⇧T"
          >
            + Yeni
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="h-7 px-2 text-xs rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ⚙
          </button>
          <button
            onClick={logout}
            className="h-7 px-2 text-xs rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            ↩
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-500">Yükleniyor...</div>
        ) : (
          <>
            <section className="p-4">
              <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                Bekleyen ({pendingInstances.length})
              </h2>
              {pendingInstances.length === 0 ? (
                <p className="text-sm text-zinc-500 px-2">Şu an bekleyen hatırlatma yok.</p>
              ) : (
                <ul className="space-y-2">
                  {pendingInstances.map((inst) => (
                    <li
                      key={inst.id}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{inst.task.title}</p>
                          <p className="text-xs text-zinc-500">
                            {fmtTime(inst.scheduledFor, tz)}
                            {inst.snoozeCount > 0 && ` • ${inst.snoozeCount}x ertelendi`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          disabled={actingId === inst.id}
                          onClick={() => act(inst.id, "done")}
                          className="h-7 px-2 text-xs rounded bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-200 dark:hover:bg-green-900/60 disabled:opacity-50"
                        >
                          ✓ Yapıldı
                        </button>
                        <button
                          disabled={actingId === inst.id}
                          onClick={() => act(inst.id, "snooze", 15)}
                          className="h-7 px-2 text-xs rounded bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 disabled:opacity-50"
                        >
                          15dk
                        </button>
                        <button
                          disabled={actingId === inst.id}
                          onClick={() => act(inst.id, "snooze", 60)}
                          className="h-7 px-2 text-xs rounded bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 disabled:opacity-50"
                        >
                          1sa
                        </button>
                        <button
                          disabled={actingId === inst.id}
                          onClick={() => act(inst.id, "snooze", 180)}
                          className="h-7 px-2 text-xs rounded bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 disabled:opacity-50"
                        >
                          3sa
                        </button>
                        <button
                          disabled={actingId === inst.id}
                          onClick={() => act(inst.id, "skip")}
                          className="h-7 px-2 text-xs rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 disabled:opacity-50"
                        >
                          Atla
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="p-4 border-t border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                Tüm Görevler ({tasks.length})
              </h2>
              {tasks.length === 0 ? (
                <p className="text-sm text-zinc-500 px-2">Henüz görev yok. + Yeni ile oluştur.</p>
              ) : (
                <ul className="space-y-1.5">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          {task.status !== "ACTIVE" && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {task.status === "PAUSED" ? "Duraklatıldı" : "Arşiv"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">
                          {RECUR_LABEL[task.recurrence]} • {task.timeOfDay}
                          {task.nextRunAt && task.status === "ACTIVE" && (
                            <> • Sıradaki: {fmtTime(task.nextRunAt, tz)}</>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
