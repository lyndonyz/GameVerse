import { useState, useEffect } from "react";

export function useServiceStatus() {
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${API_BASE_URL}/api/admin/services`);
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
    const interval = setInterval(fetchServices, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const isServiceActive = (serviceName) => {
    return services[serviceName] === 1;
  };
  const isServiceActiveAndLoaded = (serviceName) => {
    if (loading) {
      return false;
    }
    return services[serviceName] === 1;
  };
  const isServiceActiveOrLoading = (serviceName) => {
    if (loading) {
      return true;
    }
    return services[serviceName] === 1;
  };

  return { services, loading, isServiceActive, isServiceActiveAndLoaded, isServiceActiveOrLoading };
}
