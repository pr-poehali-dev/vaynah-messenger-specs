import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";
import CallScreen from "./CallScreen";

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgType = "text" | "voice" | "circle" | "image" | "video" | "audio" | "document";

interface Reaction { emoji: string; count: number; mine: boolean; }

interface Message {
  id: number;
  text: string;
  mine: boolean;
  time: string;
  type: MsgType;
  fileName?: string;
  duration?: string;
  reactions: Reaction[];
  replyTo?: { id: number; text: string; author: string };
  readBy?: string[];
  selected?: boolean;
}

const initialMessages: Message[] = [
  { id: 1, text: "Ассаламу алейкум! 🙏", mine: false, time: "14:20", type: "text", reactions: [] },
  { id: 2, text: "Ваалейкум Ассалам! Как дела?", mine: true, time: "14:21", type: "text", reactions: [{ emoji: "❤️", count: 1, mine: false }] },
  { id: 3, text: "Всё отлично, готовлюсь к поездке в горы. Там такая красота!", mine: false, time: "14:22", type: "text", reactions: [] },
  { id: 4, text: "", mine: false, time: "14:23", type: "voice", duration: "0:24", reactions: [] },
  { id: 5, text: "Хорошо! Увидимся завтра 👋", mine: true, time: "14:32", type: "text", readBy: ["Зайнаб"], reactions: [] },
  { id: 6, text: "Посмотри какой вид!", mine: false, time: "14:40", type: "image", fileName: "photo.jpg", reactions: [{ emoji: "😍", count: 2, mine: true }] },
  { id: 7, text: "Слушай, вот ссылка на карту: https://maps.google.com/maps?q=Грозный", mine: false, time: "14:45", type: "text", reactions: [] },
];

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

const AV = ["linear-gradient(135deg,#1565C0,#2196F3)", "linear-gradient(135deg,#1976D2,#42A5F5)"];

const EMOJI_CATEGORIES = [
  { label: "😊", emojis: ["😊","😂","❤️","👍","🔥","🙏","😍","😭","🥺","✨","💯","🎉","😅","🤔","😎","🥳","😆","🤩","💪","👏","🙌","✌️","🤝","💕","😋","😘","🫡","🤣","🥰","😇"] },
  { label: "🌿", emojis: ["🌿","🏔","🌙","☀️","🌊","❄️","🌸","🍀","🌺","🦋","🌻","🍁","🌈","🌟","💫","🎯","🏆","🎵","🎶","📸","🎨","📚","🚗","✈️","🏠","⚽","🎮","🍕","☕","🎁"] },
];

const REACTIONS_QUICK = ["❤️", "😂", "👍", "😮", "😢", "🔥", "🙏", "😍"];

const WALLPAPERS = [
  { id: "default", label: "По умолчанию", bg: "var(--vn-bg)" },
  { id: "mountains", label: "Горы", bg: "linear-gradient(160deg,#0D1626 0%,#1565C0 50%,#0D1626 100%)" },
  { id: "night", label: "Ночь", bg: "linear-gradient(160deg,#020408 0%,#0A1628 60%,#1565C0 100%)" },
  { id: "nature", label: "Природа", bg: "linear-gradient(160deg,#0A2010 0%,#1B5E20 50%,#0A2010 100%)" },
  { id: "sunset", label: "Закат", bg: "linear-gradient(160deg,#1A0533 0%,#7B1FA2 40%,#E65100 80%,#1A0533 100%)" },
];

function getNow() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]+/);
  return m ? m[0] : null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatView({ chat, user, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState("Фото");
  const [call, setCall] = useState<"audio" | "video" | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState(0);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<number | null>(null);
  const [msgMenu, setMsgMenu] = useState<Message | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ type: "image" | "video"; name: string } | null>(null);
  const [webview, setWebview] = useState<string | null>(null);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [wallpaper, setWallpaper] = useState("default");
  const [chatCleared, setChatCleared] = useState(false);

  // mic hold: short = voice, long (≥600ms) = circle
  const [isRecording, setIsRecording] = useState(false);
  const [isCircle, setIsCircle] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordCancelled, setRecordCancelled] = useState(false);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordStartX = useRef(0);
  const recordSecondsRef = useRef(0);
  const micIsLong = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // msg long-press
  const msgPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgPressId = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => { recordSecondsRef.current = recordSeconds; }, [recordSeconds]);

  const pushMsg = useCallback((msg: Omit<Message, "id" | "time" | "reactions">) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now(), time: getNow(), reactions: [] }]);
  }, []);

  // ── Mic: short tap = voice, long hold ≥ 600ms = circle ──
  const onMicDown = useCallback((clientX: number) => {
    micIsLong.current = false;
    recordStartX.current = clientX;
    holdTimerRef.current = setTimeout(() => {
      micIsLong.current = true;
      setIsCircle(true);
      setIsRecording(true);
      setRecordSeconds(0);
      recordSecondsRef.current = 0;
      setRecordCancelled(false);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    }, 600);
    // also start voice timer immediately for short-tap fallback
    setIsRecording(true);
    setRecordSeconds(0);
    recordSecondsRef.current = 0;
    setRecordCancelled(false);
    recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
  }, []);

  const onMicUp = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const secs = recordSecondsRef.current;
    const cancelled = recordCancelled;
    setIsRecording(false);
    setIsCircle(false);

    if (!cancelled && secs >= 0) {
      const dur = secs > 0 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : "0:01";
      const type: MsgType = micIsLong.current ? "circle" : "voice";
      setMessages((prev) => [...prev, { id: Date.now(), text: "", mine: true, type, duration: dur, reactions: [], time: getNow() }]);
    }
    setRecordSeconds(0);
    setRecordCancelled(false);
    micIsLong.current = false;
  }, [recordCancelled]);

  const onMicMove = useCallback((clientX: number) => {
    if (!isRecording) return;
    setRecordCancelled(recordStartX.current - clientX > 55);
  }, [isRecording]);

  // ── File pickers ──
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: MsgType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pushMsg({ text: "", mine: true, type, fileName: file.name });
    e.target.value = "";
    setAttachOpen(false);
  };

  // ── Reactions ──
  const toggleReaction = (msgId: number, emoji: string) => {
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find((r) => r.emoji === emoji);
      if (existing) {
        const updated = m.reactions
          .map((r) => r.emoji === emoji ? { ...r, count: r.count - (r.mine ? 1 : 0), mine: false } : r)
          .filter((r) => r.count > 0);
        return { ...m, reactions: existing.mine ? updated : [...m.reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r)] };
      }
      return { ...m, reactions: [...m.reactions, { emoji, count: 1, mine: true }] };
    }));
    setMsgMenu(null);
  };

  // ── Message press detection ──
  const onMsgDown = (msg: Message) => {
    msgPressId.current = msg.id;
    msgPressTimer.current = setTimeout(() => {
      setMsgMenu(msg);
      msgPressId.current = null;
    }, 450);
  };

  const onMsgUp = (msg: Message) => {
    if (msgPressTimer.current) clearTimeout(msgPressTimer.current);
    if (msgPressId.current === msg.id) {
      // short tap
      setSelectedMsg((prev) => prev === msg.id ? null : msg.id);
    }
  };

  // ── Copy ──
  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setMsgMenu(null);
    setSelectedMsg(null);
  };

  // ── Delete ──
  const deleteMsg = (id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setMsgMenu(null);
  };

  // ── Send ──
  const send = () => {
    if (!input.trim()) return;
    pushMsg({ text: input.trim(), mine: true, type: "text", replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, author: replyTo.mine ? "Вы" : chat.name } : undefined });
    setInput("");
    setReplyTo(null);
    setShowEmoji(false);
  };

  const currentWallpaper = WALLPAPERS.find((w) => w.id === wallpaper)?.bg || "var(--vn-bg)";

  // ─── SCREENS ──────────────────────────────────────────────────────────────

  if (call) return <div style={{ position: "relative", height: "100%" }}><CallScreen type={call} name={chat.name} avatar={chat.avatar} onEnd={() => setCall(null)} /></div>;

  if (showProfile) return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "0.9rem 1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
        <button onClick={() => setShowProfile(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
        <span style={{ fontWeight: 600 }}>Профиль</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        <div style={{ height: 130, background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light),var(--vn-blue-bright))" }} />
        <div style={{ padding: "0 1.2rem 1.2rem" }}>
          <div style={{ marginTop: -44, width: 88, height: 88, borderRadius: "50%", background: AV[0], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "2rem", color: "white", border: "4px solid var(--vn-bg)", position: "relative", marginBottom: "0.75rem" }}>
            {chat.avatar}
            {chat.online && <div className="vn-online" style={{ position: "absolute", bottom: 4, right: 4, width: 14, height: 14 }} />}
          </div>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>{chat.name}</h2>
          <p style={{ color: "var(--vn-muted)", fontSize: "0.84rem", marginBottom: "1.2rem" }}>{chat.online ? "🟢 онлайн" : "⚫ был(а) недавно"}{chat.city ? " · " + chat.city : ""}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
            <button onClick={() => { setShowProfile(false); setCall("audio"); }} className="vn-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.75rem", fontSize: "0.9rem" }}><Icon name="Phone" size={16} color="white" />Позвонить</button>
            <button onClick={() => { setShowProfile(false); setCall("video"); }} className="vn-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.75rem", fontSize: "0.9rem", background: "linear-gradient(135deg,var(--vn-blue-mid),var(--vn-blue-bright))" }}><Icon name="Video" size={16} color="white" />Видео</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── MAIN CHAT ─────────────────────────────────────────────────────────────

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative", background: currentWallpaper }}>

      {/* ── Header ── */}
      <div style={{ padding: "0.85rem 0.9rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: "0.7rem", background: "var(--vn-card)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)", padding: 4, flexShrink: 0 }}>
          <Icon name="ArrowLeft" size={22} />
        </button>
        <button onClick={() => setShowProfile(true)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: AV[0], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1rem" }}>{chat.avatar}</div>
          {chat.online && <div className="vn-online" style={{ position: "absolute", bottom: 0, right: 0 }} />}
        </button>
        <button onClick={() => setShowProfile(true)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--vn-text)" }}>{chat.name}</div>
          <div style={{ fontSize: "0.72rem", color: chat.online ? "#2ECC71" : "var(--vn-muted)" }}>{chat.online ? "онлайн" : "был(а) недавно"}</div>
        </button>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <button onClick={() => setCall("audio")} style={{ background: "rgba(33,150,243,0.12)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon name="Phone" size={16} color="var(--vn-blue-bright)" />
          </button>
          <button onClick={() => setCall("video")} style={{ background: "rgba(33,150,243,0.12)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon name="Video" size={16} color="var(--vn-blue-bright)" />
          </button>
          <button onClick={() => setShowChatSettings(true)} style={{ background: "rgba(33,150,243,0.12)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon name="MoreVertical" size={16} color="var(--vn-blue-bright)" />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }} className="scrollbar-hide">
        {chatCleared ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--vn-muted)", fontSize: "0.9rem" }}>Чат очищен</div>
        ) : messages.map((msg) => {
          const url = msg.type === "text" ? extractUrl(msg.text) : null;
          const isSelected = selectedMsg === msg.id;

          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.mine ? "flex-end" : "flex-start", gap: 2 }}>
              {/* Author avatar (not mine) */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: msg.mine ? "row-reverse" : "row" }}>
                {!msg.mine && (
                  <button
                    onClick={() => setShowProfile(true)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: AV[0], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "0.7rem" }}>
                      {chat.avatar}
                    </div>
                  </button>
                )}

                {/* Bubble */}
                <div
                  onPointerDown={() => onMsgDown(msg)}
                  onPointerUp={() => onMsgUp(msg)}
                  onPointerCancel={() => { if (msgPressTimer.current) clearTimeout(msgPressTimer.current); }}
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    outline: isSelected ? `2px solid var(--vn-blue-bright)` : "none",
                    outlineOffset: 2,
                    borderRadius: msg.mine ? "1.2rem 1.2rem 0.3rem 1.2rem" : "1.2rem 1.2rem 1.2rem 0.3rem",
                    transition: "outline 0.15s",
                  }}
                  className={msg.mine ? "vn-msg-me" : "vn-msg-other"}
                >
                  {/* Reply preview */}
                  {msg.replyTo && (
                    <div style={{ background: "rgba(255,255,255,0.12)", borderLeft: "2px solid rgba(255,255,255,0.5)", borderRadius: "0.4rem", padding: "0.3rem 0.5rem", marginBottom: "0.4rem", fontSize: "0.75rem", opacity: 0.85 }}>
                      <div style={{ fontWeight: 600 }}>{msg.replyTo.author}</div>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{msg.replyTo.text}</div>
                    </div>
                  )}

                  {/* Content */}
                  {msg.type === "text" && (
                    <span style={{ lineHeight: 1.45 }}>
                      {url ? (
                        <>
                          {msg.text.replace(url, "")}{" "}
                          <span
                            onClick={(e) => { e.stopPropagation(); setWebview(url); }}
                            style={{ color: msg.mine ? "rgba(255,255,255,0.9)" : "var(--vn-blue-bright)", textDecoration: "underline", cursor: "pointer" }}
                          >
                            {url}
                          </span>
                        </>
                      ) : msg.text}
                    </span>
                  )}
                  {msg.type === "voice" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 130 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: msg.mine ? "rgba(255,255,255,0.2)" : "rgba(33,150,243,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="Play" size={12} color={msg.mine ? "white" : "var(--vn-blue-bright)"} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 3, borderRadius: 2, background: msg.mine ? "rgba(255,255,255,0.3)" : "var(--vn-border)", marginBottom: 3 }}>
                          <div style={{ width: "55%", height: "100%", borderRadius: 2, background: msg.mine ? "white" : "var(--vn-blue-light)" }} />
                        </div>
                        <span style={{ fontSize: "0.7rem", opacity: 0.75 }}>{msg.duration || "0:01"}</span>
                      </div>
                    </div>
                  )}
                  {msg.type === "circle" && (
                    <div
                      style={{ width: 100, height: 100, borderRadius: "50%", background: AV[0], display: "flex", alignItems: "center", justifyContent: "center", position: "relative", border: "3px solid rgba(255,255,255,0.3)", overflow: "hidden" }}
                    >
                      <Icon name="Video" size={28} color="rgba(255,255,255,0.7)" />
                      <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="Play" size={10} color="white" />
                        </div>
                      </div>
                      <span style={{ position: "absolute", top: 6, right: 6, fontSize: "0.65rem", background: "rgba(0,0,0,0.5)", color: "white", borderRadius: "50px", padding: "1px 5px" }}>{msg.duration}</span>
                    </div>
                  )}
                  {msg.type === "image" && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setFullscreenMedia({ type: "image", name: msg.fileName || "photo.jpg" }); }}
                      style={{ width: 180, height: 130, borderRadius: "0.75rem", background: "linear-gradient(135deg,rgba(21,101,192,0.5),rgba(33,150,243,0.4))", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-in", position: "relative", overflow: "hidden" }}
                    >
                      <Icon name="Image" size={36} color="rgba(255,255,255,0.5)" />
                      <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.5)", borderRadius: "50px", padding: "2px 7px", fontSize: "0.7rem", color: "white" }}>
                        {msg.fileName || "фото"}
                      </div>
                    </div>
                  )}
                  {msg.type === "video" && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setFullscreenMedia({ type: "video", name: msg.fileName || "video.mp4" }); }}
                      style={{ width: 180, height: 130, borderRadius: "0.75rem", background: "linear-gradient(135deg,#0D1626,#1565C0)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="Play" size={20} color="white" />
                      </div>
                      <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.5)", borderRadius: "50px", padding: "2px 7px", fontSize: "0.7rem", color: "white" }}>▶ {msg.fileName}</div>
                    </div>
                  )}
                  {msg.type === "audio" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 140 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: msg.mine ? "rgba(255,255,255,0.2)" : "rgba(33,150,243,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="Music" size={13} color={msg.mine ? "white" : "var(--vn-blue-bright)"} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 500, marginBottom: 3, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.fileName}</div>
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
                      <span style={{ fontSize: "0.82rem", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.fileName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Time + readBy */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: msg.mine ? 0 : 34, paddingRight: msg.mine ? 0 : 0 }}>
                <span style={{ fontSize: "0.65rem", color: "var(--vn-muted)" }}>{msg.time}</span>
                {msg.mine && msg.readBy && <Icon name="CheckCheck" size={11} color="var(--vn-blue-bright)" />}
              </div>

              {/* Reactions display */}
              {msg.reactions.length > 0 && (
                <div style={{ display: "flex", gap: 4, paddingLeft: msg.mine ? 0 : 34 }}>
                  {msg.reactions.filter((r) => r.count > 0).map((r) => (
                    <button
                      key={r.emoji}
                      onClick={() => toggleReaction(msg.id, r.emoji)}
                      style={{
                        display: "flex", alignItems: "center", gap: 3,
                        background: r.mine ? "rgba(33,150,243,0.2)" : "var(--vn-card2)",
                        border: `1px solid ${r.mine ? "rgba(33,150,243,0.4)" : "var(--vn-border)"}`,
                        borderRadius: "50px", padding: "1px 6px",
                        cursor: "pointer", fontSize: "0.85rem",
                      }}>
                      {r.emoji}
                      {r.count > 1 && <span style={{ fontSize: "0.7rem", color: "var(--vn-muted)" }}>{r.count}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Copy hint when selected */}
              {isSelected && (msg.type === "text") && (
                <button
                  onClick={() => copyText(msg.text)}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "50px", padding: "0.3rem 0.8rem", cursor: "pointer", fontSize: "0.76rem", color: "var(--vn-blue-bright)", animation: "vn-appear 0.15s ease", paddingLeft: msg.mine ? 0 : 34 }}
                >
                  <Icon name="Copy" size={13} color="var(--vn-blue-bright)" /> Копировать
                </button>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Reply preview ── */}
      {replyTo && (
        <div style={{ padding: "0.5rem 0.9rem", borderTop: "1px solid var(--vn-border)", background: "var(--vn-card)", display: "flex", alignItems: "center", gap: 8, animation: "vn-appear 0.15s ease" }}>
          <div style={{ flex: 1, borderLeft: "3px solid var(--vn-blue-bright)", paddingLeft: 8 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--vn-blue-bright)" }}>{replyTo.mine ? "Вы" : chat.name}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--vn-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.text}</div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-muted)" }}>
            <Icon name="X" size={16} />
          </button>
        </div>
      )}

      {/* ── Emoji panel ── */}
      {showEmoji && (
        <div style={{ background: "var(--vn-card)", borderTop: "1px solid var(--vn-border)", height: 220, display: "flex", flexDirection: "column", animation: "vn-appear 0.2s ease" }}>
          <div style={{ display: "flex", gap: 4, padding: "0.5rem 0.75rem 0.25rem", borderBottom: "1px solid var(--vn-border)" }}>
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => setEmojiTab(i)} style={{ background: emojiTab === i ? "rgba(33,150,243,0.15)" : "none", border: "none", borderRadius: "0.5rem", padding: "0.3rem 0.6rem", cursor: "pointer", fontSize: "1.1rem" }}>
                {cat.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.75rem", display: "flex", flexWrap: "wrap", gap: 2 }} className="scrollbar-hide">
            {EMOJI_CATEGORIES[emojiTab].emojis.map((em) => (
              <button
                key={em}
                onClick={() => { setInput((prev) => prev + em); inputRef.current?.focus(); }}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", padding: "0.2rem", borderRadius: "0.4rem", transition: "background 0.1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Attach menu ── */}
      {attachOpen && (
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--vn-border)", background: "var(--vn-card)", animation: "vn-appear 0.2s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
            {[
              { icon: "Image", label: "Фото", color: "#2196F3", action: () => photoInputRef.current?.click() },
              { icon: "Video", label: "Видео", color: "#1565C0", action: () => videoInputRef.current?.click() },
              { icon: "Music", label: "Аудио", color: "#42A5F5", action: () => audioInputRef.current?.click() },
              { icon: "FileText", label: "Документ", color: "#29B6F6", action: () => docInputRef.current?.click() },
              { icon: "MapPin", label: "Геолокация", color: "#2ECC71", action: () => { setAttachOpen(false); if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((p) => pushMsg({ text: `📍 ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`, mine: true, type: "text" }), () => pushMsg({ text: "📍 43.31700, 45.69890 (примерно)", mine: true, type: "text" })); } else { pushMsg({ text: "📍 43.31700, 45.69890 (примерно)", mine: true, type: "text" }); } } },
              { icon: "UserCheck", label: "Контакт", color: "#FF9800", action: () => { setAttachOpen(false); pushMsg({ text: "👤 Ахмед Мусаев\n+7 928 123-45-67", mine: true, type: "text" }); } },
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

      {/* ── Voice recording overlay ── */}
      {isRecording && (
        <div style={{ padding: "0.85rem 1.2rem", borderTop: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)", animation: "vn-appear 0.15s ease" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: recordCancelled ? "var(--vn-muted)" : (isCircle ? "var(--vn-blue-bright)" : "#E74C3C"), animation: recordCancelled ? "none" : "vn-pulse 1s infinite", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            {recordCancelled
              ? <span style={{ color: "var(--vn-muted)", fontSize: "0.85rem" }}>Отпусти — отменится</span>
              : <span style={{ fontSize: "0.88rem" }}>{isCircle ? "🎥 Видеокружок" : "🎙 Запись"} {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}</span>
            }
          </div>
          <span style={{ fontSize: "0.73rem", color: "var(--vn-muted)" }}>← свайп для отмены</span>
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={{ padding: "0.65rem 0.8rem", borderTop: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: "0.45rem", background: "var(--vn-card)", flexShrink: 0 }}>
        {/* Attach + */}
        <button onClick={() => { setAttachOpen(!attachOpen); setShowEmoji(false); }}
          style={{ background: attachOpen ? "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))" : "rgba(33,150,243,0.1)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.2s", transform: attachOpen ? "rotate(45deg)" : "rotate(0deg)" }}>
          <Icon name="Plus" size={18} color={attachOpen ? "white" : "var(--vn-blue-bright)"} />
        </button>

        {/* Emoji smile */}
        <button onClick={() => { setShowEmoji(!showEmoji); setAttachOpen(false); }}
          style={{ background: showEmoji ? "rgba(33,150,243,0.2)" : "none", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: "1.2rem", transition: "all 0.2s" }}>
          😊
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          className="vn-input"
          placeholder="Сообщение..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          style={{ flex: 1, padding: "0.55rem 0.8rem", fontSize: "0.9rem" }}
        />

        {/* Send or Mic */}
        {input.trim() ? (
          <button onClick={send}
            style={{ background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 12px rgba(33,150,243,0.45)" }}>
            <Icon name="Send" size={16} color="white" />
          </button>
        ) : (
          <button
            onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); onMicDown(e.clientX); }}
            onPointerMove={(e) => onMicMove(e.clientX)}
            onPointerUp={onMicUp}
            onPointerCancel={() => { if (recordTimerRef.current) clearInterval(recordTimerRef.current); if (holdTimerRef.current) clearTimeout(holdTimerRef.current); setIsRecording(false); setIsCircle(false); setRecordSeconds(0); setRecordCancelled(false); }}
            style={{
              background: isRecording ? (recordCancelled ? "rgba(150,150,150,0.15)" : isCircle ? "rgba(33,150,243,0.2)" : "rgba(231,76,60,0.15)") : "rgba(33,150,243,0.1)",
              border: `2px solid ${isRecording ? (recordCancelled ? "rgba(150,150,150,0.3)" : isCircle ? "rgba(33,150,243,0.5)" : "rgba(231,76,60,0.45)") : "transparent"}`,
              borderRadius: "50%", width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, touchAction: "none", userSelect: "none", transition: "all 0.15s",
            }}>
            <Icon name={isCircle ? "Video" : "Mic"} size={16} color={isRecording ? (recordCancelled ? "var(--vn-muted)" : isCircle ? "var(--vn-blue-bright)" : "#E74C3C") : "var(--vn-blue-bright)"} />
          </button>
        )}
      </div>

      {/* Hidden inputs */}
      <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e, "image")} />
      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => handleFile(e, "video")} />
      <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => handleFile(e, "audio")} />
      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar" style={{ display: "none" }} onChange={(e) => handleFile(e, "document")} />

      {/* ── Message long-press menu ── */}
      {msgMenu && (
        <div onClick={() => setMsgMenu(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 60, display: "flex", alignItems: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--vn-card)", borderRadius: "1.5rem 1.5rem 0 0", padding: "1rem 1rem 1.5rem", width: "100%", animation: "vn-appear 0.2s ease" }}>
            {/* Quick reactions */}
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "1rem", padding: "0.5rem 0", borderBottom: "1px solid var(--vn-border)" }}>
              {REACTIONS_QUICK.map((em) => (
                <button key={em} onClick={() => toggleReaction(msgMenu.id, em)}
                  style={{ fontSize: "1.6rem", background: "none", border: "none", cursor: "pointer", transition: "transform 0.1s", padding: "0.2rem" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.35)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                  {em}
                </button>
              ))}
            </div>

            {/* Preview */}
            {msgMenu.type === "text" && (
              <div style={{ background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "0.75rem", padding: "0.6rem 0.9rem", marginBottom: "0.8rem", fontSize: "0.85rem", color: "var(--vn-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {msgMenu.text}
              </div>
            )}

            {/* Actions */}
            {[
              { icon: "Copy", label: "Копировать", action: () => copyText(msgMenu.text), show: msgMenu.type === "text" },
              { icon: "Reply", label: "Ответить", action: () => { setReplyTo(msgMenu); setMsgMenu(null); }, show: true },
              { icon: "Forward", label: "Переслать", action: () => setMsgMenu(null), show: true },
              { icon: "Trash2", label: "Удалить", action: () => deleteMsg(msgMenu.id), show: true, danger: true },
            ].filter((a) => a.show).map((item) => (
              <button key={item.label} onClick={item.action}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", padding: "0.75rem 0.5rem", cursor: "pointer", borderRadius: "0.75rem", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: item.danger ? "rgba(231,76,60,0.1)" : "rgba(33,150,243,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={item.icon} size={16} color={item.danger ? "#E74C3C" : "var(--vn-blue-bright)"} />
                </div>
                <span style={{ fontSize: "0.92rem", color: item.danger ? "#E74C3C" : "var(--vn-text)" }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Fullscreen media ── */}
      {fullscreenMedia && (
        <div
          onClick={() => setFullscreenMedia(null)}
          style={{ position: "absolute", inset: 0, background: "#000", zIndex: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "vn-scale-in 0.2s ease" }}
        >
          <button onClick={() => setFullscreenMedia(null)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon name="X" size={18} color="white" />
          </button>
          {fullscreenMedia.type === "image" ? (
            <div style={{ width: "90%", aspectRatio: "4/3", background: "linear-gradient(135deg,rgba(21,101,192,0.4),rgba(33,150,243,0.3))", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="Image" size={60} color="rgba(255,255,255,0.4)" />
            </div>
          ) : (
            <div style={{ width: "90%", aspectRatio: "16/9", background: "#0A1628", borderRadius: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(33,150,243,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="Play" size={28} color="white" />
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>{fullscreenMedia.name}</p>
            </div>
          )}
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginTop: 12 }}>{fullscreenMedia.name}</p>
        </div>
      )}

      {/* ── WebView ── */}
      {webview && (
        <div style={{ position: "absolute", inset: 0, zIndex: 90, display: "flex", flexDirection: "column", background: "var(--vn-bg)", animation: "vn-slide-in 0.25s ease" }}>
          <div style={{ padding: "0.85rem 1rem", background: "var(--vn-card)", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setWebview(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)", flexShrink: 0 }}>
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div style={{ flex: 1, background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "0.6rem", padding: "0.35rem 0.8rem", fontSize: "0.78rem", color: "var(--vn-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {webview}
            </div>
            <a href={webview} target="_blank" rel="noreferrer" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)", flexShrink: 0, textDecoration: "none" }}>
              <Icon name="ExternalLink" size={18} color="var(--vn-blue-bright)" />
            </a>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
            <div style={{ textAlign: "center", color: "var(--vn-muted)" }}>
              <Icon name="Globe" size={48} color="var(--vn-muted)" />
              <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>Открыть в браузере</p>
              <a href={webview} target="_blank" rel="noreferrer" className="vn-btn" style={{ display: "inline-flex", marginTop: "1rem", textDecoration: "none", alignItems: "center", gap: 8, width: "auto", padding: "0.7rem 1.5rem" }}>
                <Icon name="ExternalLink" size={15} color="white" />
                Открыть страницу
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat settings (три точки) ── */}
      {showChatSettings && (
        <div onClick={() => setShowChatSettings(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 70, display: "flex", alignItems: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--vn-card)", borderRadius: "1.5rem 1.5rem 0 0", padding: "1.2rem 1rem 1.8rem", width: "100%", animation: "vn-appear 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <h3 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1rem" }}>Настройки чата</h3>
              <button onClick={() => setShowChatSettings(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-muted)" }}><Icon name="X" size={18} /></button>
            </div>

            {/* Wallpaper */}
            <p style={{ fontSize: "0.75rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.6rem" }}>Фон чата</p>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: "0.75rem", marginBottom: "0.75rem" }} className="scrollbar-hide">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWallpaper(w.id)}
                  style={{ flexShrink: 0, width: 56, height: 80, borderRadius: "0.75rem", background: w.bg, border: wallpaper === w.id ? "3px solid var(--vn-blue-bright)" : "2px solid var(--vn-border)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "0.3rem", transition: "all 0.2s" }}
                >
                  <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.8)", fontWeight: 600, textAlign: "center" }}>{w.label}</span>
                </button>
              ))}
            </div>

            <div style={{ height: 1, background: "var(--vn-border)", margin: "0.25rem 0 0.75rem" }} />

            {[
              { icon: "Eraser", label: "Очистить историю чата", color: "var(--vn-muted)", action: () => { setChatCleared(true); setMessages([]); setShowChatSettings(false); } },
              { icon: "LogOut", label: "Выйти из чата", color: "#E74C3C", action: () => { setShowChatSettings(false); onBack(); } },
            ].map((item) => (
              <button key={item.label} onClick={item.action}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", padding: "0.8rem 0.5rem", cursor: "pointer", borderRadius: "0.75rem", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(33,150,243,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: item.color === "#E74C3C" ? "rgba(231,76,60,0.1)" : "rgba(33,150,243,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={item.icon} size={16} color={item.color} />
                </div>
                <span style={{ fontSize: "0.92rem", color: item.color }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Media Gallery ── */}
      {showMedia && (
        <div style={{ position: "absolute", inset: 0, background: "var(--vn-bg)", zIndex: 50, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
            <button onClick={() => setShowMedia(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}><Icon name="ArrowLeft" size={22} /></button>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem" }}>Медиафайлы</h2>
          </div>
          <div style={{ display: "flex", overflowX: "auto", padding: "0.75rem 1rem", gap: 8, borderBottom: "1px solid var(--vn-border)" }} className="scrollbar-hide">
            {["Фото", "Видео", "Голосовые", "Кружки", "Ссылки", "Файлы", "Документы"].map((tab) => (
              <button key={tab} onClick={() => setActiveMediaTab(tab)}
                style={{ background: activeMediaTab === tab ? "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))" : "var(--vn-card2)", border: "none", borderRadius: "50px", padding: "0.4rem 0.9rem", color: activeMediaTab === tab ? "white" : "var(--vn-muted)", cursor: "pointer", fontSize: "0.8rem", fontWeight: activeMediaTab === tab ? 600 : 400, whiteSpace: "nowrap" }}>
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
