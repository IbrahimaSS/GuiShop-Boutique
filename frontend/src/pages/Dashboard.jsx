import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { formatCurrency } from '../utils/formatters';

const data = [
  { name: 'Lun', ventes: 4000000, depenses: 2400000 },
  { name: 'Mar', ventes: 3000000, depenses: 1398000 },
  { name: 'Mer', ventes: 2000000, depenses: 980000 },
  { name: 'Jeu', ventes: 2780000, depenses: 1908000 },
  { name: 'Ven', ventes: 1890000, depenses: 1800000 },
  { name: 'Sam', ventes: 2390000, depenses: 1300000 },
  { name: 'Dim', ventes: 3490000, depenses: 1500000 },
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/dashboard/stats');
      setStats(data.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError("Impossible de charger les données du tableau de bord");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-royal animate-spin" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-red-500 gap-4">
        <AlertCircle className="w-16 h-16" />
        <p className="text-xl font-bold">{error}</p>
        <button onClick={fetchStats} className="px-6 py-2 bg-royal text-white rounded-xl">Réessayer</button>
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">
            Tableau de Bord
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Aperçu en temps réel de vos activités et performances.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-royal animate-pulse"></span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Stats Cards - Palette Bleu + Or uniquement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1 - Ventes */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-royal-dark to-royal-light shadow-[4px_0_15px_rgba(37,99,235,0.4)]"></div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ventes du jour</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-jakarta text-slate-800 dark:text-white">
                    {formatCurrency(stats?.todayRevenue || 0)}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">GNF</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-royal/10 dark:bg-royal/20 flex items-center justify-center text-royal">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-bold text-royal bg-royal/10 px-2 py-1 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" /> +12.5%
              </span>
              <span className="text-slate-400">vs hier</span>
            </div>
          </div>
        </div>

        {/* Card 2 - Dettes */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-gold-dark to-gold shadow-[4px_0_15px_rgba(212,175,55,0.4)]"></div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dettes Actives</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-jakarta text-slate-800 dark:text-white">
                    {formatCurrency(stats?.totalRemainingDebt || 0)}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">GNF</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gold/10 dark:bg-gold/20 flex items-center justify-center text-gold-dark dark:text-gold-light">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-bold text-gold-dark bg-gold/10 px-2 py-1 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" /> +2.1%
              </span>
              <span className="text-slate-400">ce mois-ci</span>
            </div>
          </div>
        </div>

        {/* Card 3 - Dépenses */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-royal to-royal-light shadow-[4px_0_15px_rgba(96,165,250,0.4)]"></div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dépenses (Mois)</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-jakarta text-slate-800 dark:text-white">
                    {formatCurrency(stats?.totalMonthExpenses || 0)}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">GNF</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-royal-light/10 dark:bg-royal-light/20 flex items-center justify-center text-royal-light">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-bold text-royal bg-royal/10 px-2 py-1 rounded-lg">
                <TrendingDown className="w-3.5 h-3.5" /> -5.4%
              </span>
              <span className="text-slate-400">vs mois dernier</span>
            </div>
          </div>
        </div>

        {/* Card 4 - Bénéfice Net (Carte spéciale dégradé bleu+or) */}
        <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-royal-dark via-royal to-gold shadow-[0_8px_30px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-1 text-white">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gold-light/20 blur-2xl"></div>
          <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-2xl"></div>
          <div className="relative z-10 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-medium text-white/70 uppercase tracking-widest">Alertes Stock</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-jakarta text-white">{stats?.lowStockCount || 0}</span>
                  <span className="text-sm text-white/70 font-medium">Articles</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`flex items-center gap-1 font-bold text-white px-2 py-1 rounded-lg backdrop-blur-sm ${(stats?.lowStockCount || 0) > 0 ? 'bg-red-500/50' : 'bg-emerald-500/50'}`}>
                {stats?.lowStockCount > 0 ? 'Attention requise' : 'Tout est OK'}
              </span>
              <span className="text-white/60">Gestion stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Chart + Dernières Ventes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-jakarta font-bold text-slate-800 dark:text-white">Évolution Financière</h3>
            <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-xl px-4 py-2 font-medium text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-royal/50 cursor-pointer">
              <option>Cette semaine</option>
              <option>Ce mois</option>
              <option>Cette année</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}
                  formatter={(value) => new Intl.NumberFormat('fr-FR').format(value) + ' GNF'}
                />
                <Area type="monotone" dataKey="ventes" name="Ventes" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorVentes)" />
                <Area type="monotone" dataKey="depenses" name="Dépenses" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorDepenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-royal"></span>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ventes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gold"></span>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Dépenses</span>
            </div>
          </div>
        </div>

        {/* Dernières Ventes */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-jakarta font-bold text-slate-800 dark:text-white">Dernières Ventes</h3>
            <button className="text-royal text-sm font-semibold hover:underline">Voir tout</button>
          </div>
          
          <div className="flex-1 space-y-4">
            {stats?.recentSales?.length > 0 ? (
              stats.recentSales.map((sale) => (
                <div key={sale._id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sale.paymentType === 'credit' ? 'bg-gold/10 text-gold-dark' : 'bg-royal/10 text-royal'}`}>
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate max-w-[120px]">
                        {sale.items[0]?.name} {sale.items.length > 1 ? `(+${sale.items.length - 1})` : ''}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{formatCurrency(sale.totalAmount)}</p>
                    <p className={`text-xs font-semibold mt-0.5 ${sale.paymentType === 'credit' ? 'text-gold-dark' : 'text-royal'}`}>
                      {sale.paymentType === 'credit' ? 'Dette' : 'Payé'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <ShoppingBag className="w-8 h-8 opacity-20" />
                <p className="text-xs italic">Aucune vente aujourd'hui</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
