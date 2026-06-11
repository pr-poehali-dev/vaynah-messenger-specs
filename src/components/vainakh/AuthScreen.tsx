import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onLogin: () => void;
}

export default function AuthScreen({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordSent, setPasswordSent] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState("");
  const [restoreSent, setRestoreSent] = useState(false);

  const handleSendPassword = () => {
    if (!email) return;
    setPasswordSent(true);
  };

  const handleLogin = () => {
    if (!email || !password) return;
    onLogin();
  };

  if (showRestore) {
    return (
      <div className="vn-screen flex flex-col h-full" style={{ padding: "2rem 1.5rem" }}>
        <button
          onClick={() => { setShowRestore(false); setRestoreSent(false); }}
          style={{ color: "var(--vn-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: "2rem", width: "fit-content" }}
        >
          <Icon name="ArrowLeft" size={18} />
          <span style={{ fontSize: "0.9rem" }}>Назад</span>
        </button>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--vn-indigo), var(--vn-purple))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Icon name="KeyRound" size={28} color="white" />
            </div>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>
              Восстановление
            </h2>
            <p style={{ color: "var(--vn-muted)", fontSize: "0.9rem" }}>
              Введи email, мы вышлем новый пароль
            </p>
          </div>

          {!restoreSent ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                className="vn-input"
                type="email"
                placeholder="Email"
                value={restoreEmail}
                onChange={(e) => setRestoreEmail(e.target.value)}
              />
              <button className="vn-btn" onClick={() => setRestoreSent(true)}>
                Отправить пароль
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(46,204,113,0.1)",
                border: "1px solid rgba(46,204,113,0.3)",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
              <p style={{ color: "#2ECC71", fontWeight: 600 }}>Пароль отправлен!</p>
              <p style={{ color: "var(--vn-muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                Проверь почту {restoreEmail}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="vn-screen flex flex-col h-full" style={{ padding: "2rem 1.5rem" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "28px",
              background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink), var(--vn-indigo))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.2rem",
              animation: "vn-float 3s ease-in-out infinite",
              boxShadow: "0 20px 40px rgba(255,107,53,0.3)",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>🏔</span>
          </div>
          <h1
            style={{
              fontFamily: "Montserrat",
              fontWeight: 900,
              fontSize: "2.2rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}
            className="vn-gradient-text"
          >
            ВайНах
          </h1>
          <p style={{ color: "var(--vn-muted)", fontSize: "0.9rem" }}>
            Мессенджер твоего народа
          </p>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--vn-muted)", marginBottom: "0.4rem", fontWeight: 500 }}>
              Email
            </label>
            <input
              className="vn-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            className="vn-btn"
            style={{
              background: passwordSent
                ? "linear-gradient(135deg, #2ECC71, #27AE60)"
                : "linear-gradient(135deg, var(--vn-indigo), var(--vn-purple))",
            }}
            onClick={handleSendPassword}
          >
            {passwordSent ? "✅ Пароль отправлен" : "Получить пароль"}
          </button>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--vn-muted)", marginBottom: "0.4rem", fontWeight: 500 }}>
              Пароль
            </label>
            <input
              className="vn-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="vn-btn" onClick={handleLogin}>
            Войти
          </button>
        </div>
      </div>

      <div style={{ textAlign: "center", paddingBottom: "1rem" }}>
        <button
          onClick={() => setShowRestore(true)}
          style={{
            background: "none",
            border: "none",
            color: "var(--vn-orange)",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontFamily: "Golos Text",
            textDecoration: "underline",
          }}
        >
          Восстановить доступ к аккаунту
        </button>
      </div>
    </div>
  );
}
