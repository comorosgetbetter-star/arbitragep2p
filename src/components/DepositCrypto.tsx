import { useState, useEffect } from 'react';
import { Copy, Check, Loader2, Wallet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NETWORK_META: Record<string, { name: string; chain: string; fee: string; time: string; color: string }> = {
  trc20: { name: 'TRC20', chain: 'Tron Network', fee: '~1 USDT', time: '~3 min', color: 'text-destructive' },
  erc20: { name: 'ERC20', chain: 'Ethereum', fee: '~5-20 USDT', time: '~5 min', color: 'text-primary' },
  bep20: { name: 'BEP20', chain: 'BNB Smart Chain', fee: '~0.5 USDT', time: '~3 min', color: 'text-warning' },
};

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

export const DepositCrypto = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedAddr, setSelectedAddr] = useState<{ id: string; address: string; network: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getRotatedDepositAddress().then((addr) => {
      setSelectedAddr(addr);
      setLoading(false);
    });
  }, [user]);

  const handleCopy = () => {
    if (selectedAddr) {
      navigator.clipboard.writeText(selectedAddr.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Wallet className="h-7 w-7 text-primary" />
        </div>
        <p className="font-semibold mb-2">Login to Deposit</p>
        <p className="text-sm text-muted-foreground mb-4">Sign in to access your deposit address and fund your wallet.</p>
        <Button onClick={() => navigate('/login')}>Sign In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading deposit address...</p>
      </div>
    );
  }

  if (!selectedAddr) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No deposit addresses available. Please contact support.</p>
      </div>
    );
  }

  const meta = NETWORK_META[selectedAddr.network] || {
    name: selectedAddr.network.toUpperCase(),
    chain: selectedAddr.network,
    fee: 'Variable',
    time: '~5 min',
    color: 'text-primary',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-bold text-primary">₮</span>
        </div>
        <p className="font-display font-semibold">Deposit USDT</p>
        <p className="text-sm text-muted-foreground">{meta.chain}</p>
      </div>

      {/* Network badge */}
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs border-primary/30">
          Network: {meta.name}
        </Badge>
      </div>

      {/* Address card */}
      <div className="rounded-xl bg-card border border-border p-4">
        <p className="text-xs text-muted-foreground mb-2">Deposit Address</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm font-mono text-foreground break-all leading-relaxed">
            {selectedAddr.address}
          </code>
          <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Network</span>
          <span className="font-medium">{meta.chain}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Minimum Deposit</span>
          <span className="font-medium">1 USDT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Network Fee</span>
          <span className="font-medium">{meta.fee}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Arrival Time</span>
          <span className="font-medium">{meta.time}</span>
        </div>
      </div>

      {/* Warning */}
      <div className="rounded-xl bg-warning/10 border border-warning/20 p-3 flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-warning leading-relaxed">
          Only send USDT on the {meta.chain}. Sending other tokens or using a different network may result in permanent loss of funds.
        </p>
      </div>
    </div>
  );
};
