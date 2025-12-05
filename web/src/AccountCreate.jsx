import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useServiceStatus } from "./useServiceStatus.js";
import { useAuth } from "./AuthContext.jsx";
import "./Login.css";

export default function AccountCreate() {
  const API_BASE_URL =
    "https://my-backend-api.23gzti4bhp77.ca-tor.codeengine.appdomain.cloud";
  const navigate = useNavigate();
  const { user, loggedIn } = useAuth();
  const { isServiceActive, isServiceActiveAndLoaded, loading: servicesLoading } = useServiceStatus();
  const analyticsActiveAndLoaded = isServiceActiveAndLoaded("Analytics & Visualization");
  const userLibraryActiveAndLoaded = isServiceActiveAndLoaded("User Library");
  const analyticsActive = isServiceActive("Analytics & Visualization");
  const userLibraryActive = isServiceActive("User Library");
  const gameCatalogActive = isServiceActive("Game & Experience Catalog");
  
  const isAdmin = user?.username?.toLowerCase() === "admin";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Redirect to home if already logged in
  useEffect(() => {
    if (loggedIn) {
      navigate("/");
    }
  }, [loggedIn, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    if (!gameCatalogActive && !isAdmin) {
      setError("Account creation is currently unavailable. The Game & Experience Catalog service is disabled.");
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError("Please enter both a username and a password.");
      return;
    }

    if (username.length < 3 || username.length > 18) {
      setError("Username must be between 3 and 18 characters long.");
      return;
    }

    if (password.length < 6 || password.length > 18) {
      setError("Password must be between 6 and 18 characters long.");
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address or leave the field empty.");
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (data.error) {
        if (data.error === "USERNAME_TAKEN") {
          setError("That username is already taken. Please choose another.");
        } else if (data.error === "EMAIL_TAKEN") {
          setError(
            "That email address is already registered to another account."
          );
        } else {
          setError("Registration failed due to a server error.");
        }
        return;
      }
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Server error. Could not connect to the backend.");
    }
  };

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
      <div className="loginContainer">
        <div className="loginBox">
          <h1>Create Account</h1>

          {!gameCatalogActive && !isAdmin && (
            <div style={{
              padding: "12px",
              marginBottom: "15px",
              backgroundColor: "rgba(255, 193, 7, 0.15)",
              border: "1px solid rgba(255, 193, 7, 0.5)",
              borderRadius: "8px",
              color: "#ffc107",
              fontSize: "0.9em",
              textAlign: "center"
            }}>
              ⚠️ Account creation is currently unavailable
            </div>
          )}

          <p
            className="loginHint"
            style={{
              marginBottom: "5px",
              fontSize: "0.9em",
              color: "var(--muted)",
            }}
          >
            Username must be unique and between 3-18 characters.
          </p>
          <form onSubmit={handleRegister}>
            <input
              className="loginInput"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div className="emailInputGroup">
              <span className="optional-tag">(Optional)</span>
              <input
                className="loginInput"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <p
              className="loginHint"
              style={{
                marginBottom: "5px",
                fontSize: "0.9em",
                color: "var(--muted)",
              }}
            >
              Password must be between 6-18 characters.
            </p>

            <input
              className="loginInput"
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginTop: "0px" }}
            />

            <button 
              className="loginBtn" 
              type="submit"
              disabled={!gameCatalogActive && !isAdmin}
              style={{
                opacity: (!gameCatalogActive && !isAdmin) ? 0.5 : 1,
                cursor: (!gameCatalogActive && !isAdmin) ? 'not-allowed' : 'pointer'
              }}
            >
              Register
            </button>
          </form>
          {error && <p className="errorText">{error}</p>}
          <p className="loginHint">
            Already have an account? <Link to="/login">Log in here!</Link>
          </p>
        </div>
      </div>
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
          </nav>
        )}
        <div className="drawerAuthFooter">
          <Link
            to="/login"
            className="drawerLoginBtn"
            onClick={() => setMenuOpen(false)}
          >
            Log In
          </Link>
        </div>
      </div>
      {menuOpen && (
        <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
