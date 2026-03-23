import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, User, Calendar, AlertTriangle, X, CreditCard, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/formatters';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const Debts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings } = useSettings();
  const toast = useToast();

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/debts');
      setDebts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const handlePayDebt = async () => {
    if (!showPayModal || !paymentAmount) return;
    setIsSubmitting(true);
    try {
      await api.post(`/debts/${showPayModal._id}/pay`, {
        amount: Number(paymentAmount),
        paymentMethod
      });
      toast.success(`Paiement de ${formatCurrency(paymentAmount)} enregistré !`);
      setShowPayModal(null);
      setPaymentAmount('');
      fetchDebts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Échec du traitement du paiement");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleReminder = (debt) => {
    if (!debt.clientPhone) {
      toast.warning("Aucun numéro de téléphone enregistré pour ce client");
      return;
    }

    const shopName = settings?.shopName || 'GUITECH';
    const amountStr = formatCurrency(debt.remainingAmount);
    const dateStr = new Date(debt.dueDate).toLocaleDateString('fr-FR');
    
    // Clean up phone number (remove spaces, etc)
    let phone = debt.clientPhone.replace(/\s/g, '');
    if (!phone.startsWith('+')) {
      // Assuming Guinea (+224) if no country code
      phone = phone.startsWith('224') ? '+' + phone : '+224' + phone;
    }

    const message = `Bonjour ${debt.clientName}, c'est l'équipe de ${shopName}. 
Nous vous envoyons ce petit rappel concernant votre reste à payer de ${amountStr} GNF prévu pour le ${dateStr}. 
Merci de passer à la boutique dès que possible pour régulariser votre situation.
Bonne journée !`;

    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
  };

  const totals = debts.reduce((acc, d) => {
    acc.total += d.remainingAmount;
    if (new Date(d.dueDate) < new Date() && d.status !== 'paid') {
      acc.overdue += d.remainingAmount;
    }
    return acc;
  }, { total: 0, overdue: 0 });

  const filtered = debts.filter(d => {
    const matchSearch = d.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    let matchStatus = true;
    if (filterStatus === 'overdue') matchStatus = new Date(d.dueDate) < new Date() && d.status !== 'paid';
    else if (filterStatus !== 'all') matchStatus = d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">Portefeuille Dettes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les créances clients et les remboursements en temps réel.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Dettes" value={totals.total} color="gold" />
        <StatCard label="Dettes En Retard" value={totals.overdue} color="red" />
        <StatCard label="Clients Actifs" value={debts.filter(d => d.status !== 'paid').length} isCount color="royal" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Rechercher un client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-xl py-2.5 pl-12 pr-4 outline-none transition-all text-sm dark:text-white" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'overdue', 'partially_paid', 'unpaid', 'paid'].map(status => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${filterStatus === status ? 'bg-royal text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                {status === 'all' ? 'Tous' : status === 'overdue' ? 'En Retard' : status === 'partially_paid' ? 'Partiel' : status === 'paid' ? 'Soldé' : 'Non Payé'}
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
                  <th className="p-4 pl-6">Client</th><th className="p-4">Articles</th><th className="p-4">Montant Total</th><th className="p-4">Reste</th><th className="p-4">Échéance</th><th className="p-4">Statut</th><th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filtered.map(debt => {
                  const isOverdue = new Date(debt.dueDate) < new Date() && debt.status !== 'paid';
                  return (
                    <tr key={debt._id} className="hover:bg-royal/[0.02] dark:hover:bg-slate-700/30 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${isOverdue ? 'bg-red-500' : 'bg-royal'}`}>{debt.clientName.charAt(0)}</div>
                          <div><div className="font-semibold text-slate-800 dark:text-white text-sm">{debt.clientName}</div><div className="text-xs text-slate-400 dark:text-slate-500">{debt.clientPhone}</div></div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={debt.products}>{debt.products || '—'}</td>
                      <td className="p-4 font-medium text-slate-600 dark:text-slate-300 text-sm">{formatCurrency(debt.totalAmount)}</td>
                      <td className="p-4 font-bold text-royal dark:text-royal-light text-sm">{formatCurrency(debt.remainingAmount)}</td>
                      <td className="p-4"><div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}><Calendar className="w-4 h-4" />{new Date(debt.dueDate).toLocaleDateString('fr-FR')}</div></td>
                      <td className="p-4">
                        {isOverdue && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"><AlertTriangle className="w-3.5 h-3.5" /> En Retard</span>}
                        {!isOverdue && debt.status === 'partially_paid' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-royal/10 text-royal dark:bg-royal/20 dark:text-royal-light">Partiel</span>}
                        {!isOverdue && debt.status === 'unpaid' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">Non Payé</span>}
                        {debt.status === 'paid' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Réglé</span>}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {debt.status !== 'paid' && (
                            <>
                              <button 
                                onClick={() => handleReminder(debt)} 
                                className="p-2 text-royal-dark hover:bg-royal/10 dark:text-royal-light rounded-xl transition-all"
                                title="Rappel WhatsApp"
                              >
                                <MessageCircle className="w-5 h-5" />
                              </button>
                              <button onClick={() => setShowPayModal(debt)} className="px-4 py-2 bg-royal text-white rounded-xl font-bold text-xs hover:bg-royal-dark transition-all active:scale-95 shadow-lg shadow-royal/20">Payer</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Paiement */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowPayModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-royal-dark to-royal p-8 flex items-center justify-between text-white flex-shrink-0 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                  <CreditCard className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-2xl font-jakarta font-black leading-none mb-1">
                    <span className="text-gradient-gold">Encaisser la Dette</span>
                  </h2>
                  <p className="text-white/50 text-[10px] font-medium tracking-wider uppercase italic">Régularisation de créance client</p>
                </div>
              </div>
              <button onClick={() => setShowPayModal(null)} className="p-3 hover:bg-white/20 rounded-2xl transition-all active:scale-95"><X className="w-6 h-6 text-white" /></button>
            </div>
            <div className="p-6 space-y-5 text-left">
              {/* Client Info Summary */}
              <div className="p-4 bg-royal/5 dark:bg-royal/10 rounded-2xl border border-royal/10 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client débiteur</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white leading-none">{showPayModal.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reste à payer</p>
                  <p className="text-xl font-black text-royal dark:text-royal-light leading-none">{formatCurrency(showPayModal.remainingAmount)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Montant à encaisser (GNF) *</label>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-xl py-4 px-4 outline-none transition-all text-2xl font-black text-royal dark:text-white" autoFocus />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mode de paiement</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl py-3.5 px-4 outline-none text-sm dark:text-white cursor-pointer font-medium">
                  <option>Espèces</option>
                  <option>Mobile Money (Orange/Areeba)</option>
                  <option>Chèque / Virement</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <button onClick={() => setShowPayModal(null)} className="px-5 py-2.5 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Plus tard</button>
              <button 
                onClick={handlePayDebt}
                disabled={!paymentAmount || isSubmitting}
                className="px-8 py-3 bg-royal text-white rounded-xl font-bold text-sm shadow-xl shadow-royal/30 active:scale-95 transition-all flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer le Paiement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color, isCount }) => (
  <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 hover:-translate-y-0.5 transition-all group">
    <div className={`absolute top-0 left-0 w-1.5 h-full bg-${color} shadow-[4px_0_15px_rgba(37,99,235,0.2)]`}></div>
    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
    <div className="mt-2 text-2xl font-black font-jakarta text-slate-800 dark:text-white">
      {isCount ? value : formatCurrency(value)}
    </div>
  </div>
);

export default Debts;
