import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";
import ChatView, { ChatData } from "./ChatView";
import func2url from "../../../backend/func2url.json";

interface Chat {
  id: number;
  email: string;
  name: string;
  surname: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  from_me?: boolean;
  pinned?: boolean;
  muted?: boolean;
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#1565C0,#2196F3)",
  "linear-gradient(135deg,#1976D2,#42A5F5)",
  "linear-gradient(135deg,#0D47A1,#1976D2)",
  "linear-gradient(135deg,#1565C0,#29B6F6)",
  "linear-gradient(135deg,#0D47A1,#42A5F5)",
  "linear-gradient(135deg,#1565C0,#64B5F6)",
];

interface Props {
  user: User;
}

export default function ChatsScreen({ user }: Props) {
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [menuChat, setMenuChat] = useState<Chat | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Chat | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadChats = useCallback(() => {
    if (!user.email) return;
    fetch(`${func2url["social"]}?action=chats&email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setChats(data.chats);
      })
      .finally(() => setLoading(false));
  }, [user.email]);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 5000);
    return () => clearInterval(interval);
  }, [loadChats]);

  const startPress = useCallback((chat: Chat) => {
    pressTimer.current = setTimeout(() => setMenuChat(chat), 500);
  }, []);

  const endPress = useCallback((chat: Chat) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (!menuChat) setActiveChat(chat);
  }, [menuChat]);

  const cancelPress = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, []);

  const sorted = [...chats]
    .filter((c) => `${c.name} ${c.surname}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  if (activeChat) {
    const chatData: ChatData = {
      id: activeChat.id,
      email: activeChat.email,
      name: `${activeChat.name} ${activeChat.surname}`.trim(),
      avatar: activeChat.avatar,
      online: activeChat.online,
    };
    return (
      <ChatView
        chat={chatData}
        user={user}
        onBack={() => { setActiveChat(null); loadChats(); }}
      />
    );
  }

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "1rem 1.2rem 0.8rem", borderBottom: "1px solid var(--vn-border)", background: "var(--vn-card)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
          <h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem" }} className="vn-gradient-text">Чаты</h1>
          <button onClick={loadChats} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-muted)" }}>
            <Icon name="RefreshCw" size={18} />
          </button>
        </div>
        <div style={{ position: "relative" }}>
          <Icon name="Search" size={16} color="var(--vn-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input className="vn-input" placeholder="Поиск чатов" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: "2.4rem", fontSize: "0.9rem" }} />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--vn-muted)" }}>
            <Icon name="Loader" size={28} color="var(--vn-muted)" />
            <p style={{ marginTop: "0.8rem", fontSize: "0.9rem" }}>Загружаем чаты...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--vn-muted)" }}>
            <Icon name="MessageCircle" size={48} color="var(--vn-muted)" />
            <p style={{ marginTop: "1rem", fontWeight: 600 }}>Нет чатов</p>
            <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>Найди людей в разделе Поиск и напиши им</p>
          </div>
        ) : sorted.map((chat, i) => (
          <div
            key={chat.id}
            style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.75rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer", transition: "background 0.15s", userSelect: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            onMouseDown={() => startPress(chat)}
            onMouseUp={() => endPress(chat)}
            onMouseMove={cancelPress}
            onTouchStart={() => startPress(chat)}
            onTouchEnd={() => endPress(chat)}
            onTouchMove={cancelPress}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.2rem", color: "white" }}>
                {chat.avatar}
              </div>
              {chat.online && <div className="vn-online" style={{ position: "absolute", bottom: 1, right: 1 }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{chat.name} {chat.surname}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--vn-muted)", flexShrink: 0, marginLeft: 8 }}>{chat.time}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <span style={{ fontSize: "0.82rem", color: "var(--vn-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>
                  {chat.from_me ? "Вы: " : ""}{chat.lastMsg}
                </span>
                {chat.unread > 0 && (
                  <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: "var(--vn-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "white", padding: "0 5px", flexShrink: 0 }}>
                    {chat.unread}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Context menu */}
      {menuChat && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setMenuChat(null)}>
          <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "var(--vn-card)", border: "1px solid var(--vn-border)", borderRadius: "1rem", overflow: "hidden", minWidth: 220 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", fontWeight: 600 }}>{menuChat.name} {menuChat.surname}</div>
            {[
              { icon: "Pin", label: menuChat.pinned ? "Открепить" : "Закрепить", action: () => { setChats((p) => p.map((c) => c.id === menuChat.id ? { ...c, pinned: !c.pinned } : c)); setMenuChat(null); } },
              { icon: "Trash2", label: "Удалить чат", action: () => { setConfirmDelete(menuChat); setMenuChat(null); }, danger: true },
            ].map((item) => (
              <button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "0.85rem 1.2rem", background: "none", border: "none", cursor: "pointer", color: item.danger ? "#E74C3C" : "var(--vn-text)", fontSize: "0.9rem" }}>
                <Icon name={item.icon} size={17} color={item.danger ? "#E74C3C" : "var(--vn-muted)"} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "var(--vn-card)", borderRadius: "1rem", padding: "1.5rem", maxWidth: 320, width: "100%" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Удалить чат?</h3>
            <p style={{ color: "var(--vn-muted)", fontSize: "0.88rem", marginBottom: "1.2rem" }}>Сообщения будут удалены только у вас.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "0.7rem", background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "0.6rem", color: "var(--vn-text)", cursor: "pointer" }}>Отмена</button>
              <button onClick={() => { setChats((p) => p.filter((c) => c.id !== confirmDelete.id)); setConfirmDelete(null); showToast("Чат удалён"); }} style={{ flex: 1, padding: "0.7rem", background: "#E74C3C", border: "none", borderRadius: "0.6rem", color: "white", cursor: "pointer", fontWeight: 600 }}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "var(--vn-card)", border: "1px solid var(--vn-border)", borderRadius: "50px", padding: "0.5rem 1.2rem", fontSize: "0.85rem", zIndex: 300, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}