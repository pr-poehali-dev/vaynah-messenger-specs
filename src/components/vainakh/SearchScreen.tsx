import { useState } from "react";
import Icon from "@/components/ui/icon";

interface SearchUser {
  id: number;
  name: string;
  surname: string;
  city: string;
  age: number;
  avatar: string;
  isFriend: boolean;
  isBlocked: boolean;
  friends: string[];
}

const mockUsers: SearchUser[] = [
  { id: 1, name: "Зайнаб", surname: "Хасанова", city: "Грозный", age: 22, avatar: "З", isFriend: false, isBlocked: false, friends: ["Ислам", "Малика", "Руслан"] },
  { id: 2, name: "Ислам", surname: "Дудаев", city: "Гудермес", age: 28, avatar: "И", isFriend: true, isBlocked: false, friends: ["Зайнаб", "Ахмед"] },
  { id: 3, name: "Малика", surname: "Садулаева", city: "Грозный", age: 25, avatar: "М", isFriend: false, isBlocked: false, friends: ["Руслан"] },
  { id: 4, name: "Руслан", surname: "Арсанов", city: "Шали", age: 31, avatar: "Р", isFriend: true, isBlocked: false, friends: ["Ислам", "Малика"] },
  { id: 5, name: "Хеда", surname: "Гайтаева", city: "Аргун", age: 19, avatar: "Х", isFriend: false, isBlocked: false, friends: ["Зайнаб"] },
];

const avatarColors = [
  "linear-gradient(135deg, #FF6B35, #E91E8C)",
  "linear-gradient(135deg, #5B3FD4, #9B59B6)",
  "linear-gradient(135deg, #00BCD4, #5B3FD4)",
  "linear-gradient(135deg, #2ECC71, #00BCD4)",
  "linear-gradient(135deg, #E91E8C, #9B59B6)",
];

export default function SearchScreen() {
  const [filters, setFilters] = useState({ name: "", surname: "", city: "", ageFrom: "", ageTo: "" });
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [users, setUsers] = useState(mockUsers);

  const handleSearch = () => {
    const res = users.filter((u) => {
      const matchName = !filters.name || u.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchSurname = !filters.surname || u.surname.toLowerCase().includes(filters.surname.toLowerCase());
      const matchCity = !filters.city || u.city.toLowerCase().includes(filters.city.toLowerCase());
      const matchAgeFrom = !filters.ageFrom || u.age >= Number(filters.ageFrom);
      const matchAgeTo = !filters.ageTo || u.age <= Number(filters.ageTo);
      return matchName && matchSurname && matchCity && matchAgeFrom && matchAgeTo;
    });
    setResults(res);
    setSearched(true);
  };

  const toggleFriend = (userId: number) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isFriend: !u.isFriend } : u));
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => prev ? { ...prev, isFriend: !prev.isFriend } : null);
    }
    setResults((prev) => prev.map((u) => u.id === userId ? { ...u, isFriend: !u.isFriend } : u));
  };

  const blockUser = (userId: number) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isBlocked: true } : u));
    setSelectedUser(null);
  };

  if (selectedUser) {
    const userColor = avatarColors[selectedUser.id % avatarColors.length];
    return (
      <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "0.9rem 1rem", borderBottom: "1px solid var(--vn-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vn-orange)" }}>
            <Icon name="ArrowLeft" size={22} />
          </button>
          <span style={{ fontWeight: 600 }}>Профиль</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          {/* Cover */}
          <div style={{ height: 120, background: "linear-gradient(135deg, var(--vn-orange), var(--vn-pink), var(--vn-indigo))", position: "relative" }}>
            <div style={{ position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)", width: 70, height: 70, borderRadius: "50%", background: userColor, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.5rem", color: "white", border: "3px solid var(--vn-bg)" }}>
              {selectedUser.avatar}
            </div>
          </div>

          <div style={{ paddingTop: "2.5rem", padding: "2.5rem 1.2rem 1.2rem", textAlign: "center" }}>
            <h2 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.4rem" }}>
              {selectedUser.name} {selectedUser.surname}
            </h2>
            <p style={{ color: "var(--vn-muted)", fontSize: "0.85rem", marginTop: 4 }}>
              {selectedUser.age} лет · {selectedUser.city}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", padding: "0 1.2rem 1.2rem" }}>
            <button
              className="vn-btn"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.75rem" }}
            >
              <Icon name="MessageCircle" size={16} color="white" />
              Написать
            </button>
            <button
              onClick={() => toggleFriend(selectedUser.id)}
              className="vn-btn"
              style={{
                background: selectedUser.isFriend
                  ? "var(--vn-card2)"
                  : "linear-gradient(135deg, var(--vn-indigo), var(--vn-purple))",
                border: selectedUser.isFriend ? "1px solid var(--vn-border)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.75rem"
              }}
            >
              <Icon name={selectedUser.isFriend ? "UserMinus" : "UserPlus"} size={16} color="white" />
              {selectedUser.isFriend ? "Удалить" : "Добавить"}
            </button>
          </div>

          <div style={{ padding: "0 1.2rem 1.2rem" }}>
            <button
              onClick={() => blockUser(selectedUser.id)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "0.75rem", padding: "0.75rem", color: "#E74C3C", cursor: "pointer", fontSize: "0.9rem", fontWeight: 500 }}
            >
              <Icon name="Ban" size={16} color="#E74C3C" />
              Заблокировать
            </button>
          </div>

          {/* Photo placeholders */}
          <div style={{ padding: "0 1.2rem" }}>
            <h3 style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem", color: "var(--vn-muted)" }}>Фото</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: "0.5rem", background: `linear-gradient(135deg, ${["#FF6B35","#9B59B6","#00BCD4","#E91E8C","#5B3FD4","#2ECC71"][i]}44, ${["#E91E8C","#5B3FD4","#9B59B6","#FF6B35","#00BCD4","#9B59B6"][i]}44)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="Image" size={20} color="rgba(255,255,255,0.3)" />
                </div>
              ))}
            </div>
          </div>

          {/* Friends */}
          <div style={{ padding: "1.2rem" }}>
            <h3 style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem", color: "var(--vn-muted)" }}>Друзья</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {selectedUser.friends.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--vn-card2)", border: "1px solid var(--vn-border)", borderRadius: "50px", padding: "0.35rem 0.75rem" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: avatarColors[i % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "white" }}>
                    {f[0]}
                  </div>
                  <span style={{ fontSize: "0.82rem" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vn-screen" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "1.2rem 1.2rem 0.8rem", borderBottom: "1px solid var(--vn-border)" }}>
        <h1 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "1.3rem", marginBottom: "1rem" }} className="vn-gradient-text">
          ВайНах Поиск
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <input className="vn-input" placeholder="Имя" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} style={{ fontSize: "0.85rem" }} />
            <input className="vn-input" placeholder="Фамилия" value={filters.surname} onChange={(e) => setFilters({ ...filters, surname: e.target.value })} style={{ fontSize: "0.85rem" }} />
          </div>
          <input className="vn-input" placeholder="Город" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} style={{ fontSize: "0.85rem" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <input className="vn-input" placeholder="Возраст от" type="number" value={filters.ageFrom} onChange={(e) => setFilters({ ...filters, ageFrom: e.target.value })} style={{ fontSize: "0.85rem" }} />
            <input className="vn-input" placeholder="Возраст до" type="number" value={filters.ageTo} onChange={(e) => setFilters({ ...filters, ageTo: e.target.value })} style={{ fontSize: "0.85rem" }} />
          </div>
          <button className="vn-btn" onClick={handleSearch} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="Search" size={16} color="white" />
            Найти
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {searched && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--vn-muted)" }}>
            <Icon name="SearchX" size={40} color="var(--vn-muted)" />
            <p style={{ marginTop: "1rem" }}>Никого не найдено</p>
          </div>
        )}
        {results.map((u, i) => (
          <div
            key={u.id}
            style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.9rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.03)", animation: `vn-appear 0.3s ease ${i * 0.07}s both` }}
          >
            <button onClick={() => setSelectedUser(u)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.9rem", flex: 1, textAlign: "left" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: avatarColors[u.id % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", flexShrink: 0 }}>
                {u.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{u.name} {u.surname}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--vn-muted)" }}>{u.age} лет · {u.city}</div>
              </div>
            </button>
            <button
              onClick={() => toggleFriend(u.id)}
              style={{
                background: u.isFriend ? "rgba(46,204,113,0.15)" : "rgba(255,107,53,0.1)",
                border: `1px solid ${u.isFriend ? "rgba(46,204,113,0.4)" : "rgba(255,107,53,0.3)"}`,
                borderRadius: "50px",
                padding: "0.4rem 0.75rem",
                color: u.isFriend ? "#2ECC71" : "var(--vn-orange)",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {u.isFriend ? "✓ Друг" : "+ Добавить"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
