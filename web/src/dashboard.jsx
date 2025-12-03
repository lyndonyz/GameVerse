import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./App.css";

// Import the Calendar component and its default styles
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, setLoggedIn, user, logout } = useAuth();
  
  // State for the real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State for the calendar (holds the currently selected date, defaults to today)
  const [calendarValue, setCalendarValue] = useState(new Date()); 

  // Effect to update the time every second (Real-Time Clock)
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

      {/* HEADER (UNCHANGED) */}
      <header className="header">
        <button className="hamburger" onClick={() => setMenuOpen(true)}>☰</button>
        <div className="brand" role="button" tabIndex={0}>
          GAMEVERSE
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="main dashboardMain">
        {loggedIn ? (
          <>
            <h1>Your Dashboard, {user.username}</h1>
            
            {/* Container for Time, Date, and Calendar (side-by-side) */}
            <div className="dashboard-grid-header">
                
                {/* 1. TIME/DATE COLUMN (LEFT) */}
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
                    
                    {/* The "Game List Statuses" content has been removed from here */}
                    
                </div>

                {/* 2. CALENDAR COLUMN (RIGHT) */}
                <div className="calendarContainer">
                    <Calendar 
                        onChange={setCalendarValue}
                        value={calendarValue}
                        locale="en-US"
                    />
                </div>

            </div>
            {/* END dashboard-grid-header */}
            
            {/* Placeholder for rest of dashboard content */}

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

      {/* LEFT DRAWER SIDEBAR (UNCHANGED) */}
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

      {/* OVERLAY */}
      {menuOpen && <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

export default Dashboard;