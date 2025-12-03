import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { setLoggedIn, setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError(""); 
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/auth/login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
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
    <div className="loginContainer">
      <div className="loginBox">
        <h1>Login</h1>

        <form onSubmit={handleLogin}>
          <input
            className="loginInput"
            type="text"
            placeholder="Enter username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="loginInput"
            type="password"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="loginBtn" type="submit">
            Log In
          </button>
        </form>
        {error && <p className="errorText">{error}</p>}

        <p className="loginHint">
          Don't have an account? Create one Here!
        </p>
      </div>
    </div>
  );
}
