import { useState, useEffect } from 'react';
import { ArrowUpRight, History, Copy, Check, ChevronRight, Plus, Wallet, Clock, XCircle, CheckCircle2, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
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
  const [view, setView] = useState<'main' | 'withdraw' | 'support'>('main');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('trc20');
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportCategory, setSupportCategory] = useState('Withdrawal Problems');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchData = async () => {
      const [balanceRes, withdrawalsRes] = await Promise.all([
        supabase
          .from('user_balances')
          .select('usdt_balance')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('withdrawals')
          .select('id, amount, status, created_at, network')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (balanceRes.data) setBalance(Number(balanceRes.data.usdt_balance));
      if (withdrawalsRes.data) setWithdrawals(withdrawalsRes.data);
    };

    fetchData();

    const balanceChannel = supabase
      .channel('wallet-balance')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_balances',
        filter: `user_id=eq.${user.id}`,
      }, (payload: { new: { usdt_balance?: number } }) => {
        if (payload.new?.usdt_balance !== undefined) {
          setBalance(Number(payload.new.usdt_balance));
        }
      })
      .subscribe();

    const withdrawalChannel = supabase
      .channel('wallet-withdrawals')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'withdrawals',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        supabase
          .from('withdrawals')
          .select('id, amount, status, created_at, network')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
          .then(({ data }) => {
            if (data) setWithdrawals(data);
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(balanceChannel);
      supabase.removeChannel(withdrawalChannel);
    };
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
                  {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground">USDT</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
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

            {/* Recent Withdrawals */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Recent Withdrawals
                </span>
              </div>
              
              {withdrawals.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Wallet className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No withdrawals yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Add funds to get started</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {withdrawals.map((w) => (
                    <div 
                      key={w.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(w.status)}
                        <div>
                          <p className="text-sm font-medium">{w.amount} USDT</p>
                          <p className="text-xs text-muted-foreground">{w.network.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium capitalize ${
                          w.status === 'approved' ? 'text-success' : 
                          w.status === 'pending' ? 'text-warning' : 'text-destructive'
                        }`}>
                          {getStatusLabel(w.status)}
                        </p>
                        {w.status === 'failed' && (
                          <button
                            onClick={() => {
                              setSupportCategory('Withdrawal Problems');
                              setView('support');
                            }}
                            className="text-xs text-primary hover:underline mt-0.5"
                          >
                            Contact Support
                          </button>
                        )}
                        {w.status !== 'failed' && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(w.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                Available: {balance.toLocaleString()} USDT
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
