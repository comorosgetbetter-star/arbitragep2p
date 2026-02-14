import { useState, useMemo, useEffect } from 'react';
import { Calculator, ArrowRight, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTradeSession, TradeSession } from '@/hooks/useTradeSession';
import { TradeConfirmationModal } from './TradeConfirmationModal';
import { TradeConflictModal } from './TradeConflictModal';
import { toast } from '@/components/ui/sonner';

const MIN_AMOUNT = 50;
const MAX_AMOUNT = 25000;

// Tiered bonus rate calculation - matches Express P2P packages
const calculateUsdtReceived = (usdAmount: number): number => {
  if (usdAmount <= 0) return 0;
  
  const tiers = [
    { usd: 50, rate: 1.2 },
    { usd: 100, rate: 1.21 },
    { usd: 150, rate: 1.2133 },
    { usd: 500, rate: 1.218 },
    { usd: 1000, rate: 1.219 },
    { usd: 5000, rate: 1.2194 },
  ];
  
  let applicableRate = tiers[0].rate;
  for (const tier of tiers) {
    if (usdAmount >= tier.usd) {
      applicableRate = tier.rate;
    }
  }
  
  return usdAmount * applicableRate;
};

export const CryptoCalculator = () => {
  const [amount, setAmount] = useState<string>('100');
  const [error, setError] = useState<string>('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<{ usd: number; usdt: number } | null>(null);
  const [existingSession, setExistingSession] = useState<TradeSession | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startSession, clearSession, getStoredSession } = useTradeSession();

  // Check for pending custom trade after login
  useEffect(() => {
    if (!user) return;
    const pending = localStorage.getItem('pendingTrade');
    if (!pending) return;
    try {
      const data = JSON.parse(pending);
      if (!data.isCustom) return; // Let ExpressP2P handle non-custom trades
      setPendingPackage({ usd: data.usd, usdt: data.usdt });
      localStorage.removeItem('pendingTrade');
      setShowConfirmationModal(true);
    } catch {
      localStorage.removeItem('pendingTrade');
    }
  }, [user]);
  
  const calculations = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const usdtReceived = calculateUsdtReceived(numAmount);
    
    return {
      usdtReceived: usdtReceived.toFixed(2),
      usdtReceivedNum: usdtReceived,
      isValid: numAmount >= MIN_AMOUNT && numAmount <= MAX_AMOUNT,
      bonusPercent: numAmount > 0 ? (((usdtReceived / numAmount) - 1) * 100).toFixed(1) : '0',
    };
  }, [amount]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numValue = parseFloat(value) || 0;
    if (numValue > 0 && numValue < MIN_AMOUNT) {
      setError(`Minimum amount is $${MIN_AMOUNT}`);
    } else if (numValue > MAX_AMOUNT) {
      setError(`Maximum amount is $${MAX_AMOUNT.toLocaleString()}`);
    } else {
      setError('');
    }
  };

  const proceedWithPackage = (usd: number, usdt: number) => {
    if (!user) {
      localStorage.setItem('pendingTrade', JSON.stringify({ usd, usdt, isCustom: true }));
      navigate('/login');
      return;
    }
    startSession(usd, usdt, true, user.id);
    toast.success('Trade started!', {
      description: `$${usd} → ${usdt.toFixed(2)} USDT`,
    });
    navigate('/payment');
  };

  const handleCreatePackage = () => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount < MIN_AMOUNT) {
      setError(`Minimum amount is $${MIN_AMOUNT}`);
      return;
    }

    const usdt = calculateUsdtReceived(numAmount);
    setPendingPackage({ usd: numAmount, usdt });

    if (!user) {
      clearSession();
      setShowConfirmationModal(true);
      return;
    }

    const existing = getStoredSession();

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
    <section id="calculator" className="py-16 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Calculator className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Crypto <span className="gradient-text">Calculator</span>
            </h2>
            <p className="text-muted-foreground">
              Enter any amount to see how much USDT you'll receive
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 sm:p-8">
            {/* Input Section */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground block mb-2">
                Amount in USD
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-8 text-xl font-display h-14"
                  placeholder="Enter amount"
                  min={MIN_AMOUNT}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
              
              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[100, 250, 500, 1000, 2500].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAmountChange(preset.toString())}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      amount === preset.toString()
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ${preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Inline Result */}
            {calculations.isValid && (
              <div className="rounded-xl bg-secondary/50 border border-border/50 p-4 mb-5">
                <p className="text-sm text-muted-foreground mb-1">You'll receive</p>
                <p className="text-2xl font-display font-bold text-primary">
                  {calculations.usdtReceived} USDT
                  <span className="text-sm font-normal text-success ml-2">
                    +{calculations.bonusPercent}% bonus
                  </span>
                </p>
              </div>
            )}

            {/* Buy Button */}
            <Button 
              variant="glow" 
              className="w-full" 
              size="lg"
              onClick={handleCreatePackage}
              disabled={!calculations.isValid}
            >
              Buy {calculations.usdtReceived} USDT for ${parseFloat(amount || '0').toLocaleString()}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Min: ${MIN_AMOUNT} • Max: ${MAX_AMOUNT.toLocaleString()} • Same rates as Express P2P
            </p>
          </div>
        </div>
      </div>

      {/* Trade Confirmation Modal */}
      <TradeConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
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
