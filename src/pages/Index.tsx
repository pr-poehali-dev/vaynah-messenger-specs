import { useState, useEffect } from "react";
import AuthScreen from "@/components/vainakh/AuthScreen";
import RegisterScreen from "@/components/vainakh/RegisterScreen";
import MainApp from "@/components/vainakh/MainApp";

export type AppScreen = "auth" | "register" | "app";

export interface User {
  id?: number;
  email: string;
  name: string;
  surname: string;
  city: string;
  phone: string;
  birthdate: string;
  about: string;
  avatar: string;
  online: boolean;
}

const defaultUser: User = {
  email: "",
  name: "",
  surname: "",
  city: "",
  phone: "",
  birthdate: "",
  about: "Привет! Я использую ВайНах 👋",
  avatar: "",
  online: true,
};

export type Theme = "dark" | "light";

const SESSION_KEY = "vainakh_session";

function loadSession(): { user: User; screen: AppScreen } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(user: User, screen: AppScreen) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, screen }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export default function Index() {
  const saved = loadSession();
  const [screen, setScreen] = useState<AppScreen>(saved?.screen === "app" ? "app" : "auth");
  const [user, setUser] = useState<User>(saved?.user ?? defaultUser);
  const [loginEmail, setLoginEmail] = useState(saved?.user?.email ?? "");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.classList.add("theme-light");
    else root.classList.remove("theme-light");
  }, [theme]);

  // Сохраняем сессию при каждом изменении
  useEffect(() => {
    if (screen === "app" && user.email) {
      saveSession(user, screen);
    }
  }, [screen, user]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 430,
        height: "100dvh",
        position: "relative",
        overflow: "hidden",
        background: "var(--vn-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Ambient orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -120, right: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(33,150,243,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 80, left: -120, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(21,101,192,0.1) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "35%", left: "30%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(66,165,245,0.07) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {screen === "auth" && (
          <AuthScreen
            onLogin={(email, userData) => {
              setLoginEmail(email);
              const u = { ...defaultUser, ...userData, email };
              setUser(u);
              if (userData?.name) {
                setScreen("app");
                saveSession(u, "app");
              } else {
                setScreen("register");
              }
            }}
          />
        )}
        {screen === "register" && (
          <RegisterScreen
            onContinue={(userData) => {
              const u = { ...user, ...userData };
              setUser(u);
              setScreen("app");
              saveSession(u, "app");
            }}
            user={user}
            setUser={setUser}
            email={loginEmail}
          />
        )}
        {screen === "app" && (
          <MainApp
            user={user}
            setUser={(u) => {
              setUser(u);
              saveSession(u, "app");
            }}
            theme={theme}
            toggleTheme={toggleTheme}
            onLogout={() => {
              clearSession();
              setScreen("auth");
              setUser({ ...defaultUser });
              setLoginEmail("");
            }}
          />
        )}
      </div>
    </div>
  );
}