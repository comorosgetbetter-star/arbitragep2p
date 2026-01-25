import { useState } from 'react';
import { Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Bonus rates: tiered system where larger amounts get slightly better rates
const packages = [
  { usd: 50, usdt: 60 },
  { usd: 100, usdt: 121 },
  { usd: 150, usdt: 182 },
  { usd: 500, usdt: 609 },
  { usd: 1000, usdt: 1219 },
  { usd: 5000, usdt: 6097 },
];

export const ExpressP2P = () => {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleSelectPackage = (usd: number, usdt: number) => {
    setSelectedPackage(usd);
    // Store selected package in sessionStorage for payment flow
    sessionStorage.setItem('selectedPackage', JSON.stringify({ usd, usdt }));
    // Check if user is logged in (for now, redirect to create account)
    const isLoggedIn = sessionStorage.getItem('user');
    if (isLoggedIn) {
      navigate('/payment');
    } else {
      navigate('/create-account');
    }
  };

  return (
    <section id="rates" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Express P2P</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Buy <span className="gradient-text">USDT</span> Instantly
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select a package below to purchase USDT at competitive rates. 
            Fast, secure, and direct to your wallet.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {packages.map((pkg, index) => (
            <button 
              key={pkg.usd}
              onClick={() => handleSelectPackage(pkg.usd, pkg.usdt)}
              className={`glass-card rounded-2xl p-5 text-center transition-all duration-300 group animate-fade-in-up cursor-pointer border-2 ${
                selectedPackage === pkg.usd 
                  ? 'border-primary bg-primary/10' 
                  : 'border-transparent hover:border-primary/40'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                {selectedPackage === pkg.usd ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <span className="text-lg font-bold text-primary">₮</span>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mb-1">Pay</p>
              <p className="text-lg font-display font-bold mb-2">
                ${pkg.usd.toLocaleString()}
              </p>
              
              <div className="h-px bg-border my-3" />
              
              <p className="text-xs text-muted-foreground mb-1">Receive</p>
              <p className="text-xl font-display font-bold text-primary">
                {pkg.usdt.toLocaleString()} USDT
              </p>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Bonus rates applied • Larger amounts receive better rates
        </p>
      </div>
    </section>
  );
};
