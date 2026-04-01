import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Download, FileText, Printer, Eye, X, Calendar, CheckCircle, Clock, ChevronDown, Loader2, FileCheck, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

const API_URL = 'http://localhost:5000';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const toast = useToast();
  const printRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/invoices');
      setInvoices(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/invoices/${deleteConfirmId}`);
      toast.success("Facture supprimée avec succès");
      setDeleteConfirmId(null);
      fetchInvoices();
    } catch (err) {
      toast.error("Échec de la suppression");
      setDeleteConfirmId(null);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadPDF = (id) => {
    const token = localStorage.getItem('token');
    // Direct location change works better than window.open which can be blocked by browsers
    window.location.href = `http://localhost:5000/api/invoices/${id}/pdf?token=${token}`;
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Facture ${viewInvoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1a365d; }
          .shop-info { display: flex; align-items: center; gap: 15px; }
          .shop-logo { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; }
          .shop-logo-fallback { width: 60px; height: 60px; border-radius: 12px; background: linear-gradient(135deg, #b8860b, #d4a843); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 22px; }
          .shop-name { font-size: 24px; font-weight: 800; color: #1a365d; }
          .shop-details { font-size: 11px; color: #666; margin-top: 4px; }
          .invoice-meta { text-align: right; }
          .invoice-type { font-size: 14px; font-weight: 700; color: #b8860b; text-transform: uppercase; letter-spacing: 2px; }
          .invoice-number { font-size: 12px; color: #555; margin-top: 4px; font-family: monospace; }
          .invoice-date { font-size: 11px; color: #777; margin-top: 2px; }
          .client-box { background: #f8f4e8; border-radius: 10px; padding: 15px; margin-bottom: 25px; display: inline-block; float: right; min-width: 220px; }
          .client-label { font-size: 9px; font-weight: 700; color: #1a365d; text-transform: uppercase; letter-spacing: 1px; }
          .client-name { font-size: 16px; font-weight: 700; color: #333; margin-top: 4px; }
          .client-phone { font-size: 12px; color: #b8860b; font-weight: 600; }
          .clear { clear: both; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          thead th { background: #1a365d; color: white; padding: 10px 15px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
          thead th:first-child { border-radius: 8px 0 0 0; }
          thead th:last-child { border-radius: 0 8px 0 0; text-align: right; }
          thead th:nth-child(2), thead th:nth-child(3) { text-align: center; }
          tbody td { padding: 10px 15px; font-size: 12px; border-bottom: 1px solid #eee; }
          tbody tr:nth-child(even) { background: #fafafa; }
          tbody td:last-child { text-align: right; font-weight: 700; }
          tbody td:nth-child(2), tbody td:nth-child(3) { text-align: center; }
          .total-section { display: flex; justify-content: flex-end; margin-top: 20px; }
          .total-box { background: #1a365d; color: white; border-radius: 12px; padding: 15px 25px; text-align: center; min-width: 220px; }
          .total-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }
          .total-amount { font-size: 26px; font-weight: 800; margin-top: 4px; }
          .footer { margin-top: 50px; padding-top: 15px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 10px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Helper to get shop initials
  const getShopInitials = (name) => {
    return (name || 'GB').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">Factures & Reçus</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Historique complet des transactions et documents légaux.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Documents" value={invoices.length} sub="Historique global" />
        <StatCard label="Montant Total" value={invoices.reduce((a, b) => a + b.totalAmount, 0)} isCurrency sub="Cumul des ventes" />
        <StatCard label="Recouvrement" value={invoices.filter(i => i.status === 'paid').length} sub="Factures soldées" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Rechercher par N° facture, client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-xl py-2.5 pl-12 pr-4 outline-none transition-all text-sm dark:text-white" />
          </div>
          <div className="flex items-center gap-2">
            {['all', 'standard', 'paid_undelivered', 'unpaid_delivered'].map(status => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-tighter font-black transition-all ${filterStatus === status ? 'bg-royal text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                {status === 'all' ? 'Tous' : status === 'standard' ? 'Standard' : status === 'paid_undelivered' ? 'Payé non livré' : 'Non Payé Livré'}
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
                  <th className="p-4 pl-6">N° Document</th><th className="p-4">Client</th><th className="p-4">Total</th><th className="p-4">Date</th><th className="p-4">Statut</th><th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filtered.map(inv => (
                  <tr key={inv._id} className="hover:bg-royal/[0.02] dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inv.type === 'invoice' ? 'bg-royal/10 text-royal' : 'bg-gold/10 text-gold-dark'}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white text-sm font-mono">{inv.invoiceNumber}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">{inv.type === 'invoice' ? 'Facture' : 'Reçu'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{inv.clientName || 'Client Comptant'}</div><div className="text-xs text-slate-400 dark:text-slate-500">{inv.clientPhone}</div></td>
                    <td className="p-4 font-bold text-slate-800 dark:text-white text-sm">{formatCurrency(inv.totalAmount)}</td>
                    <td className="p-4 text-sm"><div className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Calendar className="w-4 h-4" />{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</div></td>
                    <td className="p-4">
                      {inv.status === 'standard' || inv.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200/50"><CheckCircle className="w-3 h-3" /> Standard</span>
                      ) : inv.status === 'paid_undelivered' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-royal/10 text-royal dark:bg-royal/20 dark:text-royal-light border border-royal/20"><Clock className="w-3 h-3" /> Payé Non Livré</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gold/10 text-gold-dark dark:bg-gold/20 dark:text-gold-light border border-gold/20"><FileText className="w-3 h-3" /> Non Payé Livré</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewInvoice(inv)} className="p-2 text-slate-400 hover:text-royal hover:bg-royal/10 rounded-lg transition-colors" title="Aperçu"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleDownloadPDF(inv._id)} className="p-2 text-slate-400 hover:text-gold-dark hover:bg-gold/10 rounded-lg transition-colors" title="Télécharger PDF"><Download className="w-4 h-4" /></button>
                        {isAdmin && (
                          <button onClick={() => handleDeleteRequest(inv._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                        )}
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
                <p className="text-slate-500 text-sm font-medium">Voulez-vous vraiment supprimer définitivement cette facture ?</p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={confirmDelete} className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-black shadow-xl shadow-red-500/20 active:scale-95 transition-all">Supprimer</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 transition-all">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aperçu Facture */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in text-left" onClick={() => setViewInvoice(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-royal-dark to-royal p-7 text-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-jakarta font-bold flex items-center gap-3">
                    <FileCheck className="w-7 h-7" />
                    {viewInvoice.type === 'invoice' ? 'Facture' : 'Reçu'}
                  </h2>
                  {viewInvoice.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30"><CheckCircle className="w-3.5 h-3.5" /> Payée</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30"><Clock className="w-3.5 h-3.5" /> En attente</span>
                  )}
                </div>
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-gold-light via-gold to-white text-lg font-black font-mono mt-2 tracking-wide">#{viewInvoice.invoiceNumber}</p>
                <p className="text-white/60 text-sm mt-1">Généré le {new Date(viewInvoice.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <button onClick={() => setViewInvoice(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Printable content */}
            <div ref={printRef} className="p-8 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    {settings?.logo ? (
                      <img
                        src={`${API_URL}${settings.logo}`}
                        alt="Logo"
                        className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-gold/20"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-gold/20"
                      style={settings?.logo ? { display: 'none' } : {}}
                    >
                      {getShopInitials(settings?.shopName)}
                    </div>
                    <div>
                      <span className="font-jakarta font-black text-2xl text-royal-dark dark:text-white">{settings?.shopName || 'Projet GB'}</span>
                      <div className="space-y-0.5 text-xs text-slate-500 font-medium">
                        <p>{settings?.location || 'Conakry, Guinée'}</p>
                        <p className="font-bold text-royal">{settings?.contactPhone || ''}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Détails Client</p>
                    <p className="font-bold text-slate-800 dark:text-white text-lg">{viewInvoice.clientName || 'Client Comptant'}</p>
                    <p className="text-sm text-royal font-semibold">{viewInvoice.clientPhone}</p>
                  </div>
                  {viewInvoice.status === 'paid' ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Payée</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">En attente</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-tighter"><th className="p-4 text-left">Article</th><th className="p-4 text-center">Qté</th><th className="p-4 text-right">P.U.</th><th className="p-4 pr-6 text-right">Montant</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {(viewInvoice.items || viewInvoice.sale?.items || []).map((item, idx) => {
                      const qty = item.quantity || item.qty || 1;
                      const unitPrice = item.price || item.unitPrice || 0;
                      const lineTotal = item.totalPrice || item.total || (unitPrice * qty);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{item.name}</td>
                          <td className="p-4 text-center font-bold text-slate-500 dark:text-slate-400">{qty}</td>
                          <td className="p-4 text-right font-medium text-slate-500 dark:text-slate-400">{formatCurrency(unitPrice)}</td>
                          <td className="p-4 pr-6 text-right font-black text-slate-800 dark:text-white">{formatCurrency(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>


              <div className="flex justify-end pt-4">
                <div className="bg-royal dark:bg-royal-dark rounded-3xl p-6 text-white text-right shadow-2xl shadow-royal/20 min-w-[240px]">
                  <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Montant Total Payé</p>
                  <p className="text-3xl font-black font-jakarta">{formatCurrency(viewInvoice.totalAmount)}</p>
                </div>
              </div>

              {/* Footer for print */}
              <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-400">Merci pour votre confiance !</p>
                <p className="text-[10px] text-slate-300 mt-1">{settings?.shopName || 'Projet GB'} — {settings?.location || ''} — {settings?.contactPhone || ''}</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <button onClick={() => setViewInvoice(null)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors">Fermer</button>
              <button onClick={handlePrint} className="px-8 py-2.5 bg-white dark:bg-slate-700 border-2 border-royal text-royal dark:text-royal-light rounded-xl font-bold text-sm shadow-sm hover:bg-royal/5 active:scale-95 transition-all flex items-center gap-2">
                <Printer className="w-4 h-4" /> Imprimer
              </button>
              <button onClick={() => handleDownloadPDF(viewInvoice._id)} className="px-8 py-2.5 bg-gradient-to-r from-royal to-royal-light text-white rounded-xl font-bold text-sm shadow-xl shadow-royal/30 active:scale-95 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, isCurrency, sub }) => (
  <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 hover:-translate-y-0.5 transition-all group">
    <div className="absolute top-0 left-0 w-1.5 h-full bg-gold"></div>
    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
    <div className="mt-2 text-2xl font-black font-jakarta text-slate-800 dark:text-white">
      {isCurrency ? formatCurrency(value) : value}
    </div>
    {sub && <p className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</p>}
  </div>
);

export default Invoices;
