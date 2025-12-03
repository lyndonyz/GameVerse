import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./App.css";
import "./settings.css"; 

function SettingBox({ title, children }) {
    return (
        <div className="settingBox">
            <h3>{title}</h3>
            {children}
        </div>
    );
}

function Settings() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, user, setUser, logout } = useAuth();
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || ""); 
  const [emailSaving, setEmailSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleDisableClick = (e) => {
    e.preventDefault();
    setMenuOpen(false);
  };

  const setFeedback = (message, isErr = false) => {
      setStatusMessage(message);
      setIsError(isErr);
  }

  const clearPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }


  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    setFeedback("");

    if (!newUsername.trim() || newUsername === user.username) {
        setFeedback("This is already your current username.", true);
        return;
    }
    if (newUsername.length < 3 || newUsername.length > 18) {
        setFeedback("Username must be between 3 and 18 characters.", true);
        return;
    }

    setUsernameSaving(true);
    try {
        const res = await fetch("http://localhost:8080/auth/update/username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, newUsername })
        });
        const data = await res.json();
        
        if (data.error) {
            if (data.error === "USERNAME_TAKEN") {
                setFeedback("That username is already in use.", true);
            } else {
                setFeedback("Username update failed: " + (data.message || "Server error."), true);
            }
        } else {
            setFeedback("Username updated successfully!", false);
            setUser(prev => ({ ...prev, username: newUsername }));
        }

    } catch (err) {
        console.error("Username update error:", err);
        setFeedback("Network error. Could not connect to server.", true);
    } finally {
        setUsernameSaving(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setFeedback("");

    if (!newEmail.trim()) {
        setFeedback("Email cannot be empty.", true);
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
        setFeedback("Please enter a valid email address.", true);
        return;
    }
    if (newEmail === user.email) {
        setFeedback("This is already your current email.", true);
        return;
    }

    setEmailSaving(true);
    try {
        const res = await fetch("http://localhost:8080/auth/update/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, newEmail: newEmail.trim() })
        });
        const data = await res.json();
        
        if (data.error) {
            if (data.error === "EMAIL_TAKEN") {
                setFeedback("That email is already in use.", true);
            } else {
                setFeedback("Email update failed: " + (data.message || "Server error."), true);
            }
        } else {
            setFeedback("Email updated successfully!", false);
            setUser(prev => ({ ...prev, email: newEmail }));
        }

    } catch (err) {
        console.error("Email update error:", err);
        setFeedback("Network error. Could not connect to server.", true);
    } finally {
        setEmailSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setFeedback("");

    if (!newPassword || !confirmPassword || !currentPassword) {
        setFeedback("All password fields must be filled.", true);
        return;
    }
    if (newPassword !== confirmPassword) {
        setFeedback("New passwords do not match.", true);
        return;
    }
    if (newPassword.length < 6 || newPassword.length > 18) {
        setFeedback("New password must be between 6 and 18 characters.", true);
        return;
    }
    if (newPassword === currentPassword) {
        setFeedback("New password must be different from current password.", true);
        return;
    }

    setPasswordSaving(true);
    try {
        const res = await fetch("http://localhost:8080/auth/update/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, currentPassword, newPassword })
        });
        const data = await res.json();
        
        if (data.error) {
            if (data.error === "INVALID_CURRENT_PASSWORD") {
                setFeedback("The current password you entered is incorrect.", true);
            } else {
                setFeedback("Password update failed: " + (data.message || "Server error."), true);
            }
        } else {
            setFeedback("Password updated successfully!", false);
        }

    } catch (err) {
        console.error("Password update error:", err);
        setFeedback("Network error. Could not connect to server.", true);
    } finally {
        clearPasswordFields();
        setPasswordSaving(false);
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
      <main className="main dashboardMain"> 
        {loggedIn ? (
            <div style={{ maxWidth: '600px', margin: '0 20px 0 0' }}> 
                <h1>Account Settings for {user.username}</h1>
                {statusMessage && (
                    <p 
                        className={`status-message ${isError ? 'error' : 'success'}`}
                    >
                        {statusMessage}
                    </p>
                )}

                <div className="settingsGrid">
                    <SettingBox title="Change Username">
                        <p style={{ marginBottom: '10px', fontSize: '0.9em', color: 'var(--muted-text)' }}>
                            Current Username: <b>{user?.username || 'Not set'}</b>
                        </p>
                        <form onSubmit={handleUpdateUsername}>
                            <input
                                className="loginInput"
                                type="text"
                                placeholder="New Username"
                                value={newUsername}
                                onChange={(e) => {
                                    setNewUsername(e.target.value);
                                    setFeedback("");
                                }}
                                disabled={usernameSaving}
                            />
                            <button className="btn" type="submit" disabled={usernameSaving}>
                                {usernameSaving ? "Saving..." : "Save Username"}
                            </button>
                        </form>
                    </SettingBox>
                    <SettingBox title="Change Email">
                        <p style={{ marginBottom: '10px', fontSize: '0.9em', color: 'var(--muted-text)' }}>
                            Current Email: <b>{user?.email || 'Not set'}</b>
                        </p>
                        <form onSubmit={handleUpdateEmail}>
                            <input
                                className="loginInput"
                                type="email"
                                placeholder="New Email"
                                value={newEmail}
                                onChange={(e) => {
                                    setNewEmail(e.target.value);
                                    setFeedback("");
                                }}
                                disabled={emailSaving}
                            />
                            <button className="btn" type="submit" disabled={emailSaving}>
                                {emailSaving ? "Saving..." : "Save Email"}
                            </button>
                        </form>
                    </SettingBox>
                    <SettingBox title="Change Password">
                        <form onSubmit={handleUpdatePassword}>
                            <input
                                className="loginInput"
                                type="password"
                                placeholder="Current Password"
                                value={currentPassword}
                                onChange={(e) => {
                                    setCurrentPassword(e.target.value);
                                    setFeedback("");
                                }}
                                disabled={passwordSaving}
                            />
                            <input
                                className="loginInput"
                                type="password"
                                placeholder="New Password (6-18 chars)"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setFeedback("");
                                }}
                                disabled={passwordSaving}
                                style={{ marginTop: '10px' }}
                            />
                            <input
                                className="loginInput"
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setFeedback("");
                                }}
                                disabled={passwordSaving}
                                style={{ marginTop: '10px' }}
                            />
                            <button className="btn" type="submit" disabled={passwordSaving} style={{ marginTop: '20px' }}>
                                {passwordSaving ? "Saving..." : "Save Password"}
                            </button>
                        </form>
                    </SettingBox>

                </div>
            </div>
        ) : (
          <div className="loginPromptContainer">
            <h1>Please log in to manage your settings.</h1>
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

export default Settings;