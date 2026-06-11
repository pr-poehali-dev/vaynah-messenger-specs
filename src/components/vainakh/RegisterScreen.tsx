import { useState } from "react";
import { User } from "@/pages/Index";

interface Props {
  onContinue: () => void;
  user: User;
  setUser: (u: User) => void;
}

export default function RegisterScreen({ onContinue, user, setUser }: Props) {
  const [name, setName] = useState(user.name);
  const [surname, setSurname] = useState(user.surname);
  const [birthdate, setBirthdate] = useState(user.birthdate);
  const [city, setCity] = useState(user.city);
  const [phone, setPhone] = useState(user.phone);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);

  const canContinue = name && surname && birthdate && city && check1 && check2 && check3;

  const handleContinue = () => {
    if (!canContinue) return;
    setUser({ ...user, name, surname, birthdate, city, phone });
    onContinue();
  };

  return (
    <div className="vn-screen flex flex-col h-full" style={{ padding: "1.5rem" }}>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))",
            borderRadius: "50px",
            padding: "0.4rem 1.2rem",
            marginBottom: "0.8rem",
          }}
        >
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "white" }}>Первый вход</span>
        </div>
        <h2
          style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.3rem" }}
          className="vn-gradient-text"
        >
          Расскажи о себе
        </h2>
        <p style={{ color: "var(--vn-muted)", fontSize: "0.85rem" }}>
          Заполни профиль, чтобы друзья нашли тебя
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--vn-muted)", marginBottom: "0.3rem" }}>Имя *</label>
              <input className="vn-input" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--vn-muted)", marginBottom: "0.3rem" }}>Фамилия *</label>
              <input className="vn-input" placeholder="Фамилия" value={surname} onChange={(e) => setSurname(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--vn-muted)", marginBottom: "0.3rem" }}>Дата рождения *</label>
            <input className="vn-input" type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--vn-muted)", marginBottom: "0.3rem" }}>Город *</label>
            <input className="vn-input" placeholder="Ваш город" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--vn-muted)", marginBottom: "0.3rem" }}>
              Номер телефона <span style={{ color: "var(--vn-muted)", fontSize: "0.75rem" }}>(необязательно)</span>
            </label>
            <input className="vn-input" type="tel" placeholder="+7 900 000-00-00" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
            {[
              { label: "Подтверждаю конфиденциальность", val: check1, set: setCheck1 },
              { label: "Согласен с правилами ВайНах", val: check2, set: setCheck2 },
              { label: "Мне есть 13+ лет", val: check3, set: setCheck3 },
            ].map(({ label, val, set }, i) => (
              <button
                key={i}
                onClick={() => set(!val)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: val ? "rgba(255,107,53,0.1)" : "var(--vn-card2)",
                  border: `1px solid ${val ? "var(--vn-orange)" : "var(--vn-border)"}`,
                  borderRadius: "0.75rem",
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
                    background: val ? "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))" : "transparent",
                    border: `2px solid ${val ? "transparent" : "var(--vn-border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  {val && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: "bold" }}>✓</span>}
                </div>
                <span style={{ fontSize: "0.85rem", color: val ? "var(--vn-text)" : "var(--vn-muted)" }}>{label}</span>
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
            opacity: canContinue ? 1 : 0.5,
            cursor: canContinue ? "pointer" : "not-allowed",
          }}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}
