import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  IndianRupee, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  Flame,
  Boxes,
  Eye,
  Phone,
  Mail,
  MapPin,
  X,
  MessageCircle,
  Truck
} from 'lucide-react';
import BroadcastPushModal from '../../components/admin/BroadcastPushModal';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [salesChart, setSalesChart] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [categoryDist, setCategoryDist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [statsRes, salesRes] = await Promise.all([
          api.get('/admin/dashboard/stats'),
          api.get('/admin/dashboard/sales'),
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
          setRecentOrders(statsRes.data.recentOrders || []);
          setLowStockAlerts(statsRes.data.lowStockAlerts || []);
        }

        if (salesRes.data.success) {
          setSalesChart(salesRes.data.salesData || []);
          setOrderStatuses(salesRes.data.orderStatusBreakdown || []);
          setCategoryDist(salesRes.data.categoryDistribution || []);
        }
      } catch (err) {
        console.error('[Admin Dashboard Error]:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Live metrics from MongoDB database & fulfillment pipeline</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
            title="Send push notification or flash deal to all customers"
          >
            <Flame className="w-4 h-4" />
            <span>Broadcast Push / Flash Deal</span>
          </button>
          <Link
            to="/admin/products?new=true"
            className="px-4 py-2 bg-secondary hover:bg-secondary-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            <span>Add Appliance</span>
          </Link>
          <Link
            to="/admin/inventory"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Boxes className="w-4 h-4" />
            <span>Audit Inventory</span>
          </Link>
        </div>
      </div>

      {/* High-Risk RTO Orders Pre-Dispatch Warning Banner */}
      {Boolean(stats?.highRtoRiskCount) && (
        <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold flex-shrink-0 animate-pulse border border-rose-500/30">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">
                  {stats.highRtoRiskCount} Order{stats.highRtoRiskCount > 1 ? 's' : ''} Flagged with High RTO Return Risk
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/30 text-rose-300 border border-rose-500/40">
                  ACTION REQUIRED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Orders have incomplete addresses or remote PIN codes. Call customers or send WhatsApp address verification before booking couriers.
              </p>
            </div>
          </div>
          <Link
            to="/admin/orders?rtoRisk=HIGH"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30 whitespace-nowrap cursor-pointer"
          >
            <span>Review & Verify on WhatsApp</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 1. KEY SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Revenue */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">
              ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Valid non-cancelled orders</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orders</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-secondary flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">
              {stats?.totalOrders || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Total customer checkouts</p>
          </div>
        </div>

        {/* Active Products */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalog Models</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">
              {stats?.activeProducts || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Active models in storefront
            </p>
          </div>
        </div>

        {/* Stock Alert */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Alerts</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-amber-400">
              {(stats?.lowStockProductsCount || 0) + (stats?.outOfStockProducts || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.outOfStockProducts || 0} Out of Stock, {stats?.lowStockProductsCount || 0} Low Stock
            </p>
          </div>
        </div>

      </div>

      {/* 2. RECHARTS VISUALIZATION GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Over Time Area Chart */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-secondary" />
                Sales Revenue Over Time
              </h3>
              <p className="text-xs text-slate-400">Daily gross purchase value</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChart}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                    formatter={(val) => [`₹${val}`, 'Gross Revenue']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No historical sales logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Order Status Breakdown Pie Chart */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Fulfillment Statuses</h3>
            <p className="text-xs text-slate-400">Order transition breakdown</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {orderStatuses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatuses}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {orderStatuses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No orders recorded yet.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-[10px] justify-center">
            {orderStatuses.map((s, i) => (
              <span key={s.status} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span>{s.status}: {s.count}</span>
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* 3. RECENT ORDERS & LOW STOCK TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Orders */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-secondary" />
                Recent Customer Orders
              </h3>
              <p className="text-[11px] text-slate-400">Live order activity from store checkout</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Customer Details</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">No customer orders yet.</td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3">
                        <p className="font-bold text-white truncate max-w-[160px]">{ord.customerName}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{ord.customerEmail}</p>
                        {ord.customerPhone && (
                          <p className="text-[10px] text-slate-300 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-emerald-400" />
                            {ord.customerPhone}
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-[11px] text-slate-300">
                        <span>{ord.items?.length || 0} item(s)</span>
                        <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {ord.items?.[0]?.name}
                        </p>
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-white">
                          ₹{ord.totalAmount?.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400">{ord.paymentMethod}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.orderStatus === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                          ord.orderStatus === 'Cancelled' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-blue-500/10 text-secondary'
                        }`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-bold transition-colors"
                        >
                          <Eye className="w-3 h-3 inline mr-1" />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Low Stock Warnings
            </h3>
            <Link to="/admin/inventory" className="text-xs font-semibold text-secondary hover:underline">
              Manage Stock
            </Link>
          </div>

          <div className="space-y-3">
            {lowStockAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                All inventory levels are healthy!
              </p>
            ) : (
              lowStockAlerts.map((prod) => (
                <div
                  key={prod._id}
                  className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={prod.images?.[0]}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover bg-slate-900 flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="font-bold text-white truncate">{prod.name}</p>
                      <p className="text-[10px] text-slate-400">SKU: {prod.SKU}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      prod.stockQuantity === 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {prod.stockQuantity === 0 ? '0 Left (Out)' : `${prod.stockQuantity} Left`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* QUICK ORDER & CUSTOMER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl text-xs text-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Order #{selectedOrder._id}</h3>
                <span className="text-[10px] text-slate-400">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="space-y-1.5">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-secondary" />
                  Customer Information
                </p>
                <p className="text-white font-medium">{selectedOrder.customerName}</p>
                <p className="text-slate-400 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" />
                  {selectedOrder.customerEmail}
                </p>
                {selectedOrder.customerPhone ? (
                  <p className="text-emerald-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <a href={`tel:${selectedOrder.customerPhone}`} className="hover:underline">{selectedOrder.customerPhone}</a>
                  </p>
                ) : (
                  <p className="text-slate-500 italic">No phone recorded</p>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  Delivery Address
                </p>
                <p className="text-slate-200">{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.apartment}</p>
                <p className="text-slate-200">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - <strong className="text-white">{selectedOrder.shippingAddress?.postalCode}</strong></p>
                <p className="text-slate-400">Country: {selectedOrder.shippingAddress?.country || 'India'}</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-purple-400" />
                Purchased Appliances ({selectedOrder.items?.length})
              </h4>
              <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-800" />
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-slate-400">SKU: {item.SKU} • Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <span className="font-bold text-white">₹{item.lineTotal?.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total & Payment */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Payment: <strong className="text-white">{selectedOrder.paymentMethod}</strong> ({selectedOrder.paymentStatus})</p>
                <p className="text-[11px] text-slate-400">Order Status: <span className="font-bold text-secondary">{selectedOrder.orderStatus}</span></p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400">Grand Total</span>
                <p className="text-lg font-black text-white">₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Link
                to="/admin/orders"
                className="px-4 py-2 bg-secondary text-white font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <span>Manage Full Fulfillment in Orders</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* Admin Push Notification & Flash Deal Broadcaster Modal */}
      <BroadcastPushModal 
        isOpen={showBroadcastModal} 
        onClose={() => setShowBroadcastModal(false)} 
      />

    </div>
  );
};

export default DashboardOverview;
