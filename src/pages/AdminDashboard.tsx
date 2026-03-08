import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { 
  Shield, 
  Users, 
  ArrowLeftRight, 
  DollarSign, 
  LogOut,
  Search,
  Plus,
  Minus,
  History,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Send,
  
  ShoppingBag,
  EyeOff,
  Coins
} from 'lucide-react';
// AdminAddressManager is now merged into AdminCryptoManager
import { AdminCryptoManager } from '@/components/AdminCryptoManager';
import { AdminP2POrderManager } from '@/components/AdminP2POrderManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CryptoHolding {
  symbol: string;
  amount: number;
}

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  created_at: string;
  usdt_balance: number;
  crypto_holdings: CryptoHolding[];
  total_usd_balance: number;
  trade_count: number;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  admin_email?: string;
  target_email?: string;
}

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  network: string;
  status: string;
  created_at: string;
  expires_at: string;
  user_email?: string;
  user_name?: string;
}

interface SupportTicket {
  id: string;
  user_id: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  last_message?: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentCrypto, setAdjustmentCrypto] = useState('USDT');
  const [isStealth, setIsStealth] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const { prices } = useCryptoPrices();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalTrades: 0,
    totalVolume: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Subscribe to withdrawal changes in realtime
  useEffect(() => {
    const channel = supabase
      .channel('admin-withdrawals')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'withdrawals',
      }, () => {
        fetchWithdrawals();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [members]);

  // Subscribe to ticket changes in realtime
  useEffect(() => {
    const channel = supabase
      .channel('admin-tickets')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets',
      }, () => {
        fetchTickets();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
      }, (payload) => {
        if (selectedTicket && (payload.new as TicketMessage).ticket_id === selectedTicket.id) {
          fetchTicketMessages(selectedTicket.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [members, selectedTicket]);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/admin');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      toast.error('Access denied');
      navigate('/admin');
      return;
    }

    fetchData();
  };

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const enriched = data.map(w => {
        const member = members.find(m => m.user_id === w.user_id);
        return {
          ...w,
          user_email: member?.email || 'Unknown',
          user_name: member?.full_name || 'Unknown',
        };
      });
      setWithdrawals(enriched);
    }
  };

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (data) {
      const ticketIds = data.map(t => t.id);
      const { data: messages } = await supabase
        .from('ticket_messages')
        .select('*')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: false });

      const enriched: SupportTicket[] = data.map(t => {
        const member = members.find(m => m.user_id === t.user_id);
        const lastMsg = messages?.find(m => m.ticket_id === t.id);
        return {
          ...t,
          user_email: member?.email || 'Unknown',
          user_name: member?.full_name || 'Unknown',
          last_message: lastMsg?.message || '',
        };
      });
      setTickets(enriched);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (data) setTicketMessages(data);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: balances } = await supabase
        .from('user_balances')
        .select('user_id, usdt_balance');

      const { data: trades } = await supabase
        .from('trades')
        .select('user_id, status');

      const { data: cryptoBalances } = await supabase
        .from('user_crypto_balances')
        .select('user_id, symbol, amount');

      const membersData: Member[] = (profiles || []).map(profile => {
        const balance = balances?.find(b => b.user_id === profile.user_id);
        const userTrades = trades?.filter(t => t.user_id === profile.user_id && t.status === 'completed') || [];
        const userCrypto = (cryptoBalances || [])
          .filter(cb => cb.user_id === profile.user_id)
          .map(cb => ({ symbol: cb.symbol, amount: Number(cb.amount) }));
        
        const usdtBal = Number(balance?.usdt_balance || 0);
        let totalUsd = usdtBal;
        userCrypto.forEach(h => {
          const p = prices.find(pr => pr.symbol === h.symbol);
          if (p) totalUsd += h.amount * p.price;
        });

        return {
          ...profile,
          usdt_balance: usdtBal,
          crypto_holdings: userCrypto,
          total_usd_balance: totalUsd,
          trade_count: userTrades.length,
        };
      });

      setMembers(membersData);
      
      const completedTrades = trades?.filter(t => t.status === 'completed') || [];
      setStats({
        totalMembers: membersData.length,
        totalTrades: completedTrades.length,
        totalVolume: membersData.reduce((sum, m) => sum + m.total_usd_balance, 0),
      });

      const { data: logs } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logs) {
        const enrichedLogs = logs.map((log) => {
          const adminProfile = profiles?.find(p => p.user_id === log.admin_id);
          const targetProfile = log.target_user_id 
            ? profiles?.find(p => p.user_id === log.target_user_id)
            : null;
          
          return {
            ...log,
            details: (log.details as Record<string, unknown>) || null,
            admin_email: adminProfile?.email || 'Unknown',
            target_email: targetProfile?.email || undefined,
          } as AuditLog;
        });
        setAuditLogs(enrichedLogs);
      }

      // Fetch withdrawals
      const { data: withdrawalData } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (withdrawalData) {
        const enrichedWithdrawals = withdrawalData.map(w => {
          const member = membersData.find(m => m.user_id === w.user_id);
          return {
            ...w,
            user_email: member?.email || 'Unknown',
            user_name: member?.full_name || 'Unknown',
          };
        });
        setWithdrawals(enrichedWithdrawals);
      }

      // Fetch tickets
      const { data: ticketData } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (ticketData) {
        const ticketIds = ticketData.map(t => t.id);
        const { data: ticketMsgs } = ticketIds.length > 0
          ? await supabase
              .from('ticket_messages')
              .select('*')
              .in('ticket_id', ticketIds)
              .order('created_at', { ascending: false })
          : { data: [] };

        const enrichedTickets: SupportTicket[] = ticketData.map(t => {
          const member = membersData.find(m => m.user_id === t.user_id);
          const lastMsg = ticketMsgs?.find(m => m.ticket_id === t.id);
          return {
            ...t,
            user_email: member?.email || 'Unknown',
            user_name: member?.full_name || 'Unknown',
            last_message: lastMsg?.message || '',
          };
        });
        setTickets(enrichedTickets);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      await supabase.from('admin_audit_logs').insert({
        admin_id: session.user.id,
        action: 'ADMIN_LOGOUT',
        details: { timestamp: new Date().toISOString() },
      });
    }

    await supabase.auth.signOut();
    navigate('/admin');
  };

  const openAdjustDialog = (member: Member, type: 'add' | 'subtract', stealth = false) => {
    setSelectedMember(member);
    setAdjustmentType(type);
    setIsStealth(stealth);
    setAdjustmentAmount('');
    setAdjustmentReason('');
    setAdjustmentCrypto('USDT');
    setIsAdjustDialogOpen(true);
  };

  const cryptoPrice = useMemo(() => {
    const p = prices.find(p => p.symbol === adjustmentCrypto);
    return p?.price || 1;
  }, [prices, adjustmentCrypto]);

  const convertedCryptoAmount = useMemo(() => {
    const usd = parseFloat(adjustmentAmount);
    if (isNaN(usd) || usd <= 0) return 0;
    return usd / cryptoPrice;
  }, [adjustmentAmount, cryptoPrice]);

  const handleAdjustBalance = async () => {
    if (!selectedMember || !adjustmentAmount || !adjustmentReason) {
      toast.error('Please fill all fields');
      return;
    }

    const usdAmount = parseFloat(adjustmentAmount);
    if (isNaN(usdAmount) || usdAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsAdjusting(true);
    try {
      if (adjustmentCrypto === 'USDT') {
        // Use existing USDT flow
        const adjustment = adjustmentType === 'add' ? usdAmount : -usdAmount;
        const rpcName = isStealth ? 'stealth_adjust_balance' : 'adjust_user_balance';
        const { error } = await supabase.rpc(rpcName as any, {
          _target_user_id: selectedMember.user_id,
          _adjustment: adjustment,
          _reason: adjustmentReason,
        });
        if (error) throw error;
      } else {
        // Convert USD to crypto amount and store
        const cryptoAmount = usdAmount / cryptoPrice;
        const adjustment = adjustmentType === 'add' ? cryptoAmount : -cryptoAmount;
        const { error } = await supabase.rpc('adjust_crypto_balance' as any, {
          _target_user_id: selectedMember.user_id,
          _symbol: adjustmentCrypto,
          _crypto_amount: adjustment,
          _reason: `${adjustmentReason} ($${usdAmount} USD at $${cryptoPrice.toFixed(2)}/${adjustmentCrypto})`,
        });
        if (error) throw error;
      }

      toast.success(`Successfully ${isStealth ? 'stealth ' : ''}${adjustmentType === 'add' ? 'added' : 'subtracted'} $${usdAmount} in ${adjustmentCrypto}`);
      setIsAdjustDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Balance adjustment error:', error);
      toast.error('Failed to adjust balance');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawal: WithdrawalRequest) => {
    try {
      const { error: rpcError } = await supabase.rpc('adjust_user_balance', {
        _target_user_id: withdrawal.user_id,
        _adjustment: -withdrawal.amount,
        _reason: `Withdrawal approved: ${withdrawal.amount} USDT to ${withdrawal.wallet_address} (${withdrawal.network})`,
      });
      if (rpcError) throw rpcError;

      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'approved', resolved_at: new Date().toISOString() })
        .eq('id', withdrawal.id);
      if (error) throw error;

      toast.success(`Approved withdrawal of ${withdrawal.amount} USDT`);
      fetchData();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (withdrawal: WithdrawalRequest) => {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'failed', resolved_at: new Date().toISOString() })
        .eq('id', withdrawal.id);
      if (error) throw error;

      toast.success('Withdrawal rejected');
      fetchData();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject withdrawal');
    }
  };

  const handleOpenTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    await fetchTicketMessages(ticket.id);
  };

  const handleReplyToTicket = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setIsSendingReply(true);
    try {
      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: session.user.id,
        message: replyMessage.trim(),
        is_admin: true,
      });

      if (error) throw error;

      setReplyMessage('');
      await fetchTicketMessages(selectedTicket.id);
    } catch (error) {
      console.error('Reply error:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast.success('Ticket closed');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error('Close ticket error:', error);
      toast.error('Failed to close ticket');
    }
  };

  const filteredMembers = members.filter(member =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const timeAgo = (dateStr: string) => {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      'ADMIN_LOGIN': 'bg-blue-500/20 text-blue-400',
      'ADMIN_LOGOUT': 'bg-gray-500/20 text-gray-400',
      'BALANCE_ADJUSTMENT': 'bg-amber-500/20 text-amber-400',
      'STEALTH_BALANCE_ADJUSTMENT': 'bg-purple-500/20 text-purple-400',
    };
    return colors[action] || 'bg-muted text-muted-foreground';
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const openTickets = tickets.filter(t => t.status === 'open');

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const seconds = Math.floor(diff / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-3 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm truncate">Admin Panel</h1>
              <p className="text-[10px] text-muted-foreground">Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {pendingWithdrawals.length > 0 && (
              <Badge variant="destructive" className="animate-pulse text-[10px] px-1.5 py-0.5">
                {pendingWithdrawals.length}
              </Badge>
            )}
            {openTickets.length > 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 animate-pulse">
                {openTickets.length}
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchData}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleLogout}>
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-3 py-4 space-y-4 max-w-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-3 text-center">
              <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <div className="text-lg font-bold">{stats.totalMembers}</div>
              <p className="text-[10px] text-muted-foreground">Members</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-3 text-center">
              <ArrowLeftRight className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <div className="text-lg font-bold">{stats.totalTrades}</div>
              <p className="text-[10px] text-muted-foreground">Trades</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-3 text-center">
              <DollarSign className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <div className="text-lg font-bold">{stats.totalVolume.toFixed(0)}</div>
              <p className="text-[10px] text-muted-foreground">USDT</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="members" className="space-y-3">
          <TabsList className="w-full grid grid-cols-6 h-auto p-1 bg-card border border-border/50">
            <TabsTrigger value="members" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <Users className="w-3.5 h-3.5" />
              Members
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-warning data-[state=active]:text-warning-foreground font-semibold relative">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Withdraw
              {pendingWithdrawals.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingWithdrawals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-success data-[state=active]:text-success-foreground font-semibold relative">
              <MessageSquare className="w-3.5 h-3.5" />
              Tickets
              {openTickets.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                  {openTickets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="p2p-orders" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <ShoppingBag className="w-3.5 h-3.5" />
              P2P
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-gold data-[state=active]:text-gold-foreground font-semibold">
              <Coins className="w-3.5 h-3.5" />
              Crypto
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold">
              <History className="w-3.5 h-3.5" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card border-border/50"
              />
            </div>
            <div className="space-y-2">
              {filteredMembers.length === 0 ? (
                <Card className="border-border/50 bg-card/80">
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No members found
                  </CardContent>
                </Card>
              ) : (
                filteredMembers.map((member) => (
                  <Card key={member.id} className="border-border/50 bg-card/80">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{member.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-sm font-bold">${member.total_usd_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <p className="text-[10px] text-muted-foreground">Total USD</p>
                          {member.crypto_holdings.length > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              {member.crypto_holdings.map(h => `${h.amount.toFixed(h.symbol === 'BTC' ? 6 : 4)} ${h.symbol}`).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{member.country || '—'}</span>
                          <span>•</span>
                          <span>{member.trade_count} trades</span>
                          <span>•</span>
                          <span title={formatDate(member.created_at)}>joined {timeAgo(member.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            className="h-7 px-2 bg-success hover:bg-success/90 text-success-foreground text-xs"
                            onClick={() => openAdjustDialog(member, 'add')}
                          >
                            <Plus className="w-3 h-3 mr-0.5" />
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-muted-foreground/30"
                            onClick={() => openAdjustDialog(member, 'add', true)}
                            title="Stealth add - not visible in wallet"
                          >
                            <EyeOff className="w-3 h-3 mr-0.5" />
                            Stealth
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={() => openAdjustDialog(member, 'subtract')}
                          >
                            <Minus className="w-3 h-3 mr-0.5" />
                            Sub
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-3">
            <CardDescription className="text-xs">
              Pending requests auto-fail after 2 minutes.
            </CardDescription>
            <div className="space-y-2">
              {withdrawals.length === 0 ? (
                <Card className="border-border/50 bg-card/80">
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No withdrawal requests
                  </CardContent>
                </Card>
              ) : (
                withdrawals.map((w) => (
                  <Card key={w.id} className={`border-border/50 ${w.status === 'pending' ? 'bg-warning/5 border-warning/30' : 'bg-card/80'}`}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{w.user_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{w.user_email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-sm font-bold">{w.amount} USDT</p>
                          <Badge variant="secondary" className="text-[10px]">{w.network.toUpperCase()}</Badge>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground break-all">
                        {w.wallet_address}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={
                            w.status === 'approved' ? 'bg-success text-success-foreground' :
                            w.status === 'pending' ? 'bg-warning text-warning-foreground' :
                            'bg-destructive text-destructive-foreground'
                          }>
                            {w.status}
                          </Badge>
                          {w.status === 'pending' && (
                            <span className="text-warning text-xs font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeRemaining(w.expires_at)}
                            </span>
                          )}
                        </div>
                        {w.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              className="h-7 px-2 bg-success hover:bg-success/90 text-success-foreground text-xs"
                              onClick={() => handleApproveWithdrawal(w)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-0.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleRejectWithdrawal(w)}
                            >
                              <XCircle className="w-3 h-3 mr-0.5" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-3">
            {selectedTicket ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => { setSelectedTicket(null); setTicketMessages([]); }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    ← Back
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      selectedTicket.status === 'open' ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground'
                    }>
                      {selectedTicket.status}
                    </Badge>
                    {selectedTicket.status === 'open' && (
                      <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={handleCloseTicket}>
                        Close
                      </Button>
                    )}
                  </div>
                </div>

                <Card className="border-border/50 bg-card/80">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{selectedTicket.user_name}</p>
                        <p className="text-xs text-muted-foreground">{selectedTicket.user_email}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{selectedTicket.category}</Badge>
                    </div>

                    <ScrollArea className="h-64 mb-3">
                      <div className="space-y-2 pr-2">
                        {ticketMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-2.5 rounded-lg text-sm ${
                              msg.is_admin
                                ? 'bg-primary/10 border border-primary/20 ml-4'
                                : 'bg-secondary/50 mr-4'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-medium">
                                {msg.is_admin ? 'Admin' : selectedTicket.user_name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDate(msg.created_at)}
                              </span>
                            </div>
                            <p className="text-xs">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {selectedTicket.status === 'open' && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type reply..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReplyToTicket()}
                          className="flex-1 text-sm"
                        />
                        <Button
                          size="icon"
                          className="h-9 w-9 bg-primary hover:bg-primary/90"
                          disabled={!replyMessage.trim() || isSendingReply}
                          onClick={handleReplyToTicket}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.length === 0 ? (
                  <Card className="border-border/50 bg-card/80">
                    <CardContent className="py-8 text-center text-muted-foreground text-sm">
                      No support tickets
                    </CardContent>
                  </Card>
                ) : (
                  tickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className={`border-border/50 cursor-pointer transition-colors ${
                        ticket.status === 'open' ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' : 'bg-card/80 hover:bg-card'
                      }`}
                      onClick={() => handleOpenTicket(ticket)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{ticket.user_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{ticket.user_email}</p>
                          </div>
                          <Badge className={
                            ticket.status === 'open' ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground'
                          }>
                            {ticket.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">{ticket.category}</Badge>
                            <span className="text-[10px] text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                        {ticket.last_message && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{ticket.last_message}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* P2P Orders Tab */}
          <TabsContent value="p2p-orders" className="space-y-3">
            <AdminP2POrderManager />
          </TabsContent>

          {/* Crypto Tab */}
          <TabsContent value="crypto" className="space-y-3">
            <AdminCryptoManager />
          </TabsContent>


          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-3">
            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <Card className="border-border/50 bg-card/80">
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No audit logs found
                  </CardContent>
                </Card>
              ) : (
                auditLogs.map((log) => (
                  <Card key={log.id} className="border-border/50 bg-card/80">
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <Badge className={getActionBadge(log.action) + ' text-[10px]'}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        By: {log.admin_email}
                        {log.target_email && <> → {log.target_email}</>}
                      </p>
                      {log.details && (
                        <p className="text-[10px] text-muted-foreground break-all">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Balance Adjustment Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isStealth ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : adjustmentType === 'add' ? (
                <Plus className="w-5 h-5 text-success" />
              ) : (
                <Minus className="w-5 h-5 text-destructive" />
              )}
              {isStealth ? 'Stealth Add' : adjustmentType === 'add' ? 'Add' : 'Subtract'} Funds
            </DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <span>
                  <strong>{selectedMember.full_name}</strong> — USDT Balance: <strong>{Number(selectedMember.usdt_balance).toFixed(2)}</strong>
                </span>
              )}
              {isStealth && (
                <span className="block text-xs text-muted-foreground mt-1 italic">
                  This adjustment will NOT appear as a deposit in the user's wallet history.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Crypto selector */}
            <div className="space-y-2">
              <Label>Cryptocurrency</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {['USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'XRP'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setAdjustmentCrypto(sym)}
                    className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                      adjustmentCrypto === sym
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/50 text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                className="bg-background/50"
              />
              {adjustmentCrypto !== 'USDT' && adjustmentAmount && convertedCryptoAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  ≈ {convertedCryptoAmount.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 })} {adjustmentCrypto}
                  <span className="ml-1 opacity-70">(@ ${cryptoPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Reason for adjustment..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="bg-background/50"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAdjustDialogOpen(false)}
              disabled={isAdjusting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustBalance}
              disabled={isAdjusting || !adjustmentAmount || !adjustmentReason}
              className={adjustmentType === 'add' ? 'bg-success hover:bg-success/90' : ''}
              variant={adjustmentType === 'subtract' ? 'destructive' : 'default'}
            >
              {isAdjusting ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
