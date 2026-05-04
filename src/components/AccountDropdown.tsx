import { useState, useEffect } from 'react';
import { User, LogOut, UserCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { clearTradeStorage, clearPendingTrade } from '@/lib/tradeSessionStorage';
import { useMemberAccess } from '@/hooks/useMemberAccess';

export const AccountDropdown = () => {
  const { user, signOut } = useAuth();
  const { loading: accountLoading, canUseMemberFeatures } = useMemberAccess();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (accountLoading) {
      return;
    }

    if (!user || !canUseMemberFeatures) {
      setUnreadCount(0);
      return;
    }
    const fetchUnread = async () => {
      // Get open tickets for user
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'open');

      if (!tickets || tickets.length === 0) { setUnreadCount(0); return; }

      // Count admin messages across all open tickets
      const ticketIds = tickets.map((t) => t.id);
      const { count } = await supabase
        .from('ticket_messages')
        .select('id', { count: 'exact', head: true })
        .in('ticket_id', ticketIds)
        .eq('is_admin', true);

      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel(`account-ticket-notify-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
      }, (payload) => {
        if ((payload.new as { is_admin: boolean }).is_admin) {
          setUnreadCount((c) => c + 1);
          toast.info('New support reply received', { description: 'Check your profile for details' });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, accountLoading, canUseMemberFeatures]);

  if (accountLoading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="flex items-center gap-2 opacity-70"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Checking session</span>
      </Button>
    );
  }

  const handleLogout = async () => {
    clearTradeStorage();
    clearPendingTrade();
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleProfile = () => {
    setUnreadCount(0);
    navigate('/profile');
  };

  if (!canUseMemberFeatures) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/login')}
        className="flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
          <UserCircle className="h-4 w-4 mr-2" />
          Profile
          {unreadCount > 0 && (
            <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
