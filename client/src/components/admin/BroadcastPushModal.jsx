import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Flame, 
  Bell, 
  Sparkles, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const PRESET_TEMPLATES = [
  {
    label: '🔥 Weekend Flash Sale',
    title: '🔥 48-Hour Weekend Flash Sale!',
    body: 'Flat 20% OFF all Mixer Grinders & Cold Press Juicers! Use code FLASH20 at checkout.',
    url: '/deals',
    discountPercent: 20
  },
  {
    label: '✨ Genuine Spares in Stock',
    title: '✨ Genuine Replacement Jars & Blades Restocked',
    body: 'Never replace the whole machine. Genuine motor couplers, chutney blades & jars are now in stock.',
    url: '/spares',
    discountPercent: 0
  },
  {
    label: '⚡ Festive Kitchen Upgrade',
    title: '⚡ Upgrade Your Kitchen with Kirti Store',
    body: 'Enjoy free copper motor warranty & guaranteed 2-day delivery on all kitchen appliances.',
    url: '/shop',
    discountPercent: 15
  }
];

const BroadcastPushModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast() || {};
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/deals');
  const [discountPercent, setDiscountPercent] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    setUrl(tpl.url);
    setDiscountPercent(tpl.discountPercent ? String(tpl.discountPercent) : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      if (showToast) showToast('Please enter both title and message body.', 'error');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const res = await api.post('/notifications/broadcast', {
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || '/deals',
        discountPercent: Number(discountPercent) || 0,
        sendPush
      });

      if (res.data.success) {
        setResult(res.data.result);
        if (showToast) {
          showToast(res.data.message || 'Push broadcast sent successfully!', 'success');
        }
      }
    } catch (err) {
      if (showToast) {
        showToast(err.response?.data?.message || 'Failed to dispatch broadcast.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Broadcast Push Notification</h3>
              <p className="text-xs text-white/80">Send live alerts to customer mobile devices & web inbox</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl text-slate-200 border border-slate-700/60 transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Notification Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🔥 Weekend Flash Sale: 20% OFF Juicers!"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Notification Message Body *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Grab genuine copper motor appliances with free shipping. Limited time only!"
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                maxLength={250}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Target Link (Deep Link)
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/deals or /shop"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Discount % (Optional)
                </label>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="e.g. 20"
                  min="0"
                  max="90"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="sendPushCheckbox"
                checked={sendPush}
                onChange={(e) => setSendPush(e.target.checked)}
                className="w-4 h-4 text-amber-600 bg-slate-700 border-slate-600 rounded focus:ring-amber-500"
              />
              <label htmlFor="sendPushCheckbox" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-bold text-white">Deliver to Native Mobile Devices (FCM Push)</span>
                <p className="text-[11px] text-slate-400">Also sends push alerts to active Android & iOS Capacitor app users</p>
              </label>
            </div>

            {result && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  Successfully sent to <strong>{result.recipientCount}</strong> customer account(s) and <strong>{result.deviceCount}</strong> active native mobile device(s).
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-950/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Push Broadcast Now</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};

export default BroadcastPushModal;
