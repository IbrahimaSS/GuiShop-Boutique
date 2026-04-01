import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Shield, Camera, Save, Key, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);
  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  
  const [profile, setProfile] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    avatar: ''
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/me');
      setProfile(data.user);
      // Sync with localStorage user
      const updatedUser = { ...user, ...data.user };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      setSuccessMsg('Profil mis à jour avec succès !');
      // Sync localStorage
      const updatedUser = { ...user, ...data.user };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('userUpdated'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarLoading(true);
    try {
      const { data } = await api.post('/auth/avatar', formData);
      if (data.success) {
        const updatedUser = { ...user, avatar: data.user.avatar };
        setUser(updatedUser);
        setProfile(prev => ({ ...prev, avatar: data.user.avatar }));
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('userUpdated'));
        setSuccessMsg('Photo de profil mise à jour !');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'upload de l'avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.put('/auth/profile', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setSuccessMsg('Mot de passe modifié !');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors du changement de mot de passe");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 text-royal animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto text-left relative">
      {successMsg && (
        <div className="fixed top-24 right-8 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">Mon Profil</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-royal-dark via-royal to-gold h-32 relative">
          <div className="absolute -bottom-12 left-8 flex items-end gap-5">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden flex items-center justify-center">
                {avatarLoading ? (
                  <Loader2 className="w-8 h-8 text-royal animate-spin" />
                ) : user.avatar ? (
                  <img src={`${API_URL}${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-royal to-gold flex items-center justify-center text-white font-jakarta font-extrabold text-3xl">
                    {(profile.fullName || profile.username || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
            </div>
          </div>
        </div>
        <div className="pt-16 pb-6 px-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-jakarta font-bold text-slate-800 dark:text-white capitalize">{profile.fullName || profile.username}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gold/10 text-gold-dark dark:bg-gold/20 dark:text-gold-light border border-gold/20">
                <Shield className="w-3.5 h-3.5" /> {profile.role}
              </span>
              <span className="text-sm text-slate-400 dark:text-slate-500 font-medium tracking-tight">@{profile.username}</span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dernière Connexion</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 italic">{profile.lastLogin ? new Date(profile.lastLogin).toLocaleString('fr-FR') : 'Maintenant'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'info', label: 'Informations' },
          { id: 'security', label: 'Sécurité' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-royal-dark to-royal text-white shadow-lg shadow-royal/30' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 p-6 md:p-8">
        {activeTab === 'info' && (
          <form onSubmit={handleUpdateProfile} className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-jakarta font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3"><User className="w-5 h-5 text-royal" /> Coordonnées Personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" value={profile.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 pl-11 pr-4 outline-none transition-all text-sm dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nom d'utilisateur (Lecture seule)</label>
                <input type="text" readOnly value={profile.username} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 outline-none text-sm dark:text-slate-500 cursor-not-allowed font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email Professionnel</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="email" value={profile.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 pl-11 pr-4 outline-none transition-all text-sm dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Numéro de Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" value={profile.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 pl-11 pr-4 outline-none transition-all text-sm dark:text-white" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Adresse Résidentielle</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" value={profile.address} onChange={(e) => handleChange('address', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 pl-11 pr-4 outline-none transition-all text-sm dark:text-white" />
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-50 dark:border-slate-700 flex justify-end">
              <button disabled={isSubmitting} className="px-10 py-3 bg-gradient-to-r from-royal to-royal-light text-white rounded-xl font-bold text-sm shadow-xl shadow-royal/30 active:scale-95 transition-all flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Mettre à jour le profil
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleUpdatePassword} className="space-y-6 animate-fade-in text-left">
            <h3 className="text-lg font-jakarta font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3"><Key className="w-5 h-5 text-gold" /> Authentification & Sécurité</h3>
            <div className="space-y-6 max-w-md">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Mot de passe actuel</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={passwords.currentPassword} onChange={(e) => handlePasswordChange('currentPassword', e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 px-4 pr-12 outline-none transition-all text-sm dark:text-white" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-royal transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nouveau mot de passe</label>
                <input type="password" required value={passwords.newPassword} onChange={(e) => handlePasswordChange('newPassword', e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 px-4 outline-none transition-all text-sm dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Confirmer la modification</label>
                <input type="password" required value={passwords.confirmPassword} onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 px-4 outline-none transition-all text-sm dark:text-white" />
              </div>
            </div>
            <div className="pt-6 border-t border-slate-50 dark:border-slate-700 flex justify-end">
              <button disabled={isSubmitting} className="px-10 py-3 bg-gradient-to-r from-gold-dark to-gold text-white rounded-xl font-bold text-sm shadow-xl shadow-gold/30 active:scale-95 transition-all flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Changer le mot de passe
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
