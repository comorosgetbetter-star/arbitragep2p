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
import { Copy, Clock, ShieldCheck, User } from 'lucide-react';
import type { TradeSession } from '@/hooks/useTradeSession';

interface P2POrder {
  id: string;
  seller_name: string;
  seller_avatar_url: string | null;
  min_amount: number;
  max_amount: number;
  payment_method: string;
  payment_address: string;
  payment_window_minutes: number;
  is_active: boolean;
  created_at: string;
}

export const P2POrders = () => {
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<P2POrder | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [existingSession, setExistingSession] = useState<TradeSession | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startSession, clearSession, getStoredSession } = useTradeSession();

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('p2p_orders')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleBuyNow = (order: P2POrder) => {
    const amount = parseFloat(buyAmount);
    if (!amount || amount < order.min_amount || amount > order.max_amount) {
      toast.error(`Enter an amount between $${order.min_amount} and $${order.max_amount}`);
      return;
    }

    if (!user) {
      localStorage.setItem('pendingTrade', JSON.stringify({
        usd: amount,
        usdt: amount, // 1:1 for P2P orders
        isCustom: false,
        p2pOrderId: order.id,
        p2pPaymentAddress: order.payment_address,
        p2pPaymentWindowMinutes: order.payment_window_minutes,
      }));
      navigate('/login');
      return;
    }

    const existing = getStoredSession();
    if (existing?.userId && existing.userId !== user.id) {
      clearSession();
    }

    if (existing && existing.userId === user.id) {
      setExistingSession(existing);
      setShowConflictModal(true);
      return;
    }

    proceedWithOrder(order, amount);
  };

  const proceedWithOrder = (order: P2POrder, amount: number) => {
    // Store the P2P order payment details for the payment page
    localStorage.setItem('p2pOrderPayment', JSON.stringify({
      paymentAddress: order.payment_address,
      paymentWindowMinutes: order.payment_window_minutes,
      sellerName: order.seller_name,
    }));

    startSession(amount, amount, false, user!.id, order.payment_window_minutes);
    toast.success('Trade started!', {
      description: `$${amount} USDT purchase`,
    });
    navigate('/payment');
  };

  const handleResumeExisting = () => {
    setShowConflictModal(false);
    navigate('/payment');
  };

  const handleStartNew = () => {
    if (selectedOrder && buyAmount) {
      clearSession();
      proceedWithOrder(selectedOrder, parseFloat(buyAmount));
    }
    setShowConflictModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
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
          {/* Seller Info Row */}
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
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <Clock className="w-3 h-3" />
                {order.payment_window_minutes} min window
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount Range</p>
              <p className="font-display font-bold text-sm">
                ${order.min_amount.toLocaleString()} – ${order.max_amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment</p>
              <p className="font-display font-bold text-sm text-primary">{order.payment_method}</p>
            </div>
          </div>

          {/* Buy Section */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                placeholder={`${order.min_amount} – ${order.max_amount}`}
                className="w-full h-10 pl-7 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                min={order.min_amount}
                max={order.max_amount}
                onChange={(e) => {
                  setBuyAmount(e.target.value);
                  setSelectedOrder(order);
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
        </div>
      ))}

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
