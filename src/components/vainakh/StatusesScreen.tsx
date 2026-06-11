import { useState } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";

interface Status {
  id: number;
  user: string;
  avatar: string;
  type: "photo" | "text" | "video" | "audio";
  content: string;
  time: string;
  viewed: boolean;
  emoji?: string;
}

const mockStatuses: Status[] = [
  { id: 1, user: "Зайнаб", avatar: "З", type: "text", content: "Алхамдулиллах за всё! 🌿", time: "15 мин", viewed: false, emoji: "🙏" },
  { id: 2, user: "Ислам", avatar: "И", type: "photo", content: "Горы Кавказа", time: "1 ч", viewed: false },
  { id: 3, user: "Малика", avatar: "М", type: "text", content: "Хороший день ☀️", time: "2 ч", viewed: true },
  { id: 4, user: "Руслан", avatar: "Р", type: "audio", content: "Голосовое 0:45", time: "3 ч", viewed: true },
];

const avatarColors = [
  "linear-gradient(135deg, #FF6B35, #E91E8C)",
  "linear-gradient(135deg, #5B3FD4, #9B59B6)",
  "linear-gradient(135deg, #00BCD4, #5B3FD4)",
  "linear-gradient(135deg, #2ECC71, #00BCD4)",
];

interface Props {
  user: User;
}

export default function StatusesScreen({ user }: Props) {
  const [statuses, setStatuses] = useState(mockStatuses);
  const [activeStatus, setActiveStatus] = useState<Status | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState<"text" | "photo" | "video" | "audio" | "link">("text");
  const [newContent, setNewContent] = useState("");
  const [emojiOverlay, setEmojiOverlay] = useState("");

  const viewStatus = (s: Status) => {
    setActiveStatus(s);
    setStatuses((prev) => prev.map((st) => (st.id === s.id ? { ...st, viewed: true } : st)));
  };

  if (activeStatus) {
    const bgMap: Record<string, string> = {
      text: "linear-gradient(135deg, var(--vn-indigo), var(--vn-purple), var(--vn-pink))",
      photo: "linear-gradient(135deg, #1a1a2e, #16213e)",
      audio: "linear-gradient(135deg, #0f3460, #533483)",
      video: "linear-gradient(135deg, #1a1a2e, #0f3460)",
    };
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: bgMap[activeStatus.type] || bgMap.text, position: "relative", animation: "vn-scale-in 0.25s ease" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "1rem 1rem 0.5rem", zIndex: 10 }}>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.3)", marginBottom: "0.75rem" }}>
            <div style={{ height: "100%", width: "60%", borderRadius: 2, background: "white", transition: "width 0.1s" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: avatarColors[activeStatus.id % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>
                {activeStatus.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "white" }}>{activeStatus.user}</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)" }}>{activeStatus.time} назад</div>
              </div>
            </div>
            <button onClick={() => setActiveStatus(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon name="X" size={16} color="white" />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 2rem" }}>
          {activeStatus.type === "text" && (
            <div style={{ textAlign: "center" }}>
              {activeStatus.emoji && <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{activeStatus.emoji}</div>}
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "white", lineHeight: 1.4, textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>{activeStatus.content}</p>
            </div>
          )}
          {activeStatus.type === "photo" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 200, height: 200, borderRadius: "1rem", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Icon name="Image" size={60} color="rgba(255,255,255,0.4)" />
              </div>
              <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "1rem" }}>{activeStatus.content}</p>
            </div>
          )}
          {activeStatus.type === "audio" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <Icon name="Music" size={36} color="white" />
              </div>
              <p style={{ color: "white", fontWeight: 600 }}>{activeStatus.content}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showCreate) {
    const typeOptions = [
      { id: "text", icon: "Type", label: "Текст" },
      { id: "photo", icon: "Camera", label: "Фото" },
      { id: "video", icon: "Video", label: "Видео" },
      { id: "link", icon: "Link", label: "Ссылка" },
      { id: "audio", icon: "Music", label: "Аудио" },
    ] as const;

    const publish = () => {
      if (!newContent) return;
      setStatuses((prev) => [
        {
          id: Date.now(),
          user: user.name,
          avatar: user.name[0],
          type: newType === "link" ? "text" : newType,
          content: newContent,
          time: "только что",
          viewed: false,
          emoji: emojiOverlay || undefined,
        },
        ...prev,
      ]);
      setShowCreate(false);
      setNewContent("");
      setEmojiOverlay("");
    };

    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}>
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem", flex: 1 }}>Новый статус</h2>
          <button className="vn-btn" onClick={publish} style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            Опубликовать
          </button>
        </div>

        <div style={{ flex: 1, padding: "1.2rem", overflowY: "auto" }} className="scrollbar-hide">
          <div style={{ display: "flex", gap: 8, marginBottom: "1.2rem", overflowX: "auto" }} className="scrollbar-hide">
            {typeOptions.map((t) => (
              <button
                key={t.id}
                onClick={() => setNewType(t.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  background: newType === t.id ? "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))" : "var(--vn-card2)",
                  border: `1px solid ${newType === t.id ? "transparent" : "var(--vn-border)"}`,
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  cursor: "pointer",
                  minWidth: 64,
                  transition: "all 0.2s",
                }}
              >
                <Icon name={t.icon} size={20} color={newType === t.id ? "white" : "var(--vn-muted)"} />
                <span style={{ fontSize: "0.72rem", color: newType === t.id ? "white" : "var(--vn-muted)", fontWeight: newType === t.id ? 600 : 400 }}>{t.label}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <textarea
              className="vn-input"
              placeholder={newType === "text" ? "Напиши что-нибудь..." : newType === "link" ? "Вставь ссылку..." : "Описание..."}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              style={{ resize: "none" }}
            />
            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--vn-muted)", display: "block", marginBottom: 6 }}>Добавить смайлик поверх</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["🔥", "❤️", "🌿", "😊", "💪", "🙏", "✨", "👑"].map((em) => (
                  <button
                    key={em}
                    onClick={() => setEmojiOverlay(emojiOverlay === em ? "" : em)}
                    style={{
                      fontSize: "1.4rem",
                      background: emojiOverlay === em ? "rgba(255,107,53,0.2)" : "var(--vn-card2)",
                      border: `1px solid ${emojiOverlay === em ? "var(--vn-orange)" : "var(--vn-border)"}`,
                      borderRadius: "0.5rem",
                      width: 44,
                      height: 44,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "1.2rem 1.2rem 0.8rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem" }} className="vn-gradient-text">
          ВайНах Сторисы
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{ background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))", border: "none", borderRadius: "50px", padding: "0.4rem 0.9rem", color: "white", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Icon name="Plus" size={14} color="white" />
          Добавить
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {/* My status */}
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem", color: "white" }}>
                {user.name[0]}
              </div>
              <button
                onClick={() => setShowCreate(true)}
                style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))", border: "2px solid var(--vn-bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Icon name="Plus" size={10} color="white" />
              </button>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Мой статус</div>
              <div style={{ fontSize: "0.78rem", color: "var(--vn-muted)" }}>Нажми, чтобы добавить</div>
            </div>
          </div>
        </div>

        {/* Others statuses */}
        <div style={{ padding: "0.75rem 0" }}>
          {statuses.map((s, i) => (
            <button
              key={s.id}
              onClick={() => viewStatus(s)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "0.75rem 1.2rem", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s", animation: `vn-appear 0.3s ease ${i * 0.08}s both` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,53,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  padding: 2,
                  background: s.viewed ? "var(--vn-border)" : "linear-gradient(135deg, var(--vn-orange), var(--vn-pink), var(--vn-indigo))",
                  flexShrink: 0,
                }}
              >
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: avatarColors[i % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1.1rem", border: "2px solid var(--vn-bg)" }}>
                  {s.avatar}
                </div>
              </div>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: s.viewed ? "var(--vn-muted)" : "var(--vn-text)" }}>{s.user}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--vn-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{s.time} назад</span>
                  <span>·</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Icon name={s.type === "text" ? "Type" : s.type === "photo" ? "Camera" : s.type === "audio" ? "Music" : "Video"} size={11} />
                    {s.type === "text" ? "Текст" : s.type === "photo" ? "Фото" : s.type === "audio" ? "Аудио" : "Видео"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
