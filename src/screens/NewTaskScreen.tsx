import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, RecurrenceType } from "../api";

const DAYS = ["Pzr", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export function NewTaskScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("DAILY");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [timeOfDay, setTimeOfDay] = useState("09:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(d: number) {
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createTask({
        title,
        description: description || null,
        recurrence,
        daysOfWeek: recurrence === "WEEKLY" ? daysOfWeek : [],
        dayOfMonth: recurrence === "MONTHLY" ? dayOfMonth : null,
        timeOfDay,
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex items-center justify-between pl-[78px] pr-4 h-12 border-b border-zinc-200 dark:border-zinc-800 select-none" data-tauri-drag-region>
        <button onClick={() => navigate(-1)} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          ← Geri
        </button>
        <span className="font-semibold">Yeni Görev</span>
        <span className="w-12"></span>
      </header>
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-zinc-500">Başlık</label>
          <input
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ör. Sabah e-postaları kontrol et"
            className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 text-sm"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider text-zinc-500">Açıklama</label>
          <textarea
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-zinc-500">Tekrar</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 text-sm"
            >
              <option value="DAILY">Her gün</option>
              <option value="WEEKLY">Haftalık</option>
              <option value="MONTHLY">Aylık</option>
              <option value="ONCE">Tek sefer</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-zinc-500">Saat</label>
            <input
              type="time"
              required
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 text-sm"
            />
          </div>
        </div>
        {recurrence === "WEEKLY" && (
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-zinc-500">Günler</label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`h-8 px-2.5 rounded-md text-xs border ${
                    daysOfWeek.includes(idx)
                      ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        )}
        {recurrence === "MONTHLY" && (
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-zinc-500">Ayın günü</label>
            <input
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
              className="w-24 h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 text-sm"
            />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : "Oluştur"}
        </button>
      </form>
    </div>
  );
}
