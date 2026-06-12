import { useState, useEffect } from "react";
import AuthScreen from "@/components/vainakh/AuthScreen";
import RegisterScreen from "@/components/vainakh/RegisterScreen";
import MainApp from "@/components/vainakh/MainApp";
import Icon from "@/components/ui/icon";

export type AppScreen = "auth" | "register" | "app";

export interface User {
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

export default function Index() {
  const [screen, setScreen] = useState<AppScreen>("auth");
  const [user, setUser] = useState<User>(defaultUser);
  const [theme, setTheme] = useState<Theme>("dark");
  const [loginEmail, setLoginEmail] = useState("");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("theme-light");
    } else {
      root.classList.remove("theme-light");
    }
  }, [theme]);

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
        transition: "background 0.3s",
      }}
    >
      {/* Ambient orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -120, right: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(33,150,243,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 80, left: -120, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(21,101,192,0.1) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "35%", left: "30%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(66,165,245,0.07) 0%, transparent 70%)" }} />
      </div>

      {/* Theme switcher — top right: single icon button */}
      <div style={{ position: "absolute", top: 14, right: 14, zIndex: 100 }}>
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "var(--vn-card2)",
            border: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            fontSize: "1.1rem",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </div>

      <div style={{ position: "relative", zIndex: 1, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {screen === "auth" && (
          <AuthScreen
            onLogin={(email) => {
              setLoginEmail(email);
              setUser((u) => ({ ...u, email }));
              setScreen("register");
            }}
          />
        )}
        {screen === "register" && (
          <RegisterScreen
            onContinue={() => setScreen("app")}
            user={user}
            setUser={setUser}
            email={loginEmail}
          />
        )}
        {screen === "app" && (
          <MainApp
            user={user}
            setUser={setUser}
            onLogout={() => {
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