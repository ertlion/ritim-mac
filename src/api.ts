import { fetch } from "@tauri-apps/plugin-http";

export const DEFAULT_BASE = "https://task.ertugrulaslan.com";

let baseUrl: string = DEFAULT_BASE;
let token: string | null = null;

export function setBaseUrl(url: string) {
  baseUrl = url.replace(/\/$/, "");
}

export function setToken(t: string | null) {
  token = t;
}

export function getBaseUrl() {
  return baseUrl;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const err = (data as { error?: string })?.error || `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data as T;
}

export type RecurrenceType = "DAILY" | "WEEKLY" | "MONTHLY" | "ONCE";
export type TaskStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export type InstanceStatus = "PENDING" | "SENT" | "DONE" | "SKIPPED" | "SNOOZED" | "MISSED";

export interface User {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
  telegramConnected?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  recurrence: RecurrenceType;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  timeOfDay: string;
  status: TaskStatus;
  nextRunAt: string | null;
  lastRunAt: string | null;
}

export interface Instance {
  id: string;
  taskId: string;
  scheduledFor: string;
  status: InstanceStatus;
  sentAt: string | null;
  completedAt: string | null;
  snoozedUntil: string | null;
  snoozeCount: number;
  task: { id: string; title: string };
}

export interface NewTask {
  title: string;
  description?: string | null;
  recurrence: RecurrenceType;
  daysOfWeek?: number[];
  dayOfMonth?: number | null;
  timeOfDay: string;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ ok: boolean; token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: User }>("/api/auth/me"),
  listTasks: () => request<{ tasks: Task[] }>("/api/tasks"),
  createTask: (data: NewTask) =>
    request<{ task: Task }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: Partial<NewTask> & { status?: TaskStatus }) =>
    request<{ task: Task }>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTask: (id: string) =>
    request<{ ok: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),
  listInstances: (limit = 100) =>
    request<{ instances: Instance[] }>(`/api/instances?limit=${limit}`),
  actionInstance: (
    id: string,
    action: "done" | "skip" | "snooze",
    snoozeMinutes?: number,
  ) =>
    request<{ instance: Instance }>(`/api/instances/${id}/action`, {
      method: "POST",
      body: JSON.stringify({ action, snoozeMinutes }),
    }),
};
