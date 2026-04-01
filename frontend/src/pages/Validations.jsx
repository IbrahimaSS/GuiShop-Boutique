import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Package,
  ArrowUpCircle, Loader2, RefreshCw
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const Validations = () => {
  const [stockRequests, setStockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/stock-requests');
      setStockRequests(data.data.filter(r => r.status === 'pending'));
    } catch (err) {
      toast.error("Échec du chargement des demandes en attente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">Chargement des données...</p>
          </div>
        ) : (
          /* Stock Requests List - Direct Render */
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
