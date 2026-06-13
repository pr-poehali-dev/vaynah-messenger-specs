import { useState, useEffect, Component, ReactNode } from "react";
import Icon from "@/components/ui/icon";
import ChatsScreen from "./ChatsScreen";
import SearchScreen from "./SearchScreen";
import StatusesScreen from "./StatusesScreen";
import ProfileScreen from "./ProfileScreen";
import NotificationsScreen from "./NotificationsScreen";
import { User, Theme } from "@/pages/Index";
import func2url from "../../../backend/func2url.json";

class TabBoundary extends Component<{ name: string; children: ReactNode }, { err: string | null }> {
  constructor(p: { name: string; children: ReactNode }) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e: Error) { return { err: e.message }; }
  componentDidCatch(e: Error, info: React.ErrorInfo) { console.error("TAB CRASH [" + this.props.name + "]:", e.message, "\nSTACK:", e.stack, "\nCOMPONENT:", info.componentStack); }
  render() {
    if (this.state.err) return (
      <div style={{ padding: "2rem", color: "#E74C3C", fontSize: "0.85rem" }}>
        <b>Ошибка в {this.props.name}:</b><br />{this.state.err}
      </div>
    );
    return this.props.children;
  }
}

type Tab = "search" | "chats" | "statuses" | "profile" | "notifications";

interface Props {
  user: User;
  setUser: (u: User) => void;
  onLogout?: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

export default function MainApp({ user, setUser, onLogout, theme, toggleTheme }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user.email) return;
    const check = () => {
      fetch(`${func2url["social"]}?action=friends&email=${encodeURIComponent(user.email)}`)
        .then((r) => r.json())
        .then((data) => { if (data.ok) setNotifCount(data.incoming.length); });
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [user.email]);

  const tabs: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "chats", icon: "MessageCircle", label: "Чаты" },
    { id: "statuses", icon: "Play", label: "Статусы" },
    { id: "notifications", icon: "Bell", label: "Уведомления", badge: notifCount },
    { id: "profile", icon: "User", label: "Профиль" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {activeTab === "search" && <TabBoundary name="Поиск"><SearchScreen theme={theme} toggleTheme={toggleTheme} currentUser={user} /></TabBoundary>}
        {activeTab === "chats" && <TabBoundary name="Чаты"><ChatsScreen user={user} /></TabBoundary>}
        {activeTab === "statuses" && <TabBoundary name="Статусы"><StatusesScreen user={user} /></TabBoundary>}
        {activeTab === "notifications" && <TabBoundary name="Уведомления"><NotificationsScreen user={user} /></TabBoundary>}
        {activeTab === "profile" && <TabBoundary name="Профиль"><ProfileScreen user={user} setUser={setUser} onLogout={onLogout} /></TabBoundary>}
      </div>

      {/* Bottom Navigation */}
      <div
        style={{
          background: "var(--vn-card)",
          borderTop: "1px solid var(--vn-border)",
          padding: "0.6rem 0.5rem calc(0.6rem + env(safe-area-inset-bottom))",
          display: "flex",
          justifyContent: "space-around",
          backdropFilter: "blur(20px)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                position: "relative",
                padding: "4px 8px",
                borderRadius: "12px",
                transition: "all 0.2s",
                minWidth: 52,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: isActive
                    ? "linear-gradient(135deg, var(--vn-blue), var(--vn-blue-light))"
                    : "transparent",
                  transition: "all 0.2s",
                }}
              >
                <Icon name={tab.icon} size={18} color={isActive ? "white" : "var(--vn-muted)"} />
                {tab.badge && tab.badge > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      background: "linear-gradient(135deg, var(--vn-blue), var(--vn-blue-light))",
                      color: "white",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid var(--vn-card)",
                    }}
                  >
                    {tab.badge}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--vn-blue-bright)" : "var(--vn-muted)",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}