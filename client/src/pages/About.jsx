import React from 'react';
import { Flame, ShieldCheck, Zap, Award, Users, Heart } from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      
      {/* Brand Mission Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <img 
          src="/logo-dark.png" 
          alt="Kirti Store" 
          className="h-12 w-auto mx-auto object-contain" 
        />
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          Our Brand Story
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-primary">
          Smart Appliances. Smarter Living.
        </h1>
        <p className="text-base text-charcoal-light leading-relaxed">
          At Kirti Store, we believe the kitchen is the pulsing heart of every home. Founded with a vision to eliminate the frustration of low-durability appliances, we engineer robust, aesthetically striking, and energy-efficient kitchen gear designed specifically for the diverse demands of Indian culinary preparation.
        </p>
      </div>

      {/* Pillars of Engineering */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-surface-border shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-primary">Copper-Core Power</h3>
          <p className="text-xs text-charcoal-light leading-relaxed">
            We use exclusively 100% pure copper windings across all our motors, guaranteeing higher magnetic efficiency, lower heat buildup, and years of relentless service.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-surface-border shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-primary">Ergonomic Precision</h3>
          <p className="text-xs text-charcoal-light leading-relaxed">
            Every lid, handle, jar lock, and dial is precision-engineered for safety, comfort, and effortless cleaning, turning daily cooking into a delightful ritual.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-surface-border shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-primary">Direct Accountability</h3>
          <p className="text-xs text-charcoal-light leading-relaxed">
            No convoluted third-party claim centers. Our warranty program connects you directly with our dedicated factory technicians for prompt, genuine support.
          </p>
        </div>
      </div>

      {/* Brand Vision Quote */}
      <div className="bg-primary text-white rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-xl">
        <blockquote className="text-lg sm:text-xl font-medium italic max-w-2xl mx-auto text-slate-200">
          "Great kitchen appliances should disappear into your cooking flow — working silently, reliably, and effortlessly so you can focus on creating memories around the dinner table."
        </blockquote>
        <div className="mt-6">
          <p className="font-bold text-accent text-sm">The Kirti Store Team</p>
          <p className="text-xs text-slate-400">Dhoraji, Gujarat, India</p>
        </div>
      </div>

    </div>
  );
};

export default About;
