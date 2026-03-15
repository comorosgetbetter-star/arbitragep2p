import { useState, useEffect } from 'react';
import { DepositCrypto } from '@/components/DepositCrypto';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Download, Upload, Clock, ChevronRight, ChevronDown, ChevronUp, SlidersHorizontal, Sparkles, ArrowLeft, Copy, Check, Loader2, Wallet, ArrowDownLeft, ArrowUpRight, XCircle, CheckCircle2, ArrowLeftRight, FileDown, TrendingUp, TrendingDown } from 'lucide-react';
import { AssetsMainSkeleton } from '@/components/skeletons/AssetsMainSkeleton';
import { DepositSkeleton } from '@/components/skeletons/DepositSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type AssetsSubView = 'main' | 'deposit' | 'withdraw' | 'convert' | 'history';
type HistoryFilter = 'all' | 'deposits' | 'withdrawals';

const NETWORK_META: Record<string, { name: string; chain: string; fee: string; time: string }> = {
  trc20: { name: 'TRC20', chain: 'Tron Network', fee: '~1 USDT', time: '~3 min' },
  erc20: { name: 'ERC20', chain: 'Ethereum', fee: '~5-20 USDT', time: '~5 min' },
  bep20: { name: 'BEP20', chain: 'BNB Smart Chain', fee: '~0.5 USDT', time: '~3 min' },
};

const networks = [
  { id: 'trc20', name: 'TRC20', chain: 'Tron' },
  { id: 'erc20', name: 'ERC20', chain: 'Ethereum' },
  { id: 'bep20', name: 'BEP20', chain: 'BSC' },
];

const getRotatedDepositAddress = async () => {
  const { data: addresses } = await supabase
    .from('usdt_addresses')
    .select('id, address, network')
    .eq('address_type', 'deposit')
    .eq('is_active', true)
    .order('display_order');
  if (!addresses || addresses.length === 0) return null;
  const { data: rotation } = await supabase
    .from('address_rotation')
    .select('last_used_index')
    .eq('address_type', 'deposit')
    .single();
  const lastIndex = rotation?.last_used_index ?? 0;
  const nextIndex = (lastIndex + 1) % addresses.length;
  await supabase
    .from('address_rotation')
    .update({ last_used_index: nextIndex, updated_at: new Date().toISOString() })
    .eq('address_type', 'deposit');
  return addresses[nextIndex];
};

export const AssetsView = () => {
  const { user, loading } = useAuth();
  const { balance, cryptoBalances, deposits, withdrawals, refetchBalance, refetchCryptoBalances, isLoading: dataLoading } = useUserData();
  const { prices } = useCryptoPrices();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [allocationOpen, setAllocationOpen] = useState(true);
  const [subView, setSubView] = useState<AssetsSubView>('main');

  // Deposit state removed – now using shared DepositCrypto component

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('trc20');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  // Convert state
  const [convertFrom, setConvertFrom] = useState('');
  const [convertTo, setConvertTo] = useState('');
  const [convertAmount, setConvertAmount] = useState('');
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
  const [toDropdownOpen, setToDropdownOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Compute total portfolio value (USDT balance + all crypto holdings at current prices)
  // Use a stable price snapshot to avoid jumps from simulated price ticks
  const [stablePrices, setStablePrices] = useState<Record<string, number>>({});
  useEffect(() => {
    // Update stable prices only every 30 seconds to prevent visual jumps
    const updateStable = () => {
      const map: Record<string, number> = {};
      prices.forEach(p => { map[p.symbol] = p.price; });
      setStablePrices(map);
    };
    updateStable();
    const interval = setInterval(updateStable, 30000);
    return () => clearInterval(interval);
  }, []);
  // Also update when crypto balances actually change (conversion, deposit, etc.)
  useEffect(() => {
    const map: Record<string, number> = {};
    prices.forEach(p => { map[p.symbol] = p.price; });
    setStablePrices(map);
  }, [balance, cryptoBalances]);

  const totalPortfolioValue = (() => {
    let total = balance; // USDT balance
    cryptoBalances.forEach((cb) => {
      const price = stablePrices[cb.symbol] || prices.find(pr => pr.symbol === cb.symbol)?.price || 0;
      total += cb.amount * price;
    });
    return total;
  })();

  const displayBalance = hidden
    ? '****'
    : totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const recentDeposits = deposits.filter((d) => {
    const age = Date.now() - new Date(d.created_at).getTime();
    return age < 24 * 60 * 60 * 1000;
  });

  // Load balances when entering convert view
  useEffect(() => {
    if (subView === 'convert') {
      Promise.all([refetchBalance(), refetchCryptoBalances()]);
    }
  }, [subView]);

  const handleSubmitWithdrawal = async () => {
    if (!user || !withdrawAmount || !walletAddress) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount > balance) { toast.error('Insufficient balance'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('withdrawals').insert({
        user_id: user.id, amount, wallet_address: walletAddress, network: selectedNetwork,
      });
      if (error) throw error;
      toast.success('Withdrawal submitted — processing...');
      setWithdrawAmount('');
      setWalletAddress('');
      setSubView('main');
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to submit withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cryptoLogos: Record<string, string> = {
    BTC: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/btc.png',
    ETH: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
    USDT: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/usdt.png',
    BNB: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/bnb.png',
    SOL: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/sol.png',
    XRP: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/xrp.png',
    LTC: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/ltc.png',
    DOGE: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/doge.png',
  };
  const cryptoIcons: Record<string, string> = {
    BTC: '₿', ETH: '⟠', USDT: '₮', BNB: '◆', SOL: '◎', XRP: '✕', LTC: 'Ł', DOGE: 'Ð',
  };
  const aprRates: Record<string, string> = {
    USDT: 'Up to 50% APR', ETH: 'Up to 5% APR', BTC: 'Up to 3% APR', LTC: 'Up to 1% APR',
    SOL: 'Up to 8% APR', BNB: 'Up to 2% APR', XRP: 'Up to 1.5% APR', DOGE: 'Up to 1% APR',
  };
  const iconColors: Record<string, string> = {
    USDT: 'bg-emerald-500/20 text-emerald-400', ETH: 'bg-blue-500/20 text-blue-400',
    BTC: 'bg-orange-500/20 text-orange-400', BNB: 'bg-yellow-500/20 text-yellow-400',
    SOL: 'bg-purple-500/20 text-purple-400', XRP: 'bg-gray-500/20 text-gray-400',
    LTC: 'bg-slate-500/20 text-slate-400', DOGE: 'bg-amber-500/20 text-amber-400',
  };

  if (loading || (user && dataLoading)) {
    return <AssetsMainSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <p className="text-foreground font-display font-bold text-lg mb-1">Sign in to continue</p>
        <p className="text-muted-foreground text-sm mb-4 text-center">Log in to access deposits, withdrawals, conversions and transaction history</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
          Sign In
        </button>
      </div>
    );
  }

  // ── SUB-VIEW: Deposit ──
  if (subView === 'deposit') {
    return (
      <div className="space-y-5">
        <button onClick={() => setSubView('main')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h2 className="text-lg font-display font-bold">Deposit Crypto</h2>
        <DepositCrypto />
      </div>
    );
  }

  // ── SUB-VIEW: Withdraw ──
  if (subView === 'withdraw') {
    return (
      <div className="space-y-5">
        <button onClick={() => setSubView('main')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h2 className="text-lg font-display font-bold">Withdraw USDT</h2>
          <p className="text-sm text-muted-foreground">Available: {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Amount</label>
            <div className="relative">
              <Input type="number" placeholder="0.00" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="pr-16" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-medium hover:text-primary/80" onClick={() => setWithdrawAmount(balance.toString())}>MAX</button>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Wallet Address</label>
            <Input type="text" placeholder="Enter your wallet address" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Network</label>
            <div className="grid grid-cols-3 gap-2">
              {networks.map((network) => (
                <button key={network.id} onClick={() => setSelectedNetwork(network.id)} className={`p-3 rounded-lg border text-center transition-all ${selectedNetwork === network.id ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-border/80 text-muted-foreground'}`}>
                  <p className="text-sm font-medium">{network.name}</p>
                  <p className="text-xs opacity-70">{network.chain}</p>
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" disabled={!withdrawAmount || !walletAddress || isSubmitting} onClick={handleSubmitWithdrawal}>
            {isSubmitting ? 'Submitting...' : 'Confirm Withdrawal'}
          </Button>
        </div>
      </div>
    );
  }

  // ── SUB-VIEW: Convert ──
  if (subView === 'convert') {
    // Available cryptos the user has balance in (including USDT)
    // Use a threshold > 0 to avoid floating point dust
    const availableCryptos = [
      ...(balance > 0.001 ? [{ symbol: 'USDT', amount: balance }] : []),
      ...cryptoBalances.filter(cb => cb.amount > 0.000001),
    ];

    // All symbols: user-owned ones + all standard ones for the "To" picker
    const allSymbols = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
    const cryptoNames: Record<string, string> = { USDT: 'Tether', BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'BNB', SOL: 'Solana', XRP: 'XRP' };
    const CRYPTO_LOGOS: Record<string, string> = {
      USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
      BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
      SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
      XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    };
    const fromBalance = convertFrom === 'USDT' ? balance : (cryptoBalances.find(c => c.symbol === convertFrom)?.amount || 0);
    const fromPrice = convertFrom === 'USDT' ? 1 : (prices.find(p => p.symbol === convertFrom)?.price || 0);
    const toPrice = convertTo === 'USDT' ? 1 : (prices.find(p => p.symbol === convertTo)?.price || 0);
    const convertAmountNum = parseFloat(convertAmount) || 0;
    const convertedValue = toPrice > 0 ? (convertAmountNum * fromPrice) / toPrice : 0;

    const handleConvert = async () => {
      if (!user || !convertFrom || !convertTo || convertAmountNum <= 0) return;
      if (convertAmountNum > fromBalance) { toast.error('Insufficient balance'); return; }
      if (convertFrom === convertTo) { toast.error('Select different currencies'); return; }

      setIsConverting(true);
      try {
        const { error } = await supabase.rpc('convert_crypto', {
          _from_symbol: convertFrom,
          _to_symbol: convertTo,
          _from_amount: convertAmountNum,
          _to_amount: convertedValue,
        });
        if (error) throw error;

        // Brief loading animation then success
        await new Promise(r => setTimeout(r, 1500));
        
        // Refetch balances so UI reflects changes
        await Promise.all([refetchBalance(), refetchCryptoBalances()]);
        
        setConvertSuccess(true);
        toast.success(`Converted ${convertAmountNum} ${convertFrom} → ${convertedValue.toFixed(convertTo === 'USDT' ? 2 : 6)} ${convertTo}`);
      } catch (error) {
        console.error('Convert error:', error);
        toast.error('Conversion failed. Please try again.');
      } finally {
        setIsConverting(false);
      }
    };

    if (isConverting || convertSuccess) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          {convertSuccess ? (
            <>
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <p className="text-lg font-display font-bold text-foreground">Conversion Complete!</p>
              <p className="text-sm text-muted-foreground">
                {convertAmountNum} {convertFrom} → {convertedValue.toFixed(convertTo === 'USDT' ? 2 : 6)} {convertTo}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setConvertSuccess(false);
                  setConvertFrom('');
                  setConvertTo('');
                  setConvertAmount('');
                  setSubView('main');
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Go Back to Assets
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Converting {convertFrom} to {convertTo}...</p>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <button onClick={() => setSubView('main')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h2 className="text-lg font-display font-bold">Convert Crypto</h2>
          <p className="text-sm text-muted-foreground">Swap between your assets at market rates</p>
        </div>

        <div className="space-y-4">
          {/* From */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
            <label className="text-xs text-muted-foreground font-medium">From</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setFromDropdownOpen(!fromDropdownOpen)}
                className="w-full flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground hover:border-primary/40 transition-colors"
              >
                {convertFrom ? (
                  <>
                    <img src={CRYPTO_LOGOS[convertFrom]} alt={convertFrom} className="w-6 h-6 rounded-full" />
                    <span className="font-medium">{convertFrom}</span>
                    <span className="text-muted-foreground text-xs">
                      {cryptoNames[convertFrom]} — {(availableCryptos.find(c => c.symbol === convertFrom)?.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 6 })}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select crypto</span>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
              </button>
              {fromDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {availableCryptos.map(c => (
                    <button
                      key={c.symbol}
                      type="button"
                      onClick={() => { setConvertFrom(c.symbol); setConvertAmount(''); setFromDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary/80 transition-colors ${convertFrom === c.symbol ? 'bg-primary/10' : ''}`}
                    >
                      <img src={CRYPTO_LOGOS[c.symbol]} alt={c.symbol} className="w-6 h-6 rounded-full" />
                      <span className="font-medium">{c.symbol}</span>
                      <span className="text-muted-foreground text-xs">{cryptoNames[c.symbol]}</span>
                      <span className="ml-auto text-xs text-muted-foreground font-mono">{c.amount.toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {convertFrom && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Amount</span>
                  <button className="text-xs text-primary font-medium" onClick={() => setConvertAmount(fromBalance.toString())}>MAX</button>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Available: {fromBalance.toLocaleString('en-US', { maximumFractionDigits: 6 })} {convertFrom}</p>
              </div>
            )}
          </div>

          {/* Swap icon */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* To */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
            <label className="text-xs text-muted-foreground font-medium">To</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setToDropdownOpen(!toDropdownOpen)}
                className="w-full flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground hover:border-primary/40 transition-colors"
              >
                {convertTo ? (
                  <>
                    <img src={CRYPTO_LOGOS[convertTo]} alt={convertTo} className="w-6 h-6 rounded-full" />
                    <span className="font-medium">{convertTo}</span>
                    <span className="text-muted-foreground text-xs">{cryptoNames[convertTo]}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select crypto</span>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
              </button>
              {toDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {allSymbols.filter(s => s !== convertFrom).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setConvertTo(s); setToDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary/80 transition-colors ${convertTo === s ? 'bg-primary/10' : ''}`}
                    >
                      <img src={CRYPTO_LOGOS[s]} alt={s} className="w-6 h-6 rounded-full" />
                      <span className="font-medium">{s}</span>
                      <span className="text-muted-foreground text-xs">{cryptoNames[s]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {convertFrom && convertTo && convertAmountNum > 0 && (
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">You'll receive approximately</p>
                <p className="text-lg font-display font-bold text-foreground">
                  {convertedValue.toLocaleString('en-US', { maximumFractionDigits: convertTo === 'USDT' ? 2 : 6 })} {convertTo}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rate: 1 {convertFrom} ≈ {(fromPrice / toPrice).toLocaleString('en-US', { maximumFractionDigits: 6 })} {convertTo}
                </p>
              </div>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!convertFrom || !convertTo || convertAmountNum <= 0 || convertAmountNum > fromBalance || convertFrom === convertTo}
            onClick={handleConvert}
          >
            Convert {convertFrom && convertTo ? `${convertFrom} → ${convertTo}` : ''}
          </Button>
        </div>
      </div>
    );
  }


  if (subView === 'history') {
    const allActivities = [
      ...deposits.map(d => ({ id: d.id, type: 'deposit' as const, amount: d.amount, status: 'approved', created_at: d.created_at, network: '', reason: d.reason })),
      ...withdrawals.map(w => ({ id: w.id, type: 'withdrawal' as const, amount: w.amount, status: w.status, created_at: w.created_at, network: w.network, reason: null })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const activities = historyFilter === 'all' ? allActivities : allActivities.filter(a => a.type === (historyFilter === 'deposits' ? 'deposit' : 'withdrawal'));

    const exportCSV = () => {
      const rows = [['Type', 'Amount (USDT)', 'Status', 'Network', 'Reason', 'Date']];
      activities.forEach(a => {
        rows.push([
          a.type === 'deposit' ? 'Deposit' : 'Withdrawal',
          `${a.type === 'deposit' ? '+' : '-'}${a.amount.toFixed(2)}`,
          a.status,
          a.type === 'withdrawal' ? (a.network || '').toUpperCase() : 'USDT',
          a.reason || '',
          new Date(a.created_at).toLocaleString(),
        ]);
      });
      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `peerbitx-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Transaction history exported');
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setSubView('main')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {activities.length > 0 && (
            <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
              <FileDown className="h-3.5 w-3.5" /> Export CSV
            </button>
          )}
        </div>
        <h2 className="text-lg font-display font-bold">Transaction History</h2>
        <div className="flex gap-2">
          {(['all', 'deposits', 'withdrawals'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setHistoryFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${historyFilter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {f === 'all' ? 'All' : f === 'deposits' ? 'Deposits' : 'Withdrawals'}
            </button>
          ))}
        </div>
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2.5">
                  {item.type === 'deposit' ? (
                    <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
                      <ArrowDownLeft className="h-4 w-4 text-success" />
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.status === 'approved' ? 'bg-success/15' : item.status === 'pending' ? 'bg-warning/15' : 'bg-destructive/15'}`}>
                      <ArrowUpRight className={`h-4 w-4 ${item.status === 'approved' ? 'text-success' : item.status === 'pending' ? 'text-warning' : 'text-destructive'}`} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{item.type === 'deposit' ? 'Deposit' : 'Withdrawal'}</p>
                    <p className="text-xs text-muted-foreground">{item.type === 'withdrawal' && item.network ? item.network.toUpperCase() : 'USDT'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${item.type === 'deposit' ? 'text-success' : 'text-foreground'}`}>
                    {item.type === 'deposit' ? '+' : '-'}{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </p>
                  <p className={`text-xs ${item.status === 'pending' ? 'text-warning' : item.status === 'failed' || item.status === 'expired' ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {item.status === 'pending' ? 'Processing' : item.status === 'failed' ? 'Failed' : item.status === 'expired' ? 'Expired' : new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── P/L Calculation ──
  const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);
  const netPnL = totalPortfolioValue - totalDeposited + totalWithdrawn;
  const pnlPct = totalDeposited > 0 ? (netPnL / totalDeposited) * 100 : 0;
  const isPnlPositive = netPnL >= 0;

  // ── MAIN VIEW ──
  const actionButtons = [
    { icon: Download, label: 'Deposit', action: () => setSubView('deposit') },
    { icon: Upload, label: 'Withdraw', action: () => setSubView('withdraw') },
    { icon: ArrowLeftRight, label: 'Convert', action: () => setSubView('convert') },
    { icon: Clock, label: 'History', action: () => setSubView('history') },
  ];

  // Show skeleton while auth or user data is still loading
  if (loading || (user && dataLoading)) {
    return <AssetsMainSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/* Balance */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-muted-foreground">Est total value</span>
          <button onClick={() => setHidden(!hidden)} className="text-muted-foreground hover:text-foreground transition-colors">
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold font-display">{displayBalance}</span>
          <span className="text-lg text-muted-foreground">USD</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {hidden ? (
            'P&L ****'
          ) : (
            <>
              Total P&L{' '}
              <span className={isPnlPositive ? 'text-success' : 'text-destructive'}>
                {isPnlPositive ? '+' : ''}{netPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pnlPct.toFixed(2)}%)
              </span>
              {isPnlPositive ? <TrendingUp className="h-3 w-3 inline ml-1" /> : <TrendingDown className="h-3 w-3 inline ml-1" />}
            </>
          )}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-3">
        {actionButtons.map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-full bg-gold text-gold-foreground flex items-center justify-center shadow-[0_0_16px_hsl(43_96%_56%/0.25)]">
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs text-foreground font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* P/L Summary Card */}
      {!hidden && totalDeposited > 0 && (
        <div className="bg-secondary/60 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Portfolio Summary</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Deposited</p>
              <p className="text-sm font-bold text-foreground">${totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Withdrawn</p>
              <p className="text-sm font-bold text-foreground">${totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Net P&L</p>
              <p className={`text-sm font-bold ${isPnlPositive ? 'text-success' : 'text-destructive'}`}>
                {isPnlPositive ? '+' : ''}${netPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Earn Promo */}
      <div className="bg-secondary/80 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-foreground font-medium">Start growing your idle funds</p>
            <p className="text-sm">Earn at <span className="text-primary font-semibold">50% APR</span></p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">2/2</span>
      </div>

      {/* Deposit Notification */}
      {recentDeposits.length > 0 && (
        <div className="flex items-center justify-between py-3 border-t border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm text-foreground">{recentDeposits.length} deposit(s) received</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Allocation */}
      <div>
        <button onClick={() => setAllocationOpen(!allocationOpen)} className="flex items-center justify-between w-full py-2">
          <h3 className="text-lg font-bold font-display text-foreground">Allocation</h3>
          {allocationOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </button>
      </div>

      {/* Assets List */}
      {allocationOpen && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold font-display text-foreground">Assets</h3>
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 px-1">
            <span>Name/Amount</span>
            <span>Value/Spot PnL</span>
          </div>
          <div className="space-y-1">
            {[...prices].map((crypto) => {
              // USDT value = user's USDT balance; others = crypto holdings × live price
              const cryptoHolding = cryptoBalances.find(cb => cb.symbol === crypto.symbol);
              const holdingAmount = crypto.symbol === 'USDT'
                ? balance
                : (cryptoHolding?.amount || 0);
              const holdingValue = crypto.symbol === 'USDT'
                ? balance
                : holdingAmount * crypto.price;
              return { ...crypto, holdingValue, holdingAmount };
            }).sort((a, b) => b.holdingValue - a.holdingValue || b.price - a.price).map((crypto) => {
              const logo = cryptoLogos[crypto.symbol];
              const icon = cryptoIcons[crypto.symbol] || '•';
              const apr = aprRates[crypto.symbol];
              const colorClass = iconColors[crypto.symbol] || 'bg-muted text-muted-foreground';
              return (
                <div key={crypto.symbol} className="flex items-center justify-between py-3 px-1">
                  <div className="flex items-center gap-3">
                    {logo ? (
                      <img src={logo} alt={crypto.symbol} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-lg font-bold`}>{icon}</div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{crypto.symbol}</span>
                        {apr && <span className="text-[10px] px-1.5 py-0.5 rounded border border-primary/30 text-primary font-medium">{apr}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {hidden ? '****' : crypto.holdingAmount > 0
                          ? `${crypto.holdingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: crypto.symbol === 'BTC' ? 8 : crypto.symbol === 'USDT' ? 2 : 4 })} ${crypto.symbol}`
                          : '<0.00000001'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {hidden ? '****' : crypto.holdingValue > 0
                        ? `$${crypto.holdingValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '$<0.01'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
