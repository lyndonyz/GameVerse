import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarValue, setCalendarValue] = useState(new Date());
  const API_BASE_URL = "http://localhost:8000";

  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [total, setTotal] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

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
          const cu = (c.username || c.user || c.author || c.userId || c.user_id || "").toString().toLowerCase();
          const cemail = (c.email || c.userEmail || "").toString().toLowerCase();
          if (!cu && !cemail && !c._id) return false;
          if (cu && (cu === uname || cu === uid)) return true;
          if (cemail && user.email && cemail === String(user.email).toLowerCase()) return true;
          if (c.user && typeof c.user === "object") {
            if (String(c.user.username || "").toLowerCase() === uname) return true;
            if (String(c.user.id || c.user._id || "").toLowerCase() === uid) return true;
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

  // delete comment handler
  async function handleDeleteComment(id) {
    if (!id) return;
    const ok = window.confirm("Delete this comment? This action cannot be undone.");
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/deleteComment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await res.json();
      if (!res.ok || payload?.success === false) {
        const errMsg = payload?.error || payload?.message || "Delete failed";
        alert("Failed to delete comment: " + errMsg);
        return;
      }
      // remove from UI
      setComments((prev) => prev.filter((c) => String(c.id) !== String(id)));
    } catch (err) {
      console.error("delete comment error", err);
      alert("Failed to delete comment (network error)");
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
      <div key={c.id || `${c.createdAtRaw || ""}-${Math.random()}`} className="comment-box">
        <div className="comment-meta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="comment-date">
            {c.createdAtTs ? new Date(c.createdAtTs).toLocaleString() : c.createdAtRaw || ""}
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

      <main className="main">
        <section className="results">
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
                    Total games: <span style={{ color: "var(--primary)" }}>{total}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                {statusLabels.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedStatus(selectedStatus === i ? null : i)}
                    className={`statusFilterBtn ${selectedStatus === i ? "active" : ""}`}
                    aria-pressed={selectedStatus === i}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    <span className={`filterDot status-${i}`} />
                    <span style={{ fontWeight: 700 }}>{label}</span>
                    <span style={{ marginLeft: 6, opacity: 0.9 }}>({counts[i]})</span>
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
                  <div className="comments-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div className="comments-title" style={{ fontWeight: 700 }}>Your comments</div>
                    <div className="comments-count" style={{ color: "var(--muted)" }}>{comments.length} total</div>
                  </div>

                  <div className="comments-scroll">
                    {commentsContent}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="sidebar">
          {!loggedIn ? null : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: "var(--muted)", marginBottom: 6 }}>{formattedDate}</div>
                <div style={{ fontWeight: 700, color: "var(--primary)" }}>{formattedTime}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <Calendar onChange={setCalendarValue} value={calendarValue} locale="en-US" />
                <div style={{ marginTop: 8, color: "var(--muted)" }}>Selected: {calendarValue.toLocaleDateString()}</div>
              </div>
            </>
          )}
        </aside>
      </main>

      <div className={`leftDrawer ${menuOpen ? "open" : ""}`}>
        <button className="drawerClose" onClick={() => setMenuOpen(false)}>✕</button>
        <nav className="drawerMenu">
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/yourlist" onClick={() => setMenuOpen(false)}>Your List</Link>
          <Link to="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
        </nav>
        <div className="drawerAuthFooter">
          {!loggedIn ? (
            <Link to="/login" className="drawerLoginBtn" onClick={() => setMenuOpen(false)}>Log In</Link>
          ) : (
            <div className="drawerUserBlock">
              <p>Logged in as <b>{user?.username}</b></p>
              <button className="drawerLogoutBtn" onClick={() => { logout(); setMenuOpen(false); }}>Log Out</button>
            </div>
          )}
        </div>
      </div>

      {menuOpen && <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

export default Dashboard;