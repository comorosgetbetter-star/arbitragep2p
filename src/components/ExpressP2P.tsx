import { useState, useEffect } from 'react';
import { Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WhyUsdt } from './WhyUsdt';
import { TradeConflictModal } from './TradeConflictModal';
import { TradeConfirmationModal } from './TradeConfirmationModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTradeSession, TradeSession } from '@/hooks/useTradeSession';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Profit rates: tiered system where larger amounts get slightly better rates
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

        <div className="flex flex-col gap-3 max-w-2xl mx-auto">
          {packages.map((pkg, index) => {
            const profit = pkg.usdt - pkg.usd;
            const roi = ((profit / pkg.usd) * 100).toFixed(1);
            const isPopular = pkg.usd === 1000;

            return (
              <button
                key={pkg.usd}
                onClick={() => handleSelectPackage(pkg.usd, pkg.usdt)}
                className={`relative glass-card rounded-xl transition-all duration-300 group animate-slide-in-left cursor-pointer border-2 hover:scale-[1.01] active:scale-[0.99] ${
                  isPopular
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30 py-5 px-5 sm:px-6'
                    : selectedPackage === pkg.usd
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:border-primary/40'
                } ${isPopular ? '' : 'py-4 px-5 sm:px-6'}`}
                style={{ animationDelay: `${index * 80}ms`, opacity: 0 }}
              >
                {isPopular && (
                  <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                    Most Popular
                  </Badge>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  {/* Left: Pay & Receive */}
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    <div className="text-left min-w-[70px]">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pay</p>
                      <p className={`font-display font-bold ${isPopular ? 'text-lg' : 'text-base'}`}>
                        ${pkg.usd.toLocaleString()}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />

                    <div className="text-left min-w-[90px]">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Receive</p>
                      <p className={`font-display font-bold text-primary ${isPopular ? 'text-lg' : 'text-base'}`}>
                        {pkg.usdt.toLocaleString()} USDT
                      </p>
                    </div>
                  </div>

                  {/* Middle: Profit & ROI */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-left">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Profit</p>
                      <p className="font-display font-semibold text-success text-sm">
                        +{profit} USDT
                      </p>
                    </div>

                    <Badge variant="outline" className="text-success border-success/30 bg-success/10 text-xs whitespace-nowrap">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {roi}% ROI
                    </Badge>
                  </div>

                  {/* Right: Buy button */}
                  <Button
                    size="sm"
                    variant={isPopular ? 'default' : 'outline'}
                    className={`shrink-0 w-full sm:w-auto ${isPopular ? 'shadow-md' : ''}`}
                    tabIndex={-1}
                  >
                    Buy
                  </Button>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Profit rates applied • Larger amounts receive better rates
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
