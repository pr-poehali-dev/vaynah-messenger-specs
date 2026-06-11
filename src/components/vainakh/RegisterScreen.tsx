import { useState } from "react";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface Props {
  onContinue: () => void;
  user: User;
  setUser: (u: User) => void;
  email: string;
}

export default function RegisterScreen({ onContinue, user, setUser, email }: Props) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [city, setCity] = useState("");
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);

  const canContinue = name.trim() && surname.trim() && birthdate && city.trim() && check1 && check2 && check3;

  const handleContinue = () => {
    if (!canContinue) return;
    setUser({ ...user, email, name: name.trim(), surname: surname.trim(), birthdate, city: city.trim() });
    onContinue();
  };

  const checks = [
    { label: "Подтверждаю конфиденциальность", val: check1, set: setCheck1 },
    { label: "Согласен с правилами ВайНах", val: check2, set: setCheck2 },
    { label: "Мне есть 13+ лет", val: check3, set: setCheck3 },
  ];

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem", paddingTop: "2.5rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "linear-gradient(135deg, var(--vn-blue) 0%, var(--vn-blue-light) 100%)",
            borderRadius: "50px",
            padding: "0.4rem 1rem",
            marginBottom: "1rem",
          }}
        >
          <Icon name="UserPlus" size={13} color="white" />
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "white", letterSpacing: "0.04em" }}>ПЕРВЫЙ ВХОД</span>
        </div>
        <h2
          style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.6rem", marginBottom: "0.4rem" }}
          className="vn-gradient-text"
        >
          Расскажи о себе
        </h2>
        <p style={{ color: "var(--vn-muted)", fontSize: "0.85rem" }}>
          Заполни профиль, чтобы друзья нашли тебя
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: "0.6rem" }}>
          <Icon name="Mail" size={13} color="var(--vn-blue-bright)" />
          <span style={{ fontSize: "0.78rem", color: "var(--vn-blue-bright)", fontWeight: 500 }}>{email}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

          {/* Name + Surname */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--vn-muted)", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Имя *
              </label>
              <input
                className="vn-input"
                placeholder="Введи имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--vn-muted)", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Фамилия *
              </label>
              <input
                className="vn-input"
                placeholder="Введи фамилию"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                style={{ fontSize: "0.9rem" }}
              />
            </div>
          </div>

          {/* Birthdate */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--vn-muted)", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Дата рождения *
            </label>
            <input
              className="vn-input"
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />
          </div>

          {/* City */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--vn-muted)", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Город *
            </label>
            <div style={{ position: "relative" }}>
              <Icon name="MapPin" size={16} color="var(--vn-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
              <input
                className="vn-input"
                placeholder="Введи свой город"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ paddingLeft: "2.6rem" }}
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.3rem" }}>
            {checks.map(({ label, val, set }, i) => (
              <button
                key={i}
                onClick={() => set(!val)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: val ? "rgba(33,150,243,0.08)" : "var(--vn-card2)",
                  border: `1px solid ${val ? "var(--vn-blue-light)" : "var(--vn-border)"}`,
                  borderRadius: "0.85rem",
                  padding: "0.75rem 1rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: val ? "linear-gradient(135deg, var(--vn-blue) 0%, var(--vn-blue-light) 100%)" : "transparent",
                    border: `2px solid ${val ? "transparent" : "var(--vn-border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  {val && <Icon name="Check" size={13} color="white" />}
                </div>
                <span style={{ fontSize: "0.85rem", color: val ? "var(--vn-text)" : "var(--vn-muted)", fontWeight: val ? 500 : 400 }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ paddingTop: "1rem" }}>
        <button
          className="vn-btn"
          onClick={handleContinue}
          style={{
            opacity: canContinue ? 1 : 0.45,
            cursor: canContinue ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Icon name="ArrowRight" size={17} color="white" />
          Продолжить
        </button>
      </div>
    </div>
  );
}
