import { useState } from "react";
import AuthScreen from "@/components/vainakh/AuthScreen";
import RegisterScreen from "@/components/vainakh/RegisterScreen";
import MainApp from "@/components/vainakh/MainApp";

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
  email: "user@example.com",
  name: "Ахмед",
  surname: "Мусаев",
  city: "Грозный",
  phone: "+7 928 123-45-67",
  birthdate: "1998-05-14",
  about: "Привет! Я использую ВайНах 👋",
  avatar: "",
  online: true,
};

export default function Index() {
  const [screen, setScreen] = useState<AppScreen>("auth");
  const [user, setUser] = useState<User>(defaultUser);

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
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <div style={{ position: "absolute", top: -100, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 100, left: -100, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,89,182,0.1) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", left: "40%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,63,212,0.08) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {screen === "auth" && <AuthScreen onLogin={() => setScreen("register")} />}
        {screen === "register" && <RegisterScreen onContinue={() => setScreen("app")} user={user} setUser={setUser} />}
        {screen === "app" && <MainApp user={user} setUser={setUser} />}
      </div>
    </div>
  );
}
