import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  type: "audio" | "video";
  name: string;
  avatar: string;
  onEnd: () => void;
  incoming?: boolean; // входящий звонок
}

export default function CallScreen({ type, name, avatar, onEnd, incoming = false }: Props) {
  const [status, setStatus] = useState<"incoming" | "calling" | "connected">(
    incoming ? "incoming" : "calling"
  );
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(type === "video");
  const [camOff, setCamOff] = useState(false);
  const [frontCam, setFrontCam] = useState(true);

  // Auto-connect simulation for outgoing
  useEffect(() => {
    if (status !== "calling") return;
    const t = setTimeout(() => setStatus("connected"), 2500);
    return () => clearTimeout(t);
  }, [status]);

  // Timer when connected
  useEffect(() => {
    if (status !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const accept = () => setStatus("calling");

  const CtrlBtn = ({
    icon, label, active, danger, large, action,
  }: { icon: string; label: string; active?: boolean; danger?: boolean; large?: boolean; action: () => void }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <button
        onClick={action}
        style={{
          width: large ? 68 : 58,
          height: large ? 68 : 58,
          borderRadius: "50%",
          background: danger
            ? "linear-gradient(135deg,#C0392B,#E74C3C)"
            : active === false
              ? "rgba(255,255,255,0.1)"
              : "rgba(33,150,243,0.18)",
          border: `1px solid ${danger ? "transparent" : active === false ? "rgba(255,255,255,0.12)" : "rgba(33,150,243,0.35)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: danger ? "0 8px 28px rgba(231,76,60,0.5)" : "none",
        }}
        onMouseEnter={(e) => { (e.currentTarget.style.transform = "scale(1.08)"); }}
        onMouseLeave={(e) => { (e.currentTarget.style.transform = "scale(1)"); }}
      >
        <Icon
          name={icon}
          size={large ? 26 : 22}
          color={danger ? "white" : active === false ? "var(--vn-muted)" : "var(--vn-blue-bright)"}
        />
      </button>
      <span style={{ fontSize: "0.62rem", color: "var(--vn-muted)", textAlign: "center", maxWidth: 60 }}>{label}</span>
    </div>
  );

  // ── INCOMING ──────────────────────────────────────────────────────────────
  if (status === "incoming") {
    return (
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 200,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between",
          padding: "4rem 2rem 4rem",
          background: "linear-gradient(180deg,#030810 0%,#071020 60%,#030810 100%)",
          animation: "vn-scale-in 0.3s ease",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--vn-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "2rem" }}>
            Входящий {type === "video" ? "видео" : "аудио"}звонок
          </div>

          {/* Animated rings */}
          <div style={{ position: "relative", display: "inline-flex", marginBottom: "1.5rem" }}>
            <div style={{ position: "absolute", inset: -30, borderRadius: "50%", border: "2px solid rgba(33,150,243,0.2)", animation: "vn-ripple 2s infinite" }} />
            <div style={{ position: "absolute", inset: -15, borderRadius: "50%", border: "2px solid rgba(33,150,243,0.3)", animation: "vn-ripple 2s 0.7s infinite" }} />
            <div style={{
              width: 110, height: 110, borderRadius: "50%",
              background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: "2.8rem", color: "white",
              border: "3px solid rgba(33,150,243,0.4)",
              boxShadow: "0 0 50px rgba(33,150,243,0.45)",
              position: "relative", zIndex: 1,
            }}>
              {avatar}
            </div>
          </div>

          <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.9rem", color: "white", marginBottom: "0.4rem" }}>{name}</h2>
          <p style={{ color: "var(--vn-muted)", fontSize: "0.9rem" }}>Звонит вам…</p>
        </div>

        {/* Accept / Decline */}
        <div style={{ display: "flex", justifyContent: "space-around", width: "100%", maxWidth: 280 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <button
              onClick={onEnd}
              style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#C0392B,#E74C3C)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 28px rgba(231,76,60,0.55)", transition: "all 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget.style.transform = "scale(1.1)"); }}
              onMouseLeave={(e) => { (e.currentTarget.style.transform = "scale(1)"); }}
            >
              <Icon name="PhoneOff" size={28} color="white" />
            </button>
            <span style={{ fontSize: "0.75rem", color: "var(--vn-muted)" }}>Отклонить</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <button
              onClick={accept}
              style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#27AE60,#2ECC71)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 28px rgba(46,204,113,0.55)", transition: "all 0.2s", animation: "vn-ring 1.5s ease infinite" }}
              onMouseEnter={(e) => { (e.currentTarget.style.transform = "scale(1.1)"); }}
              onMouseLeave={(e) => { (e.currentTarget.style.transform = "scale(1)"); }}
            >
              <Icon name="Phone" size={28} color="white" />
            </button>
            <span style={{ fontSize: "0.75rem", color: "#2ECC71", fontWeight: 600 }}>Ответить</span>
          </div>
        </div>
      </div>
    );
  }

  // ── CALLING / CONNECTED ───────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "absolute", inset: 0, zIndex: 200,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "space-between",
        padding: "3rem 1.5rem 3rem",
        background: type === "video"
          ? "linear-gradient(180deg,#020810 0%,#061020 60%,#020810 100%)"
          : "linear-gradient(180deg,#030A18 0%,#071022 60%,#030A18 100%)",
        animation: "vn-scale-in 0.3s ease",
      }}
    >
      {/* Top */}
      <div style={{ textAlign: "center", width: "100%" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--vn-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.8rem" }}>
          {type === "video" ? "Видеозвонок" : "Аудиозвонок"}
        </div>

        <div style={{ position: "relative", display: "inline-flex", marginBottom: "1.4rem" }}>
          {status === "calling" && (
            <>
              <div style={{ position: "absolute", inset: -30, borderRadius: "50%", border: "2px solid rgba(33,150,243,0.25)", animation: "vn-ripple 1.8s infinite" }} />
              <div style={{ position: "absolute", inset: -15, borderRadius: "50%", border: "2px solid rgba(33,150,243,0.15)", animation: "vn-ripple 1.8s 0.6s infinite" }} />
            </>
          )}
          {status === "connected" && (
            <div style={{ position: "absolute", inset: -8, borderRadius: "50%", animation: "vn-call-pulse 2s infinite" }} />
          )}
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "2.5rem", color: "white",
            border: "3px solid rgba(33,150,243,0.4)",
            boxShadow: "0 0 40px rgba(33,150,243,0.4)",
            position: "relative", zIndex: 1,
          }}>
            {avatar}
          </div>
        </div>

        <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.7rem", color: "white", marginBottom: "0.4rem" }}>{name}</h2>
        <p style={{ fontSize: "0.9rem", color: status === "connected" ? "#2ECC71" : "var(--vn-muted)", fontWeight: status === "connected" ? 600 : 400, transition: "color 0.3s" }}>
          {status === "calling" ? "Соединение..." : fmt(seconds)}
        </p>
      </div>

      {/* Video area */}
      {type === "video" && (
        <div style={{ width: "100%", position: "relative", borderRadius: "1rem", overflow: "hidden" }}>
          {/* Remote video (fake) */}
          <div style={{
            width: "100%", height: 170, borderRadius: "1rem",
            background: camOff
              ? "linear-gradient(135deg,#0A0A0A,#111)"
              : "linear-gradient(135deg,#061226,#0A1E3A)",
            border: "1px solid var(--vn-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {camOff
              ? <Icon name="VideoOff" size={36} color="var(--vn-muted)" />
              : <Icon name="Video" size={32} color="rgba(33,150,243,0.25)" />
            }
          </div>
          {/* My preview */}
          {!camOff && (
            <div style={{
              position: "absolute", bottom: 10, right: 10,
              width: 68, height: 90, borderRadius: "0.6rem",
              background: "linear-gradient(135deg,var(--vn-blue),var(--vn-blue-light))",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "1.1rem", color: "white",
              border: "2px solid rgba(255,255,255,0.2)",
            }}>
              Я
              <span style={{ fontSize: "0.55rem", opacity: 0.7, marginTop: 2 }}>{frontCam ? "фронт." : "осн."}</span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ width: "100%" }}>
        {/* Row 1 */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1.2rem" }}>
          <CtrlBtn icon={muted ? "MicOff" : "Mic"} label={muted ? "Включить" : "Микрофон"} active={!muted} action={() => setMuted(!muted)} />
          <CtrlBtn icon={speaker ? "Volume2" : "VolumeX"} label="Динамик" active={speaker} action={() => setSpeaker(!speaker)} />
          {type === "video" && (
            <CtrlBtn icon={camOff ? "VideoOff" : "Video"} label={camOff ? "Включить" : "Камера"} active={!camOff} action={() => setCamOff(!camOff)} />
          )}
          {type === "video" && (
            <CtrlBtn icon="RefreshCw" label={frontCam ? "На осн." : "На фронт."} active={true} action={() => setFrontCam(!frontCam)} />
          )}
        </div>

        {/* End call */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <CtrlBtn icon="PhoneOff" label="Завершить" danger large action={onEnd} />
        </div>
      </div>
    </div>
  );
}
