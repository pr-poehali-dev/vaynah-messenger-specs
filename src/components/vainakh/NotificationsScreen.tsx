import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Notif {
  id: number;
  type: "missed_audio" | "missed_video" | "friend_req" | "message";
  from: string;
  avatar: string;
  time: string;
}

const mockNotifs: Notif[] = [
  { id: 1, type: "missed_audio", from: "Зайнаб Хасанова", avatar: "З", time: "14:32" },
  { id: 2, type: "missed_video", from: "Ислам Дудаев", avatar: "И", time: "13:15" },
  { id: 3, type: "friend_req", from: "Хеда Гайтаева", avatar: "Х", time: "12:00" },
  { id: 4, type: "missed_audio", from: "Руслан Арсанов", avatar: "Р", time: "Вчера" },
  { id: 5, type: "message", from: "Малика Садулаева", avatar: "М", time: "Вчера" },
];

const avatarColors = [
  "linear-gradient(135deg, #FF6B35, #E91E8C)",
  "linear-gradient(135deg, #5B3FD4, #9B59B6)",
  "linear-gradient(135deg, #E91E8C, #9B59B6)",
  "linear-gradient(135deg, #00BCD4, #5B3FD4)",
  "linear-gradient(135deg, #2ECC71, #00BCD4)",
];

const notifConfig = {
  missed_audio: { icon: "PhoneMissed", color: "#E74C3C", label: "Пропущенный аудиозвонок" },
  missed_video: { icon: "VideoOff", color: "#E74C3C", label: "Пропущенный видеозвонок" },
  friend_req: { icon: "UserPlus", color: "var(--vn-orange)", label: "Запрос в друзья" },
  message: { icon: "MessageCircle", color: "var(--vn-indigo)", label: "Новое сообщение" },
};

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState(mockNotifs);

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "1.2rem 1.2rem 0.8rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem" }} className="vn-gradient-text">
          Уведомления
        </h1>
        {notifs.length > 0 && (
          <button
            onClick={() => setNotifs([])}
            style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "50px", padding: "0.35rem 0.75rem", color: "#E74C3C", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}
          >
            <Icon name="Trash2" size={12} color="#E74C3C" />
            Очистить
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {notifs.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--vn-muted)" }}>
            <Icon name="BellOff" size={48} color="var(--vn-muted)" />
            <p style={{ marginTop: "1rem", fontSize: "0.95rem" }}>Нет уведомлений</p>
          </div>
        ) : (
          notifs.map((n, i) => {
            const cfg = notifConfig[n.type];
            return (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.9rem",
                  padding: "0.9rem 1.2rem",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  animation: `vn-appear 0.3s ease ${i * 0.07}s both`,
                  position: "relative",
                }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: avatarColors[i % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>
                    {n.avatar}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: cfg.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid var(--vn-bg)",
                    }}
                  >
                    <Icon name={cfg.icon} size={10} color="white" />
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{n.from}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--vn-muted)", marginTop: 2 }}>{cfg.label}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--vn-muted)" }}>{n.time}</span>
                  {(n.type === "missed_audio" || n.type === "missed_video") && (
                    <button
                      style={{
                        background: `rgba(46,204,113,0.15)`,
                        border: "1px solid rgba(46,204,113,0.3)",
                        borderRadius: "50px",
                        padding: "0.25rem 0.6rem",
                        color: "#2ECC71",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon name={n.type === "missed_audio" ? "Phone" : "Video"} size={10} color="#2ECC71" />
                      Перезвонить
                    </button>
                  )}
                  {n.type === "friend_req" && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => setNotifs((prev) => prev.filter((x) => x.id !== n.id))}
                        style={{ background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))", border: "none", borderRadius: "50px", padding: "0.25rem 0.6rem", color: "white", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}
                      >
                        Принять
                      </button>
                      <button
                        onClick={() => setNotifs((prev) => prev.filter((x) => x.id !== n.id))}
                        style={{ background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "50px", padding: "0.25rem 0.6rem", color: "var(--vn-muted)", cursor: "pointer", fontSize: "0.7rem" }}
                      >
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
