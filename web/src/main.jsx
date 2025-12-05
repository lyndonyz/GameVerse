import './index.css';
import App from './App.jsx';
import Dashboard from './dashboard.jsx';
import Login from "./Login.jsx";  
import AccountCreate from "./AccountCreate.jsx";  
import YourList from './YourList.jsx';
import Settings from './Settings.jsx';
import ServiceRegistry from './ServiceRegistry.jsx';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from "./AuthContext.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} /> 
          <Route path="/register" element={<AccountCreate />} /> 
          <Route path="/yourlist" element={<YourList />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/services" element={<ServiceRegistry />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
