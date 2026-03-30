import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Package, ShoppingCart, 
  ArrowUpCircle, AlertCircle, Loader2, RefreshCw, User,
  Calendar, CreditCard, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';

const Validations = () => {
  const [salesRequests, setSalesRequests] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales'); // sales, stock
  const [expandedSale, setExpandedSale] = useState(null);
  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, stockRes] = await Promise.all([
        api.get('/sales?validationStatus=pending'),
        api.get('/stock-requests')
      ]);
      setSalesRequests(salesRes.data.data);
      setStockRequests(stockRes.data.data.filter(r => r.status === 'pending'));
    } catch (err) {
      toast.error("Échec du chargement des demandes en attente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleValidateSale = async (id, status) => {
    try {
      await api.patch(`/sales/${id}/validate`, { status });
      toast.success(status === 'approved' ? "Vente approuvée ! Stock déduit." : "Vente rejetée.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la validation");
    }
  };

  const handleValidateStock = async (id, status) => {
    try {
      await api.patch(`/stock-requests/${id}/validate`, { status });
      toast.success(status === 'approved' ? "Stock mis à jour !" : "Demande de stock rejetée.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la validation");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">
            Centre de Validation
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les demandes soumises par les gestionnaires.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 text-royal ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'sales' ? 'bg-white dark:bg-slate-700 shadow-md text-royal dark:text-royal-light scale-105' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Ventes en Attente
          {salesRequests.length > 0 && <span className="bg-royal text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">{salesRequests.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'stock' ? 'bg-white dark:bg-slate-700 shadow-md text-royal dark:text-royal-light scale-105' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" /> Demandes de Stock
          {stockRequests.length > 0 && <span className="bg-gold-dark text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">{stockRequests.length}</span>}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">Chargement des données...</p>
          </div>
        ) : activeTab === 'sales' ? (
          /* Sales List */
          <div className="grid grid-cols-1 gap-4">
            {salesRequests.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-bold">Aucune vente en attente !</p>
              </div>
            ) : (
              salesRequests.map(sale => (
                <div key={sale._id} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-slate-800 dark:text-white">Commande #{sale.saleNumber || 'Pending'}</span>
                        <span className="bg-amber-50 dark:bg-amber-900/10 text-amber-600 border border-amber-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3 h-3" /> À Valider
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <User className="w-3.5 h-3.5" /> {sale.createdBy?.fullName || 'Manager'}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs text-left">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(sale.createdAt).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 font-black text-royal dark:text-royal-light text-sm text-left">
                          <CreditCard className="w-4 h-4" /> {formatCurrency(sale.totalAmount)}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs text-left">
                          <Package className="w-3.5 h-3.5" /> {sale.items.length} articles
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => handleValidateSale(sale._id, 'rejected')}
                        className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Rejeter
                      </button>
                      <button 
                        onClick={() => handleValidateSale(sale._id, 'approved')}
                        className="flex-1 md:flex-none px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-xs hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approuver
                      </button>
                      <button 
                        onClick={() => setExpandedSale(expandedSale === sale._id ? null : sale._id)}
                        className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400"
                      >
                        {expandedSale === sale._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {expandedSale === sale._id && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="space-y-3 mt-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Détails des articles</p>
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.name}</p>
                              <p className="text-[10px] text-slate-400">PU: {formatCurrency(item.price)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-royal">x{item.quantity}</p>
                              <p className="text-xs font-bold text-slate-500">{formatCurrency(item.totalPrice)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {sale.clientName && (
                         <div className="mt-4 p-4 bg-royal/5 dark:bg-royal/10 rounded-2xl border border-royal/10 dark:border-royal/20">
                            <p className="text-[10px] font-black text-royal dark:text-royal-light uppercase tracking-widest mb-1">Informations Client</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-white">{sale.clientName} {sale.clientPhone ? `• ${sale.clientPhone}` : ''}</p>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Stock Requests List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stockRequests.length === 0 ? (
              <div className="md:col-span-2 bg-white dark:bg-slate-800 p-20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-bold">Aucune demande de réapprovisionnement !</p>
              </div>
            ) : (
              stockRequests.map(req => (
                <div key={req._id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold-dark">
                        <ArrowUpCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">{req.product?.name || 'Produit Inconnu'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Demandé par : {req.requester?.fullName || 'Manager'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-jakarta font-black text-gold-dark leading-none">+{req.quantity}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Quantité Stock</p>
                    </div>
                  </div>

                  {req.note && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 text-xs italic text-slate-500">
                       "{req.note}"
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleValidateStock(req._id, 'rejected')}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Rejeter
                    </button>
                    <button 
                      onClick={() => handleValidateStock(req._id, 'approved')}
                      className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl font-bold text-xs hover:bg-emerald-100 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approuver le Stock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Validations;
