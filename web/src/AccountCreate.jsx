import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function AccountCreate() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setError(""); 

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
    const res = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
        username, 
        password,
        email: email.trim() 
        })
    });

      const data = await res.json();

      if (data.error) {
        if (data.error === "USERNAME_TAKEN") {
            setError("That username is already taken. Please choose another.");
        } else if (data.error === "EMAIL_TAKEN") { 
            setError("That email address is already registered to another account.");
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
        <button className="hamburger" onClick={() => setMenuOpen(true)}>☰</button>
        <div className="brand" role="button" tabIndex={0}>
          GAMEVERSE
        </div>
      </header>
      <div className="loginContainer">
        <div className="loginBox">
          <h1>Create Account</h1>

          <p className="loginHint" style={{ marginBottom: '5px', fontSize: '0.9em', color: 'var(--muted)' }}>
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
              <span className="optional-tag">
                (Optional)
              </span>
              <input
                className="loginInput"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <p className="loginHint" style={{ marginBottom: '5px', fontSize: '0.9em', color: 'var(--muted)' }}>
              Password must be between 6-18 characters.
            </p>

            <input
              className="loginInput"
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginTop: '0px' }} 
            />

            <button className="loginBtn" type="submit">
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
        <button className="drawerClose" onClick={() => setMenuOpen(false)}>✕</button>
        <nav className="drawerMenu">
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        <Link to="/yourlist" onClick={() => setMenuOpen(false)}>Your List</Link>
        <Link to="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
        </nav>
        <div className="drawerAuthFooter"> 
          <Link to="/login" className="drawerLoginBtn" onClick={() => setMenuOpen(false)}>
              Log In
          </Link>
        </div>
      </div>
      {menuOpen && <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}