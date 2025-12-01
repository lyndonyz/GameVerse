import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

function App() {
  // --------------------------
  // BASIC SEARCH + STATE
  // --------------------------
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // --------------------------
  // CATEGORY (GENRE)
  // --------------------------
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState("");

  // --------------------------
  // SORTING (RATING)
  // --------------------------
  const [sortOrder, setSortOrder] = useState("");

  // --------------------------
  // ADVANCED FILTERS (FR1 + FR3)
  // --------------------------
  const [platform, setPlatform] = useState("");
  const [vr, setVr] = useState("");
  const [minRating, setMinRating] = useState("");
  const [releasedFrom, setReleasedFrom] = useState("");
  const [releasedTo, setReleasedTo] = useState("");

  // --------------------------
  // MODAL UI / COMMENTS
  // --------------------------
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);
  const [tab, setTab] = useState("overview");

  // --------------------------
  // SORTED RESULTS
  // --------------------------
  const displayedResults = useMemo(() => {
    if (!sortOrder) return results;

    const rated = results.filter((r) => typeof r.rating === "number");
    const unrated = results.filter((r) => r.rating == null);

    rated.sort((a, b) =>
      sortOrder === "high" ? b.rating - a.rating : a.rating - b.rating
    );

    return [...rated, ...unrated];
  }, [results, sortOrder]);

  // --------------------------
  // SIDEBAR: TOP RATED
  // --------------------------
  const topRated = useMemo(() => {
    return [...displayedResults]
      .filter((r) => r.rating != null)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [displayedResults]);

  // --------------------------
  // API HELPERS
  // --------------------------
  const loadDiscover = async (opts = {}) => {
    const targetPage = opts.page ?? 1;
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`/api/discover?page=${targetPage}&page_size=24`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setResults(data.results || []);
      setHasNext(data.hasNext);
      setHasPrev(data.hasPrev);
      setPage(data.page || targetPage);
    } catch (e) {
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
      setHasNext(data.hasNext);
      setHasPrev(data.hasPrev);
      setPage(data.page);
    } catch (e) {
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
      setHasNext(data.hasNext);
      setHasPrev(data.hasPrev);
      setPage(data.page);
    } catch (e) {
      setErr("Failed to load category");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // ADVANCED SEARCH (FR1 + FR3)
  // --------------------------
  const runAdvancedSearch = async () => {
    setLoading(true);
    setErr("");

    const params = new URLSearchParams({
      q,
      genre: cat,
      platform,
      vr,
      minRating,
      releasedFrom,
      releasedTo,
      page: 1,
      page_size: 24,
    });

    try {
      const r = await fetch(`/api/advancedSearch?${params.toString()}`);
      const data = await r.json();

      if (data.error) throw new Error(data.error);

      setResults(data.results || []);
      setHasNext(data.hasNext);
      setHasPrev(data.hasPrev);
      setPage(data.page);
    } catch (e) {
      setErr("Advanced search failed");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // INITIAL LOAD
  // --------------------------
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

  // --------------------------
  // REAL-TIME SEARCH (FR5)
  // --------------------------
  useEffect(() => {
    const delay = setTimeout(() => {
      if (q.trim().length > 2 && !platform && !vr && !minRating && !releasedFrom && !releasedTo) {
        runSearch({ page: 1 });
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [q]);

  // --------------------------
  // FORM SUBMIT LOGIC
  // --------------------------
  const onSubmit = (e) => {
    e.preventDefault();

    // if ANY advanced filter is active → full advanced search
    if (platform || vr || minRating || releasedFrom || releasedTo) {
      runAdvancedSearch();
      return;
    }

    // CATEGORY OR DISCOVER
    if (!q.trim()) {
      cat ? loadByCategory({ page: 1 }) : loadDiscover({ page: 1 });
      return;
    }

    // BASIC SEARCH
    runSearch({ page: 1 });
  };

  // --------------------------
  // PAGINATION
  // --------------------------
  const goNext = () => {
    if (!hasNext) return;

    if (platform || vr || minRating || releasedFrom || releasedTo)
      runAdvancedSearch(page + 1);
    else if (cat)
      loadByCategory({ page: page + 1 });
    else if (!q.trim())
      loadDiscover({ page: page + 1 });
    else
      runSearch({ page: page + 1 });
  };

  const goPrev = () => {
    if (!hasPrev || page <= 1) return;

    if (platform || vr || minRating || releasedFrom || releasedTo)
      runAdvancedSearch(page - 1);
    else if (cat)
      loadByCategory({ page: page - 1 });
    else if (!q.trim())
      loadDiscover({ page: page - 1 });
    else
      runSearch({ page: page - 1 });
  };

  // --------------------------
  // GAME DETAILS MODAL
  // --------------------------
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

      setDetails(d);
      setComments(c.comments || []);

      setTimeout(() => modalRef.current?.focus(), 0);
    } catch (e) {
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
    if (!text || !selected) return;

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
      alert("Failed to save comment");
    } finally {
      setSaving(false);
    }
  };

  // ESC closes modal
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // --------------------------
  // RETURN HOME
  // --------------------------
  const goHome = () => {
    setQ("");
    setCat("");
    setPage(1);
    setSortOrder("");
    setPlatform("");
    setVr("");
    setMinRating("");
    setReleasedFrom("");
    setReleasedTo("");
    loadDiscover({ page: 1 });
  };

  // --------------------------
  // HEADER TITLE TEXT
  // --------------------------
  const headerTitle = cat
    ? <>Category: <strong>{cat}</strong> — Page {page}</>
    : q.trim()
    ? <>Results for <strong>{q}</strong> — Page {page}</>
    : <> <strong>Discover Popular Games</strong> — Page {page}</>;

  // --------------------------
  // UI RENDER
  // --------------------------
  return (
    <div className="layout">

      {/* HEADER */}
      <header className="header">
        <div className="brand" onClick={goHome} role="button" tabIndex={0}>
          GAMEVERSE
        </div>

        <form className="search" onSubmit={onSubmit}>
          
          {/* TEXT SEARCH */}
          <input
            className="searchInput"
            placeholder="Search games..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          {/* GENRE */}
          <select
            className="select"
            value={cat}
            onChange={(e) => {
              const next = e.target.value;
              setCat(next);
              setQ("");
              setPage(1);
              next ? loadByCategory({ genre: next, page: 1 }) : loadDiscover({ page: 1 });
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>

          {/* PLATFORM (FR1) */}
          <select className="select" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">Platform</option>
            <option value="4">PC</option>
            <option value="187">PS5</option>
            <option value="18">PS4</option>
            <option value="1">Xbox One</option>
            <option value="7">Nintendo Switch</option>
          </select>

          {/* VR FILTER (FR1) */}
          <select className="select" value={vr} onChange={(e) => setVr(e.target.value)}>
            <option value="">VR filter</option>
            <option value="yes">VR only</option>
          </select>

          {/* MINIMUM RATING (FR1) */}
          <select className="select" value={minRating} onChange={(e) => setMinRating(e.target.value)}>
            <option value="">Rating</option>
            <option value="60">60+</option>
            <option value="70">70+</option>
            <option value="80">80+</option>
            <option value="90">90+</option>
          </select>

          {/* RELEASE DATE RANGE (FR1) */}
          <input
            className="searchInput"
            type="date"
            value={releasedFrom}
            onChange={(e) => setReleasedFrom(e.target.value)}
          />
          <input
            className="searchInput"
            type="date"
            value={releasedTo}
            onChange={(e) => setReleasedTo(e.target.value)}
          />

          {/* SORT */}
          <select
            className="select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="">Sort by rating</option>
            <option value="high">Highest → Lowest</option>
            <option value="low">Lowest → Highest</option>
          </select>

          {/* SEARCH BUTTON */}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>
      </header>

      {/* MAIN */}
      <main className="main">

        {/* RESULTS */}
        <section className="results">

          {err && <div className="error">{err}</div>}
          {!loading && results.length === 0 && (
            <div className="error">No Results Found</div>
          )}

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
            {(loading ? Array.from({ length: 6 }) : displayedResults).map(
              (g, idx) =>
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
                      {g.image ? (
                        <img src={g.image} alt={g.name} />
                      ) : (
                        <div className="placeholder">No Image</div>
                      )}
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

        {/* SIDEBAR */}
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

      {/* MODAL */}
      {selected && (
        <>
          <div className="backdrop" onClick={closeModal} />
          <div className="modal" ref={modalRef} tabIndex={-1} aria-modal="true" role="dialog">

            <button className="closeX" onClick={closeModal}>✕</button>

            <div className="modalHeader">
              {details?.image && (
                <img className="modalCover" src={details.image} alt={details?.name} />
              )}

              <div className="modalHeadMeta">
                <h2 className="modalTitle">{details?.name || selected.name}</h2>

                <div className="modalSub">
                  {details?.released ? `Released: ${details.released}` : "—"} ·
                  Rating: {details?.rating ?? selected.rating ?? "—"}{" "}
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
                      <li>
                        <strong>VR Compatible:</strong>{" "}
                        {details?.vr_supported === "Yes"
                          ? <>Yes ✨ ✔️</>
                          : <>No ✖️</>}
                      </li>
                      <li><strong>Developers:</strong> {details?.developers?.join(", ") || "—"}</li>
                      <li><strong>Publishers:</strong> {details?.publishers?.join(", ") || "—"}</li>

                      {details?.website && (
                        <li>
                          <a href={details.website} target="_blank" className="glow-link">
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
                    <button className="btn" disabled={saving || !commentInput.trim()}>
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
