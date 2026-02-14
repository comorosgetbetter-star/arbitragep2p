import { useState, useEffect } from 'react';
import { Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WhyUsdt } from './WhyUsdt';
import { TradeConflictModal } from './TradeConflictModal';
import { TradeConfirmationModal } from './TradeConfirmationModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTradeSession, TradeSession } from '@/hooks/useTradeSession';
import { toast } from '@/components/ui/sonner';

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
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<{ usd: number; usdt: number } | null>(null);
  const [existingSession, setExistingSession] = useState<TradeSession | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startSession, clearSession, getStoredSession } = useTradeSession();

  // Check for pending trade after login
  useEffect(() => {
    if (!user) return;
    const pending = localStorage.getItem('pendingTrade');
    if (!pending) return;
    try {
      const data = JSON.parse(pending);
      if (data.isCustom) return; // Let calculator handle custom trades
      setPendingPackage({ usd: data.usd, usdt: data.usdt });
      localStorage.removeItem('pendingTrade');
      setShowConfirmationModal(true);
    } catch {
      localStorage.removeItem('pendingTrade');
    }
  }, [user]);

  const proceedWithPackage = (usd: number, usdt: number) => {
    if (!user) {
      // Save pending trade for after login — don't start session yet
      localStorage.setItem('pendingTrade', JSON.stringify({ usd, usdt, isCustom: false }));
      navigate('/login');
      return;
    }
    startSession(usd, usdt, false, user.id);
    toast.success('Trade started!', {
      description: `$${usd} → ${usdt} USDT`,
    });
    navigate('/payment');
  };

  const handleSelectPackage = (usd: number, usdt: number) => {
    setSelectedPackage(usd);
    setPendingPackage({ usd, usdt });

    // If the user is logged out, never reference any previous trade state.
    if (!user) {
      clearSession();
      setShowConfirmationModal(true);
      return;
    }
    
    // Check for existing active session
    const existing = getStoredSession();

    // Safety: if an old session exists but is tied to a different user, purge it.
    if (existing?.userId && existing.userId !== user.id) {
      clearSession();
      setShowConfirmationModal(true);
      return;
    }
    
    if (existing) {
      setExistingSession(existing);
      setShowConflictModal(true);
    } else {
      setShowConfirmationModal(true);
    }
  };

  const handleConfirmTrade = () => {
    if (pendingPackage) {
      setShowConfirmationModal(false);
      proceedWithPackage(pendingPackage.usd, pendingPackage.usdt);
    }
  };

  const handleResumeExisting = () => {
    setShowConflictModal(false);
    navigate('/payment');
  };

  const handleStartNew = () => {
    if (pendingPackage) {
      clearSession();
      proceedWithPackage(pendingPackage.usd, pendingPackage.usdt);
    }
    setShowConflictModal(false);
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
              className={`glass-card rounded-2xl p-5 text-center transition-all duration-300 group animate-fade-in-up cursor-pointer border-2 hover:scale-[1.02] active:scale-[0.98] ${
                selectedPackage === pkg.usd 
                  ? 'border-primary bg-primary/10 shadow-lg' 
                  : 'border-transparent hover:border-primary/40 hover:shadow-md'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-300 ${
                selectedPackage === pkg.usd
                  ? 'bg-primary/20 scale-110'
                  : 'bg-primary/10 group-hover:bg-primary/20 group-hover:scale-105'
              }`}>
                {selectedPackage === pkg.usd ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <span className="text-lg font-bold text-primary">₮</span>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mb-1">Pay</p>
              <p className="text-lg font-display font-bold mb-2 transition-colors group-hover:text-foreground">
                ${pkg.usd.toLocaleString()}
              </p>
              
              <div className="h-px bg-border my-3 transition-colors group-hover:bg-border/70" />
              
              <p className="text-xs text-muted-foreground mb-1">Receive</p>
              <p className="text-xl font-display font-bold text-primary transition-transform group-hover:scale-105">
                {pkg.usdt.toLocaleString()} USDT
              </p>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Bonus rates applied • Larger amounts receive better rates
        </p>

        {/* Why USDT Accordion */}
        <WhyUsdt />
      </div>

      {/* Trade Confirmation Modal */}
      <TradeConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => {
          setShowConfirmationModal(false);
          setSelectedPackage(null);
        }}
        onConfirm={handleConfirmTrade}
        usd={pendingPackage?.usd || 0}
        usdt={pendingPackage?.usdt || 0}
      />

      {/* Trade Conflict Modal */}
      <TradeConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        existingSession={existingSession}
        onResume={handleResumeExisting}
        onStartNew={handleStartNew}
      />
    </section>
  );
};
