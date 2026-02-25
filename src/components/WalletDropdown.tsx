import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, History, Copy, Check, ChevronRight, Plus, Wallet, Clock, XCircle, CheckCircle2, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WalletDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFunds: () => void;
}

const networks = [
  { id: 'trc20', name: 'TRC20', chain: 'Tron' },
  { id: 'erc20', name: 'ERC20', chain: 'Ethereum' },
  { id: 'bep20', name: 'BEP20', chain: 'BSC' },
];

const supportCategories = [
  'Withdrawal Problems',
  'Deposit Issues',
  'Account Access',
  'Other',
];

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  network: string;
}

export const WalletDropdown = ({ isOpen, onClose, onAddFunds }: WalletDropdownProps) => {
  const { user } = useAuth();
  const { balance, withdrawals, deposits } = useUserData();
  const [view, setView] = useState<'main' | 'withdraw' | 'support'>('main');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('trc20');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportCategory, setSupportCategory] = useState('Withdrawal Problems');
  const [hasOpenTicket, setHasOpenTicket] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    // Only fetch ticket status (balance & withdrawals come from context)
    supabase
      .from('support_tickets')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', 'Withdrawal Problems')
      .limit(1)
      .then(({ data }) => {
        setHasOpenTicket(!!(data && data.length > 0));
      });
  }, [isOpen, user]);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitWithdrawal = async () => {
    if (!user || !withdrawAmount || !walletAddress) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('withdrawals').insert({
        user_id: user.id,
        amount,
        wallet_address: walletAddress,
        network: selectedNetwork,
      });

      if (error) throw error;

      toast.success('Withdrawal submitted — processing...');
      setWithdrawAmount('');
      setWalletAddress('');
      setView('main');
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to submit withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!user || !supportMessage.trim()) return;

    setIsSubmittingTicket(true);
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          category: supportCategory,
        })
        .select('id')
        .single();

      if (ticketError) throw ticketError;

      const { error: msgError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          message: supportMessage.trim(),
          is_admin: false,
        });

      if (msgError) throw msgError;

      toast.success('Support ticket submitted successfully');
      setSupportMessage('');
      setHasOpenTicket(true);
      setView('main');
    } catch (error) {
      console.error('Ticket error:', error);
      toast.error('Failed to submit ticket');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed': case 'expired': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-warning animate-pulse" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'failed': return 'Failed';
      case 'expired': return 'Expired';
      default: return 'Processing';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card rounded-xl border border-border/50 shadow-xl z-50 animate-scale-in overflow-hidden">
        {view === 'main' ? (
          <>
            {/* Balance Section */}
            <div className="p-5 border-b border-border/30">
              <p className="text-sm text-muted-foreground mb-1">USDT Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-foreground">
                  {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground">USDT</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 grid grid-cols-2 gap-3 border-b border-border/30">
              <Button 
                variant="glow" 
                className="w-full"
                onClick={() => { onClose(); onAddFunds(); }}
              >
                <Plus className="h-4 w-4" />
                Add Funds
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setView('withdraw')}
                disabled={balance === 0}
              >
                <ArrowUpRight className="h-4 w-4" />
                Withdraw
              </Button>
            </div>

            {/* Recent Activity */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Recent Activity
                </span>
              </div>
              
              {(() => {
                // Merge deposits and withdrawals into a single sorted list
                const activities = [
                  ...deposits.map(d => ({
                    id: d.id,
                    type: 'deposit' as const,
                    amount: d.amount,
                    status: 'approved',
                    created_at: d.created_at,
                    network: '',
                    reason: d.reason,
                  })),
                  ...withdrawals.map(w => ({
                    id: w.id,
                    type: 'withdrawal' as const,
                    amount: w.amount,
                    status: w.status,
                    created_at: w.created_at,
                    network: w.network,
                    reason: null,
                  })),
                ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

                if (activities.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <Wallet className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No activity yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Add funds to get started</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activities.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-2.5">
                          {item.type === 'deposit' ? (
                            <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
                              <ArrowDownLeft className="h-4 w-4 text-success" />
                            </div>
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              item.status === 'approved' ? 'bg-success/15' :
                              item.status === 'pending' ? 'bg-warning/15' : 'bg-destructive/15'
                            }`}>
                              <ArrowUpRight className={`h-4 w-4 ${
                                item.status === 'approved' ? 'text-success' :
                                item.status === 'pending' ? 'text-warning' : 'text-destructive'
                              }`} />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {item.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.type === 'withdrawal' && item.network ? item.network.toUpperCase() : 'USDT'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            item.type === 'deposit' ? 'text-success' : 'text-foreground'
                          }`}>
                            {item.type === 'deposit' ? '+' : '-'}{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                          </p>
                          {item.type === 'withdrawal' && item.status === 'failed' && !hasOpenTicket ? (
                            <button
                              onClick={() => {
                                setSupportCategory('Withdrawal Problems');
                                setView('support');
                              }}
                              className="text-xs text-primary hover:underline mt-0.5"
                            >
                              Contact Support
                            </button>
                          ) : (
                            <p className={`text-xs ${
                              item.type === 'withdrawal' && item.status === 'pending' ? 'text-warning' :
                              item.type === 'withdrawal' && (item.status === 'failed' || item.status === 'expired') ? 'text-destructive' :
                              'text-muted-foreground'
                            }`}>
                              {item.type === 'withdrawal' && item.status === 'pending' ? 'Processing' :
                               item.type === 'withdrawal' && item.status === 'failed' ? 'Failed' :
                               item.type === 'withdrawal' && item.status === 'expired' ? 'Expired' :
                               new Date(item.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </>
        ) : view === 'withdraw' ? (
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
                Available: {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </p>
            </div>

            <div className="p-4 space-y-4">
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

              <Button 
                variant="glow" 
                className="w-full"
                disabled={!withdrawAmount || !walletAddress || isSubmitting}
                onClick={handleSubmitWithdrawal}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Withdrawal'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Support Ticket View */}
            <div className="p-5 border-b border-border/30">
              <button 
                onClick={() => setView('main')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back
              </button>
              <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Contact Support
              </h3>
              <p className="text-sm text-muted-foreground">
                Submit a ticket and we'll get back to you
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {supportCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSupportCategory(cat)}
                      className={`p-2.5 rounded-lg border text-center text-sm transition-all ${
                        supportCategory === cat
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border hover:border-border/80 text-muted-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-2">Message</label>
                <Textarea
                  placeholder="Describe your issue..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button 
                variant="glow" 
                className="w-full"
                disabled={!supportMessage.trim() || isSubmittingTicket}
                onClick={handleSubmitTicket}
              >
                {isSubmittingTicket ? 'Submitting...' : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};
