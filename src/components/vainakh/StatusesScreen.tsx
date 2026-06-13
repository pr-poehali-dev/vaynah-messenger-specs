import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";
import func2url from "@/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StatusSlide {
  id: number;
  type: "photo" | "text" | "video" | "audio";
  content: string;
  file_url?: string;
  color?: string;
  emoji?: string;
  time: string;
  view_count: number;
}

interface UserStory {
  user_id: number;
  user_name: string;
  user_surname: string;
  avatar: string;
  avatar_url?: string;
  is_mine: boolean;
  slides: StatusSlide[];
  viewed: boolean;
}

interface Viewer { id: number; name: string; surname: string; avatar: string; avatar_url?: string; time: string; }

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
const avatarColors = [
  "linear-gradient(135deg,#1565C0,#2196F3)",
  "linear-gradient(135deg,#1976D2,#42A5F5)",
  "linear-gradient(135deg,#0D47A1,#1976D2)",
  "linear-gradient(135deg,#1565C0,#29B6F6)",
];
const REACTIONS = ["❤️", "😂", "👍", "😮", "🔥", "🙏", "😍", "👏"];

interface Props { user: User; }

export default function StatusesScreen({ user }: Props) {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  // Viewer state
  const [activeStory, setActiveStory] = useState<UserStory | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  // Create state
  const [showCreate, setShowCreate] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [newText, setNewText] = useState("");
  const [newColor, setNewColor] = useState(STATUS_COLORS[0]);
  const [newEmoji, setNewEmoji] = useState("");
  const [newType, setNewType] = useState<"text" | "photo" | "video" | "audio">("text");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SLIDE_DURATION = 5000;

  // ─── Load ──────────────────────────────────────────────────────────────────

  const loadStatuses = useCallback((): Promise<void> => {
    return fetch(`${func2url["social"]}?action=statuses&email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) return;
        // Группируем по user_id
        const map = new Map<number, UserStory>();
        for (const s of data.statuses) {
          if (!map.has(s.user_id)) {
            map.set(s.user_id, {
              user_id: s.user_id,
              user_name: s.user_name,
              user_surname: s.user_surname,
              avatar: s.avatar,
              avatar_url: s.avatar_url || "",
              is_mine: s.is_mine,
              slides: [],
              viewed: false,
            });
          }
          const story = map.get(s.user_id)!;
          story.slides.push({
            id: s.id,
            type: s.type,
            content: s.content,
            file_url: s.file_url || "",
            color: s.color || "",
            emoji: s.emoji || "",
            time: s.time,
            view_count: s.view_count || 0,
          });
        }
        // Мои статусы — первыми
        const arr = [...map.values()].sort((a, b) =>
          a.is_mine ? -1 : b.is_mine ? 1 : 0
        );
        setStories(arr);
      })
      .finally(() => setLoading(false));
  }, [user.email]);

  useEffect(() => {
    loadStatuses();
    const t = setInterval(loadStatuses, 10000);
    return () => clearInterval(t);
  }, [loadStatuses]);

  // ─── Slide timer ───────────────────────────────────────────────────────────

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = useCallback((story: UserStory, idx: number) => {
    clearTimer();
    setProgress(0);
    const step = 100 / (SLIDE_DURATION / 50);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += step;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearTimer();
        const next = idx + 1;
        if (next < story.slides.length) {
          setSlideIdx(next);
        } else {
          setActiveStory(null);
        }
      }
    }, 50);
  }, []);

  useEffect(() => {
    if (activeStory && !paused && !showReactions && !showViewers && !showMenu) {
      startTimer(activeStory, slideIdx);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [activeStory, slideIdx, paused, showReactions, showViewers, showMenu, startTimer]);

  // ─── Open story ────────────────────────────────────────────────────────────

  const openStory = (story: UserStory) => {
    setActiveStory(story);
    setSlideIdx(0);
    setShowReactions(false);
    setShowViewers(false);
    setShowMenu(false);
    setPaused(false);
    // Отмечаем просмотр первого слайда
    markViewed(story.slides[0].id);
    setStories((prev) =>
      prev.map((s) => s.user_id === story.user_id ? { ...s, viewed: true } : s)
    );
  };

  const markViewed = (statusId: number) => {
    fetch(`${func2url["social"]}?action=view-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, status_id: statusId }),
    });
  };

  const goSlide = (idx: number) => {
    if (!activeStory) return;
    if (idx < 0) {
      setActiveStory(null);
      return;
    }
    if (idx >= activeStory.slides.length) {
      setActiveStory(null);
      return;
    }
    setSlideIdx(idx);
    markViewed(activeStory.slides[idx].id);
  };

  // ─── Delete ────────────────────────────────────────────────────────────────

  const deleteSlide = async (slideId: number) => {
    await fetch(`${func2url["social"]}?action=delete-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, status_id: slideId }),
    });
    setShowMenu(false);
    setActiveStory(null);
    loadStatuses();
  };

  // ─── Viewers ───────────────────────────────────────────────────────────────

  const loadViewers = async (slideId: number) => {
    const res = await fetch(
      `${func2url["social"]}?action=status-views&status_id=${slideId}&email=${encodeURIComponent(user.email)}`
    );
    const data = await res.json();
    if (data.ok) setViewers(data.viewers);
    setShowViewers(true);
  };

  // ─── Publish ───────────────────────────────────────────────────────────────

  const toBase64 = (f: File): Promise<string> =>
    new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(f);
    });

  const publish = async () => {
    if (posting) return;
    const hasMedia = pendingFiles.length > 0;
    const hasText = newText.trim().length > 0;
    if (!hasMedia && !hasText) return;
    setPosting(true);

    try {
      if (hasMedia) {
        // Загружаем каждый файл отдельным статусом
        for (const file of pendingFiles) {
          const base64 = await toBase64(file);
          const stype = file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "photo";
          await fetch(`${func2url["social"]}?action=upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              upload_type: "status",
              email: user.email,
              file: base64,
              mime: file.type,
              status_type: stype,
              content: newText || file.name,
              emoji: newEmoji || null,
            }),
          });
        }
      } else {
        await fetch(`${func2url["social"]}?action=status-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, content: newText, color: newColor, emoji: newEmoji || null }),
        });
      }
      await loadStatuses();
      setShowCreate(false);
      setPendingFiles([]);
      setNewText("");
      setNewColor(STATUS_COLORS[0]);
      setNewEmoji("");
      setNewType("text");
    } finally {
      setPosting(false);
    }
  };

  // ─── Touch / click для перелистывания ──────────────────────────────────────

  const touchStartX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) goSlide(slideIdx + 1);
      else goSlide(slideIdx - 1);
    }
  };
  const onClickSide = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showReactions || showViewers || showMenu) return;
    const w = (e.currentTarget as HTMLDivElement).offsetWidth;
    if (e.clientX < w / 3) goSlide(slideIdx - 1);
    else goSlide(slideIdx + 1);
  };

  // ─── Viewer UI ─────────────────────────────────────────────────────────────

  if (activeStory) {
    const slide = activeStory.slides[slideIdx];
    const bgMap: Record<string, string> = {
      text: slide.color || STATUS_COLORS[0],
      photo: "linear-gradient(180deg,#040A14,#0A1628)",
      video: "linear-gradient(180deg,#040A14,#0A1628)",
      audio: "linear-gradient(180deg,#060E1E,#0D1A2E)",
    };

    return (
      <div
        style={{ height: "100%", display: "flex", flexDirection: "column", background: bgMap[slide.type], position: "relative", userSelect: "none" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Progress bars */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "0.5rem 0.5rem 0", zIndex: 20, display: "flex", gap: 4 }}>
          {activeStory.slides.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.3)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                borderRadius: 2,
                background: "white",
                width: i < slideIdx ? "100%" : i === slideIdx ? `${progress}%` : "0%",
                transition: i === slideIdx ? "none" : undefined,
              }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ position: "absolute", top: 12, left: 0, right: 0, padding: "0 0.8rem", zIndex: 20, display: "flex", alignItems: "center", gap: 10 }}>
          {/* Avatar */}
          <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.4)", flexShrink: 0 }}>
            {activeStory.avatar_url
              ? <img src={activeStory.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: avatarColors[activeStory.user_id % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1rem" }}>{activeStory.avatar}</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              {activeStory.user_name} {activeStory.user_surname}
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.65)" }}>{slide.time}</div>
          </div>

          {/* Pause/play */}
          <button
            onPointerDown={(e) => { e.stopPropagation(); setPaused(true); }}
            onPointerUp={(e) => { e.stopPropagation(); setPaused(false); }}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <Icon name={paused ? "Play" : "Pause"} size={14} color="white" />
          </button>

          {/* 3 точки */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(true); setPaused(true); }}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <Icon name="MoreVertical" size={16} color="white" />
          </button>

          {/* Закрыть */}
          <button
            onClick={(e) => { e.stopPropagation(); setActiveStory(null); }}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <Icon name="X" size={16} color="white" />
          </button>
        </div>

        {/* Click zones (левая / правая половина) */}
        <div onClick={onClickSide} style={{ position: "absolute", inset: 0, zIndex: 5 }} />

        {/* Content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 1.5rem 5rem", pointerEvents: "none" }}>
          {slide.type === "text" && (
            <div style={{ textAlign: "center" }}>
              {slide.emoji && <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>{slide.emoji}</div>}
              <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "white", lineHeight: 1.35, textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}>{slide.content}</p>
            </div>
          )}
          {slide.type === "photo" && (
            <div style={{ width: "100%", maxHeight: "75vh", borderRadius: "1rem", overflow: "hidden" }}>
              {slide.file_url
                ? <img src={slide.file_url} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <div style={{ height: 300, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="Image" size={60} color="rgba(255,255,255,0.3)" /></div>
              }
              {slide.content && slide.content !== slide.file_url && (
                <p style={{ color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: "0.75rem", fontSize: "0.95rem", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{slide.content}</p>
              )}
            </div>
          )}
          {slide.type === "video" && (
            <div style={{ width: "100%", borderRadius: "1rem", overflow: "hidden" }}>
              {slide.file_url
                ? <video src={slide.file_url} autoPlay playsInline controls style={{ width: "100%", maxHeight: "70vh", objectFit: "contain" }} />
                : <div style={{ height: 300, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="Video" size={60} color="rgba(255,255,255,0.3)" /></div>
              }
            </div>
          )}
          {slide.type === "audio" && (
            <div style={{ textAlign: "center", width: "100%" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(33,150,243,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <Icon name="Music" size={36} color="white" />
              </div>
              {slide.file_url && <audio src={slide.file_url} controls style={{ width: "80%" }} />}
              <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "1rem" }}>{slide.content}</p>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0.75rem 1rem 1.2rem", zIndex: 20, display: "flex", alignItems: "center", gap: 10 }}>
          {/* Кто смотрел (только для своих) */}
          {activeStory.is_mine && (
            <button
              onClick={(e) => { e.stopPropagation(); loadViewers(slide.id); setPaused(true); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50px", padding: "0.4rem 0.9rem", cursor: "pointer" }}
            >
              <Icon name="Eye" size={15} color="rgba(255,255,255,0.8)" />
              <span style={{ color: "white", fontSize: "0.82rem", fontWeight: 600 }}>{slide.view_count}</span>
            </button>
          )}

          {/* Реакция */}
          {!activeStory.is_mine && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowReactions((v) => !v); setPaused(true); }}
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50px", padding: "0.4rem 0.9rem", cursor: "pointer", fontSize: "1.1rem" }}
            >
              😊
            </button>
          )}
        </div>

        {/* Reaction picker */}
        {showReactions && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", bottom: 70, left: "50%", transform: "translateX(-50%)", zIndex: 30, background: "rgba(10,22,40,0.92)", borderRadius: "2rem", padding: "0.75rem 1rem", display: "flex", gap: 10, backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {REACTIONS.map((em) => (
              <button key={em} onClick={() => { setShowReactions(false); setPaused(false); }}
                style={{ fontSize: "1.6rem", background: "none", border: "none", cursor: "pointer", transition: "transform 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >{em}</button>
            ))}
          </div>
        )}

        {/* Menu (3 точки) */}
        {showMenu && (
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}>
            <div style={{ background: "var(--vn-card)", borderRadius: "1.5rem 1.5rem 0 0", width: "100%", padding: "1.2rem 1.2rem 2rem", animation: "vn-appear 0.2s ease" }}>
              <div style={{ width: 36, height: 4, background: "var(--vn-border)", borderRadius: 2, margin: "0 auto 1.2rem" }} />
              {activeStory.is_mine && (
                <button
                  onClick={() => deleteSlide(slide.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "0.9rem 0.5rem", background: "none", border: "none", cursor: "pointer", color: "#E74C3C", fontSize: "0.95rem", fontWeight: 600 }}
                >
                  <Icon name="Trash2" size={20} color="#E74C3C" />
                  Удалить статус
                </button>
              )}
              <button
                onClick={() => { setShowMenu(false); setPaused(false); }}
                style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "0.9rem 0.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--vn-muted)", fontSize: "0.95rem" }}
              >
                <Icon name="X" size={20} color="var(--vn-muted)" />
                Закрыть
              </button>
            </div>
          </div>
        )}

        {/* Viewers sheet */}
        {showViewers && (
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}>
            <div style={{ background: "var(--vn-card)", borderRadius: "1.5rem 1.5rem 0 0", width: "100%", maxHeight: "70%", display: "flex", flexDirection: "column", animation: "vn-appear 0.2s ease" }}>
              <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
                <Icon name="Eye" size={20} color="var(--vn-blue-bright)" />
                <h3 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.05rem", flex: 1 }}>Просмотры · {viewers.length}</h3>
                <button onClick={() => { setShowViewers(false); setPaused(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-muted)" }}>
                  <Icon name="X" size={20} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
                {viewers.length === 0 ? (
                  <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--vn-muted)" }}>
                    <Icon name="Eye" size={36} color="var(--vn-border)" />
                    <p style={{ marginTop: "0.8rem" }}>Никто ещё не смотрел</p>
                  </div>
                ) : viewers.map((v, i) => (
                  <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.8rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: avatarColors[i % avatarColors.length] }}>
                      {v.avatar_url
                        ? <img src={v.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>{v.avatar}</div>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{v.name} {v.surname}</div>
                      <div style={{ fontSize: "0.74rem", color: "var(--vn-muted)" }}>{v.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Create UI ─────────────────────────────────────────────────────────────

  if (showCreate) {
    const canPublish = pendingFiles.length > 0 || newText.trim().length > 0;

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
            disabled={!canPublish || posting}
            style={{ width: "auto", padding: "0.45rem 1.1rem", fontSize: "0.85rem", opacity: canPublish && !posting ? 1 : 0.5 }}
          >
            {posting ? "Загрузка..." : "Опубликовать"}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem" }} className="scrollbar-hide">
          {/* Тип */}
          <div style={{ display: "flex", gap: 8, marginBottom: "1rem", overflowX: "auto" }} className="scrollbar-hide">
            {(["text", "photo", "video", "audio"] as const).map((t) => {
              const icons = { text: "Type", photo: "Camera", video: "Video", audio: "Music" };
              const labels = { text: "Текст", photo: "Фото", video: "Видео", audio: "Аудио" };
              return (
                <button key={t} onClick={() => { setNewType(t); setPendingFiles([]); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: newType === t ? "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))" : "var(--vn-card2)", border: `1px solid ${newType === t ? "transparent" : "var(--vn-border)"}`, borderRadius: "0.75rem", padding: "0.65rem 1rem", cursor: "pointer", minWidth: 60, boxShadow: newType === t ? "0 4px 14px rgba(33,150,243,0.35)" : "none" }}>
                  <Icon name={icons[t]} size={18} color={newType === t ? "white" : "var(--vn-muted)"} />
                  <span style={{ fontSize: "0.7rem", color: newType === t ? "white" : "var(--vn-muted)", fontWeight: newType === t ? 600 : 400 }}>{labels[t]}</span>
                </button>
              );
            })}
          </div>

          {/* Hidden inputs */}
          <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
            onChange={(e) => { const files = Array.from(e.target.files || []); setPendingFiles((p) => [...p, ...files]); e.target.value = ""; }} />
          <input ref={videoInputRef} type="file" accept="video/*" multiple style={{ display: "none" }}
            onChange={(e) => { const files = Array.from(e.target.files || []); setPendingFiles((p) => [...p, ...files]); e.target.value = ""; }} />
          <input ref={audioInputRef} type="file" accept="audio/*" multiple style={{ display: "none" }}
            onChange={(e) => { const files = Array.from(e.target.files || []); setPendingFiles((p) => [...p, ...files]); e.target.value = ""; }} />

          {/* Медиа пикер */}
          {newType !== "text" && (
            <div style={{ marginBottom: "1rem" }}>
              {pendingFiles.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pendingFiles.map((file, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: "0.75rem", overflow: "hidden", background: "var(--vn-card2)", border: "1px solid var(--vn-border)" }}>
                      {file.type.startsWith("image") && (
                        <img src={URL.createObjectURL(file)} style={{ width: "100%", height: 200, objectFit: "cover" }} />
                      )}
                      {file.type.startsWith("video") && (
                        <video src={URL.createObjectURL(file)} controls style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />
                      )}
                      {file.type.startsWith("audio") && (
                        <div style={{ padding: "1rem", display: "flex", alignItems: "center", gap: 12 }}>
                          <Icon name="Music" size={24} color="var(--vn-blue-bright)" />
                          <audio src={URL.createObjectURL(file)} controls style={{ flex: 1 }} />
                        </div>
                      )}
                      <button onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}
                        style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Icon name="X" size={14} color="white" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => { if (newType === "photo") photoInputRef.current?.click(); else if (newType === "video") videoInputRef.current?.click(); else audioInputRef.current?.click(); }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.75rem", border: "2px dashed var(--vn-border)", borderRadius: "0.75rem", background: "var(--vn-card2)", color: "var(--vn-blue-bright)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                    <Icon name="Plus" size={18} color="var(--vn-blue-bright)" />
                    Добавить ещё
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { if (newType === "photo") photoInputRef.current?.click(); else if (newType === "video") videoInputRef.current?.click(); else audioInputRef.current?.click(); }}
                  style={{ width: "100%", height: 200, borderRadius: "1rem", border: "2px dashed var(--vn-border)", background: "var(--vn-card2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer" }}>
                  <Icon name={newType === "photo" ? "ImagePlus" : newType === "video" ? "Video" : "Music"} size={44} color="var(--vn-blue-bright)" />
                  <span style={{ color: "var(--vn-muted)", fontSize: "0.9rem" }}>Выбрать {newType === "photo" ? "фото" : newType === "video" ? "видео" : "аудио"} (можно несколько)</span>
                </button>
              )}
            </div>
          )}

          {/* Текст */}
          {newType === "text" && (
            <div style={{ borderRadius: "1rem", background: newColor, padding: "2rem 1.2rem", minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", marginBottom: "1rem" }}>
              {newEmoji && <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{newEmoji}</div>}
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "1.2rem", fontWeight: 700, textShadow: "0 2px 12px rgba(0,0,0,0.4)", wordBreak: "break-word" }}>
                {newText || "Текст статуса"}
              </span>
            </div>
          )}

          <textarea className="vn-input" placeholder={newType === "text" ? "Напиши что-нибудь..." : "Подпись (необязательно)..."} value={newText} onChange={(e) => setNewText(e.target.value)} rows={3} style={{ resize: "none", marginBottom: "1rem" }} />

          {/* Цвет (только текст) */}
          {newType === "text" && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Цвет фона</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATUS_COLORS.map((c) => (
                  <button key={c} onClick={() => setNewColor(c)} style={{ width: 38, height: 38, borderRadius: "50%", background: c, border: newColor === c ? "3px solid var(--vn-blue-bright)" : "2px solid var(--vn-border)", cursor: "pointer" }} />
                ))}
              </div>
            </div>
          )}

          {/* Эмодзи */}
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Смайлик</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["🔥", "❤️", "🌿", "😊", "💪", "🙏", "✨", "👑"].map((em) => (
                <button key={em} onClick={() => setNewEmoji(newEmoji === em ? "" : em)}
                  style={{ fontSize: "1.4rem", background: newEmoji === em ? "rgba(33,150,243,0.15)" : "var(--vn-card2)", border: `1px solid ${newEmoji === em ? "var(--vn-blue-light)" : "var(--vn-border)"}`, borderRadius: "0.5rem", width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── List UI ───────────────────────────────────────────────────────────────

  const myStory = stories.find((s) => s.is_mine);
  const othersStories = stories.filter((s) => !s.is_mine);

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "1.2rem 1.2rem 0.8rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center" }}>
        <h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem", flex: 1 }} className="vn-gradient-text">
          ВайНах Сторисы
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {/* Мой статус */}
        <div style={{ padding: "0.85rem 1.2rem", borderBottom: "1px solid var(--vn-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: myStory ? "3px solid var(--vn-blue-bright)" : "3px solid var(--vn-border)" }}>
                {user.avatar?.startsWith("http")
                  ? <img src={user.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.3rem", color: "white" }}>{(user.name || "Я")[0]}</div>
                }
              </div>
              <button onClick={() => setShowCreate(true)}
                style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))", border: "2px solid var(--vn-bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon name="Plus" size={11} color="white" />
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Мой статус</div>
              <div style={{ fontSize: "0.78rem", color: "var(--vn-muted)" }}>
                {myStory ? `${myStory.slides.length} слайд(ов) · нажми чтобы посмотреть` : "Нажми + чтобы добавить"}
              </div>
            </div>
            {myStory && (
              <button onClick={() => openStory(myStory)}
                style={{ background: "rgba(33,150,243,0.1)", border: "1px solid rgba(33,150,243,0.25)", borderRadius: "50px", padding: "0.35rem 0.8rem", cursor: "pointer", fontSize: "0.78rem", color: "var(--vn-blue-bright)", fontWeight: 600 }}>
                Смотреть
              </button>
            )}
          </div>
        </div>

        {/* Статусы других */}
        <div style={{ padding: "0.5rem 0" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--vn-muted)" }}>
              <Icon name="Loader" size={28} color="var(--vn-muted)" />
              <p style={{ marginTop: "0.8rem", fontSize: "0.9rem" }}>Загружаем статусы...</p>
            </div>
          ) : othersStories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--vn-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📸</div>
              <p style={{ fontWeight: 600 }}>Нет статусов</p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>Будь первым — добавь статус!</p>
            </div>
          ) : othersStories.map((story, i) => {
            const last = story.slides[story.slides.length - 1];
            return (
              <button key={story.user_id} onClick={() => openStory(story)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "0.8rem 1.2rem", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)", textAlign: "left", animation: `vn-appear 0.3s ease ${i * 0.05}s both` }}>
                <div style={{ width: 58, height: 58, borderRadius: "50%", padding: 2.5, background: story.viewed ? "var(--vn-border)" : "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light),var(--vn-blue-bright))", flexShrink: 0 }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--vn-bg)" }}>
                    {story.avatar_url
                      ? <img src={story.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: avatarColors[i % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "1.1rem" }}>{story.avatar}</div>
                    }
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: story.viewed ? "var(--vn-muted)" : "var(--vn-text)" }}>{story.user_name} {story.user_surname}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--vn-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <span>{last?.time}</span>
                    <span>·</span>
                    <Icon name={last?.type === "text" ? "Type" : last?.type === "photo" ? "Camera" : last?.type === "audio" ? "Music" : "Video"} size={11} />
                    {story.slides.length > 1 && <span>· {story.slides.length} слайдов</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}