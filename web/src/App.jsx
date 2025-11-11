import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

function App() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);
  const [tab, setTab] = useState("overview");

  const topRated = useMemo(() => {
    return [...results]
      .filter((r) => r.rating != null)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [results]);

  // --- API helpers ---
  const loadDiscover = async (opts = {}) => {
    const targetPage = opts.page ?? 1;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/discover?page=${targetPage}&page_size=24`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
      setHasNext(Boolean(data.hasNext));
      setHasPrev(Boolean(data.hasPrev));
      setPage(data.page || targetPage);
    } catch (e) {
      console.error(e);
      setErr("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async (opts = {}) => {
    const query = (opts.q ?? q).trim();
    const targetPage = opts.page ?? page;
    if (!query) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&page=${targetPage}&page_size=24`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
      setHasNext(Boolean(data.hasNext));
      setHasPrev(Boolean(data.hasPrev));
      setPage(data.page || targetPage);
    } catch (e) {
      console.error(e);
      setErr("Failed to search games");
    } finally {
      setLoading(false);
    }
  };

  // Load discover on initial mount
  useEffect(() => {
    loadDiscover({ page: 1 });
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!q.trim()) {
      setPage(1);
      loadDiscover({ page: 1 });
      return;
    }
    setPage(1);
    runSearch({ page: 1 });
  };

  const goNext = () => {
    if (!hasNext) return;
    if (!q.trim()) loadDiscover({ page: page + 1 });
    else runSearch({ page: page + 1 });
  };

  const goPrev = () => {
    if (!hasPrev || page <= 1) return;
    if (!q.trim()) loadDiscover({ page: page - 1 });
    else runSearch({ page: page - 1 });
  };

  const openGame = async (g) => {
    setSelected(g);
    setDetails(null);
    setComments([]);
    setTab("overview");
    try {
      const [dRes, cRes] = await Promise.all([
        fetch(`/api/game/${g.id}`),
        fetch(`/api/game/${g.id}/comments`),
      ]);
      const d = await dRes.json();
      const c = await cRes.json();
      if (d.error) throw new Error(d.error);
      setDetails(d);
      setComments(c.comments || []);
      setTimeout(() => modalRef.current?.focus(), 0);
    } catch (e) {
      console.error(e);
      alert("Failed to load game info");
    }
  };

  const closeModal = () => {
    setSelected(null);
    setDetails(null);
    setComments([]);
    setCommentInput("");
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
      setTab("comments");
    } catch (e) {
      console.error(e);
      alert("Failed to save comment");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 🆕 Clicking the logo brings user back to the homepage (discover)
  const goHome = () => {
    setQ("");
    setPage(1);
    loadDiscover({ page: 1 });
  };

  const headerTitle = q.trim()
    ? <>Results for <strong>{q}</strong> — Page {page}</>
    : <> <strong>Discover Popular Games</strong> — Page {page} </>;

  return (
    <div className="layout">
      <header className="header">
        <div className="brand" onClick={goHome} role="button" tabIndex={0}>
          GameVerse
        </div>
        <form className="search" onSubmit={onSubmit}>
          <input
            className="searchInput"
            placeholder="Search games…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>
      </header>

      <main className="main">
        <section className="results">
          {err && <div className="error">{err}</div>}

          <div className="listHeader">
            <div>{headerTitle}</div>
            <div className="pager">
              <button className="btn small ghost" onClick={goPrev} disabled={!hasPrev || loading}>
                ◀ Prev
              </button>
              <button className="btn small" onClick={goNext} disabled={!hasNext || loading}>
                Next ▶
              </button>
            </div>
          </div>

          <ul className="list">
            {(loading ? Array.from({ length: 6 }) : results).map((g, idx) =>
              loading ? (
                <li key={idx} className="row">
                  <div className="rank skeleton" style={{ height: 18 }} />
                  <div className="cover skeleton" />
                  <div className="meta">
                    <div className="skeleton" style={{ height: 18, width: "40%", marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 14, width: "70%" }} />
                  </div>
                </li>
              ) : (
                <li key={g.id} className="row">
                  <div className="rank">{(page - 1) * 24 + idx + 1}</div>
                  <div className="cover" onClick={() => openGame(g)} role="button" tabIndex={0}>
                    {g.image ? <img src={g.image} alt={g.name} /> : <div className="placeholder">No Image</div>}
                  </div>
                  <div className="meta">
                    <div className="title" onClick={() => openGame(g)} role="button" tabIndex={0}>
                      {g.name}
                    </div>
                    <div className="sub">
                      <span className="badge">★ {g.rating ?? "—"}</span>
                      <span className="badge">📅 {g.released || "—"}</span>
                    </div>
                  </div>
                </li>
              )
            )}
          </ul>
        </section>

        <aside className="sidebar">
          <h3 className="sideTitle">Top Rated (this page)</h3>
          <ol className="topList">
            {topRated.map((g) => (
              <li key={g.id} onClick={() => openGame(g)} role="button" tabIndex={0}>
                <div className="topItem">
                  <div className="thumb">
                    {g.image ? <img src={g.image} alt={g.name} /> : <div className="miniPh" />}
                  </div>
                  <div className="topMeta">
                    <div className="topName">{g.name}</div>
                    <div className="topSub">★ {g.rating ?? "—"}</div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </main>

      {selected && (
        <>
          <div className="backdrop" onClick={closeModal} />
          <div className="modal" ref={modalRef} tabIndex={-1} aria-modal="true" role="dialog">
            <button className="closeX" onClick={closeModal} aria-label="Close">✕</button>

            <div className="modalHeader">
              {details?.image && <img className="modalCover" src={details.image} alt={details?.name} />}
              <div className="modalHeadMeta">
                <h2 className="modalTitle">{details?.name || selected.name}</h2>
                <div className="modalSub">
                  {details?.released ? `Released: ${details.released}` : "—"} · Rating:{" "}
                  {details?.rating ?? selected.rating ?? "—"}{" "}
                  {details?.metacritic ? `· Metacritic: ${details.metacritic}` : ""}
                </div>
                <div className="chips">
                  {details?.genres?.map((g) => (
                    <span key={g} className="chip">{g}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="tabs">
              <button
                className={`tab ${tab === "overview" ? "active" : ""}`}
                onClick={() => setTab("overview")}
              >
                Overview
              </button>
              <button
                className={`tab ${tab === "comments" ? "active" : ""}`}
                onClick={() => setTab("comments")}
              >
                Comments ({comments.length})
              </button>
            </div>

            {tab === "overview" ? (
              <div className="panel">
                <div className="grid2">
                  <div>
                    <h4>Synopsis</h4>
                    <p className="desc">{details?.description || "No description available."}</p>
                  </div>
                  <div>
                    <h4>Information</h4>
                    <ul className="infoList">
                      <li><strong>Platforms:</strong> {details?.platforms?.join(", ") || "—"}</li>
                      <li><strong>Developers:</strong> {details?.developers?.join(", ") || "—"}</li>
                      <li><strong>Publishers:</strong> {details?.publishers?.join(", ") || "—"}</li>
                      {details?.website && (
                        <li>
                          <a href={details.website} target="_blank" rel="noreferrer">Official Website</a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="panel">
                <form className="commentForm" onSubmit={addComment}>
                  <textarea
                    rows={3}
                    placeholder="Write your thoughts…"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                  />
                  <div className="right">
                    <button className="btn" type="submit" disabled={saving || !commentInput.trim()}>
                      {saving ? "Posting…" : "Post Comment"}
                    </button>
                  </div>
                </form>

                <ul className="commentList">
                  {comments.length === 0 ? (
                    <div className="muted">No comments yet.</div>
                  ) : (
                    comments.map((c, i) => (
                      <li key={i} className="comment">
                        <div className="commentText">{c.text}</div>
                        <div className="commentMeta">{new Date(c.at).toLocaleString()}</div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
