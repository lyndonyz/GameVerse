// App.jsx
import { useEffect, useRef, useState } from "react";

function App() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selected, setSelected] = useState(null);   // {id,name,image} from search
  const [details, setDetails] = useState(null);     // rich details from /api/game/:id
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [saving, setSaving] = useState(false);

  const detailsRef = useRef(null);

  const search = async () => {
    const query = q.trim();
    if (!query) return;

    setLoading(true);
    setErr("");
    setResults([]);
    setSelected(null);
    setDetails(null);
    setComments([]);

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

  // When a game is selected, load comments
  useEffect(() => {
    const loadComments = async () => {
      if (!selected) return;
      try {
        const res = await fetch(`/api/game/${selected.id}/comments`);
        const data = await res.json();
        setComments(data.comments || []);
      } catch (e) {
        console.error(e);
        setComments([]);
      }
    };
    loadComments();
  }, [selected]);

  // Fetch full game details
  const loadDetails = async (game) => {
    try {
      const res = await fetch(`/api/game/${game.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDetails(data);
      // ensure scroll to details
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } catch (e) {
      console.error(e);
      alert("Failed to load game info");
    }
  };

  // Click handler ONLY on image → select and load details
  const onGameImageClick = (g) => {
    setSelected(g);
    setDetails(null);
    loadDetails(g);
  };

  const addComment = async (e) => {
    e.preventDefault();
    const text = commentInput.trim();
    if (!selected || !text) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/game/${selected.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCommentInput("");
      setComments((prev) => [...prev, data.comment]);
    } catch (e) {
      console.error(e);
      alert("Failed to save comment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "2rem", display: "grid", gap: "1rem" }}>
      <h1>Game Search</h1>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Search a game (e.g., God of War)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: "0.5rem", width: 320 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {err && <p style={{ color: "tomato" }}>{err}</p>}

      {/* Results grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 200px)",
          gap: 12,
        }}
      >
        {results.map((g) => (
          <div
            key={g.id}
            style={{
              textAlign: "left",
              border: "1px solid #555",
              padding: 8,
              background: selected?.id === g.id ? "#222" : "transparent",
            }}
          >
            {g.image ? (
              <img
                src={g.image}
                alt={g.name}
                style={{ width: "100%", height: "auto", display: "block", cursor: "pointer" }}
                onClick={() => onGameImageClick(g)}   // <-- click the image to show info
              />
            ) : (
              <div
                onClick={() => onGameImageClick(g)}
                style={{
                  height: 112,
                  display: "grid",
                  placeItems: "center",
                  background: "#333",
                  color: "#ddd",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                No image
              </div>
            )}
            <div style={{ marginTop: 8, fontWeight: 600 }}>{g.name}</div>
          </div>
        ))}
      </div>

      {/* Details + comments */}
      {selected && (
        <div
          ref={detailsRef}
          style={{
            marginTop: 8,
            padding: 12,
            border: "1px solid #555",
            display: "grid",
            gap: 12,
            maxWidth: 800,
          }}
        >
          {/* GAME INFO */}
          {details ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 12 }}>
                {details.image && (
                  <img
                    src={details.image}
                    alt={details.name}
                    style={{ width: 200, height: "auto" }}
                  />
                )}
                <div>
                  <h2 style={{ margin: 0 }}>{details.name}</h2>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>ID: {details.id}</div>
                  <div>
                    <strong>Released:</strong> {details.released || "—"}
                  </div>
                  <div>
                    <strong>Rating:</strong> {details.rating ?? "—"}
                    {details.metacritic ? ` • Metacritic: ${details.metacritic}` : ""}
                  </div>
                  <div>
                    <strong>Genres:</strong>{" "}
                    {details.genres.length ? details.genres.join(", ") : "—"}
                  </div>
                  <div>
                    <strong>Platforms:</strong>{" "}
                    {details.platforms.length ? details.platforms.join(", ") : "—"}
                  </div>
                  {details.website && (
                    <div>
                      <a href={details.website} target="_blank" rel="noreferrer">
                        Official Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {details.description && (
                <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{details.description}</p>
              )}
            </div>
          ) : (
            <div>Loading game info…</div>
          )}

          {/* COMMENT BOX */}
          <form onSubmit={addComment} style={{ display: "grid", gap: 8 }}>
            <label htmlFor="comment">Add a comment</label>
            <textarea
              id="comment"
              rows={3}
              placeholder="Write your thoughts…"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              style={{ padding: 8 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={saving || !commentInput.trim()}>
                {saving ? "Saving…" : "Post Comment"}
              </button>
              <button type="button" onClick={() => { setSelected(null); setDetails(null); }}>
                Close
              </button>
            </div>
          </form>

          {/* COMMENTS LIST */}
          <div>
            <h3 style={{ margin: "8px 0" }}>Comments</h3>
            {comments.length === 0 ? (
              <div style={{ opacity: 0.7 }}>No comments yet.</div>
            ) : (
              <ul style={{ paddingLeft: 18, margin: 0, display: "grid", gap: 6 }}>
                {comments.map((c, i) => (
                  <li key={i}>
                    <div>{c.text}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {new Date(c.at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
