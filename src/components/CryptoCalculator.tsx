import { useState, useMemo, useEffect } from 'react';
import { ArrowDownUp, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTradeSession, TradeSession } from '@/hooks/useTradeSession';
import { TradeConfirmationModal } from './TradeConfirmationModal';
import { TradeConflictModal } from './TradeConflictModal';
import { toast } from '@/components/ui/sonner';

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 25000;

const formatUsd = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatUsdt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    if (usdAmount >= tier.usd) applicableRate = tier.rate;
  }
  return usdAmount * applicableRate;
};

const QUICK_AMOUNTS = [100, 250, 500, 1000];

export const CryptoCalculator = () => {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('0');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<{ usd: number; usdt: number } | null>(null);
  const [existingSession, setExistingSession] = useState<TradeSession | null>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { startSession, clearSession, getStoredSession } = useTradeSession();

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
      hasInput: numAmount > 0,
      isValid: numAmount >= MIN_AMOUNT && numAmount <= MAX_AMOUNT,
    };
  }, [numAmount]);

  const error = useMemo(() => {
    if (numAmount === 0) return '';
    if (numAmount < MIN_AMOUNT) return `Minimum amount is $${formatUsd(MIN_AMOUNT)}`;
    if (numAmount > MAX_AMOUNT) return `Maximum amount is $${formatUsd(MAX_AMOUNT)}`;
    return '';
  }, [numAmount]);

  const setAmountValue = (v: string) => {
    // sanitize: only digits and one dot
    let next = v.replace(/[^0-9.]/g, '');
    const firstDot = next.indexOf('.');
    if (firstDot !== -1) {
      next = next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, '');
    }
    if (next.length > 1 && next.startsWith('0') && !next.startsWith('0.')) {
      next = next.replace(/^0+/, '') || '0';
    }
    if (next === '') next = '0';
    setAmount(next);
  };

  const handleKey = (key: string) => {
    if (key === 'back') {
      const next = amount.length <= 1 ? '0' : amount.slice(0, -1);
      setAmount(next === '' ? '0' : next);
      return;
    }
    if (key === '.') {
      if (amount.includes('.')) return;
      setAmount(amount + '.');
      return;
    }
    if (amount === '0') {
      setAmount(key);
    } else {
      setAmount(amount + key);
    }
  };

  const proceedWithPackage = (usd: number, usdt: number) => {
    if (!user) return;
    startSession(usd, usdt, true, user.id);
    toast.success('Trade started!', { description: `$${usd} → ${formatUsdt(usdt)} USDT` });
    navigate('/payment');
  };

  const handleBuy = () => {
    if (mode === 'sell') {
      const el = document.getElementById('p2p');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!calculations.isValid) return;
    if (loading) return;
    if (!user) {
      toast.info('Please sign in to start a trade');
      localStorage.setItem(
        'pendingTrade',
        JSON.stringify({ usd: numAmount, usdt: calculations.usdtReceived, isCustom: true })
      );
      navigate('/login');
      return;
    }
    const usdt = calculations.usdtReceived;
    setPendingPackage({ usd: numAmount, usdt });
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

  // Display amount: keep raw if user is typing decimals, else format with commas
  const displayAmount = (() => {
    if (amount.endsWith('.') || amount.includes('.')) return amount;
    return numAmount === 0 ? '0' : numAmount.toLocaleString('en-US');
  })();

  return (
    <div id="calculator" className="max-w-md mx-auto">
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-md">
        {/* Buy / Sell toggle */}
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex rounded-full bg-secondary/60 p-1">
            <button
              onClick={() => setMode('buy')}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                mode === 'buy' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setMode('sell')}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                mode === 'sell' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        {/* Asset row */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-emerald-400 text-xs font-bold">₮</span>
          </div>
          <span className="font-display font-bold text-base">USDT</span>
          <span className="text-emerald-400 text-xs font-semibold">5.32% APR</span>
        </div>

        {/* Amount display */}
        <div className="mb-2">
          <div className="flex items-baseline gap-3">
            <span
              className={`font-display font-bold leading-none tabular-nums tracking-normal ${
                numAmount === 0 ? 'text-muted-foreground/50' : 'text-foreground'
              } text-5xl sm:text-6xl`}
            >
              {displayAmount}
            </span>
            <span className="text-xl font-semibold text-foreground">USD</span>
          </div>
        </div>

        {/* Conversion line */}
        <div className="flex items-center gap-3 text-sm mb-5">
          <span className="flex items-center gap-1.5 text-foreground font-medium tabular-nums">
            <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
            {calculations.hasInput ? formatUsdt(calculations.usdtReceived) : '0'} USDT
          </span>
          <span className="text-xs text-muted-foreground">1 USDT ≈ 1 USD</span>
        </div>

        {/* Quick amount chips */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {QUICK_AMOUNTS.map((preset) => {
            const label = preset >= 1000 ? `$${preset / 1000}K` : `$${preset}`;
            return (
              <button
                key={preset}
                onClick={() => setAmountValue(preset.toString())}
                className="py-2 rounded-lg border border-border/60 bg-secondary/30 text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-1 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map((k) => (
            <button
              key={k}
              onClick={() => handleKey(k)}
              className="py-3 rounded-lg text-2xl font-display font-semibold text-foreground hover:bg-secondary/40 transition-colors flex items-center justify-center"
              aria-label={k === 'back' ? 'Delete' : k}
            >
              {k === 'back' ? <Delete className="h-5 w-5 text-muted-foreground" /> : k}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-destructive mb-3 text-center">{error}</p>}

        <Button
          variant="glow"
          className="w-full text-sm h-11"
          onClick={handleBuy}
          disabled={mode === 'buy' && !calculations.isValid}
        >
          {mode === 'sell'
            ? 'Sell on P2P'
            : calculations.isValid
              ? `Buy ${formatUsdt(calculations.usdtReceived)} USDT`
              : 'Enter an amount'}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Min ${formatUsd(MIN_AMOUNT)} • Max ${formatUsd(MAX_AMOUNT)}
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
