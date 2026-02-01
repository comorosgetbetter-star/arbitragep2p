import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTradeSession } from '@/hooks/useTradeSession';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const TradeSessionBadge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, getRemainingTime, clearSession } = useTradeSession();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update timer every second
  useEffect(() => {
    if (!session) return;

    const updateTime = () => {
      const remaining = getRemainingTime();
      setTimeRemaining(remaining);
      
      // Clear session if expired
      if (remaining <= 0) {
        clearSession();
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [session, getRemainingTime, clearSession]);

  // Reset dismissed state when session changes
  useEffect(() => {
    setIsDismissed(false);
  }, [session?.startedAt]);

  // Don't show if:
  // - No active session
  // - User is not logged in
  // - Already on payment page
  // - User dismissed it
  // - Session expired
  if (!session || !user || location.pathname === '/payment' || isDismissed || timeRemaining <= 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResume = () => {
    navigate('/payment');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-fade-in">
      <div className="glass-card rounded-xl p-3 shadow-lg border border-primary/20 max-w-[220px]">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium mb-0.5">Trade in Progress</p>
            <p className="text-[10px] text-muted-foreground mb-1">
              ${session.usd.toLocaleString()} → {session.usdt.toLocaleString()} USDT
            </p>
            
            <div className="flex items-center gap-1 mb-2">
              <span className={`text-[10px] font-mono ${timeRemaining <= 60 ? 'text-destructive' : 'text-primary'}`}>
                {formatTime(timeRemaining)} left
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="default"
                className="text-[10px] h-6 px-2"
                onClick={handleResume}
              >
                Resume
                <ArrowRight className="h-2.5 w-2.5 ml-1" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground"
                onClick={handleDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
