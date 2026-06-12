import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";
import CallScreen from "./CallScreen";

interface Message {
  id: number;
  text: string;
  mine: boolean;
  time: string;
  type: "text" | "voice" | "image" | "video" | "audio" | "document";
  fileName?: string;
  duration?: string;
  reaction?: string;
  readBy?: string[];
}

const initialMessages: Message[] = [
  { id: 1, text: "Ассаламу алейкум! 🙏", mine: false, time: "14:20", type: "text" },
  { id: 2, text: "Ваалейкум Ассалам! Как дела?", mine: true, time: "14:21", type: "text" },
  { id: 3, text: "Всё отлично, готовлюсь к поездке", mine: false, time: "14:22", type: "text" },
  { id: 4, text: "", mine: false, time: "14:23", type: "voice", duration: "0:24" },
  { id: 5, text: "Хорошо! Увидимся завтра 👋", mine: true, time: "14:32", type: "text", readBy: ["Зайнаб"] },
];

const avatarColors = ["linear-gradient(135deg,#1565C0,#2196F3)", "linear-gradient(135deg,#1976D2,#42A5F5)"];

export interface ChatData {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
  city?: string;
  age?: number;
}

interface Props {
  chat: ChatData;
  user: User;
  onBack: () => void;
}

function getNow() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatView({ chat, user, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [showReaction, setShowReaction] = useState<number | null>(null);
  const [showReadBy, setShowReadBy] = useState<number | null>(null);
  const [showMedia, setShowMedia] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState("Фото");
  const [call, setCall] = useState<"audio" | "video" | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordCancelled, setRecordCancelled] = useState(false);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartX = useRef(0);
  const recordSecondsRef = useRef(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    recordSecondsRef.current = recordSeconds;
  }, [recordSeconds]);

  const pushMsg = (msg: Omit<Message, "id" | "time">) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now(), time: getNow() }]);
  };

  const addReaction = (msgId: number, emoji: string) => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, reaction: emoji } : m)));
    setShowReaction(null);
  };

  // File pickers
  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>, type: Message["type"]) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pushMsg({ text: "", mine: true, type, fileName: file.name });
    e.target.value = "";
    setAttachOpen(false);
  };

  // Voice hold
  const startRecording = useCallback((clientX: number) => {
    setIsRecording(true);
    setRecordCancelled(false);
    setRecordSeconds(0);
    recordSecondsRef.current = 0;
    recordStartX.current = clientX;
    recordTimerRef.current = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback((cancelled: boolean) => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    const secs = recordSecondsRef.current;
    if (!cancelled && secs > 0) {
      const dur = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
      setMessages((prev) => [...prev, { id: Date.now(), text: "", mine: true, type: "voice", duration: dur, time: getNow() }]);
    }
    setRecordSeconds(0);
    setRecordCancelled(false);
  }, []);

  const mediaTabs = ["Фото", "Видео", "Голосовые", "Кружки", "Ссылки", "Файлы", "Документы"];

  if (call) {
    return <div style={{ position: "relative", height: "100%" }}><CallScreen type={call} name={chat.name} avatar={chat.avatar} onEnd={() => setCall(null)} /></div>;
  }

  if (showProfile) {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "0.9rem 1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setShowProfile(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
          <span style={{ fontWeight: 600 }}>Профиль</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          <div style={{ height: 130, background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light),var(--vn-blue-bright))", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'><circle cx='160' cy='30' r='60' fill='rgba(255,255,255,0.07)'/></svg>\")" }} />
          </div>
          <div style={{ padding: "0 1.2rem 1.2rem", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ marginTop: -44, width: 88, height: 88, borderRadius: "50%", background: avatarColors[0], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "2rem", color: "white", border: "4px solid var(--vn-bg)", position: "relative" }}>
                {chat.avatar}
                {chat.online && <div className="vn-online" style={{ position: "absolute", bottom: 4, right: 4, width: 14, height: 14 }} />}
              </div>
            </div>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>{chat.name}</h2>
            <p style={{ color: "var(--vn-muted)", fontSize: "0.84rem", marginBottom: "1rem" }}>
              {chat.online ? "🟢 онлайн" : "⚫ был(а) недавно"}{chat.city && ` · ${chat.city}`}{chat.age && ` · ${chat.age} лет`}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginBottom: "0.65rem" }}>
              <button onClick={() => { setShowProfile(false); setCall("audio"); }} className="vn-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.75rem", fontSize: "0.9rem" }}>
                <Icon name="Phone" size={16} color="white" />Позвонить
              </button>
              <button onClick={() => { setShowProfile(false); setCall("video"); }} className="vn-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.75rem", fontSize: "0.9rem", background: "linear-gradient(135deg,var(--vn-blue-mid),var(--vn-blue-bright))" }}>
                <Icon name="Video" size={16} color="white" />Видео
              </button>
            </div>
            <button onClick={() => setShowProfile(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "0.75rem", padding: "0.75rem", color: "var(--vn-text)", cursor: "pointer", fontSize: "0.9rem", marginBottom: "0.65rem" }}>
              <Icon name="MessageCircle" size={16} color="var(--vn-blue-bright)" />Написать
            </button>
            <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.25)", borderRadius: "0.75rem", padding: "0.75rem", color: "#E74C3C", cursor: "pointer", fontSize: "0.9rem" }}>
              <Icon name="Ban" size={16} color="#E74C3C" />Заблокировать
            </button>
          </div>
          <div style={{ padding: "0 1.2rem 1.5rem" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.6rem" }}>Фото</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: "0.5rem", background: `linear-gradient(135deg,rgba(21,101,192,${0.3 + i * 0.05}),rgba(33,150,243,${0.2 + i * 0.05}))`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="Image" size={18} color="rgba(255,255,255,0.25)" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>
      {/* Header */}
      <div style={{ padding: "0.85rem 0.9rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: "0.7rem", background: "var(--vn-card)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)", padding: 4, flexShrink: 0 }}>
          <Icon name="ArrowLeft" size={22} />
        </button>
        <button onClick={() => setShowProfile(true)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: avatarColors[0], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1rem" }}>{chat.avatar}</div>
          {chat.online && <div className="vn-online" style={{ position: "absolute", bottom: 0, right: 0 }} />}
        </button>
        <button onClick={() => setShowProfile(true)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--vn-text)" }}>{chat.name}</div>
          <div style={{ fontSize: "0.72rem", color: chat.online ? "#2ECC71" : "var(--vn-muted)" }}>{chat.online ? "онлайн" : "был(а) недавно"}</div>
        </button>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {[{ icon: "Phone", action: () => setCall("audio") }, { icon: "Video", action: () => setCall("video") }, { icon: "Image", action: () => setShowMedia(true) }].map((b) => (
            <button key={b.icon} onClick={b.action} style={{ background: "rgba(33,150,243,0.12)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.12)")}>
              <Icon name={b.icon} size={17} color="var(--vn-blue-bright)" />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.7rem" }} className="scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.mine ? "flex-end" : "flex-start", gap: 3 }}>
            <div className={msg.mine ? "vn-msg-me" : "vn-msg-other"}
              onClick={() => setShowReadBy(showReadBy === msg.id ? null : msg.id)}
              onDoubleClick={() => setShowReaction(showReaction === msg.id ? null : msg.id)}
              style={{ cursor: "pointer", position: "relative" }}>
              {msg.type === "voice" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 130 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: msg.mine ? "rgba(255,255,255,0.2)" : "rgba(33,150,243,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="Play" size={12} color={msg.mine ? "white" : "var(--vn-blue-bright)"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 3, borderRadius: 2, background: msg.mine ? "rgba(255,255,255,0.3)" : "var(--vn-border)", marginBottom: 3 }}>
                      <div style={{ width: "55%", height: "100%", borderRadius: 2, background: msg.mine ? "white" : "var(--vn-blue-light)" }} />
                    </div>
                    <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{msg.duration || "0:00"}</span>
                  </div>
                </div>
              )}
              {msg.type === "image" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "0.4rem", background: msg.mine ? "rgba(255,255,255,0.2)" : "rgba(33,150,243,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="Image" size={16} color={msg.mine ? "white" : "var(--vn-blue-bright)"} />
                  </div>
                  <span style={{ fontSize: "0.85rem" }}>{msg.fileName || "Фото"}</span>
                </div>
              )}
              {msg.type === "video" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "0.4rem", background: msg.mine ? "rgba(255,255,255,0.2)" : "rgba(33,150,243,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="Video" size={15} color={msg.mine ? "white" : "var(--vn-blue-bright)"} />
                  </div>
                  <span style={{ fontSize: "0.85rem" }}>{msg.fileName || "Видео"}</span>
                </div>
              )}
              {msg.type === "audio" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 130 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: msg.mine ? "rgba(255,255,255,0.2)" : "rgba(33,150,243,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="Music" size={13} color={msg.mine ? "white" : "var(--vn-blue-bright)"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 500, marginBottom: 3, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.fileName || "Аудио"}</div>
                    <div style={{ height: 3, borderRadius: 2, background: msg.mine ? "rgba(255,255,255,0.3)" : "var(--vn-border)" }}>
                      <div style={{ width: "40%", height: "100%", borderRadius: 2, background: msg.mine ? "white" : "var(--vn-blue-light)" }} />
                    </div>
                  </div>
                </div>
              )}
              {msg.type === "document" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "0.4rem", background: msg.mine ? "rgba(255,255,255,0.2)" : "rgba(33,150,243,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="FileText" size={15} color={msg.mine ? "white" : "var(--vn-blue-bright)"} />
                  </div>
                  <span style={{ fontSize: "0.82rem", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.fileName || "Документ"}</span>
                </div>
              )}
              {msg.type === "text" && msg.text}
              {msg.reaction && (
                <span style={{ position: "absolute", bottom: -12, right: msg.mine ? 4 : "auto", left: msg.mine ? "auto" : 4, fontSize: "1rem" }}>{msg.reaction}</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: "0.68rem", color: "var(--vn-muted)" }}>{msg.time}</span>
              {msg.mine && msg.readBy && <Icon name="CheckCheck" size={12} color="var(--vn-blue-bright)" />}
            </div>
            {showReadBy === msg.id && msg.readBy && (
              <div style={{ background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "0.6rem", padding: "0.45rem 0.75rem", fontSize: "0.76rem", color: "var(--vn-muted)" }}>
                👁 Прочитал(а): {msg.readBy.join(", ")}
              </div>
            )}
            {showReaction === msg.id && (
              <div style={{ display: "flex", gap: 5, background: "var(--vn-card)", border: "1px solid var(--vn-border)", borderRadius: "2rem", padding: "0.4rem 0.75rem", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                {["❤️", "😂", "👍", "😮", "😢", "🔥", "🙏"].map((em) => (
                  <button key={em} onClick={() => addReaction(msg.id, em)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", padding: "2px", transition: "transform 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.35)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Attach menu */}
      {attachOpen && (
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--vn-border)", background: "var(--vn-card)", animation: "vn-appear 0.2s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
            {[
              { icon: "Image", label: "Фото", color: "#2196F3", action: () => photoInputRef.current?.click() },
              { icon: "Video", label: "Видео", color: "#1565C0", action: () => videoInputRef.current?.click() },
              { icon: "Music", label: "Аудио", color: "#42A5F5", action: () => audioInputRef.current?.click() },
              { icon: "FileText", label: "Документ", color: "#29B6F6", action: () => docInputRef.current?.click() },
              {
                icon: "MapPin", label: "Геолокация", color: "#2ECC71",
                action: () => {
                  setAttachOpen(false);
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const lat = pos.coords.latitude.toFixed(5);
                        const lng = pos.coords.longitude.toFixed(5);
                        pushMsg({ text: `📍 Моё местоположение\n${lat}, ${lng}`, mine: true, type: "text" });
                      },
                      () => pushMsg({ text: "📍 Моё местоположение (примерно)\n43.31700, 45.69890", mine: true, type: "text" })
                    );
                  } else {
                    pushMsg({ text: "📍 Моё местоположение (примерно)\n43.31700, 45.69890", mine: true, type: "text" });
                  }
                }
              },
              {
                icon: "UserCheck", label: "Контакт", color: "#FF9800",
                action: () => {
                  setAttachOpen(false);
                  pushMsg({ text: "👤 Контакт: Ахмед Мусаев\n+7 928 123-45-67", mine: true, type: "text" });
                }
              },
            ].map((item) => (
              <button key={item.label} onClick={item.action}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "0.75rem", padding: "0.75rem 0.5rem", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--vn-blue-light)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--vn-border)")}>
                <Icon name={item.icon} size={22} color={item.color} />
                <span style={{ fontSize: "0.68rem", color: "var(--vn-muted)", textAlign: "center" }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice recording overlay */}
      {isRecording && (
        <div style={{ padding: "0.85rem 1.2rem", borderTop: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)", animation: "vn-appear 0.15s ease" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: recordCancelled ? "var(--vn-muted)" : "#E74C3C", animation: recordCancelled ? "none" : "vn-pulse 1s infinite", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            {recordCancelled
              ? <span style={{ color: "var(--vn-muted)", fontSize: "0.85rem" }}>Отпусти — запись отменится</span>
              : <span style={{ fontSize: "0.88rem" }}>Запись… {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}</span>}
          </div>
          <span style={{ fontSize: "0.73rem", color: "var(--vn-muted)" }}>← свайп для отмены</span>
        </div>
      )}

      {/* Input bar */}
      <div style={{ padding: "0.7rem 0.8rem", borderTop: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--vn-card)" }}>
        <button onClick={() => setAttachOpen(!attachOpen)}
          style={{ background: attachOpen ? "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))" : "rgba(33,150,243,0.1)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.2s", transform: attachOpen ? "rotate(45deg)" : "rotate(0deg)" }}>
          <Icon name="Plus" size={19} color={attachOpen ? "white" : "var(--vn-blue-bright)"} />
        </button>

        <input className="vn-input" placeholder="Сообщение..." value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { pushMsg({ text: input.trim(), mine: true, type: "text" }); setInput(""); } }}
          style={{ flex: 1, padding: "0.55rem 0.9rem", fontSize: "0.9rem" }} />

        {input.trim() ? (
          <button onClick={() => { pushMsg({ text: input.trim(), mine: true, type: "text" }); setInput(""); }}
            style={{ background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 14px rgba(33,150,243,0.45)" }}>
            <Icon name="Send" size={17} color="white" />
          </button>
        ) : (
          <button
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              startRecording(e.clientX);
            }}
            onPointerMove={(e) => {
              if (!isRecording) return;
              const dx = recordStartX.current - e.clientX;
              setRecordCancelled(dx > 55);
            }}
            onPointerUp={(e) => stopRecording(recordCancelled)}
            onPointerCancel={() => { stopRecording(true); }}
            style={{
              background: isRecording ? (recordCancelled ? "rgba(150,150,150,0.15)" : "rgba(231,76,60,0.15)") : "rgba(33,150,243,0.1)",
              border: `2px solid ${isRecording ? (recordCancelled ? "rgba(150,150,150,0.3)" : "rgba(231,76,60,0.45)") : "transparent"}`,
              borderRadius: "50%", width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
              touchAction: "none", userSelect: "none",
            }}>
            <Icon name="Mic" size={17} color={isRecording ? (recordCancelled ? "var(--vn-muted)" : "#E74C3C") : "var(--vn-blue-bright)"} />
          </button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileChosen(e, "image")} />
      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => handleFileChosen(e, "video")} />
      <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => handleFileChosen(e, "audio")} />
      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar" style={{ display: "none" }} onChange={(e) => handleFileChosen(e, "document")} />

      {/* Media Gallery */}
      {showMedia && (
        <div style={{ position: "absolute", inset: 0, background: "var(--vn-bg)", zIndex: 50, display: "flex", flexDirection: "column", animation: "vn-slide-in 0.25s ease" }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
            <button onClick={() => setShowMedia(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Медиафайлы</h2>
          </div>
          <div style={{ display: "flex", overflowX: "auto", padding: "0.75rem 1rem", gap: 8, borderBottom: "1px solid var(--vn-border)" }} className="scrollbar-hide">
            {mediaTabs.map((tab) => (
              <button key={tab} onClick={() => setActiveMediaTab(tab)}
                style={{ background: activeMediaTab === tab ? "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))" : "var(--vn-card2)", border: "none", borderRadius: "50px", padding: "0.4rem 0.9rem", color: activeMediaTab === tab ? "white" : "var(--vn-muted)", cursor: "pointer", fontSize: "0.8rem", fontWeight: activeMediaTab === tab ? 600 : 400, whiteSpace: "nowrap", transition: "all 0.2s" }}>
                {tab}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "var(--vn-muted)" }}>
              <Icon name="Inbox" size={40} color="var(--vn-muted)" />
              <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>Нет файлов в «{activeMediaTab}»</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}