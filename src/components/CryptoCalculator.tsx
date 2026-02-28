import { useState, useMemo, useEffect } from 'react';
import { Calculator, ArrowRight, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTradeSession, TradeSession } from '@/hooks/useTradeSession';
import { TradeConfirmationModal } from './TradeConfirmationModal';
import { TradeConflictModal } from './TradeConflictModal';
import { toast } from '@/components/ui/sonner';

const MIN_AMOUNT = 50;
const MAX_AMOUNT = 25000;

const formatUsd = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatUsdt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Tiered profit rate calculation - matches Express P2P packages
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
      if (!data.isCustom) return;
      setPendingPackage({ usd: data.usd, usdt: data.usdt });
      localStorage.removeItem('pendingTrade');
      setShowConfirmationModal(true);
    } catch {
      localStorage.removeItem('pendingTrade');
    }
  }, [user]);

  const numAmount = parseFloat(amount) || 0;

  const calculations = useMemo(() => {
    const usdtReceived = calculateUsdtReceived(numAmount);
    return {
      usdtReceived,
      isValid: numAmount >= MIN_AMOUNT && numAmount <= MAX_AMOUNT,
      profitPercent: numAmount > 0 ? (((usdtReceived / numAmount) - 1) * 100).toFixed(1) : '0',
    };
  }, [numAmount]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numValue = parseFloat(value) || 0;
    if (numValue > 0 && numValue < MIN_AMOUNT) {
      setError(`Minimum amount is $${MIN_AMOUNT}`);
    } else if (numValue > MAX_AMOUNT) {
      setError(`Maximum amount is $${formatUsd(MAX_AMOUNT)}`);
    } else {
      setError('');
    }
  };

  const handleSliderChange = (values: number[]) => {
    handleAmountChange(values[0].toString());
  };

  const proceedWithPackage = (usd: number, usdt: number) => {
    if (!user) {
      localStorage.setItem('pendingTrade', JSON.stringify({ usd, usdt, isCustom: true }));
      navigate('/login');
      return;
    }
    startSession(usd, usdt, true, user.id);
    toast.success('Trade started!', { description: `$${usd} → ${formatUsdt(usdt)} USDT` });
    navigate('/payment');
  };

  const handleCreatePackage = () => {
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
    <div id="calculator" className="max-w-3xl mx-auto">
      {/* Conversion Card */}
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-lg" style={{
            borderImage: 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--border)) 50%, hsl(var(--primary) / 0.2)) 1',
          }}>
            {/* Two-panel conversion */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-center mb-6">
              {/* You Pay */}
              <div className="rounded-xl bg-secondary/50 border border-border/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-medium">You Pay</span>
                  <Badge variant="outline" className="text-xs font-semibold">USD</Badge>
                </div>
              <div className="flex items-center gap-1">
                  <span className="text-2xl font-display font-bold text-muted-foreground shrink-0">$</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="text-2xl sm:text-3xl font-display font-bold h-12 border-0 bg-transparent shadow-none focus-visible:ring-0 p-0"
                    placeholder="100"
                    min={MIN_AMOUNT}
                  />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center sm:rotate-0 rotate-90">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* You Receive */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-medium">You Receive</span>
                  <Badge className="text-xs font-semibold bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">USDT</Badge>
                </div>
                <p className="text-2xl sm:text-3xl font-display font-bold text-primary">
                  {calculations.isValid ? formatUsdt(calculations.usdtReceived) : '—'}
                </p>
                {calculations.isValid && (
                  <Badge variant="secondary" className="mt-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{calculations.profitPercent}% profit
                  </Badge>
                )}
              </div>
            </div>

            {/* Slider */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>${formatUsd(MIN_AMOUNT)}</span>
                <span>${formatUsd(MAX_AMOUNT)}</span>
              </div>
              <Slider
                value={[Math.min(Math.max(numAmount, MIN_AMOUNT), MAX_AMOUNT)]}
                onValueChange={handleSliderChange}
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step={10}
                className="w-full"
              />
            </div>

            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[100, 250, 500, 1000, 2500, 5000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleAmountChange(preset.toString())}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    amount === preset.toString()
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ${formatUsd(preset)}
                </button>
              ))}
            </div>

            {error && <p className="text-sm text-destructive mb-4">{error}</p>}

            {/* Buy Button */}
            <Button
              variant="glow"
              className="w-full"
              size="lg"
              onClick={handleCreatePackage}
              disabled={!calculations.isValid}
            >
              Buy {formatUsdt(calculations.usdtReceived)} USDT for ${formatUsd(numAmount)}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Min: ${formatUsd(MIN_AMOUNT)} • Max: ${formatUsd(MAX_AMOUNT)} • Same rates as Express P2P
            </p>
          </div>

      <TradeConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmTrade}
        usd={pendingPackage?.usd || 0}
        usdt={pendingPackage?.usdt || 0}
      />
      <TradeConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        existingSession={existingSession}
        onResume={handleResumeExisting}
        onStartNew={handleStartNew}
      />
    </div>
  );
};
