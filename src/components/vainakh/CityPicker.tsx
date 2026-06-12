import { useState } from "react";
import Icon from "@/components/ui/icon";
import { CITY_GROUPS } from "./cities";

interface Props {
  value: string;
  onChange: (city: string) => void;
  onClose: () => void;
}

export default function CityPicker({ value, onChange, onClose }: Props) {
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const groups = CITY_GROUPS.map((g) => ({
    region: g.region,
    cities: g.cities.filter((c) => c.toLowerCase().includes(q)),
  })).filter((g) => g.cities.length > 0);

  return (
    <div
      onClick={onClose}
      style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 100, display: "flex", alignItems: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--vn-card)", borderRadius: "1.5rem 1.5rem 0 0", width: "100%", height: "80%", display: "flex", flexDirection: "column", animation: "vn-appear 0.25s cubic-bezier(0.34,1.56,0.64,1)", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ padding: "1rem 1.2rem 0.75rem", borderBottom: "1px solid var(--vn-border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <h3 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "1.05rem" }}>Выбери город</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-muted)" }}>
              <Icon name="X" size={20} />
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <Icon name="Search" size={16} color="var(--vn-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
            <input
              className="vn-input"
              placeholder="Найти город..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{ paddingLeft: "2.6rem" }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0" }} className="scrollbar-hide">
          {groups.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--vn-muted)", fontSize: "0.9rem" }}>
              Город не найден
            </div>
          )}
          {groups.map((g) => (
            <div key={g.region}>
              <div style={{ padding: "0.6rem 1.2rem 0.35rem", fontSize: "0.72rem", color: "var(--vn-blue-bright)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", background: "var(--vn-card)", position: "sticky", top: 0 }}>
                {g.region}
              </div>
              {g.cities.map((city) => (
                <button
                  key={city}
                  onClick={() => { onChange(city); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "0.7rem 1.2rem", background: value === city ? "rgba(33,150,243,0.08)" : "none",
                    border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (value !== city) e.currentTarget.style.background = "rgba(33,150,243,0.04)"; }}
                  onMouseLeave={(e) => { if (value !== city) e.currentTarget.style.background = "none"; }}
                >
                  <Icon name="MapPin" size={15} color={value === city ? "var(--vn-blue-bright)" : "var(--vn-muted)"} />
                  <span style={{ flex: 1, fontSize: "0.92rem", color: value === city ? "var(--vn-blue-bright)" : "var(--vn-text)", fontWeight: value === city ? 600 : 400 }}>
                    {city}
                  </span>
                  {value === city && <Icon name="Check" size={16} color="var(--vn-blue-bright)" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
