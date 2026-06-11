import { useState } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";

interface Props {
  user: User;
  setUser: (u: User) => void;
}

type ProfileSection = "main" | "settings" | "edit" | "security" | "notifications" | "appearance" | "messages" | "storage" | "devices" | "favorites";

export default function ProfileScreen({ user, setUser }: Props) {
  const [section, setSection] = useState<ProfileSection>("main");
  const [editData, setEditData] = useState({ ...user });
  const [showOnline, setShowOnline] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [notifsOn, setNotifsOn] = useState(true);
  const [showRead, setShowRead] = useState(true);
  const [whoCanMsg, setWhoCanMsg] = useState("all");
  const [theme, setTheme] = useState("dark");
  const [twoFa, setTwoFa] = useState(false);
  const [notifSound, setNotifSound] = useState("default");

  const saveEdit = () => {
    setUser(editData);
    setSection("main");
  };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      style={{
        width: 46,
        height: 26,
        borderRadius: 13,
        background: on ? "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))" : "var(--vn-border)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.25s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          transition: "left 0.25s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );

  const SettingRow = ({ icon, label, value, onClick, danger }: { icon: string; label: string; value?: string; onClick?: () => void; danger?: boolean }) => (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "0.9rem 1.2rem", background: "none", border: "none", cursor: onClick ? "pointer" : "default", borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s" }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.background = "rgba(255,107,53,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: danger ? "rgba(231,76,60,0.15)" : "rgba(255,107,53,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={17} color={danger ? "#E74C3C" : "var(--vn-orange)"} />
      </div>
      <span style={{ flex: 1, textAlign: "left", fontSize: "0.9rem", color: danger ? "#E74C3C" : "var(--vn-text)" }}>{label}</span>
      {value && <span style={{ fontSize: "0.8rem", color: "var(--vn-muted)" }}>{value}</span>}
      {onClick && <Icon name="ChevronRight" size={16} color="var(--vn-muted)" />}
    </button>
  );

  if (section === "edit") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSection("main")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}>
            <Icon name="ArrowLeft" size={22} />
          </button>
          <span style={{ fontFamily: "Montserrat", fontWeight: 700, flex: 1 }}>Редактировать профиль</span>
          <button onClick={saveEdit} style={{ background: "none", border: "none", color: "var(--vn-orange)", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>Сохранить</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem" }} className="scrollbar-hide">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "2rem", color: "white", margin: "0 auto 0.75rem" }}>
              {user.name[0]}
            </div>
            <button style={{ background: "none", border: "1px solid var(--vn-orange)", borderRadius: "50px", padding: "0.35rem 0.9rem", color: "var(--vn-orange)", cursor: "pointer", fontSize: "0.82rem" }}>
              Сменить фото
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { label: "Имя", key: "name", type: "text" },
              { label: "Фамилия", key: "surname", type: "text" },
              { label: "Дата рождения", key: "birthdate", type: "date" },
              { label: "Город", key: "city", type: "text" },
              { label: "Номер телефона", key: "phone", type: "tel" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: "0.78rem", color: "var(--vn-muted)", marginBottom: 4 }}>{label}</label>
                <input
                  className="vn-input"
                  type={type}
                  value={(editData as Record<string, string>)[key]}
                  onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--vn-muted)", marginBottom: 4 }}>О себе</label>
              <textarea
                className="vn-input"
                value={editData.about}
                onChange={(e) => setEditData({ ...editData, about: e.target.value })}
                rows={3}
                style={{ resize: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === "settings") {
    const settingsGroups = [
      {
        title: "Аккаунт",
        items: [
          { icon: "Bell", label: "Уведомления и звуки", sub: "notifications" as ProfileSection },
          { icon: "Shield", label: "Безопасность", sub: "security" as ProfileSection },
          { icon: "Smartphone", label: "Устройства", sub: "devices" as ProfileSection },
          { icon: "MessageSquare", label: "Сообщения", sub: "messages" as ProfileSection },
          { icon: "Star", label: "Избранное", sub: "favorites" as ProfileSection },
          { icon: "HardDrive", label: "Медиа и память", sub: "storage" as ProfileSection },
          { icon: "Palette", label: "Оформление", sub: "appearance" as ProfileSection },
        ],
      },
    ];

    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSection("main")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}>
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>ВайНах Настройки</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          {settingsGroups.map((g) => (
            <div key={g.title}>
              {g.items.map((item) => (
                <SettingRow key={item.label} icon={item.icon} label={item.label} onClick={() => setSection(item.sub)} />
              ))}
            </div>
          ))}

          <div style={{ padding: "1rem 1.2rem 0.5rem" }}>
            <div style={{ height: 1, background: "var(--vn-border)", marginBottom: "0.75rem" }} />
          </div>

          <div style={{ padding: "0 1.2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { label: "Показывать онлайн", val: showOnline, set: setShowOnline },
              { label: "Показывать «был(а) в сети»", val: showLastSeen, set: setShowLastSeen },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--vn-green, #2ECC71)" }} />
                  <span style={{ fontSize: "0.9rem" }}>{label}</span>
                </div>
                <Toggle on={val} onToggle={() => set(!val)} />
              </div>
            ))}
          </div>

          <div style={{ padding: "1.5rem 1.2rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "0.75rem", padding: "0.85rem", color: "#E74C3C", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
              <Icon name="LogOut" size={17} color="#E74C3C" />
              Выйти из аккаунта
            </button>
            <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "rgba(231,76,60,0.05)", border: "1px solid rgba(231,76,60,0.2)", borderRadius: "0.75rem", padding: "0.85rem", color: "rgba(231,76,60,0.7)", cursor: "pointer", fontSize: "0.9rem" }}>
              <Icon name="UserX" size={17} color="rgba(231,76,60,0.7)" />
              Удалить профиль
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (section === "notifications") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Уведомления и звуки</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem" }} className="scrollbar-hide">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "var(--vn-card2)", borderRadius: "0.75rem", border: "1px solid var(--vn-border)" }}>
              <span style={{ fontWeight: 500 }}>Уведомления</span>
              <Toggle on={notifsOn} onToggle={() => setNotifsOn(!notifsOn)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--vn-muted)", marginBottom: 6 }}>Звук уведомления</label>
              {["default", "chime", "pop", "none"].map((s) => (
                <button
                  key={s}
                  onClick={() => setNotifSound(s)}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "0.7rem 1rem", background: notifSound === s ? "rgba(255,107,53,0.1)" : "var(--vn-card2)", border: `1px solid ${notifSound === s ? "var(--vn-orange)" : "var(--vn-border)"}`, borderRadius: "0.65rem", cursor: "pointer", marginBottom: 6, color: "var(--vn-text)", transition: "all 0.2s" }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${notifSound === s ? "var(--vn-orange)" : "var(--vn-border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {notifSound === s && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--vn-orange)" }} />}
                  </div>
                  <span style={{ fontSize: "0.9rem" }}>{{ default: "По умолчанию", chime: "Звонок", pop: "Поп", none: "Без звука" }[s]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === "security") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Безопасность</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          <SettingRow icon="Key" label="Сменить пароль" onClick={() => {}} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.9rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,107,53,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="ShieldCheck" size={17} color="var(--vn-orange)" />
            </div>
            <span style={{ flex: 1, fontSize: "0.9rem" }}>Двухфакторная аутентификация</span>
            <Toggle on={twoFa} onToggle={() => setTwoFa(!twoFa)} />
          </div>
          <SettingRow icon="Monitor" label="Активные сессии" value="2 устройства" onClick={() => {}} />
        </div>
      </div>
    );
  }

  if (section === "appearance") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Оформление</h2>
        </div>
        <div style={{ flex: 1, padding: "1.2rem", overflowY: "auto" }} className="scrollbar-hide">
          <p style={{ fontSize: "0.8rem", color: "var(--vn-muted)", marginBottom: "0.75rem" }}>Тема</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {[{ id: "dark", label: "Тёмная", emoji: "🌙" }, { id: "light", label: "Светлая", emoji: "☀️" }].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{ padding: "1rem", background: theme === t.id ? "rgba(255,107,53,0.1)" : "var(--vn-card2)", border: `2px solid ${theme === t.id ? "var(--vn-orange)" : "var(--vn-border)"}`, borderRadius: "1rem", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
              >
                <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>{t.emoji}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: theme === t.id ? 600 : 400, color: theme === t.id ? "var(--vn-orange)" : "var(--vn-muted)" }}>{t.label}</div>
              </button>
            ))}
          </div>
          <SettingRow icon="Image" label="Обои чата" onClick={() => {}} />
        </div>
      </div>
    );
  }

  if (section === "messages") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Сообщения</h2>
        </div>
        <div style={{ flex: 1, padding: "1.2rem", overflowY: "auto" }} className="scrollbar-hide">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "var(--vn-card2)", borderRadius: "0.75rem", border: "1px solid var(--vn-border)", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.9rem" }}>Показывать «прочитано»</span>
            <Toggle on={showRead} onToggle={() => setShowRead(!showRead)} />
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--vn-muted)", marginBottom: "0.6rem" }}>Кто может писать мне</p>
          {[{ id: "all", label: "Все" }, { id: "friends", label: "Только друзья" }, { id: "none", label: "Никто" }].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setWhoCanMsg(opt.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "0.7rem 1rem", background: whoCanMsg === opt.id ? "rgba(255,107,53,0.1)" : "var(--vn-card2)", border: `1px solid ${whoCanMsg === opt.id ? "var(--vn-orange)" : "var(--vn-border)"}`, borderRadius: "0.65rem", cursor: "pointer", marginBottom: 6, color: "var(--vn-text)", transition: "all 0.2s" }}
            >
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${whoCanMsg === opt.id ? "var(--vn-orange)" : "var(--vn-border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {whoCanMsg === opt.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--vn-orange)" }} />}
              </div>
              <span style={{ fontSize: "0.9rem" }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (section === "storage") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Медиа и память</h2>
        </div>
        <div style={{ flex: 1, padding: "1.2rem", overflowY: "auto" }} className="scrollbar-hide">
          <div style={{ background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "1rem", padding: "1.2rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--vn-muted)" }}>Использовано</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>256 МБ / 1 ГБ</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--vn-border)" }}>
              <div style={{ width: "26%", height: "100%", borderRadius: 4, background: "linear-gradient(90deg, var(--vn-orange), var(--vn-pink))" }} />
            </div>
          </div>
          <SettingRow icon="Trash2" label="Очистить кэш" value="56 МБ" onClick={() => {}} />
        </div>
      </div>
    );
  }

  if (section === "devices") {
    const devices = [
      { name: "iPhone 15 Pro", os: "iOS 17.2", time: "сейчас", active: true },
      { name: "MacBook Air", os: "macOS 14", time: "2 дня назад", active: false },
    ];
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Устройства</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          {devices.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,107,53,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="Smartphone" size={18} color="var(--vn-orange)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{d.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--vn-muted)" }}>{d.os} · {d.time}</div>
              </div>
              {d.active ? (
                <span style={{ fontSize: "0.72rem", background: "rgba(46,204,113,0.15)", color: "#2ECC71", borderRadius: "50px", padding: "0.25rem 0.6rem", fontWeight: 600 }}>Активно</span>
              ) : (
                <button style={{ fontSize: "0.72rem", background: "rgba(231,76,60,0.1)", color: "#E74C3C", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "50px", padding: "0.25rem 0.6rem", cursor: "pointer" }}>Удалить</button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === "favorites") {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Избранное</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          <SettingRow icon="BookMarked" label="Написать самому себе" onClick={() => {}} />
          <SettingRow icon="FolderOpen" label="Папки для заметок" onClick={() => {}} />
        </div>
      </div>
    );
  }

  // Main profile
  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {/* Profile header */}
        <div style={{ position: "relative" }}>
          <div style={{ height: 130, background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink), var(--vn-indigo))", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"80\" r=\"40\" fill=\"rgba(255,255,255,0.05)\"/><circle cx=\"80\" cy=\"20\" r=\"30\" fill=\"rgba(255,255,255,0.03)\"/></svg>')" }} />
          </div>
          <div style={{ paddingLeft: "1.2rem", paddingRight: "1.2rem", paddingBottom: "1rem", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ marginTop: -40, position: "relative" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "2rem", color: "white", border: "3px solid var(--vn-bg)" }}>
                  {user.name[0]}
                </div>
                {user.online && <div className="vn-online" style={{ position: "absolute", bottom: 4, right: 4, width: 14, height: 14 }} />}
              </div>
              <button
                onClick={() => setSection("edit")}
                style={{ background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "50px", padding: "0.4rem 0.9rem", color: "var(--vn-text)", cursor: "pointer", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="Pencil" size={13} color="var(--vn-orange)" />
                Изменить
              </button>
            </div>

            <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>
              {user.name} {user.surname}
            </h2>
            <p style={{ color: "var(--vn-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              {user.city} · {new Date().getFullYear() - new Date(user.birthdate).getFullYear()} лет
            </p>
            <p style={{ fontSize: "0.88rem", color: "var(--vn-muted)", fontStyle: "italic" }}>{user.about}</p>

            {/* Phone with toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "0.75rem" }}>
              <Icon name="Phone" size={14} color="var(--vn-muted)" />
              <span style={{ fontSize: "0.82rem", color: showPhone ? "var(--vn-text)" : "var(--vn-muted)" }}>
                {showPhone ? user.phone : "••• ••• ••-••"}
              </span>
              <button
                onClick={() => setShowPhone(!showPhone)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", color: "var(--vn-orange)", padding: 0 }}
              >
                {showPhone ? "Скрыть" : "Показать"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--vn-border)", margin: "0 0 1rem" }}>
          {[{ label: "Друзей", value: "48" }, { label: "Фото", value: "120" }, { label: "Статусов", value: "7" }].map((s) => (
            <div key={s.label} style={{ background: "var(--vn-card)", padding: "0.75rem", textAlign: "center" }}>
              <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.2rem" }} className="vn-gradient-text">{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--vn-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <SettingRow icon="Settings2" label="ВайНах Настройки" onClick={() => setSection("settings")} />
      </div>
    </div>
  );
}
