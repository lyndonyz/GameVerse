import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { setLoggedIn, setUser } = useAuth();
  const API_BASE_URL = "https://my-backend-api.23gzti4bhp77.ca-tor.codeengine.appdomain.cloud";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false); 

  const handleLogin = async (e) => {
    e.preventDefault();

    setError(""); 
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username/email and password.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/auth/login", { 
    // const res = await fetch(`${API_BASE_URL}/auth/login`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: username, password }) 
      });

      const data = await res.json();

      if (data.error) {
        setError("Invalid username or password!"); 
        return;
      }
      setUser(data.user);
      setLoggedIn(true);
      navigate("/dashboard");

    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Make sure backend is running.");
    }
  };

  return (
    <div className="layout"> 
      <header className="header">
        <button className="hamburger" onClick={() => setMenuOpen(true)}>☰</button>
        <div className="brand" role="button" tabIndex={0}>
          GAMEVERSE
        </div>
      </header>
      <div className="loginContainer">
        <div className="loginBox">
          <h1>Login</h1>

          <form onSubmit={handleLogin}>
            <input
              className="loginInput"
              type="text"
              placeholder="Username, Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              className="loginInput"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="loginBtn" type="submit">
              Log In
            </button>
          </form>
          {error && <p className="errorText">{error}</p>}

          <p className="loginHint">
            Don't have an account? <Link to="/register">Create one Here!</Link> 
          </p>
        </div>
      </div>
      <div className={`leftDrawer ${menuOpen ? "open" : ""}`}>
        <button className="drawerClose" onClick={() => setMenuOpen(false)}>✕</button>
        <nav className="drawerMenu">
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        <Link to="/yourlist" onClick={() => setMenuOpen(false)}>Your List</Link>
        <Link to="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
        </nav>
        <div className="drawerAuthFooter"> 
          <Link to="/register" className="drawerLoginBtn" onClick={() => setMenuOpen(false)}>
              Create Account
          </Link>
        </div>
      </div>
      {menuOpen && <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}