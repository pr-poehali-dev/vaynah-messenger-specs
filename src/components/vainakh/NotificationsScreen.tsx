import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { User } from "@/pages/Index";
import func2url from "@/api";

const AVATAR_COLORS = [
  "linear-gradient(135deg,#1565C0,#2196F3)",
  "linear-gradient(135deg,#1976D2,#42A5F5)",
  "linear-gradient(135deg,#0D47A1,#1976D2)",
  "linear-gradient(135deg,#1565C0,#29B6F6)",
  "linear-gradient(135deg,#0D47A1,#42A5F5)",
];

interface IncomingRequest {
  req_id: number;
  id: number;
  name: string;
  surname: string;
  city: string;
  email: string;
  avatar: string;
  time: string;
}

interface Props {
  user: User;
}

export default function NotificationsScreen({ user }: Props) {
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(() => {
    if (!user.email) return;
    fetch(`${func2url["social"]}?action=friends&email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setIncoming(data.incoming);
      })
      .finally(() => setLoading(false));
  }, [user.email]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const respond = async (req: IncomingRequest, accept: boolean) => {
    await fetch(`${func2url["social"]}?action=friend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_email: req.email,
        to_email: user.email,
        fr_action: accept ? "accept" : "decline",
      }),
    });
    setIncoming((prev) => prev.filter((r) => r.req_id !== req.req_id));
    showToast(accept ? `${req.name} добавлен в друзья` : "Заявка отклонена");
  };

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.2rem 0.8rem", borderBottom: "1px solid var(--vn-border)", background: "var(--vn-card)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem" }} className="vn-gradient-text">Уведомления</h1>
          {incoming.length > 0 && (
            <div style={{ background: "var(--vn-blue)", color: "white", borderRadius: "50px", padding: "2px 10px", fontSize: "0.78rem", fontWeight: 700 }}>
              {incoming.length}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--vn-muted)" }}>
            <Icon name="Loader" size={28} color="var(--vn-muted)" />
            <p style={{ marginTop: "0.8rem", fontSize: "0.9rem" }}>Загружаем...</p>
          </div>
        ) : incoming.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1.5rem", color: "var(--vn-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔔</div>
            <p style={{ fontWeight: 600, fontSize: "1rem" }}>Нет новых уведомлений</p>
            <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>Когда кто-то добавит тебя в друзья — увидишь здесь</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "0.6rem 1.2rem", fontSize: "0.75rem", color: "var(--vn-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Заявки в друзья
            </div>
            {incoming.map((req, i) => (
              <div key={req.req_id} style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.9rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.2rem", color: "white", flexShrink: 0 }}>
                  {req.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{req.name} {req.surname}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--vn-muted)", marginTop: 2 }}>{req.city} · {req.time}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: "0.6rem" }}>
                    <button
                      onClick={() => respond(req, true)}
                      style={{ flex: 1, padding: "0.45rem 0", background: "linear-gradient(135deg,#1565C0,#42A5F5)", border: "none", borderRadius: "0.5rem", color: "white", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
                    >
                      Принять
                    </button>
                    <button
                      onClick={() => respond(req, false)}
                      style={{ flex: 1, padding: "0.45rem 0", background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "0.5rem", color: "var(--vn-muted)", cursor: "pointer", fontSize: "0.82rem" }}
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "var(--vn-card)", border: "1px solid var(--vn-border)", borderRadius: "50px", padding: "0.5rem 1.2rem", fontSize: "0.85rem", zIndex: 300, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}