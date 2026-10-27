import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Plus, 
  Minus, 
  Edit3, 
  X,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminInventory = () => {
  const { success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'transactions'
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [stockLevelFilter, setStockLevelFilter] = useState('all'); // 'all', 'low', 'out'

  // Modal Adjustment
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('set');
  const [quantityInput, setQuantityInput] = useState('');
  const [lowThresholdInput, setLowThresholdInput] = useState('');
  const [reason, setReason] = useState('Physical audit recount');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Inventory and Transactions
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [prodRes, transRes] = await Promise.all([
        api.get('/products?limit=50&includeInactive=true'),
        api.get('/admin/inventory/transactions?limit=30')
      ]);

      if (prodRes.data.success) {
        setProducts(prodRes.data.products || []);
      }
      if (transRes.data.success) {
        setTransactions(transRes.data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const openAdjustmentModal = (prod) => {
    setSelectedProduct(prod);
    setAdjustmentType('set');
    setQuantityInput(prod.stockQuantity);
    setLowThresholdInput(prod.lowStockThreshold || 5);
    setReason('Routine warehouse stock reconciliation');
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (quantityInput === '' || isNaN(quantityInput)) {
      showError('Valid quantity number required.');
      return;
    }
    if (!reason.trim()) {
      showError('An audit reason is required for tracking inventory adjustments.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.patch(`/products/${selectedProduct._id}/stock`, {
        adjustmentType,
        quantity: Number(quantityInput),
        lowStockThreshold: Number(lowThresholdInput),
        reason: reason.trim(),
      });

      if (res.data.success) {
        success(res.data.message);
        setSelectedProduct(null);
        fetchInventoryData();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to adjust stock.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.SKU.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (stockLevelFilter === 'low') {
      return p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold || 5);
    }
    if (stockLevelFilter === 'out') {
      return p.stockQuantity === 0;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Stock & Inventory Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor real-time warehouse levels, adjust inventory, and review audit trail
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'stock' ? 'bg-secondary text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Appliance Stock Levels</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'transactions' ? 'bg-secondary text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Transaction Log ({transactions.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STOCK LEVELS */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Search & Stock Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search appliance by model or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStockLevelFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  stockLevelFilter === 'all' ? 'bg-secondary text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                All Models ({products.length})
              </button>
              <button
                onClick={() => setStockLevelFilter('low')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  stockLevelFilter === 'low' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Low Stock Only
              </button>
              <button
                onClick={() => setStockLevelFilter('out')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  stockLevelFilter === 'out' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Out of Stock
              </button>
            </div>
          </div>

          {/* Stock Table */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60 border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Appliance Model</th>
                    <th className="py-4 px-4">SKU</th>
                    <th className="py-4 px-4">Current Stock</th>
                    <th className="py-4 px-4">Threshold</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Adjustment Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500">
                        Loading inventory levels...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500">
                        No appliances matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isOut = p.stockQuantity === 0;
                      const isLow = !isOut && p.stockQuantity <= (p.lowStockThreshold || 5);

                      return (
                        <tr key={p._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-3">
                              <img src={p.images?.[0]} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-950 border border-slate-800 flex-shrink-0" />
                              <span className="font-bold text-white truncate max-w-xs">{p.name}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-slate-400">
                            {p.SKU}
                          </td>

                          <td className="py-3 px-4 font-black text-white text-sm">
                            {p.stockQuantity} units
                          </td>

                          <td className="py-3 px-4 text-slate-400">
                            {p.lowStockThreshold || 5} units
                          </td>

                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isOut ? 'bg-rose-500/20 text-rose-400' : isLow ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {isOut ? 'Out of Stock' : isLow ? 'Low Stock Warning' : 'In Stock'}
                            </span>
                          </td>

                          <td className="py-3 px-6 text-right">
                            <button
                              onClick={() => openAdjustmentModal(p)}
                              className="px-3 py-1.5 rounded-xl bg-secondary/20 hover:bg-secondary text-secondary hover:text-white font-bold transition-colors"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRANSACTION LOG */}
      {activeTab === 'transactions' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-secondary" />
              <span>Full Historical Inventory Audit Trail</span>
            </h3>
            <span className="text-[11px] text-slate-400">Recorded with timestamps and admin IDs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-4">Product Name</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Change</th>
                  <th className="py-4 px-4">Stock Level (Before → After)</th>
                  <th className="py-4 px-4">Audit Reason</th>
                  <th className="py-4 px-6 text-right">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      No stock audit records logged yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-6 text-slate-400 text-[11px]">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                        {t.productName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {t.transactionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black">
                        <span className={t.quantityChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.quantityChange > 0 ? `+${t.quantityChange}` : t.quantityChange}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {t.previousQuantity} → <strong className="text-white">{t.newQuantity}</strong>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={t.reason}>
                        {t.reason}
                      </td>
                      <td className="py-3 px-6 text-right font-bold text-slate-300">
                        {t.administratorName || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Reconcile Inventory Stock</h3>
              <button onClick={() => setSelectedProduct(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="text-slate-300 space-y-1">
              <p>Model: <strong className="text-white">{selectedProduct.name}</strong></p>
              <p>Current In-Stock: <strong className="text-emerald-400">{selectedProduct.stockQuantity} units</strong></p>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-300">Adjustment Operation</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('set')}
                    className={`py-2 rounded-xl font-bold ${adjustmentType === 'set' ? 'bg-secondary text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    Set Exact
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('increase')}
                    className={`py-2 rounded-xl font-bold ${adjustmentType === 'increase' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    + Add Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('decrease')}
                    className={`py-2 rounded-xl font-bold ${adjustmentType === 'decrease' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    - Deduct
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300">
                  {adjustmentType === 'set' ? 'New Total Stock (Units)' : 'Units Count'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300">Low Stock Alert Threshold (Units)</label>
                <input
                  type="number"
                  min="0"
                  value={lowThresholdInput}
                  onChange={(e) => setLowThresholdInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300">Audit Documentation Reason *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-secondary text-white font-bold rounded-xl shadow"
                >
                  {submitting ? 'Updating...' : 'Log & Update Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminInventory;
