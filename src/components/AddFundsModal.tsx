import { useState, useEffect } from 'react';
import { Copy, Check, X, Wallet, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DepositAddress {
  id: string;
  address: string;
  network: string;
}

const NETWORK_META: Record<string, { name: string; chain: string; fee: string; time: string }> = {
  trc20: { name: 'TRC20', chain: 'Tron Network', fee: '~1 USDT', time: '~3 min' },
  erc20: { name: 'ERC20', chain: 'Ethereum', fee: '~5-20 USDT', time: '~5 min' },
  bep20: { name: 'BEP20', chain: 'BNB Smart Chain', fee: '~0.5 USDT', time: '~3 min' },
};

export const AddFundsModal = ({ isOpen, onClose }: AddFundsModalProps) => {
  const [step, setStep] = useState<'select' | 'deposit'>('select');
  const [selectedAddr, setSelectedAddr] = useState<DepositAddress | null>(null);
  const [copied, setCopied] = useState(false);
  const [addresses, setAddresses] = useState<DepositAddress[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('usdt_addresses')
        .select('id, address, network')
        .eq('address_type', 'deposit')
        .eq('is_active', true)
        .order('display_order');
      if (data) setAddresses(data);
    };
    fetch();
  }, [isOpen]);

  const handleSelect = (addr: DepositAddress) => {
    setSelectedAddr(addr);
    setStep('deposit');
  };

  const handleCopy = () => {
    if (selectedAddr) {
      navigator.clipboard.writeText(selectedAddr.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedAddr(null);
    onClose();
  };

  if (!isOpen) return null;

  const meta = selectedAddr ? NETWORK_META[selectedAddr.network] || { name: selectedAddr.network.toUpperCase(), chain: selectedAddr.network, fee: 'Variable', time: '~5 min' } : null;

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

          {step === 'select' ? (
            <div className="p-5">
              <p className="text-sm text-muted-foreground mb-4">Select a network to receive your USDT deposit:</p>
              {addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No deposit addresses available</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => {
                    const m = NETWORK_META[addr.network] || { name: addr.network.toUpperCase(), chain: addr.network, fee: 'Variable', time: '~5 min' };
                    return (
                      <button
                        key={addr.id}
                        onClick={() => handleSelect(addr)}
                        className="w-full glass-card rounded-xl p-4 flex items-center justify-between transition-all duration-300 hover:border-primary/40 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">₮</span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">USDT ({m.name})</p>
                            <p className="text-xs text-muted-foreground">{m.chain}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-xs text-muted-foreground">
                            <p>Fee: {m.fee}</p>
                            <p>{m.time}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-5">
              <button onClick={() => setStep('select')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to networks
              </button>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary">₮</span>
                </div>
                <p className="font-display font-semibold text-foreground">USDT ({meta?.name})</p>
                <p className="text-sm text-muted-foreground">{meta?.chain}</p>
              </div>
              <div className="glass-card rounded-xl p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-2">Deposit Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-foreground break-all">{selectedAddr?.address}</code>
                  <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Network</span><span className="text-foreground">{meta?.chain}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Minimum Deposit</span><span className="text-foreground">1 USDT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Network Fee</span><span className="text-foreground">{meta?.fee}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Arrival Time</span><span className="text-foreground">{meta?.time}</span></div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-xs text-warning">⚠️ Only send USDT on the {meta?.chain}. Sending other tokens or using a different network may result in permanent loss of funds.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
