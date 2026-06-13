import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import func2url from "@/api";

interface UserData {
  id?: number;
  name?: string;
  surname?: string;
  city?: string;
  birthdate?: string;
  about?: string;
  phone?: string;
}

interface Props {
  onLogin: (email: string, userData?: UserData) => void;
}

const MAIL_DOMAINS = ["mail.ru", "inbox.ru", "list.ru", "bk.ru"];

export default function AuthScreen({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState("");
  const [restoreSent, setRestoreSent] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const isMailRu = (val: string) =>
    MAIL_DOMAINS.some((d) => val.toLowerCase().endsWith("@" + d));

  const sendCode = async () => {
    if (!email) { setEmailError("Введите email"); return; }
    if (!isMailRu(email)) {
      setEmailError("Только адреса mail.ru, inbox.ru, list.ru, bk.ru");
      return;
    }
    setEmailError("");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(func2url["send-code"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.ok) {
        setStep("code");
        setCountdown(60);
        setCode(["", "", "", ""]);
        // В dev-режиме показываем код (когда SMTP не настроен)
        if (data.dev_code) setDevCode(data.dev_code);
        else setDevCode(null);
        setTimeout(() => inputRefs[0].current?.focus(), 100);
      } else {
        setError(data.error || "Ошибка отправки");
      }
    } catch {
      setError("Нет соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 4) { setError("Введите все 4 цифры"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(func2url["verify-code"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: fullCode }),
      });
      const data = await res.json();
      if (data.ok) {
        onLogin(email.trim().toLowerCase(), data.user);
      } else {
        setError(data.error || "Неверный код");
        setCode(["", "", "", ""]);
        inputRefs[0].current?.focus();
      }
    } catch {
      setError("Нет соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  // Handle code input per digit
  const handleCodeInput = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    setError("");
    if (digit && i < 3) {
      inputRefs[i + 1].current?.focus();
    }
    // Auto-verify when all 4 filled
    if (digit && i === 3 && next.every((d) => d !== "")) {
      const fullCode = next.join("");
      setTimeout(async () => {
        setLoading(true);
        try {
          const res = await fetch(func2url["verify-code"], {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim().toLowerCase(), code: fullCode }),
          });
          const data = await res.json();
          if (data.ok) onLogin(email.trim().toLowerCase(), data.user);
          else { setError(data.error || "Неверный код"); setCode(["", "", "", ""]); inputRefs[0].current?.focus(); }
        } catch {
          setError("Нет соединения.");
        } finally {
          setLoading(false);
        }
      }, 150);
    }
  };

  const handleCodeKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputRefs[i - 1].current?.focus();
    }
    if (e.key === "Enter") verifyCode();
  };

  // ── RESTORE ────────────────────────────────────────────────────────────────
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
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem", boxShadow: "0 0 0 8px rgba(33,150,243,0.12),0 16px 40px rgba(33,150,243,0.3)" }}>
              <Icon name="KeyRound" size={30} color="white" />
            </div>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.6rem", marginBottom: "0.5rem" }} className="vn-gradient-text">
              Восстановление доступа
            </h2>
            <p style={{ color: "var(--vn-muted)", fontSize: "0.9rem" }}>
              Введи email — вышлем новый код
            </p>
          </div>
          {!restoreSent ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ position: "relative" }}>
                <Icon name="Mail" size={17} color="var(--vn-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input className="vn-input" type="email" placeholder="example@mail.ru" value={restoreEmail} onChange={(e) => setRestoreEmail(e.target.value)} style={{ paddingLeft: "2.8rem" }} />
              </div>
              <button className="vn-btn" onClick={() => restoreEmail && setRestoreSent(true)}>
                Отправить код для входа
              </button>
            </div>
          ) : (
            <div style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: "1rem", padding: "1.8rem", textAlign: "center", animation: "vn-scale-in 0.3s ease" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
              <p style={{ color: "#2ECC71", fontWeight: 700 }}>Код отправлен!</p>
              <p style={{ color: "var(--vn-muted)", fontSize: "0.85rem", marginTop: "0.4rem" }}>
                Проверь почту <span style={{ color: "var(--vn-text)", fontWeight: 600 }}>{restoreEmail}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LOGO ─────────────────────────────────────────────────────────────────
  const Logo = () => (
    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
      <div style={{
        width: 88, height: 88, borderRadius: "26px",
        background: "linear-gradient(145deg,var(--vn-blue) 0%,var(--vn-blue-light) 60%,var(--vn-blue-bright) 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 1.2rem",
        animation: "vn-float 4s ease-in-out infinite",
        boxShadow: "0 0 0 6px rgba(33,150,243,0.1),0 0 0 14px rgba(33,150,243,0.05),0 20px 50px rgba(21,101,192,0.5)",
      }}>
        <svg width="48" height="48" viewBox="0 0 52 52" fill="none">
          <path d="M6 40 L16 20 L22 32 L26 24 L30 32 L36 20 L46 40 Z" fill="white" opacity="0.95"/>
          <circle cx="26" cy="13" r="4" fill="rgba(255,255,255,0.7)"/>
        </svg>
      </div>
      <h1 className="vn-gradient-text" style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: "2.2rem", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "0.4rem" }}>
        ВайНах
      </h1>
      <p style={{ color: "var(--vn-muted)", fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
        Мессенджер твоего народа
      </p>
    </div>
  );

  // ── STEP: EMAIL ───────────────────────────────────────────────────────────
  if (step === "email") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "1.5rem" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Logo />
          <div style={{ background: "var(--vn-card)", border: "1px solid var(--vn-border)", borderRadius: "1.5rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--vn-muted)", marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Icon name="Mail" size={13} color="var(--vn-muted)" />
                Email
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="vn-input"
                  type="email"
                  placeholder="example@mail.ru"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                  autoComplete="email"
                  autoFocus
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
              {/* Domain quick-tap */}
              <div style={{ display: "flex", gap: 5, marginTop: "0.5rem", flexWrap: "wrap" }}>
                {MAIL_DOMAINS.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      const local = email.includes("@") ? email.split("@")[0] : email;
                      setEmail(local + "@" + d);
                      setEmailError("");
                    }}
                    style={{ fontSize: "0.72rem", background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "50px", padding: "0.2rem 0.55rem", color: "var(--vn-muted)", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget.style.borderColor = "var(--vn-blue-light)"); (e.currentTarget.style.color = "var(--vn-blue-bright)"); }}
                    onMouseLeave={(e) => { (e.currentTarget.style.borderColor = "var(--vn-border)"); (e.currentTarget.style.color = "var(--vn-muted)"); }}
                  >
                    @{d}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="vn-btn"
              onClick={sendCode}
              disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "vn-spin-slow 0.8s linear infinite" }} />
              ) : (
                <Icon name="Send" size={16} color="white" />
              )}
              {loading ? "Отправляю код..." : "Получить код на почту"}
            </button>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#E74C3C", fontSize: "0.82rem", background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.25)", borderRadius: "0.65rem", padding: "0.65rem 0.9rem" }}>
                <Icon name="AlertCircle" size={15} color="#E74C3C" />
                {error}
              </div>
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

  // ── STEP: CODE ────────────────────────────────────────────────────────────
  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "1.5rem" }}>
      <button
        onClick={() => { setStep("email"); setError(""); setCode(["", "", "", ""]); setDevCode(null); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem", width: "fit-content" }}
      >
        <Icon name="ArrowLeft" size={18} />
        <span style={{ fontSize: "0.9rem" }}>Назад</span>
      </button>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Icon */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem", boxShadow: "0 0 0 8px rgba(33,150,243,0.12),0 16px 40px rgba(33,150,243,0.3)", animation: "vn-float 3s ease-in-out infinite" }}>
            <Icon name="MailOpen" size={30} color="white" />
          </div>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }} className="vn-gradient-text">
            Введи код из письма
          </h2>
          <p style={{ color: "var(--vn-muted)", fontSize: "0.88rem" }}>
            Отправили 4-значный код на
          </p>
          <p style={{ color: "var(--vn-blue-bright)", fontWeight: 600, fontSize: "0.9rem", marginTop: 3 }}>
            {email}
          </p>
        </div>

        {/* Dev code hint */}
        {devCode && (
          <div style={{ background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.4)", borderRadius: "0.75rem", padding: "0.7rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            onClick={() => {
              const digits = devCode.split("");
              setCode(digits);
              setError("");
            }}
          >
            <Icon name="Lightbulb" size={16} color="#FFC107" />
            <div>
              <div style={{ fontSize: "0.75rem", color: "#FFC107", fontWeight: 600 }}>SMTP не настроен · режим разработки</div>
              <div style={{ fontSize: "0.82rem", color: "var(--vn-text)" }}>Код: <strong>{devCode}</strong> <span style={{ color: "var(--vn-muted)", fontSize: "0.75rem" }}>(нажми чтобы вставить)</span></div>
            </div>
          </div>
        )}

        {/* 4-digit input */}
        <div style={{ background: "var(--vn-card)", border: "1px solid var(--vn-border)", borderRadius: "1.5rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeInput(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                style={{
                  width: 58,
                  height: 68,
                  borderRadius: "0.9rem",
                  border: `2px solid ${digit ? "var(--vn-blue-light)" : "var(--vn-border)"}`,
                  background: digit ? "rgba(33,150,243,0.08)" : "var(--vn-card2)",
                  color: "var(--vn-text)",
                  fontSize: "1.8rem",
                  fontFamily: "Montserrat",
                  fontWeight: 700,
                  textAlign: "center",
                  outline: "none",
                  transition: "all 0.15s",
                  caretColor: "var(--vn-blue-bright)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--vn-blue-bright)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = digit ? "var(--vn-blue-light)" : "var(--vn-border)")}
              />
            ))}
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#E74C3C", fontSize: "0.82rem", background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.25)", borderRadius: "0.65rem", padding: "0.65rem 0.9rem" }}>
              <Icon name="AlertCircle" size={15} color="#E74C3C" />
              {error}
            </div>
          )}

          <button
            className="vn-btn"
            onClick={verifyCode}
            disabled={loading || code.some((d) => !d)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading || code.some((d) => !d) ? 0.55 : 1, cursor: loading || code.some((d) => !d) ? "not-allowed" : "pointer" }}
          >
            {loading ? (
              <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "vn-spin-slow 0.8s linear infinite" }} />
            ) : (
              <Icon name="LogIn" size={17} color="white" />
            )}
            {loading ? "Проверяю..." : "Войти в ВайНах"}
          </button>
        </div>

        {/* Resend */}
        <div style={{ textAlign: "center", marginTop: "1.2rem" }}>
          {countdown > 0 ? (
            <span style={{ color: "var(--vn-muted)", fontSize: "0.85rem" }}>
              Выслать повторно через <span style={{ color: "var(--vn-blue-bright)", fontWeight: 600 }}>{countdown} сек</span>
            </span>
          ) : (
            <button
              onClick={sendCode}
              disabled={loading}
              style={{ background: "none", border: "none", color: "var(--vn-blue-bright)", cursor: "pointer", fontSize: "0.88rem", fontWeight: 500, fontFamily: "Golos Text" }}
            >
              Выслать код повторно
            </button>
          )}
        </div>
      </div>
    </div>
  );
}