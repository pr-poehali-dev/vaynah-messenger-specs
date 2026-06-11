import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onLogin: (email: string) => void;
}

const MAIL_DOMAINS = ["mail.ru", "inbox.ru", "list.ru", "bk.ru"];

export default function AuthScreen({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [codeSent, setCodeSent] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState("");
  const [restoreSent, setRestoreSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const isMailRu = (val: string) => MAIL_DOMAINS.some((d) => val.toLowerCase().endsWith("@" + d));

  const handleSendPassword = () => {
    if (!email) { setEmailError("Введите email"); return; }
    if (!isMailRu(email)) { setEmailError("Допустимы только адреса mail.ru, inbox.ru, list.ru, bk.ru"); return; }
    setEmailError("");
    setCodeSent(true);
    setStep("password");
  };

  const handleLogin = () => {
    if (!password) return;
    onLogin(email);
  };

  // RESTORE SCREEN
  if (showRestore) {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "2rem 1.5rem" }}>
        <button
          onClick={() => { setShowRestore(false); setRestoreSent(false); setRestoreEmail(""); }}
          style={{ color: "var(--vn-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: "2.5rem", width: "fit-content" }}
        >
          <Icon name="ArrowLeft" size={18} />
          <span style={{ fontSize: "0.9rem" }}>Назад</span>
        </button>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--vn-blue) 0%, var(--vn-blue-light) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.2rem",
                boxShadow: "0 0 0 8px rgba(33,150,243,0.12), 0 16px 40px rgba(33,150,243,0.3)",
              }}
            >
              <Icon name="KeyRound" size={30} color="white" />
            </div>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.6rem", marginBottom: "0.5rem" }} className="vn-gradient-text">
              Восстановление
            </h2>
            <p style={{ color: "var(--vn-muted)", fontSize: "0.9rem" }}>
              Введи email — вышлем новый пароль
            </p>
          </div>

          {!restoreSent ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ position: "relative" }}>
                  <Icon name="Mail" size={17} color="var(--vn-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    className="vn-input"
                    type="email"
                    placeholder="example@mail.ru"
                    value={restoreEmail}
                    onChange={(e) => setRestoreEmail(e.target.value)}
                    style={{ paddingLeft: "2.8rem" }}
                  />
                </div>
              </div>
              <button className="vn-btn" onClick={() => restoreEmail && setRestoreSent(true)}>
                Отправить новый пароль
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(46,204,113,0.08)",
                border: "1px solid rgba(46,204,113,0.3)",
                borderRadius: "1rem",
                padding: "1.8rem",
                textAlign: "center",
                animation: "vn-scale-in 0.3s ease",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
              <p style={{ color: "#2ECC71", fontWeight: 700, fontSize: "1rem" }}>Пароль отправлен!</p>
              <p style={{ color: "var(--vn-muted)", fontSize: "0.85rem", marginTop: "0.4rem" }}>
                Проверь почту <span style={{ color: "var(--vn-text)", fontWeight: 600 }}>{restoreEmail}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MAIN AUTH
  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "1.5rem" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "30px",
              background: "linear-gradient(145deg, var(--vn-blue) 0%, var(--vn-blue-light) 60%, var(--vn-blue-bright) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.4rem",
              animation: "vn-float 4s ease-in-out infinite",
              boxShadow: "0 0 0 6px rgba(33,150,243,0.1), 0 0 0 14px rgba(33,150,243,0.05), 0 20px 50px rgba(21,101,192,0.5)",
            }}
          >
            {/* Blue-white logo: mountain + text W */}
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 40 L16 20 L22 32 L26 24 L30 32 L36 20 L46 40 Z" fill="white" opacity="0.95"/>
              <path d="M16 20 L22 32 L26 24 L30 32 L36 20" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none"/>
              <circle cx="26" cy="13" r="4" fill="rgba(255,255,255,0.7)"/>
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "Montserrat",
              fontWeight: 900,
              fontSize: "2.4rem",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}
            className="vn-gradient-text"
          >
            ВайНах
          </h1>
          <p style={{ color: "var(--vn-muted)", fontSize: "0.88rem", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 500 }}>
            Мессенджер твоего народа
          </p>
        </div>

        {/* FORM */}
        <div
          style={{
            background: "var(--vn-card)",
            border: "1px solid var(--vn-border)",
            borderRadius: "1.5rem",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {step === "email" ? (
            <>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--vn-muted)", marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Icon name="Mail" size={13} color="var(--vn-muted)" />
                  Email (только Mail.ru)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    className="vn-input"
                    type="email"
                    placeholder="example@mail.ru"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSendPassword()}
                    autoComplete="email"
                  />
                  {email && isMailRu(email) && (
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                      <Icon name="CheckCircle" size={18} color="#2ECC71" />
                    </div>
                  )}
                </div>
                {emailError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, color: "#E74C3C", fontSize: "0.78rem" }}>
                    <Icon name="AlertCircle" size={13} color="#E74C3C" />
                    {emailError}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: "0.5rem", flexWrap: "wrap" }}>
                  {MAIL_DOMAINS.map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        const local = email.includes("@") ? email.split("@")[0] : email;
                        setEmail(local + "@" + d);
                        setEmailError("");
                      }}
                      style={{
                        fontSize: "0.72rem",
                        background: "var(--vn-card2)",
                        border: "1px solid var(--vn-border)",
                        borderRadius: "50px",
                        padding: "0.2rem 0.55rem",
                        color: "var(--vn-muted)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget.style.borderColor = "var(--vn-blue-light)"); (e.currentTarget.style.color = "var(--vn-blue-bright)"); }}
                      onMouseLeave={(e) => { (e.currentTarget.style.borderColor = "var(--vn-border)"); (e.currentTarget.style.color = "var(--vn-muted)"); }}
                    >
                      @{d}
                    </button>
                  ))}
                </div>
              </div>

              <button className="vn-btn" onClick={handleSendPassword} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Icon name="Send" size={16} color="white" />
                Получить пароль на почту
              </button>
            </>
          ) : (
            <>
              {/* Step 2: password arrived */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(33,150,243,0.08)",
                  border: "1px solid rgba(33,150,243,0.25)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                }}
              >
                <Icon name="CheckCircle" size={18} color="var(--vn-blue-bright)" />
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--vn-text)" }}>Пароль отправлен!</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--vn-muted)" }}>{email}</div>
                </div>
                <button
                  onClick={() => setStep("email")}
                  style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--vn-muted)", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}
                >
                  Изменить
                </button>
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--vn-muted)", marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Icon name="Lock" size={13} color="var(--vn-muted)" />
                  Пароль из письма
                </label>
                <input
                  className="vn-input"
                  type="password"
                  placeholder="Введи пароль из письма"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  autoFocus
                />
              </div>

              <button className="vn-btn" onClick={handleLogin} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Icon name="LogIn" size={17} color="white" />
                Войти в ВайНах
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", paddingBottom: "1.2rem", paddingTop: "0.8rem" }}>
        <button
          onClick={() => setShowRestore(true)}
          style={{ background: "none", border: "none", color: "var(--vn-blue-bright)", cursor: "pointer", fontSize: "0.88rem", fontFamily: "Golos Text", fontWeight: 500 }}
        >
          Восстановить доступ к аккаунту
        </button>
      </div>
    </div>
  );
}
