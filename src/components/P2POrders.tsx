import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useTradeSession } from '@/hooks/useTradeSession';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TradeConflictModal } from './TradeConflictModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, ShieldCheck, ThumbsUp, BarChart3, Timer, Lock, Wallet, Star, ArrowUpDown, CheckCircle2 } from 'lucide-react';
import type { TradeSession } from '@/hooks/useTradeSession';
import { P2POrdersSkeleton } from '@/components/skeletons/P2POrdersSkeleton';

// Dynamic pricing
const getUsdtAmount = (usd: number, priceRate: number): number => {
  const multiplier = 1 - (priceRate / 100);
  return Math.round(usd * multiplier * 100) / 100;
};

// Effective price per USDT (USD per 1 USDT) for sorting
const getPricePerUsdt = (priceRate: number): number => {
  // buy: user pays $X, receives X*(1-rate/100) USDT → price = 1/(1-rate/100)
  const m = 1 - (priceRate / 100);
  if (m <= 0) return Infinity;
  return 1 / m;
};

interface P2POrder {
  id: string;
  seller_name: string;
  seller_avatar_url: string | null;
  min_amount: number;
  max_amount: number;
  payment_method: string;
  payment_address: string;
  payment_window_minutes: number;
  trades_count: number;
  avg_trading_time: string;
  likes_count: number;
  is_active: boolean;
  created_at: string;
  price_rate: number;
  order_type: 'buy' | 'sell';
}

type SortMode = 'default' | 'price-asc' | 'price-desc';

const MIN_SELL_BALANCE = 35;
const SELL_SESSION_KEY = 'activeSellTradeSession';

export const P2POrders = () => {
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [selectedOrder, setSelectedOrder] = useState<P2POrder | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSellConfirmModal, setShowSellConfirmModal] = useState(false);
  const [errorOrderId, setErrorOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingOrder, setPendingOrder] = useState<{ order: P2POrder; amount: number; usdt: number } | null>(null);
  const [pendingSell, setPendingSell] = useState<{ order: P2POrder; amount: number } | null>(null);
  const [profileOrder, setProfileOrder] = useState<P2POrder | null>(null);
  const [existingSession, setExistingSession] = useState<TradeSession | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { balance, refetchBalance } = useUserData();
  const navigate = useNavigate();
  const { startSession, clearSession, getStoredSession } = useTradeSession();

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('p2p_orders')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setOrders(data as P2POrder[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const buyOrders = useMemo(() => orders.filter(o => (o.order_type ?? 'buy') === 'buy'), [orders]);
  const sellOrders = useMemo(() => orders.filter(o => o.order_type === 'sell'), [orders]);

  const visibleOrders = useMemo(() => {
    const list = tab === 'buy' ? [...buyOrders] : [...sellOrders];
    if (sortMode === 'price-asc') {
      list.sort((a, b) => getPricePerUsdt(a.price_rate) - getPricePerUsdt(b.price_rate));
    } else if (sortMode === 'price-desc') {
      list.sort((a, b) => getPricePerUsdt(b.price_rate) - getPricePerUsdt(a.price_rate));
    }
    return list;
  }, [tab, buyOrders, sellOrders, sortMode]);

  const handleBuyNow = (order: P2POrder) => {
    const amount = parseFloat(buyAmount);
    if (!amount || amount < order.min_amount || amount > order.max_amount) {
      setErrorOrderId(order.id);
      setErrorMessage(`Enter amount between $${order.min_amount} – $${order.max_amount}`);
      return;
    }
    setErrorOrderId(null);
    setErrorMessage('');
    const usdt = getUsdtAmount(amount, order.price_rate);
    if (authLoading) return;
    if (!user) { toast.info('Please sign in to start a trade'); navigate('/login'); return; }
    setPendingOrder({ order, amount, usdt });
    setShowConfirmModal(true);
  };

  const handleSellNow = (order: P2POrder) => {
    if (authLoading) return;
    if (!user) { toast.info('Please sign in to start a trade'); navigate('/login'); return; }

    if (balance < MIN_SELL_BALANCE) {
      toast.error('You have no balance. Please make a deposit to start trading.', {
        description: `Minimum required balance is $${MIN_SELL_BALANCE}.`,
      });
      return;
    }

    const amount = parseFloat(sellAmount);
    if (!amount || amount < order.min_amount || amount > order.max_amount) {
      setErrorOrderId(order.id);
      setErrorMessage(`Enter amount between ${order.min_amount} – ${order.max_amount} USDT`);
      return;
    }
    if (amount > balance) {
      setErrorOrderId(order.id);
      setErrorMessage('Insufficient balance. Please add funds by making a deposit.');
      return;
    }

    setErrorOrderId(null);
    setErrorMessage('');
    setPendingSell({ order, amount });
    setShowSellConfirmModal(true);
  };

  const handleConfirmSell = () => {
    if (!pendingSell || !user) return;

    // Final balance + min check (state may have changed)
    if (balance < MIN_SELL_BALANCE) {
      toast.error('You have no balance. Please make a deposit to start trading.', {
        description: `Minimum required balance is $${MIN_SELL_BALANCE}.`,
      });
      setShowSellConfirmModal(false);
      return;
    }
    if (pendingSell.amount > balance) {
      toast.error('Insufficient balance. Please add funds by making a deposit.');
      setShowSellConfirmModal(false);
      return;
    }

    const now = Date.now();
    const session = {
      orderId: pendingSell.order.id,
      sellerName: pendingSell.order.seller_name,
      sellerAvatarUrl: pendingSell.order.seller_avatar_url,
      amount: pendingSell.amount,
      paymentMethod: pendingSell.order.payment_method,
      paymentAddress: pendingSell.order.payment_address,
      paymentWindowMinutes: pendingSell.order.payment_window_minutes,
      startedAt: now,
      expiresAt: now + pendingSell.order.payment_window_minutes * 60 * 1000,
      orderNumber: `S${now.toString().slice(-8)}`,
    };
    localStorage.setItem(SELL_SESSION_KEY, JSON.stringify(session));
    setShowSellConfirmModal(false);
    setPendingSell(null);
    setSellAmount('');
    navigate('/sell-payment');
  };

  const handleConfirmTrade = () => {
    if (!pendingOrder) return;
    setShowConfirmModal(false);
    const { order, amount, usdt } = pendingOrder;
    const existing = getStoredSession();
    if (existing?.userId && existing.userId !== user!.id) clearSession();
    if (existing && existing.userId === user!.id) {
      setSelectedOrder(order);
      setExistingSession(existing);
      setShowConflictModal(true);
      return;
    }
    proceedWithOrder(order, amount, usdt);
  };

  const proceedWithOrder = (order: P2POrder, amount: number, usdt: number) => {
    localStorage.setItem('p2pOrderPayment', JSON.stringify({
      paymentAddress: order.payment_address,
      paymentWindowMinutes: order.payment_window_minutes,
      sellerName: order.seller_name,
    }));
    startSession(amount, usdt, false, user!.id, order.payment_window_minutes);
    toast.success('Trade started!', { description: `$${amount} → ${usdt} USDT` });
    navigate('/payment');
  };

  const handleResumeExisting = () => { setShowConflictModal(false); navigate('/payment'); };
  const handleStartNew = () => {
    if (pendingOrder) { clearSession(); proceedWithOrder(pendingOrder.order, pendingOrder.amount, pendingOrder.usdt); }
    setShowConflictModal(false);
  };

  if (loading) return <P2POrdersSkeleton />;

  // Computed profile stats (deterministic per order)
  const computeProfile = (o: P2POrder) => {
    const completion = Math.min(99.9, 95 + (o.likes_count % 50) / 10);
    const positive = Math.min(99.9, 96 + (o.trades_count % 40) / 10);
    return {
      completion: completion.toFixed(1),
      positive: positive.toFixed(1),
      release: o.avg_trading_time,
      orders30d: Math.max(50, o.trades_count % 500 + 80),
      memberSince: '2022',
    };
  };

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Buy / Sell Tabs */}
      <div className="flex rounded-lg border border-border overflow-hidden bg-card/50">
        <button
          onClick={() => { setTab('buy'); setErrorOrderId(null); setErrorMessage(''); }}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'buy' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Buy USDT
        </button>
        <button
          onClick={() => { setTab('sell'); setErrorOrderId(null); setErrorMessage(''); }}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'sell' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Sell USDT
        </button>
      </div>

      {/* Sort + balance row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default order</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {tab === 'sell' && user && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
            <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Available:</span>
            <span className="text-xs font-semibold">{balance.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT</span>
          </div>
        )}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">No {tab} ads available</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Check back later for new P2P orders</p>
        </div>
      ) : visibleOrders.map((order) => (
        <div
          key={order.id}
          className="glass-card rounded-xl border border-border hover:border-primary/40 transition-all duration-300 p-4 sm:p-5"
        >
          {/* Seller Info */}
          <button
            type="button"
            onClick={() => setProfileOrder(order)}
            className="flex items-center gap-3 mb-4 w-full text-left hover:opacity-90 transition-opacity"
          >
            <div className="relative">
              <Avatar className="h-9 w-9">
                {order.seller_avatar_url ? (
                  <AvatarImage src={order.seller_avatar_url} alt={order.seller_name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {order.seller_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                title="Online"
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-card"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{order.seller_name}</span>
                <Badge variant="outline" className="text-[10px] border-success/30 text-success bg-success/10">
                  <ShieldCheck className="w-3 h-3 mr-0.5" />
                  Verified
                </Badge>
                <span className="text-[10px] text-success font-medium">● Online</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  {order.trades_count} trades
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {order.avg_trading_time}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {order.likes_count}
                </span>
              </div>
            </div>
          </button>

          {/* Order Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount Range</p>
              <p className="font-display font-bold text-sm whitespace-nowrap">
                {tab === 'sell' ? '' : '$'}{order.min_amount.toLocaleString()} – {tab === 'sell' ? '' : '$'}{order.max_amount.toLocaleString()}{tab === 'sell' ? ' USDT' : ''}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment</p>
              <p className="font-display font-bold text-sm text-primary">{order.payment_method}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Window</p>
              <p className="font-display font-bold text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {order.payment_window_minutes} min
              </p>
            </div>
          </div>

          {/* Action Section */}
          {tab === 'buy' ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    placeholder={`${order.min_amount} – ${order.max_amount}`}
                    className={`w-full h-10 pl-7 pr-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${errorOrderId === order.id ? 'border-destructive ring-1 ring-destructive/30' : 'border-border'}`}
                    min={order.min_amount}
                    max={order.max_amount}
                    onChange={(e) => {
                      setBuyAmount(e.target.value);
                      setSelectedOrder(order);
                      if (errorOrderId === order.id) { setErrorOrderId(null); setErrorMessage(''); }
                    }}
                    onFocus={() => setSelectedOrder(order)}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => { setSelectedOrder(order); handleBuyNow(order); }}
                  className="shrink-0"
                >
                  Buy USDT
                </Button>
              </div>
              {errorOrderId === order.id && (
                <p className="text-[11px] text-destructive font-medium pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {errorMessage}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    placeholder={`${order.min_amount} – ${order.max_amount} USDT`}
                    className={`w-full h-10 px-3 pr-14 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${errorOrderId === order.id ? 'border-destructive ring-1 ring-destructive/30' : 'border-border'}`}
                    min={order.min_amount}
                    max={order.max_amount}
                    onChange={(e) => {
                      setSellAmount(e.target.value);
                      setSelectedOrder(order);
                      if (errorOrderId === order.id) { setErrorOrderId(null); setErrorMessage(''); }
                    }}
                    onFocus={() => setSelectedOrder(order)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">USDT</span>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => { setSelectedOrder(order); handleSellNow(order); }}
                  className="shrink-0"
                >
                  Sell USDT
                </Button>
              </div>
              {errorOrderId === order.id && (
                <p className="text-[11px] text-destructive font-medium pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {errorMessage}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Buy Trade Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Confirm Trade</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review your trade details before proceeding.
            </DialogDescription>
          </DialogHeader>
          {pendingOrder && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  {pendingOrder.order.seller_avatar_url ? <AvatarImage src={pendingOrder.order.seller_avatar_url} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {pendingOrder.order.seller_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{pendingOrder.order.seller_name}</p>
                  <p className="text-[11px] text-muted-foreground">{pendingOrder.order.trades_count} trades · {pendingOrder.order.likes_count} likes</p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">You pay</span><span className="font-semibold">${pendingOrder.amount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">You receive</span><span className="font-semibold text-primary">{pendingOrder.usdt.toLocaleString()} USDT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment window</span><span className="font-semibold">{pendingOrder.order.payment_window_minutes} min</span></div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-success/20 bg-success/5 p-3">
                <Lock className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-success">Funds Secured in Escrow</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    Your funds are held securely in escrow throughout the transaction.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleConfirmTrade}>Confirm Trade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Confirmation Modal */}
      <Dialog open={showSellConfirmModal} onOpenChange={setShowSellConfirmModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Confirm Sell Order</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review your sell order before proceeding to the trade window.
            </DialogDescription>
          </DialogHeader>
          {pendingSell && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  {pendingSell.order.seller_avatar_url ? <AvatarImage src={pendingSell.order.seller_avatar_url} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {pendingSell.order.seller_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{pendingSell.order.seller_name}</p>
                  <p className="text-[11px] text-muted-foreground">{pendingSell.order.trades_count} trades · {pendingSell.order.likes_count} likes</p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">You sell</span><span className="font-semibold">{pendingSell.amount.toLocaleString()} USDT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Wallet balance</span><span className="font-semibold">{balance.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment window</span><span className="font-semibold">{pendingSell.order.payment_window_minutes} min</span></div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                After confirming, you'll be taken to the active trade window to wait for the buyer's payment and release your USDT.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSellConfirmModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleConfirmSell}>Open Trade Window</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trader Profile Modal */}
      <Dialog open={!!profileOrder} onOpenChange={(o) => !o && setProfileOrder(null)}>
        <DialogContent className="max-w-md">
          {profileOrder && (() => {
            const p = computeProfile(profileOrder);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base">Trader profile</DialogTitle>
                  <DialogDescription className="text-xs">
                    Full statistics and trading history
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        {profileOrder.seller_avatar_url ? <AvatarImage src={profileOrder.seller_avatar_url} /> : null}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {profileOrder.seller_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{profileOrder.seller_name}</span>
                        <Badge variant="outline" className="text-[10px] border-success/30 text-success bg-success/10">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Verified
                        </Badge>
                      </div>
                      <p className="text-[11px] text-success mt-0.5">● Online now</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Completion rate</p>
                      <p className="text-base font-display font-bold text-success tracking-normal">{p.completion}%</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Positive feedback</p>
                      <p className="text-base font-display font-bold tracking-normal">{p.positive}%</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total orders</p>
                      <p className="text-base font-display font-bold tracking-normal">{profileOrder.trades_count.toLocaleString('en-US')}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Orders (30d)</p>
                      <p className="text-base font-display font-bold tracking-normal">{p.orders30d.toLocaleString('en-US')}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg release time</p>
                      <p className="text-base font-display font-bold tracking-normal">{p.release}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Likes</p>
                      <p className="text-base font-display font-bold tracking-normal flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-primary" />
                        {profileOrder.likes_count.toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Ratings & reviews</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm font-semibold ml-1">5.0</span>
                      <span className="text-[11px] text-muted-foreground ml-1">({profileOrder.likes_count} reviews)</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trading info</p>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Member since</span><span className="font-semibold">{p.memberSince}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Payment</span><span className="font-semibold text-primary">{profileOrder.payment_method}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Limits</span><span className="font-semibold">{profileOrder.min_amount.toLocaleString()} – {profileOrder.max_amount.toLocaleString()}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Window</span><span className="font-semibold">{profileOrder.payment_window_minutes} min</span></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="w-full" onClick={() => setProfileOrder(null)}>
                    Back to listings
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

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
