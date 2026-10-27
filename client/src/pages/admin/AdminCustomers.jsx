import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShoppingBag, 
  IndianRupee, 
  Eye, 
  X, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Package, 
  CreditCard,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getWhatsAppDirectLink } from '../../utils/whatsappUtils';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());

      const res = await api.get(`/admin/customers?${params.toString()}`);
      if (res.data.success) {
        setCustomers(res.data.customers || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const viewCustomerProfile = async (cust) => {
    try {
      setSelectedCustomer(cust);
      setExpandedOrderId(null);
      setLoadingDetails(true);
      const res = await api.get(`/admin/customers/${cust._id}`);
      if (res.data.success) {
        setCustomerOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getWhatsAppLink = (cust) => {
    const rawPhone = cust.phone || '';
    const text = `Hello ${cust.name || 'Customer'}, this is Kirti Store customer support. How can we assist you with your kitchen appliances account today?`;
    return getWhatsAppDirectLink(rawPhone, text);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Users className="w-6 h-6 text-secondary" />
          Customer Accounts & Profiles
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          View registered customer accounts, contact details, delivery addresses, and purchase history
        </p>
      </div>

      {/* Search Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search customers by name, email, phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-secondary"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>

        <span className="text-xs text-slate-400 font-semibold self-start sm:self-auto">
          Total Registered Customers: <strong className="text-white text-sm">{total}</strong>
        </span>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Customer Details</th>
                <th className="py-4 px-4">Contact Phone</th>
                <th className="py-4 px-4">Total Orders</th>
                <th className="py-4 px-4">Lifetime Spend</th>
                <th className="py-4 px-4">Registered Date</th>
                <th className="py-4 px-6 text-right">Profile & Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    Loading customer accounts...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No matching customer accounts found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                          {c.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{c.name}</p>
                          <p className="text-[11px] text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {c.phone ? (
                        <span className="font-mono text-slate-200">{c.phone}</span>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Not provided</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-bold text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                        {c.orderCount || 0} orders
                      </span>
                    </td>

                    <td className="py-3 px-4 font-black text-emerald-400 text-sm">
                      ₹{(c.totalSpent || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={() => viewCustomerProfile(c)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        View History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER PROFILE & ORDER HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl text-xs text-slate-300">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-black text-sm">
                  {selectedCustomer.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{selectedCustomer.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Customer ID: {selectedCustomer._id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                  <a href={`mailto:${selectedCustomer.email}`} className="text-white hover:underline">{selectedCustomer.email}</a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  {selectedCustomer.phone ? (
                    <a href={`tel:${selectedCustomer.phone}`} className="font-mono text-white hover:underline">{selectedCustomer.phone}</a>
                  ) : (
                    <span className="text-slate-500 italic">No phone provided</span>
                  )}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>Joined: {new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                </p>
              </div>

              <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-700/60 sm:pl-4 pt-2 sm:pt-0">
                <p>Account Status: <span className="font-bold text-emerald-400 capitalize">{selectedCustomer.accountStatus || 'Active'}</span></p>
                <p>Total Orders Placed: <strong className="text-white font-bold">{selectedCustomer.orderCount}</strong></p>
                <p>Lifetime Revenue: <strong className="text-emerald-400 text-sm font-black">₹{(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}</strong></p>
              </div>
            </div>

            {/* Quick Actions for Admin to reach customer */}
            <div className="flex flex-wrap gap-2">
              {selectedCustomer.phone && (
                <>
                  <a
                    href={getWhatsAppLink(selectedCustomer)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Customer</span>
                  </a>
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Customer</span>
                  </a>
                </>
              )}
              <a
                href={`mailto:${selectedCustomer.email}`}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-secondary" />
                <span>Send Email</span>
              </a>
            </div>

            {/* Customer Orders History with Itemized Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                Purchase & Order History ({customerOrders.length})
              </h4>

              <div className="space-y-2.5">
                {loadingDetails ? (
                  <p className="text-center py-6 text-slate-500">Loading order records...</p>
                ) : customerOrders.length === 0 ? (
                  <p className="text-center py-6 text-slate-500">No orders placed by this customer yet.</p>
                ) : (
                  customerOrders.map((ord) => {
                    const isExpanded = expandedOrderId === ord._id;
                    return (
                      <div 
                        key={ord._id} 
                        className="rounded-2xl bg-slate-800/40 border border-slate-700/50 overflow-hidden transition-all"
                      >
                        <div 
                          onClick={() => setExpandedOrderId(isExpanded ? null : ord._id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/70"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-xs">
                                #{ord._id.substring(0, 10)}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ord.orderStatus === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                                ord.orderStatus === 'Cancelled' ? 'bg-rose-500/20 text-rose-400' :
                                'bg-blue-500/20 text-secondary'
                              }`}>
                                {ord.orderStatus}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {new Date(ord.createdAt).toLocaleDateString()} • {ord.items?.length} items ({ord.paymentMethod})
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="font-black text-white text-sm">
                                ₹{ord.totalAmount?.toLocaleString('en-IN')}
                              </span>
                              <p className="text-[10px] text-slate-400">{ord.paymentStatus}</p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>

                        {/* Collapsible Order Line Items & Delivery Address */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-950/40 border-t border-slate-800 space-y-3">
                            <div className="text-[11px] text-slate-400">
                              <span className="font-bold text-slate-300">Delivery Address:</span> {ord.shippingAddress?.street}, {ord.shippingAddress?.city}, {ord.shippingAddress?.state} - {ord.shippingAddress?.postalCode}
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Line Items:</span>
                              {ord.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between py-1 text-xs">
                                  <div className="flex items-center gap-2">
                                    <img src={item.image} alt="" className="w-7 h-7 rounded object-cover bg-slate-900 border border-slate-800" />
                                    <span className="text-slate-200">{item.name} <strong className="text-slate-400">×{item.quantity}</strong></span>
                                  </div>
                                  <span className="font-bold text-white">₹{item.lineTotal?.toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCustomers;
