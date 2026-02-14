import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  created_at: string;
  usdt_balance: number;
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

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all profiles with balances and trade counts
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch balances
      const { data: balances } = await supabase
        .from('user_balances')
        .select('user_id, usdt_balance');

      // Fetch trade counts per user
      const { data: trades } = await supabase
        .from('trades')
        .select('user_id, status');

      // Combine data
      const membersData: Member[] = (profiles || []).map(profile => {
        const balance = balances?.find(b => b.user_id === profile.user_id);
        const userTrades = trades?.filter(t => t.user_id === profile.user_id && t.status === 'completed') || [];
        
        return {
          ...profile,
          usdt_balance: balance?.usdt_balance || 0,
          trade_count: userTrades.length,
        };
      });

      setMembers(membersData);
      
      // Calculate stats
      const completedTrades = trades?.filter(t => t.status === 'completed') || [];
      setStats({
        totalMembers: membersData.length,
        totalTrades: completedTrades.length,
        totalVolume: balances?.reduce((sum, b) => sum + Number(b.usdt_balance), 0) || 0,
      });

      // Fetch audit logs
      const { data: logs } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Enrich logs with user emails
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

  const openAdjustDialog = (member: Member, type: 'add' | 'subtract') => {
    setSelectedMember(member);
    setAdjustmentType(type);
    setAdjustmentAmount('');
    setAdjustmentReason('');
    setIsAdjustDialogOpen(true);
  };

  const handleAdjustBalance = async () => {
    if (!selectedMember || !adjustmentAmount || !adjustmentReason) {
      toast.error('Please fill all fields');
      return;
    }

    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsAdjusting(true);
    try {
      const adjustment = adjustmentType === 'add' ? amount : -amount;
      
      const { error } = await supabase.rpc('adjust_user_balance', {
        _target_user_id: selectedMember.user_id,
        _adjustment: adjustment,
        _reason: adjustmentReason,
      });

      if (error) throw error;

      toast.success(`Successfully ${adjustmentType === 'add' ? 'added' : 'subtracted'} ${amount} USDT`);
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
      // First deduct from user balance
      const { error: rpcError } = await supabase.rpc('adjust_user_balance', {
        _target_user_id: withdrawal.user_id,
        _adjustment: -withdrawal.amount,
        _reason: `Withdrawal approved: ${withdrawal.amount} USDT to ${withdrawal.wallet_address} (${withdrawal.network})`,
      });
      if (rpcError) throw rpcError;

      // Then mark withdrawal as approved
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

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      'ADMIN_LOGIN': 'bg-blue-500/20 text-blue-400',
      'ADMIN_LOGOUT': 'bg-gray-500/20 text-gray-400',
      'BALANCE_ADJUSTMENT': 'bg-amber-500/20 text-amber-400',
    };
    return colors[action] || 'bg-muted text-muted-foreground';
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Platform Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {pendingWithdrawals.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {pendingWithdrawals.length} Pending
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Members
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Trades
              </CardTitle>
              <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total USDT Holdings
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVolume.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="bg-card border border-border/50">
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2 relative">
              <ArrowUpRight className="w-4 h-4" />
              Withdrawals
              {pendingWithdrawals.length > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingWithdrawals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <History className="w-4 h-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Registered Members</CardTitle>
                    <CardDescription>
                      View and manage all platform users
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64 bg-background/50"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Member</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-center">Trades</TableHead>
                        <TableHead className="text-right">USDT Balance</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No members found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{member.full_name}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(member.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{member.country || '-'}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{member.trade_count}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {Number(member.usdt_balance).toFixed(2)} USDT
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-success hover:text-success hover:bg-success/10"
                                  onClick={() => openAdjustDialog(member, 'add')}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => openAdjustDialog(member, 'subtract')}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>
                  Approve or reject withdrawal requests. Pending requests auto-fail after 2 minutes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Network</TableHead>
                        <TableHead>Time Left</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No withdrawal requests
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawals.map((w) => (
                          <TableRow key={w.id} className={w.status === 'pending' ? 'bg-warning/5' : ''}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{w.user_name}</p>
                                <p className="text-xs text-muted-foreground">{w.user_email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              {w.amount} USDT
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-mono truncate max-w-[120px] block">
                                {w.wallet_address}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{w.network.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell>
                              {w.status === 'pending' ? (
                                <span className="text-warning text-sm font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {getTimeRemaining(w.expires_at)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                w.status === 'approved' ? 'bg-success/20 text-success' :
                                w.status === 'pending' ? 'bg-warning/20 text-warning' :
                                'bg-destructive/20 text-destructive'
                              }>
                                {w.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {w.status === 'pending' ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-success hover:text-success hover:bg-success/10"
                                    onClick={() => handleApproveWithdrawal(w)}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRejectWithdrawal(w)}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground text-center block">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  Track all administrative actions for security purposes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Target User</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No audit logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              {formatDate(log.created_at)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.admin_email}
                            </TableCell>
                            <TableCell>
                              <Badge className={getActionBadge(log.action)}>
                                {log.action.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.target_email || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                              {log.details ? JSON.stringify(log.details) : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Balance Adjustment Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjustmentType === 'add' ? (
                <Plus className="w-5 h-5 text-success" />
              ) : (
                <Minus className="w-5 h-5 text-destructive" />
              )}
              {adjustmentType === 'add' ? 'Add' : 'Subtract'} USDT Balance
            </DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <span>
                  Adjusting balance for <strong>{selectedMember.full_name}</strong>
                  <br />
                  Current balance: <strong>{Number(selectedMember.usdt_balance).toFixed(2)} USDT</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDT)</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (required)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this adjustment..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="bg-background/50"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
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
              {isAdjusting ? 'Processing...' : 'Confirm Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
