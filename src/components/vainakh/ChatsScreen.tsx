import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";
import ChatView, { ChatData } from "./ChatView";

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  isGroup?: boolean;
  pinned?: boolean;
  muted?: boolean;
}

const INITIAL_CHATS: Chat[] = [
  { id: 1, name: "Зайнаб Хасанова", avatar: "З", lastMsg: "Привет! Как дела? 👋", time: "14:32", unread: 2, online: true },
  { id: 2, name: "Ислам Дудаев", avatar: "И", lastMsg: "Завтра встретимся?", time: "13:15", unread: 0, online: true },
  { id: 3, name: "Группа Семья 🏠", avatar: "С", lastMsg: "Ахмед: Завтра приеду", time: "12:00", unread: 5, online: false, isGroup: true },
  { id: 4, name: "Руслан Арсанов", avatar: "Р", lastMsg: "Ок, понял", time: "Вчера", unread: 0, online: false },
  { id: 5, name: "Малика Садулаева", avatar: "М", lastMsg: "🎵 Голосовое сообщение", time: "Вчера", unread: 1, online: false },
  { id: 6, name: "Сообщество ВайНах 🌐", avatar: "В", lastMsg: "Новости: обновление 2.0!", time: "Вт", unread: 12, online: false, isGroup: true },
];

const FRIENDS = [
  { id: 10, name: "Зайнаб", surname: "Хасанова", avatar: "З", online: true },
  { id: 11, name: "Ислам", surname: "Дудаев", avatar: "И", online: true },
  { id: 12, name: "Малика", surname: "Садулаева", avatar: "М", online: false },
  { id: 13, name: "Руслан", surname: "Арсанов", avatar: "Р", online: false },
  { id: 14, name: "Хеда", surname: "Гайтаева", avatar: "Х", online: true },
  { id: 15, name: "Адам", surname: "Берсанов", avatar: "А", online: false },
];

const AVATAR_COLORS = [
  "linear-gradient(135deg,#1565C0,#2196F3)",
  "linear-gradient(135deg,#1976D2,#42A5F5)",
  "linear-gradient(135deg,#0D47A1,#1976D2)",
  "linear-gradient(135deg,#1565C0,#29B6F6)",
  "linear-gradient(135deg,#0D47A1,#42A5F5)",
  "linear-gradient(135deg,#1565C0,#64B5F6)",
];

interface UserProfileData {
  id: number;
  name: string;
  surname?: string;
  avatar: string;
  online: boolean;
  city?: string;
}

interface Props {
  user: User;
}

export default function ChatsScreen({ user }: Props) {
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [menuChat, setMenuChat] = useState<Chat | null>(null);
  const [viewProfile, setViewProfile] = useState<UserProfileData | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [plusMenuPos, setPlusMenuPos] = useState({ top: 0, right: 0 });

  // Long-press detection
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressChat = useRef<Chat | null>(null);

  const startPress = useCallback((chat: Chat) => {
    pressChat.current = chat;
    pressTimer.current = setTimeout(() => {
      setMenuChat(chat);
    }, 500);
  }, []);

  const endPress = useCallback((chat: Chat, didMove: boolean) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (!didMove && !menuChat) {
      setActiveChat(chat);
    }
  }, [menuChat]);

  const cancelPress = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, []);

  const sorted = [...chats]
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const updateChat = (id: number, patch: Partial<Chat>) =>
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const deleteChat = (id: number) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    setMenuChat(null);
  };

  const clearChat = (id: number) => {
    updateChat(id, { lastMsg: "", unread: 0 });
    setMenuChat(null);
  };

  const pinChat = (id: number) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
    setMenuChat(null);
  };

  const muteChat = (id: number) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c)));
    setMenuChat(null);
  };

  // Start new chat from friends list
  const startNewChat = (friend: typeof FRIENDS[0]) => {
    const exists = chats.find((c) => c.name === `${friend.name} ${friend.surname}`);
    if (exists) {
      setActiveChat(exists);
    } else {
      const newChat: Chat = {
        id: Date.now(),
        name: `${friend.name} ${friend.surname}`,
        avatar: friend.avatar,
        lastMsg: "",
        time: "",
        unread: 0,
        online: friend.online,
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat);
    }
    setShowNewChat(false);
  };

  // Open chat
  if (activeChat) {
    const chatData: ChatData = {
      id: activeChat.id,
      name: activeChat.name,
      avatar: activeChat.avatar,
      online: activeChat.online,
    };
    return <ChatView chat={chatData} user={user} onBack={() => setActiveChat(null)} />;
  }

  // View profile of a person (short tap on avatar/name)
  if (viewProfile) {
    const chatData: ChatData = {
      id: viewProfile.id,
      name: `${viewProfile.name}${viewProfile.surname ? " " + viewProfile.surname : ""}`,
      avatar: viewProfile.avatar,
      online: viewProfile.online,
      city: viewProfile.city,
    };
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "0.9rem 1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setViewProfile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}>
            <Icon name="ArrowLeft" size={22} />
          </button>
          <span style={{ fontWeight: 600 }}>Профиль</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          <div style={{ height: 130, background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light),var(--vn-blue-bright))", position: "relative" }} />
          <div style={{ padding: "0 1.2rem 1.2rem", position: "relative" }}>
            <div style={{ marginTop: -44, width: 88, height: 88, borderRadius: "50%", background: AVATAR_COLORS[viewProfile.id % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "2rem", color: "white", border: "4px solid var(--vn-bg)", position: "relative", marginBottom: "0.75rem" }}>
              {viewProfile.avatar}
              {viewProfile.online && <div className="vn-online" style={{ position: "absolute", bottom: 4, right: 4, width: 14, height: 14 }} />}
            </div>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>{viewProfile.name}{viewProfile.surname ? " " + viewProfile.surname : ""}</h2>
            <p style={{ color: viewProfile.online ? "#2ECC71" : "var(--vn-muted)", fontSize: "0.84rem", marginBottom: "1.2rem" }}>
              {viewProfile.online ? "🟢 онлайн" : "⚫ не в сети"}{viewProfile.city ? " · " + viewProfile.city : ""}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              <button
                onClick={() => { setViewProfile(null); const c = chats.find(ch => ch.id === viewProfile.id); if (c) setActiveChat(c); else { const nc: Chat = { id: viewProfile.id, name: `${viewProfile.name}${viewProfile.surname ? " " + viewProfile.surname : ""}`, avatar: viewProfile.avatar, lastMsg: "", time: "", unread: 0, online: viewProfile.online }; setChats(p => [nc, ...p]); setActiveChat(nc); } }}
                className="vn-btn"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.75rem", fontSize: "0.9rem" }}
              >
                <Icon name="MessageCircle" size={16} color="white" />Написать
              </button>
              <button className="vn-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.75rem", fontSize: "0.9rem", background: "linear-gradient(135deg,var(--vn-blue-mid),var(--vn-blue-bright))" }}>
                <Icon name="Phone" size={16} color="white" />Позвонить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // New chat — pick friend
  if (showNewChat) {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setShowNewChat(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}>
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem", flex: 1 }}>Новая беседа</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          <div style={{ padding: "0.75rem 1.2rem 0.3rem" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Выберите собеседника</p>
          </div>
          {FRIENDS.map((f, i) => (
            <button
              key={f.id}
              onClick={() => startNewChat(f)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "0.9rem 1.2rem", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s", animation: `vn-appear 0.25s ease ${i * 0.05}s both` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1.1rem" }}>{f.avatar}</div>
                {f.online && <div className="vn-online" style={{ position: "absolute", bottom: 1, right: 1 }} />}
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{f.name} {f.surname}</div>
                <div style={{ fontSize: "0.76rem", color: f.online ? "#2ECC71" : "var(--vn-muted)", marginTop: 2 }}>{f.online ? "онлайн" : "не в сети"}</div>
              </div>
              <Icon name="ChevronRight" size={16} color="var(--vn-muted)" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "1.2rem 1.2rem 0.8rem", borderBottom: "1px solid var(--vn-border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
          <h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem" }} className="vn-gradient-text">
            ВайНах Чаты
          </h1>
          {/* FAB + button */}
          <button
            onClick={() => setShowNewChat(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(33,150,243,0.45)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Icon name="Plus" size={20} color="white" />
          </button>
        </div>

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
        {sorted.map((chat, i) => {
          let pressStarted = false;
          let moved = false;

          return (
            <div
              key={chat.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.9rem",
                padding: "0.75rem 1.2rem",
                cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                transition: "background 0.15s",
                position: "relative",
                animation: `vn-appear 0.3s ease ${i * 0.04}s both`,
                background: chat.pinned ? "rgba(33,150,243,0.04)" : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = chat.pinned ? "rgba(33,150,243,0.09)" : "rgba(33,150,243,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = chat.pinned ? "rgba(33,150,243,0.04)" : "transparent")}
              onPointerDown={() => { pressStarted = true; moved = false; startPress(chat); }}
              onPointerMove={() => { if (pressStarted) { moved = true; cancelPress(); } }}
              onPointerUp={() => { if (!moved) endPress(chat, false); pressStarted = false; }}
              onPointerCancel={cancelPress}
              onContextMenu={(e) => { e.preventDefault(); setMenuChat(chat); }}
            >
              {/* Pin indicator */}
              {chat.pinned && (
                <div style={{ position: "absolute", top: 6, right: 8 }}>
                  <Icon name="Pin" size={11} color="var(--vn-blue-bright)" />
                </div>
              )}

              {/* Avatar — short tap → profile */}
              <div
                style={{ position: "relative", flexShrink: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (pressTimer.current) clearTimeout(pressTimer.current);
                  setViewProfile({ id: chat.id, name: chat.name, avatar: chat.avatar, online: chat.online });
                }}
              >
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.1rem", color: "white" }}>
                  {chat.avatar}
                </div>
                {chat.online && <div className="vn-online" style={{ position: "absolute", bottom: 1, right: 1 }} />}
              </div>

              {/* Name + last message — click → open chat */}
              <div
                style={{ flex: 1, minWidth: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (pressTimer.current) clearTimeout(pressTimer.current);
                  setActiveChat(chat);
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                    {chat.name}
                    {chat.muted && <Icon name="BellOff" size={12} color="var(--vn-muted)" />}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--vn-muted)", flexShrink: 0, marginLeft: 8 }}>{chat.time}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--vn-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {chat.lastMsg}
                  </span>
                  {chat.unread > 0 && !chat.muted && (
                    <div style={{ background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))", color: "white", borderRadius: "50px", minWidth: 20, height: 20, fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", marginLeft: 8, flexShrink: 0 }}>
                      {chat.unread}
                    </div>
                  )}
                  {chat.unread > 0 && chat.muted && (
                    <div style={{ background: "var(--vn-border)", color: "var(--vn-muted)", borderRadius: "50px", minWidth: 20, height: 20, fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", marginLeft: 8, flexShrink: 0 }}>
                      {chat.unread}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Long-press context menu */}
      {menuChat && (
        <div
          onClick={() => setMenuChat(null)}
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 50, display: "flex", alignItems: "flex-end" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--vn-card)", borderRadius: "1.5rem 1.5rem 0 0", padding: "1.2rem 1rem 1.5rem", width: "100%", animation: "vn-appear 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            {/* Chat preview */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem", paddingBottom: "0.9rem", borderBottom: "1px solid var(--vn-border)" }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: AVATAR_COLORS[chats.indexOf(menuChat) % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1.1rem" }}>
                {menuChat.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{menuChat.name}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--vn-muted)" }}>{menuChat.lastMsg || "Нет сообщений"}</div>
              </div>
            </div>

            {/* Actions */}
            {[
              { icon: menuChat.pinned ? "PinOff" : "Pin", label: menuChat.pinned ? "Открепить" : "Закрепить", action: () => pinChat(menuChat.id), color: "var(--vn-blue-bright)" },
              { icon: menuChat.muted ? "Bell" : "BellOff", label: menuChat.muted ? "Включить звук" : "Отключить звук", action: () => muteChat(menuChat.id), color: "var(--vn-blue-bright)" },
              { icon: "Eraser", label: "Очистить чат", action: () => clearChat(menuChat.id), color: "var(--vn-muted)" },
              { icon: "Trash2", label: "Удалить чат", action: () => deleteChat(menuChat.id), color: "#E74C3C" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", background: "none", border: "none", padding: "0.85rem 0.5rem", cursor: "pointer", borderRadius: "0.75rem", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: item.color === "#E74C3C" ? "rgba(231,76,60,0.1)" : "rgba(33,150,243,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={item.icon} size={17} color={item.color} />
                </div>
                <span style={{ fontSize: "0.95rem", color: item.color === "#E74C3C" ? "#E74C3C" : "var(--vn-text)", fontWeight: item.color === "#E74C3C" ? 600 : 400 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
