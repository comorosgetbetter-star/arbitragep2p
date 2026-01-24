import { useState } from 'react';
import { ArrowUpRight, History, Shield, Copy, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WalletDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const networks = [
  { id: 'trc20', name: 'TRC20', chain: 'Tron' },
  { id: 'erc20', name: 'ERC20', chain: 'Ethereum' },
  { id: 'bep20', name: 'BEP20', chain: 'BSC' },
];

const transactions = [
  { id: 1, type: 'buy', amount: 500, date: '2024-01-15', status: 'completed' },
  { id: 2, type: 'withdraw', amount: 250, date: '2024-01-14', status: 'completed' },
  { id: 3, type: 'buy', amount: 1000, date: '2024-01-12', status: 'completed' },
];

export const WalletDropdown = ({ isOpen, onClose }: WalletDropdownProps) => {
  const [view, setView] = useState<'main' | 'withdraw'>('main');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('trc20');
  const [copied, setCopied] = useState(false);

  const balance = 2547.50;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card rounded-xl border border-border/50 shadow-xl z-50 animate-scale-in overflow-hidden">
        {view === 'main' ? (
          <>
            {/* Balance Section */}
            <div className="p-5 border-b border-border/30">
              <p className="text-sm text-muted-foreground mb-1">USDT Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-foreground">
                  {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground">USDT</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 border-b border-border/30">
              <Button 
                variant="glow" 
                className="w-full"
                onClick={() => setView('withdraw')}
              >
                <ArrowUpRight className="h-4 w-4" />
                Withdraw USDT
              </Button>
            </div>

            {/* Transaction History */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Recent Transactions
                </span>
              </div>
              
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${tx.type === 'buy' ? 'text-success' : 'text-foreground'}`}>
                        {tx.type === 'buy' ? '+' : '-'}{tx.amount} USDT
                      </p>
                      <p className="text-xs text-success capitalize">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Withdraw View */}
            <div className="p-5 border-b border-border/30">
              <button 
                onClick={() => setView('main')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back
              </button>
              <h3 className="text-lg font-display font-semibold">Withdraw USDT</h3>
              <p className="text-sm text-muted-foreground">
                Available: {balance.toLocaleString()} USDT
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Amount */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="pr-16"
                  />
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-medium hover:text-primary/80"
                    onClick={() => setWithdrawAmount(balance.toString())}
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Wallet Address</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter your wallet address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Network Selection */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {networks.map((network) => (
                    <button
                      key={network.id}
                      onClick={() => setSelectedNetwork(network.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedNetwork === network.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-border/80 text-muted-foreground'
                      }`}
                    >
                      <p className="text-sm font-medium">{network.name}</p>
                      <p className="text-xs opacity-70">{network.chain}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <Shield className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning">
                  Always verify the wallet address and network before confirming. 
                  Transactions cannot be reversed.
                </p>
              </div>

              {/* Confirm Button */}
              <Button 
                variant="glow" 
                className="w-full"
                disabled={!withdrawAmount || !walletAddress}
              >
                Confirm Withdrawal
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};
