import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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
  is_active: boolean;
  created_at: string;
}

export const AdminP2POrderManager = () => {
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    seller_name: '',
    seller_avatar_url: '',
    min_amount: '',
    max_amount: '',
    payment_address: '',
    payment_window_minutes: '10',
  });

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('p2p_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreate = async () => {
    if (!form.seller_name || !form.min_amount || !form.max_amount || !form.payment_address) {
      toast.error('Please fill all required fields');
      return;
    }

    const minAmt = parseFloat(form.min_amount);
    const maxAmt = parseFloat(form.max_amount);
    const windowMins = parseInt(form.payment_window_minutes) || 10;

    if (isNaN(minAmt) || isNaN(maxAmt) || minAmt <= 0 || maxAmt <= 0 || minAmt >= maxAmt) {
      toast.error('Invalid amount range');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('p2p_orders').insert({
        seller_name: form.seller_name.trim(),
        seller_avatar_url: form.seller_avatar_url.trim() || null,
        min_amount: minAmt,
        max_amount: maxAmt,
        payment_method: 'USDT',
        payment_address: form.payment_address.trim(),
        payment_window_minutes: windowMins,
      });

      if (error) throw error;

      toast.success('P2P order created');
      setIsCreateOpen(false);
      setForm({
        seller_name: '',
        seller_avatar_url: '',
        min_amount: '',
        max_amount: '',
        payment_address: '',
        payment_window_minutes: '10',
      });
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (order: P2POrder) => {
    const { error } = await supabase
      .from('p2p_orders')
      .update({ is_active: !order.is_active })
      .eq('id', order.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(order.is_active ? 'Order deactivated' : 'Order activated');
      fetchOrders();
    }
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase.from('p2p_orders').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Order deleted');
      fetchOrders();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">P2P Orders</h3>
        <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1">
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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
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
                    className={`text-[10px] ${order.is_active ? 'border-success/30 text-success' : 'border-destructive/30 text-destructive'}`}
                  >
                    {order.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleActive(order)}
                  >
                    {order.is_active ? (
                      <ToggleRight className="w-4 h-4 text-success" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteOrder(order.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Range:</span>
                  <p className="font-medium">${order.min_amount}–${order.max_amount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Window:</span>
                  <p className="font-medium">{order.payment_window_minutes} min</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium truncate">{order.payment_address.slice(0, 10)}...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Create Order Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Create P2P Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Seller Name *</Label>
              <Input
                placeholder="e.g. CryptoKing"
                value={form.seller_name}
                onChange={(e) => setForm(f => ({ ...f, seller_name: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Seller Avatar URL</Label>
              <Input
                placeholder="https://..."
                value={form.seller_avatar_url}
                onChange={(e) => setForm(f => ({ ...f, seller_avatar_url: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Min Amount ($) *</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={form.min_amount}
                  onChange={(e) => setForm(f => ({ ...f, min_amount: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Amount ($) *</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={form.max_amount}
                  onChange={(e) => setForm(f => ({ ...f, max_amount: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Address (USDT) *</Label>
              <Input
                placeholder="TRC20/ERC20 address"
                value={form.payment_address}
                onChange={(e) => setForm(f => ({ ...f, payment_address: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Window (minutes)</Label>
              <Input
                type="number"
                placeholder="10"
                value={form.payment_window_minutes}
                onChange={(e) => setForm(f => ({ ...f, payment_window_minutes: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
