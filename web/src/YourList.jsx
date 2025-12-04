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

  // Load saved games
  useEffect(() => {
    async function loadList() {
      if (!loggedIn || !user) {
        setLoading(false);
        return;
      }

      try {
        // const r = await fetch(`${API_BASE_URL}/auth/getAllGames`, {
        const r = await fetch("http://localhost:8000/auth/getAllGames", {
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

            {games.length === 0 ? (
              <p>You have not added any games yet.</p>
            ) : (
              <ul className="yourListGrid">
                {games.map((g, idx) => (
                  <li key={idx} className="yourListItem">

  {/* IMAGE LEFT */}
  <img
    className="yourListImg"
    src={g.image}
    alt={g.gameName}
  />

  {/* GAME INFO CENTER */}
  <div className="yourListInfo">
    <h3 className="yourListTitle">{g.gameName}</h3>
    {g.slug && <p className="yourListSlug">{g.slug}</p>}
  </div>

  {/* STATUS DROPDOWN RIGHT */}
  <div className="yourListStatusRight">
    <label>Status: </label>
    <select
      value={g.status}
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
