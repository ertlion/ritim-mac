import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "./store";
import { LoginScreen } from "./screens/LoginScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { QuickAddScreen } from "./screens/QuickAddScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { NewTaskScreen } from "./screens/NewTaskScreen";
import { startBackgroundPoller } from "./poller";

function AppShell() {
  const { initialized, init, authToken } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;
    const isQuickAdd = location.pathname === "/quick-add";
    if (isQuickAdd) return;
    if (!authToken && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    } else if (authToken && location.pathname === "/login") {
      navigate("/", { replace: true });
    }
  }, [initialized, authToken, navigate, location.pathname]);

  useEffect(() => {
    if (!authToken) return;
    const stop = startBackgroundPoller();
    return () => stop();
  }, [authToken]);

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-zinc-500">
        Yükleniyor...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/" element={<DashboardScreen />} />
      <Route path="/new" element={<NewTaskScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/quick-add" element={<QuickAddScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppShell />;
}
