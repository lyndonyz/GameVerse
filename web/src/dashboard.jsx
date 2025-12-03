import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./App.css";

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, setLoggedIn, user, logout } = useAuth();

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

            {/* 1. TOP: Main Navigation Links */}
            <nav className="drawerMenu">
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            </nav>

            {/* 2. BOTTOM: Login/Logout/User Info - New container */}
            <div className="drawerAuthFooter"> 
            {!loggedIn ? (
                <Link to="/login" className="drawerLoginBtn" onClick={() => setMenuOpen(false)}>
                    Log In
                </Link>
            ) : (
                <div className="drawerUserBlock">
                    <p>Logged in as <b>{user.username}</b></p>
                    <button className="drawerLogoutBtn" onClick={() => { logout(); setMenuOpen(false); }}>
                    Log Out
                    </button>
                </div>
            )}
            </div>
        </div>

      {/* OVERLAY */}
      {menuOpen && <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

export default Dashboard;
