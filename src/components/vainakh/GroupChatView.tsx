import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";

type MsgType = "text" | "voice" | "circle" | "image" | "video" | "audio" | "document";

interface Reaction { emoji: string; count: number; mine: boolean; }

interface Message {
  id: number;
  text: string;
  author: string;
  authorAvatar: string;
  mine: boolean;
  time: string;
  type: MsgType;
  fileName?: string;
  duration?: string;
  reactions: Reaction[];
}

export interface GroupData {
  id: number;
  name: string;
  avatar: string;
  avatarColor?: string;
  members: GroupMember[];
}

export interface GroupMember {
  id: number;
  name: string;
  surname: string;
  avatar: string;
  online: boolean;
  isAdmin?: boolean;
}

interface Props {
  group: GroupData;
  user: User;
  onBack: () => void;
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#1565C0,#2196F3)",
  "linear-gradient(135deg,#1976D2,#42A5F5)",
  "linear-gradient(135deg,#0D47A1,#1976D2)",
  "linear-gradient(135deg,#1565C0,#29B6F6)",
  "linear-gradient(135deg,#0D47A1,#42A5F5)",
  "linear-gradient(135deg,#1565C0,#64B5F6)",
];

const EMOJI_CATEGORIES = [
  { label: "😊", emojis: ["😊","😂","❤️","👍","🔥","🙏","😍","😭","🥺","✨","💯","🎉","😅","🤔","😎","🥳","😆","🤩","💪","👏","🙌","✌️","🤝","💕","😋","😘","🫡","🤣","🥰","😇"] },
  { label: "🌿", emojis: ["🌿","🏔","🌙","☀️","🌊","❄️","🌸","🍀","🌺","🦋","🌻","🍁","🌈","🌟","💫","🎯","🏆","🎵","🎶","📸","🎨","📚","🚗","✈️","🏠","⚽","🎮","🍕","☕","🎁"] },
];

const REACTIONS_QUICK = ["❤️", "😂", "👍", "😮", "😢", "🔥", "🙏", "😍"];

function getNow() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

function getInitialMessages(members: GroupMember[]): Message[] {
  if (!members.length) return [];
  const first = members[0];
  return [
    {
      id: 1,
      text: "Группа создана 🎉",
      author: "Система",
      authorAvatar: "★",
      mine: false,
      time: getNow(),
      type: "text",
      reactions: [],
    },
    {
      id: 2,
      text: "Ассаламу алейкум всем! 🙏",
      author: first.name,
      authorAvatar: first.avatar,
      mine: false,
      time: getNow(),
      type: "text",
      reactions: [],
    },
  ];
}

export default function GroupChatView({ group, user, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(group.members));
  const [input, setInput] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [circleMode, setCircleMode] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordCancelled, setRecordCancelled] = useState(false);
  const [msgMenu, setMsgMenu] = useState<Message | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordStartX = useRef(0);
  const recordSecondsRef = useRef(0);
  const micDidHold = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { recordSecondsRef.current = recordSeconds; }, [recordSeconds]);

  const pushMsg = useCallback((msg: Omit<Message, "id" | "time" | "reactions" | "author" | "authorAvatar" | "mine">) => {
    setMessages((prev) => [...prev, {
      ...msg,
      id: Date.now(),
      time: getNow(),
      reactions: [],
      author: user.name || "Вы",
      authorAvatar: (user.name || "Я")[0],
      mine: true,
    }]);
  }, [user]);

  const send = () => {
    if (!input.trim()) return;
    pushMsg({ text: input.trim(), type: "text" });
    setInput("");
    setShowEmoji(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: MsgType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pushMsg({ text: "", type, fileName: file.name });
    e.target.value = "";
    setAttachOpen(false);
  };

  const onMicDown = useCallback((clientX: number) => {
    micDidHold.current = false;
    recordStartX.current = clientX;
    holdTimerRef.current = setTimeout(() => {
      micDidHold.current = true;
      setIsRecording(true);
      setRecordSeconds(0);
      recordSecondsRef.current = 0;
      setRecordCancelled(false);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    }, 250);
  }, [circleMode]);

  const onMicUp = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (!micDidHold.current) { setCircleMode((m) => !m); return; }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const secs = recordSecondsRef.current;
    setIsRecording(false);
    if (!recordCancelled && secs >= 0) {
      const dur = secs > 0 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : "0:01";
      pushMsg({ text: "", type: circleMode ? "circle" : "voice", duration: dur });
    }
    setRecordSeconds(0);
    setRecordCancelled(false);
    micDidHold.current = false;
  }, [recordCancelled, circleMode, pushMsg]);

  const onMicMove = useCallback((clientX: number) => {
    if (!isRecording) return;
    setRecordCancelled(recordStartX.current - clientX > 55);
  }, [isRecording]);

  const toggleReaction = (msgId: number, emoji: string) => {
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find((r) => r.emoji === emoji);
      if (existing) {
        const updated = m.reactions
          .map((r) => r.emoji === emoji ? { ...r, count: r.count - (r.mine ? 1 : 0), mine: false } : r)
          .filter((r) => r.count > 0);
        return { ...m, reactions: existing.mine ? updated : m.reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r) };
      }
      return { ...m, reactions: [...m.reactions, { emoji, count: 1, mine: true }] };
    }));
    setMsgMenu(null);
  };

  // ── GROUP INFO ──────────────────────────────────────────────────────────────
  if (showGroupInfo) {
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)" }}>
          <button onClick={() => setShowGroupInfo(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)" }}>
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h2 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.1rem", flex: 1 }}>Информация о группе</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          {/* Group avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem 1.5rem 1.5rem", background: "var(--vn-card)", borderBottom: "1px solid var(--vn-border)" }}>
            <div style={{ width: 90, height: 90, borderRadius: "50%", background: group.avatarColor || AVATAR_COLORS[group.id % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "2.2rem", color: "white", boxShadow: "0 8px 28px rgba(33,150,243,0.35)", marginBottom: "1rem" }}>
              {group.avatar}
            </div>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.4rem", marginBottom: 4 }}>{group.name}</h2>
            <p style={{ color: "var(--vn-muted)", fontSize: "0.85rem" }}>{group.members.length + 1} участник{group.members.length === 0 ? "" : group.members.length < 4 ? "а" : "ов"}</p>
          </div>

          {/* Members */}
          <div style={{ padding: "0.75rem 1.2rem 0.3rem" }}>
            <p style={{ fontSize: "0.72rem", color: "var(--vn-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Участники</p>
          </div>
          {/* Me */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.75rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: AVATAR_COLORS[0], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1rem" }}>
              {(user.name || "Я")[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{user.name || "Вы"} {user.surname}</div>
              <div style={{ fontSize: "0.76rem", color: "var(--vn-blue-bright)" }}>Администратор</div>
            </div>
          </div>
          {group.members.map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.75rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1rem" }}>
                  {m.avatar}
                </div>
                {m.online && <div className="vn-online" style={{ position: "absolute", bottom: 1, right: 1 }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{m.name} {m.surname}</div>
                <div style={{ fontSize: "0.76rem", color: m.online ? "#2ECC71" : "var(--vn-muted)" }}>{m.online ? "онлайн" : "не в сети"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── CHAT ───────────────────────────────────────────────────────────────────
  const bg = "var(--vn-bg)";

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: bg }}>

      {/* Header */}
      <div style={{ padding: "0.7rem 1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 10, background: "var(--vn-card)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-blue-bright)", flexShrink: 0 }}>
          <Icon name="ArrowLeft" size={22} />
        </button>
        <button onClick={() => setShowGroupInfo(true)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", flex: 1, textAlign: "left", minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: group.avatarColor || AVATAR_COLORS[group.id % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", color: "white", flexShrink: 0, boxShadow: "0 3px 10px rgba(33,150,243,0.3)" }}>
            {group.avatar}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.97rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.name}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--vn-muted)", marginTop: 1 }}>
              {group.members.filter((m) => m.online).length + 1} в сети · {group.members.length + 1} участников
            </div>
          </div>
        </button>
        <button onClick={() => setShowMembers(!showMembers)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-muted)", flexShrink: 0 }}>
          <Icon name="Users" size={20} />
        </button>
      </div>

      {/* Members strip */}
      {showMembers && (
        <div style={{ padding: "0.6rem 1rem", borderBottom: "1px solid var(--vn-border)", background: "var(--vn-card)", display: "flex", gap: 10, overflowX: "auto", animation: "vn-appear 0.2s ease" }} className="scrollbar-hide">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: AVATAR_COLORS[0], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "0.9rem", border: "2px solid var(--vn-blue-bright)" }}>
              {(user.name || "Я")[0]}
            </div>
            <span style={{ fontSize: "0.6rem", color: "var(--vn-blue-bright)", maxWidth: 44, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Вы</span>
          </div>
          {group.members.map((m, i) => (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "0.9rem" }}>
                  {m.avatar}
                </div>
                {m.online && <div className="vn-online" style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10 }} />}
              </div>
              <span style={{ fontSize: "0.6rem", color: "var(--vn-muted)", maxWidth: 44, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 0.8rem", display: "flex", flexDirection: "column", gap: "0.4rem" }} className="scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{ display: "flex", flexDirection: "column", alignItems: msg.mine ? "flex-end" : "flex-start", animation: "vn-msg-in 0.2s ease" }}
          >
            {/* Author name for others */}
            {!msg.mine && msg.author !== "Система" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, paddingLeft: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: AVATAR_COLORS[msg.id % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, color: "white", flexShrink: 0 }}>
                  {msg.authorAvatar}
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--vn-blue-bright)", fontWeight: 600 }}>{msg.author}</span>
              </div>
            )}

            {/* System message */}
            {msg.author === "Система" && (
              <div style={{ alignSelf: "center", background: "rgba(33,150,243,0.1)", border: "1px solid rgba(33,150,243,0.2)", borderRadius: "50px", padding: "0.3rem 1rem", fontSize: "0.75rem", color: "var(--vn-muted)", margin: "0.3rem 0" }}>
                {msg.text}
              </div>
            )}

            {/* Normal bubble */}
            {msg.author !== "Система" && (
              <button
                onContextMenu={(e) => { e.preventDefault(); setMsgMenu(msg); }}
                style={{ background: "none", border: "none", padding: 0, cursor: "context-menu", textAlign: msg.mine ? "right" : "left" }}
              >
                {msg.type === "text" && (
                  <div className={msg.mine ? "vn-msg-mine" : "vn-msg-other"}>
                    {msg.text}
                    <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)", marginTop: 2, textAlign: "right" }}>{msg.time}</div>
                  </div>
                )}
                {msg.type === "image" && (
                  <div style={{ width: 180, height: 140, borderRadius: "1rem", background: "linear-gradient(135deg,rgba(21,101,192,0.4),rgba(33,150,243,0.3))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, border: "1px solid rgba(33,150,243,0.3)", padding: "0.5rem" }}>
                    <Icon name="Image" size={32} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160, whiteSpace: "nowrap" }}>{msg.fileName}</span>
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>{msg.time}</span>
                  </div>
                )}
                {msg.type === "video" && (
                  <div style={{ width: 180, height: 120, borderRadius: "1rem", background: "linear-gradient(135deg,rgba(21,101,192,0.5),rgba(11,61,132,0.5))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, border: "1px solid rgba(33,150,243,0.3)" }}>
                    <Icon name="Video" size={32} color="rgba(255,255,255,0.6)" />
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)" }}>{msg.fileName}</span>
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>{msg.time}</span>
                  </div>
                )}
                {(msg.type === "voice" || msg.type === "circle") && (
                  <div className={msg.mine ? "vn-msg-mine" : "vn-msg-other"} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: msg.type === "circle" ? "rgba(33,150,243,0.3)" : "rgba(231,76,60,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={msg.type === "circle" ? "Video" : "Mic"} size={14} color={msg.type === "circle" ? "var(--vn-blue-bright)" : "#E74C3C"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--vn-muted)", marginBottom: 2 }}>{msg.type === "circle" ? "Видеокружок" : "Голосовое"}</div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{msg.duration}</div>
                    </div>
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>{msg.time}</span>
                  </div>
                )}
                {msg.type === "audio" && (
                  <div className={msg.mine ? "vn-msg-mine" : "vn-msg-other"} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="Music" size={16} color="var(--vn-blue-bright)" />
                    <span style={{ fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120, whiteSpace: "nowrap" }}>{msg.fileName}</span>
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>{msg.time}</span>
                  </div>
                )}
                {msg.type === "document" && (
                  <div className={msg.mine ? "vn-msg-mine" : "vn-msg-other"} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="FileText" size={18} color="var(--vn-blue-bright)" />
                    <span style={{ fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120, whiteSpace: "nowrap" }}>{msg.fileName}</span>
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", marginLeft: "auto" }}>{msg.time}</span>
                  </div>
                )}

                {/* Reactions */}
                {msg.reactions.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 3, justifyContent: msg.mine ? "flex-end" : "flex-start" }}>
                    {msg.reactions.filter((r) => r.count > 0).map((r) => (
                      <button key={r.emoji} onClick={() => toggleReaction(msg.id, r.emoji)}
                        style={{ display: "flex", alignItems: "center", gap: 2, background: r.mine ? "rgba(33,150,243,0.2)" : "var(--vn-card2)", border: `1px solid ${r.mine ? "rgba(33,150,243,0.4)" : "var(--vn-border)"}`, borderRadius: "50px", padding: "0.15rem 0.45rem", cursor: "pointer", fontSize: "0.75rem" }}>
                        {r.emoji}
                        {r.count > 1 && <span style={{ fontSize: "0.68rem", color: "var(--vn-muted)" }}>{r.count}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </button>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Recording overlay */}
      {isRecording && (
        <div style={{ padding: "0.85rem 1.2rem", borderTop: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12, background: "var(--vn-card)", animation: "vn-appear 0.15s ease" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: recordCancelled ? "var(--vn-muted)" : circleMode ? "var(--vn-blue-bright)" : "#E74C3C", animation: recordCancelled ? "none" : "vn-pulse 1s infinite", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            {recordCancelled
              ? <span style={{ color: "var(--vn-muted)", fontSize: "0.85rem" }}>Отпусти — отменится</span>
              : <span style={{ fontSize: "0.88rem" }}>{circleMode ? "🎥 Видеокружок" : "🎙 Запись"} {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}</span>
            }
          </div>
          <span style={{ fontSize: "0.73rem", color: "var(--vn-muted)" }}>← свайп для отмены</span>
        </div>
      )}

      {/* Emoji panel */}
      {showEmoji && (
        <div style={{ background: "var(--vn-card)", borderTop: "1px solid var(--vn-border)", height: 220, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 4, padding: "0.5rem 0.75rem 0.25rem", borderBottom: "1px solid var(--vn-border)" }}>
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => setEmojiTab(i)} style={{ background: emojiTab === i ? "rgba(33,150,243,0.15)" : "none", border: "none", borderRadius: "0.5rem", padding: "0.3rem 0.6rem", cursor: "pointer", fontSize: "1.1rem" }}>
                {cat.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.75rem", display: "flex", flexWrap: "wrap", gap: 2 }} className="scrollbar-hide">
            {EMOJI_CATEGORIES[emojiTab].emojis.map((em) => (
              <button key={em} onClick={() => { setInput((p) => p + em); inputRef.current?.focus(); }}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", padding: "0.2rem", borderRadius: "0.4rem" }}>
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attach menu */}
      {attachOpen && (
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--vn-border)", background: "var(--vn-card)", animation: "vn-appear 0.2s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
            {[
              { icon: "Image", label: "Фото", color: "#2196F3", action: () => photoInputRef.current?.click() },
              { icon: "Video", label: "Видео", color: "#1565C0", action: () => videoInputRef.current?.click() },
              { icon: "Music", label: "Аудио", color: "#42A5F5", action: () => audioInputRef.current?.click() },
              { icon: "FileText", label: "Документ", color: "#29B6F6", action: () => docInputRef.current?.click() },
              { icon: "MapPin", label: "Геолокация", color: "#2ECC71", action: () => { setAttachOpen(false); if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((p) => pushMsg({ text: `📍 ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`, type: "text" }), () => pushMsg({ text: "📍 43.31700, 45.69890 (примерно)", type: "text" })); } else { pushMsg({ text: "📍 43.31700, 45.69890 (примерно)", type: "text" }); } } },
              { icon: "Users", label: "Участники", color: "#FF9800", action: () => { setAttachOpen(false); setShowMembers(true); } },
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

      {/* Input bar */}
      <div style={{ padding: "0.65rem 0.8rem", borderTop: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: "0.45rem", background: "var(--vn-card)", flexShrink: 0 }}>
        <button onClick={() => { setAttachOpen(!attachOpen); setShowEmoji(false); }}
          style={{ background: attachOpen ? "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))" : "rgba(33,150,243,0.1)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.2s", transform: attachOpen ? "rotate(45deg)" : "rotate(0deg)" }}>
          <Icon name="Plus" size={18} color={attachOpen ? "white" : "var(--vn-blue-bright)"} />
        </button>
        <button onClick={() => { setShowEmoji(!showEmoji); setAttachOpen(false); }}
          style={{ background: showEmoji ? "rgba(33,150,243,0.2)" : "none", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: "1.2rem", transition: "all 0.2s" }}>
          😊
        </button>
        <input
          ref={inputRef}
          className="vn-input"
          placeholder="Сообщение группе..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          style={{ flex: 1, minWidth: 0, padding: "0.6rem 0.9rem" }}
        />
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
            onPointerCancel={() => { if (recordTimerRef.current) clearInterval(recordTimerRef.current); if (holdTimerRef.current) clearTimeout(holdTimerRef.current); setIsRecording(false); setRecordSeconds(0); setRecordCancelled(false); }}
            style={{
              background: isRecording ? (recordCancelled ? "rgba(150,150,150,0.15)" : circleMode ? "rgba(33,150,243,0.2)" : "rgba(231,76,60,0.15)") : circleMode ? "rgba(33,150,243,0.2)" : "rgba(33,150,243,0.1)",
              border: `2px solid ${isRecording ? (recordCancelled ? "rgba(150,150,150,0.3)" : circleMode ? "rgba(33,150,243,0.5)" : "rgba(231,76,60,0.45)") : circleMode ? "rgba(33,150,243,0.5)" : "transparent"}`,
              borderRadius: "50%", width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, touchAction: "none", userSelect: "none", transition: "all 0.15s",
            }}>
            <Icon name={(isRecording && circleMode) || (!isRecording && circleMode) ? "Video" : "Mic"} size={16} color={isRecording ? (recordCancelled ? "var(--vn-muted)" : circleMode ? "var(--vn-blue-bright)" : "#E74C3C") : "var(--vn-blue-bright)"} />
          </button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e, "image")} />
      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => handleFile(e, "video")} />
      <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => handleFile(e, "audio")} />
      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.zip" style={{ display: "none" }} onChange={(e) => handleFile(e, "document")} />

      {/* Message long-press menu */}
      {msgMenu && (
        <div onClick={() => setMsgMenu(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 60, display: "flex", alignItems: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--vn-card)", borderRadius: "1.5rem 1.5rem 0 0", padding: "1rem 1rem 1.5rem", width: "100%", animation: "vn-appear 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "1rem", padding: "0.5rem 0", borderBottom: "1px solid var(--vn-border)" }}>
              {REACTIONS_QUICK.map((em) => (
                <button key={em} onClick={() => toggleReaction(msgMenu.id, em)}
                  style={{ fontSize: "1.6rem", background: "none", border: "none", cursor: "pointer", padding: "0.2rem" }}>
                  {em}
                </button>
              ))}
            </div>
            <button onClick={() => setMsgMenu(null)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", padding: "0.75rem 0.5rem", cursor: "pointer", color: "var(--vn-muted)", fontSize: "0.9rem" }}>
              <Icon name="X" size={16} color="var(--vn-muted)" /> Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
