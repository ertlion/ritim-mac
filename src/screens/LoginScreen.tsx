import { useState } from "react";
import { useAppStore } from "../store";

export function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const baseUrl = useAppStore((s) => s.baseUrl);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 select-none">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Ritim</h1>
          <p className="text-sm text-zinc-500 mt-1">Görev hatırlatıcı</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <input
            type="password"
            placeholder="Şifre"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş yap"}
          </button>
        </form>
        <p className="text-xs text-zinc-500 text-center">
          Sunucu: <span className="font-mono">{baseUrl}</span>
        </p>
        <p className="text-xs text-zinc-500 text-center">
          Hesabın yok mu? Web panelden kayıt ol.
        </p>
      </div>
    </div>
  );
}
