import { useState, useEffect, useCallback } from 'react';
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
import { Clock, ShieldCheck, ThumbsUp, BarChart3, Timer, Lock, Wallet } from 'lucide-react';
import type { TradeSession } from '@/hooks/useTradeSession';
import { P2POrdersSkeleton } from '@/components/skeletons/P2POrdersSkeleton';

// Dynamic pricing: each order has its own price_rate (percentage markup/discount)
// +rate = seller profit (buyer receives less), -rate = buyer bonus (buyer receives more)
const getUsdtAmount = (usd: number, priceRate: number): number => {
  const multiplier = 1 - (priceRate / 100);
  return Math.round(usd * multiplier * 100) / 100;
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

const MIN_SELL_BALANCE = 35;

export const P2POrders = () => {
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
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
  const [sellSubmitting, setSellSubmitting] = useState(false);
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

  const buyOrders = orders.filter(o => (o.order_type ?? 'buy') === 'buy');
  const sellOrders = orders.filter(o => o.order_type === 'sell');
  const visibleOrders = tab === 'buy' ? buyOrders : sellOrders;

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
    if (!user) {
      toast.info('Please sign in to start a trade');
      navigate('/login');
      return;
    }

    setPendingOrder({ order, amount, usdt });
    setShowConfirmModal(true);
  };

  const handleSellNow = (order: P2POrder) => {
    if (authLoading) return;
    if (!user) {
      toast.info('Please sign in to start a trade');
      navigate('/login');
      return;
    }

    if (balance < MIN_SELL_BALANCE) {
      toast.error('You have no balance. Please make a deposit to start trading.', {
        description: `Minimum required balance: $${MIN_SELL_BALANCE}.`,
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

  const handleConfirmSell = async () => {
    if (!pendingSell) return;
    setSellSubmitting(true);
    try {
      const { error } = await supabase.rpc('p2p_sell_usdt' as never, {
        _order_id: pendingSell.order.id,
        _amount: pendingSell.amount,
      } as never);
      if (error) {
        const msg = (error as { message?: string }).message || '';
        if (msg.includes('MIN_BALANCE')) {
          toast.error('You have no balance. Please make a deposit to start trading.', {
            description: `Minimum required balance: $${MIN_SELL_BALANCE}.`,
          });
        } else if (msg.includes('INSUFFICIENT_BALANCE')) {
          toast.error('Insufficient balance. Please add funds by making a deposit.');
        } else {
          toast.error(msg || 'Failed to submit sell order');
        }
        return;
      }
      toast.success('Sell order submitted!', {
        description: `${pendingSell.amount} USDT sold to ${pendingSell.order.seller_name}`,
      });
      setShowSellConfirmModal(false);
      setPendingSell(null);
      setSellAmount('');
      await refetchBalance();
    } finally {
      setSellSubmitting(false);
    }
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
    if (pendingOrder) {
      clearSession();
      proceedWithOrder(pendingOrder.order, pendingOrder.amount, pendingOrder.usdt);
    }
    setShowConflictModal(false);
  };

  if (loading) {
    return <P2POrdersSkeleton />;
  }

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

      {tab === 'sell' && user && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Available:</span>
          <span className="text-sm font-semibold">{balance.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT</span>
        </div>
      )}

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
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-9 w-9">
              {order.seller_avatar_url ? (
                <AvatarImage src={order.seller_avatar_url} alt={order.seller_name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {order.seller_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{order.seller_name}</span>
                <Badge variant="outline" className="text-[10px] border-success/30 text-success bg-success/10">
                  <ShieldCheck className="w-3 h-3 mr-0.5" />
                  Verified
                </Badge>
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
          </div>

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
                      if (errorOrderId === order.id) {
                        setErrorOrderId(null);
                        setErrorMessage('');
                      }
                    }}
                    onFocus={() => setSelectedOrder(order)}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedOrder(order);
                    handleBuyNow(order);
                  }}
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
                      if (errorOrderId === order.id) {
                        setErrorOrderId(null);
                        setErrorMessage('');
                      }
                    }}
                    onFocus={() => setSelectedOrder(order)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">USDT</span>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setSelectedOrder(order);
                    handleSellNow(order);
                  }}
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
                  {pendingOrder.order.seller_avatar_url ? (
                    <AvatarImage src={pendingOrder.order.seller_avatar_url} />
                  ) : null}
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You pay</span>
                  <span className="font-semibold">${pendingOrder.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You receive</span>
                  <span className="font-semibold text-primary">{pendingOrder.usdt.toLocaleString()} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment window</span>
                  <span className="font-semibold">{pendingOrder.order.payment_window_minutes} min</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-success/20 bg-success/5 p-3">
                <Lock className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-success">Funds Secured in Escrow</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    Your funds are held securely in escrow throughout the transaction. They will only be released once payment is confirmed by the seller.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                By confirming, you agree to complete payment within the {pendingOrder.order.payment_window_minutes}-minute window.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleConfirmTrade}>Confirm Trade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Confirmation Modal */}
      <Dialog open={showSellConfirmModal} onOpenChange={(o) => !sellSubmitting && setShowSellConfirmModal(o)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Confirm Sell Order</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review your sell order before proceeding.
            </DialogDescription>
          </DialogHeader>
          {pendingSell && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  {pendingSell.order.seller_avatar_url ? (
                    <AvatarImage src={pendingSell.order.seller_avatar_url} />
                  ) : null}
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You sell</span>
                  <span className="font-semibold">{pendingSell.amount.toLocaleString()} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wallet balance</span>
                  <span className="font-semibold">{balance.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment window</span>
                  <span className="font-semibold">{pendingSell.order.payment_window_minutes} min</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                By confirming, the USDT will be deducted from your wallet and sent to the buyer.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" disabled={sellSubmitting} onClick={() => setShowSellConfirmModal(false)}>Cancel</Button>
            <Button size="sm" disabled={sellSubmitting} onClick={handleConfirmSell}>
              {sellSubmitting ? 'Submitting...' : 'Confirm Sell'}
            </Button>
          </DialogFooter>
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
