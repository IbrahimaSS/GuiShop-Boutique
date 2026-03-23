import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Edit, Trash2, CheckCircle, AlertTriangle, XCircle, ScanLine, X, Loader2, Package, Tag, Layers, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'Tôles & Toitures',
    purchasePrice: '',
    sellingPrice: '',
    stock: '',
    alertThreshold: 5
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products');
      setProducts(data.data);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des produits");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '', barcode: '', category: 'Tôles & Toitures',
      purchasePrice: '', sellingPrice: '', stock: '', alertThreshold: 5
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      category: product.category,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      alertThreshold: product.alertThreshold
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData);
        toast.success("Produit mis à jour avec succès !");
      } else {
        await api.post('/products', formData);
        toast.success("Produit ajouté au catalogue !");
      }
      setShowAddModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Une erreur est survenue lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible.")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Référence supprimée de l'inventaire");
      fetchProducts();
    } catch (err) {
      toast.error("Impossible de supprimer ce produit car il est lié à des transactions");
    }
  };

  const generateBarcode = () => {
    const random = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    setFormData(prev => ({ ...prev, barcode: random }));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  // Vérifier le rôle de l'utilisateur
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">
            Catalogue & Inventaire
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez votre catalogue de produits et surveillez les niveaux de stock en temps réel.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-royal-dark to-royal text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-royal/30 flex items-center gap-2 active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Ajouter un Produit
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <QuickStat label="Total Produits" value={products.length} icon={<Package className="w-4 h-4" />} color="royal" />
        <QuickStat label="Valeur Stock" value={products.reduce((a, b) => a + (b.purchasePrice * b.stock), 0)} isCurrency color="emerald" />
        <QuickStat label="Alertes Stock" value={products.filter(p => p.stock <= p.alertThreshold).length} icon={<AlertTriangle className="w-4 h-4" />} color="gold" />
        <QuickStat label="Ruptures" value={products.filter(p => p.stock === 0).length} icon={<XCircle className="w-4 h-4" />} color="red" />
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-[450px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-royal transition-colors w-5 h-5" />
            <input type="text" placeholder="Rechercher par nom, code-barres, catégorie..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-4 focus:ring-royal/10 rounded-2xl py-3 pl-12 pr-4 outline-none transition-all text-sm dark:text-white" />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-600 dark:text-slate-300 text-xs hover:border-royal transition-all shadow-sm">
              <Filter className="w-4 h-4 text-royal" /> Filtrer
            </button>
            <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-600 dark:text-slate-300 text-xs hover:border-gold transition-all shadow-sm">
              <Download className="w-4 h-4 text-gold-dark" /> Exporter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                <th className="p-5 pl-8">Désignation Produit</th>
                <th className="p-5">Classification</th>
                <th className="p-5 text-right">P. Unitaire</th>
                <th className="p-5 text-center">Niveau Stock</th>
                <th className="p-5">État</th>
                <th className="p-5 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <Loader2 className="w-12 h-12 text-royal animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronisation de l'inventaire...</p>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <tr key={product._id} className="hover:bg-royal/[0.01] dark:hover:bg-slate-700/20 transition-all group">
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-royal/10 group-hover:text-royal transition-colors">
                          <Tag className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white group-hover:text-royal dark:group-hover:text-royal-light transition-colors text-sm">{product.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black mt-0.5 tracking-wider uppercase">{product.barcode || 'Générer code'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter bg-royal/5 dark:bg-royal/20 text-royal dark:text-royal-light border border-royal/10">
                        <Layers className="w-3 h-3" /> {product.category}
                      </span>
                    </td>
                    <td className="p-5 text-right font-black text-slate-800 dark:text-white text-sm">
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex flex-col items-center">
                        <div className={`text-sm font-black ${product.stock <= product.alertThreshold ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {product.stock}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Seuil: {product.alertThreshold}</div>
                      </div>
                    </td>
                    <td className="p-5">
                      {product.status === 'in_stock' && (
                        <div className="flex items-center gap-2 text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[10px] font-black uppercase tracking-widest">En Stock</span></div>
                      )}
                      {product.status === 'low_stock' && (
                        <div className="flex items-center gap-2 text-gold-dark"><div className="w-2 h-2 rounded-full bg-gold-dark"></div><span className="text-[10px] font-black uppercase tracking-widest">Critique</span></div>
                      )}
                      {product.status === 'out_of_stock' && (
                        <div className="flex items-center gap-2 text-red-500"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[10px] font-black uppercase tracking-widest">Rupture</span></div>
                      )}
                    </td>
                    <td className="p-5 pr-8 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button onClick={() => handleOpenEdit(product)} className="p-2.5 text-slate-400 hover:text-royal hover:bg-royal/10 rounded-xl transition-all" title="Modifier"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(product._id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                    Aucun article dans cette catégorie
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajout/Edit Produit */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-royal-dark to-royal p-8 flex items-center justify-between text-white flex-shrink-0 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                  {editingProduct ? <Edit className="w-6 h-6 text-gold" /> : <Package className="w-6 h-6 text-gold" />}
                </div>
                <div>
                  <h2 className="text-2xl font-jakarta font-black leading-none mb-1">
                    <span className="text-gradient-gold">
                      {editingProduct ? 'Modifier le Produit' : 'Nouvelle Référence'}
                    </span>
                  </h2>
                  <p className="text-white/50 text-[10px] font-medium tracking-wider uppercase italic">Enregistrement dans la base de données centrale</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white/20 rounded-2xl transition-all active:scale-95"><X className="w-6 h-6 text-white" /></button>
            </div>

            <form onSubmit={handleSubmit} className="text-left">
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block">Désignation Officielle *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="Ex: Tôle Bac Aluminium 0.35mm Bleu" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-royal focus:ring-8 focus:ring-royal/5 rounded-2xl py-4 px-5 outline-none transition-all text-sm font-bold dark:text-white" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block">Code-barres / UPC</label>
                  <div className="flex gap-2">
                    <input type="text" name="barcode" value={formData.barcode} onChange={handleInputChange} placeholder="Scanner ou taper..." className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-royal rounded-2xl py-4 px-5 outline-none transition-all text-sm font-mono dark:text-white" />
                    <button type="button" onClick={generateBarcode} className="px-5 bg-gold/10 text-gold-dark border border-gold/20 rounded-2xl hover:bg-gold/20 transition-all flex items-center gap-2 font-black text-[10px]">
                      <ScanLine className="w-5 h-5" /> AUTO
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block">Famille de Produit</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 outline-none text-sm font-bold dark:text-white cursor-pointer border-l-4 border-l-royal">
                    <option>Tôles & Toitures</option>
                    <option>Plafonds & Déco</option>
                    <option>Fer à Béton & Aciers</option>
                    <option>Outillage & Pinces</option>
                    <option>Ciment & Granulats</option>
                    <option>Peintures & Finitions</option>
                    <option>Électricité & Plomberie</option>
                    <option>Autres Matériaux</option>
                  </select>
                </div>

                <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/5 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                  <label className="text-[10px] font-black text-emerald-600 mb-2.5 block uppercase tracking-tighter">Coût d'Achat</label>
                  <div className="relative">
                    <ArrowDownCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
                    <input type="number" name="purchasePrice" required value={formData.purchasePrice} onChange={handleInputChange} placeholder="0" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-900/40 rounded-2xl py-4 pl-12 pr-4 outline-none text-sm font-black dark:text-white" />
                  </div>
                </div>

                <div className="p-6 bg-royal/5 dark:bg-royal/10 rounded-3xl border border-royal/10">
                  <label className="text-[10px] font-black text-royal mb-2.5 block uppercase tracking-tighter">Prix de Vente</label>
                  <div className="relative">
                    <ArrowUpCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-royal w-5 h-5" />
                    <input type="number" name="sellingPrice" required value={formData.sellingPrice} onChange={handleInputChange} placeholder="0" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-royal/40 rounded-2xl py-4 pl-12 pr-4 outline-none text-sm font-black dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block">Stock Initial</label>
                  <input type="number" name="stock" required value={formData.stock} onChange={handleInputChange} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 outline-none text-sm font-black dark:text-white" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block">Seuil d'Alerte</label>
                  <input type="number" name="alertThreshold" value={formData.alertThreshold} onChange={handleInputChange} placeholder="5" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 outline-none text-sm font-black dark:text-white" />
                </div>
              </div>

              <div className="p-10 border-t border-slate-50 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 rounded-2xl font-black text-xs uppercase text-slate-500 hover:bg-slate-100 transition-all tracking-widest">Ignorer</button>
                <button type="submit" disabled={isSubmitting} className="px-12 py-4 bg-gradient-to-r from-royal-dark to-royal text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-royal/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingProduct ? 'Confirmer Maj' : 'Valider Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickStat = ({ label, value, icon, isCurrency, color }) => {
  const colorMap = {
    royal: 'bg-royal/10 text-royal',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    gold: 'bg-gold/10 text-gold-dark',
    red: 'bg-red-500/10 text-red-500'
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
      <div className={`p-3 ${colorMap[color] || 'bg-slate-100 text-slate-500'} rounded-xl group-hover:scale-110 transition-transform`}>
        {icon || <Package className="w-4 h-4" />}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
        <p className="text-lg font-black text-slate-800 dark:text-white leading-none mt-1">
          {isCurrency ? formatCurrency(value) : value}
        </p>
      </div>
    </div>
  );
};

export default Products;
