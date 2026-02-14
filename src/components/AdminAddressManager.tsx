import { useState, useEffect } from 'react';
import { Plus, Trash2, Wallet, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UsdtAddress {
  id: string;
  address: string;
  network: string;
  address_type: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const NETWORK_LABELS: Record<string, string> = {
  trc20: 'TRC20 (Tron)',
  erc20: 'ERC20 (Ethereum)',
  bep20: 'BEP20 (BSC)',
};

export const AdminAddressManager = () => {
  const [addresses, setAddresses] = useState<UsdtAddress[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [newNetwork, setNewNetwork] = useState('trc20');
  const [newType, setNewType] = useState<'deposit' | 'trade'>('deposit');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchAddresses();
    const channel = supabase
      .channel('admin-addresses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usdt_addresses' }, () => fetchAddresses())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAddresses = async () => {
    const { data } = await supabase
      .from('usdt_addresses')
      .select('*')
      .order('address_type')
      .order('display_order');
    if (data) setAddresses(data);
  };

  const handleAdd = async () => {
    if (!newAddress.trim()) { toast.error('Enter an address'); return; }
    setIsAdding(true);
    try {
      const maxOrder = addresses.filter(a => a.address_type === newType).length;
      const { error } = await supabase.from('usdt_addresses').insert({
        address: newAddress.trim(),
        network: newNetwork,
        address_type: newType,
        display_order: maxOrder,
      });
      if (error) throw error;
      toast.success('Address added');
      setNewAddress('');
    } catch {
      toast.error('Failed to add address');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('usdt_addresses').delete().eq('id', id);
      if (error) throw error;
      toast.success('Address removed');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const depositAddresses = addresses.filter(a => a.address_type === 'deposit');
  const tradeAddresses = addresses.filter(a => a.address_type === 'trade');

  return (
    <div className="space-y-4">
      {/* Add New Address */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-3 space-y-3">
          <p className="font-medium text-sm">Add New Address</p>
          <div className="space-y-2">
            <Input
              placeholder="USDT wallet address..."
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="text-sm font-mono"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Network</Label>
                <Select value={newNetwork} onValueChange={setNewNetwork}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trc20">TRC20</SelectItem>
                    <SelectItem value="erc20">ERC20</SelectItem>
                    <SelectItem value="bep20">BEP20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as 'deposit' | 'trade')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Add Funds</SelectItem>
                    <SelectItem value="trade">Trade/Offer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              size="sm"
              className="w-full h-8 bg-primary hover:bg-primary/90 text-xs"
              disabled={isAdding || !newAddress.trim()}
              onClick={handleAdd}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Address
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Addresses */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-4 h-4 text-primary" />
          <p className="font-medium text-sm">Add Funds Addresses</p>
          <Badge className="bg-primary/20 text-primary text-[10px]">{depositAddresses.length}</Badge>
        </div>
        {depositAddresses.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No deposit addresses added</p>
        ) : (
          <div className="space-y-1.5">
            {depositAddresses.map((addr) => (
              <Card key={addr.id} className="border-border/50 bg-card/80">
                <CardContent className="p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono truncate">{addr.address}</p>
                    <Badge variant="secondary" className="text-[9px] mt-0.5">{addr.network.toUpperCase()}</Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleDelete(addr.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Trade Addresses */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpRight className="w-4 h-4 text-warning" />
          <p className="font-medium text-sm">Trade/Offer Addresses</p>
          <Badge className="bg-warning/20 text-warning text-[10px]">{tradeAddresses.length}</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">These rotate in order on the payment page</p>
        {tradeAddresses.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No trade addresses added</p>
        ) : (
          <div className="space-y-1.5">
            {tradeAddresses.map((addr, idx) => (
              <Card key={addr.id} className="border-border/50 bg-card/80">
                <CardContent className="p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-warning">#{idx + 1}</span>
                      <p className="text-xs font-mono truncate">{addr.address}</p>
                    </div>
                    <Badge variant="secondary" className="text-[9px] mt-0.5">{addr.network.toUpperCase()}</Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleDelete(addr.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
