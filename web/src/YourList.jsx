import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { useServiceStatus } from "./useServiceStatus.js";
import "./App.css";
import "./dashboard.css";

function YourList() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const { isServiceActive, isServiceActiveAndLoaded, isServiceActiveOrLoading, loading: servicesLoading } = useServiceStatus();
  
  // For redirects, use isServiceActiveOrLoading to prevent premature redirects
  const userLibraryActiveOrLoading = isServiceActiveOrLoading("User Library");
  
  // For navigation, use isServiceActiveAndLoaded to hide while loading
  const analyticsActiveAndLoaded = isServiceActiveAndLoaded("Analytics & Visualization");
  const userLibraryActiveAndLoaded = isServiceActiveAndLoaded("User Library");
  
  // For UI elements, use isServiceActive for immediate response
  const analyticsActive = isServiceActive("Analytics & Visualization");
  const userLibraryActive = isServiceActive("User Library");
  
  const isAdmin = user?.username?.toLowerCase() === "admin";

  // Redirect non-admin users if User Library service is down
  useEffect(() => {
    if (loggedIn && !userLibraryActiveOrLoading && !isAdmin) {
      navigate("/");
    }
  }, [loggedIn, userLibraryActiveOrLoading, isAdmin, navigate]);

  const API_BASE_URL = "http://localhost:8000";
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(null);
  const statusLabels = ["Plan to Play", "Playing", "Completed", "Dropped"];

  // remove game handler
  async function handleRemoveGame(game) {
    if (!loggedIn || !user) {
      alert("Please log in.");
      return;
    }
    const name = game.gameName || game.name || game.slug || "";
    if (!name) {
      alert("Cannot remove: missing game name.");
      return;
    }
    const ok = window.confirm(`Remove "${name}" from your list?`);
    if (!ok) return;

    const prev = games;
    // optimistically remove from UI
    setGames((g) =>
      g.filter((item) => (item.gameName || item.name || item.slug) !== name)
    );

    try {
      const res = await fetch(`${API_BASE_URL}/auth/removeGameFromList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, gameName: name }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload?.error) {
        console.error("removeGameFromList error", res.status, payload);
        setGames(prev);
        alert("Failed to remove game. Try again.");
        return;
      }

      // success: wait a second then refresh the list from server
      setTimeout(() => {
        loadList();
      }, 1000);
    } catch (err) {
      console.error("removeGameFromList network error", err);
      setGames(prev);
      alert("Network error while removing game.");
    }
  }

  async function enrichSavedGames(savedList) {
    if (!Array.isArray(savedList) || savedList.length === 0) return [];
    const CONCURRENCY = 5;
    const results = [];
    const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");

    for (let i = 0; i < savedList.length; i += CONCURRENCY) {
      const chunk = savedList.slice(i, i + CONCURRENCY);
      const promises = chunk.map(async (item) => {
        const query = item.slug || item.gameName || "";
        if (!query)
          return { ...item, image: item.image || "", id: item.id || null };
        try {
          const r = await fetch(
            `/api/search?q=${encodeURIComponent(query)}&page=1&page_size=3`
          );
          const data = await r.json();
          const siteResults = Array.isArray(data.results) ? data.results : [];
          const targetSlug = norm(item.slug);
          const targetName = norm(item.gameName);
          const match =
            siteResults.find(
              (res) => targetSlug && norm(res.slug) === targetSlug
            ) ||
            siteResults.find(
              (res) => targetName && norm(res.name) === targetName
            ) ||
            siteResults[0] ||
            null;
          return {
            ...item,
            id: item.id || (match ? match.id : null),
            image:
              item.image ||
              (match ? match.image || match.background_image : "") ||
              "",
            slug: item.slug || (match ? match.slug : ""),
            gameName: item.gameName || (match ? match.name : "") || "",
            status:
              typeof item.status === "number"
                ? item.status
                : Number(item.status || 0),
          };
        } catch (err) {
          console.error("Enrich lookup failed for", query, err);
          return {
            ...item,
            image: item.image || "",
            id: item.id || null,
            status: Number(item.status || 0),
          };
        }
      });
      const chunkRes = await Promise.all(promises);
      results.push(...chunkRes);
    }

    return results;
  }

  // moved loadList to component scope so it can be called after removal
  async function loadList() {
    setLoading(true);
    if (!loggedIn || !user) {
      setGames([]);
      setLoading(false);
      return;
    }

    try {
      const r = await fetch(`${API_BASE_URL}/auth/getAllGames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username }),
      });

      const data = await r.json();

      if (data.success && Array.isArray(data.list)) {
        const immediate = data.list.map((item) => ({
          ...item,
          image: item.image || "",
          gameName: item.gameName || item.name || "",
          id: item.id || null,
          status:
            typeof item.status === "number"
              ? item.status
              : Number(item.status || 0),
        }));
        setGames(immediate);
        enrichSavedGames(data.list)
          .then((enriched) => setGames(enriched))
          .catch((err) => console.error("Background enrich failed:", err));
      } else {
        setGames([]);
      }
    } catch (err) {
      console.error("ERROR LOADING LIST:", err);
      setGames([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, [loggedIn, user]);

  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  const sortedGames = useMemo(() => {
    if (filterStatus === null) {
      return [...games].sort((a, b) => {
        const na = normalize(a.gameName || a.name || a.slug || "");
        const nb = normalize(b.gameName || b.name || b.slug || "");
        if (na < nb) return -1;
        if (na > nb) return 1;
        return 0;
      });
    }

    const selected = Number(filterStatus);
    const fallbackOrder = [1, 2, 3, 0];
    const order = [selected, ...fallbackOrder.filter((s) => s !== selected)];
    const groups = order.map(() => []);
    const other = [];
    for (const g of games) {
      const s = Number(g.status ?? 0);
      const idx = order.indexOf(s);
      if (idx === -1) other.push(g);
      else groups[idx].push(g);
    }
    return groups.flat().concat(other);
  }, [games, filterStatus]);

  async function updateStatus(gameOrName, newStatus) {
    const identifier =
      typeof gameOrName === "object" && gameOrName !== null
        ? gameOrName.gameName || gameOrName.slug || gameOrName.id || ""
        : gameOrName || "";

    if (!identifier) {
      console.error("No identifier provided to updateStatus", gameOrName);
      return;
    }

    const matched = games.find(
      (item) =>
        normalize(item.gameName) === normalize(identifier) ||
        normalize(item.slug) === normalize(identifier) ||
        String(item.id) === String(identifier)
    );

    if (!matched) {
      console.warn("No matching saved game found for identifier:", identifier);
    }

    const matchKey = matched ? matched.gameName : identifier;
    const prevGames = games;
    setGames((prev) =>
      prev.map((itm) =>
        normalize(itm.gameName) === normalize(matchKey) ||
        normalize(itm.slug) === normalize(matchKey) ||
        String(itm.id) === String(matchKey)
          ? { ...itm, status: Number(newStatus) }
          : itm
      )
    );

    try {
      const res = await fetch(`${API_BASE_URL}/auth/updateGameStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          gameName: matched ? matched.gameName : identifier,
          slug: matched ? matched.slug || undefined : undefined,
          newStatus: Number(newStatus),
        }),
      });

      console.debug("updateGameStatus response status:", res.status);
      const data = await res.json().catch(() => ({}));
      console.debug("updateGameStatus response body:", data);
      if (!res.ok || (data && data.success === false) || data.error) {
        console.error("Failed to update status on server:", data);
        setGames(prevGames);
        alert("Failed to update status. Try again.");
        return;
      }

      const reloadRes = await fetch(`${API_BASE_URL}/auth/getAllGames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username }),
      });
      const reloadData = await reloadRes.json().catch(() => ({}));
      if (reloadData.success && Array.isArray(reloadData.list)) {
        const enriched = await enrichSavedGames(reloadData.list);
        setGames(enriched);
      }
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err);
      setGames(prevGames);
      alert("Error updating status. Check console for details.");
    }
  }

  return (
    <div className="layout">
      <header className="header">
        <button className="hamburger" onClick={() => setMenuOpen(true)}>
          ☰
        </button>
        <div className="brand">GAMEVERSE</div>
      </header>

      {loggedIn && isAdmin && !userLibraryActive && (
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
          ⚠️ WARNING: User Library service is currently DOWN
        </div>
      )}

      <main className="main yourListMain" style={{ minHeight: "calc(100vh - 120px)" }}>
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

            <div className="statusFilterBar">
              {statusLabels.map((label, i) => (
                <button
                  key={i}
                  className={`statusFilterBtn ${
                    filterStatus === i ? "active" : ""
                  }`}
                  onClick={() => setFilterStatus(filterStatus === i ? null : i)}
                  aria-pressed={filterStatus === i}
                >
                  <span className={`filterDot status-${i}`} />
                  <span className="filterLabel">{label}</span>
                </button>
              ))}
            </div>

            {sortedGames.length === 0 ? (
              <p>You have not added any games yet.</p>
            ) : (
              <ul className="yourListGrid">
                {sortedGames.map((g, idx) => (
                  <li
                    key={idx}
                    className="yourListItem"
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      className="listNumber"
                      style={{
                        width: 36,
                        minWidth: 36,
                        textAlign: "center",
                        fontWeight: 700,
                        color: "var(--muted)",
                        fontSize: 14,
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div
                      className={`statusIndicator status-${String(
                        g.status ?? 0
                      )}`}
                    />

                    <div
                      className="yourListLeft"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flex: 1,
                      }}
                    >
                      <img
                        className="yourListImg"
                        src={g.image || ""}
                        alt={g.gameName || "Game"}
                        loading="lazy"
                        style={{
                          width: 72,
                          height: 72,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                      <div>
                        <h3 className="yourListTitle" style={{ margin: 0 }}>
                          {g.gameName || g.slug || "Unknown"}
                        </h3>
                      </div>
                    </div>

                    <div
                      className="yourListStatusRight"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                      }}
                    >
                      <div>
                        <label>Status: </label>
                        <select
                          className="statusSelect"
                          value={String(g.status ?? 0)}
                          onChange={(e) => updateStatus(g, e.target.value)}
                        >
                          <option value="0">Plan to Play</option>
                          <option value="1">Playing</option>
                          <option value="2">Completed</option>
                          <option value="3">Dropped</option>
                        </select>
                      </div>

                      <button
                        className="btn small"
                        onClick={() => handleRemoveGame(g)}
                        aria-label={`Remove ${g.gameName || "game"} from list`}
                        style={{ marginTop: 8 }}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
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
          {loggedIn ? (
            <div className="drawerUserBlock">
              <p>
                Logged in as <b>{user?.username}</b>
              </p>
              <button className="drawerLogoutBtn" onClick={logout}>
                Log Out
              </button>
            </div>
          ) : (
            <Link to="/login" className="drawerLoginBtn">
              Log In
            </Link>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}

export default YourList;
