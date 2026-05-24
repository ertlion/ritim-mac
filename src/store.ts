import { create } from "zustand";
import { LazyStore } from "@tauri-apps/plugin-store";
import { api, DEFAULT_BASE, setBaseUrl, setToken, User } from "./api";

const STORE_FILE = "ritim-settings.json";
const KEY_TOKEN = "auth_token";
const KEY_BASE_URL = "base_url";

const tauriStore = new LazyStore(STORE_FILE);

interface AppState {
  initialized: boolean;
  authToken: string | null;
  user: User | null;
  baseUrl: string;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setBaseUrl: (url: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  authToken: null,
  user: null,
  baseUrl: DEFAULT_BASE,

  async init() {
    const savedBaseUrl =
      ((await tauriStore.get<string>(KEY_BASE_URL)) as string | undefined) || DEFAULT_BASE;
    const savedToken =
      ((await tauriStore.get<string>(KEY_TOKEN)) as string | undefined) || null;
    setBaseUrl(savedBaseUrl);
    setToken(savedToken);
    set({ baseUrl: savedBaseUrl, authToken: savedToken });

    if (savedToken) {
      try {
        const { user } = await api.me();
        set({ user });
      } catch {
        setToken(null);
        await tauriStore.delete(KEY_TOKEN);
        await tauriStore.save();
        set({ authToken: null, user: null });
      }
    }
    set({ initialized: true });
  },

  async login(email, password) {
    const { token, user } = await api.login(email, password);
    setToken(token);
    await tauriStore.set(KEY_TOKEN, token);
    await tauriStore.save();
    set({ authToken: token, user });
  },

  async logout() {
    setToken(null);
    await tauriStore.delete(KEY_TOKEN);
    await tauriStore.save();
    set({ authToken: null, user: null });
  },

  async refreshUser() {
    try {
      const { user } = await api.me();
      set({ user });
    } catch (e) {
      if (e instanceof Error && e.message.includes("UNAUTHORIZED")) {
        await get().logout();
      }
    }
  },

  async setBaseUrl(url) {
    setBaseUrl(url);
    await tauriStore.set(KEY_BASE_URL, url);
    await tauriStore.save();
    set({ baseUrl: url });
  },
}));
