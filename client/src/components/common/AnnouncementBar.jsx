import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

const AnnouncementBar = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-primary text-white text-xs font-medium py-2 px-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex items-center justify-center gap-2 text-center text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
          <span>
            <strong className="text-white font-semibold">Special Offer:</strong> Upgrade Your Kitchen — Free Express Delivery on orders above ₹999 + 2-Year Full Warranty!
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/70 hover:text-white p-1 transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
