import { useState, useEffect } from "react";

export function useServiceStatus() {
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/admin/services");
        const data = await response.json();
        
        if (!data.error) {
          setServices(data.services);
        }
      } catch (err) {
        console.error("Failed to fetch service status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchServices, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const isServiceActive = (serviceName) => {
    return services[serviceName] === 1;
  };

  // For navigation: only show if loaded AND active (won't show during loading)
  const isServiceActiveAndLoaded = (serviceName) => {
    if (loading) {
      return false;
    }
    return services[serviceName] === 1;
  };

  // For redirects: prevent redirect while loading (assume active during load)
  const isServiceActiveOrLoading = (serviceName) => {
    if (loading) {
      return true;
    }
    return services[serviceName] === 1;
  };

  return { services, loading, isServiceActive, isServiceActiveAndLoaded, isServiceActiveOrLoading };
}
