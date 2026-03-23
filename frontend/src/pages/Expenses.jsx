import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, TrendingDown, Receipt, X, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const Expenses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'Boutique',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/expenses');
      setExpenses(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/expenses', newExpense);
      toast.success(`Dépense de ${formatCurrency(newExpense.amount)} enregistrée !`);
      setShowAddModal(false);
      setNewExpense({
        title: '',
        amount: '',
        category: 'Boutique',
        date: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.error || "Échec de l'enregistrement du frais");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette dépense ?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.info("Dépense supprimée de l'historique");
      fetchExpenses();
    } catch (err) {
      toast.error("Impossible de supprimer cette dépense");
    }
  };

  const totalMonth = expenses.reduce((acc, exp) => {
    const expDate = new Date(exp.date);
    const now = new Date();
    if (expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()) {
      return acc + exp.amount;
    }
    return acc;
  }, 0);

  const filtered = expenses.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">Frais & Dépenses</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Suivez les coûts opérationnels de votre entreprise.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-royal to-royal-light text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-royal/30 flex items-center gap-2 active:scale-95"><Plus className="w-5 h-5" /> Ajouter Dépense</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Dépenses (Mois)" value={totalMonth} color="gold" />
        <StatCard label="Dépenses Totales" value={expenses.reduce((a, b) => a + b.amount, 0)} color="royal" />
        <StatCard label="Nombre de Frais" value={expenses.length} isCount color="royal-light" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Rechercher une dépense..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-xl py-2.5 pl-12 pr-4 outline-none transition-all text-sm dark:text-white" />
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="p-10 text-center"><Loader2 className="w-10 h-10 text-royal animate-spin mx-auto" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Description</th><th className="p-4">Catégorie</th><th className="p-4">Montant</th><th className="p-4">Date</th><th className="p-4">Enregistré par</th><th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filtered.map(expense => (
                  <tr key={expense._id} className="hover:bg-royal/[0.02] dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/10 dark:bg-gold/20 flex items-center justify-center text-gold-dark dark:text-gold-light group-hover:scale-110 transition-transform"><TrendingDown className="w-5 h-5" /></div>
                        <div className="font-semibold text-slate-800 dark:text-white text-sm">{expense.title}</div>
                      </div>
                    </td>
                    <td className="p-4"><span className="inline-flex px-3 py-1 rounded-lg text-xs font-semibold bg-royal/10 dark:bg-royal/20 text-royal dark:text-royal-light">{expense.category}</span></td>
                    <td className="p-4 font-bold text-royal dark:text-royal-light text-sm">{formatCurrency(expense.amount)}</td>
                    <td className="p-4 text-sm"><div className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Calendar className="w-4 h-4" />{new Date(expense.date).toLocaleDateString('fr-FR')}</div></td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 text-sm font-medium">{expense.createdBy?.fullName || 'Admin'}</td>
                    <td className="p-4 pr-6 text-right">
                      <button onClick={() => handleDelete(expense._id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Ajout Dépense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-royal-dark to-royal p-8 flex items-center justify-between text-white flex-shrink-0 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                  <AlertTriangle className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-2xl font-jakarta font-black leading-none mb-1">
                    <span className="text-gradient-gold">Nouvelle Dépense</span>
                  </h2>
                  <p className="text-white/50 text-[10px] font-medium tracking-wider uppercase italic">Enregistrer un frais opérationnel</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white/20 rounded-2xl transition-all active:scale-95"><X className="w-6 h-6 text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="text-left">
              <div className="p-6 space-y-4">
                <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Description *</label><input type="text" name="title" required value={newExpense.title} onChange={handleInputChange} placeholder="Ex: Transport de marchandise" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-xl py-3 px-4 outline-none transition-all text-sm dark:text-white" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Montant (GNF) *</label><input type="number" name="amount" required value={newExpense.amount} onChange={handleInputChange} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-xl py-3 px-4 outline-none transition-all text-sm dark:text-white font-bold" /></div>
                  <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Catégorie</label><select name="category" value={newExpense.category} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl py-3 px-4 outline-none text-sm dark:text-white cursor-pointer"><option>Boutique</option><option>Transport</option><option>Marketing</option><option>Loyer</option><option>Salaire</option><option>Electricité/Eau</option><option>Autre</option></select></div>
                </div>
                <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Date</label><input type="date" name="date" value={newExpense.date} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-xl py-3 px-4 outline-none transition-all text-sm dark:text-white" /></div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-gradient-to-r from-royal to-royal-light text-white rounded-xl font-bold text-sm shadow-lg shadow-royal/30 active:scale-95 transition-all flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color, isCount }) => (
  <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 hover:-translate-y-0.5 transition-all group">
    <div className={`absolute top-0 left-0 w-1.5 h-full bg-${color}`}></div>
    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
    <div className="mt-2 text-2xl font-black font-jakarta text-slate-800 dark:text-white">
      {isCount ? value : formatCurrency(value)}
    </div>
  </div>
);

export default Expenses;
