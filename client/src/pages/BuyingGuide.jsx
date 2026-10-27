import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Zap, 
  ShieldCheck, 
  Award, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Flame, 
  Droplet, 
  Wind,
  Layers,
  Scale
} from 'lucide-react';

const quizQuestions = [
  {
    id: 'need',
    title: '1. What is your primary culinary requirement?',
    options: [
      { label: 'Heavy Daily Grinding (Batters, Masalas, Chutneys)', category: 'mixers-grinders', icon: Zap },
      { label: 'Guilt-Free Crispy Snacks with 85% Less Oil', category: 'air-fryer', icon: Wind },
      { label: 'Nutrient-Dense Cold-Pressed Juices & Detox', category: 'juicers', icon: Droplet },
      { label: 'Instant Meal Prep & Roti Atta Kneading', category: 'food-processors', icon: Layers }
    ]
  },
  {
    id: 'size',
    title: '2. What is your household size?',
    options: [
      { label: 'Solo / Couple (1–2 People)', value: 'small' },
      { label: 'Standard Indian Family (3–5 People)', value: 'medium' },
      { label: 'Large Family / Frequent Entertaining (6+ People)', value: 'large' }
    ]
  },
  {
    id: 'priority',
    title: '3. What is your highest priority feature?',
    options: [
      { label: 'Maximum Motor Torque & Longevity', feature: 'power' },
      { label: 'Whisper-Quiet Noise Dampening', feature: 'quiet' },
      { label: 'Compact Footprint & Portable Storage', feature: 'compact' },
      { label: 'All-in-One Multi-Functional Versatility', feature: 'versatile' }
    ]
  }
];

const recommendationMap = {
  'mixers-grinders-power': {
    title: 'Kirti ProMix 750W Heavy-Duty Mixer Grinder',
    desc: 'Equipped with 100% pure copper winding, 3 heavy-gauge flow-breaker jars, and dual-fan overload protection.',
    price: '₹3,499',
    slug: 'kirti-promix-750w-mixer-grinder',
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=400&q=80'
  },
  'mixers-grinders-quiet': {
    title: 'Kirti Silenta 1000W Ultra-Quiet Mixer Grinder',
    desc: 'Dual acoustic sound-dampening hood cutting grinding noise by 60% while delivering commercial 1000W torque.',
    price: '₹4,999',
    slug: 'kirti-silenta-1000w-mixer-grinder',
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=400&q=80'
  },
  'air-fryer': {
    title: 'Kirti AeroCrisp 6.5L Digital Air Fryer',
    desc: '360° rapid hot air convection technology, glass observation window, and 8 one-touch culinary presets.',
    price: '₹6,499',
    slug: 'kirti-aerocrisp-6-5l-air-fryer',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=400&q=80'
  },
  'juicers': {
    title: 'Kirti FreshPress Cold Press Masticating Juicer',
    desc: 'Low-speed 55 RPM gentle spiral auger extracting 92% juice yield with zero thermal oxidation of vitamins.',
    price: '₹5,999',
    slug: 'kirti-freshpress-cold-press-juicer',
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=400&q=80'
  },
  'food-processors': {
    title: 'Kirti MultiChef 1000W All-in-One Food Processor',
    desc: '12-in-1 kitchen powerhouse with 3.2L bowl, atta kneader, wafer slicer, and Japanese steel blades.',
    price: '₹7,899',
    slug: 'kirti-multichef-1000w-food-processor',
    image: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=400&q=80'
  }
};

const BuyingGuide = () => {
  const [selectedAnswers, setSelectedAnswers] = useState({
    need: 'mixers-grinders',
    size: 'medium',
    priority: 'power'
  });

  const getRecommendation = () => {
    if (selectedAnswers.need === 'mixers-grinders') {
      if (selectedAnswers.priority === 'quiet') return recommendationMap['mixers-grinders-quiet'];
      return recommendationMap['mixers-grinders-power'];
    }
    return recommendationMap[selectedAnswers.need] || recommendationMap['air-fryer'];
  };

  const currentRec = getRecommendation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-charcoal-light">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary font-bold">Kitchen Appliance Buying Guide</span>
      </nav>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-zinc-800">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 bg-secondary/30 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Expert Culinary Engineering Guide
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            How to Choose the Right Kitchen Appliance for Your Home
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            From motor copper gauge and wattage ratings to masticating cold press RPMs and air fryer basket capacities — make informed, confident buying decisions.
          </p>
        </div>
      </div>

      {/* Interactive Appliance Finder Quiz */}
      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-10 shadow-sm space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Interactive Culinary Matcher
          </span>
          <h2 className="text-2xl font-black text-primary">
            Find Your Ideal Appliance in 30 Seconds
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-light">
            Select your preferences below to discover which engineered appliance best matches your family's cooking style.
          </p>
        </div>

        {/* Quiz Steps */}
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Question 1 */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-primary">{quizQuestions[0].title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quizQuestions[0].options.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedAnswers.need === opt.category;
                return (
                  <button
                    key={opt.category}
                    type="button"
                    onClick={() => setSelectedAnswers({ ...selectedAnswers, need: opt.category })}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'border-secondary bg-blue-50/70 text-secondary font-bold shadow-sm'
                        : 'border-surface-border bg-white text-charcoal hover:border-secondary/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-secondary' : 'text-charcoal-light'}`} />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2 */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-primary">{quizQuestions[1].title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quizQuestions[1].options.map((opt) => {
                const isSelected = selectedAnswers.size === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedAnswers({ ...selectedAnswers, size: opt.value })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-secondary bg-blue-50/70 text-secondary font-bold shadow-sm'
                        : 'border-surface-border bg-white text-charcoal hover:border-secondary/50'
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3 */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-primary">{quizQuestions[2].title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quizQuestions[2].options.map((opt) => {
                const isSelected = selectedAnswers.priority === opt.feature;
                return (
                  <button
                    key={opt.feature}
                    type="button"
                    onClick={() => setSelectedAnswers({ ...selectedAnswers, priority: opt.feature })}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-secondary bg-blue-50/70 text-secondary font-bold shadow-sm'
                        : 'border-surface-border bg-white text-charcoal hover:border-secondary/50'
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recommended Result Card */}
        {currentRec && (
          <div className="max-w-3xl mx-auto mt-8 p-6 bg-gradient-to-r from-blue-50/50 to-white rounded-3xl border border-secondary/30 shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <img
              src={currentRec.image}
              alt={currentRec.title}
              className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-2xl border border-surface-border flex-shrink-0 shadow-sm"
            />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <span className="px-2.5 py-1 bg-secondary text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                Recommended Match
              </span>
              <h4 className="text-base sm:text-lg font-bold text-primary">{currentRec.title}</h4>
              <p className="text-xs text-charcoal-light leading-relaxed">{currentRec.desc}</p>
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <span className="text-xl font-black text-primary">{currentRec.price}</span>
                <Link
                  to={`/product/${currentRec.slug}`}
                  className="px-5 py-2 bg-secondary hover:bg-secondary-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>View Appliance Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/compare"
                  className="text-xs font-bold text-charcoal hover:text-secondary flex items-center gap-1"
                >
                  <span>Compare with others</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guide Pillars */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-primary">In-Depth Engineering Guides</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guide 1: Mixer Grinder Wattage */}
          <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-primary">Mixer Grinder Motor Wattage Guide</h3>
                <p className="text-xs text-charcoal-light">500W vs 750W vs 1000W explained</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs text-charcoal-light leading-relaxed">
              <p>
                <strong>500 Watts:</strong> Ideal for lightweight tasks such as tomato purees, liquid shakes, and tender chutneys. Struggles with fibrous turmeric or dry masalas.
              </p>
              <p>
                <strong>750 Watts (The Indian Kitchen Sweet Spot):</strong> Generates high torque for raw turmeric, hard dal batter for idlis/dosas, ginger-garlic paste, and crushed ice without overheating.
              </p>
              <p>
                <strong>1000 Watts:</strong> Commercial-grade performance with acoustic silence enclosure. Grinds fine powders in seconds with zero motor strain.
              </p>
            </div>
          </div>

          {/* Guide 2: Cold Press Juicing */}
          <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-primary">Cold Press vs Centrifugal Juicers</h3>
                <p className="text-xs text-charcoal-light">Preserving live enzymes and taste</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs text-charcoal-light leading-relaxed">
              <p>
                <strong>Centrifugal Juicers (15,000–20,000 RPM):</strong> High-speed metal blades generate friction heat and introduce massive air bubbles, oxidizing juice rapidly within minutes.
              </p>
              <p>
                <strong>Cold Press Masticating (55 RPM):</strong> Squeezes fruits with a slow, heavy spiral auger. Produces 92% juice extraction, dry pulp, zero foam, and maintains live vitamins for 48 hours.
              </p>
            </div>
          </div>

          {/* Guide 3: Air Fryer Technology */}
          <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-primary">Air Fryer Sizing & Technology</h3>
                <p className="text-xs text-charcoal-light">Choosing between 4L and 6.5L Family Size</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs text-charcoal-light leading-relaxed">
              <p>
                <strong>Basket Capacity:</strong> For Indian samosas, paneer tikka, and chicken roasts, a 6.5L basket allows single-layer cooking without overlapping, guaranteeing uniform golden crispness.
              </p>
              <p>
                <strong>Rapid Hot Air 360° Convection:</strong> Eliminates up to 85% oil compared to traditional kadai deep-frying while preserving authentic crunch and moisture.
              </p>
            </div>
          </div>

          {/* Guide 4: Home Soda Makers */}
          <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-secondary flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-primary">Eco Soda Makers & Carbonation</h3>
                <p className="text-xs text-charcoal-light">Zero electricity fizz at ₹4 per litre</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs text-charcoal-light leading-relaxed">
              <p>
                <strong>Cost & Health Economics:</strong> Packaged soda bottles cost ₹40–60 and create single-use plastic waste. Handcrafted home carbonation costs under ₹4 per litre.
              </p>
              <p>
                <strong>No Electricity Needed:</strong> Operates via standard food-grade 60L CO2 cylinders with mechanical safety release valves.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyingGuide;
