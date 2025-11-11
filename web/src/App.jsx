// App.jsx
import { useState } from "react";

function App() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const search = async () => {
    const query = q.trim();
    if (!query) return;

    setLoading(true);
    setErr("");
    setResults([]);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
    } catch (e) {
      console.error(e);
      setErr("Failed to search games");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    search();
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Game Search</h1>

      <form onSubmit={onSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search a game (e.g., God of War)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginRight: "0.5rem", padding: "0.5rem", width: "320px" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {err && <p style={{ color: "tomato" }}>{err}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 200px)",
          gap: "12px",
        }}
      >
        {results.map((g) => (
          <div key={g.id} style={{ border: "1px solid #555", padding: "8px" }}>
            {g.image ? (
              <img
                src={g.image}
                alt={g.name}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            ) : (
              <div
                style={{
                  height: 112,
                  display: "grid",
                  placeItems: "center",
                  background: "#333",
                  color: "#ddd",
                  fontSize: 14,
                }}
              >
                No image
              </div>
            )}
            <div style={{ marginTop: "8px", fontWeight: 600 }}>{g.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
