import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import ChatView, { ChatData } from "./ChatView";
import CallScreen from "./CallScreen";
import CityPicker from "./CityPicker";

import { User } from "@/pages/Index";
import func2url from "@/api";

interface SearchUser {
  id: number;
  name: string;
  surname: string;
  city: string;
  age: number;
  avatar: string;
  avatar_url?: string;
  isBlocked: boolean;
  friends: string[];
  status: string;
  online: boolean;
  email: string;
}


const avatarColors = [
  "linear-gradient(135deg,#1565C0,#2196F3)",
  "linear-gradient(135deg,#1976D2,#42A5F5)",
  "linear-gradient(135deg,#0D47A1,#1976D2)",
  "linear-gradient(135deg,#1565C0,#29B6F6)",
  "linear-gradient(135deg,#0D47A1,#42A5F5)",
  "linear-gradient(135deg,#1565C0,#64B5F6)",
  "linear-gradient(135deg,#1976D2,#29B6F6)",
  "linear-gradient(135deg,#0D47A1,#2196F3)",
];

const dummyUser: User = { email: "", name: "", surname: "", city: "", phone: "", birthdate: "", about: "", avatar: "", online: true };

interface Props {
  theme?: "dark" | "light";
  toggleTheme?: () => void;
  currentUser?: User;
}

export default function SearchScreen({ theme = "dark", toggleTheme, currentUser }: Props) {
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [openChat, setOpenChat] = useState<ChatData | null>(null);
  const [openCall, setOpenCall] = useState<{ type: "audio" | "video"; chat: ChatData } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<number[]>([]);
  const [pendingIds, setPendingIds] = useState<number[]>([]);

  const loadUsers = useCallback(() => {
    const email = currentUser?.email || "";
    fetch(`${func2url["get-users"]}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.users)) {
          setUsers(data.users.map((u: { id: number; name: string; surname: string; city: string; about: string; online: boolean; avatar: string; email: string; avatar_url?: string }) => ({
            id: u.id,
            name: u.name || "",
            surname: u.surname || "",
            city: u.city || "",
            age: 0,
            avatar: u.avatar || (u.name || "?")[0].toUpperCase(),
            avatar_url: u.avatar_url || "",
            isBlocked: false,
            friends: [],
            status: u.about || "",
            online: u.online || false,
            email: u.email || "",
          })));
        }
      })
      .finally(() => setLoading(false));
  }, [currentUser?.email]);

  useEffect(() => {
    loadUsers();
    const t = setInterval(loadUsers, 30000);
    return () => clearInterval(t);
  }, [loadUsers]);

  useEffect(() => {
    if (!currentUser?.email) return;
    fetch(`${func2url["social"]}?action=friends&email=${encodeURIComponent(currentUser.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setFriendIds(data.friends.map((f: { id: number }) => f.id));
          setPendingIds(data.outgoing_ids);
        }
      });
  }, [currentUser?.email]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const filtered = users.filter((u) => {
    if (u.isBlocked) return false;
    const q = query.toLowerCase();
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.surname.toLowerCase().includes(q);
    const matchCity = !cityFilter || u.city.toLowerCase().includes(cityFilter.toLowerCase());
    return matchQ && matchCity;
  });

  const isFriend = (id: number) => friendIds.includes(id);
  const isPending = (id: number) => pendingIds.includes(id);

  const handleFriendBtn = async (u: SearchUser) => {
    if (!currentUser?.email) return;
    if (isFriend(u.id)) {
      await fetch(`${func2url["social"]}?action=friend`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_email: currentUser.email, to_email: u.email, fr_action: "remove" }),
      });
      setFriendIds((p) => p.filter((id) => id !== u.id));
      showToast("Удалён из друзей");
    } else if (isPending(u.id)) {
      await fetch(`${func2url["social"]}?action=friend`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_email: currentUser.email, to_email: u.email, fr_action: "decline" }),
      });
      setPendingIds((p) => p.filter((id) => id !== u.id));
      showToast("Запрос отменён");
    } else {
      await fetch(`${func2url["social"]}?action=friend`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_email: currentUser.email, to_email: u.email, fr_action: "send" }),
      });
      setPendingIds((p) => [...p, u.id]);
      showToast(`Запрос отправлен ${u.name}`);
    }
  };

  const blockUser = async (u: SearchUser) => {
    if (!currentUser?.email) return;
    await fetch(`${func2url["social"]}?action=block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ my_email: currentUser.email, target_email: u.email, block_action: "block" }),
    });
    setUsers((prev) => prev.filter((usr) => usr.id !== u.id));
    setSelectedUser(null);
    showToast(`${u.name} заблокирован`);
  };

  if (openCall) {
    return <div style={{ position: "relative", height: "100%" }}><CallScreen type={openCall.type} name={openCall.chat.name} avatar={openCall.chat.avatar} onEnd={() => setOpenCall(null)} /></div>;
  }

  if (openChat) {
    return <ChatView chat={openChat} user={currentUser || dummyUser} onBack={() => setOpenChat(null)} />;
  }

  if (selectedUser) {
    const chatData: ChatData = { id: selectedUser.id, email: selectedUser.email, name: `${selectedUser.name} ${selectedUser.surname}`, avatar: selectedUser.avatar, online: selectedUser.online, city: selectedUser.city, age: selectedUser.age };
    const color = avatarColors[selectedUser.id % avatarColors.length];
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "0.9rem 1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <span style={{ fontWeight: 600 }}>Профиль</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          {/* Cover */}
          <div style={{ height: 120, background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light),var(--vn-blue-bright))", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'><circle cx='160' cy='20' r='70' fill='rgba(255,255,255,0.06)'/></svg>\")" }} />
            <div style={{ position: "absolute", bottom: -36, left: "50%", transform: "translateX(-50%)", width: 72, height: 72, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.6rem", color: "white", border: "3px solid var(--vn-bg)", boxShadow: "0 6px 20px rgba(33,150,243,0.35)" }}>
              {selectedUser.avatar}
            </div>
          </div>
          <div style={{ paddingTop: "2.8rem", padding: "2.8rem 1.2rem 1.2rem", textAlign: "center" }}>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.4rem" }}>{selectedUser.name} {selectedUser.surname}</h2>
            <p style={{ color: "var(--vn-muted)", fontSize: "0.84rem", marginTop: 4 }}>{selectedUser.city}</p>
            {selectedUser.status && <p style={{ color: "var(--vn-blue-bright)", fontSize: "0.85rem", marginTop: 6, fontStyle: "italic" }}>{selectedUser.status}</p>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: selectedUser.online ? "#2ECC71" : "var(--vn-muted)" }} />
              <span style={{ fontSize: "0.78rem", color: selectedUser.online ? "#2ECC71" : "var(--vn-muted)" }}>{selectedUser.online ? "онлайн" : "не в сети"}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", padding: "0 1.2rem", marginBottom: "0.65rem" }}>
            <button onClick={() => setOpenChat(chatData)} className="vn-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0.75rem", fontSize: "0.88rem" }}>
              <Icon name="MessageCircle" size={15} color="white" />Написать
            </button>
            <button
              onClick={() => handleFriendBtn(selectedUser)}
              className="vn-btn"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0.75rem", fontSize: "0.88rem", background: isFriend(selectedUser.id) ? "var(--vn-card2)" : isPending(selectedUser.id) ? "var(--vn-card2)" : "linear-gradient(135deg,#1565C0,#42A5F5)", border: (isFriend(selectedUser.id) || isPending(selectedUser.id)) ? "1px solid var(--vn-border)" : "none", color: (isFriend(selectedUser.id) || isPending(selectedUser.id)) ? "var(--vn-text)" : "white" }}>
              <Icon name={isFriend(selectedUser.id) ? "UserMinus" : isPending(selectedUser.id) ? "Clock" : "UserPlus"} size={15} color={(isFriend(selectedUser.id) || isPending(selectedUser.id)) ? "var(--vn-muted)" : "white"} />
              {isFriend(selectedUser.id) ? "Удалить" : isPending(selectedUser.id) ? "Запрос отправлен" : "Добавить"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", padding: "0 1.2rem", marginBottom: "1rem" }}>
            <button onClick={() => { setSelectedUser(null); setOpenCall({ type: "audio", chat: chatData }); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0.65rem", background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: "0.75rem", color: "#2ECC71", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
              <Icon name="Phone" size={15} color="#2ECC71" />Позвонить
            </button>
            <button onClick={() => { setSelectedUser(null); setOpenCall({ type: "video", chat: chatData }); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0.65rem", background: "rgba(33,150,243,0.1)", border: "1px solid rgba(33,150,243,0.25)", borderRadius: "0.75rem", color: "var(--vn-blue-bright)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
              <Icon name="Video" size={15} color="var(--vn-blue-bright)" />Видео
            </button>
          </div>
          <div style={{ padding: "0 1.2rem 1.2rem" }}>
            <button onClick={() => blockUser(selectedUser)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.25)", borderRadius: "0.75rem", padding: "0.75rem", color: "#E74C3C", cursor: "pointer", fontSize: "0.88rem" }}>
              <Icon name="Ban" size={15} color="#E74C3C" />Заблокировать
            </button>
          </div>

          {/* Photo grid */}
          <div style={{ padding: "0 1.2rem 1rem" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.6rem" }}>Фото</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: "0.5rem", background: `linear-gradient(135deg,rgba(21,101,192,${0.25 + i * 0.04}),rgba(33,150,243,${0.18 + i * 0.04}))`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="Image" size={18} color="rgba(255,255,255,0.25)" />
                </div>
              ))}
            </div>
          </div>

          {/* Friends */}
          <div style={{ padding: "0 1.2rem 1.5rem" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.65rem" }}>Общие друзья</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: "0.82rem", color: "var(--vn-muted)" }}>Нет общих</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header + filters */}
      <div style={{ padding: "1.2rem 1.2rem 0.8rem", borderBottom: "1px solid var(--vn-border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
          <h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem" }} className="vn-gradient-text">ВайНах Поиск</h1>
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "var(--vn-card2)",
                border: "1px solid var(--vn-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.25s",
                fontSize: "1.15rem", flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1) rotate(15deg)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1) rotate(0deg)")}
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div style={{ position: "relative" }}>
            <Icon name="Search" size={16} color="var(--vn-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
            <input className="vn-input" placeholder="Имя или фамилия" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: "2.5rem", fontSize: "0.9rem" }} />
          </div>
          <button
            onClick={() => setShowCityPicker(true)}
            className="vn-input"
            style={{ position: "relative", display: "flex", alignItems: "center", width: "100%", paddingLeft: "2.5rem", fontSize: "0.9rem", cursor: "pointer", textAlign: "left", background: "var(--vn-card2)" }}
          >
            <Icon name="MapPin" size={16} color="var(--vn-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
            <span style={{ flex: 1, color: cityFilter ? "var(--vn-text)" : "var(--vn-muted)" }}>{cityFilter || "Город"}</span>
            {cityFilter ? (
              <span onClick={(e) => { e.stopPropagation(); setCityFilter(""); }} style={{ cursor: "pointer" }}><Icon name="X" size={15} color="var(--vn-muted)" /></span>
            ) : (
              <Icon name="ChevronDown" size={15} color="var(--vn-muted)" />
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        <div style={{ padding: "0.5rem 1.2rem 0.3rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {filtered.length} {filtered.length === 1 ? "человек" : filtered.length < 5 ? "человека" : "человек"}
          </span>
          {(query || cityFilter) && (
            <button onClick={() => { setQuery(""); setCityFilter(""); }} style={{ background: "none", border: "none", color: "var(--vn-blue-bright)", cursor: "pointer", fontSize: "0.78rem" }}>
              Сбросить
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--vn-muted)" }}>
            <p>Загружаем пользователей...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--vn-muted)" }}>
            <Icon name="SearchX" size={40} color="var(--vn-muted)" />
            <p style={{ marginTop: "1rem" }}>Никого не найдено</p>
          </div>
        ) : filtered.map((u, i) => (
          <div key={u.id}
            style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.8rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)", animation: `vn-appear 0.3s ease ${i * 0.05}s both`, transition: "background 0.15s", cursor: "pointer" }}
            onClick={() => setSelectedUser(u)}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: u.avatar_url ? "none" : avatarColors[u.id % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1.1rem", overflow: "hidden" }}>
                {u.avatar_url ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.avatar}
              </div>
              {u.online && <div className="vn-online" style={{ position: "absolute", bottom: 1, right: 1 }} />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{u.name} {u.surname}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--vn-muted)", marginTop: 1 }}>{u.city}</div>
              {u.status && <div style={{ fontSize: "0.76rem", color: "var(--vn-blue-bright)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.status}</div>}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleFriendBtn(u); }}
              style={{
                background: isFriend(u.id) ? "rgba(46,204,113,0.12)" : isPending(u.id) ? "var(--vn-card2)" : "rgba(33,150,243,0.1)",
                border: `1px solid ${isFriend(u.id) ? "rgba(46,204,113,0.3)" : isPending(u.id) ? "var(--vn-border)" : "rgba(33,150,243,0.25)"}`,
                borderRadius: "50px", padding: "0.35rem 0.7rem",
                color: isFriend(u.id) ? "#2ECC71" : isPending(u.id) ? "var(--vn-muted)" : "var(--vn-blue-bright)",
                cursor: "pointer", fontSize: "0.74rem", fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.2s", flexShrink: 0,
              }}>
              {isFriend(u.id) ? "✓ Друг" : isPending(u.id) ? "Запрос отправлен" : "+ Добавить"}
            </button>
          </div>
        ))}
      </div>

      {showCityPicker && (
        <CityPicker value={cityFilter} onChange={setCityFilter} onClose={() => setShowCityPicker(false)} />
      )}

      {toast && (
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(13,22,38,0.95)", color: "var(--vn-text)", borderRadius: "50px", padding: "0.55rem 1.2rem", fontSize: "0.82rem", fontWeight: 500, zIndex: 80, border: "1px solid var(--vn-border)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}