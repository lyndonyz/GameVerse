// App.jsx
import { useEffect, useRef, useState } from "react";

function App() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selected, setSelected] = useState(null); // {id,name,image}
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [saving, setSaving] = useState(false);

  // ref for the details/comments panel to scroll to it
  const detailsRef = useRef(null);

  const search = async () => {
    const query = q.trim();
    if (!query) return;

    setLoading(true);
    setErr("");
    setResults([]);
    setSelected(null);
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

  // Load comments when a game is selected
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

      // After we set comments, scroll the details panel into view
      // Use a tiny timeout to ensure DOM is painted
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    };
    loadComments();
  }, [selected]);

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
      setComments((prev) => [...prev, data.comment]); // append locally
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
          <button
            key={g.id}
            type="button"                 // <-- important so it doesn't submit the form
            onClick={() => setSelected(g)}
            style={{
              textAlign: "left",
              border: "1px solid #555",
              padding: 8,
              cursor: "pointer",
              background: selected?.id === g.id ? "#222" : "transparent",
            }}
          >
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
            <div style={{ marginTop: 8, fontWeight: 600 }}>{g.name}</div>
          </button>
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
            maxWidth: 640,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {selected.image && (
              <img
                src={selected.image}
                alt={selected.name}
                style={{ width: 160, height: "auto" }}
              />
            )}
            <div>
              <h2 style={{ margin: 0 }}>{selected.name}</h2>
              <div style={{ fontSize: 12, opacity: 0.8 }}>ID: {selected.id}</div>
            </div>
          </div>

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
              <button type="button" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </form>

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
