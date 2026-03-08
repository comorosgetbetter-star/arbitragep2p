import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2, CheckCircle2, Coins, Plus, Trash2, Wallet, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CryptoSetting {
  id: string;
  symbol: string;
  name: string;
  is_enabled: boolean;
  deposit_address: string;
  network: string;
}

interface UsdtAddress {
  id: string;
  address: string;
  network: string;
  address_type: string;
  display_order: number;
  is_active: boolean;
}

const CRYPTO_LOGOS: Record<string, string> = {
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
};

const CRYPTO_COLORS: Record<string, string> = {
  USDT: 'border-emerald-500/30 bg-emerald-500/5',
  BTC: 'border-amber-500/30 bg-amber-500/5',
  ETH: 'border-blue-500/30 bg-blue-500/5',
  BNB: 'border-yellow-500/30 bg-yellow-500/5',
  SOL: 'border-purple-500/30 bg-purple-500/5',
  XRP: 'border-gray-400/30 bg-gray-400/5',
};

const NETWORK_OPTIONS: Record<string, string[]> = {
  USDT: ['trc20', 'erc20', 'bep20'],
  BTC: ['btc'],
  ETH: ['erc20'],
  BNB: ['bep20'],
  SOL: ['sol'],
  XRP: ['xrp'],
};

export const AdminCryptoManager = () => {
  const [cryptos, setCryptos] = useState<CryptoSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, { address: string; network: string }>>({});

  // USDT address management state
  const [usdtAddresses, setUsdtAddresses] = useState<UsdtAddress[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [newNetwork, setNewNetwork] = useState('trc20');
  const [newType, setNewType] = useState<'deposit' | 'trade'>('deposit');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchUsdtAddresses();
    const channel = supabase
      .channel('admin-addresses-crypto')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usdt_addresses' }, () => fetchUsdtAddresses())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('deposit_crypto_settings')
      .select('*')
      .order('created_at');
    if (data) {
      setCryptos(data as CryptoSetting[]);
      const edits: Record<string, { address: string; network: string }> = {};
      data.forEach((c: any) => {
        edits[c.symbol] = { address: c.deposit_address || '', network: c.network || '' };
      });
      setEditState(edits);
    }
    setLoading(false);
  };

  const fetchUsdtAddresses = async () => {
    const { data } = await supabase
      .from('usdt_addresses')
      .select('*')
      .order('address_type')
      .order('display_order');
    if (data) setUsdtAddresses(data);
  };

  const handleToggle = async (crypto: CryptoSetting) => {
    if (crypto.symbol === 'USDT') {
      toast.error('USDT cannot be disabled');
      return;
    }
    const newEnabled = !crypto.is_enabled;
    if (newEnabled && !editState[crypto.symbol]?.address?.trim()) {
      toast.error(`Please add a ${crypto.symbol} deposit address first`);
      return;
    }
    const { error } = await supabase
      .from('deposit_crypto_settings')
      .update({ is_enabled: newEnabled })
      .eq('id', crypto.id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success(`${crypto.symbol} deposits ${newEnabled ? 'enabled' : 'disabled'}`);
    fetchSettings();
  };

  const handleSave = async (crypto: CryptoSetting) => {
    const edit = editState[crypto.symbol];
    if (!edit?.address?.trim()) { toast.error('Enter a deposit address'); return; }
    setSaving(crypto.symbol);
    const { error } = await supabase
      .from('deposit_crypto_settings')
      .update({
        deposit_address: edit.address.trim(),
        network: edit.network || NETWORK_OPTIONS[crypto.symbol]?.[0] || '',
      })
      .eq('id', crypto.id);
    if (error) { toast.error('Failed to save'); }
    else { toast.success(`${crypto.symbol} address saved`); fetchSettings(); }
    setSaving(null);
  };

  const updateEdit = (symbol: string, field: 'address' | 'network', value: string) => {
    setEditState(prev => ({ ...prev, [symbol]: { ...prev[symbol], [field]: value } }));
  };

  // USDT address handlers
  const handleAddUsdtAddress = async () => {
    if (!newAddress.trim()) { toast.error('Enter an address'); return; }
    setIsAdding(true);
    try {
      const maxOrder = usdtAddresses.filter(a => a.address_type === newType).length;
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

  const handleDeleteUsdtAddress = async (id: string) => {
    try {
      const { error } = await supabase.from('usdt_addresses').delete().eq('id', id);
      if (error) throw error;
      toast.success('Address removed');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const depositAddresses = usdtAddresses.filter(a => a.address_type === 'deposit');
  const tradeAddresses = usdtAddresses.filter(a => a.address_type === 'trade');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Deposit Crypto Toggle */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <p className="font-semibold text-sm">Deposit Cryptocurrencies</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Toggle cryptos on/off for deposits. Non-USDT coins need a wallet address before enabling.
        </p>

        {cryptos.map((crypto) => {
          const edit = editState[crypto.symbol] || { address: '', network: '' };
          const colorClass = CRYPTO_COLORS[crypto.symbol] || '';
          const isUsdt = crypto.symbol === 'USDT';
          const hasChanged = edit.address !== (crypto.deposit_address || '') || edit.network !== (crypto.network || '');

          return (
            <Card key={crypto.id} className={`border ${colorClass} transition-all`}>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={CRYPTO_LOGOS[crypto.symbol]} alt={crypto.symbol} className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">{crypto.symbol}</span>
                        <span className="text-xs text-muted-foreground">{crypto.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {crypto.is_enabled ? (
                          <Badge className="bg-success/20 text-success text-[9px] px-1.5 py-0">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Inactive</Badge>
                        )}
                        {isUsdt && (
                          <Badge className="bg-primary/20 text-primary text-[9px] px-1.5 py-0">Default</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Switch checked={crypto.is_enabled} onCheckedChange={() => handleToggle(crypto)} disabled={isUsdt} />
                </div>

                {/* Non-USDT: inline address editor */}
                {!isUsdt && (
                  <div className="space-y-2 pt-1 border-t border-border/30">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Deposit Address</Label>
                      <Input
                        placeholder={`Enter ${crypto.symbol} wallet address...`}
                        value={edit.address}
                        onChange={(e) => updateEdit(crypto.symbol, 'address', e.target.value)}
                        className="text-xs font-mono h-9 mt-1"
                      />
                    </div>
                    {NETWORK_OPTIONS[crypto.symbol]?.length > 1 && (
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Network</Label>
                        <select
                          value={edit.network || NETWORK_OPTIONS[crypto.symbol][0]}
                          onChange={(e) => updateEdit(crypto.symbol, 'network', e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs mt-1"
                        >
                          {NETWORK_OPTIONS[crypto.symbol].map((net) => (
                            <option key={net} value={net}>{net.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs"
                      disabled={!edit.address.trim() || saving === crypto.symbol || !hasChanged}
                      onClick={() => handleSave(crypto)}
                    >
                      {saving === crypto.symbol ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                      Save Address
                    </Button>
                  </div>
                )}

                {/* USDT: show managed addresses inline */}
                {isUsdt && (
                  <div className="space-y-2 pt-1 border-t border-border/30">
                    <p className="text-[10px] text-muted-foreground">
                      USDT uses round-robin rotation for deposit &amp; trade addresses. Manage them below.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section 2: USDT Address Management */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-gold" />
          <p className="font-semibold text-sm">USDT Addresses</p>
        </div>

        {/* Add New Address */}
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-3 space-y-3">
            <p className="font-medium text-sm">Add New USDT Address</p>
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
              className="w-full h-8 bg-gold hover:bg-gold/90 text-gold-foreground text-xs"
              disabled={isAdding || !newAddress.trim()}
              onClick={handleAddUsdtAddress}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Address
            </Button>
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
                    <Button variant="destructive" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDeleteUsdtAddress(addr.id)}>
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
                    <Button variant="destructive" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDeleteUsdtAddress(addr.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
