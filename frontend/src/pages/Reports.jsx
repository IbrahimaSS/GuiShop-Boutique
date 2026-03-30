import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  DollarSign, Package, Download, ChevronRight, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, BarChart3, Activity, Search, Clock, ArrowUpCircle
} from 'lucide-react';
import api from '../api/axios';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('daily');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [products, setProducts] = useState([]);
  const toast = useToast();

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = { timeframe };
      if (selectedProduct) params.productId = selectedProduct;

      const { data } = await api.get('/reports/bilan', { params });
      setReportData(data.data);
    } catch (err) {
      toast.error("Erreur lors de la génération du rapport");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [timeframe, selectedProduct]);

  if (loading && !reportData) {
    return <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
      <Clock className="w-12 h-12 animate-spin text-royal" />
      <p className="font-bold uppercase tracking-widest text-xs">Calcul du bilan en cours...</p>
    </div>;
  }

  const salesData = reportData?.summary || [];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">
            Bilan & Flux
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Analyse des actifs, entrées et sorties de la boutique.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 shadow-sm text-sm font-bold dark:text-white outline-none focus:border-royal"
          >
            <option value="daily">Aujourd'hui</option>
            <option value="monthly">Ce Mois</option>
            <option value="yearly">Cette Année</option>
          </select>

          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 shadow-sm text-sm font-bold dark:text-white outline-none focus:border-royal"
          >
            <option value="">Tous les Produits</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* NEW: Stock & Potential Metrics (So the user sees something even if no sales) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MiniStatCard label="Valeur Stock (Achat)" value={reportData?.totalStockValue || 0} icon={<Package className="w-4 h-4 text-royal" />} />
        <MiniStatCard label="Ventes Potentielles" value={reportData?.totalPotentialSales || 0} icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} />
        <MiniStatCard label="Articles en Stock" value={reportData?.totalItemsInStock || 0} icon={<Activity className="w-4 h-4 text-royal" />} isCurrency={false} />
        <MiniStatCard label="Ventes en Attente" value={reportData?.pendingSalesCount || 0} icon={<Clock className="w-4 h-4 text-amber-500" />} isCurrency={false} />
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Ventes (Période)"
          value={reportData?.totalSales || 0}
          icon={<DollarSign className="w-6 h-6" />}
          color="royal"
          trend="+12%"
        />
        <StatCard
          label="Profit Estimé"
          value={reportData?.totalProfit || 0}
          icon={<ArrowUpCircle className="w-6 h-6" />}
          color="emerald"
          trend="+8.5%"
        />
        <StatCard
          label="Sorties (Dépenses)"
          value={reportData?.totalExpenses || 0}
          icon={<TrendingDown className="w-6 h-6" />}
          color="red"
          trend="-2.4%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-jakarta font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-royal" /> Évolution du flux
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="total" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={15} name="Entrées (Ventes)" />
                <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} barSize={15} name="Profit Net" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-jakarta font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-gold-dark" /> Journal des Entrées & Sorties
            </h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {reportData?.activities?.length > 0 ? reportData.activities.map((act, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 text-left">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${act.type === 'sale' ? 'bg-emerald-100 text-emerald-600' :
                    act.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                  {act.type === 'sale' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{act.action}</p>
                  <p className="text-[10px] text-slate-400">{new Date(act.date).toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-slate-400 text-sm italic">Aucune activité enregistrée sur cette sélection.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    royal: 'text-royal bg-royal/10 border-royal/10 dark:bg-royal/5 dark:border-royal/5',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/20 dark:text-emerald-400',
    red: 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-800/20 dark:text-red-400'
  };

  return (
    <div className={`p-6 rounded-3xl border ${colors[color]} group hover:scale-[1.02] transition-all`}>
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">{icon}</div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
          <p className="text-2xl font-jakarta font-black">{formatCurrency(value)}</p>
        </div>
      </div>
    </div>
  );
};

const MiniStatCard = ({ label, value, icon, isCurrency = true }) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">{icon}</div>
    <div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
      <p className="text-sm font-black text-slate-800 dark:text-white">
        {isCurrency ? formatCurrency(value) : value}
      </p>
    </div>
  </div>
);

export default Reports;
