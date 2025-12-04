import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./App.css";
import "./dashboard.css";

function YourList() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, user, logout } = useAuth();

  const API_BASE_URL =
    "https://my-backend-api.23gzti4bhp77.ca-tor.codeengine.appdomain.cloud";

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // helper: try to enrich a saved game entry with site search results (id, image, slug, name)
  async function enrichSavedGames(savedList) {
    if (!Array.isArray(savedList) || savedList.length === 0) return [];
    // limit concurrent lookups to avoid spamming server - perform in parallel here but could be batched
    const lookups = savedList.map(async (item) => {
      const query = item.slug || item.gameName || "";
      if (!query) return { ...item, image: item.image || "", id: item.id || null };
      try {
        const r = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&page=1&page_size=3`
        );
        const data = await r.json();
        const results = Array.isArray(data.results) ? data.results : [];
        // prefer slug match, then exact name, then first result
        const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");
        const targetSlug = norm(item.slug);
        const targetName = norm(item.gameName);
        let match =
          results.find((res) => targetSlug && norm(res.slug) === targetSlug) ||
          results.find((res) => targetName && norm(res.name) === targetName) ||
          results[0] ||
          null;
        return {
          ...item,
          id: item.id || (match ? match.id : null),
          image: item.image || (match ? match.image || match.background_image : "") || "",
          slug: item.slug || (match ? match.slug : ""),
          gameName: item.gameName || (match ? match.name : "") || "",
        };
      } catch (err) {
        console.error("Enrich lookup failed for", query, err);
        return { ...item, image: item.image || "", id: item.id || null };
      }
    });

    return Promise.all(lookups);
  }

  // Load saved games
  useEffect(() => {
    async function loadList() {
      if (!loggedIn || !user) {
        setLoading(false);
        return;
      }

      try {
        const r = await fetch(`${API_BASE_URL}/auth/getAllGames`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username })
        });

        const data = await r.json();

        if (data.success && Array.isArray(data.list)) {
          // enrich each saved entry with site game metadata (image, id, slug, name)
          const enriched = await enrichSavedGames(data.list);
          setGames(enriched);
        } else {
          setGames([]);
        }
      } catch (err) {
        console.error("ERROR LOADING LIST:", err);
        setGames([]);
      }

      setLoading(false);
    }

    loadList();
  }, [loggedIn, user]);

  // Update status
  async function updateStatus(gameName, newStatus) {
    try {
      await fetch(`${API_BASE_URL}/auth/updateGameStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          gameName,
          newStatus: Number(newStatus)
        })
      });

      // Update UI
      setGames((prev) =>
        prev.map((g) =>
          g.gameName === gameName
            ? { ...g, status: Number(newStatus) }
            : g
        )
      );
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err);
    }
  }

  return (
    <div className="layout">
      {/* HEADER */}
      <header className="header">
        <button className="hamburger" onClick={() => setMenuOpen(true)}>☰</button>
        <div className="brand">GAMEVERSE</div>
      </header>

      {/* MAIN */}
      <main className="main yourListMain">
        {!loggedIn ? (
          <div className="loginPromptContainer">
            <h1>Please log in to view your games list.</h1>
            <Link to="/login" className="btn loginPromptBtn">Go to Login</Link>
          </div>
        ) : loading ? (
          <h1>Loading your games...</h1>
        ) : (
          <>
            <h1>Your Games List, {user?.username}</h1>

            {/* DEBUG: show raw games storage so you can inspect how entries are stored */}
            <div style={{ margin: "12px 0" }}>
              <h4>Raw games state (debug)</h4>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 300,
                  overflow: "auto",
                  background: "#f8f8f8",
                  padding: 8,
                  borderRadius: 4,
                }}
              >
                {JSON.stringify(games, null, 2)}
              </pre>
            </div>

            {games.length === 0 ? (
              <p>You have not added any games yet.</p>
            ) : (
              <ul className="yourListGrid">
                {games.map((g, idx) => (
                  <li key={idx} className="yourListItem">

  {/* IMAGE LEFT */}
  <img
    className="yourListImg"
    src={g.image || ""}
    alt={g.gameName || "Game"}
  />

  {/* GAME INFO CENTER */}
  <div className="yourListInfo">
    <h3 className="yourListTitle">{g.gameName}</h3>
    {g.slug && <p className="yourListSlug">{g.slug}</p>}
    {/* link to game page if we have an id */}
    {g.id ? (
      <Link to={`/game/${g.id}`} className="btn small">View</Link>
    ) : null}
  </div>

  {/* STATUS DROPDOWN RIGHT */}
  <div className="yourListStatusRight">
    <label>Status: </label>
    <select
      value={g.status ?? 0}
      onChange={(e) => updateStatus(g.gameName, e.target.value)}
    >
      <option value="0">Plan to Play</option>
      <option value="1">Playing</option>
      <option value="2">Completed</option>
      <option value="3">Dropped</option>
    </select>
  </div>

</li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {/* SIDEBAR */}
      <div className={`leftDrawer ${menuOpen ? "open" : ""}`}>
        <button className="drawerClose" onClick={() => setMenuOpen(false)}>✕</button>
        <nav className="drawerMenu">
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/yourlist" onClick={() => setMenuOpen(false)}>Your List</Link>
          <Link to="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
        </nav>
        <div className="drawerAuthFooter">
          {loggedIn ? (
            <div className="drawerUserBlock">
              <p>Logged in as <b>{user?.username}</b></p>
              <button className="drawerLogoutBtn" onClick={logout}>Log Out</button>
            </div>
          ) : (
            <Link to="/login" className="drawerLoginBtn">Log In</Link>
          )}
        </div>
      </div>

      {menuOpen && <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

export default YourList;
