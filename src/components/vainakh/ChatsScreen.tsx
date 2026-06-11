import { useState } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";
import ChatView from "./ChatView";

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  isGroup?: boolean;
}

const mockChats: Chat[] = [
  { id: 1, name: "Зайнаб Хасанова", avatar: "З", lastMsg: "Привет! Как дела? 👋", time: "14:32", unread: 2, online: true },
  { id: 2, name: "Ислам Дудаев", avatar: "И", lastMsg: "Завтра встретимся?", time: "13:15", unread: 0, online: true },
  { id: 3, name: "Группа Семья 🏠", avatar: "С", lastMsg: "Ахмед: Завтра приеду", time: "12:00", unread: 5, online: false, isGroup: true },
  { id: 4, name: "Руслан Арсанов", avatar: "Р", lastMsg: "Ок, понял", time: "Вчера", unread: 0, online: false },
  { id: 5, name: "Малика Садулаева", avatar: "М", lastMsg: "🎵 Голосовое сообщение", time: "Вчера", unread: 1, online: false },
  { id: 6, name: "Сообщество ВайНах 🌐", avatar: "В", lastMsg: "Новости: обновление 2.0!", time: "Вт", unread: 12, online: false, isGroup: true },
];

const avatarColors = [
  "linear-gradient(135deg, #FF6B35, #E91E8C)",
  "linear-gradient(135deg, #5B3FD4, #9B59B6)",
  "linear-gradient(135deg, #00BCD4, #5B3FD4)",
  "linear-gradient(135deg, #2ECC71, #00BCD4)",
  "linear-gradient(135deg, #E91E8C, #FF6B35)",
  "linear-gradient(135deg, #9B59B6, #E91E8C)",
];

interface Props {
  user: User;
}

export default function ChatsScreen({ user }: Props) {
  const [search, setSearch] = useState("");
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [longPressChat, setLongPressChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState(mockChats);

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (activeChat) {
    return <ChatView chat={activeChat} user={user} onBack={() => setActiveChat(null)} />;
  }

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "1.2rem 1.2rem 0.8rem", borderBottom: "1px solid var(--vn-border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
          <h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem" }} className="vn-gradient-text">
            ВайНах Чаты
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{ background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Icon name="Plus" size={18} color="var(--vn-orange)" />
            </button>
          </div>
        </div>

        {showMenu && (
          <div style={{ background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "0.75rem", padding: "0.5rem", marginBottom: "0.5rem", animation: "vn-appear 0.2s ease" }}>
            {[
              { icon: "Users", label: "Создать группу" },
              { icon: "Globe", label: "Создать сообщество" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setShowMenu(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", color: "var(--vn-text)", padding: "0.6rem 0.8rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}
              >
                <Icon name={item.icon} size={16} color="var(--vn-orange)" />
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ position: "relative" }}>
          <Icon name="Search" size={16} color="var(--vn-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            className="vn-input"
            placeholder="Поиск по чатам"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
      </div>

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {filtered.map((chat, i) => (
          <div
            key={chat.id}
            onClick={() => setActiveChat(chat)}
            onContextMenu={(e) => { e.preventDefault(); setLongPressChat(chat); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.9rem",
              padding: "0.75rem 1.2rem",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              transition: "background 0.15s",
              position: "relative",
              animation: `vn-appear 0.3s ease ${i * 0.05}s both`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,53,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: avatarColors[i % avatarColors.length],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "white",
                }}
              >
                {chat.avatar}
              </div>
              {chat.online && <div className="vn-online" style={{ position: "absolute", bottom: 1, right: 1 }} />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {chat.name}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--vn-muted)", flexShrink: 0, marginLeft: 8 }}>{chat.time}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--vn-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {chat.lastMsg}
                </span>
                {chat.unread > 0 && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))",
                      color: "white",
                      borderRadius: "50px",
                      minWidth: 20,
                      height: 20,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 5px",
                      marginLeft: 8,
                      flexShrink: 0,
                    }}
                  >
                    {chat.unread}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Long press context menu */}
      {longPressChat && (
        <div
          onClick={() => setLongPressChat(null)}
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "flex-end" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--vn-card)", borderRadius: "1.5rem 1.5rem 0 0", padding: "1.5rem", width: "100%", animation: "vn-slide-in 0.25s ease" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.2rem", paddingBottom: "1rem", borderBottom: "1px solid var(--vn-border)" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: avatarColors[0], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>
                {longPressChat.avatar}
              </div>
              <span style={{ fontWeight: 600 }}>{longPressChat.name}</span>
            </div>
            {[
              { icon: "Trash2", label: "Очистить чат", color: "var(--vn-muted)" },
              { icon: "Trash", label: "Удалить чат", color: "#E74C3C" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.label === "Удалить чат") {
                    setChats(chats.filter((c) => c.id !== longPressChat.id));
                  }
                  setLongPressChat(null);
                }}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", color: item.color, padding: "0.8rem 0.5rem", cursor: "pointer", fontSize: "0.95rem", borderRadius: "0.5rem" }}
              >
                <Icon name={item.icon} size={18} color={item.color} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
