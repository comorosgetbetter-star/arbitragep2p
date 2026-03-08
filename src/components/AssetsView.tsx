import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Eye, EyeOff, Download, Upload, ArrowLeftRight, Clock, ChevronRight, ChevronDown, ChevronUp, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AssetsView = () => {
  const { user } = useAuth();
  const { balance, deposits } = useUserData();
  const { prices } = useCryptoPrices();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [allocationOpen, setAllocationOpen] = useState(true);

  const displayBalance = hidden
    ? '****'
    : balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Recent unread deposits count
  const recentDeposits = deposits.filter((d) => {
    const age = Date.now() - new Date(d.created_at).getTime();
    return age < 24 * 60 * 60 * 1000; // last 24h
  });

  // Map crypto prices to asset list
  const cryptoIcons: Record<string, string> = {
    BTC: '₿', ETH: '⟠', USDT: '₮', BNB: '◆', SOL: '◎', XRP: '✕', LTC: 'Ł', DOGE: 'Ð',
  };

  const aprRates: Record<string, string> = {
    USDT: 'Up to 50% APR',
    ETH: 'Up to 5% APR',
    BTC: 'Up to 3% APR',
    LTC: 'Up to 1% APR',
    SOL: 'Up to 8% APR',
    BNB: 'Up to 2% APR',
    XRP: 'Up to 1.5% APR',
    DOGE: 'Up to 1% APR',
  };

  const actionButtons = [
    { icon: Download, label: 'Deposit', color: 'bg-primary text-primary-foreground' },
    { icon: Upload, label: 'Withdraw', color: 'bg-primary text-primary-foreground' },
    { icon: ArrowLeftRight, label: 'Transfer', color: 'bg-primary text-primary-foreground' },
    { icon: Clock, label: 'History', color: 'bg-primary text-primary-foreground' },
  ];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-muted-foreground mb-4">Sign in to view your assets</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Balance Section */}
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
      <div className="grid grid-cols-4 gap-3">
        {actionButtons.map(({ icon: Icon, label, color }) => (
          <button key={label} className="flex flex-col items-center gap-1.5">
            <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs text-foreground font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Earn Promo Banner */}
      <div className="bg-secondary/80 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-foreground font-medium">Start growing your idle funds</p>
            <p className="text-sm">
              Earn at <span className="text-primary font-semibold">50% APR</span>
            </p>
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

      {/* Allocation Section */}
      <div>
        <button
          onClick={() => setAllocationOpen(!allocationOpen)}
          className="flex items-center justify-between w-full py-2"
        >
          <h3 className="text-lg font-bold font-display text-foreground">Allocation</h3>
          {allocationOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
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
              const iconColors: Record<string, string> = {
                USDT: 'bg-emerald-500/20 text-emerald-400',
                ETH: 'bg-blue-500/20 text-blue-400',
                BTC: 'bg-orange-500/20 text-orange-400',
                BNB: 'bg-yellow-500/20 text-yellow-400',
                SOL: 'bg-purple-500/20 text-purple-400',
                XRP: 'bg-gray-500/20 text-gray-400',
                LTC: 'bg-slate-500/20 text-slate-400',
                DOGE: 'bg-amber-500/20 text-amber-400',
              };
              const colorClass = iconColors[crypto.symbol] || 'bg-muted text-muted-foreground';

              return (
                <div key={crypto.symbol} className="flex items-center justify-between py-3 px-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-lg font-bold`}>
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{crypto.symbol}</span>
                        {apr && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-primary/30 text-primary font-medium">
                            {apr}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {hidden ? '****' : '<0.00000001'}
                      </p>
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
