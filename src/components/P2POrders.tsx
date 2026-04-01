import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Clock, ShieldCheck, ThumbsUp, BarChart3, Timer, Lock } from 'lucide-react';
import type { TradeSession } from '@/hooks/useTradeSession';
import { P2POrdersSkeleton } from '@/components/skeletons/P2POrdersSkeleton';

// Dynamic pricing: each order has its own price_rate (percentage markup/discount)
const getUsdtAmount = (usd: number, priceRate: number): number => {
  const multiplier = 1 + (priceRate / 100);
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
}

export const P2POrders = () => {
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<P2POrder | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorOrderId, setErrorOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingOrder, setPendingOrder] = useState<{ order: P2POrder; amount: number; usdt: number } | null>(null);
  const [existingSession, setExistingSession] = useState<TradeSession | null>(null);
  const { user, loading: authLoading } = useAuth();
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

  const handleBuyNow = (order: P2POrder) => {
    const amount = parseFloat(buyAmount);
    if (!amount || amount < order.min_amount || amount > order.max_amount) {
      setErrorOrderId(order.id);
      setErrorMessage(`Enter amount between $${order.min_amount} – $${order.max_amount}`);
      return;
    }
    setErrorOrderId(null);
    setErrorMessage('');

    const usdt = getUsdtAmount(amount);

    if (authLoading) return;
    if (!user) {
      toast.info('Please sign in to start a trade');
      navigate('/login');
      return;
    }

    setPendingOrder({ order, amount, usdt });
    setShowConfirmModal(true);
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

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-muted-foreground">No ads available</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Check back later for new P2P orders</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {orders.map((order) => (
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
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount Range</p>
              <p className="font-display font-bold text-sm whitespace-nowrap">
                ${order.min_amount.toLocaleString()} – ${order.max_amount.toLocaleString()}
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

          {/* Buy Section */}
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
        </div>
      ))}

      {/* Trade Confirmation Modal */}
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

              {/* Escrow notice */}
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
