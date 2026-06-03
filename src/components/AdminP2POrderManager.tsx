import { useState, useEffect } from 'react';
import { adminSupabase } from '@/lib/adminSupabase';
import { toast } from 'sonner';
import { Plus, Trash2, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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

const emptyForm = {
  seller_name: '',
  seller_avatar_url: '',
  min_amount: '',
  max_amount: '',
  payment_address: '',
  payment_window_minutes: '10',
  trades_count: '0',
  avg_trading_time: '5 min',
  likes_count: '0',
  price_rate: '10',
  price_rate_type: 'markup' as 'markup' | 'discount',
  order_type: 'buy' as 'buy' | 'sell',
};

export const AdminP2POrderManager = () => {
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<P2POrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchOrders = async () => {
    const { data } = await adminSupabase
      .from('p2p_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOrders(data as P2POrder[]);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openCreate = () => {
    setEditingOrder(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (order: P2POrder) => {
    setEditingOrder(order);
    setForm({
      seller_name: order.seller_name,
      seller_avatar_url: order.seller_avatar_url || '',
      min_amount: String(order.min_amount),
      max_amount: String(order.max_amount),
      payment_address: order.payment_address,
      payment_window_minutes: String(order.payment_window_minutes),
      trades_count: String(order.trades_count),
      avg_trading_time: order.avg_trading_time,
      likes_count: String(order.likes_count),
      price_rate: String(Math.abs(order.price_rate)),
      price_rate_type: order.price_rate < 0 ? 'discount' : 'markup',
      order_type: order.order_type || 'buy',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.seller_name || !form.min_amount || !form.max_amount || !form.payment_address) {
      toast.error('Please fill all required fields');
      return;
    }

    const minAmt = parseFloat(form.min_amount);
    const maxAmt = parseFloat(form.max_amount);
    if (isNaN(minAmt) || isNaN(maxAmt) || minAmt <= 0 || maxAmt <= 0 || minAmt >= maxAmt) {
      toast.error('Invalid amount range');
      return;
    }

    const payload = {
      seller_name: form.seller_name.trim(),
      seller_avatar_url: form.seller_avatar_url.trim() || null,
      min_amount: minAmt,
      max_amount: maxAmt,
      payment_method: 'USDT',
      payment_address: form.payment_address.trim(),
      payment_window_minutes: parseInt(form.payment_window_minutes) || 10,
      trades_count: parseInt(form.trades_count) || 0,
      avg_trading_time: form.avg_trading_time.trim() || '5 min',
      likes_count: parseInt(form.likes_count) || 0,
      price_rate: (form.price_rate_type === 'discount' ? -1 : 1) * (parseFloat(form.price_rate) || 10),
      order_type: form.order_type,
    };

    setIsSubmitting(true);
    try {
      if (editingOrder) {
        const { error } = await adminSupabase
          .from('p2p_orders')
          .update(payload)
          .eq('id', editingOrder.id);
        if (error) throw error;
        toast.success('Order updated');
      } else {
        const { error } = await adminSupabase.from('p2p_orders').insert(payload);
        if (error) throw error;
        toast.success('Order created');
      }
      setIsDialogOpen(false);
      setEditingOrder(null);
      setForm(emptyForm);
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error(editingOrder ? 'Failed to update' : 'Failed to create');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (order: P2POrder) => {
    const { error } = await adminSupabase
      .from('p2p_orders')
      .update({ is_active: !order.is_active })
      .eq('id', order.id);
    if (error) toast.error('Failed to update');
    else {
      toast.success(order.is_active ? 'Order deactivated' : 'Order activated');
      fetchOrders();
    }
  };

  const deleteOrder = async (id: string) => {
    const { error } = await adminSupabase.from('p2p_orders').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Order deleted');
      fetchOrders();
    }
  };

  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h3 className="text-sm font-semibold">P2P Orders</h3>
        <Button size="sm" onClick={openCreate} className="gap-1 shrink-0">
          <Plus className="w-3.5 h-3.5" />
          New Order
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No P2P orders yet
          </CardContent>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="border-border/50 bg-card/80">
            <CardContent className="p-3 space-y-2">
              <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar className="h-7 w-7">
                    {order.seller_avatar_url ? (
                      <AvatarImage src={order.seller_avatar_url} />
                    ) : null}
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {order.seller_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{order.seller_name}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${order.order_type === 'sell' ? 'border-blue-400/40 text-blue-400' : 'border-primary/40 text-primary'}`}
                  >
                    {order.order_type === 'sell' ? 'SELL ad' : 'BUY ad'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${order.is_active ? 'border-success/30 text-success' : 'border-destructive/30 text-destructive'}`}
                  >
                    {order.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 min-[420px]:flex min-[420px]:items-center gap-1 w-full min-[420px]:w-auto">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(order)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(order)}>
                    {order.is_active ? (
                      <ToggleRight className="w-4 h-4 text-success" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteOrder(order.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-2 text-[11px] min-w-0">
                <div className="min-w-0">
                  <span className="text-muted-foreground">Range:</span>
                  <p className="font-medium">${order.min_amount}–${order.max_amount}</p>
                </div>
              <div className="min-w-0">
                  <span className="text-muted-foreground">Rate:</span>
                  <p className={`font-medium ${order.price_rate >= 0 ? 'text-success' : 'text-destructive'}`}>{order.price_rate >= 0 ? '+' : ''}{order.price_rate}%</p>
                </div>
                <div className="min-w-0 col-span-2 min-[420px]:col-span-1">
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium truncate">{order.payment_address.slice(0, 10)}...</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] min-w-0">
                <div className="min-w-0">
                  <span className="text-muted-foreground">Trades:</span>
                  <p className="font-medium">{order.trades_count}</p>
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground">Avg Time:</span>
                  <p className="font-medium">{order.avg_trading_time}</p>
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground">Likes:</span>
                  <p className="font-medium">{order.likes_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingOrder ? 'Edit P2P Order' : 'Create P2P Order'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Ad Type *</Label>
              <div className="flex rounded-md border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setField('order_type', 'buy')}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${form.order_type === 'buy' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                >
                  Buy ad (user buys USDT)
                </button>
                <button
                  type="button"
                  onClick={() => setField('order_type', 'sell')}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${form.order_type === 'sell' ? 'bg-blue-400/20 text-blue-400' : 'bg-muted text-muted-foreground'}`}
                >
                  Sell ad (user sells USDT)
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Seller Name *</Label>
              <Input placeholder="e.g. CryptoKing" value={form.seller_name} onChange={e => setField('seller_name', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Seller Avatar URL</Label>
              <Input placeholder="https://..." value={form.seller_avatar_url} onChange={e => setField('seller_avatar_url', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Min Amount ($) *</Label>
                <Input type="number" placeholder="50" value={form.min_amount} onChange={e => setField('min_amount', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Amount ($) *</Label>
                <Input type="number" placeholder="1000" value={form.max_amount} onChange={e => setField('max_amount', e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Address (USDT) *</Label>
              <Input placeholder="TRC20/ERC20 address" value={form.payment_address} onChange={e => setField('payment_address', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Window (min)</Label>
                <Input type="number" placeholder="10" value={form.payment_window_minutes} onChange={e => setField('payment_window_minutes', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Price Rate (%)</Label>
                <div className="flex gap-1.5">
                  <div className="flex rounded-md border border-border overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => setField('price_rate_type', 'markup')}
                      className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${form.price_rate_type === 'markup' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}
                    >
                      +%
                    </button>
                    <button
                      type="button"
                      onClick={() => setField('price_rate_type', 'discount')}
                      className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${form.price_rate_type === 'discount' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}
                    >
                      -%
                    </button>
                  </div>
                  <Input type="number" inputMode="decimal" min="0" step="0.1" placeholder="10" value={form.price_rate} onChange={e => setField('price_rate', e.target.value)} className="h-9 text-sm" />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {form.price_rate_type === 'markup' ? 'Markup' : 'Discount'}: {form.price_rate || '0'}%
                </p>
              </div>
            </div>

            {/* Authenticity Stats */}
            <div className="border-t border-border/50 pt-3 mt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Authenticity Stats</p>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Trades</Label>
                  <Input type="number" placeholder="0" value={form.trades_count} onChange={e => setField('trades_count', e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Avg Time</Label>
                  <Input placeholder="5 min" value={form.avg_trading_time} onChange={e => setField('avg_trading_time', e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Likes</Label>
                  <Input type="number" placeholder="0" value={form.likes_count} onChange={e => setField('likes_count', e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="w-full min-[420px]:w-auto">Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="w-full min-[420px]:w-auto">
              {isSubmitting ? 'Saving...' : editingOrder ? 'Save Changes' : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
