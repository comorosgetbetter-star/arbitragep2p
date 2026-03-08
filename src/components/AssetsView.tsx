import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Download, Upload, Clock, ChevronRight, ChevronDown, ChevronUp, SlidersHorizontal, Sparkles, ArrowLeft, Copy, Check, Loader2, Wallet, ArrowDownLeft, ArrowUpRight, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type AssetsSubView = 'main' | 'deposit' | 'withdraw' | 'history';
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
  const { user } = useAuth();
  const { balance, deposits, withdrawals } = useUserData();
  const { prices } = useCryptoPrices();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [allocationOpen, setAllocationOpen] = useState(true);
  const [subView, setSubView] = useState<AssetsSubView>('main');

  // Deposit state
  const [depositAddr, setDepositAddr] = useState<{ id: string; address: string; network: string } | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [addrCopied, setAddrCopied] = useState(false);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('trc20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayBalance = hidden
    ? '****'
    : balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const recentDeposits = deposits.filter((d) => {
    const age = Date.now() - new Date(d.created_at).getTime();
    return age < 24 * 60 * 60 * 1000;
  });

  // Load deposit address when entering deposit view
  useEffect(() => {
    if (subView === 'deposit') {
      setDepositLoading(true);
      getRotatedDepositAddress().then((addr) => {
        setDepositAddr(addr);
        setDepositLoading(false);
      });
    }
  }, [subView]);

  const handleCopyAddr = () => {
    if (depositAddr) {
      navigator.clipboard.writeText(depositAddr.address);
      setAddrCopied(true);
      setTimeout(() => setAddrCopied(false), 2000);
    }
  };

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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-muted-foreground mb-4">Sign in to view your assets</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
          Sign In
        </button>
      </div>
    );
  }

  // ── SUB-VIEW: Deposit ──
  if (subView === 'deposit') {
    const meta = depositAddr ? NETWORK_META[depositAddr.network] || { name: depositAddr.network.toUpperCase(), chain: depositAddr.network, fee: 'Variable', time: '~5 min' } : null;
    return (
      <div className="space-y-5">
        <button onClick={() => setSubView('main')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h2 className="text-lg font-display font-bold">Deposit USDT</h2>
        {depositLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading deposit address...</p>
          </div>
        ) : !depositAddr ? (
          <p className="text-sm text-muted-foreground text-center py-6">No deposit addresses available. Please contact support.</p>
        ) : (
          <>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">₮</span>
              </div>
              <p className="font-display font-semibold text-foreground">USDT ({meta?.name})</p>
              <p className="text-sm text-muted-foreground">{meta?.chain}</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">Deposit Address</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-foreground break-all">{depositAddr.address}</code>
                <Button variant="ghost" size="icon" onClick={handleCopyAddr} className="shrink-0">
                  {addrCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Network</span><span className="text-foreground">{meta?.chain}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Minimum Deposit</span><span className="text-foreground">1 USDT</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Network Fee</span><span className="text-foreground">{meta?.fee}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Arrival Time</span><span className="text-foreground">{meta?.time}</span></div>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs text-warning">⚠️ Only send USDT on the {meta?.chain}. Sending other tokens or using a different network may result in permanent loss of funds.</p>
            </div>
          </>
        )}
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

  // ── SUB-VIEW: History ──
  if (subView === 'history') {
    const allActivities = [
      ...deposits.map(d => ({ id: d.id, type: 'deposit' as const, amount: d.amount, status: 'approved', created_at: d.created_at, network: '', reason: d.reason })),
      ...withdrawals.map(w => ({ id: w.id, type: 'withdrawal' as const, amount: w.amount, status: w.status, created_at: w.created_at, network: w.network, reason: null })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const activities = historyFilter === 'all' ? allActivities : allActivities.filter(a => a.type === (historyFilter === 'deposits' ? 'deposit' : 'withdrawal'));

    return (
      <div className="space-y-4">
        <button onClick={() => setSubView('main')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
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

  // ── MAIN VIEW ──
  const actionButtons = [
    { icon: Download, label: 'Deposit', action: () => setSubView('deposit') },
    { icon: Upload, label: 'Withdraw', action: () => setSubView('withdraw') },
    { icon: Clock, label: 'History', action: () => setSubView('history') },
  ];

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
          Today's PnL <span className="text-destructive">-$0.11 (0.00%)</span> <ChevronRight className="h-3 w-3 inline" />
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-4">
        {actionButtons.map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs text-foreground font-medium">{label}</span>
          </button>
        ))}
      </div>

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
            {prices.map((crypto) => {
              const icon = cryptoIcons[crypto.symbol] || '•';
              const apr = aprRates[crypto.symbol];
              const colorClass = iconColors[crypto.symbol] || 'bg-muted text-muted-foreground';
              return (
                <div key={crypto.symbol} className="flex items-center justify-between py-3 px-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-lg font-bold`}>{icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{crypto.symbol}</span>
                        {apr && <span className="text-[10px] px-1.5 py-0.5 rounded border border-primary/30 text-primary font-medium">{apr}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{hidden ? '****' : '<0.00000001'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{hidden ? '****' : '$<0.01'}</p>
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
