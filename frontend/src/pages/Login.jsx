import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const API_URL = 'http://localhost:5000';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`Bienvenue, ${data.user.username} !`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top Branding Section */}
          <div className="p-8 pb-4 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl shadow-blue-500/30 mb-6 group transition-transform hover:scale-110 duration-500 overflow-hidden border-2 border-white/20">
              {settings?.logo ? (
                <img 
                  src={`${API_URL}${settings.logo}`} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <LogIn className="w-12 h-12 text-white" />
              )}
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent uppercase tracking-tight">
              {settings?.shopName || "PROJET GB"}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 dark:text-slate-500 mt-2 italic">
              Excellence in Management
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm animate-bounce">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Utilisateur</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white"
                    placeholder="Nom d'utilisateur"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Mot de passe</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
              SE CONNECTER
            </button>
          </form>

          {/* Footer Branding */}
          <div className="p-6 text-center border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose italic">
              © {new Date().getFullYear()} {settings?.shopName || "GUITECII"} — Développé avec Passion
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
