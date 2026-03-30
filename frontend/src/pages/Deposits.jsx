import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter, Camera, Clock, CheckCircle, X, Upload, ImageIcon, Trash2, Loader2, Box, Package, Archive, CreditCard } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const Deposits = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  
  const [newDeposit, setNewDeposit] = useState({
    itemName: '',
    ownerName: '',
    ownerPhone: '',
    expectedReturnDate: '',
    description: '',
    category: 'material',
    amount: ''
  });

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/deposits');
      setDeposits(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDeposit(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(newDeposit).forEach(key => formData.append(key, newDeposit[key]));
      if (photoFile) formData.append('photo', photoFile);

      await api.post('/deposits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(`Dépôt de "${newDeposit.itemName}" enregistré avec succès !`);
      setShowAddModal(false);
      setNewDeposit({ itemName: '', ownerName: '', ownerPhone: '', expectedReturnDate: '', description: '' });
      setPhotoPreview(null);
      setPhotoFile(null);
      fetchDeposits();
    } catch (err) {
      toast.error(err.response?.data?.error || "Une erreur est survenue lors de l'enregistrement du dépôt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async (id) => {
    if (!window.confirm("Confirmer la restitution de cet objet ?")) return;
    try {
      await api.patch(`/deposits/${id}/return`);
      toast.info("L'objet a été marqué comme restitué");
      fetchDeposits();
    } catch (err) {
      toast.error("Échec de la validation de la restitution");
    }
  };

  const filtered = deposits.filter(d => {
    const matchSearch = d.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || d.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">Registre des Dépôts</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Matériel confié en consigne ou pour réparation.</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setPhotoPreview(null); }} className="bg-gradient-to-r from-royal to-royal-light text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-royal/30 flex items-center gap-2 active:scale-95"><Plus className="w-5 h-5" /> Nouveau Dépôt</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Dépôts Actifs" value={deposits.filter(d => d.status !== 'retrieved').length} color="royal" />
        <StatCard label="En Retard" value={deposits.filter(d => d.status === 'overdue').length} color="red" />
        <StatCard label="Total Historique" value={deposits.length} color="gold" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Rechercher un objet, propriétaire..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-xl py-2.5 pl-12 pr-4 outline-none transition-all text-sm dark:text-white" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'deposited', 'overdue', 'retrieved'].map(status => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${filterStatus === status ? 'bg-royal text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                {status === 'all' ? 'Tous' : status === 'deposited' ? 'En Dépôt' : status === 'overdue' ? 'En Retard' : 'Restitué'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="p-10 text-center"><Loader2 className="w-10 h-10 text-royal animate-spin mx-auto" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Objet</th><th className="p-4">Propriétaire</th><th className="p-4">Date dépôt</th><th className="p-4">Retour prévu</th><th className="p-4">Photo</th><th className="p-4">Statut</th><th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filtered.map(deposit => (
                  <tr key={deposit._id} className="hover:bg-royal/[0.02] dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-royal/10 dark:bg-royal/20 flex items-center justify-center text-royal dark:text-royal-light"><Package className="w-5 h-5" /></div>
                        <div className="font-semibold text-slate-800 dark:text-white text-sm">{deposit.itemName}</div>
                      </div>
                    </td>
                    <td className="p-4"><div className="font-medium text-slate-700 dark:text-slate-300 text-sm">{deposit.ownerName}</div><div className="text-xs text-slate-400 dark:text-slate-500">{deposit.ownerPhone}</div></td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{new Date(deposit.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4"><div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm"><Clock className="w-4 h-4" />{new Date(deposit.expectedReturnDate).toLocaleDateString('fr-FR')}</div></td>
                    <td className="p-4">
                      {deposit.photo ? (
                        <button onClick={() => window.open(`${import.meta.env.VITE_API_URL.replace('/api', '')}/${deposit.photo}`, '_blank')} className="inline-flex items-center gap-1 text-xs font-semibold text-royal dark:text-royal-light hover:underline"><ImageIcon className="w-3.5 h-3.5" /> Voir</button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {deposit.status === 'overdue' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">En Retard</span>}
                      {deposit.status === 'retrieved' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> Restitué</span>}
                      {deposit.status === 'deposited' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-royal/10 text-royal dark:bg-royal/20 dark:text-royal-light">En Dépôt</span>}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {deposit.status !== 'retrieved' && (
                        <button onClick={() => handleReturn(deposit._id)} className="px-4 py-2 bg-royal text-white rounded-xl font-bold text-xs hover:bg-royal-dark transition-all active:scale-95 shadow-lg shadow-royal/20">Restituer</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Ajout Dépôt */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-royal-dark to-royal p-8 flex items-center justify-between text-white flex-shrink-0 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                  <Package className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-2xl font-jakarta font-black leading-none mb-1">
                    <span className="text-gradient-gold">Nouveau Dépôt Matériel</span>
                  </h2>
                  <p className="text-white/50 text-[10px] font-medium tracking-wider uppercase italic">Enregistrer un matériel avec photo et échéance</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white/20 rounded-2xl transition-all active:scale-95"><X className="w-6 h-6 text-white" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 text-left">
              <div className="p-6 space-y-4">
                <div className="flex gap-4 p-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all border-2 ${newDeposit.category === 'material' ? 'bg-white dark:bg-slate-800 border-royal shadow-md text-royal' : 'border-transparent text-slate-500 dark:text-slate-400'}`}>
                    <input type="radio" name="category" value="material" checked={newDeposit.category === 'material'} onChange={handleInputChange} className="hidden" />
                    <Package className="w-4 h-4" /> <span className="text-xs font-black uppercase tracking-widest">Matériel</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all border-2 ${newDeposit.category === 'money' ? 'bg-white dark:bg-slate-800 border-gold shadow-md text-gold-dark' : 'border-transparent text-slate-500 dark:text-slate-400'}`}>
                    <input type="radio" name="category" value="money" checked={newDeposit.category === 'money'} onChange={handleInputChange} className="hidden" />
                    <CreditCard className="w-4 h-4" /> <span className="text-xs font-black uppercase tracking-widest">Argent</span>
                  </label>
                </div>

                {newDeposit.category === 'material' ? (
                  <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Nom de l'objet *</label><input type="text" name="itemName" required={newDeposit.category === 'material'} value={newDeposit.itemName} onChange={handleInputChange} placeholder="Ex: PC Portable Dell" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal rounded-xl py-3 px-4 text-sm dark:text-white" /></div>
                ) : (
                  <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Montant Confié *</label><input type="number" name="amount" required={newDeposit.category === 'money'} value={newDeposit.amount} onChange={handleInputChange} placeholder="Ex: 500000" className="w-full bg-slate-50 dark:bg-slate-900 border border-gold-dark/30 focus:border-gold rounded-xl py-3 px-4 font-black text-lg text-gold-dark transition-all" /></div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Propriétaire *</label><input type="text" name="ownerName" required value={newDeposit.ownerName} onChange={handleInputChange} placeholder="Nom" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal rounded-xl py-3 px-4 text-sm dark:text-white" /></div>
                  <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Téléphone</label><input type="text" name="ownerPhone" value={newDeposit.ownerPhone} onChange={handleInputChange} placeholder="+224..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal rounded-xl py-3 px-4 text-sm dark:text-white" /></div>
                </div>
                <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Restitution prévue *</label><input type="date" name="expectedReturnDate" required value={newDeposit.expectedReturnDate} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal rounded-xl py-3 px-4 text-sm dark:text-white" /></div>

                {/* Photo Section (Only for material) */}
                {newDeposit.category === 'material' && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Photo de l'équipement</label>
                    {photoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-600">
                        <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover" />
                        <button type="button" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }} className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg shadow-md hover:bg-white text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => cameraInputRef.current?.click()} className="border-2 border-dashed border-royal/30 dark:border-royal/40 text-royal dark:text-royal-light rounded-2xl p-6 flex flex-col items-center gap-2 hover:bg-royal/5 transition-all cursor-pointer">
                          <Camera className="w-8 h-8" />
                          <span className="text-xs font-semibold">Caméra</span>
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gold/30 dark:border-gold/40 text-gold-dark dark:text-gold-light rounded-2xl p-6 flex flex-col items-center gap-2 hover:bg-gold/5 transition-all cursor-pointer">
                          <Upload className="w-8 h-8" />
                          <span className="text-xs font-semibold">Fichier</span>
                        </button>
                        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" />
                      </div>
                    )}
                  </div>
                )}
                <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Description / État</label><textarea name="description" value={newDeposit.description} onChange={handleInputChange} placeholder="Description de l'état de l'objet..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-xl py-3 px-4 outline-none transition-all text-sm dark:text-white resize-none h-20"></textarea></div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-gradient-to-r from-royal to-royal-light text-white rounded-xl font-bold text-sm shadow-xl shadow-royal/30 active:scale-95 transition-all flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider le Dépôt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => {
  const colorMap = {
    royal: 'bg-royal shadow-[4px_0_15px_rgba(37,99,235,0.3)]',
    gold: 'bg-gold shadow-[4px_0_15px_rgba(212,175,55,0.3)]',
    red: 'bg-red-500 shadow-[4px_0_15px_rgba(239,68,68,0.3)]'
  };

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 hover:-translate-y-0.5 transition-all group">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${colorMap[color] || 'bg-royal'}`}></div>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
      <div className="mt-2 text-3xl font-black font-jakarta text-slate-800 dark:text-white">{value}</div>
    </div>
  );
};

export default Deposits;
