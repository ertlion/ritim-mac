import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { invoke } from "@tauri-apps/api/core";
import { api } from "./api";

const POLL_INTERVAL_MS = 60_000;
const notifiedIds = new Set<string>();

async function ensureNotificationPermission(): Promise<boolean> {
  let granted = await isPermissionGranted();
  if (!granted) {
    const result = await requestPermission();
    granted = result === "granted";
  }
  return granted;
}

async function tick() {
  try {
    const { instances } = await api.listInstances(50);
    const pending = instances.filter(
      (i) => i.status === "PENDING" || i.status === "SENT" || i.status === "SNOOZED",
    );

    invoke("set_tray_badge", { count: pending.length }).catch(() => {});

    const now = Date.now();
    const due = instances.filter(
      (i) =>
        (i.status === "PENDING" || i.status === "SENT") &&
        new Date(i.scheduledFor).getTime() <= now &&
        !notifiedIds.has(i.id),
    );

    if (due.length === 0) return;

    const allowed = await ensureNotificationPermission();
    if (!allowed) return;

    for (const inst of due) {
      sendNotification({
        title: inst.task.title,
        body: "Yapıldı mı? Ritim'i aç ve aksiyonu seç.",
      });
      notifiedIds.add(inst.id);
    }
  } catch (e) {
    console.error("poll failed", e);
  }
}

export function startBackgroundPoller(): () => void {
  void tick();
  const id = setInterval(tick, POLL_INTERVAL_MS);
  return () => clearInterval(id);
}
