import { useState, useEffect } from 'react';
import { Copy, Check, X, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NETWORK_META: Record<string, { name: string; chain: string; fee: string; time: string }> = {
  trc20: { name: 'TRC20', chain: 'Tron Network', fee: '~1 USDT', time: '~3 min' },
  erc20: { name: 'ERC20', chain: 'Ethereum', fee: '~5-20 USDT', time: '~5 min' },
  bep20: { name: 'BEP20', chain: 'BNB Smart Chain', fee: '~0.5 USDT', time: '~3 min' },
};

export const AddFundsModal = ({ isOpen, onClose }: AddFundsModalProps) => {
  const [usdtSetting, setUsdtSetting] = useState<{ deposit_address: string; network: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    supabase
      .from('deposit_crypto_settings')
      .select('deposit_address, network')
      .eq('symbol', 'USDT')
      .eq('is_enabled', true)
      .single()
      .then(({ data }) => {
        setUsdtSetting(data as any);
        setLoading(false);
      });
  }, [isOpen]);

  const handleCopy = () => {
    if (usdtSetting?.deposit_address) {
      navigator.clipboard.writeText(usdtSetting.deposit_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setUsdtSetting(null);
    onClose();
  };

  if (!isOpen) return null;

  const address = usdtSetting?.deposit_address || '';
  const network = usdtSetting?.network || 'trc20';
  const meta = NETWORK_META[network] || { name: network.toUpperCase(), chain: network, fee: 'Variable', time: '~5 min' };

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={handleClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4">
        <div className="glass-card rounded-2xl border border-border/50 shadow-xl animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Add Funds</h3>
                <p className="text-xs text-muted-foreground">Deposit USDT to your wallet</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading deposit address...</p>
              </div>
            ) : !address ? (
              <p className="text-sm text-muted-foreground text-center py-6">No deposit addresses available. Please contact support.</p>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-primary">₮</span>
                  </div>
                  <p className="font-display font-semibold text-foreground">USDT ({meta.name})</p>
                  <p className="text-sm text-muted-foreground">{meta.chain}</p>
                </div>
                <div className="glass-card rounded-xl p-4 mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Deposit Address</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono text-foreground break-all">{address}</code>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Network</span><span className="text-foreground">{meta.chain}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Minimum Deposit</span><span className="text-foreground">1 USDT</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Network Fee</span><span className="text-foreground">{meta.fee}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Arrival Time</span><span className="text-foreground">{meta.time}</span></div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xs text-warning">⚠️ Only send USDT on the {meta.chain}. Sending other tokens or using a different network may result in permanent loss of funds.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
