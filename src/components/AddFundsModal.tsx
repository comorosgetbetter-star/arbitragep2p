import { useState } from 'react';
import { Copy, Check, X, Wallet, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const networks = [
  { 
    id: 'trc20', 
    name: 'TRC20', 
    chain: 'Tron Network',
    address: 'TXwZ...8fKp',
    fee: '~1 USDT',
    time: '~3 min',
  },
  { 
    id: 'erc20', 
    name: 'ERC20', 
    chain: 'Ethereum',
    address: '0x3F...9a2B',
    fee: '~5-20 USDT',
    time: '~5 min',
  },
  { 
    id: 'bep20', 
    name: 'BEP20', 
    chain: 'BNB Smart Chain',
    address: '0x7C...4d1E',
    fee: '~0.5 USDT',
    time: '~3 min',
  },
];

// Full deposit addresses for each network
const depositAddresses: Record<string, string> = {
  trc20: 'TXwZjD8k9qK2nP5mR7vL3cY6bN4wF8fKp',
  erc20: '0x3F8a2B5c7D9e1F4A6B8C0d2E4f6A8b0C9a2B',
  bep20: '0x7C2d4E6f8A0b2C4d6E8f0A2b4C6d8E0f4d1E',
};

export const AddFundsModal = ({ isOpen, onClose }: AddFundsModalProps) => {
  const [step, setStep] = useState<'select' | 'deposit'>('select');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetwork(networkId);
    setStep('deposit');
  };

  const handleCopy = () => {
    if (selectedNetwork) {
      navigator.clipboard.writeText(depositAddresses[selectedNetwork]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedNetwork(null);
    onClose();
  };

  if (!isOpen) return null;

  const selectedNetworkData = networks.find(n => n.id === selectedNetwork);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4">
        <div className="glass-card rounded-2xl border border-border/50 shadow-xl animate-scale-in overflow-hidden">
          {/* Header */}
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
              <p className="text-sm text-muted-foreground mb-4">
                Select a network to receive your USDT deposit:
              </p>
              
              <div className="space-y-3">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => handleNetworkSelect(network.id)}
                    className="w-full glass-card rounded-xl p-4 flex items-center justify-between transition-all duration-300 hover:border-primary/40 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">₮</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">USDT ({network.name})</p>
                        <p className="text-xs text-muted-foreground">{network.chain}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Fee: {network.fee}</p>
                        <p>{network.time}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-5">
              <button
                onClick={() => setStep('select')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to networks
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary">₮</span>
                </div>
                <p className="font-display font-semibold text-foreground">
                  USDT ({selectedNetworkData?.name})
                </p>
                <p className="text-sm text-muted-foreground">{selectedNetworkData?.chain}</p>
              </div>

              <div className="glass-card rounded-xl p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-2">Deposit Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-foreground break-all">
                    {selectedNetwork && depositAddresses[selectedNetwork]}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="text-foreground">{selectedNetworkData?.chain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Deposit</span>
                  <span className="text-foreground">1 USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="text-foreground">{selectedNetworkData?.fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arrival Time</span>
                  <span className="text-foreground">{selectedNetworkData?.time}</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-xs text-warning">
                  ⚠️ Only send USDT on the {selectedNetworkData?.chain}. Sending other tokens or using a different network may result in permanent loss of funds.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
