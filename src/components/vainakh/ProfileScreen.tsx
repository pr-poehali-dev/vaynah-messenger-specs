import { useState } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";

interface Props {
  user: User;
  setUser: (u: User) => void;
  onLogout?: () => void;
}

type ProfileSection = "main" | "settings" | "edit" | "security" | "notifications" | "appearance" | "messages" | "storage" | "devices" | "favorites" | "friends";

const mockFriends = [
  { id: 1, name: "Зайнаб", surname: "Хасанова", avatar: "З", city: "Грозный", online: true, status: "На прогулке 🌿" },
  { id: 2, name: "Ислам", surname: "Дудаев", avatar: "И", city: "Гудермес", online: true, status: "Работаю 💼" },
  { id: 3, name: "Малика", surname: "Садулаева", avatar: "М", city: "Грозный", online: false, status: "Добрый день всем! ☀️" },
  { id: 4, name: "Руслан", surname: "Арсанов", avatar: "Р", city: "Шали", online: false, status: "" },
  { id: 5, name: "Хеда", surname: "Гайтаева", avatar: "Х", city: "Аргун", online: true, status: "Алхамдулиллах 🙏" },
  { id: 6, name: "Адам", surname: "Берсанов", avatar: "А", city: "Грозный", online: false, status: "В пути 🚗" },
];

const avatarGrads = [
  "linear-gradient(135deg,#1565C0,#2196F3)",
  "linear-gradient(135deg,#1976D2,#42A5F5)",
  "linear-gradient(135deg,#0D47A1,#1976D2)",
  "linear-gradient(135deg,#1565C0,#29B6F6)",
  "linear-gradient(135deg,#0D47A1,#42A5F5)",
  "linear-gradient(135deg,#1565C0,#64B5F6)",
];

export default function ProfileScreen({ user, setUser, onLogout }: Props) {
  const [section, setSection] = useState<ProfileSection>("main");
  const [editData, setEditData] = useState({ ...user });
  const [showPhone, setShowPhone] = useState(false);
  const [notifsOn, setNotifsOn] = useState(true);
  const [showRead, setShowRead] = useState(true);
  const [whoCanMsg, setWhoCanMsg] = useState("all");
  const [twoFa, setTwoFa] = useState(false);
  const [notifSound, setNotifSound] = useState("default");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const saveEdit = () => {
    setUser(editData);
    setSection("main");
  };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} style={{ width: 46, height: 26, borderRadius: 13, background: on ? "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))" : "var(--vn-border)", border: "none", cursor: "pointer", position: "relative", transition: "all 0.25s", flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: on ? 23 : 3, transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </button>
  );

  const SettingRow = ({ icon, label, value, onClick, danger }: { icon: string; label: string; value?: string; onClick?: () => void; danger?: boolean }) => (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "0.9rem 1.2rem", background: "none", border: "none", cursor: onClick ? "pointer" : "default", borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s" }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.background = "rgba(33,150,243,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: danger ? "rgba(231,76,60,0.15)" : "rgba(33,150,243,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={17} color={danger ? "#E74C3C" : "var(--vn-blue-bright)"} />
      </div>
      <span style={{ flex: 1, textAlign: "left", fontSize: "0.9rem", color: danger ? "#E74C3C" : "var(--vn-text)" }}>{label}</span>
      {value && <span style={{ fontSize: "0.8rem", color: "var(--vn-muted)" }}>{value}</span>}
      {onClick && <Icon name="ChevronRight" size={16} color="var(--vn-muted)" />}
    </button>
  );

  // ── FRIENDS ──
  if (section === "friends") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSection("main")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem", flex: 1 }}>Мои друзья</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--vn-muted)" }}>{mockFriends.length}</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          {mockFriends.map((f, i) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.9rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)", animation: `vn-appear 0.3s ease ${i * 0.06}s both` }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: avatarGrads[i % avatarGrads.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1.1rem", boxShadow: "0 4px 12px rgba(33,150,243,0.25)" }}>
                  {f.avatar}
                </div>
                {f.online && <div className="vn-online" style={{ position: "absolute", bottom: 1, right: 1 }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{f.name} {f.surname}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--vn-muted)", marginTop: 2 }}>{f.city}</div>
                {f.status && <div style={{ fontSize: "0.78rem", color: "var(--vn-blue-bright)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.status}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(33,150,243,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Icon name="MessageCircle" size={15} color="var(--vn-blue-bright)" />
                </button>
                <button style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(33,150,243,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Icon name="Phone" size={15} color="var(--vn-blue-bright)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── EDIT ──
  if (section === "edit") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSection("main")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <span style={{ fontFamily: "Montserrat", fontWeight: 700, flex: 1 }}>Редактировать профиль</span>
          <button onClick={saveEdit} style={{ background: "none", border: "none", color: "var(--vn-blue-bright)", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>Сохранить</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem" }} className="scrollbar-hide">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "2rem", color: "white", margin: "0 auto 0.75rem", boxShadow: "0 8px 24px rgba(33,150,243,0.35)" }}>
              {(editData.name || "Я")[0]}
            </div>
            <button style={{ background: "none", border: "1px solid var(--vn-blue-light)", borderRadius: "50px", padding: "0.35rem 0.9rem", color: "var(--vn-blue-bright)", cursor: "pointer", fontSize: "0.82rem" }}>Сменить фото</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[{ label: "Имя", key: "name", type: "text" }, { label: "Фамилия", key: "surname", type: "text" }, { label: "Дата рождения", key: "birthdate", type: "date" }, { label: "Город", key: "city", type: "text" }, { label: "Номер телефона", key: "phone", type: "tel" }].map(({ label, key, type }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--vn-muted)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
                <input className="vn-input" type={type} value={(editData as Record<string, string>)[key]} onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} />
              </div>
            ))}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--vn-muted)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>О себе</label>
              <textarea className="vn-input" value={editData.about} onChange={(e) => setEditData({ ...editData, about: e.target.value })} rows={3} style={{ resize: "none" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SETTINGS ──
  if (section === "settings") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSection("main")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Настройки</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          <SettingRow icon="Bell" label="Уведомления и звуки" onClick={() => setSection("notifications")} />
          <SettingRow icon="Shield" label="Безопасность" onClick={() => setSection("security")} />
          <SettingRow icon="Smartphone" label="Устройства" onClick={() => setSection("devices")} />
          <SettingRow icon="MessageSquare" label="Сообщения" onClick={() => setSection("messages")} />
          <SettingRow icon="Star" label="Избранное" onClick={() => setSection("favorites")} />
          <SettingRow icon="HardDrive" label="Медиа и память" onClick={() => setSection("storage")} />

          <div style={{ height: 1, background: "var(--vn-border)", margin: "0.5rem 0" }} />

          {/* Logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "1rem 1.2rem", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(231,76,60,0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(231,76,60,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="LogOut" size={17} color="#E74C3C" />
            </div>
            <span style={{ flex: 1, textAlign: "left", fontSize: "0.9rem", color: "#E74C3C", fontWeight: 600 }}>Выйти из аккаунта</span>
          </button>

          {/* Delete account */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "1rem 1.2rem", background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(231,76,60,0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(231,76,60,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="UserX" size={17} color="rgba(231,76,60,0.7)" />
            </div>
            <span style={{ flex: 1, textAlign: "left", fontSize: "0.9rem", color: "rgba(231,76,60,0.7)" }}>Удалить аккаунт</span>
          </button>
        </div>

        {/* Logout confirm */}
        {showLogoutConfirm && (
          <div onClick={() => setShowLogoutConfirm(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--vn-card)", borderRadius: "1.5rem 1.5rem 0 0", padding: "1.5rem", width: "100%", animation: "vn-appear 0.2s ease" }}>
              <h3 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>Выйти из аккаунта?</h3>
              <p style={{ color: "var(--vn-muted)", fontSize: "0.88rem", marginBottom: "1.2rem" }}>Вы сможете войти снова в любой момент.</p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "0.75rem", padding: "0.85rem", color: "var(--vn-text)", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>Отмена</button>
                <button onClick={() => onLogout && onLogout()} style={{ flex: 1, background: "linear-gradient(135deg,#C0392B,#E74C3C)", border: "none", borderRadius: "0.75rem", padding: "0.85rem", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>Выйти</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div onClick={() => setShowDeleteConfirm(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--vn-card)", borderRadius: "1.5rem 1.5rem 0 0", padding: "1.5rem", width: "100%", animation: "vn-appear 0.2s ease" }}>
              <h3 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem", color: "#E74C3C" }}>Удалить аккаунт?</h3>
              <p style={{ color: "var(--vn-muted)", fontSize: "0.88rem", marginBottom: "1.2rem" }}>Это действие необратимо. Все ваши данные, чаты и фото будут удалены навсегда.</p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "0.75rem", padding: "0.85rem", color: "var(--vn-text)", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>Отмена</button>
                <button onClick={() => onLogout && onLogout()} style={{ flex: 1, background: "linear-gradient(135deg,#922B21,#E74C3C)", border: "none", borderRadius: "0.75rem", padding: "0.85rem", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>Удалить</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── NOTIFICATIONS ──
  if (section === "notifications") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Уведомления</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem" }} className="scrollbar-hide">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "var(--vn-card2)", borderRadius: "0.75rem", border: "1px solid var(--vn-border)", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 500 }}>Уведомления</span>
            <Toggle on={notifsOn} onToggle={() => setNotifsOn(!notifsOn)} />
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--vn-muted)", marginBottom: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Звук</p>
          {["default", "chime", "pop", "none"].map((s) => (
            <button key={s} onClick={() => setNotifSound(s)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "0.7rem 1rem", background: notifSound === s ? "rgba(33,150,243,0.1)" : "var(--vn-card2)", border: `1px solid ${notifSound === s ? "var(--vn-blue-light)" : "var(--vn-border)"}`, borderRadius: "0.65rem", cursor: "pointer", marginBottom: 6, color: "var(--vn-text)", transition: "all 0.2s" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${notifSound === s ? "var(--vn-blue-light)" : "var(--vn-border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {notifSound === s && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--vn-blue-light)" }} />}
              </div>
              <span style={{ fontSize: "0.9rem" }}>{{ default: "По умолчанию", chime: "Звонок", pop: "Поп", none: "Без звука" }[s]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── SECURITY ──
  if (section === "security") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Безопасность</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          <SettingRow icon="Key" label="Сменить пароль" onClick={() => {}} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.9rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(33,150,243,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="ShieldCheck" size={17} color="var(--vn-blue-bright)" />
            </div>
            <span style={{ flex: 1, fontSize: "0.9rem" }}>2FA аутентификация</span>
            <Toggle on={twoFa} onToggle={() => setTwoFa(!twoFa)} />
          </div>
          <SettingRow icon="Monitor" label="Активные сессии" value="2 устройства" onClick={() => setSection("devices")} />
        </div>
      </div>
    );
  }

  // ── MESSAGES ──
  if (section === "messages") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Сообщения</h2>
        </div>
        <div style={{ flex: 1, padding: "1.2rem", overflowY: "auto" }} className="scrollbar-hide">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "var(--vn-card2)", borderRadius: "0.75rem", border: "1px solid var(--vn-border)", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.9rem" }}>Показывать «прочитано»</span>
            <Toggle on={showRead} onToggle={() => setShowRead(!showRead)} />
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--vn-muted)", marginBottom: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Кто может писать мне</p>
          {[{ id: "all", label: "Все" }, { id: "friends", label: "Только друзья" }, { id: "none", label: "Никто" }].map((opt) => (
            <button key={opt.id} onClick={() => setWhoCanMsg(opt.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "0.7rem 1rem", background: whoCanMsg === opt.id ? "rgba(33,150,243,0.1)" : "var(--vn-card2)", border: `1px solid ${whoCanMsg === opt.id ? "var(--vn-blue-light)" : "var(--vn-border)"}`, borderRadius: "0.65rem", cursor: "pointer", marginBottom: 6, color: "var(--vn-text)", transition: "all 0.2s" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${whoCanMsg === opt.id ? "var(--vn-blue-light)" : "var(--vn-border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {whoCanMsg === opt.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--vn-blue-light)" }} />}
              </div>
              <span style={{ fontSize: "0.9rem" }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── STORAGE ──
  if (section === "storage") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Медиа и память</h2>
        </div>
        <div style={{ flex: 1, padding: "1.2rem", overflowY: "auto" }} className="scrollbar-hide">
          <div style={{ background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "1rem", padding: "1.2rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--vn-muted)" }}>Использовано</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>256 МБ / 1 ГБ</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--vn-border)" }}>
              <div style={{ width: "26%", height: "100%", borderRadius: 4, background: "linear-gradient(90deg,var(--vn-blue),var(--vn-blue-light))" }} />
            </div>
          </div>
          <SettingRow icon="Trash2" label="Очистить кэш" value="56 МБ" onClick={() => {}} />
        </div>
      </div>
    );
  }

  // ── DEVICES ──
  if (section === "devices") {
    const devices = [{ name: "iPhone 15 Pro", os: "iOS 17.2", time: "сейчас", active: true }, { name: "MacBook Air", os: "macOS 14", time: "2 дня назад", active: false }];
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Устройства</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          {devices.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(33,150,243,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="Smartphone" size={18} color="var(--vn-blue-bright)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{d.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--vn-muted)" }}>{d.os} · {d.time}</div>
              </div>
              {d.active ? <span style={{ fontSize: "0.72rem", background: "rgba(46,204,113,0.15)", color: "#2ECC71", borderRadius: "50px", padding: "0.25rem 0.6rem", fontWeight: 600 }}>Активно</span>
                : <button style={{ fontSize: "0.72rem", background: "rgba(231,76,60,0.1)", color: "#E74C3C", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "50px", padding: "0.25rem 0.6rem", cursor: "pointer" }}>Удалить</button>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── FAVORITES ──
  if (section === "favorites") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Избранное</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          <SettingRow icon="BookMarked" label="Написать самому себе" onClick={() => {}} />
          <SettingRow icon="FolderOpen" label="Папки для заметок" onClick={() => {}} />
        </div>
      </div>
    );
  }

  // ── MAIN ──
  const age = user.birthdate ? new Date().getFullYear() - new Date(user.birthdate).getFullYear() : null;

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {/* Cover */}
        <div style={{ position: "relative" }}>
          <div style={{ height: 130, background: "linear-gradient(135deg,var(--vn-blue) 0%,var(--vn-blue-light) 60%,var(--vn-blue-bright) 100%)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'><circle cx='160' cy='30' r='60' fill='rgba(255,255,255,0.07)'/><circle cx='30' cy='80' r='40' fill='rgba(255,255,255,0.04)'/></svg>\")" }} />
          </div>
          <div style={{ paddingLeft: "1.2rem", paddingRight: "1.2rem", paddingBottom: "1rem", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ marginTop: -44, position: "relative" }}>
                <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "2.2rem", color: "white", border: "4px solid var(--vn-bg)", boxShadow: "0 8px 24px rgba(33,150,243,0.4)" }}>
                  {(user.name || "Я")[0]}
                </div>
                {user.online && <div className="vn-online" style={{ position: "absolute", bottom: 5, right: 5, width: 14, height: 14 }} />}
              </div>
              <button onClick={() => setSection("edit")} style={{ background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "50px", padding: "0.4rem 0.9rem", color: "var(--vn-text)", cursor: "pointer", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                <Icon name="Pencil" size={13} color="var(--vn-blue-bright)" />
                Изменить
              </button>
            </div>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>
              {user.name || "Пользователь"} {user.surname}
            </h2>
            <p style={{ color: "var(--vn-muted)", fontSize: "0.84rem", marginBottom: "0.4rem" }}>
              {user.city && user.city}{age ? ` · ${age} лет` : ""}
            </p>
            <p style={{ fontSize: "0.87rem", color: "var(--vn-blue-bright)", fontStyle: "italic" }}>{user.about}</p>
            {user.phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "0.6rem" }}>
                <Icon name="Phone" size={13} color="var(--vn-muted)" />
                <span style={{ fontSize: "0.8rem", color: showPhone ? "var(--vn-text)" : "var(--vn-muted)" }}>
                  {showPhone ? user.phone : "••• ••• ••-••"}
                </span>
                <button onClick={() => setShowPhone(!showPhone)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", color: "var(--vn-blue-bright)", padding: 0 }}>
                  {showPhone ? "Скрыть" : "Показать"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats — кликабельные */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--vn-border)", margin: "0 0 0.75rem" }}>
          {[
            { label: "Друзей", value: String(mockFriends.length), onClick: () => setSection("friends") },
            { label: "Фото", value: "24", onClick: () => {} },
            { label: "Статусов", value: "7", onClick: () => {} },
          ].map((s) => (
            <button key={s.label} onClick={s.onClick} style={{ background: "var(--vn-card)", padding: "0.85rem 0.5rem", textAlign: "center", border: "none", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--vn-card)")}>
              <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem" }} className="vn-gradient-text">{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--vn-muted)", marginTop: 2 }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Friends preview */}
        <div style={{ padding: "0 1.2rem 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.7rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Друзья</span>
            <button onClick={() => setSection("friends")} style={{ background: "none", border: "none", color: "var(--vn-blue-bright)", cursor: "pointer", fontSize: "0.8rem" }}>Все →</button>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto" }} className="scrollbar-hide">
            {mockFriends.map((f, i) => (
              <div key={f.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 58, animation: `vn-appear 0.3s ease ${i * 0.06}s both` }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: avatarGrads[i % avatarGrads.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1rem", border: "2px solid var(--vn-border)" }}>
                    {f.avatar}
                  </div>
                  {f.online && <div className="vn-online" style={{ position: "absolute", bottom: 1, right: 1 }} />}
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--vn-muted)", textAlign: "center", maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
              </div>
            ))}
          </div>
        </div>

        <SettingRow icon="Settings2" label="Настройки" onClick={() => setSection("settings")} />
      </div>
    </div>
  );
}
