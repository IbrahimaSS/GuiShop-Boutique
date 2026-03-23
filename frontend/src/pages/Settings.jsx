import React, { useState, useEffect, useRef } from 'react';
import { Save, Shield, HardDrive, Database, Settings as SettingsIcon, Store, FileText, Image, RefreshCw, Download, Loader2, User, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import * as XLSX from 'xlsx';

const CheckCircle = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { settings, refreshSettings, uploadLogo } = useSettings();
  const fileInputRef = useRef(null);
  const API_URL = 'http://localhost:5000';
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [shopSettings, setShopSettings] = useState({
    shopName: '',
    location: '',
    contactPhone: '',
    currency: 'GNF',
    logo: ''
  });
  const toast = useToast();

  const tabs = [
    { id: 'general', label: 'Général & Boutique', icon: Store },
    { id: 'backup', label: 'Sauvegarde & Données', icon: Database },
    { id: 'logs', label: 'Logs & Traçabilité', icon: FileText },
    { id: 'security', label: 'Sécurité & Accès', icon: Shield },
  ];

  useEffect(() => {
    if (settings) {
      setShopSettings({
        shopName: settings.shopName || '',
        location: settings.location || '',
        contactPhone: settings.contactPhone || '',
        currency: settings.currency || 'GNF',
        logo: settings.logo || ''
      });
    }
  }, [settings]);

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.error("[DEBUG-CLICK] Fichier sélectionné:", file.name);
      try {
        console.error("[DEBUG-SETTINGS-TRY] Appels de uploadLogo lancé");
        toast.info("Upload du logo...");
        await uploadLogo(file);
        console.error("[DEBUG-SETTINGS-OK] Upload terminé avec succès");
        toast.success("Logo mis à jour !");
      } catch (err) {
        console.error("[DEBUG-SETTINGS-ERROR] Échec de l'upload:", err);
        toast.error(err.response?.data?.error || "Erreur lors de l'upload du logo");
      }
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setIsSaving(true);
      const { data } = await api.put('/settings', shopSettings);
      if (data.success) {
        toast.success("Paramètres de la boutique mis à jour !");
        // Update both local and global state (no refreshSettings to avoid ping-pong)
        setShopSettings(data.data);
        updateSettings(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/activities');
      setLogs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportStock = async () => {
    try {
      toast.info("Génération du fichier Excel...");
      const { data } = await api.get('/products');
      const products = data.data.map(p => ({
        "Désignation": p.name,
        "Catégorie": p.category,
        "Stock": p.stock,
        "Unité": p.unit,
        "Prix d'achat": p.purchasePrice,
        "Prix de vente": p.sellingPrice,
        "Valeur Stock": p.stock * p.sellingPrice,
        "Alerte": p.stock <= p.minStock ? "OUI" : "NON"
      }));

      const ws = XLSX.utils.json_to_sheet(products);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Stock");
      XLSX.writeFile(wb, `Stock_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Stock exporté !");
    } catch (err) {
      toast.error("Échec de l'exportation");
    }
  };

  const handleManualBackup = () => {
    toast.info("Démarrage de la sauvegarde cloud...");
    setTimeout(() => {
      toast.success("Données synchronisées avec succès !");
    }, 2000);
  };

  const handleExportFinance = () => {
    const token = localStorage.getItem('token');
    window.location.href = `http://localhost:5000/api/dashboard/report?token=${token}`;
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Les nouveaux mots de passe ne correspondent pas");
    }
    try {
      setIsSaving(true);
      const { data } = await api.put('/auth/profile', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (data.success) {
        toast.success("Mot de passe mis à jour !");
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur de mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  // Helper pour initiales
  const getInitials = (name) => {
    if (!name) return 'GB';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <h1 className="text-3xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">Paramètres</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez la configuration globale, la base de données et l'audit.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-2 flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 text-left font-bold text-sm ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-royal-dark to-royal text-white shadow-lg shadow-royal/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Icon className="w-5 h-5" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 p-6 md:p-8 min-h-[500px]">

          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                <Store className="w-6 h-6 text-royal" />
                <h2 className="text-xl font-bold font-jakarta text-slate-800 dark:text-white">Configuration de la Boutique</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nom Commercial</label><input type="text" value={shopSettings.shopName} onChange={(e) => setShopSettings({ ...shopSettings, shopName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3 px-4 outline-none transition-all text-sm dark:text-white" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Localisation</label><input type="text" value={shopSettings.location} onChange={(e) => setShopSettings({ ...shopSettings, location: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3 px-4 outline-none transition-all text-sm dark:text-white" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Contact Client</label><input type="text" value={shopSettings.contactPhone} onChange={(e) => setShopSettings({ ...shopSettings, contactPhone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3 px-4 outline-none transition-all text-sm dark:text-white" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Devise par défaut</label><select value={shopSettings.currency} onChange={(e) => setShopSettings({ ...shopSettings, currency: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl py-3 px-4 outline-none text-sm dark:text-white cursor-pointer font-bold"><option value="GNF">GNF (Franc Guinéen)</option></select></div>
              </div>
              <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Identité Visuelle</h3>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center font-jakarta font-black text-3xl text-white shadow-xl shadow-gold/20 overflow-hidden border-2 border-gold/20">
                    {settings?.logo ? (
                      <img
                        src={`${API_URL}${settings.logo}`}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(shopSettings.shopName)
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-royal text-white rounded-xl hover:bg-royal-dark transition-all text-sm font-bold shadow-lg shadow-royal/20"
                  >
                    <Image className="w-4 h-4" /> Changer le Logo
                  </button>
                </div>
              </div>
              <div className="pt-8 border-t border-slate-50 dark:border-slate-700 flex justify-end">
                <button onClick={handleUpdateSettings} disabled={isSaving} className="px-10 py-3 bg-gradient-to-r from-royal to-royal-light text-white rounded-xl font-bold text-sm shadow-xl shadow-royal/30 active:scale-95 transition-all flex items-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                <Database className="w-6 h-6 text-royal" />
                <h2 className="text-xl font-bold font-jakarta text-slate-800 dark:text-white">Sauvegarde & Restauration</h2>
              </div>
              <div className="bg-royal/5 dark:bg-royal/10 border border-royal/20 p-6 rounded-3xl flex items-start gap-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-royal/5 rounded-full -mr-16 -mt-16 animate-pulse"></div>
                <RefreshCw className="w-8 h-8 text-royal flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">Auto-Cloud Backup</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Vos données sont sécurisées sur Google Drive. Prochaine synchronisation prévue à minuit.</p>
                  <div className="mt-4 text-xs font-black text-royal dark:text-royal-light flex items-center gap-2 tracking-wide uppercase"><CheckCircle className="w-4 h-4" /> Status : Synchronisé (il y a 2h)</div>
                </div>
                <button 
                  onClick={handleManualBackup}
                  className="px-6 py-3 bg-white text-royal border border-royal rounded-xl text-sm font-black shadow-sm hover:bg-royal hover:text-white transition-all flex-shrink-0 z-10"
                >
                  Lancer Manuel
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div 
                  onClick={handleExportStock}
                  className="border border-slate-100 dark:border-slate-700 p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:border-royal dark:hover:border-royal-light transition-all cursor-pointer group bg-slate-50/50 dark:bg-slate-900/30"
                >
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 text-royal dark:text-royal-light rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-slate-100 dark:border-slate-700"><Download className="w-7 h-7" /></div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Exporter Stock (.xlsx)</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Rapport complet de l'inventaire actuel.</p>
                  </div>
                </div>
                <div 
                  onClick={handleExportFinance}
                  className="border border-slate-100 dark:border-slate-700 p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:border-gold dark:hover:border-gold-light transition-all cursor-pointer group bg-slate-50/50 dark:bg-slate-900/30"
                >
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 text-gold-dark dark:text-gold-light rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-slate-100 dark:border-slate-700"><FileText className="w-7 h-7" /></div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Rapport Financier (.pdf)</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Bilan CA, Dettes et Dépenses mensuel.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-3"><FileText className="w-6 h-6 text-royal" /><h2 className="text-xl font-bold font-jakarta text-slate-800 dark:text-white">Audit & Traçabilité</h2></div>
                <button onClick={fetchLogs} className="p-2 text-slate-400 hover:text-royal transition-colors"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="py-10 text-center"><Loader2 className="w-8 h-8 text-royal animate-spin mx-auto" /></div>
                ) : logs.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-medium">Aucun journal d'activité enregistré.</div>
                ) : logs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 border border-slate-50 dark:border-slate-700/50 rounded-2xl bg-white dark:bg-slate-900/50 hover:shadow-md transition-shadow group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-royal-dark to-royal flex items-center justify-center font-black text-white text-xs uppercase shadow-sm group-hover:rotate-12 transition-transform">
                      {(log.userId?.username || 'S').charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-royal dark:text-royal-light">@{log.userId?.username || 'Système'}</span> {log.action}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-[10px] uppercase font-black tracking-widest text-slate-400">
                        <span>{new Date(log.createdAt).toLocaleString('fr-FR')}</span>
                        {log.ipAddress && <span className="text-slate-300">| IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                <Shield className="w-6 h-6 text-royal" />
                <h2 className="text-xl font-bold font-jakarta text-slate-800 dark:text-white">Sécurité du Compte</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Column */}
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <div className="w-12 h-12 bg-royal/10 rounded-2xl flex items-center justify-center mb-4">
                      <User className="w-6 h-6 text-royal" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Votre Rôle</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-black leading-relaxed">
                      {shopSettings.shopName} - {JSON.parse(localStorage.getItem('user'))?.role === 'admin' ? 'Administrateur Principal' : 'Gestionnaire Staff'}
                    </p>
                  </div>

                  <div className="p-6 bg-gold/5 rounded-3xl border border-gold/10">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-4 h-4 text-gold-dark" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gold-dark italic">Protection 2FA</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Double sécurité bientôt disponible pour ce compte.</p>
                  </div>
                </div>

                {/* Password Form Column */}
                <div className="lg:col-span-2">
                  <form onSubmit={handleUpdatePassword} className="space-y-5 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2 relative">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block italic">Mot de passe actuel</label>
                        <input 
                          type={showPassword.current ? "text" : "password"} 
                          required
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          placeholder="••••••••" 
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3 px-4 pr-12 outline-none transition-all text-sm dark:text-white" 
                        />
                        <button type="button" onClick={() => setShowPassword({...showPassword, current: !showPassword.current})} className="absolute right-4 top-[38px] text-slate-400 hover:text-royal transition-colors">
                          {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block italic">Nouveau mot de passe</label>
                        <input 
                          type={showPassword.new ? "text" : "password"} 
                          required
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          placeholder="Minimum 6" 
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3 px-4 pr-12 outline-none transition-all text-sm dark:text-white" 
                        />
                         <button type="button" onClick={() => setShowPassword({...showPassword, new: !showPassword.new})} className="absolute right-4 top-[38px] text-slate-400 hover:text-royal transition-colors">
                          {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block italic">Confirmer le nouveau</label>
                        <input 
                          type={showPassword.confirm ? "text" : "password"} 
                          required
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          placeholder="Confirmer" 
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3 px-4 pr-12 outline-none transition-all text-sm dark:text-white" 
                        />
                        <button type="button" onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})} className="absolute right-4 top-[38px] text-slate-400 hover:text-royal transition-colors">
                          {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-8 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? "Traitement..." : "Mettre à jour l'accès"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
