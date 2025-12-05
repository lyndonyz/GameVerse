import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./App.css";

function App() {
  //const API_BASE_URL = "https://my-backend-api.23gzti4bhp77.ca-tor.codeengine.appdomain.cloud";
  const API_BASE_URL = "http://localhost:8000";
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [gameStatus, setGameStatus] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, setLoggedIn, user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [commentRating, setCommentRating] = useState("");
  const [platform, setPlatform] = useState("");
  const [vr, setVr] = useState("");
  const [minRating, setMinRating] = useState("");
  const [releasedFrom, setReleasedFrom] = useState("");
  const [releasedTo, setReleasedTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const dropdownRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);
  const [tab, setTab] = useState("overview");
  const [userGames, setUserGames] = useState({});
  const normalizeName = (n) => (n || "").toString().trim().toLowerCase();

  const displayedResults = useMemo(() => {
    if (!sortOrder) return results;
    const rated = results.filter((r) => typeof r.rating === "number");
    const unrated = results.filter((r) => r.rating == null);
    rated.sort((a, b) =>
      sortOrder === "high" ? b.rating - a.rating : a.rating - b.rating
    );
    return [...rated, ...unrated];
  }, [results, sortOrder]);

  const topRated = useMemo(() => {
    return [...displayedResults]
      .filter((r) => r.rating != null)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [displayedResults]);

  const CACHE_TTL = 1000 * 60 * 5;
  const latestDiscoverRef = useRef(0);
  const latestSearchRef = useRef(0);

  const readCache = (key) => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || Date.now() - (parsed.t || 0) > CACHE_TTL) {
        sessionStorage.removeItem(key);
        return null;
      }
      return parsed.v;
    } catch {
      return null;
    }
  };

  const writeCache = (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ v: value, t: Date.now() }));
    } catch {}
  };

  const loadDiscover = async (opts = {}) => {
    const targetPage = opts.page ?? 1;
    setLoading(true);
    setErr("");
    const requestId = ++latestDiscoverRef.current;
    try {
      const r = await fetch(`/api/discover?page=${targetPage}&page_size=24`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      // ignore if a newer discover request has started
      if (requestId !== latestDiscoverRef.current) return;
      setResults(data.results || []);
      setHasNext(data.hasNext);
      setHasPrev(data.hasPrev);
      setPage(data.page || targetPage);
      // cache the successful page 1 discover (keep small)
      if (targetPage === 1) writeCache("discover_page_1", data);
    } catch {
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
    const requestId = ++latestSearchRef.current;
    try {
      const r = await fetch(
        `/api/search?q=${encodeURIComponent(
          query
        )}&page=${targetPage}&page_size=24`
      );
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      // ignore stale search responses
      if (requestId !== latestSearchRef.current) return;
      setResults(data.results || []);
      setHasNext(data.hasNext);
      setHasPrev(data.hasPrev);
      setPage(data.page);
    } catch {
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
    } catch {
      setErr("Failed to load category");
    } finally {
      setLoading(false);
    }
  };

  // advanced search updated for multi-select platforms
  const runAdvancedSearch = async () => {
    setLoading(true);
    setErr("");
    const params = new URLSearchParams({
      q,
      genre: cat,
      platform: selectedPlatforms.join(",") || platform,
      vr,
      minRating,
      releasedFrom,
      releasedTo,
      sortOrder,
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
    } catch {
      setErr("Advanced search failed");
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    const cached = readCache("discover_page_1");
    if (cached?.results) {
      setResults(cached.results || []);
      setHasNext(cached.hasNext);
      setHasPrev(cached.hasPrev);
      setPage(cached.page || 1);
    } else {
      setLoading(true);
    }
    // always refresh in background
    loadDiscover({ page: 1 });

    (async () => {
      const catCached = readCache("categories");
      if (catCached) {
        setCategories(catCached);
        return;
      }
      try {
        const r = await fetch("/api/categories");
        const data = await r.json();
        if (data?.categories) {
          setCategories(data.categories);
          writeCache("categories", data.categories);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!loggedIn || !user?.username) {
      setUserGames({});
      return;
    }
    (async () => {
      try {
        const url = `${API_BASE_URL}/auth/getAllGames`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username }),
        });
        const data = await r.json();
        const items = Array.isArray(data.list) ? data.list : data.games || data.items || [];

        const map = {};
        (items || []).forEach((it) => {
          const name =
            it.gameName ||
            it.game ||
            it.name ||
            it.title ||
            it.slug ||
            "";
          const status = it.status ?? it.state ?? it.gameStatus ?? it.statusCode ?? 0;
          const key = normalizeName(name);
          if (key) map[key] = Number(status);
        });
        setUserGames(map);
      } catch (err) {
        console.error("Failed to load user games", err);
        setUserGames({});
      }
    })();
  }, [loggedIn, user]);

  // realtime search
  useEffect(() => {
    const t = setTimeout(() => {
      if (
        q.trim().length > 2 &&
        !platform &&
        !vr &&
        !minRating &&
        !releasedFrom &&
        !releasedTo
      )
        runSearch({ page: 1 });
    }, 500);
    return () => clearTimeout(t);
  }, [q]);

  // close filter panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !e.target.classList.contains("filterToggle")
      )
        setShowFilters(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (
      selectedPlatforms.length ||
      vr ||
      minRating ||
      releasedFrom ||
      releasedTo ||
      sortOrder
    )
      return runAdvancedSearch();
    if (!q.trim())
      return cat ? loadByCategory({ page: 1 }) : loadDiscover({ page: 1 });
    runSearch({ page: 1 });
  };

  const goNext = () => {
    if (!hasNext) return;
    if (
      selectedPlatforms.length ||
      vr ||
      minRating ||
      releasedFrom ||
      releasedTo ||
      sortOrder
    )
      runAdvancedSearch(page + 1);
    else if (cat) loadByCategory({ page: page + 1 });
    else if (!q.trim()) loadDiscover({ page: page + 1 });
    else runSearch({ page: page + 1 });
  };

  const goPrev = () => {
    if (!hasPrev || page <= 1) return;
    if (
      selectedPlatforms.length ||
      vr ||
      minRating ||
      releasedFrom ||
      releasedTo ||
      sortOrder
    )
      runAdvancedSearch(page - 1);
    else if (cat) loadByCategory({ page: page - 1 });
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
      setDetails(await dRes.json());
      const c = await cRes.json();
      setComments(c.comments || []);
      setTimeout(() => modalRef.current?.focus(), 0);
    } catch {
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
      const r = await fetch(`/api/game/${selected.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
        text,
        rating: commentRating ? Number(commentRating) : null,
        user: user.username, 
      }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);

      const newComment = {
        text: data.comment.comment || text,
        username: user.username,
        at: new Date().toLocaleString(),
        rating: data.comment.rating || commentRating,
        _id: data.comment._id
      };


      setCommentInput("");
      setCommentRating("");
      setComments((prev) => [...prev, newComment]);
      setTab("comments");
    } catch {
      alert("Failed to save comment");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const key = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

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
    setSelectedPlatforms([]);
    loadDiscover({ page: 1 });
  };

  async function handleAddToList(game) {
    if (!loggedIn || !user) {
      alert("Please log in to save games.");
      return;
    }

    try {
      const r = await fetch(`${API_BASE_URL}/auth/addGameToList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          gameName: game.name,
          image: game.image || game.background_image || "",
          slug: game.slug,
          status: 0
        })
      });

      const data = await r.json();

      if (data.error === "GAME_ALREADY_EXISTS") {
        alert("This game is already in your list.");
        return;
      }

      if (!data.success) {
        console.error("ADD GAME ERROR:", data);
        alert("Failed to add game.");
        return;
      }

      setUserGames((prev) => ({ ...prev, [normalizeName(game.name)]: 0 }));
    } catch (err) {
      console.error("ADD GAME ERROR:", err);
      alert("Network error while adding game.");
    }
  }

  const handleAddFromModal = () => {
    if (!selected) return;
    handleAddToList(selected);
  }

  const handleStatusChange = async (gameOrName, newStatus) => {
    try {
      const gameObj =
        typeof gameOrName === "object" && gameOrName !== null
          ? gameOrName
          : { name: gameOrName };
      const name = gameObj.name || gameObj.gameName || "";
      const slug = gameObj.slug || gameObj.id || "";

      await fetch(`${API_BASE_URL}/auth/updateGameStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          // send both to be safe: backend can use whichever it expects
          gameName: name || undefined,
          newStatus: Number(newStatus),
          slug: slug || undefined,
        }),
      });

      setGameStatus(Number(newStatus));
      // update local in-memory map so dropdown displays correct value
      const keyForMap = normalizeName(name) || normalizeName(slug);
      if (keyForMap) {
        setUserGames((prev) => ({ ...prev, [keyForMap]: Number(newStatus) }));
      }
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err);
      alert("Failed to update status.");
    }
  }


  const headerTitle = cat ? (
    <>
      Category: <strong>{cat}</strong> — Page {page}
    </>
  ) : q.trim() ? (
    <>
      Results for <strong>{q}</strong> — Page {page}
    </>
  ) : (
    <>
      {" "}
      <strong>Discover Popular Games</strong> — Page {page}
    </>
  );

  return (
    <div className="layout">
      <header className="header">
        <button className="hamburger" onClick={() => setMenuOpen(true)}>
          ☰
        </button>

        <div className="brand" onClick={goHome} role="button" tabIndex={0}>
          GAMEVERSE
        </div>

        <form className="search" onSubmit={onSubmit}>
          <input
            className="searchInput"
            placeholder="Search games..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="select"
            value={cat}
            onChange={(e) => {
              const next = e.target.value;
              setCat(next);
              setQ("");
              setPage(1);
              next
                ? loadByCategory({ genre: next, page: 1 })
                : loadDiscover({ page: 1 });
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="filterToggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter ▾
          </button>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {showFilters && (
          <div className="filterPanel" ref={dropdownRef}>
            <h3 className="filterTitle">Platforms</h3>
            <div className="filterGrid">
              {[
                { id: "4", name: "PC" },
                { id: "187", name: "PS5" },
                { id: "18", name: "PS4" },
                { id: "1", name: "Xbox One" },
                { id: "7", name: "Nintendo Switch" },
              ].map((p) => (
                <label key={p.id} className="checkItem">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(p.id)}
                    onChange={() =>
                      setSelectedPlatforms((prev) =>
                        prev.includes(p.id)
                          ? prev.filter((x) => x !== p.id)
                          : [...prev, p.id]
                      )
                    }
                  />
                  {p.name}
                </label>
              ))}
            </div>

            <h3 className="filterTitle">VR Support</h3>
            <div className="vrRow">
              {["yes", "no"].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`vrBtn ${vr === v ? "active" : ""}`}
                  onClick={() => setVr(v)}
                >
                  {v.toUpperCase()}
                </button>
              ))}
            </div>

            <h3 className="filterTitle">Minimum Rating</h3>
            <select
              className="select"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
            >
              <option value="">Any</option>
              <option value="60">60+</option>
              <option value="70">70+</option>
              <option value="80">80+</option>
              <option value="90">90+</option>
            </select>

            <h3 className="filterTitle">Release Date</h3>
            <input
              type="date"
              className="searchInput"
              value={releasedFrom}
              onChange={(e) => setReleasedFrom(e.target.value)}
            />
            <input
              type="date"
              className="searchInput"
              value={releasedTo}
              onChange={(e) => setReleasedTo(e.target.value)}
            />

            <h3 className="filterTitle">Sort By Rating</h3>
            <select
              className="select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="">None</option>
              <option value="high">Highest → Lowest</option>
              <option value="low">Lowest → Highest</option>
            </select>
          </div>
        )}
      </header>

      <main className="main">
        <section className="results">
          {err && <div className="error">{err}</div>}
          {!loading && results.length === 0 && (
            <div className="error">No Results Found</div>
          )}

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
              (g, idx) => {
                if (loading) {
                  return (
                    <li key={idx} className="row">
                      <div className="rank skeleton" style={{ height: 18 }} />
                      <div className="cover skeleton" />
                      <div className="meta">
                        <div
                          className="skeleton"
                          style={{ height: 18, width: "40%", marginBottom: 6 }}
                        />
                        <div
                          className="skeleton"
                          style={{ height: 14, width: "70%" }}
                        />
                      </div>
                    </li>
                  );
                }

                const rank = (page - 1) * 24 + idx + 1;
                const name = g?.name || "";
                const key = normalizeName(name);
                const inList = loggedIn && userGames[key] != null;

                return (
                  <li key={g.id} className="row">
                    <div className="rank">{rank}</div>

                    <div className="addBtnWrapper">
                      {inList ? (
                        <select
                          value={userGames[key]}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(g, e.target.value)}
                          title="Change status"
                        >
                          <option value="0">Plan to Play</option>
                          <option value="1">Playing</option>
                          <option value="2">Completed</option>
                          <option value="3">Dropped</option>
                        </select>
                      ) : (
                        <button
                          className="addBtn"
                          onClick={() => handleAddToList(g)}
                          title="Add to your list"
                        >
                          +
                        </button>
                      )}
                    </div>

                    <div
                      className="cover"
                      onClick={() => openGame(g)}
                      role="button"
                      tabIndex={0}
                    >
                      {g.image ? <img loading="lazy" src={g.image} alt={name} /> : <div className="placeholder">No Image</div>}
                    </div>

                    <div className="meta">
                      <div
                        className="title"
                        onClick={() => openGame(g)}
                        role="button"
                        tabIndex={0}
                      >
                        {name}
                      </div>
                      <div className="sub">
                        <span className="badge">★ {g.rating ?? "—"}</span>
                        <span className="badge">📅 {g.released || "—"}</span>
                      </div>
                    </div>
                  </li>
                );
              }
            )}
          </ul>
        </section>

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
                      <img loading="lazy" src={g.image} alt={g.name} />
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

      <div className={`leftDrawer ${menuOpen ? "open" : ""}`}>
        <button className="drawerClose" onClick={() => setMenuOpen(false)}>
          ✕
        </button>
        <nav className="drawerMenu">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>
          <Link to="/yourlist" onClick={() => setMenuOpen(false)}>
            Your List
          </Link>
          <Link to="/settings" onClick={() => setMenuOpen(false)}>
            Settings
          </Link>
        </nav>
        <div className="drawerAuthFooter">
          {!loggedIn ? (
            <Link
              to="/login"
              className="drawerLoginBtn"
              onClick={() => setMenuOpen(false)}
            >
              Log In
            </Link>
          ) : (
            <div className="drawerUserBlock">
              <p>
                Logged in as <b>{user?.username}</b>
              </p>
              <button
                className="drawerLogoutBtn"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
      {menuOpen && (
        <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />
      )}

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
            <button className="closeX" onClick={closeModal}>
              ✕
            </button>

            {loggedIn && userGames[normalizeName(selected.name)] != null ? (
              <div className="addBtnWrapper2">
               <div className="modalStatus">
                 <select
                   value={userGames[normalizeName(selected.name)]}
                   onChange={(e) => handleStatusChange(selected, e.target.value)}
                 >
                   <option value="0">Plan to Play</option>
                   <option value="1">Playing</option>
                   <option value="2">Completed</option>
                   <option value="3">Dropped</option>
                 </select>
               </div>
               </div>
             ) : (
               <button
                 className="addDetailBtn"
                 onClick={handleAddFromModal}
                 title="Add to your list"
               >
                 +
               </button>
             )}
            <div className="modalHeader">
              {details?.image && (
                <img
                  className="modalCover"
                  src={details.image}
                  alt={details?.name}
                />
              )}
              <div className="modalHeadMeta">
                <h2 className="modalTitle">{details?.name || selected.name}</h2>
                <div className="modalSub">
                  {details?.released ? `Released: ${details.released}` : "—"} ·
                  Rating: {details?.rating ?? selected.rating ?? "—"}{" "}
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
                      <li>
                        <strong>Platforms:</strong>{" "}
                        {details?.platforms?.join(", ") || "—"}
                      </li>
                      <li>
                        <strong>VR Compatible:</strong>{" "}
                        {details?.vr_supported === "Yes" ? (
                          <>Yes ✨ ✔️</>
                        ) : (
                          <>No ✖️</>
                        )}
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
                      
                      <div className="ratingRow">
                        <label>Rating: </label>
                        <select
                          value={commentRating}
                          onChange={(e) => setCommentRating(e.target.value)}
                        >
                          <option value="">No Rating</option>
                          {[1,2,3,4,5].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Write your thoughts…"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                      />

                      
                      
                      <div className="right">
                        <button
                          className="btn"
                          disabled={saving || !commentInput.trim()|| !commentRating || !user?.username}
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
                        <div className="commentText">{c.rating} ★ - {c.text}</div>
                        <div className="commentMeta">
                          {c.username} · {c.at}

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
