import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';

export const WhyUsdt = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-card rounded-xl px-6 py-4 flex items-center justify-between transition-all duration-300 hover:border-primary/40 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display font-semibold text-foreground">Why We Use USDT</span>
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="glass-card rounded-xl rounded-t-none border-t-0 px-6 py-5 -mt-1">
          <p className="text-muted-foreground leading-relaxed">
            We use <span className="text-primary font-medium">USDT (Tether)</span> as our preferred payment method because it provides a stable, efficient, and globally accessible means of payment. Unlike traditional banking systems and many digital payment methods, USDT offers significantly lower transaction fees, faster processing times, and price stability by being pegged to the US dollar.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            This allows users from anywhere in the world to participate seamlessly, without facing currency conversion issues, regional restrictions, or high transfer costs.
          </p>
        </div>
      </div>
    </div>
  );
};
