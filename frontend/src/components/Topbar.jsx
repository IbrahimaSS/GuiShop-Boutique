import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, UserCircle, Sun, Moon } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const Topbar = ({ toggleDarkMode, darkMode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load user from localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Erreur parsing user:', err);
    }

    // Listen for changes (e.g. after avatar upload)
    const handleStorageChange = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Erreur parsing user:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener('userUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleStorageChange);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const displayName = user?.fullName || user?.username || 'Admin';
  const displayRole = user?.role === 'admin' ? 'Super Admin' : user?.role === 'manager' ? 'Manager' : 'Utilisateur';

  return (
    <div className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden p-2 text-slate-500 hover:text-royal hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden md:flex relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Rechercher des produits, clients, factures..." 
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-royal/30 transition-all dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button 
          onClick={toggleDarkMode}
          className="p-2 text-slate-400 dark:text-slate-500 hover:text-royal dark:hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          {darkMode ? <Sun className="w-5 h-5 text-gold-light" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="relative p-2 text-slate-400 hover:text-royal hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>

        <div onClick={() => navigate('/profile')} className="flex items-center gap-3 cursor-pointer group">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-royal dark:group-hover:text-gold transition-colors">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{displayRole}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-royal to-gold p-0.5 shadow-md group-hover:shadow-lg group-hover:shadow-royal/30 transition-all">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img 
                  src={`${API_URL}${user.avatar}`} 
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => { 
                    e.target.style.display = 'none'; 
                    e.target.nextSibling.style.display = 'flex'; 
                  }}
                />
              ) : null}
              <div 
                className="w-full h-full rounded-full bg-gradient-to-br from-royal to-gold flex items-center justify-center text-white font-bold text-sm"
                style={user?.avatar ? { display: 'none' } : {}}
              >
                {getInitials(displayName)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
