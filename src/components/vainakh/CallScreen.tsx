import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  type: "audio" | "video";
  name: string;
  avatar: string;
  onEnd: () => void;
}

export default function CallScreen({ type, name, avatar, onEnd }: Props) {
  const [status, setStatus] = useState<"calling" | "connected">("calling");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [camOff, setCamOff] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStatus("connected"), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (status !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "3rem 2rem 3.5rem",
        background: type === "video"
          ? "linear-gradient(180deg, #040A14 0%, #0A1628 60%, #080E1A 100%)"
          : "linear-gradient(180deg, #040A14 0%, #061022 60%, #080E1A 100%)",
        animation: "vn-scale-in 0.3s ease",
      }}
    >
      {/* Top info */}
      <div style={{ textAlign: "center", width: "100%" }}>
        <div style={{ fontSize: "0.8rem", color: "var(--vn-muted)", marginBottom: "2rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {type === "video" ? "Видеозвонок" : "Аудиозвонок"}
        </div>

        {/* Avatar with rings */}
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
          {status === "calling" && (
            <>
              <div style={{ position: "absolute", width: 140, height: 140, borderRadius: "50%", border: "2px solid rgba(33,150,243,0.3)", animation: "vn-ripple 1.8s infinite" }} />
              <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", border: "2px solid rgba(33,150,243,0.15)", animation: "vn-ripple 1.8s 0.6s infinite" }} />
            </>
          )}
          {status === "connected" && (
            <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", animation: "vn-call-pulse 2s infinite" }} />
          )}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--vn-blue) 0%, var(--vn-blue-light) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "2.5rem",
              color: "white",
              border: "3px solid rgba(33,150,243,0.4)",
              boxShadow: "0 0 40px rgba(33,150,243,0.4)",
              position: "relative",
              zIndex: 1,
            }}
          >
            {avatar}
          </div>
        </div>

        <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.7rem", color: "white", marginBottom: "0.4rem" }}>
          {name}
        </h2>
        <p
          style={{
            fontSize: "0.9rem",
            color: status === "connected" ? "#2ECC71" : "var(--vn-muted)",
            fontWeight: status === "connected" ? 600 : 400,
            transition: "color 0.3s",
          }}
        >
          {status === "calling" ? "Вызов..." : fmt(seconds)}
        </p>
      </div>

      {/* Video preview (fake) */}
      {type === "video" && !camOff && (
        <div
          style={{
            width: "100%",
            height: 180,
            borderRadius: "1rem",
            background: "linear-gradient(135deg, #0D1626 0%, #111E30 100%)",
            border: "1px solid var(--vn-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Icon name="Video" size={36} color="var(--vn-border)" />
          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              width: 70,
              height: 90,
              borderRadius: "0.6rem",
              background: "linear-gradient(135deg, var(--vn-blue) 0%, var(--vn-blue-light) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "1.2rem",
              color: "white",
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          >
            Я
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "1.2rem", marginBottom: "1.5rem" }}>
          {[
            { icon: muted ? "MicOff" : "Mic", label: muted ? "Вкл.микр." : "Микрофон", active: !muted, action: () => setMuted(!muted) },
            { icon: speaker ? "Volume2" : "VolumeX", label: "Динамик", active: speaker, action: () => setSpeaker(!speaker) },
            ...(type === "video" ? [{ icon: camOff ? "VideoOff" : "Video", label: camOff ? "Вкл.кам." : "Камера", active: !camOff, action: () => setCamOff(!camOff) }] : []),
          ].map((btn) => (
            <div key={btn.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <button
                onClick={btn.action}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: btn.active ? "rgba(33,150,243,0.15)" : "rgba(255,255,255,0.08)",
                  border: `1px solid ${btn.active ? "rgba(33,150,243,0.4)" : "rgba(255,255,255,0.1)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <Icon name={btn.icon} size={22} color={btn.active ? "var(--vn-blue-bright)" : "var(--vn-muted)"} />
              </button>
              <span style={{ fontSize: "0.65rem", color: "var(--vn-muted)" }}>{btn.label}</span>
            </div>
          ))}
        </div>

        {/* End call */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <button
              onClick={onEnd}
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 8px 28px rgba(231,76,60,0.5)",
                transition: "all 0.2s",
                animation: status === "calling" ? "vn-ring 2s ease infinite" : "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Icon name="PhoneOff" size={26} color="white" />
            </button>
            <span style={{ fontSize: "0.7rem", color: "var(--vn-muted)" }}>Завершить</span>
          </div>
        </div>
      </div>
    </div>
  );
}
