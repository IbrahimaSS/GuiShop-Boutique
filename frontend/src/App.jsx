import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Debts from './pages/Debts';
import Deposits from './pages/Deposits';
import Expenses from './pages/Expenses';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Invoices from './pages/Invoices';
import Login from './pages/Login';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';

const Layout = ({ toggleDarkMode, darkMode }) => {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
      <div className="hidden md:block w-72 flex-shrink-0 z-20 shadow-2xl">
        <Sidebar darkMode={darkMode} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <Topbar toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <SettingsProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Layout toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="sales" element={<Sales />} />
              <Route path="debts" element={<Debts />} />
              <Route path="deposits" element={<Deposits />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="invoices" element={<Invoices />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </SettingsProvider>
  );
};

export default App;
