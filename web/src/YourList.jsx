import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./App.css";
import "./dashboard.css"; // optional styling file if not already imported

function YourList() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, user, logout } = useAuth();

  // NEW STATE (correct location)
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // LOAD USER’S SAVED GAMES
  // ============================
  useEffect(() => {
    async function loadList() {
      if (!loggedIn || !user) {
        setLoading(false);
        return;
      }

      try {
        const r = await fetch("http://localhost:8080/auth/getAllGames", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username })
        });

        const data = await r.json();

        if (data.success && Array.isArray(data.list)) {
          setGames(data.list);
        }
      } catch (err) {
        console.error("ERROR LOADING LIST:", err);
      }

      setLoading(false);
    }

    loadList();
  }, [loggedIn, user]);

  // ============================
  // UPDATE STATUS IN DB + UI
  // ============================
  async function updateStatus(gameName, newStatus) {
  try {
    await fetch("http://localhost:8080/auth/updateGameStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        gameName,
        newStatus: Number(newStatus)
      })
    });

    setGames((prev) =>
      prev.map((g) =>
        g.game === gameName ? { ...g, status: Number(newStatus) } : g
      )
    );
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
  }
}

  const handleDisableClick = (e) => {
    e.preventDefault();
    setMenuOpen(false);
  };

  return (
    <div className="layout">
      {/* HEADER */}
      <header className="header">
        <button className="hamburger" onClick={() => setMenuOpen(true)}>☰</button>
        <div className="brand" role="button" tabIndex={0}>
          GAMEVERSE
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="main dashboardMain">
        {!loggedIn ? (
          <div className="loginPromptContainer">
            <h1>Please log in to view your games list.</h1>
            <Link to="/login" className="btn loginPromptBtn">
              Go to Login
            </Link>
          </div>
        ) : loading ? (
          <h1>Loading your games...</h1>
        ) : (
          <>
            <h1>Your Games List, {user?.username}</h1>

            {games.length === 0 ? (
              <p>You have not added any games yet.</p>
            ) : (
              <ul className="yourListGrid">
                {games.map((g, idx) => (
                  <li key={idx} className="yourListItem">
                    <img
                      src={g.image || "/placeholder.jpg"}
                      alt={g.gameName}
                      className="yourListImg"
                    />

                    <div className="yourListInfo">
                      <h3 className="yourListTitle">{g.gameName}</h3>

                      {g.slug && (
                        <p className="yourListSlug">Slug: {g.slug}</p>
                      )}

                      <div className="yourListStatus">
                        <label>Status:</label>
                        <select
  value={g.status}
  onClick={(e) => e.stopPropagation()}
  onChange={(e) => updateStatus(g.game, e.target.value)}
>
                          <option value="0">Plan to Play</option>
                          <option value="1">Playing</option>
                          <option value="2">Completed</option>
                          <option value="3">Dropped</option>
                        </select>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {/* LEFT DRAWER SIDEBAR */}
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

      {menuOpen && <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

export default YourList;
