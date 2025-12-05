import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import "./ServiceRegistry.css";

function ServiceRegistry() {
  const { user, loggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!loggedIn) {
      navigate("/login");
      return;
    }
    
    if (user?.username?.toLowerCase() !== "admin") {
      navigate("/");
      return;
    }
  }, [loggedIn, user, navigate]);

  // Fetch service statuses
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");
      const API_BASE_URL = "https://gameverse-server.23jpmxbt7759.ca-tor.codeengine.appdomain.cloud";
      const response = await fetch(`${API_BASE_URL}/api/admin/services`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setServices(data.services);
    } catch (err) {
      console.error("Failed to fetch services:", err);
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  // Toggle service status
  const toggleService = async (serviceName, currentStatus) => {
    try {
      setUpdating(prev => ({ ...prev, [serviceName]: true }));
      setError("");
      
      const newStatus = currentStatus === 1 ? 0 : 1;
      
      const API_BASE_URL = "https://gameverse-server.23jpmxbt7759.ca-tor.codeengine.appdomain.cloud";
      const response = await fetch(`${API_BASE_URL}/api/admin/services/${encodeURIComponent(serviceName)}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update local state immediately
      setServices(prev => ({
        ...prev,
        [serviceName]: newStatus,
      }));
      
      // Force a refresh after a short delay to ensure consistency
      setTimeout(() => {
        fetchServices();
      }, 500);
    } catch (err) {
      console.error("Failed to toggle service:", err);
      setError(`Failed to toggle ${serviceName}`);
      // Refresh on error to get correct state
      fetchServices();
    } finally {
      setUpdating(prev => ({ ...prev, [serviceName]: false }));
    }
  };

  // Refresh services periodically
  useEffect(() => {
    if (!loggedIn || user?.username?.toLowerCase() !== "admin") return;
    
    fetchServices();
    
    const interval = setInterval(() => {
      fetchServices();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [loggedIn, user]);

  // Don't render anything if not admin
  if (!loggedIn || user?.username?.toLowerCase() !== "admin") {
    return null;
  }

  return (
    <div className="service-registry-container">
      <header className="registry-header">
        <button className="hamburger" onClick={() => setMenuOpen(true)}>
          ☰
        </button>

        <div className="brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
          GAMEVERSE
        </div>

        <div className="registry-title">Service Registry</div>
      </header>

      <div className="registry-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading && Object.keys(services).length === 0 ? (
          <div className="loading">Loading services...</div>
        ) : (
          <div className="services-grid">
            {Object.entries(services).map(([serviceName, status]) => (
              <div key={serviceName} className="service-card">
                <div className="service-header">
                  <h3>{serviceName === "Game & Experience Catalog" ? "User Creation" : serviceName}</h3>
                  <span className={`status-badge ${status === 1 ? "active" : "inactive"}`}>
                    {status === 1 ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                
                <div className="service-actions">
                  <button
                    onClick={() => toggleService(serviceName, status)}
                    disabled={updating[serviceName]}
                    className={`toggle-button ${status === 1 ? "turn-off" : "turn-on"}`}
                  >
                    {updating[serviceName] ? (
                      "Updating..."
                    ) : status === 1 ? (
                      "Turn OFF"
                    ) : (
                      "Turn ON"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="registry-footer">
          <p>Services update automatically every 5 seconds</p>
          <button onClick={fetchServices} className="refresh-button" disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Now"}
          </button>
        </div>
      </div>

      <div className={`leftDrawer ${menuOpen ? "open" : ""}`}>
        <button className="drawerClose" onClick={() => setMenuOpen(false)}>
          ✕
        </button>
        <nav className="drawerMenu">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>
          <Link to="/yourlist" onClick={() => setMenuOpen(false)}>
            Your List
          </Link>
          <Link to="/settings" onClick={() => setMenuOpen(false)}>
            Settings
          </Link>
          <Link to="/admin/services" onClick={() => setMenuOpen(false)}>
            Service Registry
          </Link>
        </nav>
        <div className="drawerAuthFooter">
          {!loggedIn ? (
            <Link
              to="/login"
              className="drawerLoginBtn"
              onClick={() => setMenuOpen(false)}
            >
              Log In
            </Link>
          ) : (
            <div className="drawerUserBlock">
              <p>
                Logged in as <b>{user?.username}</b>
              </p>
              <button
                className="drawerLogoutBtn"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                  navigate("/login");
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
      {menuOpen && (
        <div className="drawerOverlay" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}

export default ServiceRegistry;
