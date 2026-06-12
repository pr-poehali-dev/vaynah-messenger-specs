import { useState } from "react";
import Icon from "@/components/ui/icon";
import ChatView, { ChatData } from "./ChatView";
import CallScreen from "./CallScreen";
import { User } from "@/pages/Index";

interface Notif {
  id: number;
  type: "missed_audio" | "missed_video" | "friend_req" | "message";
  from: string;
  avatar: string;
  time: string;
  chatData: ChatData;
}

const mockNotifs: Notif[] = [
  { id: 1, type: "missed_audio", from: "Зайнаб Хасанова", avatar: "З", time: "14:32", chatData: { id: 1, name: "Зайнаб Хасанова", avatar: "З", online: true, city: "Грозный", age: 22 } },
  { id: 2, type: "missed_video", from: "Ислам Дудаев", avatar: "И", time: "13:15", chatData: { id: 2, name: "Ислам Дудаев", avatar: "И", online: true, city: "Гудермес", age: 28 } },
  { id: 3, type: "friend_req", from: "Хеда Гайтаева", avatar: "Х", time: "12:00", chatData: { id: 3, name: "Хеда Гайтаева", avatar: "Х", online: false, city: "Аргун", age: 19 } },
  { id: 4, type: "missed_audio", from: "Руслан Арсанов", avatar: "Р", time: "Вчера", chatData: { id: 4, name: "Руслан Арсанов", avatar: "Р", online: false, city: "Шали", age: 31 } },
  { id: 5, type: "message", from: "Малика Садулаева", avatar: "М", time: "Вчера", chatData: { id: 5, name: "Малика Садулаева", avatar: "М", online: false, city: "Грозный", age: 25 } },
];

const avatarColors = [
  "linear-gradient(135deg,#1565C0,#2196F3)",
  "linear-gradient(135deg,#1976D2,#42A5F5)",
  "linear-gradient(135deg,#0D47A1,#1976D2)",
  "linear-gradient(135deg,#1565C0,#29B6F6)",
  "linear-gradient(135deg,#0D47A1,#42A5F5)",
];

const notifConfig = {
  missed_audio: { icon: "PhoneMissed", color: "#E74C3C", label: "Пропущенный аудиозвонок" },
  missed_video: { icon: "VideoOff", color: "#E74C3C", label: "Пропущенный видеозвонок" },
  friend_req: { icon: "UserPlus", color: "var(--vn-blue-bright)", label: "Запрос в друзья" },
  message: { icon: "MessageCircle", color: "var(--vn-blue-light)", label: "Новое сообщение" },
};

const dummyUser: User = { email: "", name: "", surname: "", city: "", phone: "", birthdate: "", about: "", avatar: "", online: true };

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState(mockNotifs);
  const [openChat, setOpenChat] = useState<ChatData | null>(null);
  const [openCall, setOpenCall] = useState<{ type: "audio" | "video"; chat: ChatData; incoming?: boolean } | null>(null);

  const remove = (id: number) => setNotifs((prev) => prev.filter((n) => n.id !== id));

  if (openCall) {
    return (
      <div style={{ position: "relative", height: "100%" }}>
        <CallScreen type={openCall.type} name={openCall.chat.name} avatar={openCall.chat.avatar} onEnd={() => setOpenCall(null)} incoming={openCall.incoming} />
      </div>
    );
  }

  if (openChat) {
    return <ChatView chat={openChat} user={dummyUser} onBack={() => setOpenChat(null)} />;
  }

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "1.2rem 1.2rem 0.8rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem" }} className="vn-gradient-text">
          Уведомления
        </h1>
        {notifs.length > 0 && (
          <button onClick={() => setNotifs([])}
            style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "50px", padding: "0.35rem 0.75rem", color: "#E74C3C", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="Trash2" size={12} color="#E74C3C" />Очистить
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {notifs.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--vn-muted)" }}>
            <Icon name="BellOff" size={48} color="var(--vn-muted)" />
            <p style={{ marginTop: "1rem", fontSize: "0.95rem" }}>Нет уведомлений</p>
          </div>
        ) : notifs.map((n, i) => {
          const cfg = notifConfig[n.type];
          return (
            <div key={n.id}
              style={{ display: "flex", alignItems: "flex-start", gap: "0.9rem", padding: "0.9rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)", animation: `vn-appear 0.3s ease ${i * 0.07}s both`, cursor: "pointer", transition: "background 0.15s" }}
              onClick={() => setOpenChat(n.chatData)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setOpenChat(n.chatData)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: avatarColors[i % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1.1rem" }}>
                    {n.avatar}
                  </div>
                </button>
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: "50%", background: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--vn-bg)" }}>
                  <Icon name={cfg.icon} size={10} color="white" />
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 2 }}>{n.from}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--vn-muted)", marginBottom: "0.5rem" }}>{cfg.label}</div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                  {(n.type === "missed_audio" || n.type === "missed_video") && (
                    <>
                      <button
                        onClick={() => { remove(n.id); setOpenCall({ type: n.type === "missed_audio" ? "audio" : "video", chat: n.chatData, incoming: true }); }}
                        style={{ background: "rgba(46,204,113,0.12)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: "50px", padding: "0.3rem 0.75rem", color: "#2ECC71", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon name={n.type === "missed_audio" ? "Phone" : "Video"} size={11} color="#2ECC71" />
                        Перезвонить
                      </button>
                      <button
                        onClick={() => setOpenChat(n.chatData)}
                        style={{ background: "rgba(33,150,243,0.1)", border: "1px solid rgba(33,150,243,0.25)", borderRadius: "50px", padding: "0.3rem 0.75rem", color: "var(--vn-blue-bright)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon name="MessageCircle" size={11} color="var(--vn-blue-bright)" />
                        Написать
                      </button>
                    </>
                  )}
                  {n.type === "friend_req" && (
                    <>
                      <button
                        onClick={() => remove(n.id)}
                        style={{ background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))", border: "none", borderRadius: "50px", padding: "0.3rem 0.75rem", color: "white", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
                        Принять
                      </button>
                      <button
                        onClick={() => remove(n.id)}
                        style={{ background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "50px", padding: "0.3rem 0.75rem", color: "var(--vn-muted)", cursor: "pointer", fontSize: "0.75rem" }}>
                        Отклонить
                      </button>
                    </>
                  )}
                  {n.type === "message" && (
                    <button
                      onClick={() => setOpenChat(n.chatData)}
                      style={{ background: "rgba(33,150,243,0.1)", border: "1px solid rgba(33,150,243,0.25)", borderRadius: "50px", padding: "0.3rem 0.75rem", color: "var(--vn-blue-bright)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="MessageCircle" size={11} color="var(--vn-blue-bright)" />
                      Ответить
                    </button>
                  )}
                </div>
              </div>

              <span style={{ fontSize: "0.72rem", color: "var(--vn-muted)", flexShrink: 0, marginTop: 2 }}>{n.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}