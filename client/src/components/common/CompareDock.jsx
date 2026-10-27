import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftRight, X, ChevronUp, ChevronDown, Trash2, ArrowRight } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';

const CompareDock = () => {
  const { compareItems, removeFromCompare, clearCompare, compareCount } = useCompare();
  const [minimized, setMinimized] = useState(false);
  const location = useLocation();

  // Hide on compare page itself or when empty
  if (compareCount === 0 || location.pathname === '/compare') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl transition-all duration-300">
      <div className="bg-zinc-950/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-zinc-800 p-4">
        {/* Header bar of dock */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-secondary/20 text-blue-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold tracking-wide">
              Compare Appliances ({compareCount}/4)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearCompare}
              className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 px-2 py-1 rounded transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              onClick={() => setMinimized(!minimized)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title={minimized ? 'Expand' : 'Minimize'}
            >
              {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content of dock */}
        {!minimized && (
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Appliance Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full sm:w-auto flex-1">
              {[0, 1, 2, 3].map((index) => {
                const item = compareItems[index];
                if (item) {
                  return (
                    <div
                      key={item._id || item.id}
                      className="relative flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 pr-2"
                    >
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=100&q=80'}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-zinc-400 font-semibold">
                          ₹{(item.sellingPrice || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCompare(item._id || item.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }
                return (
                  <div
                    key={index}
                    className="hidden sm:flex items-center justify-center border border-dashed border-zinc-800 rounded-xl p-2 text-[11px] text-zinc-500 bg-zinc-900/40"
                  >
                    + Add appliance
                  </div>
                );
              })}
            </div>

            {/* Action CTA */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <Link
                to="/compare"
                className="w-full sm:w-auto px-5 py-2.5 bg-secondary hover:bg-secondary-600 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>Compare Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareDock;
