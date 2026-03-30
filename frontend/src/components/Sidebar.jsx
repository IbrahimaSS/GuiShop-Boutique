import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PackageSearch, 
  ShoppingCart, 
  CreditCard, 
  Archive, 
  Receipt,
  Users,
  Settings as SettingsIcon,
  LogOut,
  FileText,
  BarChart3,
  ClipboardCheck
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Sidebar = ({ darkMode }) => {
  const { settings } = useSettings();
  const API_URL = 'http://localhost:5000';
  
  // Récupérer l'utilisateur pour vérifier son rôle
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Produits & Stock', path: '/products', icon: PackageSearch },
    { name: 'Ventes', path: '/sales', icon: ShoppingCart },
    { name: 'Dettes', path: '/debts', icon: CreditCard },
    { name: 'Dépôts', path: '/deposits', icon: Archive },
    { name: 'Frais & Dépenses', path: '/expenses', icon: Receipt },
    { name: 'Factures & Reçus', path: '/invoices', icon: FileText },
    // Menus restreints
    ...(isAdmin ? [
      { name: 'Bilan Général', path: '/reports', icon: BarChart3 },
      { name: 'Validations', path: '/validations', icon: ClipboardCheck },
      { name: 'Utilisateurs', path: '/users', icon: Users },
      { name: 'Paramètres', path: '/settings', icon: SettingsIcon },
    ] : []),
  ];

  // Obtenir les initiales (ex: "Projet GB" -> "PG")
  const getInitials = (name) => {
    if (!name) return 'GB';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="h-full w-full bg-gradient-to-b from-royal-dark to-[#101b44] dark:from-slate-900 dark:to-slate-950 flex flex-col text-slate-300 transition-colors duration-300 relative border-r border-[#1e2f6a] dark:border-slate-800">
      
      {/* Decorative Blur */}
      <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-royal-light rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
      
      {/* Logo */}
      <div className="h-28 flex items-center gap-4 px-8 border-b border-white/10 relative z-10">
        <div key={settings?.logo || 'initials'} className="w-12 h-12 rounded-xl bg-gradient-to-tr from-gold-dark via-gold to-gold-light flex items-center justify-center font-jakarta font-extrabold text-white text-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] overflow-hidden">
          {settings?.logo ? (
            <img 
              src={`${API_URL}${settings.logo}`} 
              alt="Logo" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            getInitials(settings?.shopName)
          )}
        </div>
        <div>
           <span className="text-xl font-jakarta font-bold text-white tracking-tight block uppercase truncate max-w-[140px]">
             {settings?.shopName || 'Projet GB'}
           </span>
           <span className="text-[10px] text-gold-light font-medium uppercase tracking-widest mt-0.5">Premium Management</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
             <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `
                flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-medium group
                ${isActive 
                  ? 'bg-gradient-to-r from-royal/50 to-transparent text-white border border-royal/30 shadow-[inset_4px_0_0_rgba(212,175,55,1)] dark:shadow-[inset_4px_0_0_rgba(253,224,71,1)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-white/10 relative z-10">
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-medium group"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
