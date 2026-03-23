import React, { useState, useEffect } from 'react';
import { Plus, Search, User, Shield, ShieldAlert, CheckCircle, XCircle, Edit, Trash2, X, Loader2, Mail, Phone, MapPin, UserPlus } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'manager'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Une erreur est survenue lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/users', newUser);
      toast.success(`Compte créé pour ${newUser.fullName || newUser.username}`);
      setShowAddModal(false);
      setNewUser({ username: '', email: '', password: '', fullName: '', phone: '', role: 'manager' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la création du compte personnel");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/${deleteConfirmId}`);
      toast.success("Accès révoqué et compte supprimé de la base de données");
      setDeleteConfirmId(null);
      fetchUsers();
    } catch (err) {
      console.error("[DEBUG] Erreur suppression :", err);
      toast.error(err.response?.data?.error || "Une erreur est survenue lors de la suppression");
      setDeleteConfirmId(null);
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">Gestion du Personnel</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les accès, les rôles et les profils de votre équipe.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-royal to-royal-light text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-royal/30 flex items-center gap-2 active:scale-95"><Plus className="w-5 h-5" /> Ajouter un compte</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Membres" value={users.length} icon={<User className="w-6 h-6" />} color="royal" />
        <StatCard label="Administrateurs" value={users.filter(u => u.role === 'admin').length} icon={<ShieldAlert className="w-6 h-6" />} color="gold" />
        <StatCard label="Statut Actif" value={users.length} icon={<CheckCircle className="w-6 h-6" />} color="emerald" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Rechercher par nom, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-xl py-2.5 pl-12 pr-4 outline-none transition-all text-sm dark:text-white" />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="p-10 text-center"><Loader2 className="w-10 h-10 text-royal animate-spin mx-auto" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Utilisateur</th><th className="p-4">Coordonnées</th><th className="p-4">Rôle</th><th className="p-4">Récents</th><th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filtered.map(user => (
                  <tr key={user._id} className="hover:bg-royal/[0.02] dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-royal-dark to-royal flex items-center justify-center font-black text-white text-lg shadow-sm uppercase group-hover:scale-110 transition-transform">
                          {user.username.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white text-sm">{user.fullName || user.username}</div>
                          <div className="text-xs text-royal font-medium">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5"><Mail className="w-3 h-3" /> {user.email}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5"><Phone className="w-3 h-3" /> {user.phone || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-gold/10 text-gold-dark dark:bg-gold/20 dark:text-gold-light border border-gold/20"><ShieldAlert className="w-3 h-3" /> Admin System</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-royal/10 text-royal dark:bg-royal/20 dark:text-royal-light border border-royal/20"><User className="w-3 h-3" /> Staff GB</span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDeleteRequest(user._id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Confirmation de Suppression */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in transition-all" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transform" onClick={(e) => e.stopPropagation()}>
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-red-50 dark:ring-red-900/10 rotate-3 transition-transform">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-jakarta font-extrabold text-slate-800 dark:text-white">Confirmer ?</h3>
                <p className="text-slate-500 text-sm font-medium">Voulez-vous vraiment révoquer cet accès définitivment ?</p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={confirmDelete} className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-black shadow-xl shadow-red-500/20 active:scale-95 transition-all">Révoquer l'accès</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 transition-all">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout Utilisateur */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-royal-dark to-royal p-8 flex items-center justify-between text-white flex-shrink-0 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                  <UserPlus className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-2xl font-jakarta font-black leading-none mb-1">
                    <span className="text-gradient-gold">Nouveau Compte Personnel</span>
                  </h2>
                  <p className="text-white/50 text-[10px] font-medium tracking-wider uppercase italic">Créez un accès sécurisé pour un membre de l'équipe</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white/20 rounded-2xl transition-all active:scale-95"><X className="w-6 h-6 text-white" /></button>
            </div>

            <form onSubmit={handleSubmit} className="text-left">
              <div className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Identifiant *</label><input type="text" name="username" required value={newUser.username} onChange={handleInputChange} placeholder="Ex: amadou.staff" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 px-4 outline-none transition-all text-sm dark:text-white" /></div>
                  <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nom complet</label><input type="text" name="fullName" value={newUser.fullName} onChange={handleInputChange} placeholder="Ex: Amadou Diallo" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 px-4 outline-none transition-all text-sm dark:text-white" /></div>
                </div>
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Email Professionnel *</label><input type="email" name="email" required value={newUser.email} onChange={handleInputChange} placeholder="staff@projetgb.com" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 px-4 outline-none transition-all text-sm dark:text-white font-medium" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Mot de passe temporaire *</label><input type="password" name="password" required value={newUser.password} onChange={handleInputChange} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 px-4 outline-none transition-all text-sm dark:text-white tracking-widest" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Rôle & Permissions</label><select name="role" value={newUser.role} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl py-3.5 px-4 outline-none text-sm dark:text-white cursor-pointer font-bold border-l-4 border-l-royal"><option value="manager">Gestionnaire</option><option value="admin">Administrateur</option></select></div>
                  <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Téléphone</label><input type="text" name="phone" value={newUser.phone} onChange={handleInputChange} placeholder="+224..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-xl py-3.5 px-4 outline-none transition-all text-sm dark:text-white" /></div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-3 bg-gradient-to-r from-royal-dark to-royal text-white rounded-xl font-black text-sm shadow-xl shadow-royal/30 active:scale-95 transition-all flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Générer le Compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 flex items-center gap-5 hover:-translate-y-1 transition-all group">
    <div className={`absolute top-0 left-0 w-2 h-full bg-${color}`}></div>
    <div className={`p-4 bg-${color}/10 text-${color} rounded-2xl group-hover:scale-110 transition-transform`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
      <div className="text-4xl font-black font-jakarta text-slate-800 dark:text-white mt-1">{value}</div>
    </div>
  </div>
);

export default Users;
