import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { useServiceStatus } from "./useServiceStatus.js";
import "./App.css";
import "./dashboard.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const { isServiceActive, isServiceActiveAndLoaded, isServiceActiveOrLoading, loading: servicesLoading } = useServiceStatus();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarValue, setCalendarValue] = useState(new Date());
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [total, setTotal] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [randomPicks, setRandomPicks] = useState([]);
  const [loadingPicks, setLoadingPicks] = useState(false);
  const recentShownRef = useRef(new Set());
  const recentQueueRef = useRef([]);
  const RECENT_MAX = 30;
  const [userGames, setUserGames] = useState({});

  const normalizeName = (n) => (n || "").toString().trim().toLowerCase();
  const analyticsActiveOrLoading = isServiceActiveOrLoading("Analytics & Visualization");
  const analyticsActiveAndLoaded = isServiceActiveAndLoaded("Analytics & Visualization");
  const userLibraryActiveAndLoaded = isServiceActiveAndLoaded("User Library");
  const analyticsActive = isServiceActive("Analytics & Visualization");
  const userLibraryActive = isServiceActive("User Library");
  
  const isAdmin = user?.username?.toLowerCase() === "admin";

  // Redirect non-admin users if service is down
  useEffect(() => {
    if (loggedIn && !analyticsActiveOrLoading && !isAdmin) {
      navigate("/");
    }
  }, [loggedIn, analyticsActiveOrLoading, isAdmin, navigate]);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
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
        const items = Array.isArray(data.list)
          ? data.list
          : data.games || data.items || [];
        const map = {};
        (items || []).forEach((it) => {
          const name =
            it.gameName || it.game || it.name || it.title || it.slug || "";
          const status = Number(it.status ?? 0);
          const key = normalizeName(name);
          if (key) map[key] = status;
        });
        setUserGames(map);
      } catch (err) {
        console.error("Failed to load user games", err);
        setUserGames({});
      }
    })();
  }, [loggedIn, user]);

  useEffect(() => {
    async function loadCounts() {
      if (!loggedIn || !user) return;
      try {
        const r = await fetch(`${API_BASE_URL}/auth/getAllGames`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username }),
        });
        const data = await r.json();
        const list = Array.isArray(data.list) ? data.list : [];
        const c = [0, 0, 0, 0];
        for (const item of list) {
          const s = Number(item.status ?? 0);
          if (s >= 0 && s <= 3) c[s] += 1;
        }
        setCounts(c);
        setTotal(list.length);
      } catch (err) {
        console.error("Failed to load user games for dashboard", err);
      }
    }
    loadCounts();
  }, [loggedIn, user]);

  useEffect(() => {
    async function loadComments() {
      if (!loggedIn || !user) return;
      setLoadingComments(true);
      try {
        const r = await fetch(`${API_BASE_URL}/auth/getAllComments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await r.json();
        const all = Array.isArray(data.comments) ? data.comments : [];

        const userComments = all.filter((c) => {
          const uname = String(user.username || "").toLowerCase();
          const uid = String(user.id || user._id || "").toLowerCase();
          const cu = (
            c.username ||
            c.user ||
            c.author ||
            c.userId ||
            c.user_id ||
            ""
          )
            .toString()
            .toLowerCase();
          const cemail = (c.email || c.userEmail || "")
            .toString()
            .toLowerCase();
          if (!cu && !cemail && !c._id) return false;
          if (cu && (cu === uname || cu === uid)) return true;
          if (
            cemail &&
            user.email &&
            cemail === String(user.email).toLowerCase()
          )
            return true;
          if (c.user && typeof c.user === "object") {
            if (String(c.user.username || "").toLowerCase() === uname)
              return true;
            if (String(c.user.id || c.user._id || "").toLowerCase() === uid)
              return true;
          }
          return false;
        });

        const normalized = userComments
          .map((c) => {
            const rawCreated =
              c.createdAt ||
              c.created_at ||
              c.timestamp ||
              c.ts ||
              c.time ||
              c.postedAt ||
              c.date ||
              null;
            let ts = null;
            if (rawCreated) {
              const parsed = Date.parse(rawCreated);
              if (!isNaN(parsed)) ts = parsed;
              else {
                const isoTry = new Date(rawCreated).getTime();
                if (!isNaN(isoTry)) ts = isoTry;
              }
            }
            return {
              id: c.id || c._id,
              body: c.body || c.comment || c.text || "",
              createdAtRaw: rawCreated,
              createdAtTs: ts,
            };
          })
          .sort((a, b) => {
            const ta = a.createdAtTs || 0;
            const tb = b.createdAtTs || 0;
            return tb - ta;
          });

        setComments(normalized);
      } catch (err) {
        console.error("Failed to load user comments", err);
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
    loadComments();
  }, [loggedIn, user]);
  async function fetchRandomPicks() {
    setLoadingPicks(true);
    try {
      const shuffle = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };
      const uniqueById = (arr) => {
        const seen = new Set();
        return arr.filter((it) => {
          const k = (
            it.id ||
            it.slug ||
            it.name ||
            JSON.stringify(it)
          ).toString();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      };
      const randInt = (min, max) =>
        Math.floor(Math.random() * (max - min + 1)) + min;
      const randChoice = (a) => a[Math.floor(Math.random() * a.length)];
      let pool = [];

      const avoidNames = new Set(Object.keys(userGames || {}));
      const recentIds = new Set(Array.from(recentShownRef.current || []));
      const mergeResults = (resObj) => {
        if (!resObj) return;
        if (Array.isArray(resObj.results)) pool = pool.concat(resObj.results);
        else if (Array.isArray(resObj)) pool = pool.concat(resObj);
        else if (Array.isArray(resObj.data)) pool = pool.concat(resObj.data);
      };

      try {
        const orderings = [
          "",
          "rating",
          "-rating",
          "released",
          "-released",
          "name",
          "-name",
        ];
        const pagesToTry = [randInt(1, 6), randInt(1, 8), randInt(1, 12)];
        await Promise.all(
          pagesToTry.map(async (pg) => {
            const pageSize = 100;
            const ordering = randChoice(orderings);
            const url = `/api/discover?page=${pg}&page_size=${pageSize}${
              ordering ? `&ordering=${ordering}` : ""
            }`;
            try {
              const r = await fetch(url);
              if (r.ok) mergeResults(await r.json());
            } catch (e) {}
          })
        );
      } catch (e) {
        console.warn("discover sweep failed", e);
      }
      try {
        const terms = [
          "game",
          "adventure",
          "action",
          "puzzle",
          "rpg",
          "indie",
          "multiplayer",
          "strategy",
          "racing",
          "platformer",
        ];
        const sampleTerms = Array.from({ length: 4 }, () => randChoice(terms));
        const searchPromises = sampleTerms.map((t) => {
          const page = randInt(1, 6);
          const pageSize = 40;
          const year = randInt(1990, new Date().getFullYear());
          const url = `/api/search?q=${encodeURIComponent(
            t
          )}&page=${page}&page_size=${pageSize}&releasedFrom=${year}-01-01&releasedTo=${year}-12-31`;
          return fetch(url)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);
        });
        const settled = await Promise.all(searchPromises);
        for (const s of settled) if (s) mergeResults(s);
      } catch (e) {
        console.warn("randomized search sampling failed", e);
      }

      if (pool.length < 40) {
        try {
          const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY || "";
          if (RAWG_KEY) {
            const metaRes = await fetch(
              `https://api.rawg.io/api/games?key=${encodeURIComponent(
                RAWG_KEY
              )}&page_size=1`
            );
            if (metaRes.ok) {
              const meta = await metaRes.json();
              const total = Number(meta.count || 0) || 1000;
              const pageSize = 20;
              const page = randInt(
                1,
                Math.min(Math.ceil(total / pageSize), 500)
              );
              const res = await fetch(
                `https://api.rawg.io/api/games?key=${encodeURIComponent(
                  RAWG_KEY
                )}&page_size=${pageSize}&page=${page}`
              );
              if (res.ok) {
                const d = await res.json();
                mergeResults(d);
              }
            }
          }
        } catch (e) {
          console.warn("RAWG sample failed", e);
        }
      }

      pool = uniqueById(pool).map((g) => {
        const name = (
          g.name ||
          g.title ||
          g.gameName ||
          g.slug ||
          ""
        ).toString();
        const nid = (g.id || g.slug || name).toString();
        return { ...g, _normName: name.trim().toLowerCase(), _nid: nid };
      });

      pool = pool.filter((g) => {
        if (!g) return false;
        if (!g._normName) return true;
        if (avoidNames.has(g._normName)) return false;
        if (recentIds.has(g._nid) || recentIds.has(g._normName)) return false;
        return true;
      });

      shuffle(pool);
      const modifiers = [
        (g) => g,
        (g) => (g.rating && Math.random() < 0.8 ? g : null),
        (g) => (g.released && Math.random() < 0.65 ? g : null),
        (g) => g,
      ];
      const modified = pool
        .map((g) =>
          Math.random() < 0.45
            ? modifiers[Math.floor(Math.random() * modifiers.length)](g)
            : g
        )
        .filter(Boolean);

      shuffle(modified);
      let picks = modified.slice(0, 5);

      if (picks.length < 5) {
        const relaxed = uniqueById(pool.concat(modified).filter(Boolean)).slice(
          0,
          8
        );
        shuffle(relaxed);
        picks = relaxed.slice(0, 5);
      }

      for (const p of picks) {
        const idKey =
          p._nid || p._normName || (p.id || p.slug || p.name || "").toString();
        if (!recentShownRef.current.has(idKey)) {
          recentShownRef.current.add(idKey);
          recentQueueRef.current.push(idKey);
        }
      }
      while (recentQueueRef.current.length > RECENT_MAX) {
        const removed = recentQueueRef.current.shift();
        if (removed) recentShownRef.current.delete(removed);
      }

      setRandomPicks(picks);
    } catch (err) {
      console.error("Failed to load random picks:", err);
      setRandomPicks([]);
    } finally {
      setLoadingPicks(false);
    }
  }

  useEffect(() => {
    if (loggedIn) fetchRandomPicks();
  }, [loggedIn]);

  // add to user's list
  async function handleAddToList(game) {
    if (!loggedIn || !user) {
      alert("Please log in to save games.");
      return;
    }

    const name = game.name || game.gameName || game.title || game.slug || "";
    const image =
      game.image ||
      game.background_image ||
      game.backgroundImage ||
      game.image_url ||
      "";
    const slug = game.slug || game.id || "";

    try {
      const r = await fetch(`${API_BASE_URL}/auth/addGameToList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          gameName: name,
          image,
          slug,
          status: 0,
        }),
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

      // update local map and stats
      setUserGames((prev) => {
        const key = normalizeName(name);
        if (prev[key] != null) return prev;
        const next = { ...prev, [key]: 0 };
        return next;
      });

      setCounts((prev) => {
        const copy = Array.isArray(prev) ? [...prev] : [0, 0, 0, 0];
        copy[0] = (copy[0] || 0) + 1;
        return copy;
      });
      setTotal((t) => (Number(t) || 0) + 1);
    } catch (err) {
      console.error("ADD GAME ERROR:", err);
      alert("Network error while adding game.");
    }
  }

  // status change for a saved game from picks UI
  async function handleStatusChangeFromPick(game, newStatus) {
    if (!loggedIn || !user) return;
    const name = game.name || game.gameName || game.title || game.slug || "";
    const key = normalizeName(name);
    const parsedNew = Number(newStatus);
    try {
      await fetch(`${API_BASE_URL}/auth/updateGameStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          gameName: name,
          newStatus: parsedNew,
          slug: game.slug || game.id || undefined,
        }),
      });

      setUserGames((prev) => {
        const prevStatus = prev[key];
        const next = { ...(prev || {}), [key]: parsedNew };

        // update counts
        setCounts((countsPrev) => {
          const c = Array.isArray(countsPrev) ? [...countsPrev] : [0, 0, 0, 0];
          if (
            typeof prevStatus === "number" &&
            prevStatus >= 0 &&
            prevStatus <= 3
          ) {
            c[prevStatus] = Math.max(0, (c[prevStatus] || 0) - 1);
          }
          if (parsedNew >= 0 && parsedNew <= 3) {
            c[parsedNew] = (c[parsedNew] || 0) + 1;
          }
          return c;
        });

        return next;
      });
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status.");
    }
  }

  // delete comment handler
  async function handleDeleteComment(id) {
    if (!id) return;
    const ok = window.confirm(
      "Delete this comment? This action cannot be undone."
    );
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/deleteComment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "<no body>");
        console.error(
          "deleteComment bad response",
          res.status,
          res.statusText,
          text
        );
        alert(`Delete failed: ${res.status} ${res.statusText}\n${text}`);
        return;
      }

      const payload = await res.json().catch(() => null);
      if (!payload || payload.success === false) {
        console.error("deleteComment payload error", payload);
        alert(
          "Failed to delete comment: " +
            (payload?.error || payload?.message || "unknown")
        );
        return;
      }
      setComments((prev) => prev.filter((c) => String(c.id) !== String(id)));
    } catch (err) {
      console.error("delete comment network error:", err);
      alert("Failed to delete comment (network error). Check server/network.");
    }
  }

  const formattedTime = currentTime.toLocaleTimeString();
  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusLabels = ["Plan to Play", "Playing", "Completed", "Dropped"];
  const statusColors = ["#6b7280", "#16a34a", "#2563eb", "#ef4444"];

  const pieData = {
    labels: statusLabels,
    datasets: [
      {
        data: counts,
        backgroundColor: statusColors,
        borderColor: "rgba(0,0,0,0.06)",
        borderWidth: 1,
      },
    ],
  };

  const commentsContent = loadingComments ? (
    <div className="comment-loading">Loading comments…</div>
  ) : comments.length === 0 ? (
    <div className="no-comments">You haven't posted any comments yet.</div>
  ) : (
    comments.map((c) => (
      <div
        key={c.id || `${c.createdAtRaw || ""}-${Math.random()}`}
        className="comment-box"
      >
        <div
          className="comment-meta"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="comment-date">
            {c.createdAtTs
              ? new Date(c.createdAtTs).toLocaleString()
              : c.createdAtRaw || ""}
          </div>
          <button
            onClick={() => handleDeleteComment(c.id)}
            style={{
              marginLeft: 12,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#fff",
              padding: "6px 8px",
              borderRadius: 8,
              cursor: "pointer",
            }}
            aria-label="Delete comment"
          >
            Delete
          </button>
        </div>
        <div className="comment-body">{c.body || ""}</div>
      </div>
    ))
  );

  return (
    <div className="layout">
      <header className="header">
        <button className="hamburger" onClick={() => setMenuOpen(true)}>
          ☰
        </button>
        <div className="brand" role="button" tabIndex={0}>
          GAMEVERSE
        </div>
      </header>

      {loggedIn && isAdmin && !analyticsActive && (
        <div style={{
          background: "linear-gradient(135deg, #ff3b30, #ff453a)",
          color: "#fff",
          padding: "12px 16px",
          textAlign: "center",
          fontWeight: "700",
          fontSize: "14px",
          borderBottom: "2px solid #ff6961",
          boxShadow: "0 4px 12px rgba(255, 59, 48, 0.3)"
        }}>
          WARNING: Analytics & Visualization service is currently DOWN
        </div>
      )}

      <main className="main">
        <section className="results" style={{ minHeight: "calc(100vh - 120px)" }}>
          {!loggedIn ? (
            <div className="loginPromptContainer">
              <h1>Please log in to view your dashboard.</h1>
              <Link to="/login" className="btn loginPromptBtn">
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="listHeader">
                <h2>Your Dashboard, {user?.username}</h2>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ fontWeight: 700 }}>
                    Total games:{" "}
                    <span style={{ color: "var(--primary)" }}>{total}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                {statusLabels.map((label, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setSelectedStatus(selectedStatus === i ? null : i)
                    }
                    className={`statusFilterBtn ${
                      selectedStatus === i ? "active" : ""
                    }`}
                    aria-pressed={selectedStatus === i}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span className={`filterDot status-${i}`} />
                    <span style={{ fontWeight: 700 }}>{label}</span>
                    <span style={{ marginLeft: 6, opacity: 0.9 }}>
                      ({counts[i]})
                    </span>
                  </button>
                ))}
              </div>

              <div className="dashboard-main-row">
                <div className="pie-column">
                  <div style={{ padding: 8 }}>
                    <div style={{ maxWidth: 520 }}>
                      <Pie data={pieData} />
                    </div>
                  </div>
                </div>

                <div className="comments-column">
                  <div
                    className="comments-header"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <div className="comments-title" style={{ fontWeight: 700 }}>
                      Your comments
                    </div>
                    <div
                      className="comments-count"
                      style={{ color: "var(--muted)" }}
                    >
                      {comments.length} total
                    </div>
                  </div>

                  <div className="comments-scroll">{commentsContent}</div>
                </div>
              </div>

              <div className="random-picks-section" style={{ marginTop: 24 }}>
                <div
                  className="section-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div className="section-title" style={{ fontWeight: 700 }}>
                    Random Game Picks For You, {user?.username}
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => fetchRandomPicks()}
                    disabled={loadingPicks}
                    aria-label="Refresh random picks"
                    style={{ paddingLeft: 12, paddingRight: 12 }}
                  >
                    {loadingPicks ? "Refreshing…" : "Refresh"}
                  </button>
                </div>

                {loadingPicks ? (
                  <div className="random-picks-loading" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    Loading picks…
                  </div>
                ) : randomPicks.length === 0 ? (
                  <div className="no-random-picks" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    No game picks available.
                  </div>
                ) : (
                  <ul className="list">
                    {randomPicks.map((g, idx) => {
                      const name =
                        g.name || g.title || g.gameName || g.slug || "Untitled";
                      const key = g.id || g.slug || `${name}-${idx}`;
                      const img =
                        g.image ||
                        g.background_image ||
                        g.backgroundImage ||
                        g.image_url ||
                        "";
                      const rating = g.rating ?? g.score ?? g.rtg ?? null;
                      const inList =
                        loggedIn && userGames[normalizeName(name)] != null;

                      return (
                        <li key={key} className="row">
                          <div className="rank">{idx + 1}</div>

                          {(userLibraryActive || isAdmin) && (
                            <div className="addBtnWrapper">
                              {inList ? (
                                <select
                                  value={String(userGames[normalizeName(name)])}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    handleStatusChangeFromPick(g, e.target.value)
                                  }
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
                          )}

                          <div
                            className="cover"
                            role="button"
                            tabIndex={0}
                            style={{ cursor: "default" }}
                          >
                            {img ? (
                              <img loading="lazy" src={img} alt={name} />
                            ) : (
                              <div className="placeholder">No Image</div>
                            )}
                          </div>

                          <div className="meta">
                            <div className="title">{name}</div>
                            <div className="sub">
                              <span className="badge">★ {rating ?? "—"}</span>
                              <span className="badge">
                                📅 {g.released || g.releaseDate || "—"}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>

        <aside className="sidebar">
          {!loggedIn ? null : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: "var(--muted)", marginBottom: 6 }}>
                  {formattedDate}
                </div>
                <div style={{ fontWeight: 700, color: "var(--primary)" }}>
                  {formattedTime}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <Calendar
                  onChange={setCalendarValue}
                  value={calendarValue}
                  locale="en-US"
                />
                <div style={{ marginTop: 8, color: "var(--muted)" }}>
                  Selected: {calendarValue.toLocaleDateString()}
                </div>
              </div>
            </>
          )}
        </aside>
      </main>

      <div className={`leftDrawer ${menuOpen ? "open" : ""}`}>
        <button className="drawerClose" onClick={() => setMenuOpen(false)}>
          ✕
        </button>
        {servicesLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            Loading menu...
          </div>
        ) : (
          <nav className="drawerMenu">
            <Link to="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            {(analyticsActive || isAdmin) && (
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
            )}
            {(userLibraryActive || isAdmin) && (
              <Link to="/yourlist" onClick={() => setMenuOpen(false)}>
                Your List
              </Link>
            )}
            <Link to="/settings" onClick={() => setMenuOpen(false)}>
              Settings
            </Link>
            {loggedIn && user?.username?.toLowerCase() === "admin" && (
              <Link to="/admin/services" onClick={() => setMenuOpen(false)}>
                Service Registry
              </Link>
            )}
          </nav>
        )}
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
    </div>
  );
}

export default Dashboard;
