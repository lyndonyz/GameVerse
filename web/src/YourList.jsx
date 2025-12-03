import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./App.css";

function YourList() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, user, logout } = useAuth();
  const handleDisableClick = (e) => {
    e.preventDefault();
    setMenuOpen(false);
  };

  return (
    <div className="layout">
      <header className="header">
        <button className="hamburger" onClick={() => setMenuOpen(true)}>☰</button>
        <div className="brand" role="button" tabIndex={0}>
          GAMEVERSE
        </div>

      </header>
      <main className="main dashboardMain"> 
        {loggedIn ? (
          <h1>Your Games List, {user.username}</h1>
        ) : (
          <div className="loginPromptContainer">
            <h1>Please log in to view your games list.</h1>
            <Link to="/login" className="btn loginPromptBtn">
              Go to Login
            </Link>
          </div>
        )}
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
      {menuOpen && <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

export default YourList;