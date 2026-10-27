import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle, Send, CheckCircle2, User, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const defaultQAPairs = [
  {
    id: 1,
    question: 'Can this appliance handle dry grinding like whole turmeric and hard garam masala?',
    answer: 'Yes! The heavy-gauge 304 food-grade stainless steel jars paired with our high-torque pure copper motor are engineered specifically for tough Indian grinding routines, including dry raw turmeric root, cinnamon sticks, and coconut chutney.',
    author: 'Sunita M.',
    date: '2 weeks ago',
    verifiedAnswer: true
  },
  {
    id: 2,
    question: 'Are the jars, lids, and detachable blades dishwasher safe?',
    answer: 'The stainless steel jars, Tritan bottles, and silicone sealing rings are top-rack dishwasher safe. We recommend hand-washing the main motorized drive base with a damp microfiber cloth to preserve electrical insulation.',
    author: 'Rajesh K.',
    date: '1 month ago',
    verifiedAnswer: true
  },
  {
    id: 3,
    question: 'Does this come with a 2-pin or 3-pin plug? Does it need an earthing socket?',
    answer: 'All high-wattage Kirti kitchen appliances (750W and above) come with an ISI-certified 3-pin 6A/16A heavy-duty moulded plug with built-in ground earthing for maximum user safety in Indian kitchen environments.',
    author: 'Ananya P.',
    date: '2 months ago',
    verifiedAnswer: true
  },
  {
    id: 4,
    question: 'What is the procedure for warranty claim and home service?',
    answer: 'Every Kirti appliance includes our direct customer care number (+91 94282 82008). In case of any technical defect, our technician provides free home pickup/repair service across 18,000+ Indian pincodes.',
    author: 'Vikas G.',
    date: '3 months ago',
    verifiedAnswer: true
  }
];

const ProductQA = ({ productName = 'Appliance' }) => {
  const [qaList, setQaList] = useState(defaultQAPairs);
  const [expandedId, setExpandedId] = useState(1);
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [askerName, setAskerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { success, error: showError } = useToast();

  const handleAskSubmit = (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      showError('Please type your question.');
      return;
    }

    const newItem = {
      id: Date.now(),
      question: newQuestion.trim(),
      answer: 'Thank you for your question! A Kirti Store culinary appliance technician will review and reply within 24 hours.',
      author: askerName.trim() || 'Verified Shopper',
      date: 'Just now',
      verifiedAnswer: false
    };

    setQaList([newItem, ...qaList]);
    setNewQuestion('');
    setAskerName('');
    setShowAskForm(false);
    setExpandedId(newItem.id);
    success('Your question has been posted successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-secondary" />
            <span>Customer Questions & Answers</span>
          </h3>
          <p className="text-xs text-charcoal-light mt-0.5">
            Common questions answered by Kirti certified appliance engineers and verified buyers.
          </p>
        </div>

        <button
          onClick={() => setShowAskForm(!showAskForm)}
          className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary-600 transition-all shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{showAskForm ? 'Close Form' : 'Ask a Question'}</span>
        </button>
      </div>

      {/* Ask Form */}
      {showAskForm && (
        <form onSubmit={handleAskSubmit} className="bg-surface-muted/60 p-5 rounded-2xl border border-surface-border space-y-3 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
            Ask about {productName}
          </h4>
          <textarea
            rows={3}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="e.g. Can this chop hard carrots and almonds? Is the motor 100% pure copper?"
            className="w-full p-3 bg-white rounded-xl border border-surface-border text-xs sm:text-sm text-primary placeholder-charcoal-light focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            required
          />
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <input
              type="text"
              value={askerName}
              onChange={(e) => setAskerName(e.target.value)}
              placeholder="Your Name (Optional)"
              className="w-full sm:w-64 px-3 py-2 bg-white rounded-xl border border-surface-border text-xs text-primary placeholder-charcoal-light focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-primary hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Question</span>
            </button>
          </div>
        </form>
      )}

      {/* Q&A Accordion List */}
      <div className="divide-y divide-surface-border border border-surface-border rounded-2xl bg-white overflow-hidden shadow-sm">
        {qaList.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="p-4 sm:p-5 transition-colors">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full text-left flex items-start justify-between gap-4 group"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-secondary font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    Q
                  </span>
                  <div>
                    <span className="text-sm font-bold text-primary group-hover:text-secondary transition-colors">
                      {item.question}
                    </span>
                    <p className="text-[11px] text-charcoal-light mt-0.5">
                      Asked by <span className="font-semibold text-charcoal">{item.author}</span> • {item.date}
                    </p>
                  </div>
                </div>

                <div className="p-1 rounded-lg text-charcoal-light group-hover:text-primary transition-colors flex-shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="mt-4 ml-8 p-4 bg-surface-muted/50 rounded-xl border border-surface-border/60 text-xs sm:text-sm text-charcoal space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Official Answer from Kirti Store Appliance Specialist</span>
                  </div>
                  <p className="leading-relaxed text-charcoal-light text-xs sm:text-sm">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductQA;
