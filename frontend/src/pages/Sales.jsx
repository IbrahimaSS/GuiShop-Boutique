import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Plus, Minus, Trash2, CreditCard, User, ScanLine, X, Loader2, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const Sales = () => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    dueDate: ''
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products');
      setProducts(data.data.filter(p => p.stock > 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product._id === product._id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item => item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
        toast.warning("Limite de stock atteinte !");
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product._id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= item.product.stock && newQuantity > 0) {
          return { ...item, quantity: newQuantity };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => setCart(cart.filter(item => item.product._id !== productId));
  const totalAmount = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);

  const handleCheckout = async (paymentType) => {
    if (cart.length === 0) return;
    
    if (paymentType === 'credit') {
      setShowCreditModal(true);
      return;
    }

    processSale('cash');
  };

  const processSale = async (paymentType) => {
    setIsSubmitting(true);
    try {
      const calculatedTotal = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
      
      const saleData = {
        items: cart.map(item => ({
          product: item.product._id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.sellingPrice,
          totalPrice: item.quantity * item.product.sellingPrice
        })),
        subTotal: calculatedTotal,
        totalAmount: calculatedTotal,
        paymentType,
        ...(clientInfo.name ? { 
          clientName: clientInfo.name, 
          clientPhone: clientInfo.phone,
          dueDate: clientInfo.dueDate 
        } : {})
      };

      const { data } = await api.post('/sales', saleData);
      toast.success(`Encaissement validé ! Facture: ${data.invoice?.invoiceNumber || data.data.saleNumber}`);
      setCart([]);
      setClientInfo({ name: '', phone: '', dueDate: '' }); // Clear info after success
      setShowCreditModal(false);
      fetchProducts(); // Refresh stocks
    } catch (err) {
      toast.error(err.response?.data?.error || "Échec de la transaction. Veuillez vérifier vos entrées.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanSearch = async (barcodeValue) => {
    const cleanBarcode = String(barcodeValue || '').trim();
    if (!cleanBarcode) return;
    try {
      // Use the existing getProduct route which handles both ID and barcode
      const { data } = await api.get(`/products/${cleanBarcode}`);
      if (data.data) {
        addToCart(data.data);
        setShowScanner(false);
        setSearchTerm(''); // Clear main search too
      }
    } catch (err) {
      toast.info("Produit inconnu ou épuisé");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm)
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-fade-in relative">

      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col gap-5 h-full min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-3xl font-jakarta font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-gold dark:from-royal-light dark:to-gold-light">
              Terminal de Vente
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Prêt pour une nouvelle transaction.</p>
          </div>
        </div>

        {/* Scan + Search Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
              <input type="text" placeholder="Rechercher un produit (nom, code-barres)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:border-royal focus:ring-2 focus:ring-royal/20 rounded-xl py-3 pl-12 pr-4 outline-none transition-all text-sm dark:text-white dark:placeholder-slate-500" autoFocus />
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="px-5 bg-gradient-to-r from-gold-dark to-gold text-white rounded-xl hover:shadow-lg hover:shadow-gold/30 transition-all flex items-center gap-2 font-semibold text-sm active:scale-95 flex-shrink-0"
            >
              <ScanLine className="w-5 h-5" /> Scanner
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 text-royal animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <div key={product._id} onClick={() => addToCart(product)}
                    className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl p-4 cursor-pointer hover:border-royal dark:hover:border-royal-light hover:shadow-md dark:hover:shadow-royal/10 transition-all active:scale-95 flex flex-col group relative"
                  >
                    <div className="font-semibold text-slate-800 dark:text-white mb-1 line-clamp-2 text-sm group-hover:text-royal dark:group-hover:text-royal-light transition-colors">{product.name}</div>
                    <div className="text-royal dark:text-royal-light font-extrabold mt-auto text-lg">{formatCurrency(product.sellingPrice)}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex justify-between items-center">
                      <span>Stock: {product.stock}</span>
                      <span className="w-6 h-6 rounded-full bg-royal/10 dark:bg-royal/20 text-royal dark:text-royal-light flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart Checkout */}
      <div className="w-full lg:w-[380px] flex flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 h-full overflow-hidden flex-shrink-0">
        <div className="bg-gradient-to-r from-royal-dark to-royal p-5 flex items-center justify-between text-white border-b border-white/10">
          <h2 className="font-jakarta font-bold text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold" /> 
            <span className="text-gradient-gold tracking-tight">Panier de Vente</span>
          </h2>
          <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-semibold backdrop-blur-sm shadow-inner">{cart.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600">
              <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm font-medium">Le panier est vide</p>
              <p className="text-xs mt-1">Scannez ou cliquez pour ajouter</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product._id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-600 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-white truncate text-sm">{item.product.name}</div>
                  <div className="text-sm font-bold text-royal dark:text-royal-light">{formatCurrency(item.product.sellingPrice)}</div>
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-600">
                  <button onClick={() => updateQuantity(item.product._id, -1)} className="p-1 text-slate-400 hover:text-royal rounded"><Minus className="w-4 h-4" /></button>
                  <span className="w-7 text-center font-bold text-sm dark:text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product._id, 1)} className="p-1 text-slate-400 hover:text-royal rounded"><Plus className="w-4 h-4" /></button>
                </div>
                <button onClick={() => removeFromCart(item.product._id)} className="p-1.5 text-slate-300 hover:text-gold-dark dark:hover:text-gold hover:bg-gold/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Client Info (Optional) */}
        {cart.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
             <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
               <User className="w-3 h-3" /> Client (Facultatif)
             </div>
             <div className="grid grid-cols-2 gap-2">
               <input 
                 type="text" 
                 placeholder="Nom"
                 value={clientInfo.name}
                 onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs dark:text-white outline-none focus:border-royal"
               />
               <input 
                 type="text" 
                 placeholder="Tél"
                 value={clientInfo.phone}
                 onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs dark:text-white outline-none focus:border-royal"
               />
             </div>
          </div>
        )}

        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 border-t border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-end mb-4">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total</span>
            <span className="text-3xl font-extrabold font-jakarta text-royal-dark dark:text-white truncate">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => handleCheckout('cash')}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-royal to-royal-light text-white rounded-xl font-bold shadow-lg shadow-royal/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:shadow-royal/50 text-sm disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
              Paiement Comptant (Cash)
            </button>
            <button 
              onClick={() => handleCheckout('credit')}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-gold-dark to-gold text-white rounded-xl font-bold shadow-lg shadow-gold/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:shadow-gold/50 text-sm disabled:opacity-50"
            >
              <User className="w-5 h-5" /> Vente à Crédit (Dette)
            </button>
          </div>
        </div>
      </div>

      {/* Credit Info Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-gold-dark to-gold p-5 text-white flex justify-between items-center">
              <h3 className="font-jakarta font-bold text-lg">Informations Client (Dette)</h3>
              <button onClick={() => setShowCreditModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 text-left">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nom du client *</label>
                <input type="text" value={clientInfo.name} onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl py-3 px-4 outline-none focus:border-gold dark:text-white" placeholder="Nom complet" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Téléphone</label>
                <input type="text" value={clientInfo.phone} onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl py-3 px-4 outline-none focus:border-gold dark:text-white" placeholder="Ex: 620..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Date limite de paiement</label>
                <input type="date" value={clientInfo.dueDate} onChange={(e) => setClientInfo({...clientInfo, dueDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl py-3 px-4 outline-none focus:border-gold dark:text-white" />
              </div>
              <button 
                onClick={() => processSale('credit')}
                disabled={!clientInfo.name || isSubmitting}
                className="w-full py-4 mt-2 bg-gradient-to-r from-gold-dark to-gold text-white rounded-xl font-bold shadow-xl shadow-gold/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Valider la vente à crédit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowScanner(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-gold-dark to-gold p-5 text-white flex justify-between items-center">
              <h3 className="font-jakarta font-bold text-lg flex items-center gap-2"><ScanLine className="w-5 h-5" /> Scanner Code-barres</h3>
              <button onClick={() => setShowScanner(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 bg-slate-900 flex justify-center items-center min-h-[280px] relative">
              <div className="w-72 h-44 border-2 border-royal/50 rounded-xl relative bg-black/30 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-royal shadow-[0_0_10px_rgba(37,99,235,0.8)]" style={{ animation: 'scan 2s ease-in-out infinite' }}></div>
                </div>
                <p className="text-white/40 text-xs font-medium">Capture active...</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">Placez le code-barres au centre du cadre</p>
              <div className="mt-3 flex items-center gap-2 justify-center">
                <input 
                  type="text" 
                  placeholder="Code-barres..." 
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm w-48 outline-none focus:border-royal dark:text-white font-mono" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleScanSearch(e.target.value);
                      e.target.value = ''; // Clean up
                    }
                  }}
                  autoFocus 
                />
                <button 
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling;
                    handleScanSearch(input.value);
                    input.value = '';
                  }}
                  className="px-3 py-1.5 bg-royal text-white text-sm rounded-lg font-semibold hover:bg-royal-dark transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
