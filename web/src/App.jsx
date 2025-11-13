import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

function App() {
  // --- Search / list state ---
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // --- Category state ---
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState(""); // RAWG genre slug

  // --- Sort state ---
  const [sortOrder, setSortOrder] = useState(""); // "", "high", "low"

  // --- Details / comments modal state ---
  const [selected, setSelected] = useState(null); // {id, name, image, rating, released}
  const [details, setDetails] = useState(null);   // full game info
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);

  // Tabs like MAL
  const [tab, setTab] = useState("overview");

  // Helper: apply sort to current results for display
  const displayedResults = useMemo(() => {
    if (!sortOrder) return results;

    const rated = results.filter((r) => typeof r.rating === "number");
    const unrated = results.filter((r) => r.rating == null);

    rated.sort((a, b) =>
      sortOrder === "high" ? b.rating - a.rating : a.rating - b.rating
    );

    return [...rated, ...unrated];
  }, [results, sortOrder]);

  // Sidebar: Top rated from current displayed results
  const topRated = useMemo(() => {
    return [...displayedResults]
      .filter((r) => r.rating != null)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [displayedResults]);

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
    if (!query) return; // empty handled by discover or category
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

  const loadByCategory = async (opts = {}) => {
    const genre = (opts.genre ?? cat).trim();
    const targetPage = opts.page ?? 1;
    if (!genre) return;

    setLoading(true);
    setErr("");
    try {
      const r = await fetch(
        `/api/searchByCategory?genre=${encodeURIComponent(
          genre
        )}&page=${targetPage}&page_size=24`
      );
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
      setHasNext(Boolean(data.hasNext));
      setHasPrev(Boolean(data.hasPrev));
      setPage(data.page || targetPage);
    } catch (e) {
      console.error(e);
      setErr("Failed to load category");
    } finally {
      setLoading(false);
    }
  };

  // Initial home feed + categories
  useEffect(() => {
    loadDiscover({ page: 1 });
    (async () => {
      try {
        const r = await fetch("/api/categories");
        const data = await r.json();
        if (data?.categories) setCategories(data.categories);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!q.trim()) {
      // if query empty, use category if set, otherwise discover
      if (cat) loadByCategory({ page: 1 });
      else loadDiscover({ page: 1 });
      return;
    }
    setCat(""); // typing a query clears category filter
    setPage(1);
    runSearch({ page: 1 });
  };

  // Pagination controls (work for discover, text, category)
  const goNext = () => {
    if (!hasNext) return;
    if (cat) loadByCategory({ page: page + 1 });
    else if (!q.trim()) loadDiscover({ page: page + 1 });
    else runSearch({ page: page + 1 });
  };
  const goPrev = () => {
    if (!hasPrev || page <= 1) return;
    if (cat) loadByCategory({ page: page - 1 });
    else if (!q.trim()) loadDiscover({ page: page - 1 });
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

  // ESC closes modal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Brand click = go home (discover)
  const goHome = () => {
    setQ("");
    setCat("");
    setPage(1);
    setSortOrder("");
    loadDiscover({ page: 1 });
  };

  const headerTitle = cat
    ? (
      <>
        Category: <strong>{cat}</strong> — Page {page}
      </>
      )
    : q.trim()
    ? (
      <>
        Results for <strong>{q}</strong> — Page {page}
      </>
      )
    : (
      <>
        <strong>Discover Popular Games</strong> — Page {page}
      </>
      );

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="brand" onClick={goHome} role="button" tabIndex={0}>
          GAMEVERSE
        </div>

        <form className="search" onSubmit={onSubmit}>
          <input
            className="searchInput"
            placeholder="Search games..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
          />

          {/* Category filter */}
          <select
            className="select"
            value={cat}
            onChange={(e) => {
              const next = e.target.value;
              setCat(next);
              setQ("");
              setPage(1);
              if (next) loadByCategory({ genre: next, page: 1 });
              else loadDiscover({ page: 1 });
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort by rating */}
          <select
            className="select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="">Sort by rating</option>
            <option value="high">Highest → Lowest</option>
            <option value="low">Lowest → Highest</option>
          </select>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>
      </header>

      {/* Main */}
      <main className="main">
        {/* Results */}
        <section className="results">
          {err && <div className="error">{err}</div>}

          <div className="listHeader">
            <div>{headerTitle}</div>
            <div className="pager">
              <button
                className="btn small ghost"
                onClick={goPrev}
                disabled={!hasPrev || loading}
              >
                ◀ Prev
              </button>
              <button
                className="btn small"
                onClick={goNext}
                disabled={!hasNext || loading}
              >
                Next ▶
              </button>
            </div>
          </div>

          <ul className="list">
            {(loading ? Array.from({ length: 6 }) : displayedResults).map(
              (g, idx) =>
                loading ? (
                  <li key={idx} className="row">
                    <div className="rank skeleton" style={{ height: 18 }} />
                    <div className="cover skeleton" />
                    <div className="meta">
                      <div
                        className="skeleton"
                        style={{
                          height: 18,
                          width: "40%",
                          marginBottom: 6,
                        }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 14, width: "70%" }}
                      />
                    </div>
                  </li>
                ) : (
                  <li key={g.id} className="row">
                    <div className="rank">
                      {(page - 1) * 24 + idx + 1}
                    </div>

                    <div
                      className="cover"
                      onClick={() => openGame(g)}
                      role="button"
                      tabIndex={0}
                    >
                      {g.image ? (
                        <img src={g.image} alt={g.name} />
                      ) : (
                        <div className="placeholder">No Image</div>
                      )}
                    </div>

                    <div className="meta">
                      <div
                        className="title"
                        onClick={() => openGame(g)}
                        role="button"
                        tabIndex={0}
                      >
                        {g.name}
                      </div>
                      <div className="sub">
                        <span className="badge">
                          ★ {g.rating ?? "—"}
                        </span>
                        <span className="badge">
                          📅 {g.released || "—"}
                        </span>
                      </div>
                    </div>
                  </li>
                )
            )}
          </ul>
        </section>

        {/* Sidebar */}
        <aside className="sidebar">
          <h3 className="sideTitle">Top Rated (this page)</h3>
          <ol className="topList">
            {topRated.map((g) => (
              <li
                key={g.id}
                onClick={() => openGame(g)}
                role="button"
                tabIndex={0}
              >
                <div className="topItem">
                  <div className="thumb">
                    {g.image ? (
                      <img src={g.image} alt={g.name} />
                    ) : (
                      <div className="miniPh" />
                    )}
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

      {/* Modal (details + tabs + comments) */}
      {selected && (
        <>
          <div className="backdrop" onClick={closeModal} />
          <div
            className="modal"
            ref={modalRef}
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
          >
            <button
              className="closeX"
              onClick={closeModal}
              aria-label="Close"
            >
              ✕
            </button>

            <div className="modalHeader">
              {details?.image && (
                <img
                  className="modalCover"
                  src={details.image}
                  alt={details?.name}
                />
              )}
              <div className="modalHeadMeta">
                <h2 className="modalTitle">
                  {details?.name || selected.name}
                </h2>
                <div className="modalSub">
                  {details?.released
                    ? `Released: ${details.released}`
                    : "—"}{" "}
                  · Rating:{" "}
                  {details?.rating ?? selected.rating ?? "—"}{" "}
                  {details?.metacritic
                    ? `· Metacritic: ${details.metacritic}`
                    : ""}
                </div>
                <div className="chips">
                  {details?.genres?.map((g) => (
                    <span key={g} className="chip">
                      {g}
                    </span>
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
                    <p className="desc">
                      {details?.description || "No description available."}
                    </p>
                  </div>
                  <div>
                    <h4>Information</h4>
                    <ul className="infoList">
                       <li><strong>Platforms:</strong> {details?.platforms?.join(", ") || "—"}</li>
                      <li>
                        <strong>VR Compatible:</strong>{" "}
                        {details?.vr_supported === "Yes" ? (
                          <>
                            Yes{" "}
                            <img
                              src="/yvr.png"
                              alt="VR Compatible"
                              style={{ width: "1.4em", verticalAlign: "middle", margin: "0 0.2em" }}
                            />
                            ✨ ✔️
                          </>
                        ) : (
                          <>
                            No 😞 ✖️
                          </>
                        )}
                      </li>

                      <li>
                        <strong>Platforms:</strong>{" "}
                        {details?.platforms?.join(", ") || "—"}
                      </li>
                      <li>
                        <strong>Developers:</strong>{" "}
                        {details?.developers?.join(", ") || "—"}
                      </li>
                      <li>
                        <strong>Publishers:</strong>{" "}
                        {details?.publishers?.join(", ") || "—"}
                      </li>
                      {details?.website && (
                        <li>
                          <a
                            href={details.website}
                            target="_blank"
                            rel="noreferrer"
                            className="glow-link"
                          >
                            Official Website
                          </a>
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
                    <button
                      className="btn"
                      type="submit"
                      disabled={saving || !commentInput.trim()}
                    >
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
                        <div className="commentMeta">
                          {new Date(c.at).toLocaleString()}
                        </div>
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
