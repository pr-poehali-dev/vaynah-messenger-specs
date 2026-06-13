import { useState } from "react";
import Icon from "@/components/ui/icon";
import ChatsScreen from "./ChatsScreen";
import SearchScreen from "./SearchScreen";
import StatusesScreen from "./StatusesScreen";
import ProfileScreen from "./ProfileScreen";
import NotificationsScreen from "./NotificationsScreen";
import { User, Theme } from "@/pages/Index";

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
  const [notifCount] = useState(3);

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
        {activeTab === "search" && <SearchScreen theme={theme} toggleTheme={toggleTheme} />}
        {activeTab === "chats" && <ChatsScreen user={user} />}
        {activeTab === "statuses" && <StatusesScreen user={user} />}
        {activeTab === "notifications" && <NotificationsScreen />}
        {activeTab === "profile" && <ProfileScreen user={user} setUser={setUser} onLogout={onLogout} />}
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
