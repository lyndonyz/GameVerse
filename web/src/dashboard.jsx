import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./App.css";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, setLoggedIn, user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarValue, setCalendarValue] = useState(new Date()); 
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []); 

  const formattedTime = currentTime.toLocaleTimeString();
  const formattedDate = currentTime.toLocaleDateString('en-US', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
  });

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
          <>
            <h1>Your Dashboard, {user.username}</h1>
            <div className="dashboard-grid-header">
                <div className="timeDateColumn">
                    <p style={{ 
                        fontSize: '1.2em', 
                        color: 'var(--muted)', 
                        marginBottom: '10px' 
                    }}>
                        {formattedDate}  
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}> {formattedTime}</span>
                    </p>
                    <p className="selectedDate">
                        Calendar Selection: {calendarValue.toLocaleDateString()}
                    </p>
                </div>
                <div className="calendarContainer">
                    <Calendar 
                        onChange={setCalendarValue}
                        value={calendarValue}
                        locale="en-US"
                    />
                </div>

            </div>
          </>
        ) : (
          <div className="loginPromptContainer">
            <h1>Please log in to view your dashboard.</h1>
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

export default Dashboard;