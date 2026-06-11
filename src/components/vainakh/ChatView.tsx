import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";

interface Message {
  id: number;
  text: string;
  mine: boolean;
  time: string;
  type: "text" | "voice" | "image";
  reaction?: string;
  readBy?: string[];
}

const initialMessages: Message[] = [
  { id: 1, text: "Ассаламу алейкум! 🙏", mine: false, time: "14:20", type: "text" },
  { id: 2, text: "Ваалейкум Ассалам! Как дела?", mine: true, time: "14:21", type: "text" },
  { id: 3, text: "Всё отлично, готовлюсь к поездке", mine: false, time: "14:22", type: "text" },
  { id: 4, text: "🎙 Голосовое 0:24", mine: false, time: "14:23", type: "voice" },
  { id: 5, text: "Хорошо! Увидимся завтра 👋", mine: true, time: "14:32", type: "text", readBy: ["Зайнаб"] },
];

interface Chat {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
}

interface Props {
  chat: Chat;
  user: User;
  onBack: () => void;
}

const avatarColors = [
  "linear-gradient(135deg, #FF6B35, #E91E8C)",
  "linear-gradient(135deg, #5B3FD4, #9B59B6)",
];

export default function ChatView({ chat, user, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [showReaction, setShowReaction] = useState<number | null>(null);
  const [showReadBy, setShowReadBy] = useState<number | null>(null);
  const [showMedia, setShowMedia] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState("Фото");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: input.trim(),
        mine: true,
        time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
        type: "text",
      },
    ]);
    setInput("");
  };

  const addReaction = (msgId: number, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, reaction: emoji } : m))
    );
    setShowReaction(null);
  };

  const mediaTabs = ["Фото", "Видео", "Голосовые", "Кружки", "Ссылки", "Файлы", "Документы"];

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "0.9rem 1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: "0.8rem", background: "var(--vn-card)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)", padding: 4 }}>
          <Icon name="ArrowLeft" size={22} />
        </button>
        <div style={{ position: "relative" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: avatarColors[0], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>
            {chat.avatar}
          </div>
          {chat.online && <div className="vn-online" style={{ position: "absolute", bottom: 0, right: 0 }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{chat.name}</div>
          <div style={{ fontSize: "0.75rem", color: chat.online ? "#2ECC71" : "var(--vn-muted)" }}>
            {chat.online ? "онлайн" : "был(а) недавно"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{ background: "rgba(255,107,53,0.1)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon name="Phone" size={17} color="var(--vn-orange)" />
          </button>
          <button
            style={{ background: "rgba(255,107,53,0.1)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon name="Video" size={17} color="var(--vn-orange)" />
          </button>
          <button
            onClick={() => setShowMedia(true)}
            style={{ background: "rgba(255,107,53,0.1)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon name="Image" size={17} color="var(--vn-orange)" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }} className="scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.mine ? "flex-end" : "flex-start", gap: 2 }}>
            <div
              className={msg.mine ? "vn-msg-me" : "vn-msg-other"}
              onClick={() => setShowReadBy(showReadBy === msg.id ? null : msg.id)}
              onDoubleClick={() => setShowReaction(showReaction === msg.id ? null : msg.id)}
              style={{ cursor: "pointer", position: "relative" }}
            >
              {msg.type === "voice" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="Mic" size={14} color={msg.mine ? "rgba(255,255,255,0.9)" : "var(--vn-orange)"} />
                  <div style={{ width: 80, height: 3, borderRadius: 2, background: msg.mine ? "rgba(255,255,255,0.4)" : "var(--vn-border)" }}>
                    <div style={{ width: "60%", height: "100%", borderRadius: 2, background: msg.mine ? "white" : "var(--vn-orange)" }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>0:24</span>
                </div>
              ) : (
                msg.text
              )}
              {msg.reaction && (
                <span style={{ position: "absolute", bottom: -10, right: msg.mine ? 4 : "auto", left: msg.mine ? "auto" : 4, fontSize: "1rem" }}>
                  {msg.reaction}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: "0.7rem", color: "var(--vn-muted)" }}>{msg.time}</span>
              {msg.mine && msg.readBy && (
                <Icon name="CheckCheck" size={12} color="var(--vn-orange)" />
              )}
            </div>

            {showReadBy === msg.id && msg.readBy && (
              <div style={{ background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "0.6rem", padding: "0.5rem 0.75rem", fontSize: "0.78rem", color: "var(--vn-muted)", animation: "vn-appear 0.15s ease" }}>
                👁 Прочитал(а): {msg.readBy.join(", ")}
              </div>
            )}

            {showReaction === msg.id && (
              <div style={{ display: "flex", gap: 6, background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "2rem", padding: "0.4rem 0.8rem", animation: "vn-appear 0.15s ease" }}>
                {["❤️", "😂", "👍", "😮", "😢", "🔥"].map((em) => (
                  <button
                    key={em}
                    onClick={() => addReaction(msg.id, em)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: 2, borderRadius: "50%", transition: "transform 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "0.75rem 0.8rem", borderTop: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: "0.6rem", background: "var(--vn-card)" }}>
        <button style={{ background: "rgba(255,107,53,0.1)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <Icon name="Camera" size={17} color="var(--vn-orange)" />
        </button>
        <input
          className="vn-input"
          placeholder="Сообщение..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={{ flex: 1, padding: "0.6rem 0.9rem" }}
        />
        <button style={{ background: "rgba(255,107,53,0.1)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <Icon name="Paperclip" size={17} color="var(--vn-orange)" />
        </button>
        <button
          onClick={sendMessage}
          style={{ background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 12px rgba(255,107,53,0.4)" }}
        >
          <Icon name="Send" size={17} color="white" />
        </button>
      </div>

      {/* Media Gallery Modal */}
      {showMedia && (
        <div style={{ position: "absolute", inset: 0, background: "var(--vn-bg)", zIndex: 50, display: "flex", flexDirection: "column", animation: "vn-slide-in 0.25s ease" }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setShowMedia(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}>
              <Icon name="ArrowLeft" size={22} />
            </button>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Медиафайлы</h2>
          </div>
          <div style={{ display: "flex", overflowX: "auto", padding: "0.75rem 1rem", gap: 8, borderBottom: "1px solid var(--vn-border)" }} className="scrollbar-hide">
            {mediaTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveMediaTab(tab)}
                style={{
                  background: activeMediaTab === tab ? "linear-gradient(135deg, var(--vn-orange), var(--vn-pink))" : "var(--vn-card2)",
                  border: "none",
                  borderRadius: "50px",
                  padding: "0.4rem 0.9rem",
                  color: activeMediaTab === tab ? "white" : "var(--vn-muted)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: activeMediaTab === tab ? 600 : 400,
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "var(--vn-muted)" }}>
              <Icon name="Inbox" size={40} color="var(--vn-muted)" />
              <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>Пока нет файлов в разделе «{activeMediaTab}»</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
