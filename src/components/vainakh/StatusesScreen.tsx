import { useState, useRef } from "react";
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
  color?: string;
  fileName?: string;
  reactions: Record<string, number>;
  myReaction?: string;
}

const STATUS_COLORS = [
  "linear-gradient(160deg,#050B18,#0A1628)",
  "linear-gradient(160deg,#0D47A1,#1565C0)",
  "linear-gradient(160deg,#1B5E20,#2E7D32)",
  "linear-gradient(160deg,#7B1FA2,#E65100)",
  "linear-gradient(160deg,#880E4F,#C2185B)",
  "linear-gradient(160deg,#01579B,#00ACC1)",
  "linear-gradient(160deg,#3E2723,#5D4037)",
  "linear-gradient(160deg,#263238,#455A64)",
];

const mockStatuses: Status[] = [
  { id: 1, user: "Зайнаб", avatar: "З", type: "text", content: "Алхамдулиллах за всё! 🌿", time: "15 мин", viewed: false, emoji: "🙏", reactions: { "❤️": 5, "🙏": 3 } },
  { id: 2, user: "Ислам", avatar: "И", type: "photo", content: "Горы Кавказа", time: "1 ч", viewed: false, reactions: { "🔥": 8, "😍": 2 } },
  { id: 3, user: "Малика", avatar: "М", type: "text", content: "Хороший день ☀️", time: "2 ч", viewed: true, reactions: { "😊": 4 } },
  { id: 4, user: "Руслан", avatar: "Р", type: "audio", content: "Голосовое 0:45", time: "3 ч", viewed: true, reactions: {} },
];

const avatarColors = [
  "linear-gradient(135deg, #1565C0, #2196F3)",
  "linear-gradient(135deg, #1976D2, #42A5F5)",
  "linear-gradient(135deg, #0D47A1, #1976D2)",
  "linear-gradient(135deg, #1565C0, #29B6F6)",
];

const REACTIONS = ["❤️", "😂", "👍", "😮", "🔥", "🙏", "😍", "👏"];

interface Props {
  user: User;
}

export default function StatusesScreen({ user }: Props) {
  const [statuses, setStatuses] = useState<Status[]>(mockStatuses);
  const [activeStatus, setActiveStatus] = useState<Status | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState<"text" | "photo" | "video" | "audio" | "link">("text");
  const [newContent, setNewContent] = useState("");
  const [emojiOverlay, setEmojiOverlay] = useState("");
  const [newColor, setNewColor] = useState(STATUS_COLORS[0]);
  const [newFileName, setNewFileName] = useState("");
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const pickFile = (type: "photo" | "video" | "audio") => {
    if (type === "photo") photoInputRef.current?.click();
    if (type === "video") videoInputRef.current?.click();
    if (type === "audio") audioInputRef.current?.click();
  };

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewFileName(file.name);
    if (!newContent) setNewContent(file.name);
    e.target.value = "";
  };

  const viewStatus = (s: Status) => {
    setActiveStatus({ ...s });
    setStatuses((prev) => prev.map((st) => (st.id === s.id ? { ...st, viewed: true } : st)));
    setShowReactionPicker(false);
  };

  const reactToStatus = (emoji: string) => {
    if (!activeStatus) return;
    const prev = activeStatus.myReaction;
    const updated = { ...activeStatus };
    const reactions = { ...updated.reactions };

    if (prev) {
      reactions[prev] = Math.max(0, (reactions[prev] || 1) - 1);
      if (reactions[prev] === 0) delete reactions[prev];
    }

    if (prev !== emoji) {
      reactions[emoji] = (reactions[emoji] || 0) + 1;
      updated.myReaction = emoji;
    } else {
      updated.myReaction = undefined;
    }

    updated.reactions = reactions;
    setActiveStatus(updated);
    setStatuses((prev) => prev.map((st) => (st.id === updated.id ? updated : st)));
    setShowReactionPicker(false);
  };

  if (activeStatus) {
    const bgMap: Record<string, string> = {
      text: "linear-gradient(180deg, #050B18 0%, #0A1628 60%, #080E1A 100%)",
      photo: "linear-gradient(180deg, #040A14 0%, #0A1628 100%)",
      audio: "linear-gradient(180deg, #060E1E 0%, #0D1A2E 100%)",
      video: "linear-gradient(180deg, #040A14 0%, #0A1628 100%)",
    };

    const reactionEntries = Object.entries(activeStatus.reactions).filter(([, c]) => c > 0);

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: activeStatus.color || bgMap[activeStatus.type] || bgMap.text, position: "relative" }}>
        {/* Progress bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "0.8rem 1rem 0", zIndex: 10 }}>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.2)", marginBottom: "0.75rem", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "60%", borderRadius: 2, background: "linear-gradient(90deg, var(--vn-blue-bright), white)", animation: "none" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: avatarColors[activeStatus.id % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", border: "2px solid rgba(255,255,255,0.3)" }}>
                {activeStatus.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "white" }}>{activeStatus.user}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>{activeStatus.time} назад</div>
              </div>
            </div>
            <button onClick={() => { setActiveStatus(null); setShowReactionPicker(false); }} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon name="X" size={16} color="white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "6rem 2rem 2rem" }}>
          {activeStatus.type === "text" && (
            <div style={{ textAlign: "center" }}>
              {activeStatus.emoji && <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>{activeStatus.emoji}</div>}
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "white", lineHeight: 1.4, textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>{activeStatus.content}</p>
            </div>
          )}
          {activeStatus.type === "photo" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 200, height: 200, borderRadius: "1.2rem", background: "linear-gradient(135deg, rgba(21,101,192,0.4), rgba(33,150,243,0.3))", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(33,150,243,0.3)", margin: "0 auto" }}>
                <Icon name="Image" size={60} color="rgba(255,255,255,0.3)" />
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "1rem", fontSize: "0.9rem" }}>{activeStatus.content}</p>
            </div>
          )}
          {activeStatus.type === "audio" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg, var(--vn-blue), var(--vn-blue-light))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem", boxShadow: "0 0 40px rgba(33,150,243,0.4)" }}>
                <Icon name="Music" size={36} color="white" />
              </div>
              <p style={{ color: "white", fontWeight: 600, fontSize: "1rem" }}>{activeStatus.content}</p>
            </div>
          )}
        </div>

        {/* Reactions display */}
        {reactionEntries.length > 0 && (
          <div style={{ display: "flex", gap: 6, justifyContent: "center", paddingBottom: "0.5rem", flexWrap: "wrap", padding: "0 1rem 0.5rem" }}>
            {reactionEntries.map(([emoji, count]) => (
              <div
                key={emoji}
                onClick={() => reactToStatus(emoji)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: activeStatus.myReaction === emoji ? "rgba(33,150,243,0.3)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${activeStatus.myReaction === emoji ? "rgba(33,150,243,0.5)" : "rgba(255,255,255,0.2)"}`,
                  borderRadius: "50px",
                  padding: "0.3rem 0.65rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: "1rem" }}>{emoji}</span>
                <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom: reaction picker toggle */}
        <div style={{ padding: "0.75rem 1.5rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: showReactionPicker ? "rgba(33,150,243,0.25)" : "rgba(255,255,255,0.1)",
              border: `1px solid ${showReactionPicker ? "rgba(33,150,243,0.4)" : "rgba(255,255,255,0.2)"}`,
              borderRadius: "50px",
              padding: "0.65rem 1.2rem",
              color: "white",
              cursor: "pointer",
              fontSize: "0.88rem",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{activeStatus.myReaction || "😊"}</span>
            Реагировать
          </button>

          {activeStatus.myReaction && (
            <button
              onClick={() => reactToStatus(activeStatus.myReaction!)}
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Icon name="X" size={16} color="rgba(255,255,255,0.7)" />
            </button>
          )}
        </div>

        {/* Reaction picker */}
        {showReactionPicker && (
          <div
            style={{
              position: "absolute",
              bottom: 110,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(13,22,38,0.95)",
              border: "1px solid var(--vn-border)",
              borderRadius: "1.5rem",
              padding: "0.75rem 1rem",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: 280,
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
              animation: "vn-appear 0.2s ease",
              zIndex: 20,
            }}
          >
            {REACTIONS.map((em) => (
              <button
                key={em}
                onClick={() => reactToStatus(em)}
                style={{
                  fontSize: "1.5rem",
                  background: activeStatus.myReaction === em ? "rgba(33,150,243,0.25)" : "none",
                  border: activeStatus.myReaction === em ? "1px solid rgba(33,150,243,0.4)" : "1px solid transparent",
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {em}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // CREATE STATUS
  if (showCreate) {
    const typeOptions = [
      { id: "text", icon: "Type", label: "Текст" },
      { id: "photo", icon: "Camera", label: "Фото" },
      { id: "video", icon: "Video", label: "Видео" },
      { id: "link", icon: "Link", label: "Ссылка" },
      { id: "audio", icon: "Music", label: "Аудио" },
    ] as const;

    const isMedia = newType === "photo" || newType === "video" || newType === "audio";
    const canPublish = isMedia ? !!newFileName : !!newContent.trim();

    const publish = () => {
      if (!canPublish) return;
      setStatuses((prev) => [
        {
          id: Date.now(),
          user: user.name || "Я",
          avatar: (user.name || "Я")[0],
          type: newType === "link" ? "text" : newType,
          content: newContent || newFileName || "Новый статус",
          time: "только что",
          viewed: false,
          emoji: emojiOverlay || undefined,
          color: newType === "text" || newType === "link" ? newColor : undefined,
          fileName: newFileName || undefined,
          reactions: {},
        },
        ...prev,
      ]);
      setShowCreate(false);
      setNewContent("");
      setEmojiOverlay("");
      setNewFileName("");
      setNewColor(STATUS_COLORS[0]);
      setNewType("text");
    };

    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}>
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem", flex: 1 }}>Новый статус</h2>
          <button
            className="vn-btn"
            onClick={publish}
            disabled={!canPublish}
            style={{ width: "auto", padding: "0.45rem 1rem", fontSize: "0.85rem", opacity: canPublish ? 1 : 0.5, cursor: canPublish ? "pointer" : "not-allowed" }}
          >
            Опубликовать
          </button>
        </div>

        <div style={{ flex: 1, padding: "1.2rem", overflowY: "auto" }} className="scrollbar-hide">
          <div style={{ display: "flex", gap: 8, marginBottom: "1.2rem", overflowX: "auto" }} className="scrollbar-hide">
            {typeOptions.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setNewType(t.id);
                  setNewFileName("");
                  if (t.id === "photo" || t.id === "video" || t.id === "audio") {
                    setTimeout(() => pickFile(t.id), 50);
                  }
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  background: newType === t.id ? "linear-gradient(135deg, var(--vn-blue), var(--vn-blue-light))" : "var(--vn-card2)",
                  border: `1px solid ${newType === t.id ? "transparent" : "var(--vn-border)"}`,
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  cursor: "pointer",
                  minWidth: 60,
                  transition: "all 0.2s",
                  boxShadow: newType === t.id ? "0 4px 14px rgba(33,150,243,0.35)" : "none",
                }}
              >
                <Icon name={t.icon} size={20} color={newType === t.id ? "white" : "var(--vn-muted)"} />
                <span style={{ fontSize: "0.7rem", color: newType === t.id ? "white" : "var(--vn-muted)", fontWeight: newType === t.id ? 600 : 400 }}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Hidden file inputs */}
          <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChosen} />
          <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={onFileChosen} />
          <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={onFileChosen} />

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Media preview / picker */}
            {isMedia && (
              <div>
                {newFileName ? (
                  <div style={{ position: "relative", borderRadius: "1rem", overflow: "hidden", background: newColor, height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: "1px solid var(--vn-border)" }}>
                    <Icon name={newType === "photo" ? "Image" : newType === "video" ? "Video" : "Music"} size={48} color="rgba(255,255,255,0.5)" />
                    <span style={{ color: "white", fontSize: "0.85rem", padding: "0 1rem", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90%", whiteSpace: "nowrap" }}>{newFileName}</span>
                    <button onClick={() => pickFile(newType as "photo" | "video" | "audio")} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "50px", padding: "0.3rem 0.9rem", color: "white", cursor: "pointer", fontSize: "0.78rem" }}>
                      Заменить
                    </button>
                  </div>
                ) : (
                  <button onClick={() => pickFile(newType as "photo" | "video" | "audio")}
                    style={{ width: "100%", height: 180, borderRadius: "1rem", border: "2px dashed var(--vn-border)", background: "var(--vn-card2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", color: "var(--vn-muted)" }}>
                    <Icon name={newType === "photo" ? "ImagePlus" : newType === "video" ? "Video" : "Music"} size={40} color="var(--vn-blue-bright)" />
                    <span style={{ fontSize: "0.9rem" }}>Выбрать {newType === "photo" ? "фото" : newType === "video" ? "видео" : "аудио"} из телефона</span>
                  </button>
                )}
              </div>
            )}

            {/* Text/link area with preview */}
            {!isMedia && (
              <div style={{ borderRadius: "1rem", background: newColor, padding: "2rem 1.2rem", minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                {emojiOverlay && <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{emojiOverlay}</div>}
                <span style={{ color: "rgba(255,255,255,0.95)", fontSize: "1.2rem", fontWeight: 700, textShadow: "0 2px 12px rgba(0,0,0,0.4)", wordBreak: "break-word" }}>
                  {newContent || (newType === "link" ? "Ваша ссылка" : "Текст статуса появится здесь")}
                </span>
              </div>
            )}

            <textarea
              className="vn-input"
              placeholder={newType === "text" ? "Напиши что-нибудь..." : newType === "link" ? "Вставь ссылку..." : "Подпись (необязательно)..."}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              style={{ resize: "none" }}
            />

            {/* Color palette (text/link) */}
            {!isMedia && (
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--vn-muted)", display: "block", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Цвет фона
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {STATUS_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      style={{ width: 40, height: 40, borderRadius: "50%", background: c, border: newColor === c ? "3px solid var(--vn-blue-bright)" : "2px solid var(--vn-border)", cursor: "pointer", transition: "all 0.15s" }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Emoji overlay */}
            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--vn-muted)", display: "block", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Смайлик поверх
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["🔥", "❤️", "🌿", "😊", "💪", "🙏", "✨", "👑"].map((em) => (
                  <button
                    key={em}
                    onClick={() => setEmojiOverlay(emojiOverlay === em ? "" : em)}
                    style={{
                      fontSize: "1.4rem",
                      background: emojiOverlay === em ? "rgba(33,150,243,0.15)" : "var(--vn-card2)",
                      border: `1px solid ${emojiOverlay === em ? "var(--vn-blue-light)" : "var(--vn-border)"}`,
                      borderRadius: "0.5rem",
                      width: 44,
                      height: 44,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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

  // STATUSES LIST
  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "1.2rem 1.2rem 0.8rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center" }}>
        <h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem" }} className="vn-gradient-text">
          ВайНах Сторисы
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {/* My status */}
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--vn-blue), var(--vn-blue-light))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem", color: "white", boxShadow: "0 4px 16px rgba(33,150,243,0.35)" }}>
                {(user.name || "Я")[0]}
              </div>
              <button
                onClick={() => setShowCreate(true)}
                style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, var(--vn-blue), var(--vn-blue-light))", border: "2px solid var(--vn-bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Icon name="Plus" size={11} color="white" />
              </button>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Мой статус</div>
              <div style={{ fontSize: "0.78rem", color: "var(--vn-muted)" }}>Нажми, чтобы добавить</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0.5rem 0" }}>
          {statuses.map((s, i) => {
            const reactionCount = Object.values(s.reactions).reduce((a, b) => a + b, 0);
            const topReactions = Object.entries(s.reactions).filter(([, c]) => c > 0).slice(0, 3);
            return (
              <button
                key={s.id}
                onClick={() => viewStatus(s)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "0.8rem 1.2rem", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s", animation: `vn-appear 0.3s ease ${i * 0.08}s both`, textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: "50%",
                    padding: 2.5,
                    background: s.viewed ? "var(--vn-border)" : "linear-gradient(135deg, var(--vn-blue), var(--vn-blue-light), var(--vn-blue-bright))",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: avatarColors[i % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1.1rem", border: "2px solid var(--vn-bg)" }}>
                    {s.avatar}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: s.viewed ? "var(--vn-muted)" : "var(--vn-text)" }}>{s.user}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--vn-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <span>{s.time} назад</span>
                    <span>·</span>
                    <Icon name={s.type === "text" ? "Type" : s.type === "photo" ? "Camera" : s.type === "audio" ? "Music" : "Video"} size={11} />
                  </div>
                  {/* Reaction preview */}
                  {topReactions.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
                      {topReactions.map(([em]) => (
                        <span key={em} style={{ fontSize: "0.85rem" }}>{em}</span>
                      ))}
                      <span style={{ fontSize: "0.7rem", color: "var(--vn-muted)", marginLeft: 2 }}>{reactionCount}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}