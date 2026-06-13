import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";
import ChatView, { ChatData } from "./ChatView";
import CallScreen from "./CallScreen";
import CityPicker from "./CityPicker";
import func2url from "../../../backend/func2url.json";

interface Props {
  user: User;
  setUser: (u: User) => void;
  onLogout?: () => void;
}

type ProfileSection =
  | "main"
  | "settings"
  | "edit"
  | "security"
  | "privacy"
  | "notifications"
  | "appearance"
  | "messages"
  | "storage"
  | "devices"
  | "favorites"
  | "friends"
  | "blocked"
  | "other-profile";

interface OtherProfile {
  name: string;
  surname: string;
  avatar: string;
  city: string;
  birthdate: string;
  online: boolean;
  isFriend: boolean;
}

const RUSSIA_REGIONS = [
  "Республика Адыгея",
  "Республика Алтай",
  "Республика Башкортостан",
  "Республика Бурятия",
  "Республика Дагестан",
  "Республика Ингушетия",
  "Кабардино-Балкарская Республика",
  "Республика Калмыкия",
  "Карачаево-Черкесская Республика",
  "Республика Карелия",
  "Республика Коми",
  "Республика Крым",
  "Республика Марий Эл",
  "Республика Мордовия",
  "Республика Саха (Якутия)",
  "Республика Северная Осетия — Алания",
  "Республика Татарстан",
  "Республика Тыва",
  "Удмуртская Республика",
  "Республика Хакасия",
  "Чеченская Республика",
  "Чувашская Республика",
  "Алтайский край",
  "Забайкальский край",
  "Камчатский край",
  "Краснодарский край",
  "Красноярский край",
  "Пермский край",
  "Приморский край",
  "Ставропольский край",
  "Хабаровский край",
  "Амурская область",
  "Архангельская область",
  "Астраханская область",
  "Белгородская область",
  "Брянская область",
  "Владимирская область",
  "Волгоградская область",
  "Вологодская область",
  "Воронежская область",
  "Ивановская область",
  "Иркутская область",
  "Калининградская область",
  "Калужская область",
  "Кемеровская область",
  "Кировская область",
  "Костромская область",
  "Курганская область",
  "Курская область",
  "Липецкая область",
  "Магаданская область",
  "Московская область",
  "Мурманская область",
  "Нижегородская область",
  "Новгородская область",
  "Новосибирская область",
  "Омская область",
  "Оренбургская область",
  "Орловская область",
  "Пензенская область",
  "Псковская область",
  "Ростовская область",
  "Рязанская область",
  "Самарская область",
  "Саратовская область",
  "Сахалинская область",
  "Свердловская область",
  "Смоленская область",
  "Тамбовская область",
  "Тверская область",
  "Томская область",
  "Тульская область",
  "Тюменская область",
  "Ульяновская область",
  "Челябинская область",
  "Ярославская область",
  "Москва",
  "Санкт-Петербург",
  "Севастополь",
  "Еврейская автономная область",
  "Ненецкий автономный округ",
  "Ханты-Мансийский автономный округ",
  "Чукотский автономный округ",
  "Ямало-Ненецкий автономный округ",
];

interface RealFriend {
  id: number;
  name: string;
  surname: string;
  avatar: string;
  city: string;
  email: string;
  online: boolean;
}

const avatarGrads = [
  "linear-gradient(135deg,#1565C0,#2196F3)",
  "linear-gradient(135deg,#1976D2,#42A5F5)",
  "linear-gradient(135deg,#0D47A1,#1976D2)",
  "linear-gradient(135deg,#1565C0,#29B6F6)",
  "linear-gradient(135deg,#0D47A1,#42A5F5)",
  "linear-gradient(135deg,#1565C0,#64B5F6)",
];

function calcAge(birthdate: string): number | null {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function ProfileScreen({ user, setUser, onLogout }: Props) {
  const [section, setSection] = useState<ProfileSection>("main");
  const [editData, setEditData] = useState({ ...user });
  const [hidePhone, setHidePhone] = useState(false);
  const [hideOnline, setHideOnline] = useState(false);
  const [hideLastSeen, setHideLastSeen] = useState(false);
  const [realFriends, setRealFriends] = useState<RealFriend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<RealFriend[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [notifsOn, setNotifsOn] = useState(true);
  const [notifVibration, setNotifVibration] = useState(true);
  const [showRead, setShowRead] = useState(true);
  const [whoCanMsg, setWhoCanMsg] = useState("all");
  const [twoFa, setTwoFa] = useState(false);
  const [notifSound, setNotifSound] = useState("default");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showRegionSheet, setShowRegionSheet] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null);
  const [friendStates, setFriendStates] = useState<Record<number, boolean>>({});
  const [openChat, setOpenChat] = useState<ChatData | null>(null);
  const [openCall, setOpenCall] = useState<{ type: "audio" | "video"; chat: ChatData } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (section === "friends" && user.email) {
      setFriendsLoading(true);
      fetch(`${func2url["social"]}?action=friends&email=${encodeURIComponent(user.email)}`)
        .then((r) => r.json())
        .then((data) => { if (data.ok) setRealFriends(data.friends); })
        .finally(() => setFriendsLoading(false));
    }
    if ((section === "blocked" || section === "privacy") && user.email) {
      fetch(`${func2url["social"]}?action=blocked&email=${encodeURIComponent(user.email)}`)
        .then((r) => r.json())
        .then((data) => { if (data.ok) setBlockedUsers(data.blocked); });
      if (section === "blocked") setBlockedLoading(true);
    }
  }, [section, user.email]);

  const saveEdit = () => {
    setUser(editData);
    setSection("main");
  };

  const openOtherProfile = (f: RealFriend) => {
    setOtherProfile({
      name: f.name,
      surname: f.surname,
      avatar: f.avatar,
      city: f.city,
      birthdate: "",
      online: f.online,
      isFriend: true,
    });
    setSection("other-profile");
  };

  const filteredRegions = RUSSIA_REGIONS.filter((r) =>
    r.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const otherChatData: ChatData | null = otherProfile
    ? { id: 0, name: `${otherProfile.name} ${otherProfile.surname}`, avatar: otherProfile.avatar, online: otherProfile.online, city: otherProfile.city }
    : null;

  if (openChat) {
    return <ChatView chat={openChat} user={user} onBack={() => setOpenChat(null)} />;
  }

  if (openCall) {
    return (
      <div style={{ position: "relative", height: "100%" }}>
        <CallScreen type={openCall.type} name={openCall.chat.name} avatar={openCall.chat.avatar} onEnd={() => setOpenCall(null)} />
      </div>
    );
  }

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      style={{
        width: 46,
        height: 26,
        borderRadius: 13,
        background: on
          ? "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))"
          : "var(--vn-border)",
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

  const SettingRow = ({
    icon,
    label,
    value,
    onClick,
    danger,
  }: {
    icon: string;
    label: string;
    value?: string;
    onClick?: () => void;
    danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "0.9rem 1.2rem",
        background: "none",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) =>
        onClick && (e.currentTarget.style.background = "rgba(33,150,243,0.05)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: danger
            ? "rgba(231,76,60,0.15)"
            : "rgba(33,150,243,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon
          name={icon}
          size={17}
          color={danger ? "#E74C3C" : "var(--vn-blue-bright)"}
        />
      </div>
      <span
        style={{
          flex: 1,
          textAlign: "left",
          fontSize: "0.9rem",
          color: danger ? "#E74C3C" : "var(--vn-text)",
        }}
      >
        {label}
      </span>
      {value && (
        <span style={{ fontSize: "0.8rem", color: "var(--vn-muted)" }}>
          {value}
        </span>
      )}
      {onClick && <Icon name="ChevronRight" size={16} color="var(--vn-muted)" />}
    </button>
  );

  // ── FRIENDS ──
  if (section === "friends") {
    return (
      <div
        className="vn-screen"
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        <div
          style={{
            padding: "1rem 1.2rem",
            borderBottom: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--vn-card)",
          }}
        >
          <button
            onClick={() => setSection("main")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem", flex: 1 }}>
            Мои друзья
          </h2>
          <span style={{ fontSize: "0.8rem", color: "var(--vn-muted)" }}>{realFriends.length}</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          {friendsLoading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--vn-muted)" }}>
              <Icon name="Loader" size={28} color="var(--vn-muted)" />
              <p style={{ marginTop: "0.8rem", fontSize: "0.9rem" }}>Загружаем...</p>
            </div>
          ) : realFriends.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 1.5rem", color: "var(--vn-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
              <p style={{ fontWeight: 600 }}>Нет друзей</p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>Найди людей в разделе Поиск</p>
            </div>
          ) : realFriends.map((f, i) => (
            <div
              key={f.id}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.9rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)", animation: `vn-appear 0.3s ease ${i * 0.06}s both`, cursor: "pointer" }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: avatarGrads[i % avatarGrads.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1.1rem", boxShadow: "0 4px 12px rgba(33,150,243,0.25)" }}>
                  {f.avatar}
                </div>
                {f.online && <div className="vn-online" style={{ position: "absolute", bottom: 1, right: 1 }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{f.name} {f.surname}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--vn-muted)", marginTop: 2 }}>{f.city}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── BLOCKED ──
  if (section === "blocked") {
    const unblock = async (target: RealFriend) => {
      await fetch(`${func2url["social"]}?action=block`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ my_email: user.email, target_email: target.email, block_action: "unblock" }),
      });
      setBlockedUsers((prev) => prev.filter((u) => u.id !== target.id));
    };
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSection("privacy")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}>
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem", flex: 1 }}>Заблокированные</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--vn-muted)" }}>{blockedUsers.length}</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          {blockedLoading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--vn-muted)" }}>
              <Icon name="Loader" size={28} color="var(--vn-muted)" />
              <p style={{ marginTop: "0.8rem", fontSize: "0.9rem" }}>Загружаем...</p>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 1.5rem", color: "var(--vn-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚫</div>
              <p style={{ fontWeight: 600 }}>Нет заблокированных</p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>Все заблокированные пользователи появятся здесь</p>
            </div>
          ) : blockedUsers.map((u, i) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.9rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: avatarGrads[i % avatarGrads.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1.1rem", flexShrink: 0 }}>
                {u.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{u.name} {u.surname}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--vn-muted)", marginTop: 2 }}>{u.city}</div>
              </div>
              <button
                onClick={() => unblock(u)}
                style={{ padding: "0.4rem 0.9rem", background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: "50px", color: "#2ECC71", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap" }}
              >
                Разблокировать
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── OTHER PROFILE ──
  if (section === "other-profile" && otherProfile) {
    const age = calcAge(otherProfile.birthdate);
    const mutualFriends: RealFriend[] = [];
    const isFriendNow = otherProfile.isFriend;

    const toggleFriend = () => {
      const fId = -1;
      setFriendStates((prev) => ({ ...prev, [fId]: !prev[fId] }));
    };

    return (
      <div
        className="vn-screen"
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        <div
          style={{
            padding: "1rem 1.2rem",
            borderBottom: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--vn-card)",
          }}
        >
          <button
            onClick={() => setSection("friends")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem", flex: 1 }}>
            Профиль
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "2rem 1.5rem 1.5rem",
              background: "var(--vn-card)",
              borderBottom: "1px solid var(--vn-border)",
            }}
          >
            <div style={{ position: "relative", marginBottom: "1rem" }}>
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: avatarGrads[
                    profileIdx >= 0 ? profileIdx % avatarGrads.length : 0
                  ],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "2.2rem",
                  color: "white",
                  boxShadow: "0 8px 28px rgba(33,150,243,0.35)",
                }}
              >
                {otherProfile.avatar}
              </div>
              {otherProfile.online && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#4CAF50",
                    border: "2.5px solid var(--vn-card)",
                  }}
                />
              )}
            </div>

            <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.4rem", marginBottom: "0.25rem" }}>
              {otherProfile.name} {otherProfile.surname}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: "1rem" }}>
              {otherProfile.city && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--vn-muted)", fontSize: "0.85rem" }}>
                  <Icon name="MapPin" size={13} color="var(--vn-muted)" />
                  {otherProfile.city}
                </div>
              )}
              {age !== null && (
                <div style={{ color: "var(--vn-muted)", fontSize: "0.85rem" }}>
                  {age} лет
                </div>
              )}
              <div
                style={{
                  fontSize: "0.78rem",
                  color: otherProfile.online ? "#4CAF50" : "var(--vn-muted)",
                  fontWeight: 600,
                }}
              >
                {otherProfile.online ? "онлайн" : "офлайн"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, width: "100%", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={toggleFriend}
                style={{
                  flex: "1 1 auto",
                  minWidth: 130,
                  padding: "0.65rem 1rem",
                  borderRadius: "0.75rem",
                  border: isFriendNow ? "1px solid var(--vn-border)" : "none",
                  background: isFriendNow
                    ? "var(--vn-card2)"
                    : "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))",
                  color: isFriendNow ? "var(--vn-muted)" : "white",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
              >
                <Icon name={isFriendNow ? "UserMinus" : "UserPlus"} size={15} color={isFriendNow ? "var(--vn-muted)" : "white"} />
                {isFriendNow ? "Удалить из друзей" : "Добавить в друзья"}
              </button>
              <button
                onClick={() => otherChatData && setOpenChat(otherChatData)}
                style={{
                  flex: "1 1 auto",
                  minWidth: 100,
                  padding: "0.65rem 1rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Icon name="MessageCircle" size={15} color="white" />
                Написать
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10, width: "100%", justifyContent: "center" }}>
              <button
                onClick={() => otherChatData && setOpenCall({ type: "audio", chat: otherChatData })}
                style={{
                  flex: 1,
                  padding: "0.6rem 0.75rem",
                  borderRadius: "0.75rem",
                  border: "1px solid var(--vn-border)",
                  background: "var(--vn-card2)",
                  color: "var(--vn-text)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                <Icon name="Phone" size={14} color="var(--vn-blue-bright)" />
                Позвонить
              </button>
              <button
                onClick={() => otherChatData && setOpenCall({ type: "video", chat: otherChatData })}
                style={{
                  flex: 1,
                  padding: "0.6rem 0.75rem",
                  borderRadius: "0.75rem",
                  border: "1px solid var(--vn-border)",
                  background: "var(--vn-card2)",
                  color: "var(--vn-text)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                <Icon name="Video" size={14} color="var(--vn-blue-bright)" />
                Видео
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "0.6rem 0.75rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(231,76,60,0.25)",
                  background: "rgba(231,76,60,0.08)",
                  color: "#E74C3C",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                <Icon name="ShieldOff" size={14} color="#E74C3C" />
                Блок
              </button>
            </div>
          </div>

          <div style={{ padding: "1.2rem" }}>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--vn-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
              }}
            >
              Общие друзья
            </p>
            <div style={{ display: "flex", gap: 14 }}>
              {mutualFriends.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => openOtherProfile(f)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    minWidth: 58,
                    animation: `vn-appear 0.3s ease ${i * 0.07}s both`,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: avatarGrads[i % avatarGrads.length],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: "white",
                        fontSize: "1rem",
                        border: "2px solid var(--vn-border)",
                      }}
                    >
                      {f.avatar}
                    </div>
                    {f.online && (
                      <div className="vn-online" style={{ position: "absolute", bottom: 1, right: 1 }} />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--vn-muted)",
                      textAlign: "center",
                      maxWidth: 52,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EDIT ──
  if (section === "edit") {
    return (
      <div
        className="vn-screen"
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        <div
          style={{
            padding: "1rem",
            borderBottom: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--vn-card)",
          }}
        >
          <button
            onClick={() => setSection("main")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <span style={{ fontFamily: "Montserrat", fontWeight: 700, flex: 1 }}>
            Редактировать профиль
          </span>
          <button
            onClick={saveEdit}
            style={{
              background: "none",
              border: "none",
              color: "var(--vn-blue-bright)",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            Сохранить
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem" }} className="scrollbar-hide">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "2rem",
                color: "white",
                margin: "0 auto 0.75rem",
                boxShadow: "0 8px 24px rgba(33,150,243,0.35)",
              }}
            >
              {(editData.name || "Я")[0]}
            </div>
            <button
              style={{
                background: "none",
                border: "1px solid var(--vn-blue-light)",
                borderRadius: "50px",
                padding: "0.35rem 0.9rem",
                color: "var(--vn-blue-bright)",
                cursor: "pointer",
                fontSize: "0.82rem",
              }}
            >
              Сменить фото
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { label: "Имя", key: "name", type: "text" },
              { label: "Фамилия", key: "surname", type: "text" },
              { label: "Дата рождения", key: "birthdate", type: "date" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "var(--vn-muted)",
                    marginBottom: "0.35rem",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </label>
                <input
                  type={type}
                  value={(editData as Record<string, string>)[key] || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, [key]: e.target.value })
                  }
                  style={{
                    width: "100%",
                    background: "var(--vn-card2)",
                    border: "1px solid var(--vn-border)",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem",
                    color: "var(--vn-text)",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                    colorScheme: "dark",
                  }}
                />
              </div>
            ))}

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: "var(--vn-muted)",
                  marginBottom: "0.35rem",
                  fontWeight: 600,
                }}
              >
                О себе
              </label>
              <textarea
                value={editData.about || ""}
                onChange={(e) => setEditData({ ...editData, about: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  background: "var(--vn-card2)",
                  border: "1px solid var(--vn-border)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  color: "var(--vn-text)",
                  fontSize: "0.9rem",
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: "var(--vn-muted)",
                  marginBottom: "0.35rem",
                  fontWeight: 600,
                }}
              >
                Город / Регион
              </label>
              <button
                onClick={() => { setRegionSearch(""); setShowRegionSheet(true); }}
                style={{
                  width: "100%",
                  background: "var(--vn-card2)",
                  border: "1px solid var(--vn-border)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  color: editData.city ? "var(--vn-text)" : "var(--vn-muted)",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <span>{editData.city || "Выберите регион"}</span>
                <Icon name="ChevronDown" size={16} color="var(--vn-muted)" />
              </button>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: "var(--vn-muted)",
                  marginBottom: "0.35rem",
                  fontWeight: 600,
                }}
              >
                Номер телефона
              </label>
              <input
                type="tel"
                value={editData.phone || ""}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                style={{
                  width: "100%",
                  background: "var(--vn-card2)",
                  border: "1px solid var(--vn-border)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  color: "var(--vn-text)",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "0.6rem",
                  padding: "0.65rem 0.9rem",
                  background: "var(--vn-card2)",
                  border: "1px solid var(--vn-border)",
                  borderRadius: "0.75rem",
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "var(--vn-text)" }}>
                  Скрыть номер телефона
                </span>
                <Toggle on={hidePhone} onToggle={() => setHidePhone(!hidePhone)} />
              </div>
            </div>
          </div>
        </div>

        {showRegionSheet && (
          <div
            onClick={() => setShowRegionSheet(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 200,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--vn-card)",
                borderRadius: "1.5rem 1.5rem 0 0",
                width: "100%",
                maxHeight: "70vh",
                display: "flex",
                flexDirection: "column",
                animation: "vn-appear 0.22s ease",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }}
            >
              <div
                style={{
                  padding: "1rem 1.2rem 0.75rem",
                  borderBottom: "1px solid var(--vn-border)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    background: "var(--vn-border)",
                    margin: "0 auto 0.9rem",
                  }}
                />
                <p
                  style={{
                    fontFamily: "Montserrat",
                    fontWeight: 700,
                    fontSize: "1rem",
                    marginBottom: "0.75rem",
                    textAlign: "center",
                  }}
                >
                  Выберите регион
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--vn-card2)",
                    border: "1px solid var(--vn-border)",
                    borderRadius: "0.75rem",
                    padding: "0.55rem 0.9rem",
                  }}
                >
                  <Icon name="Search" size={15} color="var(--vn-muted)" />
                  <input
                    autoFocus
                    placeholder="Поиск региона..."
                    value={regionSearch}
                    onChange={(e) => setRegionSearch(e.target.value)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "var(--vn-text)",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>
              <div style={{ overflowY: "auto", flex: 1 }} className="scrollbar-hide">
                {filteredRegions.length === 0 && (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--vn-muted)",
                      fontSize: "0.88rem",
                    }}
                  >
                    Ничего не найдено
                  </div>
                )}
                {filteredRegions.map((region) => (
                  <button
                    key={region}
                    onClick={() => {
                      setEditData({ ...editData, city: region });
                      setShowRegionSheet(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "0.8rem 1.2rem",
                      background:
                        editData.city === region
                          ? "rgba(33,150,243,0.1)"
                          : "none",
                      border: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      color: editData.city === region ? "var(--vn-blue-bright)" : "var(--vn-text)",
                      fontSize: "0.9rem",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                  >
                    <span>{region}</span>
                    {editData.city === region && (
                      <Icon name="Check" size={16} color="var(--vn-blue-bright)" />
                    )}
                  </button>
                ))}
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
      <div
        className="vn-screen"
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        <div
          style={{
            padding: "1rem 1.2rem",
            borderBottom: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--vn-card)",
          }}
        >
          <button
            onClick={() => setSection("settings")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>
            Уведомления
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem" }} className="scrollbar-hide">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              background: "var(--vn-card2)",
              borderRadius: "0.75rem",
              border: "1px solid var(--vn-border)",
              marginBottom: "1rem",
            }}
          >
            <span style={{ fontWeight: 500 }}>Уведомления</span>
            <Toggle on={notifsOn} onToggle={() => setNotifsOn(!notifsOn)} />
          </div>
          {/* Vibration toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "var(--vn-card2)", borderRadius: "0.75rem", border: "1px solid var(--vn-border)", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>Вибрация</div>
              <div style={{ fontSize: "0.74rem", color: "var(--vn-muted)", marginTop: 2 }}>{notifVibration ? "Вибрация включена" : "Только звук"}</div>
            </div>
            <Toggle on={notifVibration} onToggle={() => setNotifVibration(!notifVibration)} />
          </div>

          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--vn-muted)",
              marginBottom: "0.6rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Звук уведомлений
          </p>
          {["default", "chime", "pop", "none"].map((s) => (
            <button
              key={s}
              onClick={() => setNotifSound(s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "0.7rem 1rem",
                background: notifSound === s ? "rgba(33,150,243,0.1)" : "var(--vn-card2)",
                border: `1px solid ${notifSound === s ? "var(--vn-blue-light)" : "var(--vn-border)"}`,
                borderRadius: "0.65rem",
                cursor: "pointer",
                marginBottom: 6,
                color: "var(--vn-text)",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `2px solid ${notifSound === s ? "var(--vn-blue-light)" : "var(--vn-border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {notifSound === s && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--vn-blue-light)",
                    }}
                  />
                )}
              </div>
              <span style={{ fontSize: "0.9rem" }}>
                {{ default: "По умолчанию", chime: "Звонок", pop: "Поп", none: "Без звука" }[s]}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── SECURITY ──
  if (section === "security") {
    return (
      <div
        className="vn-screen"
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        <div
          style={{
            padding: "1rem 1.2rem",
            borderBottom: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--vn-card)",
          }}
        >
          <button
            onClick={() => setSection("settings")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>
            Безопасность
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          <SettingRow icon="Key" label="Сменить пароль" onClick={() => {}} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0.9rem 1.2rem",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(33,150,243,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="ShieldCheck" size={17} color="var(--vn-blue-bright)" />
            </div>
            <span style={{ flex: 1, fontSize: "0.9rem" }}>2FA аутентификация</span>
            <Toggle on={twoFa} onToggle={() => setTwoFa(!twoFa)} />
          </div>
          <SettingRow
            icon="Monitor"
            label="Активные сессии"
            value="2 устройства"
            onClick={() => setSection("devices")}
          />
        </div>
      </div>
    );
  }

  // ── MESSAGES ──
  if (section === "messages") {
    return (
      <div
        className="vn-screen"
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        <div
          style={{
            padding: "1rem 1.2rem",
            borderBottom: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--vn-card)",
          }}
        >
          <button
            onClick={() => setSection("settings")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>
            Сообщения
          </h2>
        </div>
        <div style={{ flex: 1, padding: "1.2rem", overflowY: "auto" }} className="scrollbar-hide">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              background: "var(--vn-card2)",
              borderRadius: "0.75rem",
              border: "1px solid var(--vn-border)",
              marginBottom: "1rem",
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>Показывать «прочитано»</span>
            <Toggle on={showRead} onToggle={() => setShowRead(!showRead)} />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--vn-muted)",
              marginBottom: "0.6rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Кто может писать мне
          </p>
          {[
            { id: "all", label: "Все" },
            { id: "friends", label: "Только друзья" },
            { id: "none", label: "Никто" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setWhoCanMsg(opt.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "0.7rem 1rem",
                background: whoCanMsg === opt.id ? "rgba(33,150,243,0.1)" : "var(--vn-card2)",
                border: `1px solid ${whoCanMsg === opt.id ? "var(--vn-blue-light)" : "var(--vn-border)"}`,
                borderRadius: "0.65rem",
                cursor: "pointer",
                marginBottom: 6,
                color: "var(--vn-text)",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `2px solid ${whoCanMsg === opt.id ? "var(--vn-blue-light)" : "var(--vn-border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {whoCanMsg === opt.id && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--vn-blue-light)",
                    }}
                  />
                )}
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
      <div
        className="vn-screen"
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        <div
          style={{
            padding: "1rem 1.2rem",
            borderBottom: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--vn-card)",
          }}
        >
          <button
            onClick={() => setSection("settings")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>
            Медиа и память
          </h2>
        </div>
        <div style={{ flex: 1, padding: "1.2rem", overflowY: "auto" }} className="scrollbar-hide">
          <div
            style={{
              background: "var(--vn-card2)",
              border: "1px solid var(--vn-border)",
              borderRadius: "1rem",
              padding: "1.2rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--vn-muted)" }}>Использовано</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>256 МБ / 1 ГБ</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--vn-border)" }}>
              <div
                style={{
                  width: "26%",
                  height: "100%",
                  borderRadius: 4,
                  background: "linear-gradient(90deg,var(--vn-blue),var(--vn-blue-light))",
                }}
              />
            </div>
          </div>
          {[
            { icon: "Image", label: "Фотографии", value: "128 МБ" },
            { icon: "Video", label: "Видео", value: "84 МБ" },
            { icon: "File", label: "Файлы", value: "44 МБ" },
          ].map((item) => (
            <SettingRow key={item.label} icon={item.icon} label={item.label} value={item.value} />
          ))}
          <button
            style={{
              width: "100%",
              marginTop: "1rem",
              padding: "0.85rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "rgba(231,76,60,0.1)",
              color: "#E74C3C",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Очистить кэш
          </button>
        </div>
      </div>
    );
  }

  // ── DEVICES ──
  if (section === "devices") {
    const devices = [
      { icon: "Smartphone", name: "iPhone 14 Pro", location: "Грозный, ЧР", active: true, time: "Сейчас" },
      { icon: "Monitor", name: "MacBook Pro", location: "Москва", active: false, time: "2 дня назад" },
    ];
    return (
      <div
        className="vn-screen"
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        <div
          style={{
            padding: "1rem 1.2rem",
            borderBottom: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--vn-card)",
          }}
        >
          <button
            onClick={() => setSection("security")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>
            Устройства
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem" }} className="scrollbar-hide">
          {devices.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "1rem",
                background: "var(--vn-card2)",
                border: "1px solid var(--vn-border)",
                borderRadius: "0.9rem",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: d.active ? "rgba(33,150,243,0.15)" : "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon
                  name={d.icon}
                  size={20}
                  color={d.active ? "var(--vn-blue-bright)" : "var(--vn-muted)"}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{d.name}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--vn-muted)", marginTop: 2 }}>
                  {d.location} · {d.time}
                </div>
              </div>
              {d.active && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#4CAF50",
                    fontWeight: 700,
                    background: "rgba(76,175,80,0.1)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "0.4rem",
                  }}
                >
                  Активно
                </div>
              )}
              {!d.active && (
                <button
                  style={{
                    fontSize: "0.75rem",
                    color: "#E74C3C",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Завершить
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── FAVORITES ──
  if (section === "favorites") {
    return (
      <div
        className="vn-screen"
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        <div
          style={{
            padding: "1rem 1.2rem",
            borderBottom: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--vn-card)",
          }}
        >
          <button
            onClick={() => setSection("settings")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>
            Избранное
          </h2>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "2rem",
          }}
        >
          <Icon name="Bookmark" size={48} color="var(--vn-border)" />
          <p style={{ color: "var(--vn-muted)", fontSize: "0.9rem", textAlign: "center" }}>
            Здесь будут ваши сохранённые сообщения и медиа
          </p>
        </div>
      </div>
    );
  }

  // ── PRIVACY ──
  if (section === "privacy") {
    const Toggle2 = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
      <button onClick={onToggle} style={{ width: 46, height: 26, borderRadius: 13, background: on ? "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))" : "var(--vn-border)", border: "none", cursor: "pointer", position: "relative", transition: "all 0.25s", flexShrink: 0 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: on ? 23 : 3, transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
      </button>
    );
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setSection("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Приватность</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">

          {/* Phone */}
          <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)" }}>
            <p style={{ fontSize: "0.72rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.9rem" }}>Номер телефона</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>Скрыть номер телефона</div>
                <div style={{ fontSize: "0.76rem", color: "var(--vn-muted)", marginTop: 2 }}>
                  {hidePhone ? "Ваш номер не виден посторонним" : "Ваш номер виден друзьям"}
                </div>
              </div>
              <Toggle2 on={hidePhone} onToggle={() => setHidePhone(!hidePhone)} />
            </div>
          </div>

          {/* Online */}
          <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)" }}>
            <p style={{ fontSize: "0.72rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.9rem" }}>Статус в сети</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>Скрыть статус «онлайн»</div>
                <div style={{ fontSize: "0.76rem", color: "var(--vn-muted)", marginTop: 2 }}>
                  {hideOnline ? "Никто не видит, что вы в сети" : "Друзья видят, что вы онлайн"}
                </div>
              </div>
              <Toggle2 on={hideOnline} onToggle={() => setHideOnline(!hideOnline)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>Скрыть «был(а) в сети»</div>
                <div style={{ fontSize: "0.76rem", color: "var(--vn-muted)", marginTop: 2 }}>
                  {hideLastSeen ? "Никто не видит время последнего визита" : "Друзья видят время последнего входа"}
                </div>
              </div>
              <Toggle2 on={hideLastSeen} onToggle={() => setHideLastSeen(!hideLastSeen)} />
            </div>
          </div>

          {/* Who can message */}
          <div style={{ padding: "1rem 1.2rem" }}>
            <p style={{ fontSize: "0.72rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.9rem" }}>Кто может писать мне</p>
            <button onClick={() => setSection("blocked")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0.75rem 0", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="Ban" size={18} color="#E74C3C" />
                <span style={{ fontSize: "0.9rem", color: "var(--vn-text)" }}>Заблокированные пользователи</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {blockedUsers.length > 0 && <span style={{ fontSize: "0.8rem", color: "var(--vn-muted)" }}>{blockedUsers.length}</span>}
                <Icon name="ChevronRight" size={16} color="var(--vn-muted)" />
              </div>
            </button>
            {[{ id: "all", label: "Все пользователи", desc: "Любой может начать диалог" }, { id: "friends", label: "Только друзья", desc: "Сообщения только от людей из вашего списка" }, { id: "none", label: "Никто", desc: "Новые диалоги отключены" }].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setWhoCanMsg(opt.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "0.75rem 0", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", textAlign: "left" }}
              >
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${whoCanMsg === opt.id ? "var(--vn-blue-light)" : "var(--vn-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {whoCanMsg === opt.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--vn-blue-light)" }} />}
                </div>
                <div>
                  <div style={{ fontWeight: whoCanMsg === opt.id ? 600 : 400, fontSize: "0.9rem", color: whoCanMsg === opt.id ? "var(--vn-text)" : "var(--vn-muted)" }}>{opt.label}</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--vn-muted)", marginTop: 1 }}>{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── SETTINGS ──
  if (section === "settings") {
    return (
      <div
        className="vn-screen"
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        <div
          style={{
            padding: "1rem 1.2rem",
            borderBottom: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--vn-card)",
          }}
        >
          <button
            onClick={() => setSection("main")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>
            Настройки
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          <SettingRow icon="Bell" label="Уведомления" onClick={() => setSection("notifications")} />
          <SettingRow icon="Eye" label="Приватность" onClick={() => setSection("privacy")} />
          <SettingRow icon="ShieldCheck" label="Безопасность" onClick={() => setSection("security")} />
          <SettingRow icon="MessageSquare" label="Сообщения" onClick={() => setSection("messages")} />
          <SettingRow icon="HardDrive" label="Медиа и память" onClick={() => setSection("storage")} />
          <SettingRow
            icon="Bookmark"
            label="Избранное"
            onClick={() => setSection("favorites")}
          />
          <SettingRow
            icon="LogOut"
            label="Выйти из аккаунта"
            onClick={() => setShowLogoutConfirm(true)}
          />
          <SettingRow
            icon="Trash2"
            label="Удалить аккаунт"
            danger
            onClick={() => setShowDeleteConfirm(true)}
          />
        </div>

        {showLogoutConfirm && (
          <div
            onClick={() => setShowLogoutConfirm(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 200,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--vn-card)",
                borderRadius: "1.5rem 1.5rem 0 0",
                padding: "1.5rem",
                width: "100%",
                animation: "vn-appear 0.2s ease",
              }}
            >
              <h3
                style={{
                  fontFamily: "Montserrat",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  marginBottom: "0.5rem",
                }}
              >
                Выйти из аккаунта?
              </h3>
              <p style={{ color: "var(--vn-muted)", fontSize: "0.88rem", marginBottom: "1.2rem" }}>
                Вы можете войти снова в любой момент.
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    flex: 1,
                    background: "var(--vn-card2)",
                    border: "1px solid var(--vn-border)",
                    borderRadius: "0.75rem",
                    padding: "0.85rem",
                    color: "var(--vn-text)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={() => onLogout && onLogout()}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))",
                    border: "none",
                    borderRadius: "0.75rem",
                    padding: "0.85rem",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 200,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--vn-card)",
                borderRadius: "1.5rem 1.5rem 0 0",
                padding: "1.5rem",
                width: "100%",
                animation: "vn-appear 0.2s ease",
              }}
            >
              <h3
                style={{
                  fontFamily: "Montserrat",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  marginBottom: "0.5rem",
                  color: "#E74C3C",
                }}
              >
                Удалить аккаунт?
              </h3>
              <p style={{ color: "var(--vn-muted)", fontSize: "0.88rem", marginBottom: "1.2rem" }}>
                Это действие необратимо. Все ваши данные, чаты и фото будут удалены навсегда.
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    background: "var(--vn-card2)",
                    border: "1px solid var(--vn-border)",
                    borderRadius: "0.75rem",
                    padding: "0.85rem",
                    color: "var(--vn-text)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={() => onLogout && onLogout()}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg,#922B21,#E74C3C)",
                    border: "none",
                    borderRadius: "0.75rem",
                    padding: "0.85rem",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── MAIN ──
  const initials =
    (user.name ? user.name[0] : "") + (user.surname ? user.surname[0] : "") || "Я";
  const age = calcAge(user.birthdate);

  return (
    <div
      className="vn-screen"
      style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={() => {}}
      />

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        <div
          style={{
            background: "var(--vn-card)",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid var(--vn-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "2rem 1.5rem 1.2rem",
            }}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                position: "relative",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "2.2rem",
                  color: "white",
                  boxShadow: "0 8px 28px rgba(33,150,243,0.35)",
                }}
              >
                {initials}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))",
                  border: "2px solid var(--vn-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="Camera" size={12} color="white" />
              </div>
            </button>

            <h2
              style={{
                fontFamily: "Montserrat",
                fontWeight: 800,
                fontSize: "1.4rem",
                marginBottom: "0.25rem",
                textAlign: "center",
              }}
            >
              {user.name} {user.surname}
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--vn-muted)",
                fontSize: "0.85rem",
                marginBottom: "0.4rem",
              }}
            >
              {user.city && (
                <>
                  <Icon name="MapPin" size={13} color="var(--vn-muted)" />
                  <span>{user.city}</span>
                </>
              )}
              {age !== null && user.city && <span>·</span>}
              {age !== null && <span>{age} лет</span>}
            </div>

            {user.about && (
              <p
                style={{
                  fontSize: "0.83rem",
                  color: "var(--vn-muted)",
                  textAlign: "center",
                  marginBottom: "0.9rem",
                  maxWidth: 260,
                }}
              >
                {user.about}
              </p>
            )}

            <button
              onClick={() => setSection("edit")}
              style={{
                background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))",
                border: "none",
                borderRadius: "50px",
                padding: "0.5rem 1.5rem",
                color: "white",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(33,150,243,0.3)",
              }}
            >
              Изменить
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 1,
              background: "var(--vn-border)",
              margin: "0 0 0.75rem",
            }}
          >
            {[
              { label: "Друзей", value: String(realFriends.length), onClick: () => setSection("friends") },
              { label: "Фото", value: "0", onClick: () => {} },
              { label: "Статусов", value: "0", onClick: () => {} },
            ].map((s) => (
              <button
                key={s.label}
                onClick={s.onClick}
                style={{
                  background: "var(--vn-card)",
                  padding: "0.85rem 0.5rem",
                  textAlign: "center",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(33,150,243,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--vn-card)")
                }
              >
                <div
                  style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem" }}
                  className="vn-gradient-text"
                >
                  {s.value}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--vn-muted)", marginTop: 2 }}>
                  {s.label}
                </div>
              </button>
            ))}
          </div>

          <div style={{ padding: "0 1.2rem 1rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.7rem",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Друзья</span>
              <button
                onClick={() => setSection("friends")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--vn-blue-bright)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Все →
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto" }} className="scrollbar-hide">
              {realFriends.slice(0, 5).map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => openOtherProfile(f)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    minWidth: 58,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    animation: `vn-appear 0.3s ease ${i * 0.06}s both`,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: avatarGrads[i % avatarGrads.length],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: "white",
                        fontSize: "1rem",
                        border: "2px solid var(--vn-border)",
                      }}
                    >
                      {f.avatar}
                    </div>
                    {f.online && (
                      <div
                        className="vn-online"
                        style={{ position: "absolute", bottom: 1, right: 1 }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--vn-muted)",
                      textAlign: "center",
                      maxWidth: 52,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <SettingRow icon="Settings2" label="Настройки" onClick={() => setSection("settings")} />
      </div>
    </div>
  );
}