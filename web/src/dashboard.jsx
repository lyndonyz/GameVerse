import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./App.css";

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, setLoggedIn } = useAuth();

  return (
    <div className="layout">

      {/* HEADER */}
      <header className="header">
        <button className="hamburger" onClick={() => setMenuOpen(true)}>☰</button>
        <div className="brand" role="button" tabIndex={0}>
          GAMEVERSE
        </div>

      </header>

      {/* MAIN CONTENT AREA */}
      <main className="main dashboardMain">
        <h1>Dashboard</h1>
      </main>

      {/* LEFT DRAWER SIDEBAR */}
      <div className={`leftDrawer ${menuOpen ? "open" : ""}`}>
        <button className="drawerClose" onClick={() => setMenuOpen(false)}>✕</button>

        <nav className="drawerMenu">
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          {!loggedIn && (
            <button className="drawerLoginBtn" onClick={() => setLoggedIn(true)}>
                Log In
            </button>
            )}
        </nav>
      </div>

      {/* OVERLAY */}
      {menuOpen && <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

export default Dashboard;
